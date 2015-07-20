/*jshint node:true*/

var http = require('http');
var path = require('path');
var cheerio = require('cheerio');
var Q = require('q');
var fs = require("fs");

var createProxyServer = function(config) {
  'use strict';

  var _targetUrl = config.targetUrl,
      _targetFiles = scanDirForFiles(
        config.targetDir, config.include, config.exclude
      );

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

    // Handle requests with bad address
    proxy.on('error', logErrorAndExit);

    var rewriteHtmlStream = function(res) {
      processHtmlData(res)
        .then(function(htmlData) {
          var html = injectFiles(config.appendTo, htmlData, _targetFiles);
          html = injectLiveReload(html);
          clientRes.end(html);
        }, logErrorAndExit);
    };

    clientReq.pipe(proxy, { end: true });
  };
};

// Find css and js files in target directory
var scanDirForFiles = function(directory, include, exclude) {
  'use strict';

  var includeFilter = function (value, index, array) {
    return (new RegExp('global')).test(value) ||
      (new RegExp(include)).test(value);
  };
  var excludeFilter = function (value, index, array) {

    return !exclude ? true : !(new RegExp(exclude)).test(value);
  };

  var targetFiles = fs.readdirSync(directory);
  targetFiles = targetFiles.filter(includeFilter);
  targetFiles = targetFiles.filter(excludeFilter);

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

var logErrorAndExit = function(e) {
  console.log(e);
  process.exit(1);
};

var processHtmlData = function(response) {
  var deferred = Q.defer(),
      htmlData;

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
};

var injectFiles = function(selector, htmlData, files) {
  var $ = cheerio.load(htmlData),
      node = $(selector || 'body');

  var styleTag = { prefix: '<style type="text/css">', suffix: '</style>' },
      scriptTag = { prefix: '<script type="text/javascript">', suffix: '</script>' };

  var appendStylesheet = appendFile(node, styleTag),
      appendScript = appendFile(node, scriptTag);

  files.css.forEach(appendStylesheet);
  files.js.forEach(appendScript);

  return $.html();
};

var injectLiveReload = function (html) {
  return html.replace('</body>',
    "<script>document.write('<script src=\"http://' + " +
    "(location.host || 'localhost').split(':')[0] + ':35729" +
    "/livereload.js?snipver=1\"></' + 'script>')</script></body>"
  );
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
