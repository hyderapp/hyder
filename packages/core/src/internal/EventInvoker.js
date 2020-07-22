import guid from './guid';

const debug = require('debug')('hyder:EventInvoker');


export default class EventInvoker {
  static register(name, emitter, handler) {
    emitter.on('hyderInvoke', async({ id, method, args }) => {
      const finish = (error, data) => {
        if (error) {
          console.error(error);  // eslint-disable-line
          error = { message: error.message, stack: error.stack };  // for serialize to string
        }
        emitter.emit('hyderInvokeFinish', { id, error, data });
      };
      handler(method, args).then(
        data => finish(null, data),
        error => finish(error, null)
      );
    });
  }

  constructor(name, emitter) {
    this.name = name;
    this.emitter = emitter;
    this.queue = new Map();
    handleInvoke(this);
  }

  async invoke(method, args) {
    debug('%s invoke %s, %o', this.name, method, args);
    const id = guid();
    const timeout = 10000;  // 10s

    return new Promise((resolve, reject) => {
      const clean = () => this.queue.delete(id);
      this.queue.set(id, (e, data) => {
        debug('%s invoke finish %s, %o', this.name, method);
        clean();
        e ? reject(e) : resolve(data);
      });

      setTimeout(() => {
        clean();
        reject(new Error(`invoke error: ${this.name} ${method}`));
      }, timeout);

      this.emitter.emit('hyderInvoke', { id, method, args });
    });
  }
}

function handleInvoke(self) {
  self.emitter.on('hyderInvokeFinish', ({ id, error, data }) => {
    const cb = self.queue.get(id);
    cb && cb(error, data);
  });
}
