import React from 'react';
import ReactDOM from 'react-dom';
import { createStore, compose } from 'redux';
import { Provider } from 'react-redux';
import qs from 'query-string';
import {
  createStoreEnhancer,
  replaceDispatch,
  normalizeModel
} from '@hyder/component';
import guid from './internal/guid';
import bridgeAdapter from './internal/bridgeAdapter';
import registerLogger from './internal/registerLogger';
import { patch } from './internal/datadiff';
import globalRegister from './internal/globalRegister';
import EventEmitter from './internal/EventEmitter';
import EventInvokerHandler from './internal/EventInvokerHandler';
import ServiceClient from './internal/ServiceClient';

import canIUse from './canIUse';

const debug = require('debug')('hyder:AppClient ');


// 设计上允许多个产品、多个页面的资源能够被一并预加载到webview中。
const Stores = globalRegister('hyderPagesStores', {});
const Apps = globalRegister('hyderWebviewApps', {});

// TODO
// 根据model取得产品名的临时方案
// 目前我们没有合并多个产品的代码所以没有问题
const defaultName = globalRegister('defaultName', {});

// 注册模块级model的自定义处理
const staterIdMap = globalRegister('staterIdMap', new Map());
const idStaterMap = globalRegister('idStaterMap', new Map());

// 兼容目前ios/android的实现差异，以及和hyder设计的差异
bridgeAdapter();

// 注册日志处理
registerLogger();

replaceDispatch(componentDispatch);


window.hyderDebug = function(name) {
  name = name || defaultName.value;
  const client = ServiceClient.get(name || 'default');
  client.emit('debug');
};


export default function createApp({ plugins = [], name, models, pages, router, serviceType }) {
  debug('createApp %s', name);
  defaultName.value = name;

  const invoker = new EventInvokerHandler();
  const service = createService(name, serviceType, invoker.handler);

  // @hyder 这个model 用于做一些通用组件的交互
  models = [{ name: '@hyder' }].concat(models || []).map(normalizeModel);

  // 初始化插件，能过插件可以扩展hyder
  const app = new EventEmitter();
  Apps[name] = app;
  app.service = service;
  app.invoker = invoker;
  plugins.map(plugin => plugin(app));

  // 目前ios端中使用appcache会造成post请求不可用，因此页面加载好了之后将之关闭掉
  if (canIUse('core.disableAppCache')) {
    debug('disableAppCache');
    window.hyderbridge.core.disableAppCache();
  }

  // native中需要主动通知webview已可用
  if (canIUse('core.triggerWebviewReady')) {
    window.hyderbridge.core.triggerWebviewReady();
  }

  const query = qs.parse(window.location.search.substr(1));
  // 允许预加载webview
  // 目前设计为在url中带参数`hyderPreload=true`表示预加载，不执行渲染
  if (isPreload(name, query)) {
    return;
  }

  // 解析路由，准备渲染页面
  const hyderUrl = query.hyderurl || lastPathPart(window.location.pathname);
  router = router || defaultRouter;
  const route = router(name, hyderUrl, filterQuery(query));
  renderPage(route, { models, pages });
}


function isPreload(name, query) {
  return query.hyderPreload === 'true';
}


function lastPathPart(path) {
  path = path.replace(/\..*$/, '');
  const parts = path.split('/');
  return parts[parts.length - 1];
}


function filterQuery(query) {
  // hyderXXX开头的参数保留框架使用
  const rIgnore = /^hyder/;
  const result = {};
  for (const name in query) {
    if (!rIgnore.test(name)) {
      result[name] = query[name];
    }
  }
  return result;
}


function defaultRouter(name, url, query) {
  return { name, url, query };
}


function createService(name, type, handler) {
  // hyderManifest字段由webpack打包生成插入到html页面
  // 因为service.js是需要动态加载的，所以需要知晓文件名
  // 但是文件名会根据内容不同变化，所以需要webpack介入处理
  const manifest = window.hyderManifest[name];
  const service = manifest.service;

  const serviceClient = new ServiceClient({ name, service, type, handler });
  handleDispatchActionFinish(name, serviceClient);
  return serviceClient;
}


function renderPage(route, { models, pages }) {
  route.path = route.path || 'index';
  debug('render page: %o', route);

  const serviceClient = ServiceClient.get(route.name);
  // native环境下，由客户端主动触发`loadPage`事件，不需要这里通知
  // 可能会在webview初始化前就完成loadPage事件，因此页面打开速度可以更快
  if (serviceClient.getType() !== 'native') {
    serviceClient.emit('loadPage', route);
  }

  const dispatch = createDispatch(serviceClient);
  const storeEnhancer = createStoreEnhancer({ dispatch });

  /* eslint-disable no-underscore-dangle */
  const enhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
  /* eslint-enable */
  const store = createStore(
    v => v,
    enhancers(storeEnhancer)
  );
  storeEnhancer.add(models || []);

  Stores[route.name] = store;

  const View = pages[route.path] || PageNotFound;
  ReactDOM.render(
    <Provider store={store}>
      <View route={route} />
    </Provider>,
    document.getElementById('app')
  );
}


function createDispatch(serviceClient) {
  // use async for promise return
  return async(model, action, stater) => {
    if (action.type === 'load') {
      const state = stater.get();
      debug('set state: %s, %o', model.name, action.payload);
      stater.set({ ...state, ...action.payload });
      return;
    }
    await requestDispatchAction(serviceClient, model, action);
  };
}


async function componentDispatch(model, action, stater) {
  // TODO 需要重构从model得到serviceClient的逻辑
  const serviceClient = ServiceClient.get(defaultName.value);

  debug('dispatch %s %o', model.name, action);
  if (action.type === '@@init') {
    const id = guid();
    staterIdMap.set(stater, id);
    idStaterMap.set(id, stater);
    serviceClient.emit('@@init', { model: model.name, id, state: stater.get() });
  } else if (action.type === 'unmount') {
    const id = staterIdMap.get(stater);
    staterIdMap.delete(stater);
    idStaterMap.delete(id);
    serviceClient.emit('unmount', { model: model.name, id });
  } else {
    const id = staterIdMap.get(stater);
    if (!id) {
      throw new Error('assert false, component not found');
    }
    await requestDispatchAction(serviceClient, model, filterAction(action), id);
  }
}

function filterAction(action) {
  if (action.type === 'mount') {
    // 去掉其他无关的属性
    return { type: action.type, route: action.route };
  }
  return action;
}


function requestDispatchAction(serviceClient, model, action, id) {
  if (!model.name) {
    console.error('model name required: ', model); // eslint-disable-line
    throw new Error('assert false');
  }
  const params = { model: model.name, action, id };
  return serviceClient.invoke('dispatchAction', params);
}


function handleDispatchActionFinish(name, serviceClient) {
  serviceClient.on('dispatchActionFinish', ({ model, id, patches }) => {
    // component类型的dispatch
    if (id) {
      const stater = idStaterMap.get(id);
      stater.set(patch(stater.get(), patches));
      return;
    }

    const store = Stores[name];
    const state = store.getState();
    const data = patch(state[model], patches);
    store.dispatch({
      type: `${model}/load`,
      payload: data
    });
  });
}


const PageNotFound = () => (
  <div className="page-not-found">找不到页面</div>
);

