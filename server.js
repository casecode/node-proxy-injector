var http = require('http');
var connect = require('connect');
var proxyInjector = require('./lib/proxy-injector');

var options = {
  url: {
    hostname: '63rdstreetproductions.com',
    path: '/about'
  }
};

var scripts = {
  js: [
    'alert("IT WORKED");'
  ]
}

var proxy = proxyInjector.createProxyServer(options, scripts);

var app = connect();
app.use(proxy);

http.createServer(app).listen(8000);
