const DISPATCHER = '@@hyder/dispatcher';


export function replaceDispatcher(fn) {
  global[DISPATCHER] = fn;
}


export default function dispatcher(...args) {
  const fn = global[DISPATCHER] || defaultDispatcher;
  return fn(...args);
};


function defaultDispatcher(model, action, state) {
  const { type } = action;
  const effect = model.effects[type];
  if (effect) {
    return runEffect(effect, action, state);
  }
  const reducer = model.reducers[type];
  if (reducer) {
    return Promise.resolve(reducer(state, action));
  }
  throw new Error('assert false');
}


function runEffect(effect, action, state) {
  return Promise.resolve(state);
}
