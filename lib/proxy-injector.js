var http = require('http');
var cheerio = require('cheerio');
var Q = require('q');
var fs = require("fs");


var createProxyServer = function(config, scripts) {

  if (!config.url) logErrorAndExit("A target url must be provided");
  var _scripts = scripts || { js: [] };

  return function onRequest(clientReq, clientRes, next) {

    var options = {
      hostname: config.url.hostname,
      port: 80,
      path: clientReq.url === '/' ? config.url.path : clientReq.url,
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
          var html = injectScripts(htmlData, _scripts);
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

var injectScripts = function(htmlData, scripts) {
  var $ = cheerio.load(htmlData);
  scripts.js.forEach(function(script) {
    var data = fs.readFileSync(script, 'utf8');
    $('head').append('<script type="text/javascript">' + data + '</script>');
  });
  return $.html();
};


module.exports = {
  createProxyServer: createProxyServer
};
