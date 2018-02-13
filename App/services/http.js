/*global define*/
define(["jquery","Q", "model/statushttp" ,"config"],
function ($, Q, statushttp, config) {

    "use strict";

    var serviceInstance = null,
        _tokenType = "Bearer",   
        self = null,
        _ajaxTimeout = config.ajaxTimeout;
    /**
     * Private methods 
     * 
     */
   
    /**
     *  Definición del Servicio
     */
    function Http() {

        if (serviceInstance !== null) {
            throw new Error("Cannot instantiate more than one Http, use Http.getInstance()");
        }
        //=============================================================================
        // Public Members. 
        //=============================================================================
        this.className = "Http";
        this.headers = {};
        self = this;
    }

    /**
     * Public Static methods 
     * 
     */
    Http.getInstance = function () {
        if (serviceInstance === null) {
            serviceInstance = new Http();
            serviceInstance.init();
        }

        return serviceInstance;
    };

    /**
     * CONSTATS 
     */
    Http.CONSTANT = "CONSTANT";

    /**
     * Public methods 
     */
    Http.prototype = {

        /**
         * To prevent call to 'instanceof` will fail.
         */
        constructor: Http,

        init: function(){
            this.setTokenType("bearer");
            //this.setBearerToken("0gaQv7CV9EMY24JvDLlOBDHsruigLOVoFCu7eV4oTw6IS7wbOL6pa4EadyiUMbGa9N2feNYIeX4tYmBQMzkw8yGNlsO8MvYkHkHhINQH0PcDLJsNs8Nxlo_otSG70gkq6HO-ATIpg-hxYeiX7oPXMgCGz99G2ReA5eBwZy0apLzujzxJgo4t-tdmwIcdegG4YH75OcTDH0nNOfuvBh-3FcnYzGt6Mzt2yLbAsTslMr-AWuJTjAxQS9ZHoqSIeH-NPy37JuAkmAnsdgCJNBdj5XHSuZxEwiKFZ6oXCRYBaWZwZ6Fg2ayBi6jbsp9rofwkgEjflwbkQNUu_LUo-JtBfO3xt5yeH7pVS9TchTVZ5LNVu7Q9XlQBBWynRS4z687yNopfabgb-hWs5xAVbaFQM5BIZYrHUwRRDJi3CRc2-XvzvA-RyFqXIUdMmm_vqsL_NZYRF-x7JVZ-TLd22neFExtKHuPTA-gHNuyLErJuAKCkXGnT0tmdl1zZJrtbpPa5bKZdR5FRKDzDCT-NvBH-32P5hn6Jsv-4h5uzbdKZzlvTlk1RM4O70L0XEM1QWRAr");
            this.setBearerToken("SnHfHXP0Z-sNrxczmhu5zvPBSktj6cIwsyrXnr-Cl_vyTYM2d6HapsGrNlWaJKEyExnSarYB9M-l6MuuBf33DbsBHE0uu2TCmuSnRR0tuCR7wmVCIHJkJHEKRhx1cHycjNxnNPq5dFmqHISYrmf29ZfdtkAsRa4FzY2f7t33trMW-tJA2tJbd7XsYcr3XjJSo8TzMRkNnCP4hiEVaWPEywcwfnErSpdFycXvoOh9oCroUnm4jkaQBZj-UUVuZN5LBm0BD8OIMv8WiZq5xD_-tyWp7VjisQLvAkH5SVUgK3FAma14mTSH528ygHkK7cxpwKteh3gF40wChgsqHtERW_irMwT56ioyJK-brHobBnkMbLm7g6NqJd4fKSy-iGbkkhSPqJJnhRgIkX8VfBCpptCjzKCQxLSwqmNsGipk3hRgglmuRZNnbgd2yEaMmdZ6EoFdYYcEGxZMdT3rSLQw73VA0zKuqFwTdaDUm2F-p7mtP2lZKJyYkF0uHrQJyzvI5QNDOBa_0_4Sdk890258lVjI1mg0em0b1sdVDJDc6g4z_fbtFkGEj8pixbvUi5_1");
        },
        
        setBearerToken: function (token) {
            if (token && _tokenType) {
                this.headers.Authorization = _tokenType + " " + token;                
                this.headers.xhrFields = true;
            }
        },

        setTokenType: function (type) {
            if (type) {
                _tokenType = type;
            }
        },

        clearSessionHeaders: function(){
            delete (this.headers.Authorization);
            delete (this.headers.xhrFields);
            delete (this.headers["accept-language"]);
            _tokenType = ""; 
        },

        setAcceptLanguage: function (language) {
            if (language && language.length <= 2) {
                this.headers["accept-language"] = language;
            }
        },

        get: function (url, id){
            var sendUrl =  url;
            return Q($.ajax({
                method: "GET",
                url: sendUrl,
                headers: this.headers,
                timeout: _ajaxTimeout
             })).then(function (data) {
                // on success
                return {ok: true,  info: data, message: "OK", status: "OK", isNew:true};
            }, function (xhr) {
                // on failure
               // window.console.log()
                return { ok: false, info: xhr, message: _status.errorMessage, status: _status.statusText, isNew: true};
            });
        },

        post: function (url, data, id) {
            var sendUrl = url;
            return Q($.ajax({
                method: "POST",
                url: sendUrl,
                headers: this.headers,
                data: data,
                timeout: _ajaxTimeout
            })).then(function (data) {
                // on success
                return {ok: true,  info: data, message: "OK", status: "OK", isNew:true};
            }, function (xhr) {
                // on failure
                return { ok: false, info: xhr, message: _status.errorMessage, status: _status.statusText, isNew:true};
            });
        },
        

        getDefaultHeaders: function(){
            return self.headers;
        },

        setHttpHeaders: function (loginResponse, language) {
            if (loginResponse && language) {
               this.setTokenType(loginResponse["token_type"]);
               this.setBearerToken(loginResponse["access_token"]);
               this.setAcceptLanguage(language);
             }
        },

        setTimeout: function (value){
            _ajaxTimeout = value;
        },

        restoreTimeout: function(){
            _ajaxTimeout = config.ajaxTimeout;
        }
    };

    return Http.getInstance();
});