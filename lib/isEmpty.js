'use strict'

// Empty check function
module.exports = function (value) {
  // Returns if value is undefined, null, '', 0, [] or {}
  return value === undefined || value === null || value === '' || value === 0 || (value.hasOwnProperty('length') && value.length === 0) || Object.getOwnPropertyNames(value).length === 0
}
