/**
 * Created by bona on 2016/12/20.
 */

var EventBus = require('../../lib/eventbus.min');

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
        printEventStack(event);
        EventBus.emit("overtaken");
    })
    .flow(
        {from:"ready",to:"start"},
        {from:"start",to:"take-flight"},{from:"start",to:"chase"},
        {from:"overtaken",to:"end"} )
    .on("end",function(event) {
        console.log("The game is end.");
        printEventStack(event);
    });

EventBus.emit("ready");