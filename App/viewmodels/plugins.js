define([],
    function () {
        "use strict";

        var self = null;
        /**
         * Private methods 
         * 
         */
        function getInfo() {
                var element = document.getElementById('deviceProperties');
                if(sessionStorage.isPhonegap){
                        element.innerHTML = 'Device Model: '    + device.model    + '<br />' +
                                    'Device Cordova: '  + device.cordova  + '<br />' +
                                    'Device Platform: ' + device.platform + '<br />' +
                                    'Device UUID: '     + device.uuid     + '<br />' +
                                    'Device Version: '  + device.version  + '<br />';
                } else {
                        element.innerText = "No mobile";
                }

        }
        function Plugins() {

            //=============================================================================
            // Public Members. 
            //=============================================================================
            this.className = "Plugins";

            self = this;

        }

        /**
         * Public methods 
         */

        Plugins.prototype = {

            /**
             * To prevent call to 'instanceof` will fail.
             */
            constructor: Plugins,


            compositionComplete: function () {
                getInfo();
            }

        };

        return Plugins;
    });