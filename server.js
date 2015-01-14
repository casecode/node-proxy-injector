var program = require('commander');
var http = require('http');
var url = require('url');
var path = require('path');
var connect = require('connect');
var proxyInjector = require('./lib/proxy-injector');
var livereload = require('livereload');


program
  .version('0.1.0')
  .usage('[options] <file ...>')
  .option('-u, --target-url [url]', 'The target url to proxy', 'http://jquery.com/')
  .option('-d, --target-dir [path]', 'The path of the target directory to watch', './test')
  .parse(process.argv);

// resolve options args
var targetUrl = program.targetUrl;
if (!(targetUrl.substring(0, 4) === "http")) {
  targetUrl = 'http://' + targetUrl
}
targetUrl = url.parse(targetUrl);

var targetDir = path.resolve(__dirname, program.targetDir);


// Config options
var options = {
  targetUrl: targetUrl,
  proxyPort: 8000, // local proxy server port
  targetDir: targetDir // directory containing scripts and stylesheets for injection
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
