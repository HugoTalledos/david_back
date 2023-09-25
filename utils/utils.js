const uuid = require('uuid-v4');
const { MESSAGES } = require('./constants');

const generateId = () => uuid();

const successResponse = (data, message) => ({ status: true, message, data });

const errorToText = (err, defaultErrorMessage) => {
  if (err) {
    try {
      return err instanceof Error
        ? err.message || err.toString()
        : typeof err === 'string'
          ? err
          : err.toString()
          || defaultErrorMessage || 'Unnexpected error';
    } catch (_) {
      // do nothing
    }
  }
  return defaultErrorMessage || 'Unnexpected error';
};

const errorToResponse = (err, defaultErrorMessage, data) => {
  const errorText = errorToText(err, defaultErrorMessage);
  return {
    success: false,
    message: errorText,
    data
  };
};

const getMessageFromStatusCode = (statusCode) => MESSAGES[statusCode];

const successRepository = (data) => ({ success: true, code: 200, data, message: getMessageFromStatusCode(200) });
const errorRepository = ({ response }) => ({ success: false, code: response.status, data: null, message: getMessageFromStatusCode(response.status) });

module.exports = {
  generateId,
  successRepository,
  errorRepository,
  successResponse,
  errorToResponse,
};
