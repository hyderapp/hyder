const defaultReducers = {
  load: (state, { payload }) => {
    return { ...state, ...payload };
  }
};


export default function normalizeModel(model) {
  const state = model.state || {};
  const reducers = { ...defaultReducers, ...model.reducers };
  const effects = { ...model.effects };
  return { ...model, state, reducers, effects };
}
