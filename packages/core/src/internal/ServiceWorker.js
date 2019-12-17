import createDebug from 'debug';
import canIUse from '../canIUse';
import globalRegister from './globalRegister';
import withArgJson from './withArgJson';
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

  constructor({ name, invoker }) {
    Workers[name] = this;
    this.name = name;
    this.listeners = [];
    this.type = getServiceType();
    handleInvoke(this, invoker);
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


function handleInvoke(self, invoker) {
  self.on('hyderServiceInvoke', async({ id, name, args }) => {
    const finish = (error, data) => {
      if (error) {
        console.error(error);  // eslint-disable-line
        error = { message: error.message, stack: error.stack };  // for serialize to string
      }
      self.emit('hyderServiceInvokeFinish', { id, error, data });
    };
    invoker(name, args).then(
      data => finish(null, data),
      error => finish(error, null)
    );
  });
}

