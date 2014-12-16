/*
var util = require('util'),
    zlib = require('zlib'),
    vow = require('vow'),
    storage = require('../src/cocaine/api');

storage.init()
    .then(function() {
        return storage.find(['islands-services', 'v2.3.0']);
    })
    .then(function(keys) {
        var k = 'islands-services/v2.3.0/touch-phone.examples/services-table/20-russian/_20-russian.ie8.css';
        return storage.read(k);
    })
    // .then(function() {
    //   return storage.read(util.format('%s/%s/%s', 'islands-services', 'v2.3.0', 'data.json'));
    // })
    .then(function(content) {
        return unzip(content);
    })
    .then(function(content) {
        return unzip(content);
    })
    // .then(function(content) {
    //    return unzip(content);
    // })
    .done();

function unzip(c) {
    var def = vow.defer();
    zlib.gunzip(c, function(err, res) {
        err ? def.reject : def.resolve(res);
    });
    return def.promise();
}
*/
