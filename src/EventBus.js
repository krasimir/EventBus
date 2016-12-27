(function (root, factory) {
    if (typeof exports === 'object' && typeof module === 'object')
        module.exports = factory();
    else if (typeof define === 'function' && define.amd)
        define("EventBus", [], factory);
    else if (typeof exports === 'object')
        exports["EventBus"] = factory();
    else
        root["EventBus"] = factory();
})(this, function () {

    function iterator(array, callback) {
        array = array || [];
        var iterator = {
            stop: function (result) {
                this.isStopped = true;
                this.result = result;
            },
            isStopped: false,
            result: undefined
        };
        for (var i in array) {
            callback(i, array[i], array, iterator);
            if (iterator.isStopped)break;
        }
        if (iterator.isStopped)return iterator.result;
    }

    function slice(array, start, end) {
        if (start > array.length)return [];
        return [].slice.call(array, start === undefined ? 0 : start, end === undefined ? array.length : end) || [];
    }

    function processMultiTypes(busObject, busMethod, type, args) {
        if (typeof type == "string" || type instanceof Array) {
            var types = type;
            if (typeof type == "string") types = type.trim().split(EventBusClass.DEFAULT.EVENT_TYPE_SPLIT_EXP);
            if (types.length > 1) {
                iterator(types, function (index, type) {
                    args[0] = type;
                    busMethod.apply(busObject, args);
                });
                return busObject;
            } else {
                type = types[0];
            }
        }
        return type;
    }

    /**
     * id generator
     */
    var nextId = (function () {
        var _id = 1000;
        return function () {
            return ++_id;
        }
    })();

    var EventBusClass = {};
    EventBusClass = function () {
        this.listeners = {};
        this.regexListeners = [];
    };
    EventBusClass.prototype = {
        /**
         * EventBus.on("click",callback);
         * EventBus.on("click",callback,buttonScope);
         * @param type
         * @param callback
         * @param scope
         * @returns {EventBusClass}
         */
        on: function (type, callback, scope) {
            type = processMultiTypes(this, this.on, type, slice(arguments));
            if (type == this)return this;

            var isRegExpType = type instanceof RegExp;
            var eventType = isRegExpType ? type.toString() : type;
            var args = slice(arguments);
            if (EventBusClass.DEFAULT.SHOW_LOG)
                console.log("on=>listener args is ", args);
            var listener = {//create listener stub
                id: nextId(),
                scope: scope || {},
                callback: callback,
                args: args,
                regExp: type,
                eventType: eventType
            };
            if (!isRegExpType) {
                if (typeof this.listeners[eventType] != "undefined") {
                    this.listeners[eventType].push(listener);
                } else {
                    this.listeners[eventType] = [listener];
                }
            } else
                this.regexListeners.push(listener);
            return this;
        },
        /**
         *  EventBus.off("click");  //remove all click listeners
         *  EventBus.off("click",onClick);
         *  EventBus.off("click",onClick,buttonScope);
         *  EventBus.off("click",buttonScope);
         *  EventBus.off("click").off("mousemove");
         * @param type
         * @param callback
         * @param scope
         * @returns {EventBusClass}
         */
        off: function (type, callback, scope) {
            //support EventBus.off(['click',/click/]);
            type = processMultiTypes(this, this.off, type, [undefined, callback, scope]);
            if (type == this)return this;

            var isRegExpType = type instanceof RegExp;
            var eventType = isRegExpType ? type.toString() : type;
            var newArray = [];
            if (typeof callback == "object") {
                scope = callback;
                callback = undefined;
            }
            var allCallback = callback == undefined;
            var allScope = scope == undefined;
            if (EventBusClass.DEFAULT.SHOW_LOG)
                console.log("off=>off event type:", type, " all callback:", allCallback, " all scope:", allScope);
            // console.log("callback:", callback, " scope:", scope);
            function isRemove(listener) {
                return (allCallback ? true : listener.callback == callback) &&
                    (allScope ? true : listener.scope == scope)
            }

            if (!isRegExpType) {
                if (typeof this.listeners[eventType] != "undefined") {
                    if (!(allCallback && allScope))
                        iterator(this.listeners[eventType], function (i, listener) {
                            if (!isRemove(listener)) newArray.push(listener);
                            else {
                                // console.log("remove event listener:", type, listener);
                            }
                        });
                    this.listeners[eventType] = newArray;
                }
            } else {
                iterator(this.regexListeners, function (index, listener) {
                    if (!(listener.eventType === eventType && isRemove(listener))) newArray.push(listener);
                    else {
                        // console.log("remove listener:", type, listener);
                    }
                });
                this.regexListeners = newArray;
            }
            return this;
        },
        /**
         * EventBus.has("click")
         * EventBus.has("click",buttonScope);
         * EventBus.has("click",callback);
         * EventBus.has("click",callback,buttonScope);
         * @param type
         * @param callback
         * @param scope
         * @returns {boolean}
         */
        has: function (type, callback, scope) {
            var isRegExpType = type instanceof RegExp;
            var eventType = isRegExpType ? type.toString() : type;
            var listeners = [].concat(this.listeners[eventType]);
            if (typeof callback == "object") {
                scope = callback;
                callback = undefined;
            }
            if (listeners.length > 0 && !isRegExpType) {

                var numOfCallbacks = listeners.length;
                if (callback === undefined && scope === undefined) {
                    return numOfCallbacks > 0;
                }

                var result = iterator(listeners, function (index, listener, array, iterator) {
                    if ((scope ? listener.scope == scope : true)
                        && (callback ? listener.callback == callback : true)) {
                        iterator.stop(true);
                    }
                });

                if (result)return true;
            } else if (isRegExpType) {
                listeners = [].concat(this.regexListeners);
                var result = iterator(listeners, function (index, listener, array, iterator) {
                    if (listener.regExp.toString() == eventType
                        && (scope ? listener.scope == scope : true)
                        && (callback ? listener.callback == callback : true)) {
                        iterator.stop(true);
                    }
                });
                if (result)return true;
            }
            return false;
        },
        /**
         * EventBus.emit("click");
         * EventBus.emit("click",argument1,...);
         * @param type
         * @returns {EventBusClass}
         */
        emit: function (type) {
            var eventFlow = this.eventFlow = this.eventFlow || [];//event stack.
            var args = slice(arguments);
            type = processMultiTypes(this, this.emit, type, args);
            if (type == this)return this;
            var event = {
                id: type + "#" + nextId(),
                type: type,
                target: args.length > 1 ? args[1] : {}//compatibility with older versions
            };
            args = [event].concat(slice(arguments, 1));
            var listeners = [].concat(typeof this.listeners[type] == "undefined" ? [] : this.listeners[type]);
            var bus = this;

            function dispatchEvent(listeners) {
                var stack = [].concat(eventFlow);
                var isStop = false;
                event.stop = function () {
                    isStop = true;
                };
                event.isStopped = function () {
                    return isStop;
                };
                event.getArg = function (index) {
                    if (event.args == undefined || !event.args instanceof Array || event.args.length - 1 < index)return undefined;
                    return event.args[index];
                };
                event.flow = {
                    getEarlyEvent: function () {
                        return stack.slice(0, 1).shift();
                    },
                    getClosestEvent: function () {
                        return stack.slice(0, stack.length - 1).pop();
                    },
                    getAllEvents: function () {
                        return stack.slice(0);
                    },
                    getEventIdsPath: function (separator) {
                        return stack.map(function (event) {
                            return event.id;
                        }).join(separator || "==>");
                    }
                };

                event.getLevel = function () {
                    return stack.length - 1;
                };

                iterator(listeners, function (index, listener, listeners, iterator) {
                    if (listener && listener.callback) {
                        var listenerArgs = [].concat(args);
                        if (EventBusClass.DEFAULT.SHOW_LOG)
                            console.log("emit=>event listener call arguments:", listenerArgs);
                        event.args = [].concat(listener.args);
                        if (EventBusClass.DEFAULT.SHOW_LOG)
                            console.log("emit=>fire event listener:", listener);
                        try {
                            if (EventBusClass.DEFAULT.SHOW_LOG)
                                console.log("event flow:", event.flow.getEventIdsPath());
                            var emitAspect = bus["beforeEmit"];
                            if (emitAspect && typeof emitAspect == "function") emitAspect.apply(bus, [listener].concat(listenerArgs));
                            listener.callback.apply(listener.scope, listenerArgs);
                            emitAspect = bus["afterEmit"];
                            if (emitAspect && typeof emitAspect == "function") emitAspect.apply(bus, [listener].concat(listenerArgs));
                        } catch (exception) {
                            isStop = true;
                            bus.emit(EventBusClass.DEFAULT.ERROR_EVENT_TYPE, exception, listener, listenerArgs);
                        }
                        if (isStop) iterator.stop();
                    }
                });
            }

            var regexListeners = [].concat(this.regexListeners);

            iterator(regexListeners, function (i, listener) {
                if (listener.regExp.test(type)) {
                    listeners.push(listener);
                }
            });
            eventFlow.push(event);
            dispatchEvent(listeners);
            eventFlow.pop();
            return this;
        },
        getAllEvents: function () {
            var str = "";
            for (var type in this.listeners) {
                var numOfCallbacks = this.listeners[type].length;
                for (var i = 0; i < numOfCallbacks; i++) {
                    var listener = this.listeners[type][i];
                    str += listener.scope && listener.scope.className ? listener.scope.className : "anonymous";
                    str += " listen for '" + type + "'\n";
                }
            }

            iterator([].concat(this.regexListeners), function (index, listener) {
                str += listener.scope && listener.scope.className ? listener.scope.className : "anonymous";
                str += " listen for '" + listener.eventType + "'\n";
            });
            return str;
        }
    };


    var _EventBus_ = new EventBusClass();

    var EventBus = function (event) {
        return _EventBus_.emit.apply(_EventBus_, slice(arguments));
    };

    //support extend.
    EventBus.fn = EventBusClass.prototype;

    /**
     * define EventBus plugin extend
     * examples:
     *  EventBus.plugin(function(eBus){
     *
     *      eBus.fn.newExtend = function(){
     *
     *      };
     *
     *      eBus.newStaticMethod = function(){
     *
     *      }
     *  });
     * @param f
     */
    EventBus.plugin = function (f) {
        f(EventBus);
    };

    EventBus.plugin(function (eBus) {
        //alis
        eBus.fn.bind = eBus.fn.addEventListener = eBus.fn.on;
        eBus.fn.unbind = eBus.fn.removeEventListener = eBus.fn.off;
        eBus.fn.trigger = eBus.fn.dispatch = eBus.fn.emit;
        eBus.fn.hasEventListener = eBus.fn.has;
    });

    //default config
    EventBus.DEFAULT = EventBusClass.DEFAULT = {
        SHOW_LOG: false,
        EVENT_TYPE_SPLIT_EXP: /,|\s/,
        ERROR_EVENT_TYPE: "EMIT_ERROR"
    };

    EventBus.plugin(function (eBus) {

        eBus.fn.getCurrentEvent = function () {
            return [].concat(this.eventFlow).pop();
        };

        eBus.fn.getEarlyEvent = function () {
            return [].concat(this.eventFlow).shift();
        };

        eBus.fn.getClosestEvent = function () {
            return this.getCurrentEvent() ? this.getCurrentEvent().flow.getClosestEvent() : undefined;
        }
    });

    EventBus.plugin(function (eBus) {
        /**
         * EventBus.once("click",callback);
         * EventBus.once("click",callback,buttonScope);
         * @param type
         * @param callback
         * @param scope
         * @returns {EventBusClass}
         */
        eBus.fn.once = function (type, callback, scope) {
            var bus = this;
            var proxyCallback = function (event) {
                callback.apply(this, slice(arguments));
                bus.off(type, proxyCallback, scope);
            };
            var args = slice(arguments);
            args[1] = proxyCallback;
            return bus.on.apply(bus, args);
        }
    });

    EventBus.plugin(function (eBus) {
        /**
         * build event flow
         * EventBus.flow({from:'click',to:'onClick'})
         * EventBus.flow({from:'ready',to:'start'},{from:'start',to:'end'})
         * EventBus.flow({from:'click',to:'onClick',where:function(event){event.getLevel()>1}})
         * @param node is event flow node map config,maybe node map array
         * @return {EventBusClass}
         */
        eBus.fn.flow = function (node) {
            var nodeMap = slice(arguments);
            if (node instanceof Array) nodeMap = node;
            var bus = this;
            iterator(nodeMap, function (index, node) {
                if (node instanceof Object && typeof node == "object" && node['from'] != undefined && node['to'] != undefined) {
                    bus.redirect(node['from'], node['to'], node['where'], node['processor']);
                }
            });
            return bus;
        };
    });

    EventBus.plugin(function (eBus) {
        /**
         * redirect("click","onClick",function(event){return true;});
         * redirect("click","onClick");
         * redirect("click",function(event){return "onClick"},function(event){return true;});
         * redirect(/\w*_click/,"onClick",/btn[0-9]+_click/);
         * @param origin
         * @param endpoint
         * @param condition
         * @param processor processor be called before event redirection
         * @return {EventBusClass}
         */
        eBus.fn.redirect = function (origin, endpoint, condition, processor) {
            var bus = this;
            if (origin == undefined || endpoint == undefined || origin == endpoint)return bus;

            var scope = this.redirectScope = this.redirectScope || {};

            processor = typeof processor == "function" ? processor : function (event) {
                    event.setEmitArgs(EventBus.slice(arguments, 1));//example:  set emit endpoint event arguments
                };
            this.on(origin, (function (endpoint, condition, nextId) {//Unified exception handling by emit method.
                if (condition == undefined)
                    condition = function () { //default all origin event to endpoint event
                        return true;
                    };
                if (condition instanceof RegExp) {//support reg exp as condition
                    var exp = condition;
                    condition = function (event) {
                        return exp.test(event.type);
                    }
                }
                if (typeof condition == "function") {
                    var stack = [];
                    return function (event) {//trigger redirect
                        var args = slice(arguments);
                        if (condition.apply(scope, args)) {//trigger condition check
                            var eventType = typeof endpoint == "function" ? endpoint.apply(scope, args) : endpoint;//dynamic get endpoint
                            if (stack.indexOf(nextId) < 0 && eventType != event.type && eventType != undefined)//check redirect looping
                            {
                                stack.push(nextId);
                                try {
                                    if (typeof eventType == "string") eventType =
                                        eventType.trim().split(EventBusClass.DEFAULT.EVENT_TYPE_SPLIT_EXP);//support string split by SPACE,COMMA char
                                    if (!(eventType instanceof Array)) {
                                        eventType = [eventType];
                                    }
                                    iterator(eventType, function (index, type, array, iterator) {//support endpoint array
                                            if (type != event.type) {
                                                var emitArgs = slice([].concat(args), 1);
                                                event.setEmitArgs = function (args) {
                                                    emitArgs = args;
                                                };
                                                event.getEmitArgs = function () {
                                                    return [].concat(emitArgs);
                                                };
                                                event.getOriginType = function () {
                                                    return origin;
                                                };
                                                event.getEndpoint = function () {
                                                    return type;
                                                };
                                                event.isRedirect = function () {
                                                    return true;
                                                };
                                                event.endpoints = event.endpoints || [];
                                                event.endpoints.push(type);
                                                processor.apply(scope, args);
                                                emitArgs = (emitArgs instanceof Array) ? [""].concat(emitArgs) : [].concat(args);
                                                emitArgs[0] = type;
                                                if (EventBusClass.DEFAULT.SHOW_LOG)
                                                    console.log("redirect=>redirect id:", event.id, " origin:", origin, " ==> endpoint:", type);
                                                bus.emit.apply(bus, emitArgs);//dispatch endpoint event
                                                if (event.isStopped()) iterator.stop(true);
                                            }
                                        }
                                    );
                                } finally {
                                    stack.pop();
                                }
                            } else {
                                throw "redirect origin:" + origin.toString() + " => endpoint:" + endpoint.toString() +
                                "  is looping!";
                            }
                        }
                    }
                }
                else {
                    return function (event) {
                        if (EventBusClass.DEFAULT.SHOW_LOG)
                            console.log("redirect=>redirect condition must set function or RegExp!")
                    }
                }
            })(endpoint, condition, nextId()), scope);
            return bus;
        }
    });

    EventBus.plugin(function (eBus) {
        var aspect_cache={};
        function aspect(name, orientation, fn) {
            var chain = aspect_cache[name] = eBus.isArray(aspect_cache[name])?aspect_cache[name]:[];
            var old_aspect = eBus.fn[name];
            var isFunction = eBus.isFunction(old_aspect);
            // if (!isFunction)return;
            eBus.fn[name] = function () {
                var args = slice(arguments);
                var bus = this;
                var ret;
                if (orientation === "before" || orientation === "around") {
                    ret = fn.apply(bus, [{name: name, orientation: orientation, args: args}]);
                }
                if (isFunction) ret = old_aspect.apply(bus, args);
                if (orientation === "after" || orientation === "around") {
                    ret = fn.apply(bus, [{name: name, orientation: orientation, args: args}, ret]);
                }
                return ret;
            };

            eBus.fn[name].aspect = {
                orientation: orientation,
                next: old_aspect
            };
            return eBus;
        }

        eBus.aspect = aspect;

        /**
         * the handler called before named method invocation
         * @param name
         * @param handler
         * @return {EventBus}
         */
        eBus.before = function (name, handler) {
            return eBus.aspect(name, "before", handler);
        };

        /**
         * the handler called after named method invocation
         * @param name
         * @param handler
         * @return {EventBus}
         */

        eBus.after = function (name, handler) {
            return eBus.aspect(name, "after", handler);
        };

        /**
         * the handler called before and after named method invocation
         * @param name
         * @param handler
         * @return {EventBus}
         */
        eBus.around = function (name, handler) {
            return eBus.aspect(name, "around", handler);
        };
    });

    EventBus.plugin(function (eBus) {
        eBus.fn.beforeEmit = function () {

        };

        eBus.fn.afterEmit = function () {

        };
    });

    var hit = function (object, fn) {
        return function () {
            return fn.apply(object, slice(arguments));
        }
    };

    iterator(EventBusClass.prototype, function (key, fn) {
        if (fn && !EventBus["hasOwnProperty"](key) && typeof fn == "function")
            EventBus[key] = hit(_EventBus_, fn);
    });

    EventBus.plugin(function (eBus) {
        //common utils
        eBus.slice = slice;
        eBus.nextId = nextId;
        eBus.iterator = iterator;
        eBus.hit = hit;
        eBus.isFunction = function (fn) {
            return fn&&typeof fn ==="function";
        };

        eBus.isArray = function (array) {
            return array && array.constructor.name=="Array";
        }

    });

    return EventBus;
});