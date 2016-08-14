import state from '../state';
import Phaser from 'phaser';

export default class Player {
  constructor() {
    this.shipAcceleration = { x: 0, y: 0};
    this.shipVelocity = { x: 0, y: 0, value: 0, rotation: 0 };
  }

  create(engine) {
    this.ship = state.engine.add.sprite(state.engine.game.width / 2, state.engine.game.height / 2, this.createShipTexture());
    this.flame = state.engine.add.sprite(state.engine.game.width / 2, state.engine.game.height / 2, this.createFlameTexture());
    this.ship.anchor.setTo(0.5, 0.5);
    this.flame.anchor.setTo(0.5, -2);
    state.engine.physics.arcade.enable(this.ship);
    state.engine.physics.arcade.enable(this.flame);
    this.ship.body.collideWorldBounds = true;

    // Set maximum velocity
    this.ship.body.maxVelocity.setTo(state.MAX_SPEED * 60, state.MAX_SPEED * 60);
    this.flame.body.maxVelocity.setTo(state.MAX_SPEED * 60, state.MAX_SPEED * 60);
    this.playerPosition = new Phaser.Point(0, 0);
    state.player = this;
  }

  update() {
    if (state.cursors.left.isDown) {
        // If the LEFT key is down, rotate left
        this.ship.body.angularVelocity = -state.ROTATION_SPEED;
        this.flame.body.angularVelocity = -state.ROTATION_SPEED;
    } else if (state.cursors.right.isDown) {
        // If the RIGHT key is down, rotate right
        this.ship.body.angularVelocity = state.ROTATION_SPEED;
        this.flame.body.angularVelocity = state.ROTATION_SPEED;
    } else {
        // Stop rotating
        this.ship.body.angularVelocity = 0;
        this.flame.body.angularVelocity = 0;
    }

    if (state.cursors.up.isDown) {
        // If the UP key is down, thrust
        // Calculate acceleration vector based on this.angle and this.ACCELERATION
        this.shipAcceleration.x = Math.sin(this.ship.rotation) * state.ACCELERATION;
        this.shipAcceleration.y = -Math.cos(this.ship.rotation) * state.ACCELERATION;
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

    this.playerPosition.x -= this.shipVelocity.x;
    this.playerPosition.y -= this.shipVelocity.y;
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
}
