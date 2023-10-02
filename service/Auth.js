const logger = require('../utils/logger');

const { firestoreRef } = require('../drivers/firestore');
const log = logger({ fileName: 'Auth.js' });

const { getToken, getTokenAdmin, logout } = require('../repository/AuthRepository');
const { errorToResponse, successResponse } = require('../utils/utils');

const login = async (req, res) => {
  const { email, password, type = 'user' } = req.body;
  log.info(`Start login process for ${email}`);
  try {
    if (!firestoreRef) {
      log.error('Couldn\'t connect to database');
      return res.status(500).send(errorToResponse('Couldn\'t connect to database'));
    }
    let userInfo;
    if (type === 'user') 
      userInfo = await getToken({ email, password });
    else if (type === 'admin') {
      userInfo = await getTokenAdmin({ email, password });
    }

    const { success, code, data, message } = userInfo;
    if (!success) return res.status(code).send(errorToResponse(message));

    log.info(`Succes login for ${email}`)

    return res.send(successResponse({ ...data }, message));
  } catch (e) {
    log.error('Unnexpected error', e);
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

module.exports = { login, logoutService };
