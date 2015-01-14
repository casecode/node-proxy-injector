var http = require('http');
var path = require('path');
var cheerio = require('cheerio');
var Q = require('q');
var fs = require("fs");


var createProxyServer = function(config) {
  var _targetUrl = config.targetUrl,
      _targetFiles = scanDirForFiles(config.targetDir);

  return function onRequest(clientReq, clientRes, next) {

    var options = {
      hostname: _targetUrl.hostname,
      port: 80,
      path: clientReq.url === '/' ? _targetUrl.path : clientReq.url,
      method: 'GET'
    };

    var proxy = http.request(options, function (res) {
      if (clientReq.url === '/') {
        rewriteHtmlStream(res);
        return;
      }

      res.pipe(clientRes, { end: true });
    });

    var rewriteHtmlStream = function(res) {
      processHtmlData(res)
        .then(function(htmlData) {
          var html = injectFiles(htmlData, _targetFiles);
          clientRes.end(html);
        }, logErrorAndExit);
    };

    clientReq.pipe(proxy, { end: true });
  };
};

// Find css and js files in target directory
var scanDirForFiles = function(directory) {
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

var logErrorAndExit = function(errorMessage) {
  console.log(errorMessage);
  process.exit(1);
};

var processHtmlData = function(response) {
  var deferred = Q.defer();

  var htmlData;
  response
    .on('data', function(chunk) {
      htmlData += chunk;
    })
    .on('end', function() {
      htmlData = htmlData.replace('undefined', ''); // remove undefined prepended to document
      deferred.resolve(htmlData);
    })
    .on('error', function(err) {
      deferred.reject(err.message);
    });

  return deferred.promise;
}

var injectFiles = function(htmlData, files) {
  var $ = cheerio.load(htmlData),
      headNode = $('head');

  var styleTag = { prefix: '<style type="text/css">', suffix: '</style>' },
      scriptTag = { prefix: '<script type="text/javascript">', suffix: '</script>' };

  var appendStylesheet = appendFile(headNode, styleTag),
      appendScript = appendFile(headNode, scriptTag);

  files.css.forEach(appendStylesheet);
  files.js.forEach(appendScript);

  return $.html();
};

var appendFile = function(node, tag) {
  return function(file) {
    var data = fs.readFileSync(file, 'utf8');
    node.append(tag.prefix + data + tag.suffix);
  };
};

module.exports = {
  createProxyServer: createProxyServer
};
