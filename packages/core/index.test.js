import * as exps from './index';


test('exports', () => {
  [
    'canIUse',
    'createApp',
    'request'
  ].forEach(name => {
    expect(typeof exps[name]).toBe('function');
  });
});
