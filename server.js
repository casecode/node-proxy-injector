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

var testScriptPath = './test.js';
var testScript = path.resolve(__dirname, testScriptPath);

var scripts = {
  js: [
    testScript
  ]
};


var proxy = proxyInjector.createProxyServer(options, scripts);

var app = connect();
app.use(proxy);

http.createServer(app).listen(8000);
