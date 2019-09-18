import canIUse from './canIUse';
import request from './request';

const [
  createApp,
  createService
] = inBrowser() ?
  [
    require('./createApp').default,
    null
  ] :
  [
    null,
    require('./createService').default
  ];

export {
  canIUse,
  createApp,
  createService,
  request
};

function inBrowser() {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}
