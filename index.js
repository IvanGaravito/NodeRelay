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
  FUNCTIONS
*/
var forEach = require('lodash/forEach')
var isEmpty = require('lodash/isEmpty')
var invoke = require('./lib/invoke')
var LocalServer = require('./lib/LocalServer')
var log = require('./lib/log')

/*
  GLOBAL VARS
*/
var connList = []           // List of socket connections
var hostTrack = {}          // Track of hosts connected to which server from the pool
var serverPool = {}         // List of servers accepting connections

// Direct access vars
var cfgPool

cfgPool = config.pool

/*
	INITIALIZATION
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

function clientTrack (localPort, clientAddress) {
  hostTrack[clientAddress] = localPort
}

function getDynamicServiceHost (clientAddress) {
  // Checks if exists a previous record for this host
  if (hostTrack.hasOwnProperty(clientAddress)) {
    // Updates params to these that last server uses
    var params = serverPool[hostTrack[clientAddress]]
    // Uses the server port as the fixed port
    return params.serviceHost
  }
  return
}

function redirectionTrack (localPort, clientSocket, serviceSocket) {
  connList[localPort] = {
    sockets: [clientSocket, serviceSocket],
    timestamp: Date.now()
  }
}

// Creates server pool
config.pool.forEach(function (params) {
  var sq
  sq = ASQ(params)
    .val(function prepareOptions (options) {
      options.localHost = config.localHost
      return options
    })
    .val(function createServer (options) {
      log.debug('Creating new server for "' + options.localHost + ':' + options.localPort + '"...')
      return new LocalServer(options)
    })
    .val(function overrideServer (server) {
      log.debug('Overriding server "' + server.localHost + ':' + server.localPort + '"...')
      server.getDynamicServiceHost = getDynamicServiceHost.bind(server)
    })
    .then(function startServer (done, server) {
      log.debug('Starting server for "' + server.localHost + ':' + server.localPort + '"...')
      server.on('error', done.fail)
      server.on('listening', done)
      server.start()
    })
    .val(function addToPool (server) {
      log.debug('Adding server "' + server.localHost + ':' + server.localPort + '" to pool...')
      return serverPool[server.localPort] = server
    })
    .val(function linkEvents (server) {
      server.on('client-connection', clientTrack)
      server.on('service-redirection', redirectionTrack)
    })


    rdirSocket.on('close', function () {
      if (closeFrom === undefined) {
        closeFrom = 'rmte'
        log.connection('Remote connection closed. Closing original connection...')
        origSocket.end()
      } else {
        log.connection('Pipe ' + name + ' <=> ' + rdirHost + ':' + rdirPort + ' finished')
        delete connList[name]
      }
    })

    // Connection closed event handler
    origSocket.on('close', function (had_error) {
      if (closeFrom === undefined) {
        closeFrom = 'orig'
        log.connection('Original connection closed. Closing remote connection...')
        origSocket.end()
      } else {
        log.connection('Pipe ' + name + ' <=> ' + rdirHost + ':' + rdirPort + ' finished')
        delete connList[name]
      }
    })

  })
  // Server error handling
  serverOn('error', function (e) {
    // Checks if cannot bind to port
    if (e.code === 'EADDRINUSE') {
      var retries = this.listenRetryTimes--   // Retry times left
      // Can we retry?
      if (retries > 0) {
        log.error('Address in use, retrying in ' + config.listenRetryTimeout + 'ms')
        // Schedule next retry
        setTimeout(server.startListen, config.listenRetryTimeout)
      } else {
        log.error('Cannot bind NodeRelay at ' + localHost + ':' + this.name + '. Exiting!')
        process.exit(1)
      }
    } else {
      log.error(e)
    }
  })
})

// Commands each serverat pool to start listening
invoke(serverPool, 'startListen')

log.info('NodeRelay started!')

/*
    APPLICATION FUNCTIONS
*/
function _exit () {
  log.info('Terminando NodeRelay...')

  // Closing each server at pool
  log.debug('Closing servers...')
  invoke(serverPool, 'close')

  log.debug('Closing connections...')

  // Closing connections
  forEach(connList, function (item) {
    log.debug('Ending connection ' + item.name + '...')
    item.sockets.origSocket.end()
    item.sockets.rdirSocket.end()
  })

  log.info('NodeRelay terminated!')
  setTimeout(process.exit, 1000)
}
