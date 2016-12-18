/*global requirejs, require, define, Stashy, ko, navigator*/
requirejs.config({
    paths: {
        "durandal": "../bower_components/Durandal/js",
        "plugins": "../bower_components/Durandal/js/plugins",
        "transitions": "../bower_components/Durandal/js/transitions",
        "jquery": "../bower_components/jquery/dist/jquery",
        "knockout": "../bower_components/knockout/dist/knockout",
        "text": "../bower_components/requirejs-text/text",
        "Q": "../bower_components/q/q",
     },
    waitSeconds: 0, 
    shim: {
 
    }
});

require(["knockout"], function (ko) {
    'use strict';
    window.ko = ko;
});

define([ 'jquery', 'durandal/app', 'durandal/binder', 'durandal/viewLocator', 'durandal/system', 'plugins/dialog'],
function ($,  app, binder, viewLocator, system, dialog) {

    'use strict';

    var currentLanguage = 'es-ES',
         i18NOptions = null,
        initPromise = null,
        nonStartMessage = "No hem pogut posar en marxa el App: NeixTags";

    //>>excludeStart("build", true);
    system.debug(true);
    //>>excludeEnd("build")

    //=========================================================================
    // M A I N ()
    //=========================================================================

    try {
        $( document ).ready(function() {
            alert("Document Ready");
            if(sessionStorage.isPhonegap){
                alert("Before Device Ready")
                document.addEventListener('deviceready', function () {
                    alert ("after device Ready");
                    main();
                });
            } else {
                main();
            }
        });
    } catch (err) {
        alert("No es posible iniciar el app: " + err.message, err, "main.exception.beforeInit", true);
    }
    //==========================================================================
    // E N D 
    //==========================================================================
    function main(){
        try {
            startApp().then(function () {
                app.trigger('app:start');
            });
        } catch (err) {
            alert("No es posible iniciar el app: " + err.message, err, "main.exception.onInit", true);
        }
    }
    function startApp() {

        app.title = 'Neix Tags';

        //specify which plugins to install and their configuration
        app.configurePlugins({
            router: true,
            dialog: true
        });


        return app.start().then(function () {
            //Replace 'viewmodels' in the moduleId with 'views' to locate the view.
            //Look for partial views in a 'views' folder in the root.
            viewLocator.useConvention();
            //Show the app by setting the root view model for our application with a transition.

            binder.binding = function (obj, view) {
                //$(view).i18n();
            };
            app.setRoot('viewmodels/shell', 'entrance');
        });
    }

});
