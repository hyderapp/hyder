export default class EventInvokerHandler {
  constructor() {
    this.handlers = {};
  }

  add(method, fn) {
    if (this.handlers[method]) {
      throw new Error(`handler ${method} already registered`);
    }
    this.handlers[method] = fn;
  }

  handler = (method, param) => {
    const fn = this.handlers[method];
    if (fn) {
      return fn(param);
    }
    return new Error(`unimplemented method ${method}`);
  }
}
