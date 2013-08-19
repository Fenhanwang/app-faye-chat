'use strict';

/* Services */


// Demonstrate how to register services
// In this case it is a simple value service.
angular.module('myApp.services', []).
    service('Locations',[function() {
        return {
            DSPLocation: 'http://localhost:8080',
            FayeLocation: '//localhost:3334',
            DBServiceName: 'chatstore'
        }
    }]).
    factory('Faye', ['$faye', 'Locations', function ($faye, Locations) {
        return $faye(Locations.FayeLocation + '/faye');
    }]).
    service('Users',['$q', '$http', '$rootScope', 'Locations', function ($q, $http, $rootScope, Locations) {
        return {

            user: null,
            userChannel: null,

            login: function (creds) {

                var defer = $q.defer();

                DF.User.Session.login(JSON.stringify(creds),
                    function (data) {
                        $rootScope.$apply(defer.resolve(data));
                    },
                    function (err) {
                        $rootScope.$apply(defer.reject(err));
                    });

                return defer.promise;

            },

            logout: function () {

                var defer = $q.defer();

                DF.User.Session.logout(
                    function (data) {
                        this.user = null;
                        $rootScope.$apply(defer.resolve(data));
                    },
                    function (err) {
                        $rootScope.$apply(defer.reject(err));
                    });

                return defer.promise;
            },
            isLoggedInDSP: function () {

                var defer = $q.defer();

                DF.User.Session.isLoggedIn(
                    function (data) {
                        defer.resolve(true)
                    },
                    function (err) {
                        defer.reject(err);
                    });

                return defer.promise;
            },

            getAllUsers: function (thisUser) {

                var defer = $q.defer();

                $http({
                    method: 'GET',
                    headers: {
                        "X-DreamFactory-Application-Name": 'chat',
                        "X-DreamFactory-Session-Token": thisUser.session_id
                    },
                    url: Locations.DSPLocation + '/rest/' + Locations.DBServiceName + '/users?app_name=chat&filter=_id < "' + thisUser._id + '" || _id > "' + thisUser._id + '"'
                }).
                    success(function (data) {
                        defer.resolve(data);
                    }).
                    error(function (err) {
                        defer.reject(err);
                    });


                return defer.promise;
            }

        };
    }]).
    service('AppInfo', ['$q', '$http', 'Encoder', 'Locations', function ($q, $http, Encoder, Locations) {


        return {

            setOnline: function (thisUser) {


                thisUser.status = 'online';

                var defer = $q.defer();

                $http({
                    method: 'PUT',
                    headers: {
                        "X-DreamFactory-Application-Name": 'chat',
                        "X-DreamFactory-Session-Token": thisUser.session_id
                    },
                    data: thisUser,
                    url: Locations.DSPLocation + '/rest/' + Locations.DBServiceName + '/users/' + thisUser._id + '/?app_name=chat'
                }).
                    success(function (data) {
                        defer.resolve(data);
                    }).
                    error(function (err) {
                        defer.reject(err);
                    });

                return defer.promise;

            },

            setOffline: function (thisUser) {

                thisUser.status = 'offline';

                var defer = $q.defer();

                $http({
                    method: 'PUT',
                    headers: {
                        "X-DreamFactory-Application-Name": 'chat',
                        "X-DreamFactory-Session-Token": thisUser.session_id
                    },
                    data: thisUser,
                    url: Locations.DSPLocation + '/rest/' + Locations.DBServiceName + '/users/' + thisUser._id + '/?app_name=chat'
                }).
                    success(function (data) {
                        defer.resolve(true);
                    }).
                    error(function (err) {
                        defer.reject(err);
                    });

                return defer.promise;
            },

            isRegisteredUser: function(thisUser) {

                thisUser._id = thisUser.id;

                var defer = $q.defer();

                $http({
                    method: 'GET',
                    headers: {
                        "X-DreamFactory-Application-Name": 'chat',
                        "X-DreamFactory-Session-Token": thisUser.session_id

                    },
                    url: Locations.DSPLocation + '/rest/' + Locations.DBServiceName + '/users/' + thisUser._id + '/?app_name=chat'
                }).
                    success(function(data) {
                        defer.resolve(data);
                    }).
                    error(function(err) {
                        defer.reject(err);
                    });

                return defer.promise;
            },

            registerUser: function(params) {

                params = params || {};

                params._id = params.id;
                params.status = 'offline';
                params.publicChannel = Encoder.encode64(params.email);


                var self = this,
                    defer = $q.defer();

                $http({
                    method: 'POST',
                    headers: {
                        'X-DreamFactory-Application-Name': 'chat',
                        'X-DreamFactory-Session-Token': params.session_id
                    },
                    data: params,
                    url: Locations.DSPLocation + '/rest/' + Locations.DBServiceName + '/users/?app_name=chat'
                }).
                    success(function(data) {
                        defer.resolve(data);
                    }).
                    error(function(err) {
                        defer.reject(err);
                    });

                return defer.promise;
            }

        }
    }]).
    service('SessionManager', ['$q', '$http', 'Locations', function($q, $http, Locations) {
        return {

            _createGuestSession: function(thisUser, activeUser, session) {

                var defer = $q.defer();

                session._id = thisUser._id;

                $http({
                    method: 'POST',
                    headers: {
                        "X-DreamFactory-Application-Name": 'chat',
                        "X-DreamFactory-Session-Token": thisUser.session_id
                    },
                    data: session,
                    url: Locations.DSPLocation + '/rest/' + Locations.DBServiceName + '/' + activeUser.publicChannel + '/?app_name=chat'
                }).
                    success(function(data) {
                        defer.resolve(data);
                    }).
                    error(function(err) {
                        defer.resolve(err);
                    });

                return defer.promise;
            },

            _createHostSession: function(thisUser, activeUser, session) {

                 var defer = $q.defer();

                session._id = activeUser._id;


                 $http({
                    method: 'POST',
                    headers: {
                        "X-DreamFactory-Application-Name": 'chat',
                        "X-DreamFactory-Session-Token": thisUser.session_id
                    },
                    data: session,
                    url: Locations.DSPLocation + '/rest/' + Locations.DBServiceName + '/' + thisUser.publicChannel + '/?app_name=chat'
                 }).
                 success(function(data) {
                    defer.resolve(data);
                 }).
                 error(function(err) {
                    defer.resolve(err);
                 });

                 return defer.promise;

            },

            createSession: function(thisUser, activeUser, session) {

                var self = this,
                    defer = $q.defer();

                self._createGuestSession(thisUser, activeUser, session).then(function() {
                        self._createHostSession(thisUser, activeUser, session).then(function() {
                            defer.resolve(true);
                        },
                        function(reject) {
                            //handle error
                            defer.reject(false)
                        });

                },
                function(reject) {
                    //handle error
                    defer.reject(false);
                });

                return defer.promise;
            },

            _deleteHostSession: function(thisUser, activeUser) {

                var defer = $q.defer();

                $http({
                    method: 'DELETE',
                    headers: {
                        "X-DreamFactory-Application-Name": 'chat',
                        "X-DreamFactory-Session-Token": thisUser.session_id
                    },
                    url: Locations.DSPLocation + '/rest/' + Locations.DBServiceName + '/' + activeUser.publicChannel + '/' + thisUser._id + '?app_name=chat'
                }).
                    success(function(data) {
                        defer.resolve(data);
                    }).
                    error(function(err) {
                        defer.reject(err);
                    });

                return defer.promise;

            },

            _deleteGuestSession: function(thisUser, activeUser) {

                var defer = $q.defer();

                $http({
                    method: 'DELETE',
                    headers: {
                        "X-DreamFactory-Application-Name": 'chat',
                        "X-DreamFactory-Session-Token": thisUser.session_id
                    },
                    url: Locations.DSPLocation + '/rest/' + Locations.DBServiceName + '/' + thisUser.publicChannel + '/' + activeUser._id + '?app_name=chat'
                }).
                    success(function(data) {
                        defer.resolve(data);
                    }).
                    error(function(err) {
                        defer.reject(err);
                    });

                return defer.promise;

            },

            deleteSession: function(thisUser, activeUser) {

                var self = this,
                    defer = $q.defer();

                self._deleteHostSession(thisUser, activeUser).then(function(result) {
                    if (result) {
                        self._deleteGuestSession(thisUser, activeUser).then(function(result) {
                            defer.resolve(result);
                        });
                    }
                    else {
                        defer.reject('Could not delete host session');
                    }
                });

                return defer.promise;
            },

            hasSession: function(thisUser, activeUser) {

                var defer = $q.defer();

                $http({
                    method: 'GET',
                    headers: {
                        "X-DreamFactory-Application-Name": 'chat',
                        "X-DreamFactory-Session-Token": thisUser.session_id
                    },
                    url: Locations.DSPLocation + '/rest/' + Locations.DBServiceName + '/' + thisUser.publicChannel + '/' + activeUser._id + '/?app_name=chat'
                }).
                    success(function(data) {
                        defer.resolve(data);
                    }).
                    error(function(err) {
                        defer.reject(err)
                    });

                return defer.promise;

            },

            setSessionActive: function(thisUser, activeUser, session) {

                var self = this,
                    defer = $q.defer();

                self._setHostSessionActive(thisUser, activeUser, session).then(function () {
                    self._setGuestSessionActive(thisUser, activeUser, session).then(function () {

                            defer.resolve(true);

                    },
                    function (reject) {
                        // handle error
                        defer.reject(false)
                    });

                },
                function(reject) {
                    // handle error
                    defer.reject(false);
                });

                return defer.promise;
            },

            _setGuestSessionActive: function(thisUser, activeUser, session) {

                var defer = $q.defer();

                session.active = true;

                $http({
                    method: 'PUT',
                    headers: {
                        "X-DreamFactory-Application-Name": 'chat',
                        "X-DreamFactory-Session-Token": thisUser.session_id
                    },
                    data: session,
                    url: Locations.DSPLocation + '/rest/' + Locations.DBServiceName + '/' + thisUser.publicChannel + '/' + activeUser._id + '?app_name=chat'
                }).
                    success(function(data) {
                        defer.resolve(true);
                    }).
                    error(function(err) {
                        defer.reject(false);
                    });

                return defer.promise;

            },

            _setHostSessionActive: function(thisUser, activeUser, session) {

                var defer = $q.defer();

                session.active = true;

                $http({
                    method: 'PUT',
                    headers: {
                        "X-DreamFactory-Application-Name": 'chat',
                        "X-DreamFactory-Session-Token": thisUser.session_id
                    },
                    data: session,
                    url: Locations.DSPLocation + '/rest/' + Locations.DBServiceName + '/' + activeUser.publicChannel + '/' + thisUser._id + '?app_name=chat'
                }).
                    success(function(data) {
                        defer.resolve(true);
                    }).
                    error(function(err) {
                        defer.reject(false);
                    });

                return defer.promise;
            },

            getSessions: function(thisUser) {

                var defer = $q.defer();

                $http({
                    method: 'GET',
                    headers: {
                        "X-DreamFactory-Application-Name": 'chat',
                        "X-DreamFactory-Session-Token": thisUser.session_id
                    },
                    url: Locations.DSPLocation + '/rest/' + Locations.DBServiceName + '/' + thisUser.publicChannel + '/?app_name=chat'
                }).
                    success(function(data) {

                        var lsm = {};

                        angular.forEach(data, function(value, key) {
                            angular.forEach(value, function(obj) {
                                lsm[obj._id] = obj;
                            });
                        });
                        defer.resolve(lsm);
                    }).
                    error(function(err) {
                        defer.resolve(false);
                    });

                return defer.promise;
            },

            getSessionChannel: function(thisUser, activeUser) {

                var defer = $q.defer();

                $http({
                    method: 'GET',
                    headers: {
                        "X-DreamFactory-Application-Name": 'chat',
                        "X-DreamFactory-Session-Token": thisUser.session_id
                    },
                    url: Locations.DSPLocation + '/rest/' + Locations.DBServiceName + '/' + thisUser.publicChannel + '/' + activeUser._id + '/?app_name=chat&fields=channel'
                }).
                    success(function(data) {
                        defer.resolve(data.channel);
                    }).
                    error(function(err) {
                        defer.reject(err);
                    });

                return defer.promise;
            },

            updateLastSender: function(thisUser, activeUser) {

                var self = this,
                    defer = $q.defer();

                self._updateHostLastSender(thisUser, activeUser).then(function () {

                    self._updateGuestLastSender(thisUser, activeUser).then(function () {
                        defer.resolve(true);
                    },
                    function (reject) {
                        defer.reject(false);
                    });

                },
                function(reject) {
                    defer.reject(false)
                });

                return defer.promise;
            },

            _updateHostLastSender: function(thisUser, activeUser) {

                var defer = $q.defer();

                $http({
                    method: 'PATCH',
                    headers: {
                        "X-DreamFactory-Application-Name": 'chat',
                        "X-DreamFactory-Session-Token": thisUser.session_id
                    },
                    data: {lastmessage: thisUser._id},
                    url: Locations.DSPLocation + '/rest/' + Locations.DBServiceName + '/' + thisUser.publicChannel + '/' + activeUser._id + '/?app_name=chat'
                }).
                    success(function(data) {
                        defer.resolve(data);
                    }).
                    error(function(err) {
                        defer.reject(err);
                    });

                return defer.promise;
            },

            _updateGuestLastSender: function(thisUser, activeUser) {

                var defer = $q.defer();

                $http({
                    method: 'PATCH',
                    headers: {
                        "X-DreamFactory-Application-Name": 'chat',
                        "X-DreamFactory-Session-Token": thisUser.session_id
                    },
                    data: {lastmessage: thisUser._id},
                    url: Locations.DSPLocation + '/rest/' + Locations.DBServiceName + '/' + activeUser.publicChannel + '/' + thisUser._id + '/?app_name=chat'
                }).
                    success(function(data) {
                        defer.resolve(data);
                    }).
                    error(function(err) {
                        defer.reject(err);
                    });

                return defer.promise;
            }
        }
    }]).
    service('Encoder', [function () {
        return {
            keyStr: "ABCDEFGHIJKLMNOP" +
                "QRSTUVWXYZabcdef" +
                "ghijklmnopqrstuv" +
                "wxyz0123456789",

            encode64: function (input) {
                var output = "";
                var chr1, chr2, chr3 = "";
                var enc1, enc2, enc3, enc4 = "";
                var i = 0;

                do {
                    chr1 = input.charCodeAt(i++);
                    chr2 = input.charCodeAt(i++);
                    chr3 = input.charCodeAt(i++);

                    enc1 = chr1 >> 2;
                    enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
                    enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
                    enc4 = chr3 & 63;

                    if (isNaN(chr2)) {
                        enc3 = enc4 = 64;
                    } else if (isNaN(chr3)) {
                        enc4 = 64;
                    }

                    output = output +
                        this.keyStr.charAt(enc1) +
                        this.keyStr.charAt(enc2) +
                        this.keyStr.charAt(enc3) +
                        this.keyStr.charAt(enc4);
                    chr1 = chr2 = chr3 = "";
                    enc1 = enc2 = enc3 = enc4 = "";
                } while (i < input.length);

                return output;
            },

            decode64: function (input) {
                var output = "";
                var chr1, chr2, chr3 = "";
                var enc1, enc2, enc3, enc4 = "";
                var i = 0;

                // remove all characters that are not A-Z, a-z, 0-9, +, /, or =
                var base64test = /[^A-Za-z0-9\+\/\=]/g;
                if (base64test.exec(input)) {
                    alert("There were invalid base64 characters in the input text.\n" +
                        "Valid base64 characters are A-Z, a-z, 0-9, '+', '/',and '='\n" +
                        "Expect errors in decoding.");
                }
                input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

                do {
                    enc1 = this.keyStr.indexOf(input.charAt(i++));
                    enc2 = this.keyStr.indexOf(input.charAt(i++));
                    enc3 = this.keyStr.indexOf(input.charAt(i++));
                    enc4 = this.keyStr.indexOf(input.charAt(i++));

                    chr1 = (enc1 << 2) | (enc2 >> 4);
                    chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
                    chr3 = ((enc3 & 3) << 6) | enc4;

                    output = output + String.fromCharCode(chr1);

                    if (enc3 != 64) {
                        output = output + String.fromCharCode(chr2);
                    }
                    if (enc4 != 64) {
                        output = output + String.fromCharCode(chr3);
                    }

                    chr1 = chr2 = chr3 = "";
                    enc1 = enc2 = enc3 = enc4 = "";

                } while (i < input.length);

                return output;
            }
        }


    }]).
    service('SecureChannel', ['$q', '$http', 'Encoder','Locations', function ($q, $http, Encoder, Locations) {

        return {
            getAppChannel: function (creds) {

                var defer = $q.defer(),
                    appkey = 'chat';

                $http.jsonp(Locations.FayeLocation + '/getAppChannel?callback=JSON_CALLBACK&dsplocation=' + Locations.DSPLocation + '&appkey=' + appkey + '&email=' + creds.email + '&password=' + creds.password).
                    success(function (data) {
                        defer.resolve(data);
                    }).
                    error(function (err) {
                        defer.reject(err);
                    });

                return defer.promise;

            },

            hasSecureChannel: function(thisUser, activeUser) {

                var defer = $q.defer();

                $http({
                    method: 'GET',
                    headers: {
                        "X-DreamFactory-Application-Name": 'chat',
                        "X-DreamFactory-Session-Token": thisUser.session_id
                    },
                    url: Locations.DSPLocation + '/rest/' + Locations.DBServiceName + '/' + thisUser.publicChannel + '/' + activeUser._id + '/?app_name=chat&fields=channel'
                }).
                    success(function(data) {
                        defer.resolve(data);
                    }).
                    error(function(err) {
                        defer.reject(err);
                    });

                return defer.promise;

            },

            createSecureChannel: function(thisUser, activeUser, session) {
                return Encoder.encode64(session.host.email + session.guest.email);
            }
        }
    }]).
    service('MessageManager', ['$q', '$http', 'Locations', function($q, $http, Locations) {
        return {
            getChannelMessages: function(thisUser, channel) {

                var defer = $q.defer();

                $http({
                    method: 'GET',
                    headers: {
                        "X-DreamFactory-Application-Name": 'chat',
                        "X-DreamFactory-Session-Token": thisUser.session_id
                    },
                    url: Locations.DSPLocation + '/rest/' + Locations.DBServiceName + '/' + channel + '/?app_name=chat'
                }).
                    success(function(data) {
                        defer.resolve(data);
                    }).
                    error(function(err) {
                        defer.reject(err);
                    });

                return defer.promise;
            },

            storeChannelMessage: function(thisUser, channel, message) {
                var defer = $q.defer(),
                    self = this;

                $http({
                    method: 'POST',
                    headers: {
                        "X-DreamFactory-Application-Name": 'chat',
                        "X-DreamFactory-Session-Token": thisUser.session_id
                    },
                    data: message,
                    url: Locations.DSPLocation + '/rest/' + Locations.DBServiceName + '/' + channel + '/?app_name=chat'
                }).
                    success(function(data) {
                        defer.resolve(data);
                    }).
                    error(function(err) {
                        defer.reject(err);
                    });

                return defer.promise;
            }
        }
    }]);
