angular.module('board', 
    [
        'board-modules',
        'webrtc-service',
        'gridster',
        'firebase-service'
    ]
)

.directive('board', 
            ['WebRTC','$sce','FirebaseService',
    function (WebRTC , $sce , FirebaseService) {
        return {
            scope: {
                boardName: '@'
            },
            link: link,
            templateUrl: 'templates/room.html'
        }

        function link (scope) {
            scope.modules = {};
            scope.getTemplate = getTemplate;

            var nextModuleId = -1;
            var connection = WebRTC.getConnection();

            initVideoListeners();
            initGridSync();

            addModule('codepad', getCodepadData);

            function getCodepadData(moduleKey) {
                return {
                    boardName: scope.boardName,
                    moduleId: moduleKey
                }
            }
            function initGridSync() {
                var sync = FirebaseService.getSync(scope.boardName, 'layout');
                scope.gridLayout = sync.$asObject();

                scope.$on('GridLayoutChange', function(event, newSizes){
                    scope.gridLayout.$save();
                });
            }

            function initVideoListeners() { 
                connection.on('connectionReady', initializeConnection);
                connection.on('readyToCall', initializeCall);
                connection.on('videoAdded', AddNewVideo);
            }

            function initializeConnection(sessionId) {
                scope.sessionId = sessionId;
                // add local video as new module

                addModule('video', videoDataGetter(sessionId));

                scope.$apply();

                WebRTC.startLocalVideo(sessionId);
            }

            function initializeCall(sessionId) {
                connection.joinRoom(scope.boardName);
            }

            function AddNewVideo(video, peer) {
                addModule('video', videoDataGetter(peer.id, video));
                scope.$digest();
            }

            function addModule(type, getModuleData) {
                var moduleId = getNewModuleId();
                scope.modules[moduleId] =
                {
                    type: type,
                    moduleData: getModuleData(moduleId)
                };
            }

            function getNewModuleId() {
                nextModuleId++;
                return nextModuleId;
            }

            function getTemplate(moduleType) {
                return '/templates/board-modules-outer/' + moduleType + '.html';
            }

            function videoDataGetter(sessionId, elem) {
                return function () {
                    return {
                        sessionId: sessionId,
                        elem: elem
                    }
                }
            }
        }
    }
]);