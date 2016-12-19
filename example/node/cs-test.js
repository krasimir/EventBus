var EventBus = require('../../lib/eventbus.min');

EventBus.DEFAULT.SHOW_LOG = false;

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
        console.log("============================", "start make ", this.order.id, "==============================");
        EventBus.emit("make/" + this.order.consumer, this.order);
        console.log("============================", "end make ", this.order.id, "==============================");
    },
    package: function () {
        console.log("============================", "start package ", this.order.id, "==============================");
        EventBus.emit("package/" + this.order.consumer, this.order);
        console.log("============================", "end package ", this.order.id, "==============================");
    },
    send: function () {
        console.log("============================", "start send ", this.order.id, "==============================");
        EventBus.emit("send/" + this.order.consumer, this.order);
        console.log("============================", "end send ", this.order.id, "==============================");
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
        console.log(this.name, "is ready to receive order goods. order id=", order.id, " order name:" + order.name);
    },

    init: function (once) {
        var method = "on";
        if (once) method = 'once';
        EventBus[method]("make/" + this.name, this.onMake, this);
        EventBus[method]("package/" + this.name, this.onPackage, this);
        EventBus[method]("receive/" + this.name, this.onReceive, this);
    }

};

EventBus.on(/QC\/\w*/, function (event, order) {
    console.log(order.id, " quality testing");
});

EventBus.on(/\w*\/\w*/, monitor, {name: "kerry"}, /make\/\w*/);

EventBus.on(/\w*\/\w*/, monitor, {name: "peter"}, /package\/\w*/);

EventBus.on("make package receive", function (event, order) {
    console.log(order.id, /*" ",order.name,*/" state is ", event.type);
});

function monitor(event, order) {
    var state = event.getArg(3);
    if (state.test(event.type) && order.consumer == this.name) {
        console.log(event.type, " is dispatched! ");
    }
}

EventBus.redirect(/(\w*)\/(\w*)/, function (event) {
    return /(\w*)\/(\w*)/.exec(event.type)[1];
});

EventBus.redirect(/send\/(\w*)/, function (event) {//map one to one
    return "receive/" + /(\w*)\/(\w*)/.exec(event.type)[2];
});

EventBus.redirect(/send\/(\w*)/, function (event) { //map one to more
    var consumer = /(\w*)\/(\w*)/.exec(event.type)[2];
    return ["trans/" + consumer, "print/" + consumer, "QC/" + consumer];
});

//map more to one
EventBus.redirect(
    [/QC\/\w*/],//origin event type
    "qc-report-collect",//endpoint
    undefined,//condition
    function (event, order) { //processor
        console.log("redirect processor for ", event.id, "==>",
            "origin:", event.getOriginType(), " endpoint:", event.getEndpoint());

        if (order.consumer == "bona") event.setEmitArgs([order, "passed"]);
    }
);

var qcReport = {
    orders: [],
    passed: [],
    print: function () {
        console.log("qc checked order count :", this.orders.length);
        console.log("qc passed order count :", this.passed.length);
    }
};

EventBus.on("qc-report-collect", function (event, order, checkState) {
    this.orders.push(order);
    if (checkState == "passed") this.passed.push(order);
}, qcReport);

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

qcReport.print();