# Simple JavaScript class for managing events in JavaScript

## Installation

### In a browser

Download [eventbus.min.js](https://raw.githubusercontent.com/krasimir/EventBus/master/lib/eventbus.min.js) and add it to your page.

### In Node

```
npm i eventbusjs -S
```

And then in your code:

```js
var EventBus = require('eventbusjs');
```

## API

### `addEventListener`

```js
// @type - string
// @callback - function
// @scope - the scope where the @callback is defined
EventBus.addEventListener(type, callback, scope)
//or
EventBus.on(type,callback,scope)
//or
EventBus.bind(type,callback,scope)
//or
EventBus.once(type,callback,scope)
//or
//support regex and multi event types
EventBus.on(['click','change',/\w_click/],function(event,value) {
  
});
```

### `removeEventListener`

```js
// @type - string
// @callback - function
// @scope - the scope where the @callback is defined
EventBus.removeEventListener(type, callback, scope)
//or
EventBus.off(type,callback,scope)
//or
EventBus.unbind(type,callback,scope)
```

### `hasEventListener`

```js
// @type - string
// @callback - function
// @scope - the scope where the @callback is defined
EventBus.hasEventListener(type, callback, scope)
//or
EventBus.has(type,calback,scope)
```

### `dispatch`

```js
// @type - string
// @target - the caller
// @args - pass as many arguments as you want
EventBus.dispatch(type, target, args ...)
//or
EventBus.trigger(type,target,args...)
//or
EventBus.emit(type,target,args...)
```

### `getEvents`

For debugging purpose, it prints out the added listeners.

```js
EventBus.getEvents()
```

## Usage

```js
function myFunction(event) {
  console.log("myFunction type=" + event.type);
  //can stop event
  event.stop();
  //can obtain listener arguments
  console.log(event.args);
  
  //can access scope by this
  console.log(this);
  
}
var scope ={
    
};
EventBus.addEventListener("my_function_event", myFunction,scope,1,2,3...);
//or
EventBus.on("my_function_event",myFunction,scope,1,2,3...);

// dispatch event
EventBus.dispatch("my_function_event");
//or
EventBus.trigger("my_function_event");
//or
EventBus.emit("my_function_event");
```

## Keeping the scope

```js
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
```

## Passing additional parameters

```js
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
```

## Example of usage EventBus.removeEventListener

To remove EventListener you have to pass same instance of callback
```js

/* Wrong - callback functions are different instances */
EventBus.addEventListener('EXAMPLE_EVENT', function() {
    console.log('example callback');
});
EventBus.removeEventListener('EXAMPLE_EVENT', function() {
    console.log('example callback');
});

/* Correct - callback function is the same instance */
var handler = function() {
    console.log('example callback');
};
EventBus.addEventListener('EXAMPLE_EVENT', handler);
EventBus.removeEventListener('EXAMPLE_EVENT', handler);
```
