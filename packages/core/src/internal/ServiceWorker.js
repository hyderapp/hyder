import createDebug from 'debug';
import canIUse from '../canIUse';
import globalRegister from './globalRegister';
import withArgJson from './withArgJson';
import EventInvoker from './EventInvoker';
import guid from './guid';


const debug = createDebug('hyder:ServiceWorker');


const Workers = globalRegister('hyderServiceWorkers', {});
global.hyderServiceInvokeHandler = withArgJson(trigger);


if (getServiceType() === 'webworker') {
  global.onmessage = ({ data }) => {
    const { type } = data;
    if (type === 'serviceInvoke') {
      trigger(data.event);
    } else if (type === 'setDebug') {
      createDebug.enable(data.value);
    }
  };
}


export default class ServiceWorker {
  static get(name) {
    return Workers[name];
  }

  constructor({ name, handler }) {
    Workers[name] = this;
    this.name = name;
    this.listeners = [];
    this.type = getServiceType();
    this.invoker = new EventInvoker('Client', this);
    EventInvoker.register('Service', this, handler);
  }

  on(type, handler) {
    this.listeners.push({ type, handler });
  }

  emit(type, data) {
    debug('emit %s: %o', type, data);

    const event = { id: guid(), name: this.name, type, data };
    const serviceType = this.type;
    if (serviceType === 'webview') {
      global.hyderWebviewInvokeHandler(event);
    } else if (serviceType === 'webworker') {
      global.postMessage({ type: 'webviewInvoke', event });
    } else if (serviceType === 'native') {
      global.hyderbridge.core.webviewInvoke('hyderWebviewInvokeHandler', event);
    } else {
      throw new Error('should not be here');
    }
  }

  invoke(method, args) {
    return this.invoker.invoke(method, args);
  }
}


function trigger(event) {
  const worker = Workers[event.name];
  worker.listeners.forEach(({ type, handler }) => {
    if (type === event.type) {
      debug('handle %s %o', type, event.data);
      handler(event.data);
    }
  });
}


function getServiceType() {
  if (global.document && global.document.createElement &&
      global.hyderWebviewInvokeHandler) {
    return 'webview';
  }

  if (canIUse('core.webviewInvoke')) {
    return 'native';
  }

  return 'webworker';
}

