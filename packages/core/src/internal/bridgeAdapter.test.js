import { current } from './guid';
import bridgeAdapter from './bridgeAdapter';


describe('internal/bridgeAdapter', () => {
  it('test delegate webview message', () => {
    const bridge = global.hyderbridge;
    const fn = jest.fn();
    global.webkit = {
      messageHandlers: {
        HLJJSBridge: {
          postMessage: fn
        }
      }
    };

    bridgeAdapter();

    bridge.core.disableAppCache();
    expect(fn.mock.calls[0][0]).toEqual({
      handler: 'Hyder',
      action: 'closeAppHyder',
      parameters: undefined,
      callbackID: current()
    });
  });
});

