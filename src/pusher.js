'use strict';

var util = require('util'),

    request = require('request'),
    CronJob = require('cron').CronJob,

    config = require('./config'),
    logger = require('./logger'),
    commander = require('./commander'),

    STATE = {
      IDLE: 0,
      ACTIVE: 1
    },

    job,
    state = STATE.IDLE,
    charge = false;

/**
 * Check if pusher is in active state
 * @return {Boolean}
 */
function isActive () {
    return STATE.ACTIVE === state;
}

/**
 * Set pusher state to active
 */
function setActive () {
    state = STATE.ACTIVE;
}

/**
 * Set pusher state to idle
 */
function setIdle () {
    state = STATE.IDLE;
}

/**
 * Check if pusher is charged to commit and push files
 * @return {Boolean}
 */
function isCharged () {
    return charge;
}

/**
 * Reset pusher charge
 */
function dischargeAfterPush () {
    charge = false;
}

/**
 * Send notification request to site to initialize model rebuild
 */
function sendRequest () {
    var url = config.get('notification_url');
    if (!url || !url.length) {
        return;
    }

    request(url, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            logger.info('server received data update notification', module);
            logger.info(body, module);
        }
    });
}

function execute () {
    logger.info('execute commit and push data', module);

    // we should perform commit and push only
    // if another commit and push is not executing at this moment
    // and we have new added or modified files for commit
    if (!isCharged() || isActive()) {
        if (!isCharged()) {
            logger.warn('There any added or modified files in git folder', module);
        }
        if (isActive()) {
            logger.warn('Another commit and push is executing now', module);
        }
        return;
    }

    setActive();
    return (module.exports.commitAndPush({
            commitMessage: util.format('Update data: %s', (new Date()).toString()),
            successMessage: 'PUSH DATA HAS BEEN FINISHED SUCCESSFULLY',
            errorMessage: 'PUSH FAILED WITH ERROR %s'
        }))()
        .then(function () {
            dischargeAfterPush();
            setIdle();
            sendRequest();
        });
}

module.exports = {
    /**
     * Initialize cron job for commit and push tasks perform
     */
    init: function () {
        job = new CronJob({
            cronTime: '0 */1 * * * *',
            onTick: execute,
            start: true
        });
    },

    /**
     * Set charge flag to true
     * It will indicate that commit and push will be performed at next cron launch
     */
    chargeForPush: function () {
        charge = true;
    },

    /**
     * Perform git files add, commit and push operations
     * @param {Object} conf - configuration option with messages
     * @returns {Function}
     */
    commitAndPush: function (conf) {
        return function () {
            return commander.gitAdd()
                .then(function () {
                    return commander.gitCommit(conf.commitMessage);
                })
                .then(function () {
                    return commander.gitPush(config.get('dataConfig:ref'));
                })
                .then(function () {
                    logger.info(conf.successMessage, module);
                })
                .fail(function (err) {
                    logger.error(util.format(conf.errorMessage, err), module);
                });
        };
    }
};
