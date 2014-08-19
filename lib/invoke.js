'use strict'

// Invoke each method for each item function
var invoke = module.exports = function (collection, fn, context) {
  var keys
    , ctx, obj
    , i, k, l, t

  // object type must be an object or array
  if (typeof collection === 'object') {
    if(collection instanceof Array) {
      keys = collection
      t = 'array'
    } else if(collection instanceof Object) {
      keys = Object.getOwnPropertyNames(collection)
      t = 'object'
    }
  }
  if (keys === undefined) return false

  i = 0
  l = keys.length

  for (; i < l; i += 1) {
    k = t === 'object'? keys[i]: i
    obj = collection[k]
    ctx = context === undefined? obj: context
    if (fnCheck(obj, fn)) obj[fn].call(ctx, obj, k)
  }
}

function fnCheck(object, fn) {
  // fn must be a string
  if (typeof fn !== 'string' && !(fn instanceof String)) return false
  // fn is a property of object
  if (!object.hasOwnProperty(fn)) return false
  // object.fn must be a function
  if (typeof object[fn] !== 'function') return false
  return true
}
