const Listeners = '$$hyder_event_listeners';


export default class EventEmitter {
  constructor() {
    this[Listeners] = [];
  }

  on(name, handler) {
    this[Listeners].push({ name, handler });
  }

  emit(event, ...args) {
    this[Listeners].forEach(({ name, handler }) => {
      if (event === name) {
        handler(...args);
      }
    });
  }
}
