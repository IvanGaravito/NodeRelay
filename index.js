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
var config = require('config')
var net = require('net')

/*
  FUNCTIONS
*/
var forEach = require('lodash/forEach')
var isEmpty = require('lodash/isEmpty')
var invoke = require('./lib/invoke')
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

// Creates server pool
forEach(cfgPool, function (params, port) {
  var server, serverName, serverOn, isDynamic, localHost

  localHost = config.localHost

  log.debug('Creating new server for ' + localHost + ':' + port + '...')

  // Creates a new server
  server = serverPool[port] = net.createServer()
  serverOn = server.on.bind(server)

  // Sets maximum retry times
  server.listenRetryTimes = config.listenRetryTimes

  // Sets server name to the port
  serverName = server.name = port

  // Sets if server is used for dynamic redirection
  isDynamic = server.isDynamic = isEmpty(params)
  log.debug('Server is', (isDynamic ? 'dynamic' : 'static'))

  // Sets server listening event handler
  serverOn('listening', function () {
    var address
    address = this.address()
    log.debug('NodeRelay started and waiting connections at ' + address.address + ':' + address.port)
  })

  // Sets server connection event handler
  serverOn('connection', function (origSocket) {
    var rdirOptions                   // Destiny connection options
    var rdirSocket                    // Socket for destiny connection
    var rdirHost, rdirPort, name, origAddress, origPort, stamp, closeFrom

    // Local connection time stamp
    stamp = new Date()

    // Caches vars
    origAddress = origSocket.remoteAddress
    origPort = origSocket.remotePort
    name = origAddress + ':' + origPort   // Connection name is host:port
    serverName = server.name

    log.connection('New connection from ' + name)

    // Checks if it's a server for dynamic redirection
    if (isDynamic) {
      // Checks if exists a previous record for this host
      if (hostTrack.hasOwnProperty(origAddress)) {
        // Updates params to these that last server uses
        params = cfgPool[hostTrack[origAddress]]
        // Uses the server port as the fixed port
        params.rdirPort = serverName
      } else {
        log.error('Host ' + name + ' has not been tracked! Closing connection.')
        // Ends connection
        origSocket.end()
        return
      }
    } else {
      // Tracks remote host to which port is connected
      hostTrack[origAddress] = serverName
    }

    rdirHost = params.rdirHost
    rdirPort = params.rdirPort

    // Prepares socket options and makes redirection connection
    rdirOptions = {
      port: rdirPort, // Remote port to connect to
      host: rdirHost  // Remote host to connect to
    }
    rdirSocket = net.connect(rdirOptions)

    // Pipes local/destiny sockets
    rdirSocket.pipe(origSocket).pipe(rdirSocket)

    // Connection event handler
    rdirSocket.on('connect', function () {
      log.connection('Remote connection successfully. Creating pipe ' + name + ' <=> ' + rdirHost + ':' + rdirPort)
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

    // Records connections
    connList[name] = {
      sockets: [origSocket, rdirSocket],
      stamp: stamp
    }
  })
  // Server closed
  serverOn('close', function () {
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
  server.startListen = function () {
    var name
    name = this.name
    if (config.localHost === '0.0.0.0') {
      log.info('Binding server to 0.0.0.0:' + name + '...')
      server.listen(name)
    } else {
      log.info('Binding server to ' + localHost + ':' + name + '...')
      server.listen(name, localHost)
    }
  }
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
