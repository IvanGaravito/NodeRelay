'use strict'

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
