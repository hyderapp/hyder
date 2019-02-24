import * as is from './is';


export default function dispatch(model, action, stater) {
  const { type } = action;
  const effect = model.effects[type];
  if (effect) {
    return runEffect(model, effect, action, stater);
  }

  const reducer = model.reducers[type];
  if (reducer) {
    const prevState = stater.get();
    const nextState = reducer(prevState, action);
    if (prevState !== nextState) {
      stater.set(nextState);
    }
    return Promise.resolve();
  }

  return Promise.reject(new Error(`action not exists: ${action.type}`));
}


function runEffect(model, effect, action, stater) {
  const helpers = createHelpers(model, stater);
  const iterator = effect(action, helpers);

  const resolveValue = (value, cb) => {
    if (is.func(value)) {
      return resolveValue(value(helpers), cb);
    }
    if (is.promise(value)) {
      return resolvePromise(value, cb);
    }
    if (is.iterator(value)) {
      return resolvePromise(iteratorToPromise(value, resolveValue), cb);
    }
    return cb(null, value);
  };

  return iteratorToPromise(iterator, resolveValue);
}


const id = v => v;
function createHelpers(model, stater) {
  const select = selector => (selector || id)(stater.get());
  const put = action => dispatch(model, action, stater);
  return { select, put };
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


function resolvePromise(value, cb) {
  value.then(data => cb(null, data), err => cb(err));
}
