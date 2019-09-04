const key = '$$hyder/guid';

/**
 * 产生一个唯一id，用于匹配回调等场景
 * @return {Number}  - id
 */
export default function() {
  // 载入多份定义也能正常工作，方便将多个产品包内容载到一个上下文中
  let guid = global[key] || (global[key] = 0);
  guid = global[key] = guid + 1;
  return guid;
}

export function current() {
  return global[key];
}

