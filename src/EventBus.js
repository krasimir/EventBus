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

    //noinspection JSUnusedAssignment
    var EventBusClass = {};
    EventBusClass = function () {
        this.listeners = {};
    };
    EventBusClass.prototype = {
        addEventListener: function (type, callback, scope) {
            var args = [];
            var numOfArgs = arguments.length;
            for (var i = 0; i < numOfArgs; i++) {
                args.push(arguments[i]);
            }
            args = args.length > 3 ? args.splice(3, args.length - 1) : [];
            if (typeof this.listeners[type] != "undefined") {
                this.listeners[type].push({scope: scope, callback: callback, args: args});
            } else {
                this.listeners[type] = [{scope: scope, callback: callback, args: args}];
            }
        },
        removeEventListener: function (type, callback, scope) {
            if (typeof this.listeners[type] != "undefined") {
                var numOfCallbacks = this.listeners[type].length;
                var newArray = [];
                for (var i = 0; i < numOfCallbacks; i++) {
                    var listener = this.listeners[type][i];
                    if (listener.scope == scope && listener.callback == callback) {

                    } else {
                        newArray.push(listener);
                    }
                }
                this.listeners[type] = newArray;
            }
        },
        hasEventListener: function (type, callback, scope) {
            if (typeof this.listeners[type] != "undefined") {
                var numOfCallbacks = this.listeners[type].length;
                if (callback === undefined && scope === undefined) {
                    return numOfCallbacks > 0;
                }
                for (var i = 0; i < numOfCallbacks; i++) {
                    var listener = this.listeners[type][i];
                    if ((scope ? listener.scope == scope : true) && listener.callback == callback) {
                        return true;
                    }
                }
            }
            return false;
        },
        dispatch: function (type, target) {
            var numOfListeners = 0;
            var event = {
                type: type,
                target: target
            };
            var args = [];
            var numOfArgs = arguments.length;
            var i;
            for (i = 0; i < numOfArgs; i++) {
                args.push(arguments[i]);
            }
            args = args.length > 2 ? args.splice(2, args.length - 1) : [];
            args = [event].concat(args);
            if (typeof this.listeners[type] != "undefined") {
                var numOfCallbacks = this.listeners[type].length;
                for (i = 0; i < numOfCallbacks; i++) {
                    var listener = this.listeners[type][i];
                    if (listener && listener.callback) {
                        var concatArgs = args.concat(listener.args);
                        listener.callback.apply(listener.scope, concatArgs);
                        numOfListeners += 1;
                    }
                }
            }
        },
        filter: function (type, target, value, params) {
            var numOfListeners = 0;
            if (typeof this.listeners[type] != "undefined") {
                var numOfCallbacks = this.listeners[type].length;
                for (var i = 0; i < numOfCallbacks; i++) {
                    var listener = this.listeners[type][i];
                    if (listener && listener.callback) {
                        value = listener.callback.apply(listener.scope, [value, params]);
                        numOfListeners += 1;
                    }
                }
            }
            return value;
        },
        getEvents: function () {
            var str = "";
            for (var type in this.listeners) {
                if (this.listeners.hasOwnProperty(type)) {
                    var numOfCallbacks = this.listeners[type].length;
                    for (var i = 0; i < numOfCallbacks; i++) {
                        var listener = this.listeners[type][i];
                        str += listener.scope && listener.scope.className ? listener.scope.className : "anonymous";
                        str += " listen for '" + type + "'\n";
                    }
                }
            }
            return str;
        }
    };
    return new EventBusClass();
});