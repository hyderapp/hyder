const pathUtil = require('path');
const createConfig = require('bcd-react-webpack');

module.exports = createConfig({
  resolve: {
    alias: {
      react: pathUtil.join(__dirname, 'node_modules/react'),
      'react-dom': pathUtil.join(__dirname, 'node_modules/react-dom')
    }
  }
});

