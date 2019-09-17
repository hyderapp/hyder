import * as exports from './index';


it('test', () => {
  [
    'canIUse',
    'createApp',
    'createService',
    'request'
  ].forEach(name => {
    expect(typeof exports[name]).toBe('function');
  });
});
