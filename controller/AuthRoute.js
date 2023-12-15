const express = require('express');
const service = require('../service/Auth');
//const { validateUserToken } = require('../middlewares/validateToken');
//const { validateRequireParams } = require('../middlewares/validateParams');

const router = express.Router();

router.post('/', service.getUser);
router.post('/logout', service.logoutService);

module.exports = router;
