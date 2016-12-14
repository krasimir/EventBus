/**
 * Created by bona on 2016/12/14.
 */
var EventBus = require('../../lib/eventbus.min');

var Order = function (id, name, consumer) {
    this.id = id;
    this.name = name;
    this.consumer = consumer;
};

var Producer = function (order) {
    this.order = order;
};

Producer.prototype = {

    make: function () {
        EventBus.emit("make/" + this.order.consumer, this.order);
    },
    package: function () {
        EventBus.emit("package/" + this.order.consumer, this.order);
    },
    send: function () {
        EventBus.emit("send/" + this.order.consumer, this.order);
    }
};

var Consumer = function (name, once) {
    this.name = name;
    this.init(once);
};

Consumer.prototype = {
    onMake: function (event, thing) {
        console.log(this.name, "'s order is making. order id=", thing.id, " order name:" + thing.name);
    },
    onPackage: function (event, thing) {
        console.log(this.name, "'s order is packaging. order id=", thing.id, " order name:" + thing.name);
    },
    onReceive: function (event, thing) {
        console.log(this.name, "'s order is finished. order id=", thing.id, " order name:" + thing.name);
    },

    init: function (once) {
        var method = "on";
        if (once) method = 'once';
        EventBus[method]("make/" + this.name, this.onMake, this);
        EventBus[method]("package/" + this.name, this.onPackage, this);
        EventBus[method]("send/" + this.name, this.onReceive, this);
    }

};

EventBus.on(/\w*\/\w*/, monitor, {name: "kerry"}, /make\/\w*/);

EventBus.on(/\w*\/\w*/, monitor, {name: "peter"}, /package\/\w*/);

function monitor(event, order) {
    var state = event.getArg(3);
    if (state.test(event.type) && order.consumer == this.name) {
        console.log(event.type, " is dispatched! ");
    }
}

new Consumer("peter");
new Consumer("kerry");
new Consumer("bona", true);

for (var i = 0; i < 4; i++) {
    var order = new Order("order-" + (i + 1), "wa-li robot", ["peter", "kerry", "bona", "bona"][i]);
    var maker = new Producer(order);
    maker.make();
    maker.package();
    maker.send();
}