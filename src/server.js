'use strict';

var util = require('util'),

    express = require('express'),
    st = require('serve-static'),

    util = require('./util'),
    config = require('./config'),
    logger = require('./logger'),
    template = require('./template'),
    controllers = require('./controllers');

/**
 * Starts express server
 */
module.exports = function () {
    var app = express();
    app.set('port', config.get('server:port') || 3000);
    app.use(require('enb/lib/server/server-middleware').createMiddleware({
        cdir: process.cwd(),
        noLog: false
    }));

    util.unlinkSocket(app.get('port'));

    app
        .use(st(process.cwd()))
        .use(function (req, res, next) {
            logger.debug(util.format('retrieve request %s', req.path), module);
            next();
        })
        .get('/', controllers.index)
        .get('/build', controllers.build.index)
        .get('/build/tags', controllers.build.getTagsViaAPIByLib)
        .get('/build/branches', controllers.build.getBranchesViaAPIByLib)
        .get('/libs/:lib', controllers.lib)
        .post('/build', controllers.build.build)
        .post('/publish/:lib/:version', controllers.publish)
        .post('/replace', controllers.replaceDoc)
        .post('/remove', controllers.remove)
        .listen(app.get('port'), function () {
            util.chmodSocket(app.get('port'));
            logger.info(util.format('Express server listening on port %s', app.get('port')), module);
            template.init({ level: 'common', bundle: 'index' });
        });
    return app;
};
