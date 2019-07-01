import createStoreEnhancer from './createStoreEnhancer';
import dispatch from './dispatch';
import normalizeModel from './normalizeModel';
import replaceDispatch from './replaceDispatch';
import useModel from './useModel';
import withModel from './withModel';

const createHyderEnhancer = (...args) => {
  console.warn('`createHyderEnhancer` in deprecated, use `createStoreEnhancer`'); // eslint-disable-line
  return createStoreEnhancer(...args);
};


export {
  createHyderEnhancer,
  createStoreEnhancer,
  dispatch,
  normalizeModel,
  replaceDispatch,
  useModel,
  withModel
};
