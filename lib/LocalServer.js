'use strict'
var EventEmitter = require('events')
var net = require('net')
var UserError = require('node-usererror')
var util = require('util')

module.exports = LocalServer

/**
 * @class LocalServer
 * @classdesc Abstracts the local server that redirect connections from a client to a service
 * @extends external:EventEmitter
 * @emits module:NodeRelay~LocalServer#event:close
 * @emits module:NodeRelay~LocalServer#event:error
 * @emits module:NodeRelay~LocalServer#event:listening
 * @emits module:NodeRelay~LocalServer#event:client-close
 * @emits module:NodeRelay~LocalServer#event:client-connection
 * @emits module:NodeRelay~LocalServer#event:service-close
 * @emits module:NodeRelay~LocalServer#event:service-error
 * @emits module:NodeRelay~LocalServer#event:service-redirection
 * @emits module:NodeRelay~LocalServer#event:service-redirection-dynamic
 * @emits module:NodeRelay~LocalServer#event:service-redirection-fixed
 * @param {Object} options - local and service options
 */
function LocalServer (options) {
  if (!(this instanceof LocalServer)) return new LocalServer(options)
  EventEmitter.call(this)
  this.init(options)
}
util.inherits(LocalServer, EventEmitter)

/**
 * LocalServer error definitions
 * @enum {external:UserError}
 * @readonly
 */
LocalServer.errors = {
  /** No local port defined */
  ENOLOCALPORT: new UserError('No local port defined', 'ENOLOCALPORT'),
  /** No service port defined */
  ENOSERVICEPORT: new UserError('No service port defined', 'ENOSERVICEPORT'),
  /** Service and local are the same */
  ESAMESERVICEANDLOCAL: new UserError('Service and local are the same', 'ESAMESERVICEANDLOCAL'),
  /** Untracked client */
  EUNTRACKEDCLIENT: new UserError('Untracked client accessing dynamic service', 'EUNTRACKEDCLIENT'),
  /** getDynamicServiceHost must be implemented by the app */
  EDYNAMICSERVICE: new UserError('LocalServer#getDynamicServiceHost must be implemented by the app', 'EDYNAMICSERVICE')
}

/**
 * Returns and object with remote port, family and address
 * @param {external:Socket} socket
 * @returns {Object} Object with remote port, family and address
 */
LocalServer.getSocketRemoteParams = function (socket) {
  return {port: socket.remotePort, family: socket.remoteFamily, address: socket.remoteAddress}
}

/**
 * Stop local server from accepting new connections
 */
LocalServer.prototype.close = function (done) {
  this.serverSocket.close(done)
}

/**
 * Connect to service and make client-service redirection
 * @param {external:Socket} clientSocket - Client socket
 * @param {Object} options - Connection options to service
 * @param {string} options.host - Address where is the service
 * @param {string} options.port - TCP port at options.host where is the service
 */
LocalServer.prototype._connectService = function (clientSocket, options) {
  var self, serviceSocket

  self = this
  serviceSocket = net.connect(options)
  serviceSocket.on('connect', function () {
    serviceSocket.on('close', function (had_error) {
      self._emitServiceClose(had_error, serviceSocket)
    })
    serviceSocket.pipe(clientSocket).pipe(serviceSocket)
    self._emitServiceRedirection(clientSocket, serviceSocket)
  })

  serviceSocket.on('error', function (err) {
    if (clientSocket._connRetryTimes === undefined) clientSocket._connRetryTimes = this.connRetryTimes
    if (clientSocket._connRetryTimes) {
      return setTimeout(self._connectService.bind(this, clientSocket, options), this.connRetryTimeout)
    } else {
      clientSocket.destroy()
      self._emitServiceError(err)
    }
  })
}

/**
 * Server close event
 * @event module:NodeRelay~LocalServer#event:close
 */
LocalServer.prototype._emitClose = function () {
  this.emit('close')
}

/**
 * Server error event
 * @event module:NodeRelay~LocalServer#event:error
 * @param err {Error} - The error from local server
 */
LocalServer.prototype._emitError = function (err) {
  if (err.code === 'EADDRINUSE') {
    if (this._listenRetryTimes === undefined) this._listenRetryTimes = this.listenRetryTimes
    if (this._listenRetryTimes) {
      this.serverSocket.close()
      return setTimeout(this.start, this.listenRetryTimeout)
    }
  }
  this.emit('error', err)
}

/**
 * Server listening event
 * @event module:NodeRelay~LocalServer#event:listening
 * @param server {LocalServer} - Server listening
 */
LocalServer.prototype._emitListening = function () {
  this.emit('listening', this)
}

/**
 * Client close event
 * @event module:NodeRelay~LocalServer#event:client-close
 * @param had_error {boolean}
 * @param client {Object} - Details of client connection
 * @param client.port {number} - Client port
 * @param client.family {string} - Client socket family
 * @param client.address {string} - Client address
 */
LocalServer.prototype._emitClientClose = function (had_error, clientSocket) {
  this.emit('client-close', had_error, this.localPort, LocalServer.getSocketRemoteParams(clientSocket))
}

/**
 * Client connection event
 * @event module:NodeRelay~LocalServer#event:client-connection
 * @param had_error {boolean}
 * @param localPort {number} - Server port at local
 * @param clientAddress {string} - Client IP address
 */
LocalServer.prototype._emitClientConnection = function (clientSocket) {
  this.emit('client-connection', this.localPort, clientSocket.remoteAddress)
}

/**
 * Service connection closed event
 * @event module:NodeRelay~LocalServer#event:service-close
 * @param had_error {boolean}
 * @param service {Object} - Details of service connection
 * @param service.port {number} - Service port
 * @param service.family {string} - Service socket family
 * @param service.address {string} - Service address
 */
