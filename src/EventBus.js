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
    "use strict";
    var undefined;
    var isFunction = function (fn) {
            return fn && typeof fn === "function";
        },

        isArray = function (array) {
            return array && array.constructor.name === "Array";
        },

        hit = function (object, fn) {
            return function () {
                return fn.apply(object, slice(arguments));
            }
        };

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
        if (typeof type == "string" || isArray(type)) {
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
                    if (!isArray(event.args) || event.args.length - 1 < index)return undefined;
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
                            var emitAspect = bus["beforeTriggerListener"];
                            if (isFunction(emitAspect)) emitAspect.apply(bus, [listener].concat(listenerArgs));
                            listener.callback.apply(listener.scope, listenerArgs);
                            emitAspect = bus["afterTriggerListener"];
                            if (isFunction(emitAspect)) emitAspect.apply(bus, [listener].concat(listenerArgs));
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
        }
    };


    var _EventBus_ = new EventBusClass();

    var EventBus = function (event) {
        return _EventBus_.emit.apply(_EventBus_, slice(arguments));
    };

    //support extend.
    EventBus.fn = EventBusClass.prototype;

    //default config
    EventBus.DEFAULT = EventBusClass.DEFAULT = {
        SHOW_LOG: false,
        EVENT_TYPE_SPLIT_EXP: /,|\s/,
        ERROR_EVENT_TYPE: "EMIT_ERROR",
        EXCLUDE_NAMES: ["aspect", "before", "after", "around", "isFunction", "isArray", "hit", "slice", "iterator"]
    };


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
        iterator(EventBusClass.prototype, function (key, fn) {
            if (fn && /*!EventBus["hasOwnProperty"](key) &&*/(!{}["hasOwnProperty"](key)) &&
                isFunction(fn) &&
                EventBusClass.DEFAULT.EXCLUDE_NAMES.indexOf(key) < 0)
                EventBus[key] = hit(_EventBus_, fn);
        });
    };

    EventBus.plugin(function (eBus) {
        //alis
        eBus.fn.bind = eBus.fn.addEventListener = eBus.fn.on;
        eBus.fn.unbind = eBus.fn.removeEventListener = eBus.fn.off;
        eBus.fn.trigger = eBus.fn.dispatch = eBus.fn.emit;
        eBus.fn.hasEventListener = eBus.fn.has;
    });

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
            if (isArray(node)) nodeMap = node;
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

            processor = isFunction(processor) ? processor : function (event) {
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
                if (isFunction(condition)) {
                    var stack = [];
                    return function (event) {//trigger redirect
                        var args = slice(arguments);
                        if (condition.apply(scope, args)) {//trigger condition check
                            var eventType = isFunction(endpoint) ? endpoint.apply(scope, args) : endpoint;//dynamic get endpoint
                            if (stack.indexOf(nextId) < 0 && eventType != event.type && eventType != undefined)//check redirect looping
                            {
                                stack.push(nextId);
                                try {
                                    if (typeof eventType == "string") eventType =
                                        eventType.trim().split(EventBusClass.DEFAULT.EVENT_TYPE_SPLIT_EXP);//support string split by SPACE,COMMA char
                                    if (!(isArray(eventType))) {
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
                                                emitArgs = (isArray(emitArgs)) ? [""].concat(emitArgs) : [].concat(args);
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
        //remember: aspect code from dojo/aspect module
        function advise(dispatcher, type, advice, receiveArguments) {
            var previous = dispatcher[type];
            var around = type == "around";
            var signal;
            if (around) {
                var advised = advice(function () {
                    return previous.advice(this, arguments);
                });
                signal = {
                    remove: function () {
                        if (advised) {
                            advised = dispatcher = advice = null;
                        }
                    },
                    advice: function (target, args) {
                        return advised ?
                            advised.apply(target, args) :  // called the advised function
                            previous.advice(target, args); // cancelled, skip to next one
                    }
                };
            } else {
                // create the remove handler
                signal = {
                    remove: function () {
                        if (signal.advice) {
                            var previous = signal.previous;
                            var next = signal.next;
                            if (!next && !previous) {
                                delete dispatcher[type];
                            } else {
                                if (previous) {
                                    previous.next = next;
                                } else {
                                    dispatcher[type] = next;
                                }
                                if (next) {
                                    next.previous = previous;
                                }
                            }

                            // remove the advice to signal that this signal has been removed
                            dispatcher = advice = signal.advice = null;
                        }
                    },
                    id: dispatcher.nextId++,
                    advice: advice,
                    receiveArguments: receiveArguments
                };
            }
            if (previous && !around) {
                if (type == "after") {
                    // add the listener to the end of the list
                    // note that we had to change this loop a little bit to workaround a bizarre IE10 JIT bug
                    while (previous.next && (previous = previous.next)) {
                    }
                    previous.next = signal;
                    signal.previous = previous;
                } else if (type == "before") {
                    // add to beginning
                    dispatcher[type] = signal;
                    signal.next = previous;
                    previous.previous = signal;
                }
            } else {
                // around or first one just replaces
                dispatcher[type] = signal;
            }
            return signal;
        }

        function aspect(type) {
            return function (target, methodName, advice, receiveArguments) {
                var existing = target[methodName], dispatcher;
                if (!existing || existing.target != target) {
                    // no dispatcher in place
                    target[methodName] = dispatcher = function () {
                        var executionId = dispatcher.nextId;
                        // before advice
                        var args = arguments;
                        var before = dispatcher.before;
                        while (before) {
                            if (before.advice) {
                                args = before.advice.apply(this, args) || args;
                            }
                            before = before.next;
                        }
                        // around advice
                        if (dispatcher.around) {
                            var results = dispatcher.around.advice(this, args);
                        }
                        // after advice
                        var after = dispatcher.after;
                        while (after && after.id < executionId) {
                            if (after.advice) {
                                if (after.receiveArguments) {
                                    var newResults = after.advice.apply(this, args);
                                    // change the return value only if a new value was returned
                                    results = newResults === undefined ? results : newResults;
                                } else {
                                    results = after.advice.call(this, results, args);
                                }
                            }
                            after = after.next;
                        }
                        return results;
                    };
                    if (existing) {
                        dispatcher.around = {
                            advice: function (target, args) {
                                return existing.apply(target, args);
                            }
                        };
                    }
                    dispatcher.target = target;
                    dispatcher.nextId = dispatcher.nextId || 0;
                }
                var results = advise((dispatcher || existing), type, advice, receiveArguments);
                advice = null;
                return results;
            };
        }

        var after = aspect("after");
        /*=====
         after = function(target, methodName, advice, receiveArguments){
         // summary:
         //		The "after" export of the aspect module is a function that can be used to attach
         //		"after" advice to a method. This function will be executed after the original method
         //		is executed. By default the function will be called with a single argument, the return
         //		value of the original method, or the the return value of the last executed advice (if a previous one exists).
         //		The fourth (optional) argument can be set to true to so the function receives the original
         //		arguments (from when the original method was called) rather than the return value.
         //		If there are multiple "after" advisors, they are executed in the order they were registered.
         // target: Object
         //		This is the target object
         // methodName: String
         //		This is the name of the method to attach to.
         // advice: Function
         //		This is function to be called after the original method
         // receiveArguments: Boolean?
         //		If this is set to true, the advice function receives the original arguments (from when the original mehtod
         //		was called) rather than the return value of the original/previous method.
         // returns:
         //		A signal object that can be used to cancel the advice. If remove() is called on this signal object, it will
         //		stop the advice function from being executed.
         };
         =====*/

        var before = aspect("before");
        /*=====
         before = function(target, methodName, advice){
         // summary:
         //		The "before" export of the aspect module is a function that can be used to attach
         //		"before" advice to a method. This function will be executed before the original method
         //		is executed. This function will be called with the arguments used to call the method.
         //		This function may optionally return an array as the new arguments to use to call
         //		the original method (or the previous, next-to-execute before advice, if one exists).
         //		If the before method doesn't return anything (returns undefined) the original arguments
         //		will be preserved.
         //		If there are multiple "before" advisors, they are executed in the reverse order they were registered.
         // target: Object
         //		This is the target object
         // methodName: String
         //		This is the name of the method to attach to.
         // advice: Function
         //		This is function to be called before the original method
         };
         =====*/

        var around = aspect("around");
        /*=====
         around = function(target, methodName, advice){
         // summary:
         //		The "around" export of the aspect module is a function that can be used to attach
         //		"around" advice to a method. The advisor function is immediately executed when
         //		the around() is called, is passed a single argument that is a function that can be
         //		called to continue execution of the original method (or the next around advisor).
         //		The advisor function should return a function, and this function will be called whenever
         //		the method is called. It will be called with the arguments used to call the method.
         //		Whatever this function returns will be returned as the result of the method call (unless after advise changes it).
         // example:
         //		If there are multiple "around" advisors, the most recent one is executed first,
         //		which can then delegate to the next one and so on. For example:
         //		|	around(obj, "foo", function(originalFoo){
         //		|		return function(){
         //		|			var start = new Date().getTime();
         //		|			var results = originalFoo.apply(this, arguments); // call the original
         //		|			var end = new Date().getTime();
         //		|			console.log("foo execution took " + (end - start) + " ms");
         //		|			return results;
         //		|		};
         //		|	});
         // target: Object
         //		This is the target object
         // methodName: String
         //		This is the name of the method to attach to.
         // advice: Function
         //		This is function to be called around the original method
         };
         =====*/

        /**
         * The provided advising function will be called before the main method is called
         * @param methodName
         * @param advisingFunction
         * @return {Handler}
         */
        eBus.before = function (methodName, advisingFunction) {
            return before(_EventBus_, methodName, advisingFunction);
        };

        /**
         * The provided advising function will be called after the main method is called
         * @param methodName
         * @param advisingFunction
         * @param receiveArguments
         * @return {Handler}
         */

        eBus.after = function (methodName, advisingFunction, receiveArguments) {
            return after(_EventBus_, methodName, advisingFunction, receiveArguments);
        };

        /**
         * the advisingFactory called before and after named method invocation
         * @param name
         * @param advisingFactory
         * @return {Handler}
         */
        eBus.around = function (name, advisingFactory) {
            return eBus.aspect(_EventBus_, name, advisingFactory);
        };

        eBus.aspect = {
            around: around,
            before: before,
            after: after
        }
    });

    EventBus.plugin(function (eBus) {
        /**
         * the stub called before listener trigger
         * @param listener
         * @param event
         * @param otherListenerArg..
         */
        eBus.fn.beforeTriggerListener = function (listener, event, otherListenerArg) {

        };
        /**
         * the stub called after listener trigger
         * @param listener
         * @param event
         * @param otherListenerArg..
         */
        eBus.fn.afterTriggerListener = function (listener, event, otherListenerArg) {

        };

        eBus.DEFAULT.EXCLUDE_NAMES.push("beforeTriggerListener", "afterTriggerListener");

        function isMatch(eventType, event, condition, args) {
            if (typeof eventType == "string") {
                eventType = new RegExp(eventType);
            }
            return eBus.isFunction(condition) ?
                (eventType.test(event.type) && condition.apply(this, args)) :
                eventType.test(event.type)
        }

        eBus.beforeTriggerListener = function (eventType, fn, condition) {
            return eBus.before("beforeTriggerListener", function (listener, event) {
                if (isMatch(eventType, event, condition, slice(arguments)))
                    return fn.apply(this, eBus.slice(arguments));
            });
        };

        eBus.afterTriggerListener = function (eventType, fn, condition) {
            return eBus.before("afterTriggerListener", function (listener, event) {
                if (isMatch(eventType, event, condition, slice(arguments)))
                    return fn.apply(this, eBus.slice(arguments));
            });
        };
    });

    EventBus.plugin(function (eBus) {
        //common utils
        eBus.slice = slice;
        eBus.nextId = nextId;
        eBus.iterator = iterator;
        eBus.hit = hit;
        eBus.isFunction = isFunction;
        eBus.isArray = isArray;
    });

    return EventBus;
});