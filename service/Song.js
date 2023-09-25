const logger = require('../utils/logger');

const { firestoreRef } = require('../drivers/firestore');
const { generateId, successResponse, errorToResponse } = require('../utils/utils');
const SetRepository = require('../repository/SetRepository');

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


module.exports = {
  getSongByName,
  deleteSetFromDb,
};
