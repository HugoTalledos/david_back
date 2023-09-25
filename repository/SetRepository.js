const axios = require('axios');
const logger = require('../utils/logger');
const { API_GRAPQL } = require('../utils/config');
const log = logger({ fileName: 'SetRepository.js' });
const url = API_GRAPQL;

const getSongsById = (songList) => {
  let parameters = '';
  songList.forEach((element, idx) => {
    let querybase = `
    song${idx}: song(id: "${element}") {
      data {
        id
        attributes {
          so_name,
          so_bpm,
          so_tonality,
          so_resource,
          multitrack {
            data {
              id,
              attributes {
                url,
              }
            }
          },
          lyrics {
            data {
              attributes {
                ly_lyric
                ly_chords
              }
            }
          },
          singers {
            data {
              attributes {
                si_name
              }
            }
          }
        }
      }
    }`;
    parameters += querybase;
  });
  const query = `{
    ${parameters}
  }`;

  return axios.post(url, { query })
    .then(({ data }) => {
      log.info('Success query');
      const [songsObjects] = Object.values(data);
      const songsList = Object.values(songsObjects);
      return songsList;
    })
    .catch((error) => {
      log.error(error.message);
      return null;
    });
    
};

const getAllSongs = () => {
  let querybase = `
    songs {
      data {
        id
        attributes {
          so_name
          so_bpm
          so_tonality
          so_resource
          singers {
            data {
              id
              attributes {
                si_name
              }
            }
          }
        }
      }
    }`;
  const query = `{${querybase}}`;

  return axios.post(url, { query })
    .then(({ data }) => {
      log.info('Success query');
      const [songsObjects] = Object.values(data);
      const songsList = Object.values(songsObjects);
      return songsList;
    })
    .catch((error) => {
      log.error(error.message);
      return null;
    });
    
};


module.exports = {
  getAllSongs,
  getSongsById
};
