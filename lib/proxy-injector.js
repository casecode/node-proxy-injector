var http = require('http');
var cheerio = require('cheerio');
var Q = require('q');
var fs = require("fs");


var createProxyServer = function(config, files) {

  if (!config.targetUrl) logErrorAndExit("A target url must be provided");
  var _files = files || { css: [], js: [] };

  return function onRequest(clientReq, clientRes, next) {

    var options = {
      hostname: config.targetUrl.hostname,
      port: 80,
      path: clientReq.url === '/' ? config.targetUrl.path : clientReq.url,
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
          var html = injectFiles(htmlData, _files);
          clientRes.end(html);
        }, logErrorAndExit);
    };

    clientReq.pipe(proxy, { end: true });
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
