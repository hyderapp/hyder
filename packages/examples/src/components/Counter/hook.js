import React from 'react';
import { useModel } from '@hyder/component';
import model from './model';
import style from './style.scss';


const Counter = props => {
  const [{ count }, dispatch] = useModel(model, props);
  return (
    <div className={style.counter}>
      <div className="count">{count}</div>
      <div className="buttons">
        <button className="button" onClick={() => dispatch({ type: 'up', step: 3 })}>Up</button>
        <button className="button" onClick={() => dispatch({ type: 'down', step: 4 })}>Down</button>
        <button className="button" onClick={() => dispatch({ type: 'random', step: 7 })}>Random</button>
      </div>
    </div>
  );
};


export default Counter;
