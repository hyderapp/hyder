export default {
  // state: { count: 1 } or
  state: props => ({ count: props.count || 0 }),

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
    // action, helpers
    * mount({ count }, { put }) {
      // load data
      yield sleep(300);
      yield put({ type: 'load', payload: { count: count + 10 } });
    },

    * random(action, { put, select }) {
      for (let i = 0; i < 5; i++) {
        const count = yield select(state => state.count);
        yield sleep(300);
        const step = Math.floor((Math.random() * 100));
        yield put({ type: 'load', payload: { count: count + step } });
      }
    }
  }
};

function sleep(timeout) {
  return new Promise(resolve => setTimeout(resolve, timeout));
}
