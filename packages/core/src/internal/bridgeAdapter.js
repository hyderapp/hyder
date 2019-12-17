/**
 * 在native端(包括ios和android), jsbridge的实现会和设计有出入,
 * 比如ios中会实现两个全局对象`hyderbridge_core`和`hyderbridge_data`,
 * 以及webview中调用jsbridge的方式和jscore中调用jsbridge的方式不一致
 * 所以这里统一处理，保证hyder框架核心依赖的API稳定。
 *
 */
import get from './get';
import guid from './guid';


/* eslint dot-notation: 0 */

const bridge = global.hyderbridge || (global.hyderbridge = {});


export default function bridgeAdapter() {
  registerModule('core', 'hyderbridge_core');
  registerModule('data', 'hyderbridge_data');

  if (isInNativeWebview()) {
    delegateWebViewMethod('core', 'triggerWebviewReady');
    delegateWebViewMethod('core', 'serviceInvoke', (name, arg) => {
      arg = arg || {};
      return `${name}('${JSON.stringify(arg)}')`;
    });
  }
}


function registerModule(name, mod) {
  if (typeof global[mod] !== 'undefined') {
    bridge[name] = global[mod];
  }
}


function isInNativeWebview() {
  return !!get(global, 'webkit.messageHandlers.HLJJSBridge.postMessage') && global['hyderbridge_core'];
}


function delegateWebViewMethod(mod, method, transformer, handler, action) {
  handler = handler || 'hyder';
  action = action || method;
  const bag = bridge[mod] || (bridge[mod] = {});
  transformer = transformer || (arg => arg);

  bag[method] = function(...args) {
    global.webkit.messageHandlers.HLJJSBridge.postMessage({
      handler,
      action,
      parameters: transformer(...args),
      callbackID: guid()
    });
  };
}
