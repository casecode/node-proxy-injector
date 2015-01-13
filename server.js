var http = require('http');
var connect = require('connect');
var proxyInjector = require('./lib/proxy-injector');

var app = connect();

var onRequest = proxyInjector();
app.use(onRequest);

http.createServer(app).listen(8000);
