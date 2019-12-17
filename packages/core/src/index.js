import canIUse from './canIUse';
import request from './request';


const browser = typeof window !== 'undefined' && typeof document !== 'undefined';

const createApp = browser ? require('./createApp').default : null;
const createService = browser ? null : require('./createService').default;


export {
  canIUse,
  createApp,
  createService,
  request
};
