'use strict';

var util = require('util'),

    express = require('express'),
    bodyParser = require('body-parser'),
    multer = require('multer'),

    logger = require('../logger');

function startServer(port) {
    var app = express();

    app.set('port', port || 3000);
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(multer());

    app.get('/', function(req, res) {
        res.send('ok');
    });

    app.post('/publish', function(req, res) {
        res.send('ok');
    });

    app.listen(app.get('port'), function(){
        logger.info(util.format('Express server listening on port %s', app.get('port')), module);
    });
}

module.exports = function () {
    return this
        .title('server command')
        .helpful()
        .opt()
        .name('port').title('Server port')
        .short('p').long('port')
        .end()
        .act(function (opts) {
            logger.info('START server:', module);
            logger.info(util.format('port %s', opts.port), module);
            return startServer(opts.port);
        });
};
