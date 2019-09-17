import get from './internal/get';


/**
 * 检测某个特性: api、组件是否在当前版本可用
 * @param {String} schema   - 描述
 * @return {Boolean}        - 是否可用
 *
 * 此api的设计参考了小程序[canIUse](https://developers.weixin.qq.com/miniprogram/dev/api/wx.canIUse.html)
 *
 * 示例
 *
 * ```
 * canIUse('core.serviceInvoke')   // 是否支持service调用
 * canIUse('data.request')         // 是否支持数据接口访问
 * canIUse('Page.reachBottom')     // 是否支持原生上拉页面触底事件
 *
 * // 以上几个检测基本上都在框架中使用，后续有原生业务模块或组件，再补充示例到此文档中。
 * ```
 */
export default function(schema) {
  const bag = global.hyder_features || {};
  if (bag[schema]) {
    return true;
  }

  const bridge = global.hyderbridge || {};
  const o = get(bridge, schema);
  if (o && typeof o === 'function' && !o.shim) {
    return true;
  }

  return false;
}
