import uuid from 'uuid';
import _ from 'lodash';

const gameState = {

};

export default function ({io}) {
  const update = _.throttle(() => {
    io.emit('update', _.values(gameState));
  }, 60000 / 24)

  io.on('connection', function(socket){
    const me = uuid();
    gameState[me] = {
      position: { x: 0, y: 0 },
      rotation: 0,
      thrust: false,
      acceleration: { x: 0, y: 0 },
      angularVelocity: { x: 0, y: 0 }
    };

    socket.on('registerPlayer', ({ name }) => {
      console.log(`${name} joined the game`);
      gameState[me].name = name;
    });

    socket.on('updatePlayer', (state) => {
      Object.assign(gameState[me], state);
      update();
    });
  });
}
