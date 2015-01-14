var http = require('http');
var path = require('path');
var connect = require('connect');
var proxyInjector = require('./lib/proxy-injector');
var livereload = require('livereload');


// Config options
var options = {
  // url to be proxied
  targetUrl: {
    hostname: '63rdstreetproductions.com',
    path: '/about'
  },
  // local proxy server port
  proxyPort: 8000,
  // directory containing scripts and stylesheets for injection
  targetDir: path.resolve(__dirname, './test')
};

var proxy = proxyInjector.createProxyServer(options);

var app = connect();
app.use(proxy);

http.createServer(app).listen(options.proxyPort);

// Live reload server watching for files in target directory
var livereloadServer = livereload.createServer({
  originalPath: 'http://localhost:' + options.proxyPort,
  applyCSSLive: false
});
livereloadServer.watch(options.targetDir);
