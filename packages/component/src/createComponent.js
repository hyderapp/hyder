import React from 'react';
import defaultDispatch from './dispatch';
import { DISPATCHER } from './symbols';


/* eslint react/prop-types: 0 */


const defaultReducers = {
  load: (state, { payload }) => {
    return { ...state, ...payload };
  }
};


export default function createComponent(model) {
  model = normalizeModel(model);
  const dispatch = global[DISPATCHER] || defaultDispatch;

  return View => {
    class HyderComponent extends React.Component {
      constructor(props) {
        super(props);
        this.state = typeof model.state === 'function' ? model.state(this.props) : model.state;
        this.stater = {
          get: () => this.state,
          set: (v, cb) => this.setState(v, cb)
        };
      }

      dispatch = action => {
        const { type } = action;
        if (model.effects[type] || model.reducers[type]) {
          return dispatch(model, action, this.stater);
        }
        return this.props.dispath && this.props.dispatch(action);
      };

      componentDidMount() {
        const { props } = this;
        this.dispatch({ type: 'mount', ...props });
      }

      render() {
        const props = {
          ...this.props,
          ...this.state,
          dispatch: this.dispatch,
          originalDispatch: this.props.dispatch
        };
        return <View {...props} />;
      }
    }

    return HyderComponent;
  };
}


function normalizeModel(model) {
  const state = model.state || {};
  const reducers = { ...defaultReducers, ...model.reducers };
  const effects = { ...model.effects };
  return { state, reducers, effects };
}
