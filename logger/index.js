const log4js = require('log4js');
const config = require('config');
const path = require('path');

const logfilePath = path.resolve(config.logfile);

log4js.configure({
    appenders: { default: { type: 'file', filename: logfilePath } },
    categories: { default: { appenders: ['default'], level: 'debug' } },
});
const logger = log4js.getLogger();

process
    .on('unhandledRejection', (reason, p) => {
        logger.error(reason, 'Unhandled Rejection at Promise', p);
    })
    .on('uncaughtException', (err) => {
        console.log(err);
        logger.error(err, 'Uncaught Exception thrown');
        log4js.shutdown(() => process.exit(1));
    });


module.exports = logger;
