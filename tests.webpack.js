require('jasmine-ajax')
require('./src/index.js')

const testsContext = require.context('./src/', true, /\.test\.js/)
testsContext.keys().forEach(testsContext)

const sourcesContext = require.context('./src/', true, /\.js$/)
sourcesContext.keys().forEach(sourcesContext)
