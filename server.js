/* eslint-disable no-console */
const webpack = require('webpack')
const WebpackDevServer = require('webpack-dev-server')
const config = require('./webpack.config.js')

const port = 8888
const apiHost = process.env.API_HOST || 'http://localhost'
const app = new WebpackDevServer(webpack(config), {
  publicPath: config.output.publicPath,
  hot: true,
  color: true,
//  historyApiFallback: true,
})

app.use('/', (req, res) => {
  if (/^\/api/.test(req.url)) {
    res.writeHead(307, { Location: `${apiHost}${req.url}` })
    res.end()
  } else if (/^\/static/.test(req.url) && !/bundle/.test(req.url)) {
    res.sendFile(`${process.cwd()}/${req.url}`)
  } else {
    res.sendFile(`${process.cwd()}/index.html`)
  }
})

app.listen(port, 'localhost', (err) => {
  if (err) {
    console.log(err)
    return
  }

  console.log(`Listening at http://localhost:${port}/`)
})

