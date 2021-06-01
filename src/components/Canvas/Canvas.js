import React, { useEffect, useRef, useState } from 'react';

import Toolbar from '../Toolbar/Toolbar.js';

import firebase from 'firebase/app';
import { useDocumentData } from 'react-firebase-hooks/firestore';

import './Canvas.css';

const width = 512;
const height = 512;
const grid = 32;

// const gridWidth = width / grid;
// const gridHeight = width / grid;

let canvas;
let ctx;

const tileCount = 1;
let tiles = [];

function Canvas() {
  const [tileIndex, setTileIndex] = useState(-1);

  const mapDoc = firebase.firestore().collection('maps').doc('map');
  const [mapData] = useDocumentData(mapDoc);

  const canvasRef = useRef();

  function loadTiles() {
    tiles = [];
    for (let i = 0; i < tileCount; i++) {
      const tileURL = mapData[`tile${i}`];
      if (tileURL) {
        let tile = new Image();
        tile.src = tileURL;
        tiles.push(tile);
      } else tiles.push(null);
    }
  }

  function drawTile(e) {
    // get current mouse position
    let currX = e.clientX - canvas.offsetLeft + window.scrollX;
    let currY = e.clientY - canvas.offsetTop + window.scrollY;

    // round mouse position to nearest gridpoint
    currX = Math.floor(currX / grid) * grid;
    currY = Math.floor(currY / grid) * grid;

    // draw tile
    if (tileIndex === -1) {
      ctx.fillStyle = 'white';
      ctx.fillRect(currX, currY, grid, grid);
    } else if (tiles[tileIndex]) {
      ctx.drawImage(tiles[tileIndex], currX, currY, grid, grid);
    }
  }

  // get canvas and context on start
  useEffect(() => {
    canvas = canvasRef.current;
    ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
  }, []);

  useEffect(() => {
    if (mapData) loadTiles();
  }, [mapData]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="Canvas">
      <Toolbar tileCount={tileCount} />
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onMouseDown={e => drawTile(e)}
      />
      {
        tileIndex === -1 ?
        <p>erasing</p> :
        tiles[tileIndex] &&
        <img src={tiles[tileIndex].src} alt="" />
      }
      <input
        type="number"
        step="1"
        min="-1"
        max={tileCount - 1}
        value={tileIndex}
        onChange={e => {
          let val = e.target.value;
          let intval = parseInt(val);
          if (!isNaN(intval)) setTileIndex(intval);
        }}
      />
    </div>
  );
}

export default Canvas;
