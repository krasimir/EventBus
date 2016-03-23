var EventBus = require('../../lib/eventbus.min');

function myFunction(event) {
  console.log('myFunction type=' + event.type);
}
EventBus.addEventListener('my_function_event', myFunction);
EventBus.dispatch('my_function_event');