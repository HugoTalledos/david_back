const express = require('express');
const service = require('../service/Song');
//const { validateUserToken } = require('../middlewares/validateToken');
//const { validateRequireParams } = require('../middlewares/validateParams');

const router = express.Router();

router.post('/', service.getSongByName);
router.delete('/:setId/:configId', service.deleteSetFromDb);

module.exports = router;
