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
    * mount({ count }, { put }) {
      // load data
      yield sleep(300);
      yield put({ type: 'load', payload: { count: count + 10 } });
    },

    * random(_, { put, select }) {
      for (let i = 0; i < 5; i++) {
        const count = select(v => v.count);
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
