/**
 * Created by bona on 2016/12/20.
 */

var ebus = require('../../lib/eventbus.min');

var printEventStack = function (event) {
    var p = event;
    console.log("==>current stage:", event.type, " event id:", event.id);
    console.log("event flow :", event.flow.getEventIdsPath());
};

ebus.before("emit", function (handler) {
    console.log("before emit=>", handler);
    // console.log("early event: ", this.getEarlyEvent() ? this.getEarlyEvent().id : undefined);
    console.log("closest event path: ", this.getCurrentEvent() ? this.getCurrentEvent().flow.getEventIdsPath() : undefined);
    handler.remove();
});

ebus.after("beforeEmit", function (handler, result) {
    console.log("after beforeEmit=>", handler);
    console.log("current event path: ", this.getCurrentEvent() ? this.getCurrentEvent().flow.getEventIdsPath() : undefined);
}).remove();

ebus.before("beforeEmit", function (handler) {
    // console.log(handler);
    console.log("beforeEmit,current event path: ", this.getCurrentEvent() ? this.getCurrentEvent().flow.getEventIdsPath() : undefined);
    handler.remove();
});

ebus.on("start", function (event) {
    console.log("The game is start...");
})
    .on("chase", function (event) {
        console.log("overtaken");
        printEventStack(event);
        ebus.emit("overtaken");
    })
    .flow(
        {from: "ready", to: "start"},
        {from: "start", to: "take-flight"}, {from: "start", to: "chase"},
        {from: "overtaken", to: "end"})
    .on("end", function (event) {
        console.log("The game is end.");
        printEventStack(event);
    });

ebus("ready");