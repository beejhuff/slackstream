'use strict';

var URL = require('url');
var http = require('http');
var stream = require('stream');
var querystring = require('querystring');

var DEFAULT_OPTIONS = {
  defaults: {},
}

function merge() {
  var target, argument;
  for (var i = 0, argument; argument = arguments[i]; i++) {
    if (i === 0) {
      target = argument;
      continue;
    }
    Object.keys(argument).forEach(function (key) {
      if (!argument.hasOwnProperty(key)) { return; }
      target[key] = argument[key];
    });
  }
  return target;
}
function clone(object) {
  return merge({}, object);
}

function MattermostStream(webhookURL, options) {
  if (!webhookURL) throw new Error('webhookURL argument required but not supplied');
  var url = URL.parse(webhookURL);
  options = merge({}, DEFAULT_OPTIONS, options);

  var writeStream = new stream.Writable({
    objectMode: true,
    write: function (object, encoding, next) {
      var payload;
      if (typeof object === 'string') {
        payload = clone(options.defaults);
        payload.text = object;
      } else {
        payload = merge({}, options.defaults, object);
      }

      var postData = querystring.stringify({
        payload: JSON.stringify(payload),
      });
      var requestOptions = clone(url);
      requestOptions.method = 'POST';
      requestOptions.headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': postData.length
      };

      var req = http.request(requestOptions, function (res) {
        if (res.statusCode !== 200) {
          next(new Error('Unexpected status code: ' + res.statusCode));
          return;
        }
        res.on('end', next);
      });
      req.on('error', next);
      req.write(postData);
      req.end();
    },
  });

  return writeStream;
}

module.exports = MattermostStream;