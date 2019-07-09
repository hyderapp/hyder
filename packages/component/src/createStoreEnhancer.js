import reduceReducers from 'reduce-reducers';
import defaultDispatch from './dispatch';
import normalizeModel from './normalizeModel';
import { INIT, SET } from './symbols';


/**
 * create redux enhancer for hyderapp
 *
 * @param {Object} - opts
 *  - dispatch :: (resolver, action, stater) -> Promise
 */
export default function createStoreEnhancer(opts = {}) {
  const dispatchToModel = opts.dispatch || defaultDispatch;
  const modelsMap = new Map();
  let boundAddModel;

  const hyderReducer = createHyderReducer();

  const enhancer = createStore => (reducer, preloadedState) => {
    reducer = reduceReducers(hyderReducer, reducer);
    const store = createStore(reducer, preloadedState);
    const dispatch = createDispatch(modelsMap, store, dispatchToModel);
    const newStore = { ...store, dispatch };
    boundAddModel = model => addModel(modelsMap, model, newStore);
    return newStore;
  };

  enhancer.add = models => {
    if (!boundAddModel) {
      throw new Error('You must add model[s] after mount hyderStoreEnhancer using createStore.');
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
    set: state => {
      const payload = { name: model.name, state };
      store.dispatch({ type: SET, payload });
    }
  };

  map.set(model.name, { model, stater });
  store.dispatch({ type: INIT, payload: model });
}


function createHyderReducer() {
  return (state, { type, payload }) => {
    if (type === INIT || type === SET) {
      state = { ...state, [payload.name]: payload.state };
    }
    return state;
  };
}


function createDispatch(map, store, dispatchToModel) {
  // {model}/${action}
  // exp: 'index/update'
  //  model: 'index', action: 'update'
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

