'use strict'
/**
 * @module NodeRelay
 * @desc A forwarder/redirector server inspired in [WinRelay](http://ntsecurity.nu/toolbox/winrelay/).
 * @author Ivan Garavito <ivangaravito@gmail.com>
 *
 * ## Introduction
 *
 * This is an app that forwards/redirects data as-is to the servers defined. This helps you to:
 *
 * * Hide your real server address for security reasons.
 * * Separate networks between clients and services.
 * * Serve data from an isolated network by redirecting only the services you need.
 *
 * ## Installation
 * All you need to get it with your is:
 *
 * 1. Install [Node.js](http://nodejs.org/). Optionally, you can use [node-install](https://github.com/IvanGaravito/node-install)
 * 2. Install [NodeRelay][] with NPM:
 * ``` bash
 * ૐ » ~ λ npm install -g NodeRelay
 * ```
 * or if you need root permissions:
 * ``` bash
 * ૐ » ~ λ sudo npm install -g NodeRelay
 * ```
 *
 * ## Quick Start
 *
 * Let's say you have a fixed HTTP service at `127.0.0.1:3000`, and you want to access using `port 80`. All you need to do
 * is create the file `config/local.json5` and write the following lines:
 *
 * ``` json5
 * {
 *   localHost: '0.0.0.0',
 *   pool: [
 *     {
 *       localPort: 80
 *       rdirHost: '127.0.0.1',
 *       rdirPort: 3000
 *     }
 *   ]
 * }
 * ```
 *
 * After [NodeRelay][] configuration is ready, simply run the app:
 *
 * ``` bash
 *   $ cd /path/to/NodeRelay
 *   $ node .
 * ```
 *
 * ## Terminology
 *
 * First of all, let's define the terminology used into this app.
 *
 * * `service`, is the server where you want to redirect.
 * * `local`, is here, where [NodeRelay][] is installed and redirecting.
 * * `client`, is the host connecting to `local` and redirected to `service`.
 * * `localserver` or `server`, is the server needed at local to get client connection and redirect it to service.
 *
 * ## Configuration
 *
 * Well documented, the default options are stored inside `config/default.json5` file, and the user defined configuration
 * is inside the `config/local.json5` file, which can be reduced to something like the following:
 *
 * ``` json5
 * {
 *   localHost: '127.0.0.1',
 *   pool: [
 *     {
 *       localPort: <localPort>,
 *       serverHost: '<serverHost>',
 *       serverPort: <serverPort>
 *     }
 *   ]
 * }
 * ```
 *
 * `localHost` defines the IP address where [NodeRelay][] is going to be listening to.
 *
 * `pool` is the port list where is defined for each local port to which server to redirect to:
 *
 * * `localPort` is the port at the local host to listen to new connections.
 * * `serverHost` is the server's address to redirect to.
 * * `serverPort` is the port at the server to redirect to.
 *
 * ## Dynamic Forwarding/Redirection
 *
 * Let's say you have two *servers* within a LAN network isolated from your Internet connection. These servers have a HTTP
 * service for *UI* purposes, then the UI connects to a *fixed port* `3000` (and you cannot change it) for polling data.
 * How you can make [NodeRelay][] connect dynamically to that fixed port at the proper server?
 *
 * Well, it's as easy as defining a local port with no server connection params at the pool. Your `local.json5` file should
 * look like this:
 *
 * ``` json5
 * {
 *   localHost: 'my_isp_assing_ip',
 *   pool: [
 *     {	//DEVICE 1
 *       localPort: 81,
 *       serverHost: '192.168.1.101',
 *       serverPort: 80
 *     },
 *     {	//DEVICE 2
 *       localPort: 82,
 *       serverHost: '192.168.1.102',
 *       serverPort: 80
 *     },
 *     {	//FIXED PORT FOR DYNAMIC FORWARDING/REDIRECTION
 *       localPort: 3000
 *     }
 *   ]
 * }
 * ```
 *
 * ## API
 */

/*
	LIBRARIES
*/
var ASQ = require('asynquence')
var config = require('config')

/*
  FUNCTIONS AND CLASSES
*/
var LocalServer = require('./lib/LocalServer')
var log = require('./lib/log')
var tracker = require('./lib/tracker')

/*
	MODULE INITIALIZATION
*/
log.info('Initializing...')

// Catches the process exit
process.on('exit', _exit)
process.on('SIGINT', _exit)

// Sends uncaught exceptions to console
process.on('uncaughtException', function (err) {
  log.error(err)
})

log.debug('Creating server pool...')

// Creates server pool
config.pool.forEach(function (params) {
  ASQ(params)
  .val(function prepareOptions (options) {
    options.localHost = config.localHost
    return options
  })
  .val(function createServer (options) {
    log.debug('Creating new server for "' + options.localHost + ':' + options.localPort + '"...')
    return new LocalServer(options)
  })
  .val(function overrideServer (server) {
    if (server.isDynamicServer) {
      log.debug('Overriding service redirection handler for "' + server.localHost + ':' + server.localPort + '"...')
      server.getDynamicServiceHost = tracker.getDynamicServiceHost.bind(tracker)
    }
    return server
  })
  .then(function startServer (done, server) {
    log.debug('Starting server for "' + server.localHost + ':' + server.localPort + '"...')
    server.on('error', done.fail)
    server.on('listening', done)
    server.start()
    return server
  })
  .val(function trackServer (server) {
    log.debug('Adding server "' + server.localHost + ':' + server.localPort + '" to pool...')
    return tracker.trackServer(server)
  })
  .val(function linkEvents (server) {
    server.on('client-connection', tracker.trackClient)
    server.on('service-redirection', tracker.trackRedirection)
  })
  .or(function (err) {
    // Checks if cannot bind to port
    if (err.code === 'EADDRINUSE') {
      log.error('Cannot bind NodeRelay at ' + params.localHost + ':' + params.localPort + '. Exiting!')
      process.exit(1)
    } else {
      log.error(err)
    }
  })
})

log.info('NodeRelay started!')

/*
    EXIT HANDLING
*/
function _exit () {
  var functions, keys, servers

  // Sends uncaught exceptions to console
  process.on('uncaughtException', function (err) {
    log.error(err)
    process.exit(2)
  })

  log.info('Terminando NodeRelay...')

  servers = tracker.getServers()
  keys = Object.keys(servers)

  functions = keys.map(function (server) {
    return function (done) { servers[server].close(done) }
  })

  // Closing each server at pool
  log.debug('Closing servers...')

  ASQ()
  .gate.apply(null, functions)
  .val(function () {
    var redirections = tracker.getRedirections()

    log.debug('Closing connections...')

    // Closing connections
    redirections.forEach(function (item) {
      log.debug('Ending redirection ' + item.id + '...')
      item.sockets.clientSocket.end()
      item.sockets.serviceSocket.end()
    })
  })
  .val(function () {
    log.info('NodeRelay terminated!')
    setTimeout(process.exit, 500)
  })
}
