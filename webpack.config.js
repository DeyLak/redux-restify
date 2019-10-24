const path = require('path')
const webpack = require('webpack')
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin


const ENV_PROD = 'production'
const ENV_DEV = 'development'
const ENV_TESTING = 'testing'

const NODE_ENV = process.env.NODE_ENV ? process.env.NODE_ENV.replace(' ', '') : ENV_PROD
const env = {
  prod: NODE_ENV === ENV_PROD,
  dev: NODE_ENV === ENV_DEV || NODE_ENV === ENV_TESTING,
  test: NODE_ENV === ENV_TESTING,
}
const nodeModulesRegexp = /node_modules/

const getJavaScriptLoaders = () => {
  if (!env.test) {
    return [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: nodeModulesRegexp,
      },
    ]
  }
  return [
    {
      test: /\.js$/,
      loader: 'babel-loader',
      exclude: nodeModulesRegexp,
    },
    {
      test: /\.js$/,
      use: {
        loader: 'istanbul-instrumenter-loader',
        options: { esModules: true },
      },
      enforce: 'post',
      exclude: /node_modules|\.test\.js/,
    },
  ]
}

module.exports = {
  devtool: !env.prod ? 'inline-source-map' : false,
  entry: './src/',
  output: {
    path: path.join(__dirname, 'lib'),
    filename: 'index.js',
    libraryTarget: 'umd',
    library: 'redux-restify',
  },
  mode: env.prod ? 'production' : 'development',
  node: env.test ? {
    fs: 'empty',
  } : {},
  module: {
    rules: getJavaScriptLoaders().concat([]),
  },
  resolve: {
    alias: {
      '~': path.join(__dirname, 'src'),
    },
    modules: [
      'node_modules',
    ],
    extensions: ['.js', '.json'],
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        PROD: JSON.stringify(env.prod),
        DEV: JSON.stringify(env.dev),
        TEST: JSON.stringify(env.test),
        NODE_ENV: `"${NODE_ENV}"`,
      },
    }),
    new webpack.ProvidePlugin({
      key: 'keymaster',
    }),
    // new BundleAnalyzerPlugin(),
  ].concat(!env.prod ? [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoEmitOnErrorsPlugin(),
  ] : [
    new webpack.ExtendedAPIPlugin(),
  ]),
}
