const serviceMiddleware = store => next => action => {
  return next(action);
};


export default serviceMiddleware;
