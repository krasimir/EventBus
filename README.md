# Simple JavaScript class for managing events in JavaScript

## API

    // adds event listener
    // @type - string
    // @callback - function
    // @scope - the scope where the @callback is defined
    EventBus.addEventListener(type, callback, scope)

    // removes event listener
    // @type - string
    // @callback - function
    // @scope - the scope where the @callback is defined
    EventBus.removeEventListener(type, callback, scope)

    // checks for listener
    // @type - string
    // @callback - function
    // @scope - the scope where the @callback is defined
    EventBus.hasEventListener(type, callback, scope)

    // dispatch an event
    // @type - string
    // @target - the caller
    // @args - pass as many arguments as you want
    EventBus.dispatch(type, target, args ...)

    // for debugging purpose, it just prints out the added listeners
    EventBus.getEvents()
    
## Usage

    function myFunction(event) {
        console.log("myFunction type=" + event.type);
    }
    EventBus.addEventListener("my_function_event", myFunction);
    EventBus.dispatch("my_function_event");

## Keeping the scope

    var TestClass1 = function() {
        this.className = "TestClass1";
        this.callback = function(event) {
            console.log(this.className + " = type:" + event.type + " / dispatcher:" + event.target.className);
        }
    };
    var TestClass2 = function() {
        this.className = "TestClass2";
        this.dispatchOurEvent = function() {
            EventBus.dispatch("callback_event", this);
        }
    };
    var t1 = new TestClass1();
    var t2 = new TestClass2();
    EventBus.addEventListener("callback_event", t1.callback, t1);
    t2.dispatchOurEvent();

## Passing additional parameters

    var TestClass1 = function() {
        this.className = "TestClass1";
        this.doSomething = function(event, param1, param2) {
            console.log(this.className + ".doSomething");
            console.log("type=" + event.type);
            console.log("params=" + param1 + param2);
            console.log("coming from=" + event.target.className);
        }
    };
    var TestClass2 = function() {
        this.className = "TestClass2";
        this.ready = function() {
            EventBus.dispatch("custom_event", this, "javascript events", " are really useful");
        }
    };

    var t1 = new TestClass1();
    var t2 = new TestClass2();

    EventBus.addEventListener("custom_event", t1.doSomething, t1);
    t2.ready();

