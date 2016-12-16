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
    onMake: function (event, order) {
        console.log(this.name, "'s order is making. order id=", order.id, " order name:" + order.name);
    },
    onPackage: function (event, order) {
        console.log(this.name, "'s order is packaging. order id=", order.id, " order name:" + order.name);
    },
    onReceive: function (event, order) {
        console.log(this.name, "'s order is received. order id=", order.id, " order name:" + order.name);
    },

    init: function (once) {
        var method = "on";
        if (once) method = 'once';
        EventBus[method]("make/" + this.name, this.onMake, this);
        EventBus[method]("package/" + this.name, this.onPackage, this);
        EventBus[method]("receive/" + this.name, this.onReceive, this);
    }

};

EventBus.on(/\w*\/\w*/, monitor, {name: "kerry"}, /make\/\w*/);

EventBus.on(/\w*\/\w*/, monitor, {name: "peter"}, /package\/\w*/);

EventBus.on("make package receive",function (event,order) {
    console.log(order.id,/*" ",order.name,*/" is ",event.type);
});

function monitor(event, order) {
    var state = event.getArg(3);
    if (state.test(event.type) && order.consumer == this.name) {
        console.log(event.type, " is dispatched! ");
    }
}

EventBus.redirect(/(\w*)\/(\w*)/,function(event){return /(\w*)\/(\w*)/.exec(event.type)[1];});

EventBus.redirect(/send\/(\w*)/,function(event){return "receive/"+/(\w*)\/(\w*)/.exec(event.type)[2];});

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