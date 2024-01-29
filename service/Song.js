const logger = require('../utils/logger');

const { firestoreRef } = require('../drivers/firestore');
const { successResponse, errorToResponse } = require('../utils/utils');
const SetRepository = require('../repository/SetRepository');
const songRepository = require('../repository/SongRepository');

const log = logger({ fileName: 'Song.js' });
const collection = 'public';
const songCollection = 'configuration';

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
  const { songId, ...all } = req.body;
  log.info(`Creating song ${songId}`);
  try {
    const songCreated = await songRepository.createSongInDb(songId, all);

    if (!songCreated) return res.status(500).send(errorToResponse(err, 'Error creating data in firestore'));

    return res.send(successResponse(songCreated, `Song ${songCreated.songName} created succesfull`));
  } catch (err) {
    log.error(err);
    return res.status(500).send(errorToResponse('Couldn\'t connect to database'));
  }
};

const updateSongInDb = async (req, res) => {
  const { songId, ...data  } = req.body;
  log.info(`Updating song ${songId}`);

  try {
    const updatedSong = await songRepository.updateSongInDb(songId, data);

    if (!updatedSong)  return res.status(500).send(errorToResponse('Song not found or deleted'));
    return res.status(200).send(successResponse(updatedSong, `Song ${updatedSong.songName} ok update`));
  } catch (error) {
    log.error(error);
    return res.status(500).send(errorToResponse('Couldn\'t connect to database'));
  }
};

const getSongById = async (req, res) => {
  const { songId } = req.params;
  log.info(`Find song ${songId}`);
  try {
    const song = await songRepository.getSongById(songId);

    if (!song) {
      log.warn(`Song ${songId} doesn't exist`);
      return res.status(500).send(errorToResponse(`Song ${songId} does not exist`));
    }

    log.info(`Song ${songId} found`);
    return res.send(successResponse(song));
  } catch (error) {
    log.error(error.message);
    return res.status(500).send(errorToResponse('Couldn\'t connect to database'));
  }
}

const getAllSongsFromDb = async (req, res) => {
  const {
    limit = 20, lastItem = null,
    orderKey = 'songName', order = 'asc',
  } = req.body;

  log.info('Getting all songs');

  try {
    const limitInt = parseInt(limit, 10);

    const songs = await songRepository.getAllSongs({ orderKey, order, lastItem, limitInt });
    
    if (!songs) return res.status(500).send(errorToResponse('Couldn\'t connect to database'));

    return res.send(successResponse(songs));
  } catch (error) {
    log.error(error.message);
    return res.status(500).send(errorToResponse('Couldn\'t connect to database'));
  }
};

const deleteSongFromDb = async (req, res) => {
  const { songId, status } = req.body;
  log.info(`Deleting song ${songId}`);
  try {
    const deletedSong = await songRepository.deleteSong(songId, status);

    if (!deletedSong) return res.status(500).send(errorToResponse(err, 'Error deleting data from firestore'));

    return res.send(successResponse(deletedSong, `Song ${songId} delete succesfull`));
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
  getSongById,
  getAllSongsFromDb,
  deleteSongFromDb,
};
