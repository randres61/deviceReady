/*define, window*/
define(["services/http", "services/cache", "Q"], 
function(http, cache, Q){
    "use strict";
    var serviceInstance = null,
        self = this;

    function retrieveCachedData(url, params){
        return cache.read(url, params).then(function(data){
              if(data){
                  data.response.isNew = false;
              }
              return data;
        });
    }
    
    /**
     * Salva en la cache si la respuesta es nueva.
     * marca el mensaje como nuevo o identico al actualmente almacenado
     * @param {string} url: url of called service.
     * @param {object} response: Object response standard
     * @param {object} parameters: object that contains parameters pass to POST
     * @param {string} command: http command "GET", "POST", ...
     * @returns
     */
    function saveToCache(url, response, parameters, command){
        var isOutDated =  cache.isOutdated(url, response, parameters); // Esta desactualizada

        if(isOutDated){
            return cache.save(url, response, parameters , command).then(function(saved){
                response.isNew = true;
                return response;
            });
        } else {
            response.isNew = false;
            return Q(response);
        }
    }
 
    function SendService(){
        if (serviceInstance !== null) {
            throw new Error("Cannot instantiate more than one SendService, use SendService.getInstance()");
        }
        //=============================================================================
        // Public Members. 
        //=============================================================================
        this.className = "SendService";
        self = this;
    }

    SendService.getInstance = function () {
        if(serviceInstance === null) {
            serviceInstance = new SendService();
        }
        return serviceInstance;
    };

    SendService.prototype = {
        constructor : SendService,

        get : function (url) {
            return http.get(url).then(function (response){ 
                if(response.ok){
                    return saveToCache(url, response, null , "GET").then(function(resp){
                        return resp;
                    });
                } else {
                    // Si hay un error de Timeout o estamos offLine intentamos entregar el contenido de la cache
                    if(response.status === "Timeout" || response.status === "Not connect"){
                        return retrieveCachedData(url).then(function(cacheData){
                           return cacheData ? cacheData.response : response;
                        });
                    } else {
                        // Si es un error de otro tipo 404, 500, 400, etc. retornamos el error.
                        return Q(response);
                    }
                }
            });
        },
        post : function (url, data) {
            return http.post(url, data).then(function(response){
                if(response.ok){
                    return saveToCache(url, response, data , "POST").then(function(){
                        return response;
                    });
                } else {
                    // Si hay un error de Timeout o estamos offLine intentamos entregar el contenido de la cache
                    if(response.status === "Timeout" || response.status === "Not connect"){
                        return retrieveCachedData(url, data).then(function(cacheData){
                            return cacheData ? cacheData.response : response;
                        });
                    } else {
                        // Si es un error de otro tipo 404, 500, 400, etc. retornamos el error.
                        return Q(response);
                    }
                }
            });
        }
    };

    return SendService.getInstance();
});