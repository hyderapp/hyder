import qs from 'query-string';
import 'isomorphic-fetch';
import canIUse from './canIUse';


/**
 * 请求数据接口
 * 1. 如果jsbridge支持`data.request`，则使用jsbridge访问;
 * 2. 否则使用`fetch`访问。
 *
 * @param {Object} options
 *  - url
 *  - method      默认为get
 *  - contentType 可以为form, 默认为空
 *  - headers     请求头
 *  - data        请求数据, get方式也支持
 * @return {Promise}
 */
export default function({
  url,
  method = 'get',
  contentType,
  headers,
  data
}) {
  method = method.toUpperCase();
  if (method === 'GET' && data) {
    url = join(url, data);
    data = null;
  } else if (isUpdate(method)) {
    headers = attachHeaders(headers, contentType);
  }

  if (canIUse('data.request')) {
    return requestWithNative(url, method, data, headers);
  }

  return requestWithFetch(url, method, data, headers);
}


function join(url, data) {
  data = typeof data === 'string' ? data : qs.stringify(data);
  return url + (url.indexOf('?') === -1 ? '?' : '&') + data;
}


function isUpdate(method) {
  return ['POST', 'PUT', 'PATCH'].indexOf(method) !== -1;
}


function attachHeaders(headers, contentType) {
  const value = contentType === 'form' ? 'application/x-www-form-urlencoded' : 'application/json';
  return { 'Content-Type': value, ...headers };
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
  const body = data ? transformBody(data, headers) : null;
  return global.fetch(url, {
    method,
    mode: 'cors',
    credentials: 'include',
    headers,
    body
  }).then(res => res.json());
}


function transformBody(data, headers) {
  if (!isPlainObject(data)) {
    return data;
  }

  if (isFormRequest(headers)) {
    return qs.stringify(data);
  }

  return JSON.stringify(data);
}


function isFormRequest(headers) {
  const ct = headers['Content-Type'];
  return ct === 'application/x-www-form-urlencoded';
}

function isPlainObject(obj) {
  return Object.prototype.toString.call(obj) === '[object Object]';
}
