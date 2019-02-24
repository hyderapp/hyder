export const func = f => typeof f === 'function';
export const promise = p => p && func(p.then);
export const iterator = it => it && func(it.next) && func(it.throw);
