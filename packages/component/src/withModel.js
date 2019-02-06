import React from 'react';
import defaultDispatch from './dispatch';
import normalizeModel from './normalizeModel';
import { DISPATCHER } from './symbols';


/* eslint react/prop-types: 0 */

export default function withModel(model) {
  model = normalizeModel(model);
  const dispatch = global[DISPATCHER] || defaultDispatch;

  return View => {
    class HyderComponent extends React.Component {
      constructor(props) {
        super(props);
        this.state = {
          data: typeof model.state === 'function' ? model.state(this.props) : model.state
        };
        this.stater = {
          get: () => this.state.data,
          set: (data, cb) => this.setState({ data }, cb)
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
          ...this.state.data,
          dispatch: this.dispatch,
          originalDispatch: this.props.dispatch
        };
        return <View {...props} />;
      }
    }

    return HyderComponent;
  };
}
