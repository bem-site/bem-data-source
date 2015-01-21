var MDS = require('mds-wrapper'),
    mds;

exports.get = function (options) {
    mds = mds || new MDS(options);
    return mds;
};
