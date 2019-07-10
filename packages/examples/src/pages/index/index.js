import React from 'react';
import ReactDOM from 'react-dom';
import { createStore, applyMiddleware } from 'redux';
import { Provider, connect } from 'react-redux';
import promiseMiddleware from 'redux-promise';
import { createHyderEnhancer } from '@hyder/component';
import 'bulma/css/bulma.min.css';
import Counter from '@/components/Counter';
import CounterWithHook from '@/components/Counter/hook';
import pageModel from '@/models/page';
import './style.scss';


// app reducer
const reducer = state => state;

const hyderEnhancer = createHyderEnhancer(
  // apply other middleware
  applyMiddleware(promiseMiddleware)
);

const store = createStore(reducer, {}, hyderEnhancer);


// add app models
hyderEnhancer.add([pageModel]);


const App = () => (
  <Provider store={store}>
    <div className="app">
      <PageView />
      <hr />
      <h2>Component withModel</h2>
      <Counter count={10} />
      <hr />
      <h2>Component useModel (hooks)</h2>
      <CounterWithHook count={10} />
    </div>
  </Provider>
);


const enhance = connect(v => v);

const PageView = enhance(({ page, dispatch }) => (
  <div className="page-view">
    <h1>{page.title}</h1>
    <div>
      <div className="count">{page.count || 0}</div>
      <div className="buttons">
        <button className="button" onClick={() => dispatch({ type: 'page/up', step: 3 })}>Up</button>
        <button className="button" onClick={() => dispatch({ type: 'page/down', step: 4 })}>Down</button>
        <button className="button" onClick={() => dispatch({ type: 'page/random', step: 10 })}>Random</button>
      </div>
    </div>
  </div>
));


ReactDOM.render(<App />, document.getElementById('app'));