LocalServer.prototype._emitServiceClose = function (had_error, serviceSocket) {
  this.emit('service-close', had_error, this.localPort, LocalServer.getSocketRemoteParams(serviceSocket))
}

/**
* Connection to service failed event
* @event module:NodeRelay~LocalServer#event:service-error
* @param err {Error}
*/
LocalServer.prototype._emitServiceError = function (err) {
  this.emit('service-error', err)
}

/**
 * Client redirected to service event
 * @event module:NodeRelay~LocalServer#event:service-redirection
 * @param localPort {number} - Server port at local
 * @param client {external:Socket} - Client connection socket
 * @param service {external:Socket} - Service connection socket
 */

 /**
 * Client redirected to a dynamic service event
 * @event module:NodeRelay~LocalServer#event:service-redirection-dynamic
 * @param localPort {number} - Server port at local
 * @param client {external:Socket} - Client connection socket
 * @param service {external:Socket} - Service connection socket
 */

 /**
 * Client redirected to a fixed service event
 * @event module:NodeRelay~LocalServer#event:service-redirection-fixed
 * @param localPort {number} - Server port at local
 * @param client {external:Socket} - Client connection socket
 * @param service {external:Socket} - Service connection socket
 */
LocalServer.prototype._emitServiceRedirection = function (clientSocket, serviceSocket) {
  this.emit('service-redirection', this.localPort, clientSocket, serviceSocket)
  this.emit('service-redirection-' + (this.isDynamicServer ? 'dynamic' : 'fixed'), this.localPort, clientSocket, serviceSocket)
}

/**
 * Initializes the LocalServer instance
 * @param {string} Client IP address
 * @returns {string} Service address when this is a local server for a dynamic redirection
 * @throws {UserError} The app instancing this class must override this method
 */
LocalServer.prototype.getDynamicServiceHost = function (clientAddress) {
  throw LocalServer.errors.EDYNAMICSERVICE
}

/**
 * Initializes the LocalServer instance
 * @param {Object} options - local and service options
 * @param {string} [options.localHost=localhost] - IP address to listen to at local
 * @param {string} options.localPort - TCP port to listen to at localHost
 * @param {string} [options.serviceHost=options.localHost] - Address where is the service
 * @param {string} [options.servicePort=options.localPort] - TCP port at serviceHost where is the service
 * @param {number} [options.listenRetryTimes=1] - Retry times to get the local server up
 * @param {number} [options.listenRetryTimeout=500] - Time in milliseconds to wait before next listen try
 * @param {number} [options.connRetryTimes=1] - Retry times to connect to service
 * @param {number} [options.connRetryTimeout=500] - Time in milliseconds to wait before next connection try
 */
LocalServer.prototype.init = function (options) {
  var isDynamicServer, localHost, localPort, self, serverSocket, serviceHost, servicePort

  this.localHost = options.localHost || 'localhost'
  localPort = this.localPort = options.localPort
  if (!localPort) throw LocalServer.errors.ENOLOCALPORT

  this.name = localHost + ':' + localPort

  isDynamicServer = this.isDynamicServer = options.serviceHost === undefined && options.servicePort === undefined
  if (isDynamicServer) {
    this.serviceHost = this.getDynamicServiceHost
    servicePort = this.servicePort = this.localPort
  } else {
    serviceHost = options.serviceHost || options.localHost
    this.serviceHost = function () { return serviceHost }
    servicePort = this.servicePort = options.servicePort
    if (!servicePort) {
      if (serviceHost === localHost) {
        throw LocalServer.errors.ENOSERVICEPORT
      } else {
        servicePort = this.servicePort = localPort
      }
    }
    if (serviceHost === localHost && servicePort === localPort) throw LocalServer.errors.ESAMESERVICEANDLOCAL
  }

  this.listenRetryTimeout = options.listenRetryTimeout || 500
  this.listenRetryTimes = options.listenRetryTimes || 1
  this.connRetryTimeout = options.connRetryTimeout || 500
  this.connRetryTimes = options.connRetryTimes || 1

  self = this
  serverSocket = this.serverSocket = net.createServer()
  serverSocket.on('connection', self._onConnection.bind(self))
  serverSocket.on('close', self._emitClose.bind(self))
  serverSocket.on('error', self._emitError.bind(self))
  serverSocket.on('listening', self._emitListening.bind(self))
}

/**
 * Client connection handler
 * @param client {external:Socket} - Client connection socket
 */
LocalServer.prototype._onConnection = function (clientSocket) {
  var isDynamicServer, self, serviceHost, servicePort

  self = this
  this._emitClientConnection(clientSocket)
  clientSocket.on('close', function (had_error) {
    self._emitClientClose(had_error, clientSocket)
  })

  isDynamicServer = this.isDynamicServer
  serviceHost = this[isDynamicServer ? 'getDynamicServiceHost' : 'serviceHost'](clientSocket.remoteAddress)
  servicePort = this.servicePort

  if (isDynamicServer) {
    if (!serviceHost) {
      clientSocket.close()
      this._emitError(LocalServer.errors.EUNTRACKEDCLIENT)
      return
    }
  }

  this._connectService(clientSocket, { port: servicePort, host: serviceHost })
}

/**
 * Start local server listening
 */
LocalServer.prototype.start = function () {
  this.serverSocket.listen({ port: this.localPort, host: this.localHost })
}

/**
 * @external Socket
 * @see https://nodejs.org/dist/latest-v4.x/docs/api/net.html#net_class_net_socket
 */

/**
 * @external UserError
 * @see https://github.com/IvanGaravito/node-usererror
 */
