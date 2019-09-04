import ServiceClient from './ServiceClient';
import ServiceWorker from './ServiceWorker';
import Invoker from './ServiceWorkerInvoker';


jest.mock('scriptjs');
const scriptjs = require('scriptjs');

scriptjs.mockImplementation((url, cb) => {
  setTimeout(cb, 100);
});


describe('service', () => {
  it('use service with event', async() => {
    const [client, worker] = createService({ name: 'test', type: 'webview' });
    expect(client.type).toBe('webview');
    expect(worker.type).toBe('webview');

    // clent --> worker
    const loadPage = jest.fn();
    worker.on('loadPage', loadPage);
    // emit before script loaded is also ok.
    client.emit('loadPage', { route: { name: 'studio', path: 'index' } });

    await sleep(100);
    // wait script loaded
    expect(loadPage.mock.calls[0]).toEqual([
      {
        route: {
          name: 'studio',
          path: 'index'
        }
      }
    ]);

    // worker --> client
    const postData = jest.fn();
    client.on('postData', postData);
    worker.emit('postData', { name: 'hyder' });
    // in h5, called immediately
    expect(postData.mock.calls[0]).toEqual([
      { name: 'hyder' }
    ]);
  });


  it('invoke woker function', async() => {
    const invoker = jest.fn(async(name, args) => {
      if (name === 'sum') {
        return args.reduce((acc, v) => acc + v, 0);
      }
      if (name === 'id') {
        return args;
      }
      return null;
    });

    const [client, worker] = createService({ name: 'test', type: 'webview', invoker });
    expect(worker.type).toBe('webview');

    const s = await client.invoke('sum', [1, 2, 3, 4]);
    expect(s).toBe(10);

    const args = { name: 'hyder' };
    const v = await client.invoke('id', args);
    // in webview(no webworker), invoke direct, result should not serilize for performance.
    expect(v).toBe(args);
  });


  it('extend invoke function', async() => {
    const invoker = new Invoker();
    const [client] = createService({ name: 'test', type: 'webview', invoker: invoker.handler });

    invoker.add('sum', items => {
      return Promise.resolve(
        items.reduce((acc, v) => acc + v, 0)
      );
    });

    const s = await client.invoke('sum', [1, 2, 3, 4]);
    expect(s).toBe(10);
  });
});


function createService({ name, type, invoker }) {
  const service = { path: 'test.js' };
  const client = new ServiceClient({ name, service, type });
  const worker = new ServiceWorker({ name, invoker });
  return [client, worker];
}


function sleep(timeout) {
  return new Promise(resolve => setTimeout(resolve, timeout));
}
