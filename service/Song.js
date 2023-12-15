const logger = require('../utils/logger');

const { firestoreRef } = require('../drivers/firestore');
const { generateId, successResponse, errorToResponse, loadTrack } = require('../utils/utils');
const SetRepository = require('../repository/SetRepository');

const log = logger({ fileName: 'Song.js' });
const collection = 'public';
const collectionSong = 'song';
const songCollection = 'configuration';
const registerBy = 'test';

const getSongByName = async (req, res) => {
  const { songName } = req.body;
  try {
    const [{ data: allSongs }] = await SetRepository.getAllSongs();
    const songsFilter = allSongs.filter(({ attributes }) => attributes.so_name.toLowerCase().includes(songName.toLowerCase()));
  
    const songs = songsFilter.map((song) => {
      const { id, attributes } = song;
      const { singers: singerArray } = attributes;
      const { data: singerData } = singerArray;
      const singer = singerData.map(({ attributes }) => attributes.si_name);
  
      return {
        songId: id,
        tempo: attributes.so_bpm || 120,
        songName: attributes.so_name,
        resource: attributes.so_resource,
        tonality: attributes.so_tonality,
        singer: singer.join(', '),
      }
    });
  
    const message = (!songs && songs.length <= 0) ? 'Successful Query' : 'Song not found';
  
    return res.send(successResponse(songs, message));
  } catch (e) {
    log.error(e);
  }
};

const deleteSetFromDb = async (req, res) => {
  const { setId, configId } = req.params;
  try {
    if (!firestoreRef) {
      log.error('Couldn\'t connect to database');
      return res.status(500).send(errorToResponse('Couldn\'t connect to database'));
    }

    const route = await firestoreRef.collection(collection)
      .doc(setId)
      .collection(songCollection)
      .doc(configId);
    
    const doc = await route.get();
    const song = doc.data();
      const { status: songStatus } = song;
  
      if (!doc.exists || !songStatus)
        return res.status(409).send(errorToResponse('Song not found or deleted'));

      await route.set({
        status: false,
        updatedAt:( new Date()).toGMTString(),
        updatedBy: 'deletSong'
      }, { merge: true });
    
      return res.send(successResponse('REmove successfully'));
  } catch (error) {
    log.error(error);
    return res.status(500).send(errorToResponse('Unnexpected error'));
  }
}

const createSongInDb = async (req, res) => {
  const {
    songName, songTempo, songTonality,
    bufferList, songResource, songLyrics,
    songChords, singerId,
  } = req.body;
  log.info(`Creating song ${songName}`);
  if (firestoreRef) {
    console.log("ENTRE");
    try {
      const doc = await firestoreRef.collection(collectionSong)
        .doc();
      const path = `songs/${doc.id}`;

      const imagePromises = loadTrack(bufferList, doc.id, path);
      let body = {
        songId: doc.id,
        singerId,
        songName,
        songTempo,
        songTonality,
        songResource,
        songLyrics,
        songChords,
        status: true,
        createdAt:(new Date()).toGMTString(),
        updatedAt:(new Date()).toGMTString(),
        registerBy,
      }

      return Promise.all(imagePromises)
        .then(async (downloadURLs) => {
          const urls = downloadURLs.map(([url]) => url);
          await doc.set({ ...body, secuence: [...urls] });
          log.info(`Song ${songName} created`);
          return res.send(successResponse(body, `Song ${songName} created succesfull`));
        });
    } catch (err) {
      log.error(err);
      return res.status(500).send(errorToResponse(err, 'Error creating data in firestore'));
    }
  }
  log.error('Couldn\'t connect to database');
  return res.status(500).send(errorToResponse('Couldn\'t connect to database'));
};

const updateSongInDb = async (req, res) => {
  const { bufferList, songId, songName, secuences, ...data  } = req.body;
  log.info(`Updating song ${songId}`);

  try {
    const doc = await firestoreRef.collection(collectionSong)
      .doc(songId);

    const values = await doc.get();

    let body = {
      songName,
      ...data,
      status: true,
      createdAt: (new Date()).toGMTString(),
      updatedAt: (new Date()).toGMTString(),
      registerBy,
      updatedBy: registerBy
    }

    if (bufferList.length === 0) {
      await doc.update(body);
      log.info(`Song ${songId} updated`);
      return res.status(200).send(successResponse(body, `Song ${songName} ok update`));
    }

    if (values.exists) {
      const path = `/songs/${songId}`;
      const imagePromises = loadTrack(bufferList, songId, path);

      return Promise.all(imagePromises)
        .then(async (downloadURLs) => {
          const urls = downloadURLs.map(([url]) => url);
          await doc.update({ ...body, secuences: [...urls, ...secuences] });
          log.info(`Song ${songId} updated`);
          return res.send(successResponse(body, `Song ${songName} update succesfull`));
        })
        .catch((err) => {
          log.error(err);
          return res.status(500).send(errorToResponse(err));
        });
    }
  } catch (error) {
    log.error(error);
    return res.status(500).send(errorToResponse('Couldn\'t connect to database'));
  }
  return res.status(500).send(errorToResponse('Couldn\'t connect to database'));
};

const getAllSongsFromDb = async (req, res) => {
  const {
    limit, lastItem = null,
    orderKey = 'songName', order = 'asc',
  } = req.body;

  log.info('Getting all songs');

  try {
    const limitInt = parseInt(limit, 10);

    return firestoreRef.collection(collectionSong)
      .orderBy(orderKey, order)
      .startAfter(lastItem)
      .limit(limitInt)
      .get()
      .then((snapshot) => {
        const songs = [];
        snapshot.forEach((doc) => songs.push({ songId: doc.id, ...doc.data() }));
        log.info('Songs retrieved');
        return res.send(successResponse(songs));
      });
  } catch (error) {
    log.error(error.message);
    return res.status(500).send(errorToResponse('Couldn\'t connect to database'));
  }
};

const deleteSongFromDb = async (req, res) => {
  const { songId } = req.params;
  const { status } = req.body;
  log.info(`Deleting song ${songId}`);
  try {
    const doc = await firestoreRef.collection(songCollection)
      .doc(songId);

    const values = await doc.get();
    if (values.exists) {
      try {
        await doc.set({
          status,
        }, { merge: true });
        log.info(`Song ${songId} deleted`);
        return res.send(successResponse(`Song ${songId} delete succesfull`));
      } catch (err) {
        log.error(err.message);
        return res.status(500).send(errorToResponse(err, 'Error deleting data from firestore'));
      }
    } else {
      log.error(`Song ${songId} doesn't exist`);
      return res.status(500).send(errorToResponse(`Song ${songId} does not exist`));
    }
  } catch (error) {
    log.error(error.message);
    return res.status(500).send(errorToResponse('Couldn\'t connect to database'));
  }
};


module.exports = {
  getSongByName,
  deleteSetFromDb,
  createSongInDb,
  updateSongInDb,
  getAllSongsFromDb,
  deleteSongFromDb,
};
