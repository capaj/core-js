'use strict';
// https://github.com/tc39/proposal-iterator-helpers
var $ = require('../internals/export');
var aFunction = require('../internals/a-function');
var anObject = require('../internals/an-object');
var createAsyncIteratorProxy = require('../internals/create-async-iterator-proxy');
var getBuiltIn = require('../internals/get-built-in');

var Promise = getBuiltIn('Promise');

var AsyncIteratorProxy = createAsyncIteratorProxy(function (arg) {
  var state = this;
  var iterator = state.iterator;
  var next = state.next;
  var filterer = state.filterer;

  return new Promise(function (resolve, reject) {
    var loop = function () {
      try {
        Promise.resolve(anObject(next.call(iterator, arg))).then(function (step) {
          try {
            if (anObject(step).done) {
              state.done = true;
              resolve({ done: true, value: undefined });
            } else {
              var value = step.value;
              Promise.resolve(filterer(value)).then(function (selected) {
                selected ? resolve({ done: false, value: value }) : loop();
              }, reject);
            }
          } catch (err) { reject(err); }
        }, reject);
      } catch (error) { reject(error); }
    };

    loop();
  });
});

$({ target: 'AsyncIterator', proto: true, real: true }, {
  filter: function filter(filterer) {
    return new AsyncIteratorProxy({
      iterator: anObject(this),
      filterer: aFunction(filterer)
    });
  }
});
