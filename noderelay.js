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
  , connList = []           //List of socket connections
  , hostTrack = {}          //Track of hosts connected to which server from the pool
  , serverPool = {}         //List of servers accepting connections

//Prepares configuration
cfg = merge(cfg, cfgDefaults)

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
forEach(cfg.pool, function (params, port) {
    console.log('Creating new server for ' + cfg.localHost + ':' + port + '...')

    //Creates a new server
    var server = serverPool[port] = net.createServer()

    //Sets maximum retry times
    server.listenRetryTimes = cfg.listenRetryTimes

    //Sets server name to the port
    server.name = port

    //Sets if server is used for dynamic redirection
    server.isDynamic = isEmpty(params)

    //Sets server listening event handler
    server.on('listening', function () {
        console.log('NodeRelay iniciado y esperando conexiones en ' + this.address().address + ':' + this.address().port)
    })

    //Sets server connection event handler
    server.on('connection', function (socket) {
        var dstOptions                  //Destiny connection options
          , dstSocket                   //Socket for destiny connection
          , name = socket.remoteAddress + ':' + socket.remotePort   //Connection name is host:port
          , stamp = new Date()          //Local connection time stamp

        console.log('New connection from ' + name)

        //Checks if it's a server for dynamic redirection
        if (server.isDynamic) {
            //Checks if exists a previous record for this host
            if (socket.remoteAddress in hostTrack) {
                //Updates params to these that last server uses
                params = cfg.pool[hostTrack[socket.remoteAddress]]
                //Uses the server port as the fixed port
                params.dstPort = server.name
            } else {
                console.log('Host ' + name + ' has not been track! Closing connection.')
                //Ends connection
                socket.end()
                return
            }
        } else {
            //Tracks remote host to which port is connected
            hostTrack[socket.remoteAddress] = server.name
        }

        //Prepares socket options and makes destiny connection
        dstOptions = makeConnectionOptions(params.dstPort, params.dstHost, params.srcHost)
        dstSocket = net.connect(dstOptions)

        //Pipes local/destiny sockets
        dstSocket.pipe(socket).pipe(dstSocket)

        //Connection event handler
        dstSocket.on('connect', function () {
            console.log('Remote connection successfully. Creating pipe ' +
                name + ' <=> ' + params.dstHost + ':' + params.dstPort
            )
        })

        //Connection closed event handler
        socket.on('close', function (had_error) {
            console.log('Pipe ' +
                name + ' <=> ' + params.dstHost + ':' + params.dstPort + ' finished'
            )
            delete connList[name]
        })

        //Records connections
        connList[name] = {
            sockets: [socket, dstSocket]
          , stamp: stamp
        }
    })
    //Server closed
    server.on('close', function () {
    })
    //Server error handling
    server.on('error', function (e) {
        //Checks if cannot bind to port
        if (e.code == 'EADDRINUSE') {
            var retries = this.listenRetryTimes--   //Retry times left
            //Can we retry?
            if (retries > 0) {
                console.error('Address in use, retrying in ' + cfg.listenRetryTimeout + 'ms')
                //Schedule next retry
                setTimeout(server.startListen, cfg.listenRetryTimeout)
            } else {
                console.error('Cannot bind NodeRelay at ' + cfg.localHost + ':' + this.name + '. Exiting!')
                process.exit(1)
            }
        } else {
            console.error(e)
        }
    })
    server.startListen = function () {
        if(cfg.localHost === '0.0.0.0') {
            console.log('Binding server to 0.0.0.0:' + this.name + '...')
            server.listen(this.name)
        } else {
            console.log('Binding server to ' + cfg.localHost + ':' + this.name + '...')
            server.listen(this.name, cfg.localHost)
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
