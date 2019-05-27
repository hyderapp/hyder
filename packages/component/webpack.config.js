const pathUtil = require('path');

const reactExternal = {
  root: 'React',
  commonjs2: 'react',
  commonjs: 'react',
  amd: 'react'
};

const reactDOMExternal = {
  root: 'ReactDOM',
  commonjs2: 'react-dom',
  commonjs: 'react-dom',
  amd: 'react-dom'
};


module.exports = {
  entry: {
    index: './src/index.js'
  },

  externals: {
    react: reactExternal,
    'react-dom': reactDOMExternal
  },

  output: {
    filename: '[name].js',
    chunkFilename: '[id].chunk.js',
    path: pathUtil.resolve(__dirname, 'dist'),
    publicPath: '/',
    libraryTarget: 'umd',
    library: 'HyderComponent',
    globalObject: 'this'
  },

  module: {
    rules: [
      { test: /\.js?$/, use: { loader: 'babel-loader' } }
    ]
  }
};
