/**
 * Created by bona on 2016/12/12.
 */

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
            }
        };
        for (var i in array) {
            callback(i, array[i], array, iterator);
            if (iterator.isStopped)break;
        }
        if (iterator.isStopped)return iterator.result;
    }

    function slice(array, start, end) {
        if (start > array.length)return [];
        return [].slice.call(array, start == undefined ? 0 : start, end == undefined ? array.length : end) || [];
    }

    function processMultiTypes(type, callback, args) {
        if (typeof type == "string" || type instanceof Array) {
            var types = type;
            if (typeof type == "string") types = type.trim().split(/\s|,/);
            if (types.length > 1) {
                var that = this;
                iterator(types, function (index, type) {
                    args[0] = type;
                    callback.apply(that, args);
                });
                return that;
            } else {
                type = types[0];
            }
        }
        return type;
    }


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
            type = processMultiTypes.call(this, type, this.on, slice(arguments));
            if (type == this)return this;

            var isRegExpType = type instanceof RegExp;
            var eventType = isRegExpType ? type.toString() : type;
            var args = slice(arguments);
            // console.log("listener args is ",args);
            var listener = {//create listener stub
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
         * EventBus.once("click",callback);
         * EventBus.once("click",callback,buttonScope);
         * @param type
         * @param callback
         * @param scope
         * @returns {EventBusClass}
         */
        once: function (type, callback, scope) {
            var bus = this;
            var proxyCallback = function (event) {
                callback.apply(this, slice(arguments));
                bus.off(type, proxyCallback, scope);
            };
            var args = slice(arguments);
            args[1] = proxyCallback;
            return bus.on.apply(bus, args);
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
            type = processMultiTypes.call(this, type, this.off, [undefined, callback, scope]);
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
            // console.log("off event type:", type, " all callback:", allCallback, " all scope:", allScope);
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
                    if (!(listener.eventType == eventType && isRemove(listener))) newArray.push(listener);
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
            // console.log("emit arguments:",arguments);

            var args = slice(arguments);
            type = processMultiTypes.call(this, type, this.emit, args);
            if (type == this)return this;

            var event = {
                type: type,
                target: args.length > 1 ? args[1] : {}//compatibility with older versions
            };
            args = [event].concat(slice(arguments, 1));
            // console.log("emit arguments:",arguments," listener arguments:",args);
            var listeners = [].concat(typeof this.listeners[type] == "undefined" ? [] : this.listeners[type]);

            function dispatchEvent(listeners) {
                var isStop = false;
                event.stop = function () {
                    isStop = true;
                };
                event.getArg = function (index) {
                    if (event.args == undefined || !event.args instanceof Array || event.args.length - 1 < index)return undefined;
                    return event.args[index];
                };
                iterator(listeners, function (index, listener, listeners, iterator) {
                    if (listener && listener.callback) {
                        var listenerArgs = [].concat(args);
                        // console.log("event listener call arguments:",listenerArgs);
                        event.args = [].concat(listener.args);
                        // console.log("fire event listener:", listener);
                        listener.callback.apply(listener.scope, listenerArgs);
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

            dispatchEvent(listeners);
            return this;
        },
        getEvents: function () {
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
    //alis
    EventBusClass.prototype.bind = EventBusClass.prototype.addEventListener = EventBusClass.prototype.on;
    EventBusClass.prototype.unbind = EventBusClass.prototype.removeEventListener = EventBusClass.prototype.off;
    EventBusClass.prototype.trigger = EventBusClass.prototype.dispatch = EventBusClass.prototype.emit;
    EventBusClass.prototype.hasEventListener = EventBusClass.prototype.has;

    var EventBus = new EventBusClass();
    return EventBus;
});