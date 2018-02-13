/*define, window*/
define(["services/indexDb", "services/utils", "Q", "moment"],
 function(indexDbService, Utils, Q, moment) {
    "use strict";
    var serviceInstance = null,
        utils = new Utils(),
        keys = {},
        self = this;

    function getKey(url, parameters){
        var paramsToString = null,
            key = null;
        
        parameters = parameters || null;
        paramsToString = JSON.stringify(parameters);
        key = utils.hashCode( url + "[" + paramsToString + "]");
        return (key > 0 ) ? "K" + key.toString() : "NK" + (Math.abs(key)).toString();
    }

    function getResponseHash(response){
        var strResponse = null;

        strResponse = JSON.stringify(response);
        return utils.hashCode(strResponse, true);
       
    }

    function Cache(){
        if (serviceInstance !== null) {
            throw new Error("Cannot instantiate more than one Cache, use Cache.getInstance()");
        }
        //=============================================================================
        // Public Members. 
        //=============================================================================
        this.className = "CacheService";
        self = this;
    }

    Cache.getInstance = function () {
       if(serviceInstance === null) {
            serviceInstance = new Cache();
        }
        return serviceInstance;
    };

    Cache.prototype = {
        constructor: Cache,

        load: function () {
            var command = {
                table : "message",
                index : "command",
                key   : "GET",
                filter: "E"
            },
                total = 0;
            keys = {}; // Limpia la cache
            return indexDbService.doQuery(command).then(function(results){
                results.forEach(function(result) {
                    if(result.httpStatus === "OK"){
                        var key = getKey(result.url);
                        keys[key] = result;
                        total++;
                    }
                });
                return total;
            });
        },

        read: function(url, parameters) {
            var key = getKey(url, parameters);
            
            if(this.isCached(url, parameters)){
                return Q(keys[key]);
            } else {
                return indexDbService.get ( "message", key ).then(function(data){
                    if(data){
                        keys[key] = data;
                        return data;
                    } else {
                        return data;
                    }
                });
            }
        },

        save: function(url, response, parameters, command){
            var key = null,
                hashResponse = null,
                dataToSave = null;

            key = getKey(url, parameters);
            hashResponse = getResponseHash(response.info);

            dataToSave = {
                command: command ? "GET" : "POST",
                idMessage : key,
                dateSend : moment().format("YYYYMMDDHHmmssSSS"),
                url : url,
                httpStatus : response.status || "OK",
                parameters: parameters,
                response: response,
                hash: hashResponse
            };
            
            keys[key] = dataToSave;
            
            return indexDbService.put ( "message", dataToSave ).then(function(saved){
                return saved;
            });
        },

        saveToRetransmit: function(url, response, parameters, command){
            var key = null,
                hashResponse = null,
                dataToSave = null;

            key = getKey(url, parameters);

            if(response && !response.info){
                hashResponse = getResponseHash(response);
            } else if(response && response.info){
                hashResponse = getResponseHash(response.info);
            } else {
                hashResponse = getResponseHash("");
            }


            dataToSave = {
                command: command ? "GET" : "POST",
                idrecord : key,
                dateSend : moment().format("YYYYMMDDHHmmssSSS"),
                url : url,
                httpStatus : response.status || "OK",
                parameters: parameters,
                hash: hashResponse
            };
            
            keys[key] = dataToSave;
            
            return indexDbService.put ( "recorder", dataToSave ).then(function(saved){
                return saved;
            });
        },

        delete: function(url, parameters){
            var key = getKey(url, parameters);

            return indexDbService.delete ( "message", key ).then(function(deleted){
                if(deleted) {
                    delete keys[key];
                }
                return deleted;
            });
        },

        deleteRetransmit: function(url, parameters){
            var key = getKey(url, parameters);

            return indexDbService.delete ( "recorder", key ).then(function(deleted){
                return deleted;
            });
        },

        deletePendingAsset: function(key){
            return indexDbService.delete ( "pendingAssets", key ).then(function(deleted){
                return deleted;
            });
        },

        isOutdated: function (url, response, params){
            var key = getKey(url, params),
                hashNewResponse = getResponseHash(response.info),
                dataCached = keys[key];

            if(! dataCached){
                return true;
            } else {
                return  (hashNewResponse !== dataCached.hash);

            }
        },

        isCached: function (url,params){
            var key = getKey(url, params);
            return keys[key] ? true : false;
        },

        getKey : function(url, parameters){
             return getKey(url, parameters);
        },

        cleanTableMessage: function(){
            return indexDbService.deleteTable("message").then(function(isOk){
                if(isOk) {
                    keys = {};
                }
            });
        },
        
        cleanTableLabels : function() {
            return  indexDbService.deleteTable("labels");
        }

    };
    return Cache.getInstance();

});47;