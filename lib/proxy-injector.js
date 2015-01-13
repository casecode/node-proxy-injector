var http = require('http');
var cheerio = require('cheerio');

module.exports = function() {

  var injectionScripts = {
    js: [
    'alert("IT WORKED");'
    ]
  }

  return function onRequest(clientReq, clientRes) {
    // console.log('serve: ' + clientReq.url);

    var options = {
      hostname: '63rdstreetproductions.com',
      port: 80,
      path: clientReq.url,
      method: 'GET'
    };

    var proxy = http.request(options, function (res) {
      if (clientReq.url === '/') {
        var htmlData;
        res.on('data', function(chunk) {
          htmlData += chunk;
        });
        res.on('end', function() {
          htmlData = htmlData.replace('undefined', '');
          var $ = cheerio.load(htmlData);
          injectionScripts.js.forEach(function(script) {
            $('head').append('<script type="text/javascript">' + script + '</script>');
          });
          var html = $.html();
          clientRes.write(html);
        });
      } else {
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
