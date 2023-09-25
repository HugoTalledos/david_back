const log4js = require('log4js');

log4js.configure({
  appenders: { console: { type: 'console' } },
  categories: { default: { appenders: ['console'], level: 'trace' } },
});

const logger = ({ fileName }) => log4js.getLogger(fileName);

module.exports = logger;
