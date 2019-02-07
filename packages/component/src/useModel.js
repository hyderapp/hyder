import { useState, useEffect, useMemo } from 'react';
import defaultDispatch from './dispatch';
import normalizeModel from './normalizeModel';
import { DISPATCHER } from './symbols';


export default function useModel(model, props = {}) {
  model = useMemo(() => normalizeModel(model), [model]);
  const dispatch = global[DISPATCHER] || defaultDispatch;

  const [state, setState] = useState(() => {
    return model.state === 'function' ? model.state(props) : model.state;
  });

  const stater = {
    get: () => state,
    set: (data, cb) => {
      setState(data);
      cb();
    }
  };

  const boundDispatch = action => {
    const { type } = action;
    if (model.effects[type] || model.reducers[type]) {
      dispatch(model, action, stater);
    }
  };

  useEffect(() => {
    boundDispatch({ type: 'mount', ...props });
  }, []);

  return [state, boundDispatch];
}

