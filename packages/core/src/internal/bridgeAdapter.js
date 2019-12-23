/**
 * 在native端(包括ios和android), jsbridge的实现会和设计有出入,
 * 所以这里统一处理，保证hyder框架核心依赖的API稳定。
 *
 * - webview中调用jsbridge的方式和jscore中调用jsbridge的方式不一致
 *
 */
import get from './get';
import guid from './guid';


/* eslint dot-notation: 0 */

const bridge = global.hyderbridge || (global.hyderbridge = {});


export default function bridgeAdapter() {
  if (isInNativeWebview()) {
    delegateWebViewMethod('core', 'triggerWebviewReady');
    delegateWebViewMethod('core', 'serviceInvoke', {
      transformer(name, arg) {
        arg = arg || {};
        return `${name}('${JSON.stringify(arg)}')`;
      }
    });
    delegateWebViewMethod('core', 'disableAppCache', { action: 'closeAppHyder' });
  }
}


function delegateWebViewMethod(mod, method, { handler, action, transformer } = {}) {
  handler = handler || 'Hyder';
  action = action || method;
  const bag = bridge[mod] || (bridge[mod] = {});
  transformer = transformer || (arg => arg);

  bag[method] = function(...args) {
    try {
      global.webkit.messageHandlers.HLJJSBridge.postMessage({
        handler,
        action,
        parameters: transformer(...args),
        callbackID: guid()
      });
    } catch (e) {
      console.error(e.message);  // eslint-disable-line
    }
  };
}


function isInNativeWebview() {
  return !!get(global, 'webkit.messageHandlers.HLJJSBridge.postMessage');
}

