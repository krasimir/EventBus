# Simple JavaScript class for managing events in JavaScript

## Installation

### In a browser

Download [eventbus.min.js](https://raw.githubusercontent.com/bonashen/EventBus/master/lib/eventbus.min.js) and add it to your page.

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

### redirect
```javascript
//@origin is event type or event type array
//@endpoint is target event type or event type array
//@condition redirect condition check
//@processor reset trigger endpoint event arguments
EventBus.redirect(origin,endpoint);

EventBus.redirect(origin,endpoint,condition);

EventBus.redirect(origin,endpoint,condition,processor);

```
### flow
```javascript
EventBus.flow({from:'click',to:'onClick'});
EventBus.flow({from:'click',to:'onClick'},{from:'onClick',to:'labelClick'});
EventBus.flow({from:'click',to:'onClick'},{from:'onClick',to:'labelClick',processor:function(event) {
  event.setEmitArgs(EventBus.slice(arguments,1));
}});
EventBus.flow({from:'click',to:'onClick'},{from:'onClick',to:'labelClick',where:function(event) {
  return event.getLevel()>0;//only receive redirect
}});
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
//or
EventBus("my_function_event");
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
## Example of usage EventBus.redirect
```javascript
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

EventBus.redirect("custom_event","ready");

EventBus.on("ready",t1.doSomething,t1);

t2.ready();

```
## Example of usage EventBus.flow
**flow** method like **redirect**,this method objective for quick and intuitive configuration event flow.
```javascript

var printEventStack = function (event) {
    var p = event;
    console.log("==>current stage:",event.type," event id:",event.id);
    console.log("event flow :",event.flow.getEventIdsPath());
};

EventBus.on("start",function(event) {
        console.log("The game is start...");
    })
    .on("chase",function(event) {
        console.log("overtaken");
        printEventStack(event);//event flow : ready#1012==>start#1013==>chase#1015
        EventBus.emit("overtaken");
    })
    .flow(
        {from:"ready",to:"start"},
            {from:"start",to:"take-flight"},{from:"start",to:"chase"},
        {from:"overtaken",to:"end"} )
    .on("end",function(event) {
        printEventStack(event);//event flow : ready#1012==>start#1013==>chase#1015==>overtaken#1016==>end#1017
        console.log("The game is end.");
    });

EventBus.emit("ready");

```

## Example of Error event handling
focus all error event handling.
```javascript
EventBus.on(EventBus.DEFAULT.ERROR_EVENT_TYPE,function(event,error,listener,triggerArguments) {
  console.log(error);
});

EventBus.on("click",function(event) {
  throw "We are not ready!";
});

EventBus.emit("click");
```

## Example of usage event object
For debugging purpose, print event objects tree.
```javascript
EventBus.redirect("click","onClick");
EventBus.on("onClick",function(event) {
  var e = event;
  while(e){
      console.log(e.getLevel()," event id:",e.id," event object:",e);
      e.stop(); // stop event dispatch.
      e = e.flow.getClosestEvent();//get prior event.
  }
});

EventBus.emit("click");
```

## Example of usage EventBus.plugin
EventBus support define plugin.
```javascript
EventBus.plugin(function(eBus) {
  eBus.fn.newFeature = function() {
      return this;
  };
  
  //define static method
  eBus.newStaticMethod = function() {
    
  };
  
});
```

## Example of usage EventBus aspect
EventBus support before after and around aspect. The aspect code from dojo/aspect module.
```javascript
EventBus.plugin(function(eBus){
    //advice EventBus emit 
    eBus.before("emit",function(event){
        if(event=="ready")
            return eBus.slice(arguments).concat([{name:"new object"}]);//append new object to emit
    });
});
//aspect utils example
var scope = {name:"bona",sayHello:function(message){console.log(this.name,message)}};
var handler = EventBus.aspect.before(scope,"sayHello",function(message) {
  return [[",",message,"!"].join("")];
});
scope.sayHello("hello world");
```