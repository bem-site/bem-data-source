var logger = require('../logger'),
    pusher = require('../pusher'),
    server = require('../server');

module.exports = function () {
    return this
        .title('server command')
        .helpful()
        .act(function () {
            logger.info('START server', module);
            pusher.init();
            return server();
        });
};
