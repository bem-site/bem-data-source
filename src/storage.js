var sha = require('sha1'),
    MDS = require('mds-wrapper'),
    mds = {};

exports.get = function (options) {
    var key = sha(JSON.stringify(options));
    mds[key] = mds[key] || new MDS(options);
    return mds[key];
};
