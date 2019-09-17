import guid, { current } from './guid';


it('test', () => {
  const v1 = guid();
  const v2 = guid();
  const v3 = guid();
  expect(v1 !== v2).toBeTruthy();
  expect(v2 !== v3).toBeTruthy();
  expect(current()).toBe(v3);
});
