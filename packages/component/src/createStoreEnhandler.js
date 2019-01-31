import reduceReducers from 'reduce-reducers';
import dispatchToModel from './dispatch';
import normalizeModel from './normalizeModel';
import { INIT, SET } from './symbols';


export default function createEnhander(innerEnhancer) {
  innerEnhancer = innerEnhancer || (createStore => (...args) => createStore(...args));

  const modelsMap = new Map();
  let boundAddModel;

  const hyderReducer = createHyderReducer();

  const enhancer = createStore => (reducer, preloadedState) => {
    reducer = reduceReducers(hyderReducer, reducer);
    const store = innerEnhancer(createStore)(reducer, preloadedState);
    const dispatch = createDispatch(modelsMap, store);
    const newStore = { ...store, dispatch };
    boundAddModel = model => addModel(modelsMap, model, newStore);
    return newStore;
  };

  enhancer.add = models => {
    if (!boundAddModel) {
      throw new Error('You must add model[s] after mount hyderMiddleware using applyMiddleware.');
    }
    models = Array.isArray(models) ? models : [models];
    models.forEach(boundAddModel);
  };

  return enhancer;
}


function addModel(map, model, store) {
  model = normalizeModel(model);
  if (!model.name) {
    throw new Error('model name required');
  }
  if (map.has(model.name)) {
    throw new Error(`model [${model.name}] already exists.`);
  }

  const stater = {
    get: () => store.getState()[model.name],
    set: (state, cb) => {
      const payload = { name: model.name, state };
      store.dispatch({ type: SET, payload });
      cb();
    }
  };

  map.set(model.name, { model, stater });
  store.dispatch({ type: INIT, payload: model });
}


function createHyderReducer() {
  return (state, { type, payload }) => {
    if (type === INIT || type === SET) {
      // payload: model
      state = { ...state, [payload.name]: payload.state };
    }
    return state;
  };
}


function createDispatch(map, store) {
  const re = /^(.+)\/([^/]+)$/;
  return action => {
    const match = re.exec(action.type);
    if (match && map.has(match[1])) {
      const { model, stater } = map.get(match[1]);
      const type = match[2];
      if (model.effects[type] || model.reducers[type]) {
        const newAction = { ...action, type };
        return dispatchToModel(model, newAction, stater);
      }
    }
    return store.dispatch(action);
  };
}
