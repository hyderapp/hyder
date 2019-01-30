module.exports = {
  root: true,
  parser: 'babel-eslint',
  plugins: ['jsx-a11y', 'react'],
  extends: [
    require.resolve('eslint-config-airbnb-base'),
    'plugin:react/recommended'
  ],
  env: {
    browser: true,
    commonjs: true,
    es6: true,
    jest: true,
    node: true
  },
  rules: require('./rules')
};
