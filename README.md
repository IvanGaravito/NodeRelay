[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)
[![Build Status](https://travis-ci.org/IvanGaravito/NodeRelay.svg?branch=master)](https://travis-ci.org/IvanGaravito/NodeRelay)
[![Coverage Status](https://coveralls.io/repos/IvanGaravito/NodeRelay/badge.svg?branch=master)](https://coveralls.io/r/IvanGaravito/NodeRelay?branch=master)
[![Dependency Status](https://david-dm.org/IvanGaravito/NodeRelay.svg)](https://david-dm.org/IvanGaravito/NodeRelay)
[![devDependency Status](https://david-dm.org/IvanGaravito/NodeRelay/dev-status.svg)](https://david-dm.org/IvanGaravito/NodeRelay#info=devDependencies)
[![NPM pkg](https://img.shields.io/npm/v/noderelay.svg)](https://www.npmjs.com/package/noderelay)
[![NPM dm](https://img.shields.io/npm/dm/noderelay.svg)](https://www.npmjs.com/package/noderelay)
[![Gratipay](https://img.shields.io/gratipay/IvanGaravito.svg)](https://gratipay.com/IvanGaravito)

## Modules

<dl>
<dt><a href="#module_NodeRelay">NodeRelay</a></dt>
<dd><p>A forwarder/redirector server inspired in <a href="http://ntsecurity.nu/toolbox/winrelay/">WinRelay</a>.</p>
</dd>
<dt><a href="#NodeRelay.module_log">log</a></dt>
<dd></dd>
<dt><a href="#NodeRelay.module_tracker">tracker</a></dt>
<dd></dd>
</dl>

<a name="module_NodeRelay"></a>

## NodeRelay
A forwarder/redirector server inspired in [WinRelay](http://ntsecurity.nu/toolbox/winrelay/).

**Author:** Ivan Garavito <ivangaravito@gmail.com>

## Introduction

This is an app that forwards/redirects data as-is to the servers defined. This helps you to:

* Hide your real server address for security reasons.
* Separate networks between clients and services.
* Serve data from an isolated network by redirecting only the services you need.

## Installation
All you need to get it with your is:

1. Install [Node.js](http://nodejs.org/). Optionally, you can use [node-install](https://github.com/IvanGaravito/node-install)
2. Install [NodeRelay][] with NPM:
``` bash
ૐ » ~ λ npm install -g NodeRelay
```
or if you need root permissions:
``` bash
ૐ » ~ λ sudo npm install -g NodeRelay
```

## Quick Start

Let's say you have a fixed HTTP service at `127.0.0.1:3000`, and you want to access using `port 80`. All you need to do
is create the file `config/local.json5` and write the following lines:

``` json5
{
  localHost: '0.0.0.0',
  pool: [
    {
      localPort: 80
      rdirHost: '127.0.0.1',
      rdirPort: 3000
    }
  ]
}
```

After [NodeRelay][] configuration is ready, simply run the app:

``` bash
  $ cd /path/to/NodeRelay
  $ node .
```

## Terminology

First of all, let's define the terminology used into this app.

* `service`, is the server where you want to redirect.
* `local`, is here, where [NodeRelay][] is installed and redirecting.
* `client`, is the host connecting to `local` and redirected to `service`.
* `localserver` or `server`, is the server needed at local to get client connection and redirect it to service.

## Configuration

Well documented, the default options are stored inside `config/default.json5` file, and the user defined configuration
is inside the `config/local.json5` file, which can be reduced to something like the following:

``` json5
{
  localHost: '127.0.0.1',
  pool: [
    {
      localPort: <localPort>,
      serverHost: '<serverHost>',
      serverPort: <serverPort>
    }
  ]
}
```

`localHost` defines the IP address where [NodeRelay][] is going to be listening to.

`pool` is the port list where is defined for each local port to which server to redirect to:

* `localPort` is the port at the local host to listen to new connections.
* `serverHost` is the server's address to redirect to.
* `serverPort` is the port at the server to redirect to.

## Dynamic Forwarding/Redirection

Let's say you have two *servers* within a LAN network isolated from your Internet connection. These servers have a HTTP
service for *UI* purposes, then the UI connects to a *fixed port* `3000` (and you cannot change it) for polling data.
How you can make [NodeRelay][] connect dynamically to that fixed port at the proper server?

Well, it's as easy as defining a local port with no server connection params at the pool. Your `local.json5` file should
look like this:

``` json5
{
  localHost: 'my_isp_assing_ip',
  pool: [
    {	//DEVICE 1
      localPort: 81,
      serverHost: '192.168.1.101',
      serverPort: 80
    },
    {	//DEVICE 2
      localPort: 82,
      serverHost: '192.168.1.102',
      serverPort: 80
    },
    {	//FIXED PORT FOR DYNAMIC FORWARDING/REDIRECTION
      localPort: 3000
    }
  ]
}
```

## API  

* [NodeRelay](#module_NodeRelay)
    * [~LocalServer](#module_NodeRelay..LocalServer) ⇐ <code>external:EventEmitter</code>
        * [new LocalServer(options)](#new_module_NodeRelay..LocalServer_new)
        * _instance_
            * [.close()](#module_NodeRelay..LocalServer+close)
            * [._connectService(clientSocket, options)](#module_NodeRelay..LocalServer+_connectService)
            * [.getDynamicServiceHost(Client)](#module_NodeRelay..LocalServer+getDynamicServiceHost) ⇒ <code>string</code>
            * [.init(options)](#module_NodeRelay..LocalServer+init)
            * [._onConnection(client)](#module_NodeRelay..LocalServer+_onConnection)
            * [.start()](#module_NodeRelay..LocalServer+start)
            * ["event:close"](#module_NodeRelay..LocalServer+event_close)
            * ["event:error" (err)](#module_NodeRelay..LocalServer+event_error)
            * ["event:listening" (server)](#module_NodeRelay..LocalServer+event_listening)
            * ["event:client-close" (had_error, client)](#module_NodeRelay..LocalServer+event_client-close)
            * ["event:client-connection" (had_error, localPort, clientAddress)](#module_NodeRelay..LocalServer+event_client-connection)
            * ["event:service-close" (had_error, service)](#module_NodeRelay..LocalServer+event_service-close)
            * ["event:service-error" (err)](#module_NodeRelay..LocalServer+event_service-error)
            * ["event:service-redirection" (localPort, client, service)](#module_NodeRelay..LocalServer+event_service-redirection)
            * ["event:service-redirection-dynamic" (localPort, client, service)](#module_NodeRelay..LocalServer+event_service-redirection-dynamic)
            * ["event:service-redirection-fixed" (localPort, client, service)](#module_NodeRelay..LocalServer+event_service-redirection-fixed)
        * _static_
            * [.errors](#module_NodeRelay..LocalServer.errors) : <code>enum</code>
            * [.getSocketRemoteParams(socket)](#module_NodeRelay..LocalServer.getSocketRemoteParams) ⇒ <code>Object</code>

<a name="module_NodeRelay..LocalServer"></a>

### NodeRelay~LocalServer ⇐ <code>external:EventEmitter</code>
Abstracts the local server that redirect connections from a client to a service

**Kind**: inner class of <code>[NodeRelay](#module_NodeRelay)</code>  
**Extends:** <code>external:EventEmitter</code>  
**Emits**: <code>[event:close](#module_NodeRelay..LocalServer+event_close)</code>, <code>[event:error](#module_NodeRelay..LocalServer+event_error)</code>, <code>[event:listening](#module_NodeRelay..LocalServer+event_listening)</code>, <code>[event:client-close](#module_NodeRelay..LocalServer+event_client-close)</code>, <code>[event:client-connection](#module_NodeRelay..LocalServer+event_client-connection)</code>, <code>[event:service-close](#module_NodeRelay..LocalServer+event_service-close)</code>, <code>[event:service-error](#module_NodeRelay..LocalServer+event_service-error)</code>, <code>[event:service-redirection](#module_NodeRelay..LocalServer+event_service-redirection)</code>, <code>[event:service-redirection-dynamic](#module_NodeRelay..LocalServer+event_service-redirection-dynamic)</code>, <code>[event:service-redirection-fixed](#module_NodeRelay..LocalServer+event_service-redirection-fixed)</code>  

* [~LocalServer](#module_NodeRelay..LocalServer) ⇐ <code>external:EventEmitter</code>
    * [new LocalServer(options)](#new_module_NodeRelay..LocalServer_new)
    * _instance_
        * [.close()](#module_NodeRelay..LocalServer+close)
        * [._connectService(clientSocket, options)](#module_NodeRelay..LocalServer+_connectService)
        * [.getDynamicServiceHost(Client)](#module_NodeRelay..LocalServer+getDynamicServiceHost) ⇒ <code>string</code>
        * [.init(options)](#module_NodeRelay..LocalServer+init)
        * [._onConnection(client)](#module_NodeRelay..LocalServer+_onConnection)
        * [.start()](#module_NodeRelay..LocalServer+start)
        * ["event:close"](#module_NodeRelay..LocalServer+event_close)
        * ["event:error" (err)](#module_NodeRelay..LocalServer+event_error)
        * ["event:listening" (server)](#module_NodeRelay..LocalServer+event_listening)
        * ["event:client-close" (had_error, client)](#module_NodeRelay..LocalServer+event_client-close)
        * ["event:client-connection" (had_error, localPort, clientAddress)](#module_NodeRelay..LocalServer+event_client-connection)
        * ["event:service-close" (had_error, service)](#module_NodeRelay..LocalServer+event_service-close)
        * ["event:service-error" (err)](#module_NodeRelay..LocalServer+event_service-error)
        * ["event:service-redirection" (localPort, client, service)](#module_NodeRelay..LocalServer+event_service-redirection)
        * ["event:service-redirection-dynamic" (localPort, client, service)](#module_NodeRelay..LocalServer+event_service-redirection-dynamic)
        * ["event:service-redirection-fixed" (localPort, client, service)](#module_NodeRelay..LocalServer+event_service-redirection-fixed)
    * _static_
        * [.errors](#module_NodeRelay..LocalServer.errors) : <code>enum</code>
        * [.getSocketRemoteParams(socket)](#module_NodeRelay..LocalServer.getSocketRemoteParams) ⇒ <code>Object</code>

<a name="new_module_NodeRelay..LocalServer_new"></a>

#### new LocalServer(options)

| Param | Type | Description |
| --- | --- | --- |
| options | <code>Object</code> | local and service options |

<a name="module_NodeRelay..LocalServer+close"></a>

#### localServer.close()
Stop local server from accepting new connections

**Kind**: instance method of <code>[LocalServer](#module_NodeRelay..LocalServer)</code>  
<a name="module_NodeRelay..LocalServer+_connectService"></a>

#### localServer._connectService(clientSocket, options)
Connect to service and make client-service redirection

**Kind**: instance method of <code>[LocalServer](#module_NodeRelay..LocalServer)</code>  

| Param | Type | Description |
| --- | --- | --- |
| clientSocket | <code>[Socket](https://nodejs.org/dist/latest-v4.x/docs/api/net.html#net_class_net_socket)</code> | Client socket |
| options | <code>Object</code> | Connection options to service |
| options.host | <code>string</code> | Address where is the service |
| options.port | <code>string</code> | TCP port at options.host where is the service |

<a name="module_NodeRelay..LocalServer+getDynamicServiceHost"></a>

#### localServer.getDynamicServiceHost(Client) ⇒ <code>string</code>
Initializes the LocalServer instance

**Kind**: instance method of <code>[LocalServer](#module_NodeRelay..LocalServer)</code>  
**Returns**: <code>string</code> - Service address when this is a local server for a dynamic redirection  
**Throws**:

- <code>UserError</code> The app instancing this class must override this method


| Param | Type | Description |
| --- | --- | --- |
| Client | <code>string</code> | IP address |

<a name="module_NodeRelay..LocalServer+init"></a>

#### localServer.init(options)
Initializes the LocalServer instance

**Kind**: instance method of <code>[LocalServer](#module_NodeRelay..LocalServer)</code>  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| options | <code>Object</code> |  | local and service options |
| [options.localHost] | <code>string</code> | <code>&quot;localhost&quot;</code> | IP address to listen to at local |
| options.localPort | <code>string</code> |  | TCP port to listen to at localHost |
| [options.serviceHost] | <code>string</code> | <code>&quot;options.localHost&quot;</code> | Address where is the service |
| [options.servicePort] | <code>string</code> | <code>&quot;options.localPort&quot;</code> | TCP port at serviceHost where is the service |
| [options.listenRetryTimes] | <code>number</code> | <code>1</code> | Retry times to get the local server up |
| [options.listenRetryTimeout] | <code>number</code> | <code>500</code> | Time in milliseconds to wait before next listen try |
| [options.connRetryTimes] | <code>number</code> | <code>1</code> | Retry times to connect to service |
| [options.connRetryTimeout] | <code>number</code> | <code>500</code> | Time in milliseconds to wait before next connection try |

<a name="module_NodeRelay..LocalServer+_onConnection"></a>

#### localServer._onConnection(client)
Client connection handler

**Kind**: instance method of <code>[LocalServer](#module_NodeRelay..LocalServer)</code>  

| Param | Type | Description |
| --- | --- | --- |
| client | <code>[Socket](https://nodejs.org/dist/latest-v4.x/docs/api/net.html#net_class_net_socket)</code> | Client connection socket |

<a name="module_NodeRelay..LocalServer+start"></a>

#### localServer.start()
Start local server listening

**Kind**: instance method of <code>[LocalServer](#module_NodeRelay..LocalServer)</code>  
<a name="module_NodeRelay..LocalServer+event_close"></a>

#### "event:close"
Server close event

**Kind**: event emitted by <code>[LocalServer](#module_NodeRelay..LocalServer)</code>  
<a name="module_NodeRelay..LocalServer+event_error"></a>

#### "event:error" (err)
Server error event

**Kind**: event emitted by <code>[LocalServer](#module_NodeRelay..LocalServer)</code>  

| Param | Type | Description |
| --- | --- | --- |
| err | <code>Error</code> | The error from local server |

<a name="module_NodeRelay..LocalServer+event_listening"></a>

#### "event:listening" (server)
Server listening event

**Kind**: event emitted by <code>[LocalServer](#module_NodeRelay..LocalServer)</code>  

| Param | Type | Description |
| --- | --- | --- |
| server | <code>LocalServer</code> | Server listening |

<a name="module_NodeRelay..LocalServer+event_client-close"></a>

#### "event:client-close" (had_error, client)
Client close event

**Kind**: event emitted by <code>[LocalServer](#module_NodeRelay..LocalServer)</code>  

| Param | Type | Description |
| --- | --- | --- |
| had_error | <code>boolean</code> |  |
| client | <code>Object</code> | Details of client connection |
| client.port | <code>number</code> | Client port |
| client.family | <code>string</code> | Client socket family |
| client.address | <code>string</code> | Client address |

<a name="module_NodeRelay..LocalServer+event_client-connection"></a>

#### "event:client-connection" (had_error, localPort, clientAddress)
Client connection event

**Kind**: event emitted by <code>[LocalServer](#module_NodeRelay..LocalServer)</code>  

| Param | Type | Description |
| --- | --- | --- |
| had_error | <code>boolean</code> |  |
| localPort | <code>number</code> | Server port at local |
| clientAddress | <code>string</code> | Client IP address |

<a name="module_NodeRelay..LocalServer+event_service-close"></a>

#### "event:service-close" (had_error, service)
Service connection closed event

**Kind**: event emitted by <code>[LocalServer](#module_NodeRelay..LocalServer)</code>  

| Param | Type | Description |
| --- | --- | --- |
| had_error | <code>boolean</code> |  |
| service | <code>Object</code> | Details of service connection |
| service.port | <code>number</code> | Service port |
| service.family | <code>string</code> | Service socket family |
| service.address | <code>string</code> | Service address |

<a name="module_NodeRelay..LocalServer+event_service-error"></a>

#### "event:service-error" (err)
Connection to service failed event

**Kind**: event emitted by <code>[LocalServer](#module_NodeRelay..LocalServer)</code>  

| Param | Type |
| --- | --- |
| err | <code>Error</code> | 

<a name="module_NodeRelay..LocalServer+event_service-redirection"></a>

#### "event:service-redirection" (localPort, client, service)
Client redirected to service event

**Kind**: event emitted by <code>[LocalServer](#module_NodeRelay..LocalServer)</code>  

| Param | Type | Description |
| --- | --- | --- |
| localPort | <code>number</code> | Server port at local |
| client | <code>[Socket](https://nodejs.org/dist/latest-v4.x/docs/api/net.html#net_class_net_socket)</code> | Client connection socket |
| service | <code>[Socket](https://nodejs.org/dist/latest-v4.x/docs/api/net.html#net_class_net_socket)</code> | Service connection socket |

<a name="module_NodeRelay..LocalServer+event_service-redirection-dynamic"></a>

#### "event:service-redirection-dynamic" (localPort, client, service)
Client redirected to a dynamic service event

**Kind**: event emitted by <code>[LocalServer](#module_NodeRelay..LocalServer)</code>  

| Param | Type | Description |
| --- | --- | --- |
| localPort | <code>number</code> | Server port at local |
| client | <code>[Socket](https://nodejs.org/dist/latest-v4.x/docs/api/net.html#net_class_net_socket)</code> | Client connection socket |
| service | <code>[Socket](https://nodejs.org/dist/latest-v4.x/docs/api/net.html#net_class_net_socket)</code> | Service connection socket |

<a name="module_NodeRelay..LocalServer+event_service-redirection-fixed"></a>

#### "event:service-redirection-fixed" (localPort, client, service)
Client redirected to a fixed service event

**Kind**: event emitted by <code>[LocalServer](#module_NodeRelay..LocalServer)</code>  

| Param | Type | Description |
| --- | --- | --- |
| localPort | <code>number</code> | Server port at local |
| client | <code>[Socket](https://nodejs.org/dist/latest-v4.x/docs/api/net.html#net_class_net_socket)</code> | Client connection socket |
| service | <code>[Socket](https://nodejs.org/dist/latest-v4.x/docs/api/net.html#net_class_net_socket)</code> | Service connection socket |

<a name="module_NodeRelay..LocalServer.errors"></a>

#### LocalServer.errors : <code>enum</code>
LocalServer error definitions

**Kind**: static enum property of <code>[LocalServer](#module_NodeRelay..LocalServer)</code>  
**Read only**: true  
**Properties**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| ENOLOCALPORT | <code>[UserError](https://github.com/IvanGaravito/node-usererror)</code> | <code></code> | No local port defined |
| ENOSERVICEPORT | <code>[UserError](https://github.com/IvanGaravito/node-usererror)</code> | <code></code> | No service port defined |
| ESAMESERVICEANDLOCAL | <code>[UserError](https://github.com/IvanGaravito/node-usererror)</code> | <code></code> | Service and local are the same |
| EUNTRACKEDCLIENT | <code>[UserError](https://github.com/IvanGaravito/node-usererror)</code> | <code></code> | Untracked client |
| EDYNAMICSERVICE | <code>[UserError](https://github.com/IvanGaravito/node-usererror)</code> | <code></code> | getDynamicServiceHost must be implemented by the app |

<a name="module_NodeRelay..LocalServer.getSocketRemoteParams"></a>

#### LocalServer.getSocketRemoteParams(socket) ⇒ <code>Object</code>
Returns and object with remote port, family and address

**Kind**: static method of <code>[LocalServer](#module_NodeRelay..LocalServer)</code>  
**Returns**: <code>Object</code> - Object with remote port, family and address  

| Param | Type |
| --- | --- |
| socket | <code>[Socket](https://nodejs.org/dist/latest-v4.x/docs/api/net.html#net_class_net_socket)</code> | 

<a name="NodeRelay.module_log"></a>

## log

* [log](#NodeRelay.module_log)
    * _static_
        * [.levels](#NodeRelay.module_log.levels) : <code>enum</code>
    * _inner_
        * [~info(...args)](#NodeRelay.module_log..info)
        * [~error(...args)](#NodeRelay.module_log..error)
        * [~debug(...args)](#NodeRelay.module_log..debug)
        * [~connection(...args)](#NodeRelay.module_log..connection)

<a name="NodeRelay.module_log.levels"></a>

### log.levels : <code>enum</code>
Log level definitions

**Kind**: static enum property of <code>[log](#NodeRelay.module_log)</code>  
**Read only**: true  
**Properties**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| Info | <code>number</code> | <code>1</code> | Info messages |
| Error | <code>number</code> | <code>2</code> | Error messages |
| Debug | <code>number</code> | <code>4</code> | Debug messages |
| Connection | <code>number</code> | <code>16</code> | Connection messages |
| DataEvent | <code>number</code> | <code>32</code> | DataEvent messages. |
| IncomingData | <code>number</code> | <code>64</code> | IncomingData messages |
| OutcomingData | <code>number</code> | <code>128</code> | OutcomingData messages |

<a name="NodeRelay.module_log..info"></a>

### log~info(...args)
**Kind**: inner method of <code>[log](#NodeRelay.module_log)</code>  

| Param | Type | Description |
| --- | --- | --- |
| ...args | <code>\*</code> | The arguments to log |

<a name="NodeRelay.module_log..error"></a>

### log~error(...args)
**Kind**: inner method of <code>[log](#NodeRelay.module_log)</code>  

| Param | Type | Description |
| --- | --- | --- |
| ...args | <code>\*</code> | The arguments to log |

<a name="NodeRelay.module_log..debug"></a>

### log~debug(...args)
**Kind**: inner method of <code>[log](#NodeRelay.module_log)</code>  

| Param | Type | Description |
| --- | --- | --- |
| ...args | <code>\*</code> | The arguments to log |

<a name="NodeRelay.module_log..connection"></a>

### log~connection(...args)
**Kind**: inner method of <code>[log](#NodeRelay.module_log)</code>  

| Param | Type | Description |
| --- | --- | --- |
| ...args | <code>\*</code> | The arguments to log |

<a name="NodeRelay.module_tracker"></a>

## tracker

* [tracker](#NodeRelay.module_tracker)
    * [~getDynamicServiceHost(clientAddress)](#NodeRelay.module_tracker..getDynamicServiceHost) ⇒ <code>string</code> &#124; <code>undefined</code>
    * [~getRedirections()](#NodeRelay.module_tracker..getRedirections) ⇒ <code>Object</code>
    * [~getServers()](#NodeRelay.module_tracker..getServers) ⇒ <code>Object</code>
    * [~trackClient(localPort, clientAddress)](#NodeRelay.module_tracker..trackClient)
    * [~trackRedirection(localPort, clientSocket, serviceSocket)](#NodeRelay.module_tracker..trackRedirection)
    * [~trackServer(server)](#NodeRelay.module_tracker..trackServer) ⇒ <code>LocalServer</code>
    * [~untrackRedirection(id)](#NodeRelay.module_tracker..untrackRedirection)

<a name="NodeRelay.module_tracker..getDynamicServiceHost"></a>

### tracker~getDynamicServiceHost(clientAddress) ⇒ <code>string</code> &#124; <code>undefined</code>
**Kind**: inner method of <code>[tracker](#NodeRelay.module_tracker)</code>  
**Returns**: <code>string</code> &#124; <code>undefined</code> - Service address to redirect to or undefined when it's an untracked client  

| Param | Type | Description |
| --- | --- | --- |
| clientAddress | <code>string</code> | The client IP address |

<a name="NodeRelay.module_tracker..getRedirections"></a>

### tracker~getRedirections() ⇒ <code>Object</code>
Return the redirection collection

**Kind**: inner method of <code>[tracker](#NodeRelay.module_tracker)</code>  
**Returns**: <code>Object</code> - The redirection collection  
<a name="NodeRelay.module_tracker..getServers"></a>

### tracker~getServers() ⇒ <code>Object</code>
Return the server collection

**Kind**: inner method of <code>[tracker](#NodeRelay.module_tracker)</code>  
**Returns**: <code>Object</code> - The server collection  
<a name="NodeRelay.module_tracker..trackClient"></a>

### tracker~trackClient(localPort, clientAddress)
Tracks a client when connected to a non-dynamic service

**Kind**: inner method of <code>[tracker](#NodeRelay.module_tracker)</code>  

| Param | Type | Description |
| --- | --- | --- |
| localPort | <code>number</code> | The local server port |
| clientAddress | <code>string</code> | The client IP address |

<a name="NodeRelay.module_tracker..trackRedirection"></a>

### tracker~trackRedirection(localPort, clientSocket, serviceSocket)
**Kind**: inner method of <code>[tracker](#NodeRelay.module_tracker)</code>  

| Param | Type | Description |
| --- | --- | --- |
| localPort | <code>number</code> | The local server port |
| clientSocket | <code>Socket</code> | The client socket connection |
| serviceSocket | <code>Socket</code> | The service socket connection |

<a name="NodeRelay.module_tracker..trackServer"></a>

### tracker~trackServer(server) ⇒ <code>LocalServer</code>
Keep track of a server

**Kind**: inner method of <code>[tracker](#NodeRelay.module_tracker)</code>  
**Returns**: <code>LocalServer</code> - The **server** param  

| Param | Type | Description |
| --- | --- | --- |
| server | <code>LocalServer</code> | The local server |

<a name="NodeRelay.module_tracker..untrackRedirection"></a>

### tracker~untrackRedirection(id)
**Kind**: inner method of <code>[tracker](#NodeRelay.module_tracker)</code>  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>string</code> | The redirection id to remove |


## License

(The MIT License)

Copyright (c) 2016 Ivan Garavito &lt;ivangaravito@gmail.com&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

[NodeRelay]: https://github.com/IvanGaravito/NodeRelay
