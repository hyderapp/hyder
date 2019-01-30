import React from 'react';
import ReactDOM from 'react-dom';
import { createStore, applyMiddleware } from 'redux';
import { Provider } from 'react-redux';
import 'bulma/css/bulma.min.css';
import { defaultMiddleware } from '@hyder/component';
import Counter from './components/Counter';


const reducer = state => state;
const store = createStore(reducer, {}, applyMiddleware(defaultMiddleware));


const App = () => (
  <Provider store={store}>
    <div className="app">
      <Counter count={10} />
    </div>
  </Provider>
);


ReactDOM.render(<App />, document.getElementById('root'));
