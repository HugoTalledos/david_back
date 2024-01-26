const logger = require('../utils/logger');
const { generateId, successResponse, errorToResponse } = require('../utils/utils');
const setRepository = require('../repository/SetRepository');

const log = logger({ fileName: 'Set.js' });

const createSetInDb = async (req, res) => {
  const { setName, ...all } = req.body;
  const setId = generateId();
  log.info(`Creating Set ${setName}`);
    
  try {
    const createdSet = await setRepository.createSet(setId, { setName, ...all });
    if (!createdSet) return res.status(500).send(errorToResponse(err, 'Error creating data in firestore'));
    return res.send(successResponse({ setId }))
  } catch (err) {
    log.error(err);
    return res.status(500).send(errorToResponse(err, 'Error creating data in firestore'));
  }
};

const updateSetInDb = async (req, res) => {
  const { setId, ...all } = req.body;
  log.info(`Updating set ${setId}`);

  try {
    const updatedSet = await setRepository.updateSet(setId, all);

    if (!updatedSet)  return res.status(500).send(errorToResponse(`Set ${setId} does not exist or deleted`));
    return res.send(successResponse(updatedSet, 'Success updated'));
  } catch (error) {
    log.error(error);
    return res.status(500).send(errorToResponse(`Unnexpected error`));
  }
};

const getSetFromDb = async (req, res) => {
  const { setId } = req.params;
  log.info(`Getting set ${ setId }`);
  try {
    const setInfo = await setRepository.getSetById(setId);

    if (!setInfo) return res.status(409).send(errorToResponse('Set information not found or deleted'));

    return res.send(successResponse(setInfo));
  } catch (error) {
    log.error(error);
    return res.status(500).send(errorToResponse('Unnexpected error'));
  }
};

const getAllSetsFromDb = async (req, res) => {
  log.info('Getting all sets');

  try {
    const setConfigList = await setRepository.getAllSets();

    if (!setConfigList) return res.send(successResponse([], 'Sets not found'));
    return res.send(successResponse(setConfigList, 'Success query'));
  } catch (error) {
    log.error(error.message);
    return res.status(500).send(errorToResponse('Unnexpected error'));
  }
};

const deleteSetFromDb = async (req, res) => {
  const { setId } = req.params;
  log.info(`Deleting set ${setId}`);
  try {
    const deletedSet = await setRepository.deleteSetFromDb(setId);

    if (!deletedSet) return res.status(500).send(errorToResponse(`Product ${setId} does not exist`));
    return res.send(successResponse(`Set ${setId} delete succesfull`));
  } catch (error) {
    log.error(error.message);
    return res.status(500).send(errorToResponse('Unnexpected error'));
  }
};

module.exports = {
  createSetInDb,
  updateSetInDb,
  getSetFromDb,
  getAllSetsFromDb,
  deleteSetFromDb,
};
