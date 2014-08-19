'use strict'

// forEach object / array iterator function
var forEach = module.exports = function (object, fn, context) {
  var keys
    , ctx, i, k, l, t

  // object type must be an object or array
  if (typeof object === 'object') {
    if(object instanceof Array) {
      keys = object
      t = 'array'
    } else if(object instanceof Object) {
      keys = Object.getOwnPropertyNames(object)
      t = 'object'
    }
  }
  if (keys === undefined) return false

  i = 0
  l = keys.length

  for (; i < l; i += 1) {
    k = t === 'object'? keys[i]: i
    ctx = context === undefined? object[k]: context
    fn.call(ctx, object[k], k)
  }
}
