var http = require('http');

var proxyInjector = require('./lib/proxy-injector');
var onRequest = proxyInjector();

http.createServer(onRequest).listen(8000);
