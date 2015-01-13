var http = require('http');
var cheerio = require('cheerio');
var Q = require('q');

module.exports = function() {

  var injectionScripts = {
    js: [
    'alert("IT WORKED");'
    ]
  }

  var targetUrl = {
    hostname: '63rdstreetproductions.com',
    path: '/about'
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
        var html = injectScripts(htmlData);
        deferred.resolve(html);
      })
      .on('error', function(err) {
        deferred.reject(err.message);
      });

    return deferred.promise;
  }

  var injectScripts = function(htmlData) {
    var $ = cheerio.load(htmlData);
    injectionScripts.js.forEach(function(script) {
      $('head').append('<script type="text/javascript">' + script + '</script>');
    });
    return $.html();
  };

  return function onRequest(clientReq, clientRes, next) {
    var options = {
      hostname: targetUrl.hostname,
      port: 80,
      path: clientReq.url === '/' ? targetUrl.path : clientReq.url,
      method: 'GET'
    };

    var proxy = http.request(options, function (res) {
      if (clientReq.url === '/') {
        processHtmlStream(res)
          .then(function(html) {
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
  }
}
