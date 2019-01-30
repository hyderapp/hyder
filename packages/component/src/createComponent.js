import React from 'react';
import symbol from './symbol';


let guid = 1;


export default function createComponent(model) {
  const name = model.namespace || `hyder_component_${guid++}`;
  return View => {
    class HyderComponent extends React.Component {
      dispatch = action => {
        const type = `${name}/${action.type}`;
        this.props.dispatch({ ...action, type, [symbol.Action]: { model } });
      };

      render() {
        const props = {
          ...this.props,
          dispatch: this.dispatch,
          originalDispatch: this.props.dispatch
        };
        return <View {...props} />;
      }
    }
    return HyderComponent;
  };
}
