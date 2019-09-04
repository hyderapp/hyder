import qs from 'querystring';
import canIUse from './canIUse';


/**
 * 请求数据接口
 * 1. 如果jsbridge支持`data.request`，则使用jsbridge访问;
 * 2. 否则使用`fetch`访问。
 *
 * @param {Object} options
 *  - url
 *  - method      默认为get
 *  - data        请求数据, get方式也支持
 *  - headers
 * @return {Promise}
 */
export default function({
  // env,
  url,
  method,
  data,
  headers
}) {
  // env = env || process.env.NODE_ENV || 'development';
  method = (method || 'get').toUpperCase();

  if (method === 'GET' && data) {
    url = join(url, data);
    data = null;
  }

  headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json; charset=utf-8',
    ...headers
  };

  if (canIUse('data.request')) {
    return requestWithNative(url, method, data, headers);
  }

  return requestWithFetch(url, method, data, headers);
}


function join(url, data) {
  data = typeof data === 'string' ? data : qs.stringify(data);
  return url + (url.indexOf('?') === -1 ? '?' : '&') + data;
}


function requestWithNative(url, method, data, headers) {
  return new Promise((resolve, reject) => {
    const opts = { url, method, headers, data };
    global.hyderbridge.data.request(
      opts,
      o => resolve(o && JSON.parse(o)),
      o => reject(o && JSON.parse(o))
    );
  });
}


function requestWithFetch(url, method, data, headers) {
  return global.fetch(url, {
    method,
    mode: 'cors',
    credentials: 'include',
    headers,
    body: data && JSON.stringify(data)
  }).then(res => res.json());
}
