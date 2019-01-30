import React from 'react';
import $t from 'prop-types';
import { connect } from 'react-redux';
import { createComponent } from '@hyder/component';
import model from './model';
import style from './style.scss';


const Counter = ({ count, dispatch }) => (
  <div className={style.counter}>
    <div className="count">{count}</div>
    <div className="buttons">
      <button className="button" onClick={() => dispatch({ type: 'up', step: 3 })}>Up</button>
      <button className="button" onClick={() => dispatch({ type: 'down', step: 4 })}>Down</button>
      <button className="button" onClick={() => dispatch({ type: 'reload', step: 7 })}>Reload</button>
    </div>
  </div>
);


Counter.propTypes = {
  dispatch: $t.func,
  count: $t.number
};


export default connect()(createComponent(model)(Counter));
