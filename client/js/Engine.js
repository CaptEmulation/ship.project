import PIXI from 'pixi';
import uuid from 'uuid';
import _ from 'lodash';

export default class Engine {
  constructor() {

  }

  init() {
    this.game.renderer.renderSession.roundPixels = true;
    this.physics.startSystem(Phaser.Physics.P2JS);
    // Define motion constants
    this.ROTATION_SPEED = 180; // degrees/second
    this.ACCELERATION = 0.125;
    this.MAX_SPEED = 8; // pixels / frame
    this.shipAcceleration = { x: 0, y: 0};
    this.shipVelocity = { x: 0, y: 0, value: 0, rotation: 0 };
    this.ships = {};
  }

  preload() {

  }

  create() {
    this.createGrid();
    this.createShip();
    this.createDebug();
    this.connectToServer();
  }

  update() {
    if (this.cursors.left.isDown) {
        // If the LEFT key is down, rotate left
        this.ship.body.angularVelocity = -this.ROTATION_SPEED;
        this.flame.body.angularVelocity = -this.ROTATION_SPEED;
    } else if (this.cursors.right.isDown) {
        // If the RIGHT key is down, rotate right
        this.ship.body.angularVelocity = this.ROTATION_SPEED;
        this.flame.body.angularVelocity = this.ROTATION_SPEED;
    } else {
        // Stop rotating
        this.ship.body.angularVelocity = 0;
        this.flame.body.angularVelocity = 0;
    }

    if (this.cursors.up.isDown) {
        // If the UP key is down, thrust
        // Calculate acceleration vector based on this.angle and this.ACCELERATION
        this.shipAcceleration.x = Math.sin(this.ship.rotation) * this.ACCELERATION;
        this.shipAcceleration.y = -Math.cos(this.ship.rotation) * this.ACCELERATION;
        this.flame.visible = true;
    } else {
        // Otherwise, stop thrusting
        this.shipAcceleration = { x: 0, y: 0 };
        this.flame.visible = false;
    }

    // calculate velocity
    const newVelocityX = this.shipVelocity.x + this.shipAcceleration.x;
    const newVelocityY = this.shipVelocity.y + this.shipAcceleration.y;
    const speed = Math.sqrt(Math.pow(newVelocityX,  2) + Math.pow(newVelocityY, 2));
    if (speed < this.MAX_SPEED) {
      this.shipVelocity.x = newVelocityX;
      this.shipVelocity.y = newVelocityY;
    } else {
      const clampedSpeedAmount = speed / this.MAX_SPEED;
      this.shipVelocity.x = newVelocityX / clampedSpeedAmount;
      this.shipVelocity.y = newVelocityY / clampedSpeedAmount;
    }

    this.grid.tilePosition.x -= this.shipVelocity.x;
    this.grid.tilePosition.y -= this.shipVelocity.y;
    this.playerPosition.x -= this.shipVelocity.x;
    this.playerPosition.y -= this.shipVelocity.y;

    this.debug.location.setText(`(${Math.floor(this.playerPosition.x)}, ${Math.floor(this.playerPosition.y)})`);

    const myPosition = this.playerPosition;
    _.values(this.ships).filter(e => e.updated).forEach(enemy => {
      enemy.updated = false;

      enemy.shipSprite.body.position.setTo(
        myPosition.x - enemy.position.x + this.game.width / 2,
        myPosition.y - enemy.position.y + this.game.height / 2
      );
      enemy.shipSprite.body.velocity.x += enemy.acceleration.x;
      enemy.shipSprite.body.velocity.y -= enemy.acceleration.y;
      enemy.shipSprite.body.angularVelocity = enemy.angularVelocity;
      enemy.shipSprite.rotation = enemy.rotation;

      enemy.flameSprite.body.position.setTo(
        myPosition.x - enemy.position.x + this.game.width / 2,
        myPosition.y - enemy.position.y + this.game.height / 2
      );
      enemy.flameSprite.body.velocity.x += enemy.acceleration.x;
      enemy.flameSprite.body.velocity.y -= enemy.acceleration.y;
      enemy.flameSprite.body.angularVelocity = enemy.angularVelocity;
      enemy.flameSprite.rotation = enemy.rotation;
      enemy.flameSprite.visible = enemy.thrust;
    });

    this.socket.emit('updatePlayer', {
      position: {
        x: this.playerPosition.x,
        y: this.playerPosition.y
      },
      rotation: this.ship.rotation,
      acceleration: this.shipAcceleration,
      angularVelocity: this.ship.body.angularVelocity,
      thrust: this.flame.visible,
      name: this.uuid
    });
  }



