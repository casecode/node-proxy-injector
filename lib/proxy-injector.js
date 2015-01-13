var http = require('http');
var cheerio = require('cheerio');
var Q = require('q');


var createProxyServer = function(config, scripts) {

  if (!config.url) return;
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
        processHtmlStream(res)
          .then(function(htmlData) {
            var html = injectScripts(htmlData, _scripts);
            clientRes.write(html);
            clientRes.end();
          }, function(errMessage) {
            console.log(errMessage);
            return;
          });
      }
      else {
        res.pipe(clientRes, {
          end: true
        });
      }
    });

    clientReq.pipe(proxy, {
      end: true
    });
  };
};

var processHtmlStream = function(response) {
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
    $('head').append('<script type="text/javascript">' + script + '</script>');
  });
  return $.html();
};


module.exports = {
  createProxyServer: createProxyServer
};
