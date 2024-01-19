const express = require('express');
const service = require('../service/Song');
//const { validateUserToken } = require('../middlewares/validateToken');
//const { validateRequireParams } = require('../middlewares/validateParams');

const router = express.Router();

router.post('/a', service.getSongByName);
router.delete('/:setId/:configId', service.deleteSetFromDb);


router.post('/', service.createSongInDb);
router.put('/', service.updateSongInDb);
router.post('/all', service.getAllSongsFromDb);
router.get('/:songId', service.getSongById);
router.post('/change-status', service.deleteSongFromDb);

module.exports = router;
