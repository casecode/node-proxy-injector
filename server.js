var http = require('http');
var path = require('path');
var connect = require('connect');
var proxyInjector = require('./lib/proxy-injector');

var options = {
  url: {
    hostname: '63rdstreetproductions.com',
    path: '/about'
  }
};

var testJS = path.resolve(__dirname, './test/test.js');

var scripts = {
  js: [
    testJS
  ]
};


var proxy = proxyInjector.createProxyServer(options, scripts);

var app = connect();
app.use(proxy);

http.createServer(app).listen(8000);

var livereload = require('livereload');
var server = livereload.createServer({
  originalPath: "http://localhost:8000/"
});
var testDir = path.resolve(__dirname, './test');
server.watch(testDir);
