/*Global define*/
define(["services/send", "config", "Q"], function(sendService, config, Q){

    'use strict';
    var serviceInstance = null,
        urlActionResumen = config.webApiHost + "/api/Entity/Resumen";

    function ResumenService(){
        this.className = "ResumenService";
    }

    ResumenService.prototype = {
        getResumen : function(entityInfo){
            return sendService.post(urlActionResumen, entityInfo).then(function(response){
                return response;
            });
        }
    }

    ResumenService.getInstance = function(){
        if(serviceInstance === null){;
            serviceInstance = new ResumenService()
        }
        return serviceInstance;
    }
    return ResumenService.getInstance();
});