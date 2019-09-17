import globalRegister from './globalRegister';


it('test', () => {
  const v = i => i;
  expect(globalRegister('test', v)).toBe(v);
  expect(globalRegister('test', 'other')).toBe(v);
});