  createShip() {
    this.ship = this.add.sprite(this.game.width / 2, this.game.height / 2, this.createShipTexture());
    this.flame = this.add.sprite(this.game.width / 2, this.game.height / 2, this.createFlameTexture());
    this.ship.anchor.setTo(0.5, 0.5);
    this.flame.anchor.setTo(0.5, -2);
    this.physics.arcade.enable(this.ship);
    this.physics.arcade.enable(this.flame);
    this.ship.body.collideWorldBounds = true;
    //  Cursor keys to fly + space to fire
    this.cursors = this.input.keyboard.createCursorKeys();
    // Set maximum velocity
    this.ship.body.maxVelocity.setTo(this.MAX_SPEED * 60, this.MAX_SPEED * 60);
    this.flame.body.maxVelocity.setTo(this.MAX_SPEED * 60, this.MAX_SPEED * 60);
    this.playerPosition = new Phaser.Point(0, 0);
  }

  createShipTexture(size = 1) {
    const width = size * 50;
    const height = size * 100;
    const shipHeight = height * 0.75;
    const flameHeight = height * 0.2;
    const flameWidth = width * 0.75;

    var graphics = new PIXI.Graphics(width, height);
    graphics.beginFill(0x774c3c); // Tan
    graphics.lineStyle(4, 0x111111, 1);
    graphics.drawPolygon([
      width / 2, 0,
      width, shipHeight,
      0, shipHeight
    ]);
    graphics.endFill();

    return graphics.generateTexture();
  }

  createFlameTexture(size = 1) {
    const width = size * 50;
    const height = size * 100;
    const shipHeight = height * 0.75;
    const flameHeight = height * 0.2;
    const flameWidth = width * 0.75;

    var graphics = new PIXI.Graphics(width, height);
    graphics.beginFill(0xEEEE00); // fire
    graphics.lineStyle(1, 0x111111, 1);
    graphics.drawPolygon([
      width / 2, height,
      (width - flameWidth) / 2, height - flameHeight,
      (width + flameWidth) / 2, height - flameHeight
    ]);
    graphics.endFill();

    return graphics.generateTexture();
  }

  createGrid() {
    const box = this.add.graphics(0,0);
    box.beginFill(0xEEAAAA);
    box.lineStyle(1.5, 0x111111, 1);
    box.drawRect(0, 0, 128, 128);
    box.endFill();
    this.grid = this.add.tileSprite(0, 0, this.game.width, this.game.height, box.generateTexture());
  }

  createDebug() {
    const location = this.add.text(0, 10, '( 0, 0)');

    this.debug = {
      location
    };

    location.font = 'Arial Black';
    location.fontSize = 14;
  }

  serverUpdate(gameState) {
    gameState.filter(g => g.name && g.name !== this.uuid).forEach(ship => {
      const name = ship.name;
      if (this.ships[name]) {
        Object.assign(this.ships[name], { updated: true }, ship);
      } else {
        const playerPosition = this.playerPosition;
        const thisShip = this.ships[name] = ship;
        thisShip.shipSprite = this.add.sprite(playerPosition.x - ship.position.x, playerPosition.y - ship.position.y, this.createShipTexture());
        thisShip.flameSprite = this.add.sprite(playerPosition.x - ship.position.x, playerPosition.y - ship.position.y, this.createFlameTexture());
        thisShip.shipSprite.anchor.setTo(0.5, 0.5);
        thisShip.flameSprite.anchor.setTo(0.5, -2);
        this.physics.arcade.enable(thisShip.shipSprite);
        this.physics.arcade.enable(thisShip.flameSprite);
        thisShip.shipSprite.body.maxVelocity.setTo(this.MAX_SPEED * 60, this.MAX_SPEED * 60);
        thisShip.flameSprite.body.maxVelocity.setTo(this.MAX_SPEED * 60, this.MAX_SPEED * 60);
      }
    });
  }

  connectToServer() {
    this.socket = io();
    this.uuid = uuid();
    this.socket.emit('registerPlayer', {
      name: this.uuid
    });
    this.socket.on('update', this.serverUpdate.bind(this));
  }
}
