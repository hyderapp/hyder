import React from 'react';
import ReactDOM from 'react-dom';
import 'bulma/css/bulma.min.css';
import Counter from './components/Counter';


const App = () => {
  return (
    <div className="app">
      <Counter count={10} />
    </div>
  );
};


ReactDOM.render(<App />, document.getElementById('root'));
