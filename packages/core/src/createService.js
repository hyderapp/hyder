import createDebug from 'debug';
import {
  dispatch as dispatchToModel,
  normalizeModel
} from '@hyder/component';
import bridgeAdapter from './internal/bridgeAdapter';
import EventEmitter from './internal/EventEmitter';
import registerLogger from './internal/registerLogger';
import globalRegister from './internal/globalRegister';
import ServiceWorker from './internal/ServiceWorker';
import ServiceWorkerInvoker from './internal/ServiceWorkerInvoker';
import withArgJson from './internal/withArgJson';
import { diff } from './internal/datadiff';


const debug = createDebug('hyder:AppService ');


const Stores = globalRegister('hyderServiceStores', {});
const Apps = globalRegister('hyderServiceApps', {});


bridgeAdapter();
registerLogger();


// 此函数由native调用
// 访问页面时，解析url得到路由，调用此函数完成页面渲染
global.hyder_callback_pageLoad = withArgJson(onPageLoad);

function onPageLoad(route) {
  debug('onPageLoad %o', route);
  const worker = ServiceWorker.get(route.name);
  if (!worker) {
    console.error(`package not found: ${route.name}`);   // eslint-disable-line
    return;
  }

  Apps[route.name].emit('mount', route);

  if (getModelItem(route.name, route.path)) {
    dispatchAction(route.name, route.path, { type: 'mount', route }, null, { pass: true });
  }
}


export default function createService({ plugins = [], name, models }) {
  debug('createService %s', name);

  const invoker = new ServiceWorkerInvoker();
  invoker.add('dispatchAction', ({ model, action, id }) => {
    return dispatchAction(name, model, action, id);
  });

  const worker = new ServiceWorker({ name, invoker: invoker.handler });
  worker.on('loadPage', onPageLoad);
  Stores[name] = createStore(name, models, worker);

  worker.on('debug', () => console.log(Stores[name]));  // eslint-disable-line

  // 初始化插件，通过插件可以扩展hyder
  const app = new EventEmitter();
  app.worker = worker;
  app.invoker = invoker;
  Apps[name] = app;
  plugins.map(plugin => plugin(app));
}


function createStore(group, models, worker) {
  // import by require in 'service.js'
  models = (models || []).map(v => v.default);
  models = [{ name: '@hyder' }].concat(models).map(normalizeModel);

  const map = new Map();
  models.forEach(model => {
    if (!model.name) {
      throw new Error('model name required');
    }
    // react component相关的组件state可能是个function，会在`initState`事件中初始化state
    const state = typeof model.state === 'function' ? null : model.state;
    map.set(model.name, { model, state });
  });

  worker.on('@@init', ({ model, state, id }) => {
    const item = map.get(model);
    if (item) {
      const states = item.states || (item.states = new Map());
      states.set(id, state);
    } else {
      console.error(`model not found: ${model}`);  // eslint-disable-line
    }
  });

  worker.on('unmount', ({ model, id }) => {
    const item = map.get(model);
    if (item) {
      item.states && item.states.delete(id);
    } else {
      console.error(`model not found: ${model}`);  // eslint-disable-line
    }
  });

  return { name: group, models: map };
}


const Stater = {
  get(item, id) {
    if (!id) {
      return item.state;
    }
    return item.states && item.states.get(id);
  },

  set(item, id, value) {
    if (!id) {
      item.state = value;
    } else {
      item.states.set(id, value);
    }
  }
};


async function dispatchAction(group, modelName, action, id, opts = {}) {
  const item = getModelItem(group, modelName);
  if (!item) {
    throw new Error(`model not found: ${modelName}`);
  }

  const { model } = item;
  if (model.effects[action.type] || model.reducers[action.type]) {
    const stater = {
      get: () => Stater.get(item, id),
      set: current => {
        const previous = item.state;
        const patches = diff(previous, current);
        if (patches) {
          Stater.set(item, id, current);
          debug('set state: %s, %o', modelName, current);
          dispatchActionFinish(group, modelName, id, patches);
        }
      }
    };

    const fallback = createFallback(dispatchAction, group);
    try {
      debug('dispatch to model: %s, %o', modelName, action);
      await dispatchToModel(model, action, stater, fallback);
    } catch (e) {
      console.error(e);  // eslint-disable-line
    }

    return;
  }

  if (!opts.pass) {
    console.error(`action not found: ${modelName}/${action.type}`);  // eslint-disable-line
  }
}


// 在effect中可能会调用其他model的action, 目前通过dispatchToModel的fallback完成
function createFallback(dispatch, group) {
  // {model}/${action}
  // exp: 'index/update'
  //  model: 'index', action: 'update'
  const re = /^(.+)\/([^/]+)$/;
  return action => {
    const match = re.exec(action.type);
    if (match) {
      const newAction = { ...action, type: match[2] };
      return dispatch(group, match[1], newAction);
    }
    return Promise.reject(new Error(`action not found: ${action.type}`));
  };
}


function dispatchActionFinish(group, model, id, patches) {
  const worker = ServiceWorker.get(group);
  worker.emit('dispatchActionFinish', { model, id, patches });
}


function getModelItem(group, name) {
  const models = Stores[group].models;
  return models.get(name);
}

