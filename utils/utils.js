const uuid = require('uuid-v4');
const { Storage } = require('@google-cloud/storage');
const { MESSAGES } = require('./constants');
const { BUCKET_NAME, GCP_ENV, PROJECT_ID } = require('./config');
const configuration = {
  projectId: PROJECT_ID,
  keyFilename: `./${GCP_ENV}-credentials.json`,
};

const storage = new Storage(configuration);

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


const loadTrack = (files, name, path) => {
  console.log("Load track");
  const bucket = storage.bucket(BUCKET_NAME);
  const promises = files.map((buffer, key) => {
    const fileName = `${key}_${name}_${(new Date()).toISOString()}`;
    const file = bucket.file(`${path}/${fileName}`);
    const filepath = Buffer.from(buffer);
    const metadata = {
      metadata: { firesbaseStorageDownloadTokens: uuid() },
      cacheControl: 'public, max-age=15',
    };

    file.save(filepath, {
      gzip: true,
      metadata,
    });
    return file.getSignedUrl({ action: 'read', expires: '03-09-2491' });
  });
  return promises;
};

module.exports = {
  generateId,
  loadTrack,
  successRepository,
  errorRepository,
  successResponse,
  errorToResponse,
};
