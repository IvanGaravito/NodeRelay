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
