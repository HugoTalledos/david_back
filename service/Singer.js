const logger = require('../utils/logger');

const { firestoreRef } = require('../drivers/firestore');
const { generateId, successResponse, errorToResponse } = require('../utils/utils');

const log = logger({ fileName: 'Singer.js' });
const collection = 'singer';
const registerBy = 'test';

const createSingerInDb = async (req, res) => {
  const { singerName } = req.body;
  const singerId = generateId();
  log.info(`Creating Singer ${singerName}`);
  try {
    const doc = await firestoreRef.collection(collection)
      .doc(singerId);

    await doc.set({
      singerId: doc.id,
      singerName,
      status: true,
      createdAt:(new Date()).toGMTString(),
      updatedAt:(new Date()).toGMTString(),
      registerBy,
    });

    log.info(`Singer ${singerName} created succesfully`);
    return res.send(200, successResponse(`Singer ${singerName} created succesfully`));
  } catch (err) {
    log.error(err);
    return res.status(500).send(errorToResponse('Error creating singer'));
  }
};

const updateSingerInDb = async (req, res) => {
  const { singerId } = req.body;
  log.info(`Updating category ${singerId}`);
  try {
    const doc = await firestoreRef.collection(collection)
      .doc(singerId);
    const values = await doc.get();

    if (values.exists) {
      await doc.update({
        singerName,
        status: true,
        createdAt: (new Date()).toGMTString(),
        updatedAt: (new Date()).toGMTString(),
        registerBy,
        updatedBy: registerBy
      });
      log.info(`Singer ${singerId} updated succesfully`);
      return res.send(successResponse(`Singer ${singerId} updated succesfully`));
    }

    log.error(`Singer ${singerId} does not exist`);
    return res.status(500)
      .send(errorToResponse(`Singer ${singerId} doesn't exist on firestore`));
  } catch (err) {
    log.error(err);
    return res.status(500).send(errorToResponse('Error updating category'));
  }
};

const getAllSingersFromDb = async (req, res) => {
  log.info('Getting all singers');
  try {
    return firestoreRef.collection(collection)
      .get()
      .then((snapshot) => {
        const singers = [];
        snapshot.forEach((doc) => singers.push(doc.data()));
        log.info('All singers retrieved succesfully');
        return res.send(successResponse(singers));
      })
      .catch((err) => {
        log.error(err);
        return res.status(500).send(errorToResponse(err, 'Error getting data from firestore'));
      });
  } catch (error) {
    log.error(error.message);
    return res.status(500).send(errorToResponse('Couldn\'t connect to database'));
  }
};

const getSingerFromDb = async (req, res) => {
  log.info('Getting category');
  const { storeId, categoryId } = req.params;
  try {
    return firestoreRef.collection(storeId)
      .doc(STORE_INFORMATION)
      .collection(STORE_CATEGORIES)
      .doc(categoryId)
      .get()
      .then((doc) => {
        log.info(`Category ${categoryId} retrieved succesfully`);
        return res.send(successResponse(doc.data()));
      })
      .catch((err) => {
        log.error(err);
        return res.status(500).send(errorToResponse(err, 'Error getting data from firestore'));
      });
  } catch (error) {
    log.error(error.message);
    return res.status(500).send(errorToResponse('Couldn\'t connect to database'));
  }
};

const deleteSingerFromDb = async (req, res) => {
  const { singerId } = req.params;
  const { status } = req.body;
  log.info(`Deleting singer ${singerId}`);
  try {
    const doc = await firestoreRef.collection(collection)
      .doc(singerId);
    const values = await doc.get();
    if (values.exists) {
      try {
        await doc.set({ status }, { merge: true });
        log.info(`Singer ${singerId} deleted succesfully`);
        return res.send(successResponse(`Singer ${singerId} delete succesfull`));
      } catch (err) {
        log.error(err);
        return res.status(500).send(errorToResponse(err, 'Error deleting data from firestore'));
      }
    }

    return res.status(500).send(errorToResponse(`Singer ${singerId} does not exist`));
  } catch (error) {
    log.error(error.message);
    return res.status(500).send(errorToResponse('Couldn\'t connect to database'));
  }
};

module.exports = {
  createSingerInDb,
  updateSingerInDb,
  getAllSingersFromDb,
  getSingerFromDb,
  deleteSingerFromDb,
};
