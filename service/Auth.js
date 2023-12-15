const logger = require('../utils/logger');

const { firestoreRef } = require('../drivers/firestore');
const log = logger({ fileName: 'Auth.js' });

const { getToken, getTokenAdmin, logout } = require('../repository/AuthRepository');
const { errorToResponse, successResponse } = require('../utils/utils');


const getUser = async (req, res) => {
  const { userId } = req.body;
  log.info(`Start login process for ${userId}`);
  try {
    if (!firestoreRef) {
      log.error('Couldn\'t connect to database');
      return res.status(500).send(errorToResponse('Couldn\'t connect to database'));
    }
    
    return firestoreRef.collection('userdb')
      .doc(userId)
      .get()
      .then((doc) => {
        if (!doc.exists) return res.status(401).send(errorToResponse('User not found'));

        log.info(`User ${userId} found`);
        return res.send(successResponse(doc.data()));
      })
      .catch((err) => {
        log.error(err);
        return res.status(500).send(errorToResponse(err, 'Error getting data from firestore'));
      });
  } catch (e) {
    log.error('Unnexpected error', e);
    return res.status(500).send(errorToResponse('Couldn\'t connect to database'));
  }
}

const logoutService = async (req, res) => {
  const { authorization  } = req.headers;
  log.info(`Start logout`);
  try {
    const response = await logout({ token: authorization })

    const { success, code, message } = response;
    if (!success) return res.status(code).send(errorToResponse(message));

    log.info(`Succes logout for`)

    return res.send(successResponse(null, message));
  } catch (e) {
    log.error('Unnexpected error', e);
  }
}

module.exports = { getUser, logoutService };
