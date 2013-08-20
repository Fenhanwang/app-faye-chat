'use strict';

/* Controllers */

angular.module('myApp.controllers', []).
    controller('LoginCtrl', [
        '$scope',
        'Users',
        'AppInfo',
        '$location',
        function ($scope, Users, AppInfo, $location) {

            $scope.creds = {};
            $scope.error = null;

            $scope.login = function (creds) {
                Users.login(creds).then(function (resulta) {
                        Users.creds = creds;

                        AppInfo.isRegisteredUser(resulta).then(function (resultb) {

                            resultb.session_id = resulta.session_id;

                            AppInfo.setOnline(resultb).then(function () {
                                    Users.user = resultb;
                                    $location.path('/chat');
                                },
                                function (reject) {
                                    // handle error
                                    $scope.error = reject.error[0].message;

                                });
                        }, function (reject) {
                            AppInfo.registerUser(resulta).then(function (resultc) {
                                    AppInfo.setOnline(resultc).then(function () {
                                        Users.user = resultc;
                                        Users.user.new = true;
                                        $location.path('/chat');
                                    });
                                },
                                function (reject) {
                                    // handle error
                                    $scope.error = reject.error[0].message;
                                });
                        });
                    },
                    function (reject) {


                            $scope.error = reject[0].responseJSON.error[0].message;

                    });
            };


        }]).
    controller('ChatCtrl', [
        '$scope',
        '$rootScope',
        '$location',
        'fetchAllUsers',
        'fetchSessions',
        'fetchAppChannel',
        'fetchMessages',
        'AppInfo',
        'Faye',
        'Users',
        'Encoder',
        'SessionManager',
        'SecureChannel',
        'MessageManager',
        function ($scope, $rootScope, $location, fetchAllUsers, fetchSessions, fetchAppChannel, fetchMessages, AppInfo, Faye, Users, Encoder, SessionManager, SecureChannel, MessageManager) {

            $scope.thisUser = Users.user;
            $scope.appChannel = fetchAppChannel;

            $scope.users = fetchAllUsers;

            $scope.activeUser = null;

            $scope.localSessionManager = fetchSessions;

            $scope.localMessageManager = fetchMessages;

            $scope.subscriptions = {};


            // Public Methods
            $scope.init = function () {

                $scope._subscribeToChannel($scope._getMe().publicChannel);

                angular.forEach($scope.users, function (value, key) {
                    angular.forEach(value, function (v, k) {
                        $scope._subscribeToChannel(v.publicChannel);
                    });
                });

                angular.forEach($scope.localMessageManager, function (v, k) {
                    $scope._subscribeToChannel(k);
                });

                if ($scope.thisUser.new) {
                    $scope.$broadcast('newUserOnline');
                }

                $scope.$broadcast('userOnline');
            };

            $scope.selectUser = function (user) {
                $scope.$broadcast('selectUser', user);
            };

            $scope.sendInvite = function (user) {
                $scope.$broadcast('sendInvite', user);
            };

            $scope.acceptInvite = function (user) {
                $scope.$broadcast('acceptInvite', user);
            };

            $scope.declineInvite = function (user) {
                $scope.$broadcast('declineInvite', user);
            };

            $scope.sendMessage = function (text) {
                $scope.$broadcast('sendMessage', text);
            };

            $scope.logout = function () {
                $scope.$broadcast('logout');
            };


            // Private Methods

            $scope._subscribe = function (channel, callback) {
                return Faye.subscribe('/' + $scope.appChannel + '/' + channel, callback);
            };

            $scope._publish = function (channel, message) {
                Faye.publish('/' + $scope.appChannel + '/' + channel, message);
            };

            $scope._subscribeToChannel = function (channel) {
                $scope.subscriptions[channel] = $scope._subscribe(channel, function (message) {
                    $scope._handleChannels(message);
                });
            };


            // User handling

            $scope._getMe = function () {
                return $scope.thisUser;
            };

            $scope._getActiveUser = function () {
                return $scope.activeUser;
            };

            $scope._setActiveUser = function (user) {
                $scope.activeUser = user;
            };

            $scope._updateUsers = function () {
                Users.getAllUsers($scope._getMe()).then(function (result) {
                        $scope.users = result;
                    },
                    function (reject) {
                        // handle error
                    });
            };

            $scope._logout = function () {
                Users.logout().then(function (result) {
                    if (result.success) {

                        angular.forEach($scope.subscriptions, function (v, k) {
                            v.cancel();
                        });

                        AppInfo.setOffline($scope._getMe()).then(function () {
                                $scope.$broadcast('userOffline');
                            },
                            function (reject) {
                                // handle error
                            });

                        $location.path('/');
                    }
                });
            };

            $scope._broadcastNewUserOnline = function() {
                angular.forEach($scope.users.record, function(v, k) {
                    $scope._newUserOnline(v);
                });
            };


            // Channel Handlers

            $scope._handleChannels = function (message) {

                // If thisUser sent the message ignore it
                if (message.user._id === $scope._getMe()._id) {
                    return false;
                }
                else {

                    switch ($scope._getMessageType(message)) {
                        case 'newUser':
                            $scope._handleNewUser(message);
                            break;
                        case 'invite':
                            $scope._handleInvite(message);
                            break;
                        case 'accept':
                            $scope._handleAccept(message);
                            break;
                        case 'decline':
                            $scope._handleDecline(message);
                            break;
                        case 'online':
                            $scope._handleOnline(message);
                            break;
                        case 'offline':
                            $scope._handleOffline(message);
                            break;
                        case 'away':
                            $scope._handleAway(message);
                            break;
                        case 'text':
                            $scope._handleTextMessage(message);
                            break;
                        case 'data':
                            //console.log('this message contains a file');
                            break;
                        case 'receipt':
                            //console.log('message receipt received');
                            break;
                        default:
                            //console.log('default case');
                            break
                    }
                }
            };

            $scope._getMessageType = function (message) {
                return message.ext.type
            };


            $scope._createSecureChannel = function (user, session) {
                return SecureChannel.createSecureChannel($scope._getMe(), user, session);
            };


            // Incoming Message Handling

            $scope._handleNewUser = function(message) {
                $scope._subscribeToChannel(message.user.publicChannel);
                $scope._updateUsers();
                $scope.$apply();
            };

            $scope._handleInvite = function (message) {
                // Do other stuff
                $scope._updateLocalSessionManager();
                $scope.$apply();
            };

            $scope._handleAccept = function (message) {
                // Do other stuff
                $scope._updateLocalSessionManager(function () {
                    $scope._subscribeToChannel($scope.localSessionManager[message.user._id].channel);
                });
                $scope.$apply();
            };

            $scope._handleDecline = function (message) {
                // Do other stuff
                $scope._updateLocalSessionManager();
                $scope.$apply();
            };

            $scope._handleOnline = function (message) {
                // Do stuff
                $scope._updateUsers();
                $scope.$apply();
            };

            $scope._handleOffline = function (message) {
                // Do stuff
                $scope._updateUsers();
                $scope.$apply();
            };

            $scope._handleAway = function (message) {
                // Do stuff
                $scope._updateUsers();
                $scope.$apply();
            };

            $scope._handleTextMessage = function (message) {
                // Do stuff

                $scope._updateLocalSessionManager();
                $scope._updateLocalMessageManager(message.channel);
                $scope.$apply();
            };


            // Session Handling

            $scope._setSession = function (user) {
                var session = {
                    host: $scope._getMe(),
                    guest: user,
                    active: false,
                    channel: null,
                    lastmessage: null
                };

                SessionManager.createSession($scope._getMe(), user, session).then(function (result) {
                        $scope.$broadcast('sessionSet', user);
                    },
                    function (reject) {
                        // handle error
                    });
            };

            $scope._setSessionActive = function (user, session) {
                SessionManager.setSessionActive($scope._getMe(), user, session).then(function (result) {

                        $scope.$broadcast('sessionActive', session);

                    },
                    function (reject) {
                        // handle error
                    });
            };

            $scope._updateSessionLastSender = function (user) {
                SessionManager.updateLastSender($scope._getMe(), user);
            };

            $scope._updateLocalSessionManager = function (callback) {
                SessionManager.getSessions($scope._getMe()).then(function (result) {
                        $scope.localSessionManager = result;
                        if (typeof callback == 'function') {
                            callback();
                        }
                    },
                    function (reject) {
                        // handle error
                    });
            };

            $scope.hasLocalSession = function (user) {
                if ($scope.localSessionManager[user._id]) {
                    return true;
                }
                else {
                    return false;
                }
            };

            $scope._deleteSession = function (user) {
                SessionManager.deleteSession($scope._getMe(), user).then(function (result) {
                        $scope.$broadcast('deleteSession', user);
                    },
                    function (reject) {
                        // handle error
                    });
            };


            // Outgoing Message Handling

            $scope._newUserOnline = function(user) {
                var message = {
                    user: $scope._getMe(),
                    content: {
                        message: 'New User Online'
                    },
                    ext: {
                        type: 'newUser'
                    }
                };
                $scope._publish(user.publicChannel, message);
            };


            $scope._inviteToChannel = function (user) {
                var message = {
                    user: $scope._getMe(),
                    content: {
                        message: 'Lets chat'
                    },
                    ext: {
                        type: 'invite'
                    }
                };

                $scope._publish(user.publicChannel, message);
            };

            $scope._acceptChannelInvite = function (user) {
                var message = {
                    user: $scope._getMe(),
                    content: {
                        message: 'Sounds good'
                    },
                    ext: {
                        type: 'accept'
                    }
                };
                $scope._publish(user.publicChannel, message);
            };

            $scope._declineChannelInvite = function (user) {
                var message = {
                    user: $scope._getMe(),
                    content: {
                        message: 'That\'s my purse!  I don\'t know you!'
                    },
                    ext: {
                        type: 'decline'
                    }
                };
                $scope._publish(user.publicChannel, message);
            };

            $scope._sendStatus = function (user, status) {
                var message = {
                    user: $scope._getMe(),
                    content: {
                        message: user.display_name + ' is ' + status + '.'
                    },
                    ext: {
                        type: status
                    }
                };

                $scope._publish(user.publicChannel, message);
            };

            $scope._sendMessageUpdate = function (channel) {
                var message = {
                    user: $scope._getMe(),
                    content: {
                        text: "New message from " + $scope._getMe().display_name
                    },
                    channel: channel,

                    ext: {
                        type: 'text'
                    }
                };
                $scope._publish(channel, message);
            };

            $scope._makeMessage = function (text) {
                if ($scope._hasText(text)) {
                    var message = {
                        user: $scope._getMe(),
                        content: {
                            text: text
                        },

                        ext: {
                            type: 'text'
                        }
                    };
                    return message;
                }
                else {
                    alert('you forgot to type a message');
                    return false;
                }
            };

            $scope._storeChannelMessage = function (message) {
                message = $scope._makeMessage(message);
                SessionManager.getSessionChannel($scope._getMe(), $scope._getActiveUser()).then(function (channel) {
                    MessageManager.storeChannelMessage($scope._getMe(), channel, message).then(function (result) {

                            $scope.$broadcast('messageStored', channel);

                        },
                        function (reject) {
                            // handle error
                        });
                });
            };

            $scope._updateLocalMessageManager = function (channel) {
                MessageManager.getChannelMessages($scope._getMe(), channel).then(function (messages) {
                        $scope.localMessageManager[channel] = messages.record;
                    },
                    function (reject) {
                        // handle error
                    });
            };


            // Helpers

            $scope._hasText = function (text) {
                if (!text) {
                    //console.log('no message');
                    return false;
                }
                else {
                    return true;
                }
            };

            $scope._hasData = function (data) {
                if (!data) {
                    //console.log('no data');
                    return false;
                }
                else {
                    return true;
                }
            };

            $scope._escapeHTML = function (text) {
                return text;
            };

            $scope.makeExcerpt = function (user, message) {

            };

            $scope.getLastMessage = function (userid) {


                return $scope.localMessageManager[$scope.localSessionManager[userid].channel].length - 1

            };

            $scope._hasMessages = function (user) {

                if ($scope.localMessageManager[$scope.localSessionManager[user._id].channel]) {
                    return true;
                }
                else {
                    return false
                }
            };


            // UI Functions

            $scope._cleanMessageForm = function () {
                $scope.newMessage = '';
            };


            $scope._addMessageNotification = function () {
                console.log('messageNotification added');
            };


            // Handle Events
            // ------------------------------------
            $scope.$on('selectUser', function (e, d) {
                $scope._setActiveUser(d);
            });

            $scope.$on('sendInvite', function (e, d) {

                // Check if this user has already been invited
                SessionManager.hasSession($scope._getMe(), d).then(function (result) {


                        alert(d.display_name + ' has already been invited');

                    },
                    function (reject) {
                        // handle error
                        $scope._setSession(d);
                    });
            });

            $scope.$on('acceptInvite', function (e, d) {
                SessionManager.hasSession($scope._getMe(), d).then(function (session) {

                        session.channel = $scope._createSecureChannel(d, session);
                        $scope._setSessionActive(d, session);

                    },
                    function (reject) {
                        // handle error

                    });
            });

            $scope.$on('declineInvite', function (e, d) {
                SessionManager.hasSession($scope._getMe(), d).then(function (session) {

                        $scope._deleteSession(d);
                    },
                    function (reject) {
                        // handle error

                    });
            });

            $scope.$on('sessionSet', function (e, d) {
                // publish to the guest users public channel with invite message
                $scope._inviteToChannel(d);
                $scope._updateLocalSessionManager();
            });

            $scope.$on('sessionActive', function (e, d) {
                // publish to the hosts user channel with accept message
                $scope._acceptChannelInvite(d.host);
                $scope._subscribeToChannel(d.channel);
                $scope._updateLocalSessionManager();
            });


            $scope.$on('deleteSession', function (e, d) {
                // publish to the hosts user channel with decline message
                $scope._declineChannelInvite(d);
                $scope._updateLocalSessionManager();
            });

            $scope.$on('sendMessage', function (e, d) {
                $scope._storeChannelMessage(d);
                $scope._updateSessionLastSender($scope._getActiveUser());
                $scope._cleanMessageForm();
            });

            $scope.$on('messageStored', function (e, d) {
                $scope._sendMessageUpdate(d);
                $scope._updateLocalSessionManager();
                $scope._updateLocalMessageManager(d);
            });

            $scope.$on('messageReceived', function (e, d) {
                $scope._handleChannels(d);
            });

            $scope.$on('userOnline', function (e, d) {
                $scope._sendStatus($scope._getMe(), 'online');
            });

            $scope.$on('newUserOnline', function(e, d) {
                $scope._broadcastNewUserOnline();
            });

            $scope.$on('userOffline', function (e, d) {
                $scope._sendStatus($scope._getMe(), 'offline');
            });

            $scope.$on('userAway', function (e, d) {
                $scope._sendStatus($scope._getMe(), 'away');
            });

            $scope.$on('logout', function (e, d) {
                $scope._logout();
            });


            $scope.init();

        }]);
