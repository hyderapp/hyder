import canIUse from './canIUse';


it('test', () => {
  const last = global.hyderbridge;
  const lastFeature = global.hyder_features;

  global.hyderbridge = {
    core: {
      test: v => v
    }
  };

  global.hyder_features = {
    'Page.reachBottom': true
  };

  expect(canIUse('core.test')).toBeTruthy();
  expect(canIUse('core.notExist')).toBeFalsy();
  expect(canIUse('Page.reachBottom')).toBeTruthy();

  global.hyderbridge = last;
  global.hyder_features = lastFeature;
});
