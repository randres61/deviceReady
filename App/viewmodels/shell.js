define(['plugins/router'],
    function (router) {

        var self = this;
        var routes =
        [
            { route: new RegExp('index.html', "i"), moduleId: 'Entity/resumen', title: 'Plugins', nav: true, hash: "#plugins" },
            { route: '', moduleId: 'Entity/resumen', title: 'Plugins', nav: true, hash: "#plugins" }
        ];


 
        var viewmodel = {
            activate: activate,
            router: router
        };





        return viewmodel;


        function activate() {

            //configure routing
            router.makeRelative({ moduleId: 'viewmodels' });
 
            return router.map(routes)
                .buildNavigationModel()
                .mapUnknownRoutes("notfound", "notfound")
                .activate({ pushState: true });
        }

 

    });