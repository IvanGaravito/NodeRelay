'use strict'

// Merge object function
module.exports = function (newest/* current values */, oldest/* values to be replaced */) {
  var newKeys, oldKeys
  var newObj
  var i, k, l

  // Get object keys
  newKeys = Object.getOwnPropertyNames(newest)
  oldKeys = Object.getOwnPropertyNames(oldest)
  newObj = {}

  for (i = 0, l = oldKeys.length; i < l; i += 1) {
    k = oldKeys[i]
    if (!newest.hasOwnProperty(k)) {
      newObj[k] = oldest[k]
    } else {
      newObj[k] = newest[k]
    }
  }

  for (i = 0, l = newKeys.length; i < l; i += 1) {
    k = newKeys[i]
    if (!newObj.hasOwnProperty(k)) {
      newObj[k] = newest[k]
    }
  }

  return newObj
}
