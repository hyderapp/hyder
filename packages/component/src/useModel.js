import { useState, useEffect, useMemo } from 'react';
import defaultDispatch from './dispatch';
import normalizeModel from './normalizeModel';
import { DISPATCH } from './symbols';


export default function useModel(model, props = {}) {
  model = useMemo(() => normalizeModel(model), []);
  const dispatch = global[DISPATCH] || defaultDispatch;
  const init = typeof model.state === 'function' ? model.state(props) : model.state;
  const [state, setState] = useState(init);

  const stater = {
    get: () => state,
    set: data => setState(data)
  };

  const boundDispatch = action => {
    const { type } = action;
    if (model.effects[type] || model.reducers[type]) {
      return dispatch(model, action, stater);
    }
    return null;
  };

  useEffect(() => {
    boundDispatch({ type: 'mount', ...props });
    return () => {
      boundDispatch({ type: 'unmount' });
    };
  }, []);

  return [state, boundDispatch];
}

