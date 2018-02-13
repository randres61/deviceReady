/*global define*/
define(["knockout"], function (ko) {
    "use strict";
        
    return {
        webApiHost : "https://neixtags.azurewebsites.net/WebApi", 
        // webApiHost : "http://localhost:50246",
        ajaxTimeout: 45000
    };
});
