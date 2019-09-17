import * as exps from './service';


test('exports', () => {
  [
    'canIUse',
    'createService',
    'request'
  ].forEach(name => {
    expect(typeof exps[name]).toBe('function');
  });
});
