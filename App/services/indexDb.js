/*global define, window */
define(["Q", "services/utils"], function(Q,  Utils) {
    "use strict";

    var serviceInstance = null,
        indexedDB = null,
        request = null,
        db = null,
        _currentUser = null,
        _utils = new Utils(),
        self = null;
    /**
     * Private methods 
     * 
     */
    
    /**
     * La llamamos en caso de error al ejecutar un comando. Deja la propiedad lastOperStatus a COMMANDFAIL y el mensaje 
     * recibido en statusTest. El mensaje recibido tambien se muestra por consola.
     * @param {string} message: Mensaje de error generado por la rutina llamadora.
     * @param {Error} error. Excepcion producida. Puede ser null
     */
    function onCommandFail(message, error){
        self.lastOperStatus = IndexDbService.COMMANDFAIL;
        self.statusText = (message);
        window.console.log(message, error);
    }
    /**
     * La llamamos en caso de comando ejecutado finalize correctamente. Deja la propiedad lastOperStatus a COMMANDOK y el mensaje 
     * recibido en statusTest. 
     * @param {string} message: Mensaje de error generado por la rutina llamadora.
     */
    function onCommandOk(message){
        self.lastOperStatus = IndexDbService.COMMANDOK;
        self.statusText = message;
    }
    
    /**
     * Valida los parametros de entrada utilizado por los comando.
     * 
     * @param {string} table: El nombre de la tabla a consultar
     * @param {any} data: La información a localizar
     * @param {string} index: El nombre del indice utilizado para acceder a la tabla
     * @returns
     */
    function areValidParameters(table, data, index){
        var areValid = true;
        // Hemos de pasar algo que gravar
        if(_currentUser === null){
            onCommandFail("Not User set.", null);
            areValid = false;
        } else if (typeof data === "undefined" || data === null ) {
            onCommandFail("Data is empty.", null);
            areValid = false;
        } 
        return areValid;
    }


    /**
     * Contiene el comando que debe ejecutar la query. Se utiliza para definir las condiciones de filtro
     * 
     * @param {object} command: objeto con los siguientes parametros:
     *          table: Nombre de la tabla.
     *          key: Valor a buscar, en el caso de rangos corresponde al valor del nivel inferior.
     *          keyUp: En el caso de rangos corresponde al valor del nivel superior.
     *          index: Nombre del indice utilizado para realizar la consulta.
     *          desc: Si se especifica y vale true la ordenación será descendente. Por defecto es ascendente. Si desc es false tambien será ascendente
     *          filter: Filtro  a  aplicar 
     *              a)  E  ó "=": buscamos un valor igual.
     *              a)  G  ó "=": buscamos un valor mayor.
     *              a)  GE ó "=": buscamos un valor mayor o igual.
     *              a)  L  ó "=": buscamos un valor menor.
     *              a)  LE ó "=": buscamos un valor menor o igual.
     *              a)  "BETWEEN": buscamos en un rango de valores que incluye los limites inferior y superior.
     *              a)  "BETWEEN_EXCLUSIVE": buscamos en un rango de valores excluyendo los limites inferior y superior.
     *              a)  "BETWEEN_UPPER": buscamos en un rango de valores excluyendo el limite superior
     *              a)  "BETWEEN_LOWER": buscamos en un rango de valores excluyendo el limite inferior.
     * @returns boolean true o false
     */
    function isValidQueryCommand(command){
        var filter = (command && command.filter) ? command.filter.toUpperCase() : "noCommand",
            range = null,
            IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange 
                                             || window.msIDBKeyRange;

        if(typeof command !== "object"){
            onCommandFail("Isn't filter.", null);
            return false;  
        } else if (!areValidParameters(command.table, command.key, command.index)) {
            return false;
        } else if (!command.filter){
            onCommandFail("Filter are required.", null);
            return false;        
        } else if ( filter.startsWith("BETWEEN")  &&  (typeof command.upKey === "undefined" || command.upKey === null) ) {
            onCommandFail("Range Command need upKey.", null);
            return false;        
        }  else {
            command.order = command.desc ? "prev": "next";
            switch (filter){
                case "E":
                case "=":
                    command.range = IDBKeyRange.only(command.key);
                    break;
                case "G":
                case ">":
                    command.range = IDBKeyRange.lowerBound(command.key, true);
                    break;
                case "GE":
                case ">=":
                    command.range = IDBKeyRange.lowerBound(command.key, false);
                    break;
                case "L":
                case "<":
                    command.range = IDBKeyRange.upperBound(command.key, true);
                    break;
                case "LE":
                case "<=":
                    command.range = IDBKeyRange.upperBound(command.key, false);
                    break;
                case "BETWEEN":
                    command.range = IDBKeyRange.bound(command.key, command.upKey, false, false);
                    break;
                case "BETWEEN_EXCLUSIVE":
                    command.range = IDBKeyRange.bound(command.key, command.upKey, true, true);
                    break;
                    case "BETWEEN_LOWER":
                    command.range = IDBKeyRange.bound(command.key, command.upKey, true, false);
                    break;
                case "BETWEEN_UPPER":
                    command.range = IDBKeyRange.bound(command.key, command.upKey, false, true);
                    break;
                default:
                    onCommandFail("Command not found.", null);
                    return false;        
            }
            command.dbTables = toArray(command.table);
            return true;
        }
    }

    /**
     * Convierte un nombre de tabla en un array de nombres de tablas
     * 
     * @param {string} tableName: Nombre de la tabla que tenemos que incluir en el array
     * @returns Array que contiene el nombre de la tabla
     */
    function toArray(tableName){
        var dbTables = new Array();

        dbTables.push(tableName);
        return dbTables;
    }

    /**
     * 
     * @param {string} name: Nombre de la BD a abrir. Si no se especifica asume "linx"
     * @param {long} version: Número de versión de la BD a abrir. Si no se especifica asume 1
     * @param {callback} onerror: Puntero a la rutina de tratamiento de los errores
     * @param {callback)} onupgradeneeded: Puntero a la rutina de creación del esquema
     * @returns Promise. En caso de que termine OK retorna true. Si va mal retorna evt.target.error.
     */
    function openDatabase(name, version, onError, onUpgradDb){
        var deferred = Q.defer();
        if(!_currentUser){
            throw new TypeError("User not set");
        }
        indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB;
        try {
            request = indexedDB.open(name + "." + _currentUser, version);
            
            request.onerror = function (evt) {
                onCommandFail("Encountered an error opening local indexDB: ", evt.target.error);
                self.version = -1;
                self.name = null;
                deferred.reject(new Error ( evt.target.error ) );
            };

            request.onsuccess = function() {   
                db = this.result; 
                self.name = db.name;
                self.version = db.version;
                self.status = IndexDbService.OPEN;
                onCommandOk("Local indexDB: " + name + " OPENED.");

                db.onerror = onError || function(dbEvent) { 
                    window.console.log("Encountered a indexDb error:", dbEvent.target.error);    
                };    

                deferred.resolve(true);
            };  

            request.onupgradeneeded = onUpgradDb || function(evt) {
                var oldVersion = evt.oldVersion;
                // Safari returns a really silly value for newly created databases.
                // From https://github.com/treojs/idb-schema/blob/master/lib/index.js
                upgradeDatabase(evt.target.result, oldVersion > 4294967295 ? 0 : oldVersion);
            };
            return deferred.promise;  
        } 
        catch(e)
        {
            onCommandFail("Open Fail: " + e.message , e);
            self.status = IndexDbService.CLOSE;
            deferred.reject(e); 
            return deferred.promise;
        }
    }

    /**
     * 
     * Elimian la base de datos completa. Necesitamos el nombre de la BD a eliminar
     * @param {string} name: Nombre de la BD eliminada
     * @returns boolean true o false según pueda o no eliminar la base de datos
     */
    function deleteDatabase(name){
        var deferred = Q.defer(),
            dbName = name || db.name,
            deleteRequest = null;

        deleteRequest = indexedDB.deleteDatabase(dbName);
        deleteRequest.onsuccess = function(){
            onCommandOk("Erased Database: " +  dbName);
            self.status         = IndexDbService.DELETED;
            deferred.resolve(true);
        };
        deleteRequest.onerror = function(){
            onCommandFail("Erased Database: " + dbName + " Fail", null);
            deferred.reject(false);
        };
        return deferred.promise;
    }
    /**
     * Cierra la BD
     */
    function closeDatabase(){
        db.close();
        onCommandOk(IndexDbService.COMMANDOK);
        self.status = IndexDbService.CLOSE;
    }

    /**
     * Creació/Actualitzacio del esquema. Si demanem en l'obertura un número de version diferent
     * del que tenim es crida aquesta funció
     * 
     * @param {obj} db. Per tenir acces a la BD
     * @param {int} oldVersion: el número de la antiga versió
     */
    function upgradeDatabase(dbRef, oldVersion) {
        try{
            for (var curVersion = oldVersion; curVersion < dbRef.version; curVersion++) {
                switch (curVersion) {
                    case 0:
                        // schema V1: create esquema
                        dbRef.createObjectStore("objects", {keyPath: "name"});
                        break;
                    case 1:
                        var messageStore = dbRef.createObjectStore("message", { keyPath: "idMessage" });
                        messageStore.createIndex("url", "url", {unique: false});
                        messageStore.createIndex("httpStatus", "httpStatus", {unique: false});
                        messageStore.createIndex("dateSend", "dateSend", {unique: false});
                        messageStore.createIndex("command", "command", {unique: false});
                        dbRef.createObjectStore("recorder", { keyPath: "idrecord" });
                        break;
                    default:
                        window.console.log(dbRef.name + " upgrade CALL but version: " + curVersion + " don't have upgrade.");
                }
            }
            onCommandOk("Upgrade Database: " + dbRef.name + " OK to version: " + dbRef.version);
        } catch(e){
            onCommandFail("Upgrade Database: " + dbRef.name + " OK to version: " + dbRef.version, e);
        }
    }

    /**
     * Grava un registro en la tabla. Si existe un registro con la misma primaryKey lo sobreescribe
     * 
     * @param {[string]} dbTables: Array con el nombre de la tabla que tenemos que actualizar
     * @param {object} dataToStore: Objecto con la información que tenemos que almacenar
     * @returns
     */
    function doPutTransaction(dbTables, dataToStore){
        var deferred = Q.defer(),
            transaction = db.transaction(dbTables, "readwrite");

        transaction.onerror = function(evt) {
            onCommandFail("[DB] Put Transaction got an error: ", evt.target.error);
            deferred.reject(new Error ( evt.target.error ) );
        };

        transaction.oncomplete = function(evt) {
            try {
                onCommandOk("[DB] All entries added.");
                deferred.resolve(true);
            } catch(e) {
                var a = e.message;
            }
        };

        try {
            var store = transaction.objectStore(dbTables[0]);
            store.put(dataToStore);
            return deferred.promise;
        } catch (e) {
            deferred.reject(e);
        }
    }

    /**
     * Lee un registro de la base de datos
     * 
     * @param {[string]} dbTables: Array con el nombre de la tabla que tenemos que actualizar
     * @param {any} key: valor a localizar.
     * @returns
     */
    function doGetTransaction(dbTables, key){
        var deferred = Q.defer(),
            req = db.transaction(dbTables).objectStore(dbTables[0]).get(key);

        req.onerror = function(evt) {
            onCommandFail("[DB] Get Transaction got an error: ", evt.target.error);
            deferred.reject(new Error ( evt.target.error ) );
        };

        req.onsuccess = function(evt) {
            onCommandOk("[DB] All entries Readed.");
            deferred.resolve(evt.target.result);
        };
        return deferred.promise;
    }
    /**
     * Borra un registro de la base de datos
     * 
     * @param {[string]} dbTables: Array con el nombre de la tabla que tenemos que actualizar
     * @param {any} key: valor a borrar.
     * @returns
     */
    function doDeleteTransaction(dbTables, key){
        var deferred = Q.defer(),
            request = null;

        request = db.transaction(dbTables,"readwrite").objectStore(dbTables[0]).delete(key);
        
        request.onerror = function (evt) {  
            window.console.log("[DB] An error occurred: ", evt.target.error);
            deferred.reject(new Error ( evt.target.error ) );
        };
        request.onsuccess = function () {  
            window.console.log("Deleted the entry.");
            deferred.resolve(true);
        };
        return deferred.promise;
    }
    
    /**
     * Borra un registro de la base de datos
     * 
     * @param {[string]} dbTables: Array con el nombre de la tabla que tenemos que actualizar
     * @param {any} key: valor a borrar.
     * @returns
     */
    function doDeleteTable(dbTables){
        var deferred = Q.defer(),
            transaction = null,
            objectStore = null,
            request = null;

        transaction = db.transaction(dbTables,"readwrite");
        
        transaction.onerror = function (evt) {  
            window.console.log("[DB] An error occurred: ", evt.target.error);
            deferred.reject(false);
        };
        
        objectStore = transaction.objectStore(dbTables[0]);
        request = objectStore.clear();
        request.onsuccess = function () {  
            window.console.log("Table cleaned.: " + dbTables[0]);
            deferred.resolve(true);
        };
        return deferred.promise;
    }
    /**
     * Localiza en la tabla indicada el primer registro que se ajusta al valor indicado en key. Para buscar utiliza el indice especificado.
     * 
     * @param {[string]} dbTables: array con el nombre de la tabla a utilizar
     * @param {string} index: Nombre del indice que tenemos que utilizar en la busqueda
     * @param {any} key: El valor a buscar
     * @returns
     */
    function doFindFirstTransaction(dbTables, index, key) {
        var cursor = null,
            deferred = Q.defer(),
            list = new Array(),
            req = db.transaction(dbTables).objectStore(dbTables[0]).index(index).get(key);


        req.onerror = function (evt) {  
            window.console.log("[DB] An error occurred: ", evt.target.error);
            deferred.reject(new Error ( evt.target.error ) );
        };
        req.onsuccess = function (evt) {  
            onCommandOk("[DB] All entries Readed.");
            deferred.resolve(evt.target.result);  
        };
        return deferred.promise;
    }


    /**
     * Ejecuta sobre la tabla la consulata especificada en command
     * 
     * @param {any} command
     * @returns
     */
    function doFindAllTransaction(command) {
        var cursor   = null,
            deferred = Q.defer(),
            list     = new Array(),
            req      = db.transaction(command.dbTables).objectStore(command.table).index(command.index).openCursor(command.range, command.order);

        req.onerror = function (evt) {  
            window.console.log("[DB] An error occurred: ", evt.target.error);
            deferred.reject(new Error ( evt.target.error ) );
        };
        req.onsuccess = function (evt) {  
                cursor = evt.target.result;  
                if (cursor) {    
                    list.push(cursor.value);
                    cursor.continue(); // get next object  
                } 
                else {    
                    onCommandOk("[DB] All entries Readed.");
                    deferred.resolve(list);
                }
        };
        return deferred.promise;
    }

    /**
     * Ejecuta sobre la tabla la consulta especificada siguiendo 
     * el modelo del SQL Like.
     * @param {obj} dbTable object
     * @param {string} column name
     * @param {string} value to find
     * @returns list<records> list of records
     */
    function doLike(dbTables, column, key) {
        var deferred = Q.defer(),
            list = new Array(),
            req = db.transaction(dbTables).objectStore(dbTables[0]).openCursor();

        req.onerror = function (evt) {  
            window.console.log("[DB] An error occurred: ", evt.target.error);
            onCommandFail("Like query an error occurred");
            deferred.reject(new Error ( evt.target.error ) );
        };
        req.onsuccess = function (evt) {  
            var cursor = evt.target.result;
            if (cursor) {
                var lowerKey = new RegExp(key, "i");
                var valor = cursor.value[column].toString().toLowerCase();
                if(valor && valor.match(lowerKey)){
                    list.push(cursor.value);
                }
                cursor.continue();
            }
            else {
                onCommandOk("Find " + list.length + " records");
                deferred.resolve(list);  
            }        
        };
        return deferred.promise;
    }

    function doLikeForFilter(dbTables, column, key) {
        var deferred = Q.defer(),
            list = new Array(),
            req = db.transaction(dbTables).objectStore(dbTables[0]).openCursor();

        req.onerror = function (evt) {  
            window.console.log("[DB] An error occurred: ", evt.target.error);
            onCommandFail("Like query an error occurred");
            deferred.reject(new Error ( evt.target.error ) );
        };
        req.onsuccess = function (evt) {  
            var cursor = evt.target.result;
            if (cursor) {
                var toAdd = false;
                var notAdd = false;
                var valor = _utils.removeDiacritics(cursor.value[column].toString().toLowerCase());
                key.replace(/ /g, "-").split("-").forEach(function(strFragment){
                    if(valor && valor.match(_utils.removeDiacritics(strFragment).toLowerCase())){
                        toAdd = true;
                    } else {
                        notAdd = true;
                    }
                });
                if(toAdd && !notAdd) list.push(cursor.value);
                cursor.continue();
            }
            else {
                onCommandOk("Find " + list.length + " records");
                deferred.resolve(list);  
            }        
        };
        return deferred.promise;
    }   

    /**
     * Borrar registros en base al rango especificado en command.
     * 
     * @param {any} command
     * @returns
     */
    function doDeleteByRange(command){
        var cursor   = null,
            deferred = Q.defer(),
            store    = db.transaction(command.dbTables, "readwrite").objectStore(command.table),
            req      = store.index(command.index).openCursor(command.range);

        req.onerror = function (evt) {  
            window.console.log("[DB] An error occurred: ", evt.target.error);
            deferred.reject(new Error ( evt.target.error ) );
        };
        req.onsuccess = function (evt) {  
                cursor = evt.target.result;  
                if (cursor) {    
                    store.delete(cursor.primaryKey);
                    cursor.continue(); // get next object  
                } 
                else {    
                    onCommandOk("[DB] All entries Read.");
                    deferred.resolve();
                }
        };
        return deferred.promise;
    }

    /**
     * Recupera todos los objetos de la tabla especificada.
     * 
     * @param {string} tableName
     * @param {function} callback Función que gestiona los objetos recuperados por de la tabla especificada:
     *  function (items) {
     *      var len = items.length;
     *          for (var i = 0; i < len; i += 1) {
     *            console.log(items[i]);
     *          }
     *  }
     * @returns
     */
    function getAllItems(tableName) {
        var trans = db.transaction(tableName, IDBTransaction.READ_ONLY);
        var deferred = Q.defer();
        var store = trans.objectStore(tableName);
        var items = [];

        trans.oncomplete = function(evt) {
            deferred.resolve(items);
        };

        var cursorRequest = store.openCursor();

        cursorRequest.onerror = function(error) {
            window.console.log(error);
        };

        cursorRequest.onsuccess = function(evt) {
            var cursor = evt.target.result;
            if (cursor) {
                items.push(cursor.value);
                cursor.continue();
            }
        };

        return deferred.promise;
    }

    function count(tableName) {
        var deferred = Q.defer(),
            req      = db.transaction(tableName).objectStore(tableName).count();

        req.onerror = function (evt) {  
            window.console.log("[DB] An error occurred: ", evt.target.error);
            deferred.reject(new Error ( evt.target.error ) );
        };
        req.onsuccess = function (evt) {
            deferred.resolve(evt.target.result);
        };
        return deferred.promise;
    }

    function dynamicSort(property) {
        var sortOrder = 1;
        if(property[0] === "-") {
            sortOrder = -1;
            property = property.substr(1);
        }
        return function (a,b) {
            var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
            return result * sortOrder;
        };
    }

    function IndexDbService() {

        if (serviceInstance !== null) {
            throw new Error("Cannot instantiate more than one IndexDbService, use IndexDbService.getInstance()");
        }
        //=============================================================================
        // Public Members. 
        //=============================================================================
        this.className = "IndexDbService";
        this.db = null;
        this.status = IndexDbService.CLOSE;
        this.lastOperStatus = null;
        this.statusText = null;
        this.version = null;
        this.name = null;
        self = this;
    }

    /**
     * Public Static methods 
     * 
     */
    IndexDbService.getInstance = function () {
        if (serviceInstance === null) {
            serviceInstance = new IndexDbService();
        }
        return serviceInstance;
    };

    /**
     * CONSTATS 
     */
    IndexDbService.CLOSE = "close";
    IndexDbService.OPEN  = "open";
    IndexDbService.DELETED = "deleted";
    IndexDbService.COMMANDFAIL = "commandError";
    IndexDbService.COMMANDOK = "OK";
    IndexDbService.ONLY = "ONLY";
    IndexDbService.LOWERBOUND = "GREATER";
    IndexDbService.UPPERBOUND = "LOWER";
    IndexDbService.BOUND = "BOUND";

    /**
     * Public methods 
     */
    IndexDbService.prototype = {

        /**
         * To prevent call to 'instanceof` will fail.
         */
        constructor: IndexDbService,

        open: function(name, version, dbErrorHandle, dbSchema){
            var dbName = name || "linx",
                dbVersion = (typeof version === "undefined" || version === null || version === 0) ? 1 : version;
    
            return openDatabase(dbName, dbVersion, dbErrorHandle, dbSchema);
        },

        close: function (){
            return closeDatabase();
        },

        put: function(tableName, data){

            var dbTables = null;

            if(areValidParameters(tableName, data)) {
                dbTables = toArray(tableName);
                return doPutTransaction(dbTables, data);
            } 
            else {
                throw new TypeError(self.statusText); 
            }
        },

        get: function(tableName, key) {
            var dbTables = null;

            if(areValidParameters(tableName, key)) {
                dbTables = toArray(tableName);
                return doGetTransaction(dbTables, key);
            } 
            else {
                throw new TypeError(self.statusText); 
            }
        },

        count: function(tableName) {
            return count(tableName);
        },

        getAll: function(tableName) {
            return getAllItems(tableName).then(function(items){
                return items;
            });
        },

        delete: function (tableName, key) {
            var dbTables = null;

            if(areValidParameters(tableName, key)) {
                dbTables = toArray(tableName);
                return doDeleteTransaction(dbTables, key);
            } 
            else {
                throw new TypeError(self.statusText); 
            }
        },

        deleteTable: function(tableName){
            var dbTables = toArray(tableName);
            return doDeleteTable(dbTables);
        },
        
        deleteRange: function(command){
            if(isValidQueryCommand(command)){
                return doDeleteByRange(command);
            } else{
                throw new TypeError(self.statusText); 
            }
        },

        deleteAll: function(dbName) {
            return  deleteDatabase(dbName);
        },

        findFirst: function(tableName, index, key){
            var dbTables = null;

            if(areValidParameters(tableName, key, index)) {
                dbTables = toArray(tableName);
                return doFindFirstTransaction(dbTables, index, key);
            } 
            else {
                throw new TypeError(self.statusText); 
            }
        },
        
        doQuery: function(command){
            if(isValidQueryCommand(command)){
                return doFindAllTransaction(command);
            } else{
                throw new TypeError(self.statusText); 
            }
        },

        doQueryAndSort: function(command){
            if(isValidQueryCommand(command)){
                return doFindAllTransaction(command).then(function(queryResult){
                    if(queryResult && queryResult.length > 0){
                        if(command.sortBy && queryResult[0].hasOwnProperty(command.sortBy)){
                            //sortOrder = "-" -> descendente    sortOrder = "" -> ascendente
                            return queryResult.sort(dynamicSort(command.sortOrder + command.sortBy));
                        } else {
                            return queryResult;
                        }
                    } else {
                        return [];
                    }
                });
            } else{
                throw new TypeError(self.statusText); 
            }
        },

        checkIfExistsItems: function(){
            if(countItems() > 0){
                return true;
            } else {
                return false;
            }
        },

        likeQuery: function(tableName, index, key){
            var dbTables = null;
            if(areValidParameters( tableName, key, index )) {
                dbTables = toArray( tableName );
                return doLike( dbTables, index, key );
            } 
            else {
                throw new TypeError(self.statusText); 
            }
        },

        likeQueryForFilter: function(tableName, index, key){
            var dbTables = null;
            if(areValidParameters( tableName, key, index )) {
                dbTables = toArray( tableName );
                return doLikeForFilter( dbTables, index, key );
            } 
            else {
                throw new TypeError(self.statusText); 
            }
        },
        setUser: function(userName){
            if(userName){
                _currentUser = userName;
            } else {
                throw new TypeError("Not user set."); 
            }
        },

        clearUser: function(){
            var userName = _currentUser;
            _currentUser = null;
            return userName;
        },
        
        getUser: function(){
            return _currentUser;
        }


    };

    return IndexDbService.getInstance();   

});