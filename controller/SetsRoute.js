const express = require('express');
const service = require('../service/Set');
//const { validateUserToken } = require('../middlewares/validateToken');
//const { validateRequireParams } = require('../middlewares/validateParams');

const router = express.Router();

router.get('/', service.getAllSetsFromDb);
router.get('/:setId', service.getSetFromDb);
router.delete('/:setId', service.deleteSetFromDb);
router.post('/', service.createSetInDb);
router.put('/', service.updateSetInDb);

module.exports = router;
