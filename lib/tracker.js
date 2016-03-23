'use strict'
var log = require('./log')
var pad = require('lodash/padStart')

/**
 * @module tracker
 * @memberof NodeRelay
 */

// Coonection list
var redirections = []
var clients = {}
var servers = {}

/**
  * @function getId
  * @param {number} localPort - The local server port
  * @returns {string} An *unique* id composed of five digits followed by three digits and separated by a slash
  * @private
  */
function getId (localPort) {
  return pad(localPort, 5, '0') + '-' + pad(Math.floor(Math.random() * 999) + 1, 3, '0')
}

/**
  * @function hasId
  * @param {string} id - The id looking for
  * @param {Object} item - The redirection item to look at
  * @returns {boolean} True if match otherwise false
  * @private
  */
function hasId (id, item) {
  return item.id === id
}

/**
* @function getDynamicServiceHost
* @param {string} clientAddress - The client IP address
* @returns {string|undefined} Service address to redirect to or undefined when it's an untracked client
* @inner
*/
module.exports.getDynamicServiceHost = function (clientAddress) {
  var port = clients[clientAddress]
  if (!port) return
  return servers[port].serviceHost
}

/**
  * Return the redirection collection
  * @function getRedirections
  * @returns {Object} The redirection collection
  * @inner
  */
module.exports.getRedirections = function () {
  return redirections
}

/**
  * Return the server collection
  * @function getServers
  * @returns {Object} The server collection
  * @inner
  */
module.exports.getServers = function () {
  return servers
}

/**
  * @function trackClient
  * @param {number} localPort - The local server port
  * @param {string} clientAddress - The client IP address
  * @inner
  */
module.exports.trackClient = function (localPort, clientAddress) {
  clients[clientAddress] = localPort
}

/**
  * @function trackRedirection
  * @param {number} localPort - The local server port
  * @param {Socket} clientSocket - The client socket connection
  * @param {Socket} serviceSocket - The service socket connection
  * @inner
  */
module.exports.trackRedirection = function (localPort, clientSocket, serviceSocket) {
  var closeFrom, id, serviceHost, servicePort

  id = getId(localPort)
  serviceHost = serviceSocket.remoteAddress
  servicePort = serviceSocket.remotePort
  log.connection('Redirection id ' + id + ' from ' + localPort + ' to ' + serviceHost + ':' + servicePort + ' started')

  redirections.push({
    id: id,
    localPort: localPort,
    sockets: [clientSocket, serviceSocket],
    timestamp: Date.now()
  })

  serviceSocket.on('close', function () {
    if (closeFrom === undefined) {
      closeFrom = 'service'
      log.connection('Remote connection closed. Closing client connection...')
      clientSocket.end()
    } else {
      log.connection('Redirection ' + id + ' from ' + localPort + ' to ' + serviceHost + ':' + servicePort + ' finished')
      module.exports.untrackRedirection(id)
    }
  })

  // Connection closed event handler
  clientSocket.on('close', function (had_error) {
    if (closeFrom === undefined) {
      closeFrom = 'client'
      log.connection('Client connection closed. Closing service connection...')
      clientSocket.end()
    } else {
      log.connection('Redirection ' + id + ' from ' + localPort + ' to ' + serviceHost + ':' + servicePort + ' finished')
      module.exports.untrackRedirection(id)
    }
  })
}

/**
  * Keep track of a server
  * @function trackServer
  * @param {LocalServer} server - The local server
  * @returns {LocalServer} The **server** param
  * @inner
  */
module.exports.trackServer = function (server) {
  return (servers[server.localPort] = server)
}

/**
  * @function untrackRedirection
  * @param {string} id - The redirection id to remove
  * @inner
  */
module.exports.untrackRedirection = function (id) {
  var index = redirections.findIndex(hasId.bind(null, id))
  if (index !== -1) {
    delete redirections[index]
  }
}

/**
 * @external Socket
 * @see https://nodejs.org/dist/latest-v4.x/docs/api/net.html#net_class_net_socket
 */
