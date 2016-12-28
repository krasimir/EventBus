/**
 * Created by bona on 2016/12/28.
 */

var ebus = require('../../lib/eventbus.min');

ebus.before("emit", function (event) {
    console.log("before-emit,event type:", event);
    console.log("closest event path: ", this.getCurrentEvent() ? this.getCurrentEvent().flow.getEventIdsPath() : undefined);
    if(event=="ready")return [event,{name:"new object"}];
});

ebus.after("emit",function (event) {
    console.log("after-emit,event type:",event);
},true);

ebus.on("ready",function (event,o) {
    console.log("ready",o);
});

ebus.redirect("ready","end");

ebus.on("end",function (event,o) {
    console.log("end event,",event,o);
});

ebus.beforeTriggerListener(/end/,function (listener,event,o) {
    console.log("beforeTriggerListener,",event,o);
});

ebus("ready");