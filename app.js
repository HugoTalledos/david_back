const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const logger = require('./utils/logger');
const { local, dev, prod } = require('./allow_cors');

const log = logger({ fileName: 'app' });

dotenv.config();

const setRoutes = require('./controller/SetsRoute');
const authRoutes = require('./controller/AuthRoute');
const songRoutes = require('./controller/SongsRoute');
const singerRoutes = require('./controller/SingerRoute');

const app = express();

const environment = process.env.ENV || 'local';

const allowLocal = environment === 'local' ? local : [];
const allowDev = environment === 'dev' ? dev : [];
const allowList = [...allowLocal, ...allowDev, ...prod];

const corsOptionsDelegate = (req, callback) => {
  let corsOptions;
  if (allowList.indexOf(req.header('Origin')) !== -1) {
    corsOptions = { origin: true };
  } else {
    log.info(`Origin rejected: ${req.header('Origin')}`);
    corsOptions = { origin: false };
  }
  callback(null, corsOptions);
};

app.use(cors(corsOptionsDelegate));

app.use(express.json({ limit: '100gb' }));
app.use(express.urlencoded({ limit: '100gb', extended: true }));

const port = process.env.PORT || 8080;

app.use('/api/sets', setRoutes);
app.use('/api/singer', singerRoutes);
app.use('/api/songs', songRoutes);
app.use('/api/auth', authRoutes);

app.listen(port, () => {
  log.info(`Server is running on port ${port}`);
});
