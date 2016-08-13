import PIXI from 'pixi';

export function triangle({ width, height, fill, line }) {
  // Initialize the pixi Graphics class
  var graphics = new PIXI.Graphics();

  // Set the fill color
  graphics.beginFill(0x774c3c); // Tan
  graphics.lineStyle(4, 0x111111, 1);

  // Draw a circle
  graphics.drawPolygon([
    width / 2, 0,
    width, height,
    0, height
  ]);

  graphics.endFill();

  return graphics;
}
