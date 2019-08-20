import * as is from './is';

/*
Model :: {reducers: {Reducer...}, effects: {Effect...}}
Action :: { type: {String}, ... }
Stater :: {get: () -> any, set: (value) -> null}
Dispatcher :: (action) -> any
*/


/**
 * dispatch action
 *
 * @param {Model} model
 * @param {Action} action
 * @param {Stater} stater
 * @param {Dispatcher} fallback
 * @return {Promise}
 */
export default function dispatch(model, action, stater, fallback) {
  fallback = fallback || defaultFallback;

  const { type } = action;
  const effect = model.effects[type];

  if (effect) {
    const helpers = createHelpers(model, stater, fallback);
    return runEffect(effect, action, helpers);
  }

  const reducer = model.reducers[type];
  if (reducer) {
    return runReducer(reducer, action, stater);
  }

  return fallback(action);
}


function defaultFallback(action) {
  return Promise.reject(new Error(`action not found: ${action.type}`));
}


const id = v => v;
function createHelpers(model, stater, fallback) {
  const select = selector => (selector || id)(stater.get());
  const put = action => dispatch(model, action, stater, fallback);
  return { select, put };
}


function runEffect(effect, action, helpers) {
  const iterator = effect(action, helpers);

  const resolveValue = (value, cb) => {
    if (is.promise(value)) {
      return resolvePromise(value, cb);
    }
    if (is.func(value)) {
      return resolveValue(value(helpers), cb);
    }
    if (Array.isArray(value)) {
      value = listToIterator(value);
    }
    if (is.iterator(value)) {
      return resolvePromise(iteratorToPromise(value, resolveValue), cb);
    }
    return cb(null, value);
  };

  return iteratorToPromise(iterator, resolveValue);
}


function iteratorToPromise(iterator, resolveValue) {
  return new Promise((resolve, reject) => {
    const finish = (err, value) => (err ? reject(err) : resolve(value));
    const next = (err, value) => {
      if (err) {
        return reject(err);
      }
      const result = iterator.next(value);
      return resolveValue(result.value, result.done ? finish : next);
    };
    next();
  });
}


function listToIterator(list) {
  return list[Symbol.iterator]();
}


function resolvePromise(value, cb) {
  value.then(data => cb(null, data), err => cb(err));
}


function runReducer(reducer, action, stater) {
  const prevState = stater.get();
  const nextState = reducer(prevState, action);
  if (prevState !== nextState) {
    stater.set(nextState);
  }
  return Promise.resolve();
}
