var config = require('config')
var pad = require('lodash/padStart')

var levels = module.exports.levels = {
  Info: 0x01,
  Error: 0x02,
  Debug: 0x04,
  Connection: 0x10,
  DataEvent: 0x20,
  IncomingData: 0x40,
  OutcomingData: 0x80
}

function empty () {}
function log () {
  var args = [].slice.call(arguments)
  var date = new Date()
  args.unshift(date.toLocaleString() + '.' + pad(date.getMilliseconds(), 3, '0'))
  console.log.apply(console, args)
}

function defineLogFn (logLevel) {
  var fn, level, name
  level = levels[logLevel]

  // If logLevel not defined, return empty function
  if (!level) return empty

  name = logLevel.toLowerCase()
  if ((config.logLevel & level) === level) {
    fn = log.bind(null, '[' + name + ']')
  } else {
    fn = empty
  }
  module.exports[name] = fn
  console['log' + logLevel] = fn
}

defineLogFn('Info')
defineLogFn('Error')
defineLogFn('Debug')
defineLogFn('Connection')
