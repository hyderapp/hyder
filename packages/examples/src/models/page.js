/**
 * @model
 */

export default {
  name: 'page',

  state: {
    title: 'Hyder: 开放、流畅的移动端应用框架',
    count: 0
  },


  reducers: {
    up(state, { step }) {
      const count = state.count + step;
      return { ...state, count };
    },

    down(state, { step }) {
      const count = state.count - step;
      return { ...state, count };
    }
  },


  effects: {
    * random({ step }, { put, select }) {
      for (let i = 0; i < 10; i++) {
        yield sleep(300);
        const count = yield select(state => state.count);
        const nextCount = count + step;
        yield put({ type: 'load', payload: { count: nextCount } });
      }
    }
  }
};


function sleep(timeout) {
  return new Promise(resolve => setTimeout(resolve, timeout));
}
