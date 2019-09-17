/*
PatchItem :: Array[operator, params]
*/

/**
 * 计算两份数据的差异
 *
 * @param {Any} previous  - 原数据
 * @param {Any} current   - 现在的数据
 * @return {Array[PatchItem]}  - patches
 */
export function diff(previous, current) {
  if (previous === current) {
    return null;
  }
  if (previous && current) {
    if (isPlainObject(previous) && isPlainObject(current)) {
      return diffObject(previous, current);
    }
    if (Array.isArray(previous) && Array.isArray(current)) {
      return diffArray(previous, current);
    }
  }
  return ['return', current];
}

/**
 * 根据原数据和补丁数据计算出新数据
 *
 * @param {Any} previous     - 原数据
 * @param {Array[PatchItem]} - 补丁
 * @param {Any}  - 新数据
 */
export function patch(previous, patches) {
  if (!patches) {
    return previous;
  }
  const [name, arg] = patches;
  return Patchers[name](previous, arg);
}


const Patchers = {
  // (any, any) -> any
  return: (previous, item) => item,

  // (object, object) -> object
  set: (previous, current) => ({ ...previous, ...current }),

  // (object, {string: patch}) -> object
  setrec: (previous, current) => {
    const next = { ...previous };
    Object.keys(current).forEach(key => {
      next[key] = patch(previous[key], current[key]);
    });
    return next;
  },

  // (object, [string]) -> object
  del: (previous, keys) => {
    const next = {};
    Object.keys(previous).forEach(key => {
      if (keys.indexOf(key) === -1) {
        next[key] = previous[key];
      }
    });
    return next;
  },

  // (any, [patch]) -> any
  batch: (previous, patches) => {
    return patches.reduce((acc, pat) => patch(acc, pat), previous);
  },

  // (array, [number, [[number, patch]]]) -> array
  list: (previous, [size, updateList, pushList]) => {
    const next = previous.slice(0, size);
    updateList.forEach(([index, pat]) => {
      next[index] = patch(previous[index], pat);
    });
    return next.concat(pushList);
  },

  // (array, [number]) -> array
  listdel: (previous, indices) => {
    return previous.filter((v, index) => indices.indexOf(index) === -1);
  }
};

function diffArray(previous, current) {
  const plen = previous.length;
  const clen = current.length;
  if (plen === 0 || clen === 0) {
    return ['return', current];
  }

  const item = quickDiffArray(previous, current);
  if (item) {
    return item;
  }

  // items shoul updated
  const updateList = [];
  const len = plen <= clen ? plen : clen;  // min
  for (let i = 0; i < len; i++) {
    const pre = previous[i];
    const cur = current[i];
    if (pre !== current) {
      const pat = diff(pre, cur);
      pat && updateList.push([i, pat]);
    }
  }

  // items should push
  const pushList = current.slice(plen);
  return ['list', [len, updateList, pushList]];
}


function quickDiffArray(previous, current) {
  const plen = previous.length;
  const clen = current.length;
  if (plen - 1 === clen) {
    const index = tryGetDeleteIndex(previous, current);
    if (index !== -1) {
      return ['listdel', [index]];
    }
  }

  const len = plen <= clen ? plen : clen;
  const mid = len >> 2; // eslint-disable-line

  // quick test if quite different
  if (previous[0] !== current[0] &&
      previous[len - 1] !== current[len - 1] &&
      previous[mid] !== current[mid]) {
    return ['return', current];
  }

  return null;
}


function tryGetDeleteIndex(previous, current) {
  let index = -1;
  const len = previous.length;
  for (; index < len; index++) {
    if (previous[index] !== current[index]) {
      break;
    }
  }
  if (index >= len) {
    throw new Error('assert false');
  }
  for (let i = index + 1; i < len; i++) {
    if (previous[i] !== current[i - 1]) {
      return -1;
    }
  }
  return index;
}


function diffObject(previous, current) {
  const preKeys = Object.keys(previous);
  const curKeys = Object.keys(current);

  const set = {};
  const setrec = {};

  curKeys.forEach(key => {
    const item = diff(previous[key], current[key]);
    if (!item) {
      return;
    }
    if (item[0] === 'return') {
      set[key] = item[1];
    } else {
      setrec[key] = item;
    }
  });

  const delKeys = preKeys.filter(key => (!(key in current)));
  const patches = [];

  if (Object.keys(set).length) {
    patches.push(['set', set]);
  }
  if (Object.keys(setrec).length) {
    patches.push(['setrec', setrec]);
  }
  if (delKeys.length) {
    patches.push(['del', delKeys]);
  }

  return patches.length > 1 ? ['batch', patches] :
    patches.length === 1 ? patches[0] : null;
}


function isPlainObject(obj) {
  return obj && obj.constructor === Object;
}
