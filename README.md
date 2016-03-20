# NodeRelay

> A forwarder/redirector server inspired in
[WinRelay](http://ntsecurity.nu/toolbox/winrelay/).

## Introduction

This is a server that forwards/redirects data to a server's pool based
on ports. This helps you to:

* Hide your real server for security reasons
* Separate networks, tunnel the services you need

## Installation

First of all you need to install [Node.js](http://nodejs.org/). Download
[NodeRelay](https://github.com/IvanGaravito/NodeRelay).

## Quick Start

Let's say you have a fixed HTTP service at `127.0.0.1:3000`, and you want to
access using `port 80`. All you need to do is create the file `etc/config.js`
and write the following lines:

``` js
module.exports = {
      localHost: '0.0.0.0'
    , pool: {
        80: {
            rdirHost: '127.0.0.1'
          , rdirPort: 3000
        }
    }
}
```

After [NodeRelay](https://github.com/IvanGaravito/NodeRelay) configuration is
ready, simply run the app:

``` bash
  $ cd /path/to/NodeRelay
  $ node .
```

## Getting Started

For using [NodeRelay](https://github.com/IvanGaravito/NodeRelay) you don't need
JavaScript neither programming knowledge. All you need is to understand the
configuration options.

### Configuration

Well documented, the default options are stored inside `etc/config.defaults.js`
file, and the user defined configuration is inside the `etc/config.js` file,
which can be reduced to something like the following:

``` js
module.exports = {
      localHost: '127.0.0.1'
    , pool: {/*
        <listen_at_port>: {
            rdirHost: '<to_host>'
          , rdirPort: <to_port>
        }
    */}
}
```

`localHost` defines the network interface where
[NodeRelay](https://github.com/IvanGaravito/NodeRelay) need to be listening to.

`pool` is a port's list that defines for each one the destination host and port:

* `rdirHost` is the host to redirect to
* `rdirPort` is the port at the host to redirect to

### Dynamic Forwarding/Redirection

Let's say you has a *server* with a WAN network separated from a LAN
network, just like a firewall. You got
[NodeRelay](https://github.com/IvanGaravito/NodeRelay) to access two devices
inside your LAN from WAN. These devices have an *UI port* `80` that serves
a HTML file, then the HTML UI connects to a *fixed port* `3000` for polling
data. How you can make [NodeRelay](https://github.com/IvanGaravito/NodeRelay) to
that fixed port dynamicly?

Well, it's so easy as defining a port with no connection params at the pool.
Your `config.js` file should look like this:

``` js
module.exports = {
      localHost: 'mywanip'
    , pool: {
        81: {	//DEVICE 1
            rdirHost: '192.168.1.101'
          , rdirPort: 80
        }
      , 82: {	//DEVICE 2
            rdirHost: '192.168.1.102'
          , rdirPort: 80
        }
      , 3000: {	//FIXED PORT FOR DYNAMIC FORWARDING/REDIRECTION
        }
    }
}
```

## License

(The MIT License)

Copyright (c) 2012 Ivan Garavito &lt;ivangaravito@gmail.com&gt;

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
