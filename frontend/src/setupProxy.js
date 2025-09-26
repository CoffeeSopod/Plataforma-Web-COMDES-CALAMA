// src/setupProxy.js para http-proxy-middleware v1
const proxy = require('http-proxy-middleware');

const API = process.env.REACT_APP_API_ORIGIN || 'http://192.168.2.16:4000';

module.exports = function (app) {
  app.use('/api', proxy({ target: API, changeOrigin: true, secure: false }));
  app.use('/uploads', proxy({ target: API, changeOrigin: true, secure: false }));
  app.use('/socket.io', proxy({ target: API, changeOrigin: true, ws: true, secure: false }));
};
