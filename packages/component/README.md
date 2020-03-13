# @hyder/component

提供一致的方式创建React模块和应用，让react应用开发更轻松。

基于@hyder/component的模块能够运行在hyder环境中, 其中的逻辑代码运行在js-core环境中， 也能够运行在普通的react应用中， 提升模块重用度，简化复杂模块的开发难度，特别适合团队开发。


## 开始使用


1. 添加依赖

```
yarn add @hyder/component
```

2. 创建组件

组件(如需要较复杂的逻辑)可由`View`和`Model`组成;  

在hyder环境下，`model` 会运行在js-core环境中。  

模块的开发方式和目录结构并无要求，但推荐如下：

```
- Counter/   # 模块
  - index.js   # 入口，如复杂的话可衍生出多个子组件
  - model.js   # 逻辑代码，框架本身不依赖于这个名称，逻辑复杂可加载其他文件。
  - style.scss # 样式
```

模块目录和代码可参考[Counter示例](../examples/src/components/Counter)。


借鉴于[dva](https://dvajs.com/)的最佳实践，model由**state**, **reducers**, 和**effects**组成。


### model.js

```js
export default {
  state: { count: 0 },
  // state: props => ({ count: 0 }),  // state也可以由props初始化

  reducers: {
    up(state, action) {
      return nextState;
    },

    ...
  },

  effects: {
    * mount(action, { put, select }) {
      ...
      yield put({ type: 'save', count: 100 });  // 更新state值
    }

    * up({ step = 1 }, { put, select }) {
      const count = yield select(v => v.count);  // 取得上一次的state
      yield put({ type: 'save', count: count + step });
    }
  }
};
```

### index.js


通过`withModel`高阶组件来绑定model。


```js
import { withModel } from '@hyder/component';
import model from './model.js';


const View = ({ count, dispatch }) => (
  <div>
    <div className="count">{count}</div>
    <div className="buttons">
      <button className="button" onClick={() => dispatch({ type: 'up', step: 3 })}>Up</button>
      <button className="button" onClick={() => dispatch({ type: 'down', step: 4 })}>Down</button>
    </div>
  </div>
);


export default withModel(model)(Counter);
```

对于react@16.8以上版本，也可使用[React Hooks](https://reactjs.org/docs/hooks-intro.html)使用model。


```js
import { useModel } from '@hyder/component';
import model from './model';

const Counter = props => {
  const [{ count }, dispatch] = useModel(model);
  return (
    <div>
      <div className="count">{count}</div>
      <div className="buttons">
        <button className="button" onClick={() => dispatch({ type: 'up', step: 3 })}>Up</button>
        <button className="button" onClick={() => dispatch({ type: 'down', step: 4 })}>Down</button>
      </div>
    </div>
  );
};
```

## 接入到redux


配合react-redux可在应用级别使用, 无需依赖其他库，可方便集成到现有redux应用中。


### 接入

```js
import React from 'react';
import ReactDOM from 'react-dom';
import { createStore } from 'redux';
import { Provider } from 'react-redux';
import { createStoreEnhancer } from '@hyder/component';

import pageModel from './models/page';  // 载入应用的模块，可以有多个

const hyderEnhancer = createStoreEnhancer();

const store = createStore(v => v, {}, hyderEnhancer);

// 添加应用级别model
hyderEnhancer.add([
  pageModel
]);

const App = () => {
  return (
    <Provider store={store}>
      ...
    </Provider>
  );
};

React.render(<App />, document.getElementById('app'));
```

###  使用

1. model

model的编写和上述一致，多了name，以及少了默认触发的`mount` action，因为应用级别的model不和某个具体的react组件绑定。

详情可见[示例](../examples/src/index.js)


```js
// models/page.js

export default {
  name: 'page',    // 名称，在dispatch中作为名字空间

  state: {
    count: 0       // 初始state, 由于应用级model不和具体react组件关键，所以只能是个普通对象
  },

  reducers: {
    up(state, action) {
      return nextState;
    }
  },

  effects: {
    * down(action, { put, select }){
      ...
    }
  }
};
```

2. view

像正常的`react-redux`的方式使用就可以啦。

```js
import { useSelector, useDispatch } from 'react-redux';

const View = ({ page, dispatch }) => {
  const dispatch = useDispatch();
  const { count } = useSelector(state => state.page);

  return (
    <div className="page-view">
      <h1>{page.title}</h1>
      <div>
        <div className="count">{page.count || 0}</div>
        <div className="buttons">
          <button className="button" onClick={() => dispatch({ type: 'page/up', step: 3 })}>Up</button>
          <button className="button" onClick={() => dispatch({ type: 'page/down', step: 4 })}>Down</button>
        </div>
      </div>
    </div>
  );
}
```
