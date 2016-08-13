import express from 'express';
import socketio from 'socket.io';
import http from 'http';
import game from './game';

const app = express();
var server = http.Server(app);
var io = socketio(server);

if (app.get('env') !== 'production') {
  var browserSync = require('browser-sync');
  var bs = browserSync({ logSnippet: false });
  app.use(require('connect-browser-sync')(bs));
}

app.use(express.static('public'));

server.listen(8050, () => {
  console.log('server up and running');
  game({ io });
});
