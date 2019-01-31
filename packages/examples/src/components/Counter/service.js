export default {
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
      yield put({ type: 'load', payload: { count } });
    },

    * reload(_, { put, select }) {
      const count = yield select(v => v.count);
      yield sleep(100);
      const step = Math.floor((Math.random() * 100));
      yield put({ type: 'load', payload: { count: count + step } });
    }
  }
};

function sleep(timeout) {
  return new Promise(resolve => setTimeout(resolve, timeout));
}
