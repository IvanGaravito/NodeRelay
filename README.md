[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)
[![Build Status](https://travis-ci.org/IvanGaravito/node-usererror.svg?branch=master)](https://travis-ci.org/IvanGaravito/node-usererror)
<!-- [![devDependency Status](https://david-dm.org/IvanGaravito/node-usererror/dev-status.svg)](https://david-dm.org/IvanGaravito/node-usererror#info=devDependencies) -->
[![NPM pkg](https://img.shields.io/npm/v/noderelay.svg)](https://www.npmjs.com/package/noderelay)
[![NPM dm](https://img.shields.io/npm/dm/noderelay.svg)](https://www.npmjs.com/package/noderelay)
[![Gratipay](https://img.shields.io/gratipay/IvanGaravito.svg)](https://gratipay.com/IvanGaravito)

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
            * [._connectService(clientSocket, options)](#module_NodeRelay..LocalServer+_connectService)
            * [.getDynamicServiceHost()](#module_NodeRelay..LocalServer+getDynamicServiceHost) ⇒ <code>string</code>
            * [.init(options)](#module_NodeRelay..LocalServer+init)
            * ["event:client-close" (had_error, client)](#module_NodeRelay..LocalServer+event_client-close)
            * ["event:client-close" (had_error, client)](#module_NodeRelay..LocalServer+event_client-close)
            * ["event:service-close" (had_error, service)](#module_NodeRelay..LocalServer+event_service-close)
            * ["event:service-redirection" (client, service)](#module_NodeRelay..LocalServer+event_service-redirection)
            * ["event:service-error" (err)](#module_NodeRelay..LocalServer+event_service-error)
        * _static_
            * [.errors](#module_NodeRelay..LocalServer.errors) : <code>enum</code>
            * [.getSocketRemoteParams(socket)](#module_NodeRelay..LocalServer.getSocketRemoteParams) ⇒ <code>Object</code>

<a name="module_NodeRelay..LocalServer"></a>

### NodeRelay~LocalServer ⇐ <code>external:EventEmitter</code>
Abstracts the local server that redirect connections from a client to a service

**Kind**: inner class of <code>[NodeRelay](#module_NodeRelay)</code>  
**Extends:** <code>external:EventEmitter</code>  
**Emits**: <code>[event:client-close](#module_NodeRelay..LocalServer+event_client-close)</code>, <code>[event:service-close](#module_NodeRelay..LocalServer+event_service-close)</code>, <code>[event:service-error](#module_NodeRelay..LocalServer+event_service-error)</code>, <code>[event:service-redirection](#module_NodeRelay..LocalServer+event_service-redirection)</code>  

* [~LocalServer](#module_NodeRelay..LocalServer) ⇐ <code>external:EventEmitter</code>
    * [new LocalServer(options)](#new_module_NodeRelay..LocalServer_new)
    * _instance_
        * [._connectService(clientSocket, options)](#module_NodeRelay..LocalServer+_connectService)
        * [.getDynamicServiceHost()](#module_NodeRelay..LocalServer+getDynamicServiceHost) ⇒ <code>string</code>
        * [.init(options)](#module_NodeRelay..LocalServer+init)
        * ["event:client-close" (had_error, client)](#module_NodeRelay..LocalServer+event_client-close)
        * ["event:client-close" (had_error, client)](#module_NodeRelay..LocalServer+event_client-close)
        * ["event:service-close" (had_error, service)](#module_NodeRelay..LocalServer+event_service-close)
        * ["event:service-redirection" (client, service)](#module_NodeRelay..LocalServer+event_service-redirection)
        * ["event:service-error" (err)](#module_NodeRelay..LocalServer+event_service-error)
    * _static_
        * [.errors](#module_NodeRelay..LocalServer.errors) : <code>enum</code>
        * [.getSocketRemoteParams(socket)](#module_NodeRelay..LocalServer.getSocketRemoteParams) ⇒ <code>Object</code>

<a name="new_module_NodeRelay..LocalServer_new"></a>

#### new LocalServer(options)

| Param | Type | Description |
| --- | --- | --- |
| options | <code>Object</code> | local and service options |

<a name="module_NodeRelay..LocalServer+_connectService"></a>

#### localServer._connectService(clientSocket, options)
Connect to service and make client-service redirection

**Kind**: instance method of <code>[LocalServer](#module_NodeRelay..LocalServer)</code>  

| Param | Type | Description |
| --- | --- | --- |
| clientSocket | <code>Socket</code> | Client socket |
| options | <code>Object</code> | Connection options to service |
| options.host | <code>string</code> | Address where is the service |
| options.port | <code>string</code> | TCP port at options.host where is the service |

<a name="module_NodeRelay..LocalServer+getDynamicServiceHost"></a>

#### localServer.getDynamicServiceHost() ⇒ <code>string</code>
Initializes the LocalServer instance

**Kind**: instance method of <code>[LocalServer](#module_NodeRelay..LocalServer)</code>  
**Returns**: <code>string</code> - Service address when this is a local server for a dynamic redirection  
**Throws**:

- <code>UserError</code> The app instancing this class must override this method

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

<a name="module_NodeRelay..LocalServer+event_client-close"></a>

#### "event:client-close" (had_error, client)
Client connection closed

**Kind**: event emitted by <code>[LocalServer](#module_NodeRelay..LocalServer)</code>  

| Param | Type | Description |
| --- | --- | --- |
| had_error | <code>boolean</code> |  |
| client | <code>Object</code> | Details of client connection |
| client.port | <code>number</code> | Client port |
| client.family | <code>string</code> | Client socket family |
| client.address | <code>string</code> | Client address |

<a name="module_NodeRelay..LocalServer+event_client-close"></a>

#### "event:client-close" (had_error, client)
Client connection closed event

**Kind**: event emitted by <code>[LocalServer](#module_NodeRelay..LocalServer)</code>  

| Param | Type | Description |
| --- | --- | --- |
| had_error | <code>boolean</code> |  |
| client | <code>Object</code> | Details of client connection |
| client.port | <code>number</code> | Client port |
| client.family | <code>string</code> | Client socket family |
| client.address | <code>string</code> | Client address |

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

<a name="module_NodeRelay..LocalServer+event_service-redirection"></a>

#### "event:service-redirection" (client, service)
Client redirected to service event

**Kind**: event emitted by <code>[LocalServer](#module_NodeRelay..LocalServer)</code>  

| Param | Type | Description |
| --- | --- | --- |
| client | <code>Object</code> | Details of client connection |
| client.port | <code>number</code> | Client port |
| client.family | <code>string</code> | Client socket family |
| client.address | <code>string</code> | Client address |
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
| socket | <code>Socket</code> | 


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
