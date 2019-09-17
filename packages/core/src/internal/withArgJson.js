export default function(fn) {
  return function(...args) {
    args = args.map(arg => (isJson(arg) ? JSON.parse(arg) : arg));
    return fn(...args);
  };
}


function isJson(arg) {
  return arg && typeof arg === 'string' && (/^[{[]/).test(arg);
}
