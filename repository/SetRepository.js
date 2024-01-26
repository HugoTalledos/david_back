const { firestoreRef } = require('../drivers/firestore');
const songRepository = require('./SongRepository');
const logger = require('../utils/logger');
const log = logger({ fileName: 'SetRepository.js' });

const collection = 'public';

const createSet = async (setId, body) => {
  try {
    const setDoc = await firestoreRef.collection(collection)
      .doc(setId);

    await setDoc.set({
      setId,
      status: true,
      ...body,
      createdAt:(new Date()).toGMTString(),
      updatedAt:(new Date()).toGMTString(),
    });

    log.info(`Set created successfully`);
    return setId;
  } catch (e) {
    log.error(e);
    return null;
  }
};

const updateSet = async (setId, data) => {
  try {
    const route = await firestoreRef.collection(collection)
      .doc(setId);

    const doc = await route.get();
    if (!doc.exists) {
      log.warn(`${setId} no existe o eliminado`);
      return null;
    }

    const body = {
      setId,
      ...data,
      updatedAt:( new Date()).toGMTString(),
    }; 
    await route.set(body, { merge: true });

    log.info(`Set updated successfully`);
    return body;
  } catch (e) {
    log.error(e);
    return null;
  }
};


const getSetById = async (setId) => {
  try {
    const route = await firestoreRef.collection(collection)
      .doc(setId);
    const doc = await route.get();
    const set = doc.data();
    const { status: setStatus, songList } = set;

    if (!doc.exists || !setStatus) {
      log.warn('Set not found or deleted');
      return null;
    }
    
    log.info(`Canciones encontradas dentro del set: ${songList.length}`);
    let songs = [];

    for (let i = 0; i < songList.length; i++) {
      const id = songList[i];
      const song = await songRepository.getSongById(id);
      if (song) songs.push(song);
    }

    return { ...set, songConfig: songs };
  } catch (e) {
    log.error(e);
    return null;
  }
};

const getAllSets = async () => {
  try {
    const route = await firestoreRef.collection(collection).where("status", "==", true).get();

    if (route.size <= 0) return [];

    log.info(`Sets found: ${route.size}`);
    const setList = [];
    for(let i = 0; i < route.size; i++) {
      const setId = route.docs[i].id;
      const set = await getSetById(setId);
      setList.push(set);
    }

    if (setList.length <= 0) return [];

    return setList;
  } catch(e) {
    log.error(e);
    return null;
  }
};

const deleteSetFromDb = async (setId) => {
  try {
    const doc = await firestoreRef.collection(collection)
      .doc(setId);
    
    const values = await doc.get();
    if (!values.exists) {
      log.error(`Set ${setId} doesn't exist`);
      return null;
    }

    await doc.set({
      status: false,
      updatedAt:  (new Date()).toGMTString(),
    }, { merge: true });
    log.info(`Set ${setId} deleted`);
    return true;
  } catch (e) {
    log.error(e);
    return null;
  }
};

module.exports = {
  createSet,
  updateSet,
  getSetById,
  getAllSets,
  deleteSetFromDb,
};
