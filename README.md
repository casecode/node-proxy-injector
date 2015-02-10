# node-proxy-injector

  A script that allows you to proxy a remote server and inject css stylesheets and js scripts into the remote server response. The tool supports live reload, but you must have browser extensions installed and configured. For details visit http://help.livereload.com/kb/general-use/browser-extensions.

  Note that this tool is a work in progress!

## Installation/Setup

  * Run `sudo npm install`
  * Visit [http://help.livereload.com/kb/general-use/browser-extensions](http://help.livereload.com/kb/general-use/browser-extensions) and download your browser-appropriate extension. For this short installation guide, we'll be using Chrome.
  * After the Chrome plugin is installed, go to Settings > Extensions, scroll to the LiveReload plugin, and then check the 'Allow access to file URLs' checkbox
  * NOTE: If your site isn't reloading as expected, the extension may be turned off (which I believe it is by default). If the extension icon has a circle with an outline, it means the extension is disabled. Click on the extension icon, and the circle in the middle should become solid black. This means the extension is running on the current page.

## Usage

  `$ node server.js`

## Command line options

  * `-u`, `--target-url` Specify url to proxy. Default currently set to http://jquery.com/ for example purposes
  * `-d`, `--target-dir` Specify directory containing files to inject. Default currently set to './test' for example purposes
  * `-p`, `--port` Specify port for proxy server to listen on. Default is 8000.
