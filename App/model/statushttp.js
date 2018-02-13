/*global define window*/
define([],
function () {

    "use strict";

     /**
     * Private methods 
     * 
     */
    function getErrorDescription(error){
        var message  = i18N.t("app:notKnown");
        if(error.responseJSON && error.responseJSON.error_description){
            message = error.responseJSON.error_description;
        } else if(error.responseJSON && error.responseJSON.message){
            message = error.responseJSON.message;
        }  else  {
            message = error.statusText;
        }
        return message;
    }

    function extractErrorInfo(jqXHR) {
        if (jqXHR.statusText === "timeout") {
            // Time out error.
            this.statusText = "Timeout";
            this.errorDescription = "Timeout";
        } else if (jqXHR.status === 0) {
            // Not connect: Verify Network
            this.statusText = "Not connect";
            this.errorDescription = "Not Connect";
        } else if (jqXHR.status === 404) {
            // Requested page not found [404]
            this.statusText = "Not found";
            this.errorDescription = "Not Found";
        } else if (jqXHR.status === 500 || jqXHR.status === 400) {
            // Internal Server Error [500] or Bad Resquest Error [400] : excepciones en servidor
            this.statusText = "Bad Request";
            this.errorDescription = getErrorDescription(jqXHR);
        } else if (jqXHR.statusText === "parsererror") {
            // Requested JSON parse failed.
            this.statusText = "Parse Error";
            this.errorDescription = "Parse Error";
        } else  {
            this.statusText = jqXHR.statusText;
            this.errorDescription = jqXHR.responseText;
        } 
        this.errorMessage = this.errorDescription;       
    }

    function StatusHttp() {
        var self = null;
        //=============================================================================
        // Public Members. 
        //=============================================================================
        this.className = "StatusHttp";
        this.statusText = null;
        this.status = -1;
        this.errorDescription = null;
        this.errorMessage = "";
        self = this;

        this.logStatus = function (error) {
            self.status = error.status;
            extractErrorInfo.call(self, error);
        };

        this.clearStatusInfo = function() {
            self.status = 200;
            self.statusText = "";
            self.errorDescription = "OK";
        };

    }
    return StatusHttp;
});