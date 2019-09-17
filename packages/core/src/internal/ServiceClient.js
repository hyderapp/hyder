import scriptjs from 'scriptjs';
import canIUse from '../canIUse';
import globalRegister from './globalRegister';
import withArgJson from './withArgJson';
import guid from './guid';


const debug = require('debug')('hyder:ServiceClient');


// 每个产品包可以注册一个service
const Services = globalRegister('hyderServices', {});


// 被native调用，传进来的参数可能是个json字符串
global.hyderWebviewInvokeHandler = withArgJson(event => {
  const service = Services[event.name];
  if (!service) {
    throw new Error(`service ${event.name} not exist`);
  }
  trigger(service, event);
});


/**
 * 封装不同service运行环境下的相互通信
 * 目前支持 webview, webworker 和 native
 */
export default class ServiceClient {
  static get(name) {
    return Services[name];
  }

  /**
   * @ctor
   * @param {Object}
   *  - service service路径
   *  - type  容器类型, 有 webview, webworker和auto。默认为auto
   */
  constructor({ name, service, type = 'auto' }) {
    Services[name] = this;

    this.name = name;
    this.listeners = [];

    this.invokeQueue = new Map();
    handleInvoke(this);

    if (type === 'auto' && canIUseNativeSerivce()) {
      // native will load service.
      this.type = 'native';
      return;
    }

    if (type !== 'webview' && typeof window.Worker === 'function') {
      this.worker = new window.Worker(service.path);
      this.worker.postMessage({ type: 'setDebug', value: window.localStorage.debug });
      this.type = 'webworker';
      handleWebWorkerMessage(this);

      debug(`load service with webworker: ${service.path}`);
      return;
    }

    this.type = 'webview';
    debug(`load service with script: ${service.path}`);
    this.readyDefer = new Promise(resolve => scriptjs(service.path, resolve));
  }

  getType() {
    return this.type;
  }

  on(type, handler) {
    this.listeners.push({ type, handler });
  }

  emit(type, data) {
    debug('emit %s: %o', type, data);
    const name = this.name;
    const event = { id: guid(), name, type, data };
    if (this.type === 'native') {
      window.hyderbridge.core.serviceInvoke('hyderServiceInvokeHandler', event);
    } else if (this.type === 'webworker') {
      this.worker.postMessage({ type: 'serviceInvoke', event });
    } else { // webview
      this.readyDefer.then(() => {
        window.hyderServiceInvokeHandler(event);
      });
    }
  }

  async invoke(name, args) {
    debug('invoke %s, %o', name, args);
    const id = guid();
    const timeout = 10000;  // 10s

    return new Promise((resolve, reject) => {
      const clean = () => this.invokeQueue.delete(id);
      this.invokeQueue.set(id, (e, data) => {
        debug('invoke finish %s, %o', name, data);
        clean();
        e ? reject(e) : resolve(data);
      });

      setTimeout(() => {
        clean();
        reject(new Error(`ServiceInvokeTimeout ${name}`));
      }, timeout);

      this.emit('hyderServiceInvoke', { id, name, args });
    });
  }
}

// private


function handleWebWorkerMessage(self) {
  self.worker.onmessage = ({ data }) => {
    if (data.type === 'webviewInvoke') {
      const event = data.event;
      trigger(self, event);
    }
  };
}


function trigger(self, event) {
  self.listeners.forEach(({ type, handler }) => {
    if (type === event.type) {
      debug('handle %s: %o', type, event.data);
      handler(event.data);
    }
  });
}


function handleInvoke(self) {
  self.on('hyderServiceInvokeFinish', ({ id, error, data }) => {
    const cb = self.invokeQueue.get(id);
    cb && cb(error, data);
  });
}


function canIUseNativeSerivce() {
  return canIUse('core.serviceInvoke');
}
