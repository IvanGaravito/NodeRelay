# NodeRelay

> A forwarder/redirector server inspired in [WinRelay](http://ntsecurity.nu/toolbox/winrelay/).

[![NPM pkg](https://img.shields.io/npm/v/noderelay.svg)](https://www.npmjs.com/package/noderelay)
[![NPM dm](https://img.shields.io/npm/dm/noderelay.svg)](https://www.npmjs.com/package/noderelay)
[![Gratipay](https://img.shields.io/gratipay/IvanGaravito.svg)](https://gratipay.com/IvanGaravito)

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
