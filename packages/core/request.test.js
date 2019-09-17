import request from './request';


describe('request', () => {
  it('request with fetch in h5', async() => {
    const result = { success: true };
    const fn = mockFetch((url, opts) => {
      expect(url).toBe('https://api.hyder.io/v2/page?id=123');
      expect(opts.method).toBe('GET');
      expect(opts.mode).toBe('cors');
      expect(opts.credentials).toBe('include');
      expect(opts.headers).toEqual({
        Accept: 'application/json',
        'Content-Type': 'application/json; charset=utf-8'
      });
      return result;
    });

    const res = await request({
      env: 'production',
      url: 'https://api.hyder.io/v2/page',
      data: { id: '123' }
    });

    expect(fn).toHaveBeenCalled();
    expect(res).toBe(result);

    fn.restore();
  });


  it('request with native', async() => {
    const last = global.hyderbridge;
    const result = { name: 'hyder', keywords: 'framework' };
    const fn = jest.fn(async({ url, method, headers, data }, success) => {
      expect(url).toBe('https://data.hyder.com/api/product');
      expect(method).toBe('POST');
      expect(headers).toEqual({
        Accept: 'application/json',
        'Content-Type': 'application/json; charset=utf-8',
        Authorization: 'Bearer xxx'
      });
      expect(data).toEqual({
        id: '123'
      });
      await sleep();
      success(JSON.stringify(result));
    });

    global.hyderbridge = {
      data: {
        request: fn
      }
    };

    const res = await request({
      env: 'production',
      url: 'https://data.hyder.com/api/product',
      method: 'post',
      data: { id: '123' },
      headers: {
        Authorization: 'Bearer xxx'
      }
    });

    expect(res).toEqual(result);

    global.hyderbridge = last;
  });
});


function mockFetch(impl) {
  const last = global.fetch;
  const fn = jest.fn(async(...args) => {
    await sleep();
    const data = impl(...args);
    return {
      json: () => Promise.resolve(data)
    };
  });

  global.fetch = fn;
  fn.restore = () => {
    global.fetch = last;
  };
  return fn;
}

function sleep() {
  return new Promise(resolve => setTimeout(resolve), 100);
}
