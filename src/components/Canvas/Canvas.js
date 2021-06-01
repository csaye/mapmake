import React, { useEffect, useRef } from 'react';

import './Canvas.css';

const width = 512;
const height = 512;
const grid = 32;

let canvas;
let ctx;

let tile = new Image();
tile.src = require('../../img/tile.png').default;

function Canvas() {
  const canvasRef = useRef();

  function drawTile(e) {
    // get current mouse position
    let currX = e.clientX - canvas.offsetLeft + window.scrollX;
    let currY = e.clientY - canvas.offsetTop + window.scrollY;

    // round mouse position to nearest gridpoint
    currX = Math.floor(currX / grid) * grid;
    currY = Math.floor(currY / grid) * grid;

    // draw tile
    ctx.drawImage(tile, currX, currY, grid, grid);
  }

  // get canvas and context on start
  useEffect(() => {
    canvas = canvasRef.current;
    ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
  }, []);

  return (
    <div className="Canvas">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onMouseDown={e => drawTile(e)}
      />
    </div>
  );
}

export default Canvas;
