var parser = require('swagger-parser')
var generateSkeleton = require('./generateSkeleton.js')
var generateProxy = require('./generateProxy.js')
var generatePolicies = require('./generatePolicies.js')
var generateProxyEndPoint = require('./generateProxyEndPoint.js')
var generateTargetEndPoint = require('./generateTargetEndPoint.js')
var async = require('async')
var path = require('path')

module.exports = {
  generateApi: generateApi
}

function generateApi (apiProxy, options, cb) {
  var destination = options.destination || path.join(__dirname, '../../../api_bundles')
  if (destination.substr(-1) === '/') {
    destination = destination.substr(0, destination.length - 1)
  }
  parser.parse(options.source, function (err, api, metadata) {
    if (!err) {
      console.log('API name: %s, Version: %s', api.info.title, api.info.version)
      generateSkeleton(apiProxy, options, function (err, reply) {
        if (err) return cb(err)
        async.parallel([
          function (callback) {
            generateProxy(apiProxy, options, api, function (err, reply) {
              if (err) return callback(err)
              callback(null, 'genProxy')
            })
          },
          function (callback) {
            generateProxyEndPoint(apiProxy, options, api, function (err, reply) {
              if (err) return callback(err)
              callback(null, 'genProxyEndPoint')
            })
          },
          function (callback) {
            generateTargetEndPoint(apiProxy, options, api, function (err, reply) {
              if (err) return callback(err)
              callback(null, 'genTargetPoint')
            })
          },
          function (callback) {
            if (api['x-a127-services']) {
              generatePolicies(apiProxy, options, api, function (err, reply) {
                if (err) return callback(err)
                callback(null, 'a127policies')
              })
            } else {
              callback(null, 'a127policies')
            }
          }
        ],
        )
      })
    } else {
      return cb(err, { error: 'openapi parsing failed..' })
    }
  })
}
