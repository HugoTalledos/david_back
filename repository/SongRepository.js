const logger = require('../utils/logger');
const { firestoreRef } = require('../drivers/firestore');
const log = logger({ fileName: 'SongRepository.js' });

const collectionSong = 'song';

const createSongInDb = async (songId, song) => {
  if (!firestoreRef) { 
    log.error('Couldn\'t connect to database');
    return null;
  }

  try {
    const doc = await firestoreRef.collection(collectionSong)
      .doc(songId);
    let body = {
      songId: doc.id,
      ...song,
      status: true,
      createdAt:(new Date()).toGMTString(),
      updatedAt:(new Date()).toGMTString()
    }
    await doc.set(body);
    log.info(`Song ${song.songName} created`);
    return body;
  } catch (err) {
    log.error(err);
    return null;
  }
};

const updateSongInDb = async (songId, data) => {
  try {
    const doc = await firestoreRef.collection(collectionSong)
      .doc(songId);
  
    const values = await doc.get();
    if (!values.exists) return null;
  
      let body = {
        ...data,
        status: true,
        updatedAt: (new Date()).toGMTString(),
      }
  
      await doc.set(body, { merge: true });
      log.info(`Song ${songId} updated`);
      return body;
  } catch (e) {
    log.error(e);
    return null;
  }
};

const deleteSong = async (songId, status) => {

  try {
    const doc = await firestoreRef.collection(collectionSong)
    .doc(songId);
  
    const values = await doc.get();
    if (!values.exists) {
      log.error(`Song ${songId} doesn't exist`);
      return null;
    }

    await doc.set({ status }, { merge: true });
    
    log.info(`Song ${songId} deleted`);
    return values.data();
  } catch (err) {
    log.error(err.message);
    return null;
  }
};

const getSongById = async (songId) => {
  try {
    const doc = await firestoreRef.collection(collectionSong)
    .doc(songId);
  
    const values = await doc.get();
    return values.exists ? values.data() : null;
  } catch (e) {
    log.error('Error en BD', e);
    return null;
  }
};

const getAllSongs = async ({ orderKey, order, lastItem, limitInt }) => {
  try {
    return firestoreRef.collection(collectionSong)
      .orderBy(orderKey, order)
      .startAfter(lastItem)
      .limit(limitInt)
      .get()
      .then((snapshot) => {
        const songs = [];
        snapshot.forEach((doc) => songs.push({ songId: doc.id, ...doc.data() }));
        log.info('Songs retrieved');
        return songs;
      });
  } catch (error) {
    log.error(error.message);
    return null;
  }
};

module.exports = {
  createSongInDb,
  updateSongInDb,
  deleteSong,
  getSongById,
  getAllSongs
};
