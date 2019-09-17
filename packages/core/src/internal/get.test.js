import get from './get';


it('test', () => {
  const obj = {
    a: {
      b: {
        c: 123
      }
    }
  };
  expect(get(obj, 'a.b.c')).toBe(123);
  expect(get(obj, 'a.b')).toBe(obj.a.b);
  expect(get(obj, 'a.c')).toBeUndefined();
});
