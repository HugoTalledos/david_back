const axios = require('axios');
const logger = require('../utils/logger');
const { API_STRAPI, API } = require('../utils/config');
const { successRepository, errorRepository } = require('../utils/utils');
const log = logger({ fileName: 'AuthRepository.js' });
const url = `${API_STRAPI}/auth`;

const getToken = ({ email, password }) => {
  return axios.post(`${url}/local`, { identifier: email, password })
  .then(({ data }) => successRepository({ token: data.jwt, user: data.user }))
  .catch((error) => {
    log.error(error.message);
    return errorRepository(error);
  });
};

const getTokenAdmin = ({ email, password }) => {
  return axios.post(`${API}/admin/login`, { email, password })
  .then(({ data: info }) => successRepository({ ...info.data }))
  .catch((error) => {
    log.error(error.message);
    return errorRepository(error);
  });
};

const logout = ({ token }) => {

  return axios.post(`${API}/admin/logout`, {}, { headers: { Authorization: token }})
  .then(() => successRepository('success'))
  .catch((error) => {
    log.error(error.message);
    return errorRepository(error);
  })
}


module.exports = { getToken, getTokenAdmin, logout };