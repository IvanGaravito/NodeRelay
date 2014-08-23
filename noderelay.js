'use strict'

/*
	LIBRARIES
*/
var net = require('net')

/*
  FUNCTIONS
*/
var forEach = require('./lib/forEach')
  , invoke = require('./lib/invoke')
  , isEmpty = require('./lib/invoke')
  , merge = require('./lib/merge')

/*
  CONFIG
*/
var cfg = require('./etc/config') || {}                     //User defined config
  , cfgDefaults = require('./etc/config.defaults') || {}    //Default config

//Prepares configuration
cfg = merge(cfg, cfgDefaults)

/*
  GLOBAL VARS
*/
var connList = []           //List of socket connections
  , hostTrack = {}          //Track of hosts connected to which server from the pool
  , serverPool = {}         //List of servers accepting connections

//Direct access vars
var cfgPool

cfgPool = cfg.pool

/*
	INITIALIZATION
*/
console.log('Initializing...')

//Catches the process exit
process.on('exit', _exit)

//Sends uncaught exceptions to console
process.on('uncaughtException', function (err) {
	console.error(err)
})

console.log('Creating server pool...')

//Creates server pool
forEach(cfgPool, function (params, port) {
    var server, serverName, serverOn, isDynamic, localHost

    localHost = cfg.localHost

    console.log('Creating new server for ' + localHost + ':' + port + '...')

    //Creates a new server
    server = serverPool[port] = net.createServer()
    serverOn = server.on.bind(server)

    //Sets maximum retry times
    server.listenRetryTimes = cfg.listenRetryTimes

    //Sets server name to the port
    serverName = server.name = port

    //Sets if server is used for dynamic redirection
    isDynamic = server.isDynamic = isEmpty(params)

    //Sets server listening event handler
    serverOn('listening', function () {
        var address
        address = this.address()
        console.log('NodeRelay iniciado y esperando conexiones en ' + address.address + ':' + address.port)
    })

    //Sets server connection event handler
    serverOn('connection', function (socket) {
        var dstOptions                  //Destiny connection options
          , dstSocket                   //Socket for destiny connection
          , dstHost
          , dstPort
          , name
          , remoteAddress
          , remotePort
          , stamp
          , closeFrom

        //Local connection time stamp
        stamp = new Date()

        //Caches vars
        remoteAddress = socket.remoteAddress
        remotePort = socket.remotePort
        name = remoteAddress + ':' + remotePort   //Connection name is host:port
        serverName = server.name

        console.log('New connection from ' + name)

        //Checks if it's a server for dynamic redirection
        if (isDynamic) {
            //Checks if exists a previous record for this host
            if (hostTrack.hasOwnProperty(remoteAddress)) {
                //Updates params to these that last server uses
                params = cfgPool[hostTrack[remoteAddress]]
                //Uses the server port as the fixed port
                params.dstPort = serverName
            } else {
                console.log('Host ' + name + ' has not been track! Closing connection.')
                //Ends connection
                socket.end()
                return
            }
        } else {
            //Tracks remote host to which port is connected
            hostTrack[remoteAddress] = serverName
        }

        dstHost = params.dstHost
        dstPort = params.dstPort

        //Prepares socket options and makes destiny connection
        dstOptions = makeConnectionOptions(dstPort, dstHost, params.srcHost)
        dstSocket = net.connect(dstOptions)

        //Pipes local/destiny sockets
        dstSocket.pipe(socket).pipe(dstSocket)

        //Connection event handler
        dstSocket.on('connect', function () {
          console.log('Remote connection successfully. Creating pipe ' + name + ' <=> ' + dstHost + ':' + dstPort)
        })

        dstSocket.on('close', function () {
          if (closeFrom === undefined) {
            closeFrom = 'rmte'
            console.log('Remote connection closed. Closing original connection...')
            socket.end()
          } else {
            console.log('Pipe ' + name + ' <=> ' + dstHost + ':' + dstPort + ' finished')
            delete connList[name]
          }
        })

        //Connection closed event handler
        socket.on('close', function (had_error) {
          if (closeFrom === undefined) {
            closeFrom = 'orig'
            console.log('Original connection closed. Closing remote connection...')
            socket.end()
          } else {
            console.log('Pipe ' + name + ' <=> ' + dstHost + ':' + dstPort + ' finished')
            delete connList[name]
          }
        })

        //Records connections
        connList[name] = {
            sockets: [socket, dstSocket]
          , stamp: stamp
        }
    })
    //Server closed
    serverOn('close', function () {
    })
    //Server error handling
    serverOn('error', function (e) {
        //Checks if cannot bind to port
        if (e.code == 'EADDRINUSE') {
            var retries = this.listenRetryTimes--   //Retry times left
            //Can we retry?
            if (retries > 0) {
                console.error('Address in use, retrying in ' + cfg.listenRetryTimeout + 'ms')
                //Schedule next retry
                setTimeout(server.startListen, cfg.listenRetryTimeout)
            } else {
                console.error('Cannot bind NodeRelay at ' + localHost + ':' + this.name + '. Exiting!')
                process.exit(1)
            }
        } else {
            console.error(e)
        }
    })
    server.startListen = function () {
        var name
        name = this.name
        if(cfg.localHost === '0.0.0.0') {
            console.log('Binding server to 0.0.0.0:' + name + '...')
            server.listen(name)
        } else {
            console.log('Binding server to ' + localHost + ':' + name + '...')
            server.listen(name, localHost)
        }
    }
})

//Commands each serverat pool to start listening
invoke(serverPool, 'startListen')

console.log('NodeRelay started!')

/*
    APPLICATION FUNCTIONS
*/
function _exit() {
    console.log('Terminando NodeRelay...')

    //Closing each server at pool
    console.log('Closing servers...')
    invoke(serverPool, 'close')

    console.log('Closing connections...')

    //Closing connections
    forEach(connList, function (item) {
        console.log('Ending connection ' + item.name + '...')
        item.sockets.end()
    })

    console.log('NodeRelay terminated!')
}

function makeConnectionOptions(port, host, localAddress) {
    var opt = {
        port: port  //Remote port to connect to
      , host: host  //Remote host to connect to
    }
    //Checks if defined a local address to get out
    if (!isEmpty(localAddress) && localAddress !== '0.0.0.0') {
        opt.localAddress = localAddress
    }
    return opt
}
