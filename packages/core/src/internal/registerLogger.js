import canIUse from '../canIUse';


export default function() {
  if (!canIUse('core.log')) {
    return;
  }

  const levels = ['log', 'error', 'warn', 'info', 'debug'];
  const logger = global.console || (global.console = {});
  levels.forEach(name => {
    const last = logger[name];
    logger[name] = function(msg) {
      last.call(this, msg);
      msg = typeof msg === 'string' ? msg :
        isPlainObject(msg) ? JSON.stringify(msg).substr(0, 300) : msg;
      if (name !== 'log') {
        msg = `[${name}] ${msg}`;
      }
      global.hyderbridge.core.log(msg);
    };
  });
}


function isPlainObject(o) {
  return Object.prototype.toString.call(o) === '[object Object]';
}
