const defaultReducers = {
  '@@init': state => state,

  load: (state, { payload }) => {
    verify(state, payload);
    return { ...state, ...payload };
  },

  save: (state, ...payload) => {
    verify(state, payload);
    return { ...state, ...payload };
  }
};


export default function normalizeModel(model) {
  const state = model.state || {};
  const reducers = { ...defaultReducers, ...model.reducers };
  const effects = { ...model.effects };
  return { ...model, state, reducers, effects };
}


function verify(state, payload) {
  for (const key in payload) {
    const item = payload[key];
    if (item && typeof item === 'object' && state[key] === payload[key]) {
      console.error(`payload ${key} is same reference to previous state field`);  // eslint-disable-line
    }
  }
}
