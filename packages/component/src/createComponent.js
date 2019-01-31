import React from 'react';
import dispatcher from './dispatcher';


/* eslint react/prop-types: 0 */


const defaultReducers = {
  load: (state, { payload }) => {
    return { ...state, ...payload };
  }
};


export default function createComponent(model) {
  model = normalizeModel(model);

  return View => {
    class HyderComponent extends React.Component {
      constructor(props) {
        super(props);
        this.state = typeof model.state === 'function' ? model.state(this.props) : model.state;
      }

      dispatch = action => {
        const { type } = action;
        const effect = model.effects[type];
        if (model.effects[type] || model.reducers[type]) {
          return dispatcher(model, action, this.state).then(state => {
            return new Promise(resolve => this.setState(state, resolve));
          });
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
