import request from './request';


describe('request', () => {
  it('get in h5', async() => {
    const result = { success: true };
    const fn = mockFetch((url, opts) => {
      expect(url).toBe('https://api.hyder.io/v2/page?id=123');
      expect(opts.method).toBe('GET');
      expect(opts.mode).toBe('cors');
      expect(opts.credentials).toBe('include');
      return result;
    });

    const res = await request({
      url: 'https://api.hyder.io/v2/page',
      data: { id: '123' }
    });

    expect(fn).toHaveBeenCalled();
    expect(res).toBe(result);

    fn.restore();
  });


  it('post in h5', async() => {
    const postData = { name: 'hyder', version: '1.0' };

    const fn = mockFetch((url, opts) => {
      expect(opts.method).toBe('POST');
      expect(opts.headers).toEqual({
        'Content-Type': 'application/json'
      });
      expect(opts.body).toEqual(JSON.stringify(postData));
      return { success: false };
    });

    const res = await request({
      url: '/save',
      method: 'post',
      data: postData
    })
    expect(res).toEqual({ success: false });

    fn.restore();
  });


  it('post in h5 with contentType=form', async() => {
    const fn = mockFetch((url, opts) => {
      expect(opts.headers).toEqual({
        'Content-Type': 'application/x-www-form-urlencoded'
      });
      expect(opts.body).toEqual('name=hyder&version=1.0');
      return { success: true };
    });

    const res = await request({
      url: '/save/form',
      method: 'post',
      contentType: 'form',
      data: { name: 'hyder', version: '1.0' }
    });

    expect(fn).toHaveBeenCalled();
    expect(res).toEqual({ success: true });

    fn.restore();
  });


  it('request in native', async() => {
    const last = global.hyderbridge;
    const result = { name: 'hyder', keywords: 'framework' };
    const fn = jest.fn(async({ url, method, headers, data }, success) => {
      expect(url).toBe('https://data.hyder.com/api/product');
      expect(method).toBe('POST');
      expect(headers).toEqual({
        'Content-Type': 'application/json',
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
