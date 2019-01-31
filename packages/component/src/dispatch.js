import * as is from './is';


export default function dispatch(model, action, stater) {
  const { type } = action;
  const effect = model.effects[type];
  if (effect) {
    return runEffect(model, effect, action, stater);
  }

  const reducer = model.reducers[type];
  if (reducer) {
    const nextState = reducer(stater.get(), action);
    return new Promise(resolve => stater.set(nextState, resolve));
  }

  throw new Error('assert false');
}


function runEffect(model, effect, action, stater) {
  const helpers = createHelpers(model, stater);
  const iterator = effect(action, helpers);
  return iteratorToPromise(iterator);
}


const id = v => v;
function createHelpers(model, stater) {
  const select = selector => (selector || id)(stater.get());
  const put = action => dispatch(model, action, stater);
  return { select, put };
}


function iteratorToPromise(iterator) {
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


function resolveValue(value, cb) {
  if (is.promise(value)) {
    return resolvePromise(value, cb);
  }

  if (is.iterator(value)) {
    return resolvePromise(iteratorToPromise(value), cb);
  }

  return cb(null, value);
}


function resolvePromise(value, cb) {
  value.then(data => cb(null, data), err => cb(err));
}
