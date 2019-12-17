import { current } from './guid';
import bridgeAdapter from './bridgeAdapter';


describe('internal/bridgeAdapter', () => {
  it('test bridge for core and data', () => {
    const core = global.hyderbridge_core = {};
    const data = global.hyderbridge_data = {};

    bridgeAdapter();
    expect(global.hyderbridge.core).toBe(core);
    expect(global.hyderbridge.data).toBe(data);
  });


  it('test delegate webview message', () => {
    const bridge = global.hyderbridge;
    expect(bridge.core.triggerWebviewReady).toBeUndefined();

    const fn = jest.fn();
    global.webkit = {
      messageHandlers: {
        HLJJSBridge: {
          postMessage: fn
        }
      }
    };

    bridgeAdapter();
    bridge.core.triggerWebviewReady();

    expect(fn.mock.calls[0][0]).toEqual({
      handler: 'hyder',
      action: 'triggerWebviewReady',
      parameters: undefined,
      callbackID: current()
    });

    fn.mockReset();

    bridge.core.serviceInvoke('testInvoke', { name: 'hyder' });
    expect(fn.mock.calls[0][0]).toEqual({
      handler: 'hyder',
      action: 'serviceInvoke',
      parameters: `testInvoke('${JSON.stringify({ name: 'hyder' })}')`,
      callbackID: current()
    });
  });
});

