var util = require('util'),
    path = require('path'),
    vm = require('vm'),

    vow = require('vow'),
    vowFs = require('vow-fs'),
    _ = require('lodash'),
    enbBuilder = require('enb/lib/server/server-middleware').createBuilder({
        cdir: process.cwd(),
        noLog: false
    }),
    dropRequireCache = require('enb/lib/fs/drop-require-cache'),

    targets;

function rebuild(targets) {
    return vow.all(
        targets.map(function (target) {
            return enbBuilder(target).then(function () {
                dropRequireCache(require, target);
                return target;
            });
        })
    );
}

exports.init = function (o) {
    targets = {
        bemtree: util.format('src/%s.bundles/%s/%s.bemtree.js', o.level, o.bundle, o.bundle),
        bemhtml: util.format('src/%s.bundles/%s/%s.bemhtml.js', o.level, o.bundle, o.bundle)
    };
};

/**
 * Recompile bemtree and bemhtml templates (only for development environment)
 * throw context and applies bemtree and bemhtml templates
 * @param {Object} ctx  -  context for templates
 * @param {Object} req - request object
 * @returns {*}
 */
exports.run = function (ctx, req) {
    var build = rebuild;
    // var build = vow.resolve();

    return build(_.values(targets))
        .then(function () {
            var p = path.join(process.cwd(), targets.bemtree),
                context = vm.createContext({
                    console: console,
                    Vow: vow,
                    req: req
                });

            return vowFs.read(p).then(function (content) {
                vm.runInNewContext(content, context);
                return context;
            });
        })
        .then(function (template) {
            return template.BEMTREE.apply(ctx)
                .then(function (bemjson) {
                    // if (req.query.__mode === 'bemjson') {
                    //    return stringify(bemjson, null, 2);
                    // }
                    return require(path.join(process.cwd(), targets.bemhtml)).BEMHTML.apply(bemjson);
                });
        });
};
