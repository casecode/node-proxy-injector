var http = require('http');
var path = require('path');
var fs = require('fs');
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

var targetFiles = scanDirForFiles(options.targetDir);

var proxy = proxyInjector.createProxyServer(options, targetFiles);

var app = connect();
app.use(proxy);

http.createServer(app).listen(options.proxyPort);

// Live reload server watching for files in target directory
var livereloadServer = livereload.createServer({
  originalPath: 'http://localhost:' + options.proxyPort
});
livereloadServer.watch(options.targetDir);

// Find css and js files in target directory
function scanDirForFiles(directory) {
  var targetFiles = fs.readdirSync(directory);

  var regexFilter = function(pattern) {
    return function(file) {
      return pattern.test(file);
    };
  };

  var cssFilter = regexFilter(/\.css/),
  jsFilter  = regexFilter(/\.js/);

  var expandFilePath = function(file) {
    return path.resolve(directory, file);
  };

  return {
    css: targetFiles.filter(cssFilter).map(expandFilePath),
    js: targetFiles.filter(jsFilter).map(expandFilePath)
  };
};
