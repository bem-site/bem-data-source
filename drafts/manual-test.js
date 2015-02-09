var util = require('util'),

    _ = require('lodash'),
    vow = require('vow'),

    request = require('request'),
    config = require('../src/config'),

    configuration = config.get('storage'),
    baseRequestOptions = {
        encoding: 'utf-8',
        timeout: 5000
    };

function read(key) {
    var def = vow.defer(),
        requestOptions = {
            method: 'GET'
        },
        url = util.format('http://%s:%s/get-%s/%s',
            configuration.get.host, configuration.get.port, configuration.namespace, key),
        opts = _.extend({}, baseRequestOptions, requestOptions, { url: url });

    console.log(url);

    request(opts, function (error, response, body) {
        error ? def.reject(error) : def.resolve(body);
    });
    return def.promise();
}

function write(key, value) {
    var def = vow.defer(),
    requestOptions = {
        method: 'POST',
        headers: {
            Authorization: configuration.auth
        }
    },
    url = util.format('http://%s:%s/upload-%s/%s',
    configuration.post.host, configuration.post.port, configuration.namespace, key),
    opts = _.extend({}, baseRequestOptions, requestOptions, {
        url: url,
        body: value
    });
    request(opts, function (error, response, body) {
        error ? def.reject : def.resolve(body);
    });
    return def.promise();
}

read('db/5:2:2015-15:2:23/leveldb').then(function (result) {
    console.log('READ %s', result);
}).done();

//write('test-data/aaa', 'aaa')
//    .then(function (body) {
//        console.log('UPLOAD %s', body || 'NULL');
//        return read('test-data/aaa');
//    })
//    .then(function (body) {
//        console.log('READ %s', body);
//    })
//    .done();
