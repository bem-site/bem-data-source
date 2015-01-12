var util = require('util'),
    path = require('path'),

    vow = require('vow'),
    vowFs = require('vow-fs'),

    utility = require('./src/util'),
    config = require('./src/config'),
    logger = require('./src/logger'),
    constants = require('./src/constants'),
    storage = require('./src/cocaine/api'),

    FREEZE = 'freeze',
    basePath  = path.join(process.cwd(), FREEZE);

storage.init(config.get('storage:cocaine'))
    .then(function () {
        return vowFs.listDir(basePath);
    })
    .then(function (files) {
        var openFilesLimit = config.get('maxOpenFiles') || constants.MAXIMUM_OPEN_FILES,
            portions = utility.separateArrayOnChunks(files, openFilesLimit);

        return portions.reduce(function (prev, item, index) {
            prev = prev.then(function () {
                logger.info(util.format('send files in range %s - %s',
                    index * openFilesLimit, (index + 1) * openFilesLimit), module);

                return vow.all(item.map(function (_item) {
                    var fPath = path.join(basePath, _item),
                        key = util.format('%s/%s', FREEZE, _item);

                    logger.debug(util.format('send file %s', _item), module);
                    return vowFs.read(fPath).then(function (content) {
                        return storage.write(key, content, [FREEZE]);
                    });
                }));
            });
            return prev;
        }, vow.resolve());
    })
    .done();
