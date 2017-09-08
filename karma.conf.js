const webpack = require('webpack')
const webpackConfig = require('./webpack.config.js')

module.exports = function (config) {
  config.set({
    browsers: ['Chrome'],
    singleRun: false,
    frameworks: ['jasmine'],
    files: [
      'tests.webpack.js',
    ],
    preprocessors: {
      'tests.webpack.js': ['webpack', 'sourcemap'],
    },
    reporters: ['dots', 'coverage-istanbul'],
    webpack: webpackConfig,
    webpackServer: {
      noInfo: true,
    },
    coverageReporter: {
      reporters: [
        {
          type: 'text-summary',
        },
        {
          type: 'html',
          dir: 'coverage/',
        },
      ],
    },
    plugins: [
      'karma-coverage',
      'karma-jasmine',
      'karma-webpack',
      'karma-chrome-launcher',
      'karma-verbose-reporter',
      'karma-coverage-istanbul-reporter',
      'karma-sourcemap-loader',
    ],
  })
}
