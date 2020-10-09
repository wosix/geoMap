/**
 * Główny moduł imapLiteApi zawiera tworzenie iframe + metody komunikacji między
 * różnymi stronami(postMessage w celu uniknięcia crossDomain)
 * @global
 * @namespace
 * @name ILITEAPI
 */
var ILITEAPI = (function() {
    // glowne zmienne
    var apiCrossDomain = true, prefixModuleName = "imapLiteApi-", apiJsName = "/imapLiteApi-core.js", iframe = null, lhurl = window.location.href, modules = [], rmodules = 0, map, cfg, liteConnected = false, bindMsgEvts = false, resizeBrowserEvent, resizeBrowserEvent = null, browserResize = false;

    /**
     * link do imapLite na podstawie linku do api jest to sam host
     */
    var apiUrl = (function() {
        var src = null;
        var scripts = document.getElementsByTagName('script');

        var len = scripts != null ? scripts.length : 0;
        for (var i = 0; i < len; i++) {
            var script = scripts[i];
            try {
                if (script.src.indexOf(apiJsName) !== -1) {
                    src = script.src;
                    console.log("url do api to ", src);
                    break;
                }
            } catch (err) {

            }
        }
        src = src.replace("js", "js");
        src = src.replace(apiJsName, "");
        return src;
    })();

    /**
     * zwraca url do imalLite
     */
    var getBrowserUrl = function() {
        var aurl = apiUrl;
        if (ILITEAPI.icfg.imapLiteUrl) {
            aurl = ILITEAPI.icfg.imapLiteUrl;
        }
        return aurl + "browser.jsp?api=true";
    };

    /**
     * zabezpieczenie przed brakiem funkcji np. indexOf ie 8
     */
    function checkFunctions() {
        if (!Array.indexOf) {
            // brak indexOf
            Array.prototype.indexOf = function(obj) {
                for (var i = 0; i < this.length; i++) {
                    if (this[i] == obj) {
                        return i;
                    }
                }
                return -1;
            }
        }
    }

    /**
     * zabezpieczenie przed brakiem console
     */
    function checkConsole() {
        if (!window.console) {( function() {
                    var names = ["log", "debug", "info", "warn", "error", "assert", "dir", "dirxml", "group", "groupEnd", "time", "timeEnd", "count", "trace", "profile", "profileEnd"], i, l = names.length;

                    window.console = {};

                    for ( i = 0; i < l; i++) {
                        window.console[names[i]] = function() {
                        };
                    }
                }());

        }
    }

    function loadModules() {

    }

    /**
     * Metoda która tworzy widok aplikacji z mapą w elemencie div strony html, o podanym identyfikatorze.
     * @name init
     * @memberOf ILITEAPI
     * @function
     * @param {Object} initCfg - Obiekt json z opcjami startowymi aplikacji
     * @param {String} initCfg.divId - identyfikator(atrybut id) elementu na stronie html, na której odbywa się osadzania imapLite.
     * @param {Int|String} initCfg.width - Szerokość div z mapą w postaci liczby lub np. „100%”
     * @param {Int|String} initCfg.height - Wysokość div z mapą w postaci liczby lub np. „100%”
     * @param {Array} [initCfg.activeGpMaps] - lista dostępnych kompozycji mapowych – tablica identyfikatorów kompozycji odnoszących się do kompozycji zdefiniowanych w elemencie gpmaps w pliku konfiguracyjnym aplikacji (cfg.json)
     * @param {String} [initCfg.activeGpMapId] - identyfikator kompozycji która ładuje się jako pierwsza(startowa kompozycja) – odnosi się do wybranej kompozycji zdefiniowanej w elemencie gpmaps w pliku konfiguracyjnym aplikacji (cfg.json)
     * @param {Array} [initCfg.activeGpActions] - lista dostępnych akcji – tablica identyfikatorów akcji odnoszących się do akcji zdefiniowanych w elemencie gpactions w pliku konfiguracyjnym aplikacji (cfg.json)
     * @param {Int} [initCfg.scale] - startowy poziom skalowy mapy
     * @param {Object|Array} [initCfg.marker] - startowy punkt do którego centruje się mapa. Przykład poniżej. Zamiast pojedynczego markera można podać tablicę takich obiektów. Wtedy na mapie pojawi się więcej niż jeden marker(jeśli tablica będzie zawierać więcej niż jeden obiekt).Obiekt zawiera opcje dymku.
     * @param {String} [initCfg.marker.title] - tytuł dymka
     * @param {String} [initCfg.marker.content] - zawartość dymka(prosty html, ze znacznikami &lt;b&gt; i &lt;a&gt;)
     * @param {Bool} [initCfg.marker.show] - pokazanie się automatycznie dymka, po utworzeniu markera
     * @param {int} [initCfg.marker.deleteTime=-1] - Czas po którym zostanie usunięty marker z mapy; brak oznacza brak automatycznego usunięcia markera
     * @param {String} [initCfg.marker.id='1'] - Identyfikator markera. Służy on do usunięcia konkretnego markera z mapy. Jednak obecna wersja pozwala ustawienie jednego markera na mapie, dlatego ten parametr może na razie być pomijany.
     * @param {Object} [initCfg.initialExtent] - Extent startowy mapy. Przykład poniżej.
     * @param {Bool} [initCfg.useMenu] - false – wyłączy pokazywanie menu na mapce; domyślnie true;
     * @param {Array} [initCfg.selection] - Obiekt do ustawiania selekcji po inicjalizacji mapy.
     * @param {Bool} initCfg.selection.onlyPreview - true – włacza tryb wyświetlania mapy z selekcja bez możliwości jej zmiany poprzez klikanie na mapie
     * @param {Array} initCfg.selection.ids - to tablica zmienna typu string, a dokładnie identyfikatorów; jest wartość pola typu oidField, np. OBJECTID na warstwie; jedna zmienna, może być grupą wartości wymienionych po przecinku np.; "ids":["1,2,3,4,5,6,7,8,9,10", „11”,”12”]
     * @param {String} initCfg.selection.id - identyfikator warstwy pod którą w aplikacji zostanie załadowana warstwa z selekcjami
     * @param {String} initCfg.selection.oidField - nazwa pola będącego identyfikatorem obiektu na warstwie
     * @param {String} initCfg.selection.oidFieldType - string/numer – określa typ pola będącego identyfikatorem  na warstwie
     * @param {String} initCfg.selection.url - url do serwisu z warstwa do selekcji(z niej sa pobierane obiekty podane w ids)
     * @param {String} initCfg.selection.geometryType - point/poligon/polyline; typ geometrii warstwy
     * @param {Bool} initCfg.selection.zoomToSelect - true – oznacza że jeśli zaznaczymy obszar to mapa się do niego przybliży
     * @param {Array} [initCfg.gpplugins] - Jeśli chcemy dołączyć jakiś plugin, a nie mamy go dołączonego w konfiguracji iMapLite, to możemy go dodać podczas inicjonowania mapy, właśnie poprzez podanei tablicy pluginów.
     * @param {callback} [callback] - Jest to funkcja javascript, która będzie wykonana po załadowaniu API oraz wyświetleniu mapy.
     * @example <caption>Przykładowy definicji markera</caption>
     * "center" : {
     *       "x" :  8437470,
     *       "y" :   5881868,
     *       "scale" : 10000,
     *       "title" : „tytuł dymka”,
     *       "content" : „opis dymka”,
     *       "show" : true
     *      }
     * @example <caption>Przykładowy definicji startowego extentu mapy</caption>
     * "initialExtent" : {
     *       "xmin" :  8437470,
     *       "ymin" :   5881868,
     *       "xmax" : 8449579,
     *       "ymax" : 5895526        
     *      }
     */
    function init(icfg, callback) {
        checkConsole();
        checkFunctions();
        ILITEAPI.icfg = icfg;
        ILITEAPI.icfg.api = true;
        var mlen = modules != null && modules !== "undefined" ? modules.length : 0;
        var allcall = function() {
            if (ILITEAPI.modules) {
                map = ILITEAPI.modules.esrimap;

                for (var key in ILITEAPI.modules) {
                    var m = ILITEAPI.modules[key];
                    m.init(function() {
                    });
                }
                console.log("załadowano wszystkie moduły");
            }
            afterLoadAllModules(callback);
        };
        if (mlen > 0) {
            rmodules = 0;

            for (var m = 0; m < mlen; m++) {
                var mn = prefixModuleName + modules[m] + ".js";
                var murl = apiUrl + "js/" + mn;
                loadScript(murl, function() {
                    console.log("załadowano " + mn + " z " + murl);
                    rmodules++;
                    if (rmodules == mlen) {
                        allcall();
                    }
                });
            }
        } else {
            allcall();
        }
    }

    /**
     * Wstawia w punkcie o współrzędnych x i y marker/pinezkę
     * @name showMarker
     * @memberOf ILITEAPI
     * @function
     * @param {Int|Object} x|marker - Współrzędna x markera.|Jako parametr wstawiamy obiekt json z przynajmniej jednym atrybutem. Musi to być atrybut id. Np. ILITEAPI.showMarker({"id" : "marker0"}). Takie wywołanie spowoduje wycentrowanie mapy do punktu, w którym wstawiony  jest marker o zadanym identyfikatorze. Oprócz id, można podać scale, co spowoduje przybliżenie się do danego punktu w danej skali.
     * @param {Int} y - Współrzędna y markera.
     * @param {Object} [opts]
     * @param {String} [opts.id='1'] - identyfikator markera; Jest parametrem wymaganym w przypadku kiedy np. inicjalizujemy aplikację poprzez pokazanie markera na starcie aplikacji i chcemy go potem usunąć używając metody deleteMarker. Brak id, spowoduje automatyczne nadanie identyfikatora w aplikacji.
     * @param {String} [opts.title] - tytuł dymka; przy wyszukiwaniu brak opcji powoduje wyświetlenie standardowego opisu adresu
     * @param {String} [opts.content] - zawartość dymka(prosty html, ze znacznikami &lt;b&gt; i &lt;a&gt;);przy wyszukaniu adresu brak content oznacza standardowy opis dla adresu.
     * @param {Bool} [opts.show] - pokazanie się automatycznie dymka, po utworzeniu markera
     * @param {int} [opts.deleteTime=-1] - Czas po którym zostanie usunięty marker z mapy; brak oznacza brak automatycznego usunięcia markera
     * @param {Bool} opts.show - Jeśli ustawimy zmienną show na true to pokaże się również dymek. Zastąpi on dymek, który ewentualnie był włączony wcześniej(poprzez inicjalizację API, wyszukanie adresy lub wstawienie startowe markera).
     * @param {Int} [sr] - odwzorowanie; dopuszczalne wartości: 2180(układ 1992),4326(WGS84)
     */
    function showMarker(x, y, sr, opts) {
        bindMessageEvents();

        var connIntr = setInterval(function() {
            if (liteConnected) {
                window.clearInterval(connIntr);
                console.log("imap-lite-api showMarker");
                var mattrs = {};

                if ( x instanceof Object && x.id) {
                    mattrs = {
                        "id" : x.id
                    };

                    if (x.scale) {
                        mattrs.scale = x.scale;
                    }

                    if (x.sr) {
                        mattrs.sr = x.sr;
                    }
                } else {
                    if (opts) {
                        opts.center = true;
                    }
                    mattrs = {
                        "x" : x,
                        "y" : y,
                        "sr" : sr,
                        "opts" : opts
                    };
                }

                var json = {
                    "fname" : "showMarker",
                    "arguments" : mattrs
                };
                sendMessage(json);
            }
        }, 250);
    }

    /**
     * Wstawia naraz wiele markerów o w podanych punktach x,y
     * @name showManyMarker
     * @memberOf ILITEAPI
     * @function
     * @param {Array} markers - Jest to tablica obiektów o postaci znanej z metody showMarker
     * @example <caption>Przykład wartosci parametru markres</caption>
     * [
     *  {
     *  "x":591920.9699999997, 
     *  "y":259048.22000000067,
     *  "sr":2180,
     *  "opts":{
     *      "id" : "marker1",
     *      "title" : "marker nr 1",
     *      "content" : "marker nr 1 - tresc",
     *      "show":true,
     *      "center":false
     *      }
     *  },
     *  {
     *  "x":521920.9699999997, 
     *  "y":239048.22000000067,
     *  "sr":2180,
     *  "opts":{
     *      "id" : "marker2",
     *      "title" : "marker nr 2",
     *      "content" : "marker nr 2 - tresc"
     *      }
     *  }
     * ]
     */
    function showManyMarker(markers) {
        bindMessageEvents();

        var connIntr = setInterval(function() {
            if (liteConnected) {
                window.clearInterval(connIntr);
                console.log("imap-lite-api showManyMarker");
                var json = {
                    "fname" : "showManyMarker",
                    "arguments" : {
                        "markers" : markers
                    }
                };
                sendMessage(json);
            }
        }, 250);
    }

    /**
     * Wyszukuje adres lub listę adresów spełniająca zadane parametry
     * wyszukiwania. W przypadku istnienia jednego wyniku następuje wstawienia
     * markera/pinezki w wyszukanym punkcie. W przypadku istnienia wielu
     * wyników, konieczny jest wybór rezultatu z listy. W wybranek lokalizacji
     * następuje wstawienie markera/pinezki.
     * @name searchAddress
     * @memberOf ILITEAPI
     * @function
     * @param {String|Object} search - Parametr podawany w postaci pełnego tekstu lub w postaci obiektu. Np: „Wrocław Legnicka 22” lub {"city" :  "Wrocław","street" :  "Legnicka","number" :  “22”}
     * @param {Object} [opts] - Jeśli ustawimy zmienną show na true to pokaże się również dymek. Zastąpi on dymek, który ewentualnie był włączony wcześniej (wyszukanie adresu lub wstawienie startowego markera). 
     * @param {String} [opts.title] - tytuł dymka; przy wyszukiwaniu brak opcji powoduje wyświetlenie standardowego opisu adresu
     * @param {String} [opts.content] - zawartość dymka(prosty html, ze znacznikami &lt;b&gt; i &lt;a&gt;);przy wyszukaniu adresu brak content oznacza standardowy opis dla adresu.
     * @param {Bool} [opts.show] - pokazanie się automatycznie dymka, po utworzeniu markera
     * @param {int} [opts.deleteTime=-1] - Czas po którym zostanie usunięty marker z mapy; brak oznacza brak automatycznego usunięcia markera
     * @param {String} [opts.id='1'] - Identyfikator markera. Służy on do usunięcia konkretnego markera z mapy. Jednak obecna wersja pozwala ustawienie jednego markera na mapie, dlatego ten parametr może na razie być pomijany.
     * 
     */
    function searchAddress(search, opts) {
        bindMessageEvents();

        var connIntr = setInterval(function() {
            if (liteConnected) {
                window.clearInterval(connIntr);
                console.log("imap-lite-api searchAddress");
                if (opts) {
                    opts.center = true;
                }

                var json = {
                    "fname" : "searchAddress",
                    "arguments" : {
                        "search" : search,
                        "opts" : opts
                    }
                };
                sendMessage(json);
            }
        }, 250);
    }

    /**
     * wyszukiwanie kilku adresów na raz
     */
    function searchManyAddress(search, opts) {
        bindMessageEvents();

        var connIntr = setInterval(function() {
            if (liteConnected) {
                window.clearInterval(connIntr);
                console.log("imap-lite-api searchManyAddress");
                if (opts) {
                    opts.center = true;
                }

                var json = {
                    "fname" : "searchManyAddress",
                    "arguments" : {
                        "search" : search,
                        "opts" : opts
                    }
                };
                sendMessage(json);
            }
        }, 250);
    }

    /**
     * funkcja do wyszukiwania z możliwoscia wskazania funckji do wyszukanai
     * skonfigurowanej w aplikacji(np. searchAddress,searchPRNG,itd.
     */
    function search(functionName, search, opts, callback) {
        bindMessageEvents();

        var connIntr = setInterval(function() {
            if (liteConnected) {
                window.clearInterval(connIntr);
                console.log("imap-lite-api search -> " + functionName);

                var json = {
                    "fname" : "search",
                    "arguments" : {
                        "useCallback" : false,
                        "fname" : functionName,
                        "search" : search,
                        "opts" : opts
                    }
                };
                if (callback) {
                    json.arguments.useCallback = true;
                    var cfname = functionName + "_callback";
                    ILITEAPI.icfg.callbacks[cfname] = function(rdata) {
                        callback(rdata);
                        //po użyciu usuwam z pamieci funckje zwrotna
                        delete ILITEAPI.icfg.callbacks[cfname];
                    };
                }
                sendMessage(json);
            }
        }, 250);
    }

    /**
     * Wyszukuje naraz wiele obiektów(np. adresy). 
     * @name searchManyObjects
     * @memberOf ILITEAPI
     * @function
     * @param {Array} search - Jest to tablica obiektów które podajemy w metodzie searchAddress. Jedyna różnicą jest dodatkowy parametr podawany w obiekcie opts.
     * @param {Object} opts
     * @param {String} opts.layerDesc - identyfikator warstwy; służy do dodatkowego skonfigurowania wyszukiwania; odnosi się do pozycji configu w obiekcie gplayers; dzięki temu możemy wskazać np. url do usługi;
     * @example <caption>Przykład parametrów wywołania</caption>
     * [
     *  {
     *      "search" : "Wrocław Legnicka 20",
     *      "opts":
     *          {
     *              "layerDesc":"geopard.Adresy"
     *          }
     *  },
     *  {
     *      "search" : "Wrocław Rynek 10",
     *      "opts":
     *          {
     *              "layerDesc":"geopard.Adresy"
     *          }
     *  },
     *  {
     *      "search": "Wroclaw Grabiszyńska 100",
     *      "opts":
     *          {
     *              "show":true,
     *              "layerDesc":"geopard.Adresy"
     *          }
     *  }
     * ]
     */
    function searchManyObjects(search, opts) {
        bindMessageEvents();

        var connIntr = setInterval(function() {
            if (liteConnected) {
                window.clearInterval(connIntr);
                console.log("imap-lite-api searchManyObjects");
                if (opts) {
                    opts.center = true;
                }

                var json = {
                    "fname" : "searchManyObjects",
                    "arguments" : {
                        "search" : search,
                        "opts" : opts
                    }
                };
                sendMessage(json);
            }
        }, 250);
    }

    /**
     * Wyszukuje adres lub listę adresów spełniająca zadane parametry
     * wyszukiwania. W przypadku istnienia jednego wyniku następuje wstawienia
     * markera/pinezki w wyszukanym punkcie. W przypadku istnienia wielu
     * wyników, konieczny jest wybór rezultatu z listy. W wybranej lokalizacji
     * następuje wstawienie markera/pinezki.
     */
    function searchPlot(search, opts) {
        bindMessageEvents();

        var connIntr = setInterval(function() {
            if (liteConnected) {
                window.clearInterval(connIntr);
                console.log("imap-lite-api searchAddress");
                if (opts) {
                    opts.center = true;
                }

                var json = {
                    "fname" : "searchPlot",
                    "arguments" : {
                        "search" : search,
                        "opts" : opts
                    }
                };
                sendMessage(json);
            }
        }, 250);
    }

    /**
     * wyszukiwanie adresu i odpowiadajacych mu dzialek lub odwrotnie -
     * wyszukiwanie dzialki i odpowiadajacej jej adres
     */
    function searchAddressAndPlot(search, opts) {
        bindMessageEvents();

        var connIntr = setInterval(function() {
            if (liteConnected) {
                window.clearInterval(connIntr);
                console.log("imap-lite-api searchAddressAndPlot");
                if (opts) {
                    opts.center = true;
                }

                var json = {
                    "fname" : "searchAddressAndPlot",
                    "arguments" : {
                        "search" : search,
                        "opts" : opts
                    }
                };
                sendMessage(json);
            }
        }, 250);
    }

    /**
     * Usuwa marker o identyfikatorze id z mapy.
     * @name deleteMarker
     * @memberOf ILITEAPI
     * @function
     * @param {String} id - Identyfikator markera na mapie który zostanie usunięty
     * @param {Int} [deleteTime] - Czas w ms, po którym zostanie usunięty marker z mapy. Brak oznacza natychmiastowe usuniecie.
     */
    function deleteMarker(id, deleteTime) {
        bindMessageEvents();

        var connIntr = setInterval(function() {
            if (liteConnected) {
                window.clearInterval(connIntr);
                console.log("imap-lite-api searchAddress");
                var json = {
                    "fname" : "deleteMarker",
                    "arguments" : {
                        "id" : id,
                        "deleteTime" : deleteTime
                    }
                };
                sendMessage(json);
            }
        }, 250);
    }

    /**
     * zwraca true jeśli ma być ładowany imapLite (ma być ładowany kiedy podano
     * aktywna gpmape lub przynajmniej marker)
     */
    function isInitalImapLite() {
        if (ILITEAPI.icfg) {

            if (ILITEAPI.icfg.activeGpMapId === "undefined" && ILITEAPI.icfg.marker !== "undefined") {
                return true;
            } else if (ILITEAPI.icfg.activeGpMapId) {
                return true;
            } else {
                return false;
            }
        } else {
            return false;
        }
    }

    /**
     * czynności po załadowaniu wszystkich dodatkowych modułów, jeśli są używane
     */
    function afterLoadAllModules(apicall) {
        deleteFrame();
        var call = function() {
            bindMessageEvents();
        };

        if (!ILITEAPI.icfg) {
            ILITEAPI.icfg = {};
        }

        if (!ILITEAPI.icfg.callbacks) {
            ILITEAPI.icfg.callbacks = {};
        }

        ILITEAPI.icfg.callbacks["api_callback"] = apicall;
        createIframe(ILITEAPI.icfg.divId, call);
    }

    /**
     * odnajduje originHost na potzreby odbierania informacji wysylanych z
     * aplikacji imap-lite(imap-lite.js) do imap-lite-api(core)
     */
    function createOriginHost() {
        try {
            var wnd = iframe.ownerDocument;
            return getSourceWndHost(wnd, apiUrl);
        } catch (err) {
            return apiUrl;
        }
    }

    function deleteFrame() {
        var iframes = document.getElementsByTagName('iframe');
        for (var i = 0; i < iframes.length; i++) {
            if (iframes[i].id == "ifrm") {
                iframes[i].parentNode.removeChild(iframes[i]);
                break;
            }
        }
    }

    function getIframe(divId) {
        if (this.iframe == null || this.iframe === "undefined") {
            this.iframe = createIframe(divId);
        }
        return this.iframe;
    }

    /**
     * utworzenie iframe
     */
    function createIframe(divId, callback) {
        try {
            iframe = document.createElement("iframe");
            iframe.setAttribute("id", "ifrm");

            if (isInitalImapLite() === true) {
                var browserUrl = getBrowserUrl();
                console.log("url dla aplikacji to : ", browserUrl);
                iframe.setAttribute("src", browserUrl);

                var func = function() {
                    console.log('iframe onLoad');
                    if (callback) {
                        callback();
                    }
                };
                if (iframe.addEventListener) {
                    iframe.addEventListener('load', func, true);
                } else if (iframe.attachEvent) {
                    iframe.attachEvent('onload', func);
                }
            }
            var w = ILITEAPI.icfg.width;
            var h = ILITEAPI.icfg.height;

            var style = "width:";
            if (w && h) {
                if ( typeof w === "string") {
                    style += w;
                } else {
                    style += w + "px";
                }
                style += ";height:";
                if ( typeof h === "string") {
                    style += h;
                } else {
                    style += h + "px";
                }
            }
            iframe.setAttribute("style", style);
            var el = document.getElementById(divId);
            el.setAttribute("style", style);
            el.appendChild(iframe);
        } catch (err) {
            console.error("nie utworzono iframe");
            iframe = null;
        }

        ILITEAPI.icfg.originHost = createOriginHost();

        return iframe;
    }

    /**
     * wysyła zapytanie do iframe json - to json z opcjami zapytanie, jednak
     * jest wysylany jako string
     */
    function sendMessage(json) {
        var wnd = iframe.contentWindow;
        var msg = JSON.stringify(json, function(key, val) {
            if ( typeof val === 'function') {
                return val + '';
                // implicitly `toString` it
            }
            return val;
        });
        var host = getImapLiteHost();
        console.log("imap_lite_api -> postMessage", msg, host);
        wnd.postMessage(msg, host);
    }

    /**
     * zwraca host aplikacji imapLite z iframe
     */
    function getImapLiteHost() {
        try {
            var local = iframe.src.split("/");
            local.pop();
            local = local.join("/");
            return local;
        } catch (err) {

        }
        return "";
    }

    function getSourceWndHost(wnd, host) {
        try {
            var local = wnd.location.protocol + "//";
            var local2 = wnd.location.host;
            local2 += wnd.location.pathname;
            var pops = local2.split("/");
            pops.pop();
            return local + pops.join("/");
        } catch (err) {

        }
        // jeśli uruchamiamylocalnie, to wnd.sorurce może byc pusty wtedy
        // umozliwiamy komunikacje
        return "";
    }

    // Called sometime after postMessage is called
    function receiveMessage(event) {
        //console.log("imap_lite_api -> receiveMessage", event);
        var host = getImapLiteHost();
        var loc = getSourceWndHost(event.source, host);
        if (apiCrossDomain === false && loc !== host) {
            console.log("Odebrano message z innej strony niż aplikacja iMapLite! Iframe przyjmuje i wysyla do odpowiedzi do aplikacji iMapLite");
            return;
        }
        var js = null;
        try {
            js = JSON.parse(event.data, function(key, val) {
                if ("selection_callback" === key || "selection_all_callback" === key || "selection_one_callback" === key) {
                    return eval("(" + val + ")");
                }
                return val;
            });
        } catch (err) {

        }
        if ((!js || js == null) && "imapLiteInit" === event.data) {
            addBrowserResizeEvent();
            liteConnected = true;
            if (!ILITEAPI.icfg.callbacks) {
                ILITEAPI.icfg.callbacks = {};
            }
            if (ILITEAPI.icfg.adres_callback) {
                ILITEAPI.icfg.callbacks["adres_callback"] = ILITEAPI.icfg.adres_callback;
                ILITEAPI.icfg.adres_callback = true;
            }
            if (ILITEAPI.icfg.dzialka_callback) {
                ILITEAPI.icfg.callbacks["dzialka_callback"] = ILITEAPI.icfg.dzialka_callback;
                ILITEAPI.icfg.dzialka_callback = true;
            }
            if (ILITEAPI.icfg.search_callback) {
                ILITEAPI.icfg.callbacks["search_callback"] = ILITEAPI.icfg.search_callback;
                ILITEAPI.icfg.search_callback = true;
            }

            if (ILITEAPI.icfg.marker_callback) {
                ILITEAPI.icfg.callbacks["marker_callback"] = ILITEAPI.icfg.marker_callback;
                ILITEAPI.icfg.marker_callback = true;
            }

            var json = {
                "fname" : "apiInit",
                "arguments" : {
                    "icfg" : ILITEAPI.icfg
                }
            };
            sendMessage(json);
        } else {
            try {
                if (js.fname && js.fname.indexOf("callback") != -1) {
                    if (ILITEAPI.icfg.callbacks[js.fname] && ILITEAPI.icfg.callbacks[js.fname] != null) {
                        ILITEAPI.icfg.callbacks[js.fname](js.arguments);
                    }
                }
            } catch (err) {

            }
        }
    }

    /**
     * podpiecie sie pod zdarzenie wysłania wiadomości na poczatku sprawdza czy
     * podpiecie sie juz odbylo
     */
    function bindMessageEvents() {
        if (!bindMsgEvts) {
            console.log("imap_lite_api -> bindMessageEvents");
            if (window.addEventListener) {
                window.addEventListener('message', receiveMessage, false);
            } else if (window.attachEvent) {
                window.attachEvent('onmessage', receiveMessage);
            }
        } else {
            console.log("imap_lite_api -> zabindowano już zdarzenia!");
        }
    }

    /**
     * podpiecie sie pod zdarzenie wysłania wiadomości
     */
    function unbindMessageEvents() {
        bindMsgEvts = false;

        try {
            if (window.addEventListener) {
                window.removeEventListener('message', receiveMessage, false);
            } else if (window.attachEvent) {
                window.detachEvent('message', receiveMessage);
            }
        } catch (err) {

        }
    }

    /**
     * ładowanie dynamiczne biblioteki javascipt
     */
    function loadScript(url, callback) {
        // adding the script tag to the head as suggested before
        var head = document.getElementsByTagName('head')[0];
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = url;

        // then bind the event to the callback function
        // there are several events for cross browser compatibility
        script.onreadystatechange = callback;
        script.onload = callback;

        // fire the loading
        head.appendChild(script);
    }

    /**
     * załadowanie w ramach potrzeby bilioteki javascript
     */
    function require(file, callback) {
        var script = document.getElementsByTagName("script")[0], newjs = document.createElement("script");

        // IE
        newjs.onreadystatechange = function() {
            if (newjs.readyState === "loaded" || newjs.readyState === "complete") {
                newjs.onreadystatechange = null;
                callback();
            }
        };

        newjs.onload = function() {
            callback();
        };

        newjs.src = file;
        script.parentNode.insertBefore(newjs, script);
    }

    /**
     * ładowanie danych w postaci json
     */
    function getData(url, data, success) {
        $.post(url, data, success, "json");
        // $.ajax({
        // type : 'GET',
        // url : url,
        // dataType : "json",
        // beforeSend : function() {
        // if (ILITEAPI.showLoader) {
        // ILITEAPI.showLoader
        // }
        // },
        // complete : function() {
        // if (ILITEAPI.hideLoader) {
        // ILITEAPI.hideLoader();
        // }
        // },
        // error : function(jqXHR, textStatus, errorThrown) {
        // console.log("problem przy ładowaniu cfg", textStatus, errorThrown);
        // console.error(errorThrown);
        // },
        // success : success,
        // crossDomain : true,
        // cache : false
        // });
    }

    ;

    /**
     * przestrzeń nazw dla modułów imapLitApi
     *
     * @param {Object} ns_string
     */
    function namespace(ns_string) {
        var parts = ns_string.split("."), parent = ILITEAPI, i;

        if (parts[0] === "ILITEAPI") {
            parts = parts.slice(1);
        }

        for ( i = 0; i < parts.length; i += 1) {
            if ( typeof parent[parts[i]] === "undefined") {
                parent[parts[i]] = {};
            }
            parent = parent[parts[i]];
        }
        return parent;
    }

    // Return boolean TRUE/FALSE
    function isiPhone() {
        return ((navigator.platform.indexOf("iPhone") != -1) || (navigator.platform.indexOf("iPod") != -1));
    }

    /**
     * funkcja pomocnicza do dowania eventow ma to byc obejscie problemow roznic
     * w przegladarkach
     */
    function addEvent(elem, type, eventHandle) {
        if (elem == null || elem == undefined)
            return;
        if (elem.addEventListener) {
            elem.addEventListener(type, eventHandle, false);
        } else if (elem.attachEvent) {
            elem.attachEvent("on" + type, eventHandle);
        } else {
            elem["on" + type] = eventHandle;
        }
    }

    ;

    /**
     * funkcja pomocnicza do usuwania eventow ma to byc obejscie problemow
     * roznic w przegladarkach
     */
    function removeEvent(elem, type, eventHandle) {
        if (elem == null || elem == undefined)
            return;
        if (elem.removeEventListener) {
            elem.removeEventListener(type, eventHandle);
        } else if (elem.detachEvent) {
            elem.detachEvent("on" + type, eventHandle);
        } else {
            elem["on" + type] = function() {
            };
        }
    }

    ;

    /**
     * dodanie zdarzenia zmiany wymiaru przegladarki
     */
    function addBrowserResizeEvent() {
        if (browserResize === true && resizeBrowserEvent == null) {
            resizeBrowserEvent = function() {
                var w = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
                var h = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;

                var fw = 0;
                var fh = 0;

                var divId = ILITEAPI.icfg.divId;
                var div = document.getElementById(divId);

                if (div && div != null) {
                    fw = div.clientWidth;
                    fh = div.clientHeight;
                }

                var minW = ILITEAPI.icfg.minWidth;
                var minH = ILITEAPI.icfg.minHeight;

                var left = div.offsetLeft;
                var top = div.offsetTop;
                console.log("div top left ", top, left);

                var rW = left + fw;
                var rH = top + fh;

                var nW = rW;
                var nH = rH;

                if (minW) {

                } else {
                    console.log("Nie podano minimalnej szerokosci diva z mapa");

                    if (rW > w) {
                        console.log("trzeba zmniejszyc width diva", rW, w);
                        nW = rW - (rW - w);
                    }
                }

                if (minH) {

                } else {
                    console.log("Nie podano minimalnej wysokosci diva z mapa");
                    if (rH > h) {
                        console.log("trzeba zmniejszyc height diva", rH, h);
                        nH = rH - (rH - h);
                    }
                }

                changeDivSize(div, nW, nH);

                console.log("div size ", fw, fh);
                console.log("api browser resize ", w, h);
            };
            addEvent(window, "resize", resizeBrowserEvent);
        }
    }

    /**
     * wyslanie do ImapLite rzadania zmiany rozmiaru diva co rowniez ma wymusic
     * resize mapy
     */
    function changeDivSize(div, nw, nh) {
        div.style.width = nw + "px";
        div.style.height = nh + "px";

        if (iframe != null) {
            var style = "width:" + nw + "px;height:" + nh + "px";
            iframe.setAttribute("style", style);
        }
        ;

        var json = {
            "fname" : "changeDivSize",
            "arguments" : {
                "nw" : nw,
                "nh" : nh
            }
        };
        sendMessage(json);
    }

    /**
     * Uruchamia geolokalizację
     * @name geolocalize
     * @memberOf ILITEAPI
     * @function
     * @param {Object} [obj] - Działa podobnie, jak narzędzie geolokalizacji wywołane z menu aplikacji. Jedyną różnicą jest to, że jeśli nie zadamy do tej metody żadnego parametru, to wynik lokalizacji pojawi się na mapie i mapa zostanie wycentrowana na nim , ale nie przybliży się do niego. Aby mapa się przybliżyła, do punktu lokalizacji to trzeba do metody podać parametr w postaci: {„scale”:2000}
     */
    function geolocalize(opts) {
        var json = {
            "fname" : "geolocalize",
            "arguments" : opts
        };
        sendMessage(json);
    }

    function fullMapExtent() {
    	var json = {
    		"fname": "fullMapExtent",
    		"arguments": null
    	}
    	sendMessage(json);
    }

    function showQueryWidget() {
    	var json = {
    		"fname": "showQueryWidget",
    		"arguments": null
    	}
    	sendMessage(json);
    }

    /**
     * ustawia markery w podanych punktach i z podanym iopcjami
     */
    function setSelection(selection) {
        bindMessageEvents();

        var connIntr = setInterval(function() {
            if (liteConnected) {
                window.clearInterval(connIntr);
                console.log("imap-lite-api setSelection");
                var json = {
                    "fname" : "setSelection",
                    "arguments" : {
                        "selection" : selection
                    }
                };
                sendMessage(json);
            }
        }, 250);
    }

    /**
     * stan selekcji
     */
    function getSelectionState(selId, handler) {
        bindMessageEvents();

        var connIntr = setInterval(function() {
            if (liteConnected) {
                ILITEAPI.icfg.callbacks["selection_callback"] = handler;
                window.clearInterval(connIntr);
                console.log("imap-lite-api getSelection", selId);
                var json = {
                    "fname" : "getSelectionState",
                    "arguments" : {
                        "id" : selId,
                        "handler" : handler
                    }
                };
                sendMessage(json);
            }
        }, 250);
    }

    function addOneObjectSelectionChange(selId, handler) {
        bindMessageEvents();
        var connIntr = setInterval(function() {
            if (liteConnected) {
                ILITEAPI.icfg.callbacks["selection_one_callback"] = handler;
                window.clearInterval(connIntr);
                console.log("imap-lite-api addOneObjectSelectionChange");
                var json = {
                    "fname" : "addOneObjectSelectionChange",
                    "arguments" : {
                        "id" : selId,
                        "handler" : handler
                    }
                };
                sendMessage(json);
            }
        }, 250);
    }

    function removeOneObjectSelectionChange(selId) {
        bindMessageEvents();
        var connIntr = setInterval(function() {
            if (liteConnected) {
                ILITEAPI.icfg.callbacks["selection_one_callback"] = null;
                window.clearInterval(connIntr);
                console.log("imap-lite-api removeOneObjectSelectionChange");
                var json = {
                    "fname" : "removeOneObjectSelectionChange",
                    "arguments" : {
                        "id" : selId
                    }
                };
                sendMessage(json);
            }
        }, 250);
    }

    function addAllObjectSelectionChange(selId, handler) {
        bindMessageEvents();
        var connIntr = setInterval(function() {
            if (liteConnected) {
                ILITEAPI.icfg.callbacks["selection_all_callback"] = handler;
                window.clearInterval(connIntr);
                console.log("imap-lite-api addAllObjectSelectionChange");
                var json = {
                    "fname" : "addAllObjectSelectionChange",
                    "arguments" : {
                        "id" : selId,
                        "handler" : handler
                    }
                };
                sendMessage(json);
            }
        }, 250);
    }

    function removeAllObjectSelectionChange(selId) {
        bindMessageEvents();
        var connIntr = setInterval(function() {
            if (liteConnected) {
                ILITEAPI.icfg.callbacks["selection_all_callback"] = null;
                window.clearInterval(connIntr);
                console.log("imap-lite-api removeAllObjectSelectionChange");
                var json = {
                    "fname" : "removeAllObjectSelectionChange",
                    "arguments" : {
                        "id" : selId
                    }
                };
                sendMessage(json);
            }
        }, 250);
    }

    /**
     * dodaje handkler do danego zdarzenai i danego narzedzia rysowania
     *
     * @param {Object} toolId
     * @param {Object} eventName
     * @param {Object} handler
     */
    function addDrawToolEventHandler(eventName, handler) {
        bindMessageEvents();
        var connIntr = setInterval(function() {
            if (liteConnected) {
                ILITEAPI.icfg.callbacks[eventName + "_callback"] = handler;
                window.clearInterval(connIntr);
                console.log("imap-lite-api addDrawToolEventHandler");
                var json = {
                    "fname" : "addDrawToolEventHandler",
                    "arguments" : {
                        "eventName" : eventName
                    }
                };
                sendMessage(json);
            }
        }, 250);
    }

    /**
     * usuwanie handlera narzędzia rysowania
     *
     * @param {Object} toolId
     * @param {Object} eventName
     */
    function removeDrawToolEventHandler(eventName) {
        bindMessageEvents();
        var connIntr = setInterval(function() {
            if (liteConnected) {
                ILITEAPI.icfg.callbacks[eventName + "_callback"] = null;
                window.clearInterval(connIntr);
                console.log("imap-lite-api removeDrawToolEventHandler");
                var json = {
                    "fname" : "removeDrawToolEventHandler",
                    "arguments" : {
                        "eventName" : eventName
                    }
                };
                sendMessage(json);
            }
        }, 250);
    }

    return {
        icfg : {},
        isiPhone : isiPhone,
        init : init,
        map : {},
        namespace : namespace,
        require : require,
        geolocalize: geolocalize,
        fullMapExtent: fullMapExtent,
		showQueryWidget: showQueryWidget,
        showMarker : showMarker,
        showManyMarker : showManyMarker,
        search : search,
        searchAddress : searchAddress,
        searchManyAddress : searchManyAddress,
        searchManyObjects : searchManyObjects,
        searchAddressAndPlot : searchAddressAndPlot,
        searchPlot : searchPlot,
        deleteMarker : deleteMarker,
        setSelection : setSelection,
        getSelectionState : getSelectionState,
        addOneObjectSelectionChange : addOneObjectSelectionChange,
        removeOneObjectSelectionChange : removeOneObjectSelectionChange,
        addAllObjectSelectionChange : addAllObjectSelectionChange,
        removeAllObjectSelectionChange : removeAllObjectSelectionChange,
        addDrawToolEventHandler : addDrawToolEventHandler,
        removeDrawToolEventHandler : removeDrawToolEventHandler
    };
})();
