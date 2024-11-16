const config = require('config');
const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);
const cors = require('cors');
const mongoose = require('mongoose');
const express = require('express');

// import routers
const home = require('./routes/home');
const adminUsers = require('./routes/users');
const adminLogin = require('./routes/login');
const webAuth = require('./routes/auth');
// creating app
const app = express();

// req parsing middlewares
app.use(express.urlencoded());
app.use(express.json());

// allowing cors
app.use(
  cors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3005',
      `${config.get('adminFrontendUrl')}`,
    ],
    exposedHeaders: 'x-auth-token',
  })
);

// defining public asset folder
app.use('/public', express.static('public'));

// installing middlewares
app.use('/', home);
app.use('/admin/login', adminLogin);
app.use('/admin/users', adminUsers);
app.use('/auth', webAuth);

// db connection
mongoose
  .connect(config.get('db'))
  .then(() => console.log('Connected to MongoDB...'))
  .catch((err) => console.log('Connection to MongoDB failed...'));

// http listening
const port = process.env.PORT || 3000;
const host = process.env.HOST || '0.0.0.0';

app.listen(port, host, () => {
  console.log(`Listening on http://${host}:${port}...`);
});
