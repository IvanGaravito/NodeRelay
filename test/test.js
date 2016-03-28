/* global after, before, beforeEach, describe, it */
var assert = require('assert')
var freshy = require('freshy')
var rewire = require('rewire')

describe('log module', function () {
  describe('log functions defined', function () {
    var fns, log

    fns = ['info', 'error', 'debug', 'connection']
    log = require('../lib/log')

    fns.forEach(function (fn) {
      it('should have ' + fn + ' log function', function () {
        assert(typeof log[fn] === 'function')
      })
    })
  })

  describe('logging output disabled', function () {
    var config, consoleLog, enableOutput, fns, output, mockRequire

    config = {}
    consoleLog = function () {
      var args = [].slice.call(arguments)
      if (enableOutput) console.__log.apply(console, args)
      output = args.join('')
    }
    enableOutput = true
    fns = ['info', 'error', 'debug', 'connection']

    mockRequire = require('mock-require')
    mockRequire('config', config)

    before(function () {
      console.__log = console.log
      console.log = consoleLog
    })

    beforeEach(function () {
      freshy.unload('../lib/log')
      output = ''
    })

    fns.forEach(function (fn) {
      it('should not output ' + fn, function () {
        var log = require('../lib/log')

        enableOutput = false
        log[fn]('test')
        enableOutput = true

        assert(output === '')
      })
    })

    after(function () {
      freshy.unload('../lib/log')
      console.log = console.__log
    })
  })

  describe('logging output enabled', function () {
    var config, consoleLog, enableOutput, fns, levels, output, mockRequire

    config = {}
    consoleLog = function () {
      var args = [].slice.call(arguments)
      if (enableOutput) console.__log.apply(console, args)
      output = args.join('')
    }
    enableOutput = true
    fns = ['info', 'error', 'debug', 'connection']
    levels = {
      info: 0x01,
      error: 0x02,
      debug: 0x04,
      connection: 0x10
    }

    mockRequire = require('mock-require')
    mockRequire('config', config)

    before(function () {
      console.__log = console.log
      console.log = consoleLog
    })

    beforeEach(function () {
      freshy.unload('../lib/log')
      output = ''
    })

    fns.forEach(function (fn) {
      it('should output ' + fn, function () {
        config.logLevel = levels[fn]
        var log = require('../lib/log')

        enableOutput = false
        log[fn]('test')
        enableOutput = true

        assert(/test/.test(output))
      })
    })

    after(function () {
      freshy.unload('../lib/log')
      console.log = console.__log
    })
  })

  describe('define log function for unknown log level', function () {
    it('should define empty log function', function () {
      var fn, log
      log = rewire('../lib/log')
      fn = log.__get__('defineLogFn')('TestingEnv')
      assert(fn === log.__get__('empty'))
    })
  })
})

describe('tracker module', function () {
  var tracker = rewire('../lib/tracker')

  describe('internal collections', function () {
    it('should return redirections object', function () {
      var collection = tracker.getRedirections()
      assert(collection === tracker.__get__('redirections'))
    })

    it('should return servers object', function () {
      var collection = tracker.getServers()
      assert(collection === tracker.__get__('servers'))
    })
  })

  describe('id generation', function () {
    it('should have format nnnnn-mmm', function () {
      var id = tracker.__get__('getId')(12345)
      assert(/^12345[-]\d{3}$/.test(id))
    })

    it('should have been padded', function () {
      var id = tracker.__get__('getId')(80)
      assert(/^00080[-]\d{3}$/.test(id))
    })
  })

  describe('server tracking', function () {
    var servers = [
      {
        localPort: 8080,
        isDynamicServer: false
      },
      {
        localPort: 8081,
        isDynamicServer: false
      },
      {
        localPort: 80,
        isDynamicServer: true
      }
    ]
    it('should track server', function () {
      var localPort = servers[0].localPort
      tracker.trackServer(servers[0])
      assert(tracker.getServers()[localPort].localPort === localPort)
    })

    it('should keep all tracked servers', function () {
      tracker.trackServer(servers[1])
      tracker.trackServer(servers[2])
      assert(Object.keys(tracker.getServers()).length === 3)
    })
  })

  describe('client tracking', function () {
    it('should track client', function () {
      tracker.trackClient(8080, '127.0.0.1')
      var clients = tracker.__get__('clients')
      assert(clients['127.0.0.1'] === 8080)
    })

    it('should update tracked client', function () {
      tracker.trackClient(8081, '127.0.0.1')
      var clients = tracker.__get__('clients')
      assert(clients['127.0.0.1'] === 8081)
    })

    it('should not track client when connencted to non-dynamic service', function () {
      tracker.trackClient(80, '127.0.0.1')
      var clients = tracker.__get__('clients')
      assert(clients['127.0.0.1'] === 8081)
    })
  })

  describe.skip('service redirections', function () {
    // TODO: it's required mock-net module for testing
  })
})

describe.skip('LocalServer class', function () {
  // TODO: it's required mock-net module for testing
})
