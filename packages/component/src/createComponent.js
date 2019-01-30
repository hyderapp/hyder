import React from 'react';


export default function createComponent(model) {
  return View => (
    class HyderComponent extends React.Component {
      dispatch = action => {
        console.log(action);
      };

      render() {
        const props = {
          ...this.props,
          dispatch: this.dispatch
        };
        return <View {...props} />;
      }
    }
  );
}
