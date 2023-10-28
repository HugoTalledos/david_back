const express = require('express');
const controller = require('../service/Singer');


const router = express.Router();

router.post('/', controller.createSingerInDb);
router.put('/', controller.updateSingerInDb);
router.get('/', controller.getAllSingersFromDb);
router.get('/:singerId', controller.getSingerFromDb);
router.post('/:singerId', controller.deleteSingerFromDb);

module.exports = router;
