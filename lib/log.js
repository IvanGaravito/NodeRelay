'use strict'
var config = require('config')
var pad = require('lodash/padStart')

/**
 * @module log
 * @memberof NodeRelay
 */

/**
 * Dummy function
 * @private
 */
function empty () {}

/**
 * Log function
 * @param {...*} args - The arguments to log
 * @private
 */
function log () {
  var args = [].slice.call(arguments)
  var date = new Date()
  args.unshift(date.toLocaleString() + '.' + pad(date.getMilliseconds(), 3, '0'))
  console.log.apply(console, args)
}

/**
 * Defines a log function
 * @param {string} logLevel - The log level name defined by {@link log.levels}
 * @private
 */
function defineLogFn (logLevel) {
  var fn, level, name
  level = module.exports.levels[logLevel]

  // If logLevel not defined, return empty function
  if (!level) return empty

  name = logLevel.toLowerCase()
  if ((config.logLevel & level) === level) {
    fn = log.bind(null, '[' + name + ']')
  } else {
    fn = empty
  }
  console['log' + logLevel] = fn
  return fn
}

/**
 * Log level definitions
 * @enum {number}
 * @readonly
 */
module.exports.levels = {
  /** Info messages */
  Info: 0x01,
  /** Error messages */
  Error: 0x02,
  /** Debug messages */
  Debug: 0x04,
  /** Connection messages */
  Connection: 0x10,
  /** DataEvent messages.
   * @ignore
   */
  DataEvent: 0x20,
  /** IncomingData messages
   * @ignore
   */
  IncomingData: 0x40,
  /** OutcomingData messages
   * @ignore
   */
  OutcomingData: 0x80
}

/**
  * @function info
  * @param {...*} args - The arguments to log
  * @inner
  */
module.exports.info = defineLogFn('Info')

/**
  * @function error
  * @param {...*} args - The arguments to log
  * @inner
  */
module.exports.error = defineLogFn('Error')

/**
  * @function debug
  * @param {...*} args - The arguments to log
  * @inner
  */
module.exports.debug = defineLogFn('Debug')

/**
  * @function connection
  * @param {...*} args - The arguments to log
  * @inner
  */
module.exports.connection = defineLogFn('Connection')
