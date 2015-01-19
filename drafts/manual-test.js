var util = require('util'),

    _ = require('lodash'),
    vow = require('vow'),

    request = require('request'),

    configuration = {
        host: 'storage-int.mdst.yandex.net',
        namespace: 'lego-site',
        get: {
            port: 80
        },
        post: {
            port: 1111
        },
        auth: 'Basic bGVnby1zaXRlOjJkZGUyZjI0OGIxODI2NWRiZWM2ZGRiOGVhMjBkNjg0'
    },
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
            configuration.host, configuration.get.port, configuration.namespace, key),
        opts = _.extend({}, baseRequestOptions, requestOptions, { url: url });
    request(opts, function (error, response, body) {
        error ? def.reject : def.resolve(body);
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
            configuration.host, configuration.post.port, configuration.namespace, key),
        opts = _.extend({}, baseRequestOptions, requestOptions, {
            url: url,
            body: value
        });
    request(opts, function (error, response, body) {
        error ? def.reject : def.resolve(body);
    });
    return def.promise();
}

write('test-data/aaa', 'aaa')
    .then(function (body) {
        console.log('UPLOAD %s', body);
        return read('test-data/aaa');
    })
    .then(function (body) {
        console.log('READ %s', body);
    })
    .done();
