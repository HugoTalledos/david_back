const logger = require('../utils/logger');

const { firestoreRef } = require('../drivers/firestore');
const { generateId, successResponse, errorToResponse } = require('../utils/utils');
const setRepository = require('../repository/SetRepository');

const log = logger({ fileName: 'Set.js' });
const collection = 'public';
const songCollection = 'configuration';

const createSetInDb = async (req, res) => {
  const { setName, setDescription, songList } = req.body;
  const registerBy = 'test';
  const setId = generateId();
  log.info(`Creating Set ${setName}`);
    
  try {
    if (!firestoreRef) {
      log.error('Couldn\'t connect to database');
      return res.status(500).send(errorToResponse('Couldn\'t connect to database'));
    }
    const setDoc = await firestoreRef.collection(collection)
      .doc(setId);

    const songIdList = songList.map((song) => song.songId);

    await setDoc.set({
      setId,
      setName,
      setDescription,
      songIdList,
      status: true,
      createdAt:(new Date()).toGMTString(),
      updatedAt:(new Date()).toGMTString(),
      registerBy,
      updatedBy: registerBy
    });
    log.info(`Set created successfully`);

    const songConfigDoc = setDoc.collection(songCollection).doc();

    for (let i = 0; i < songList.length; i++) {
      const song = songList[i];
      log.info(`Creating song config: ${song.id}`);
      await songConfigDoc.set({
        ...song,
        status: true,
        createdAt: (new Date()).toGMTString(),
        updatedAt: (new Date()).toGMTString(),
        registerBy,
        updatedBy: registerBy
      });
    }
    log.info(`Config song created successfully`);
    return res.send(successResponse({ setId }))
  } catch (err) {
    log.error(err);
    return res.status(500).send(errorToResponse(err, 'Error creating data in firestore'));
  }
};

const updateSetInDb = async (req, res) => {
  const { setId, songList = [], ...all } = req.body;
  log.info(`Updating set ${setId}`);
  const updatedBy = 'updated';

  try {
    if (!firestoreRef) {
      log.error('Couldn\'t connect to database');
      return res.status(500).send(errorToResponse('Couldn\'t connect to database'));
    }
    const route = await firestoreRef.collection(collection)
      .doc(setId);

    const doc = await route.get();
    if (!doc.exists) return res.status(500).send(errorToResponse('Set not found or deleted'));

    const songIdList = songList.map((song) => song.songId);

    await route.set({
      setId,
      ...all,
      songIdList,
      updatedAt:( new Date()).toGMTString(),
      updatedBy
    }, { merge: true });
    log.info(`Set updated successfully`);

    const songConfigCollect = route.collection(songCollection); 

    await songConfigCollect.get()
      .then((querySnapshot) => {
        querySnapshot.forEach((doc) => { doc.ref.update({ status: false }) })
      });

    for (let i = 0; i < songList.length; i++) {
      const { configId, songId, tonality, tempo, order = 0, songTonality, songTempo } = songList[i];
      const songConfig = configId != undefined ? songConfigCollect.doc(configId) : songConfigCollect.doc();
      log.info(`Updating song config: ${songId}`);

      await songConfig.set({
        songId,
        tonality: tonality || songTonality,
        tempo: tempo || songTempo,
        order,
        status: true,
        updatedAt: (new Date()).toGMTString(),
        updatedBy
      }, { merge: true });
    }
    log.info(`Config song updated successfully`);
    return res.send(successResponse('Success updated'));
  } catch (error) {
    log.error(error);
    return res.status(500)
      .send(errorToResponse(`Unnexpected error`));
  }
};

const getSetFromDb = async (req, res) => {
  const { setId } = req.params;
  const { local = false } = req.body;
  log.info(`Getting set ${ setId }`);
  try {
    if (!firestoreRef) {
      log.error('Couldn\'t connect to database');
      return res.status(500).send(errorToResponse('Couldn\'t connect to database'));
    }

    const route = await firestoreRef.collection(collection)
      .doc(setId);
    const doc = await route.get();
    const set = doc.data();
    const { songIdList, status: setStatus } = set;

    if (!doc.exists || !setStatus)
      return local ? {} : res.status(409).send(errorToResponse('Set not found or deleted'));
    
    const originalSongs = await setRepository.getSongsById(songIdList);

    const songConfig = await (route.collection(songCollection).where('status', '==', true)).get();
    const songsConfig = [];

    if (originalSongs && originalSongs.length > 0 && songConfig.size > 0) {
      (originalSongs).forEach(({ data: originalSong }) => {
        const { id, attributes } = originalSong;
        const { singers, lyrics, multitrack } = attributes;
        const snapSong = songConfig.docs.find(song => song.data().songId == id);
        const config = snapSong ? snapSong.data() : {};
        const singerList = (singers.data || []).map(({ attributes }) => attributes.si_name);
        const lyricObject = lyrics.data[0].attributes;
        const { ly_lyric: lyric , ly_chords: chord } = lyricObject || {};
        const { attributes: attMultitrack } = multitrack.data || {};

        const song = {
          songId: id,
          configId: snapSong ? snapSong.id : songsConfig.length,
          singer: singerList.join(','),
          songName: attributes.so_name,
          songResourse: config.resource || attributes.so_resource,
          songTonality: config.tonality || attributes.so_tonality,
          songTempo: config.tempo || attributes.so_bpm,
          order: config.order || attributes.order,
          multitrack: attMultitrack ? attMultitrack.url : '',
          lyric,
          chords: chord,
        };
        songsConfig.push(song);
      });
    }
    
    const response = { ...set, songsConfig };

    return local ? response : res.send(successResponse(response));
  } catch (error) {
    log.error(error);
    return res.status(500).send(errorToResponse('Unnexpected error'));
  }
};

const getAllSetsFromDb = async (req, res) => {
  log.info('Getting all sets');

  try {
    if (!firestoreRef) {
      log.error('Couldn\'t connect to database');
      return res.status(500).send(errorToResponse('Couldn\'t connect to database'));
    }

    const route = await firestoreRef.collection(collection).where("status", "==", true).get();

    if (route.size <= 0) return res.send(successResponse([], 'Sets not found'));
    log.info(`Sets found: ${route.size}`);
    const setList = [];
    for(let i = 0; i < route.size; i++) {
      const setId = route.docs[i].id;
      const set = await getSetFromDb({ params: { setId }, body: { local: true } });
      setList.push(set);
    }

    if (setList.length <= 0) return res.send(successResponse(setList, 'Results not found'));

    return res.send(successResponse(setList, 'Success query'));
  } catch (error) {
    log.error(error.message);
    return res.status(500).send(errorToResponse('Unnexpected error'));
  }
};

const deleteSetFromDb = async (req, res) => {
  const { setId } = req.params;
  log.info(`Deleting set ${setId}`);
  try {
    const doc = await firestoreRef.collection(collection)
      .doc(setId);
    const values = await doc.get();
    if (!values.exists) {
      log.error(`Set ${setId} doesn't exist`);
      return res.status(500).send(errorToResponse(`Product ${setId} does not exist`));
    }

    await doc.set({
      status: false,
      updatedAt:  (new Date()).toGMTString(),
      updatedBy: 'deleted'
    }, { merge: true });
    log.info(`Set ${setId} deleted`);
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
