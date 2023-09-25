const admin = require('firebase-admin');
const logger = require('../utils/logger');
const log = logger({ fileName: 'firestore.js' });

let serviceAccount;

try {
  // eslint-disable-next-line
  serviceAccount = require('../leita-credentials.json');
} catch (e) {
  log.error(e);
}

let app;
let firestoreRef;
let auth;

try {
  app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  firestoreRef = admin.firestore();
  auth = admin.auth();
} catch (e) {
  log.error(e);
}

module.exports = {
  app,
  firestoreRef,
  auth,
  admin,
};
