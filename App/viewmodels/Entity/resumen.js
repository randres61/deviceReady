define(["Q", "services/resumen", "knockout"], function(Q, resumenService, ko){
    "use strict";
    var parametros = {
        entityId : 11,
        languageId:"ca-ES",
        userId:"2a6f297e-db36-4f2c-93cf-aed0b9065831",
        LabelTypesId: ["CUSTOM","AUTO","MODALITYCUSTOM"]
    }

    function Resumen(){
        this.className = "Resumen";
        this.resumen = null;
    }
    Resumen.prototype = {
        activate: function(){
            var self = this;
            return resumenService.getResumen(parametros).then(function(resposta){
                if(resposta.ok){
                    self.resumen = resposta.info;
                }
            });
        },
        binding: function(view){
            var res = view;
        },
        bindingComplete: function(view){
            var res = view;
        },
        compositionComplete: function(view){
            var res = view;
        },
        deactivate: function(){
            alert("nos vamos a ir");
        }
    };
    return Resumen;
});