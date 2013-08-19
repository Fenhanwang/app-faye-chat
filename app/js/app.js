'use strict';


// Declare app level module which depends on filters, and services
angular.module('myApp', ['myApp.filters', 'myApp.services', 'myApp.directives', 'myApp.controllers', 'faye']).
    config(['$routeProvider', function($routeProvider) {
        $routeProvider.when('/', {templateUrl: 'partials/login.html', controller: 'LoginCtrl'});
        $routeProvider.when('/chat', {templateUrl: 'partials/chat.html', controller: 'ChatCtrl', resolve: {

            fetchAllUsers: function(Users) {

                return Users.getAllUsers(Users.user);
            },

            fetchSessions: function (Users, SessionManager) {

                return SessionManager.getSessions(Users.user);

            },

            fetchAppChannel: function($q, SecureChannel, Users) {

                var defer = $q.defer();

                SecureChannel.getAppChannel(Users.creds).then(function(result) {
                    defer.resolve(result);
                });

                    return defer.promise;
            },

            fetchMessages: function(Users, SessionManager, MessageManager) {

                var messages = {};

                SessionManager.getSessions(Users.user).then(function(sessions) {

                    angular.forEach(sessions, function(obj) {
                        if(obj.active == true) {
                            MessageManager.getChannelMessages(Users.user, obj.channel).then(function(result) {
                                messages[obj.channel] = result.record;

                            });
                        }
                    });
                });

                return messages;
            }
        }});
        $routeProvider.otherwise({redirectTo: '/'});
    }]).run(function($rootScope, Users, $location) {
        $rootScope.$on('$routeChangeStart', function() {
            Users.isLoggedInDSP().then(function(result) {
                if (!result) {
                    $location.path('/');
                }
            });


        });

    });
