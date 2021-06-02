import React, { useEffect, useRef, useState } from 'react';

import Toolbar from '../Toolbar/Toolbar.js';

import firebase from 'firebase/app';
import { useDocumentData } from 'react-firebase-hooks/firestore';

import './Canvas.css';

// canvas grid dimensions
const grid = 16;
const gridWidth = 32;
const gridHeight = 32;

// canvas pixel dimensions
const width = gridWidth * grid;
const height = gridHeight * grid;

let canvas;
let ctx;
let drawing = false;

let lastX, lastY;

const tileCount = 10;

// initialize tile data as empty
let clearData = '';
for (let i = 0; i < gridWidth * gridHeight; i++) clearData += '-';
let tileData = clearData;

function Canvas() {
  const [loaded, setLoaded] = useState(false);
  const [tileIndex, setTileIndex] = useState(-1);
  const [tiles, setTiles] = useState(undefined);

  const imagesDoc = firebase.firestore().collection('data').doc('images');
  const [imagesData] = useDocumentData(imagesDoc);
  const mapDoc = firebase.firestore().collection('data').doc('map');
  const [mapData] = useDocumentData(mapDoc);

  const canvasRef = useRef();

  // updates tile data at index to given tile
  function setTileData(index, tile) {
    const char = tile < 0 ? '-' : tile.toString();
    tileData = tileData.slice(0, index) + char + tileData.slice(index + 1);
  }

  // returns an image as a promise
  function getImage(url) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = url;
    });
  }

  // loads tile images
  async function loadImages() {
    const tileImages = [];
    for (let i = 0; i < tileCount; i++) {
      const tileURL = imagesData[`tile${i}`];
      // if tile exists, push image with url source
      if (tileURL) {
        const tileImage = await getImage(tileURL);
        tileImages.push(tileImage);
      // if tile does not exist, push null
      } else tileImages.push(null);
    }
    setTiles(tileImages);
  }

  // clears tile at given x, y grid coordinates
  function clearTile(x, y) {
    ctx.fillStyle = '#ddd';
    ctx.fillRect(x * grid, y * grid, grid, grid);
    ctx.fillStyle = '#fff';
    ctx.fillRect(x * grid + 0.5, y * grid + 0.5, grid - 1, grid - 1);
  }

  // loads tiles
  function loadTiles(loadAll) {
    const mapTiles = mapData.tiles;
    // for each tile on canvas
    for (let x = 0; x < gridWidth; x++) {
      for (let y = 0; y < gridHeight; y++) {
        const i = y * gridWidth + x;
        // if tile data does not match map data
        const mapTile = mapTiles[i];
        if (loadAll || tileData[i] !== mapTile) {
          // load image
          if (mapTile === '-') clearTile(x, y);
          else {
            const index = parseInt(mapTile);
            ctx.drawImage(tiles[index], x * grid, y * grid, grid, grid);
          }
        }
      }
    }
    // update tile data
    tileData = mapTiles;
    setLoaded(true);
  }

  // sketches tiles to the canvas
  async function sketch(mode, e) {
    // start drawing if mouse down
    if (mode === 'down') drawing = true;
    // return if mouse moving and not drawing
    else if (mode === 'move' && !drawing) return;

    // get current mouse position
    let mouseX = e.clientX - canvas.offsetLeft + window.scrollX;
    let mouseY = e.clientY - canvas.offsetTop + window.scrollY;

    // round mouse position to nearest gridpoint
    const gridX = Math.floor(mouseX / grid);
    const gridY = Math.floor(mouseY / grid);

    // if moving and same grid square as last, return
    if (mode === 'move' && gridX === lastX && gridY === lastY) return;

    // update last position
    lastX = gridX;
    lastY = gridY;

    // draw tile
    if (tileIndex === -1) clearTile(gridX, gridY);
    else if (tiles[tileIndex]) {
      ctx.drawImage(tiles[tileIndex], gridX * grid, gridY * grid, grid, grid);
    }

    // update tile data
    const index = gridY * gridWidth + gridX;
    setTileData(index, tileIndex);
  }

  // called after sketch ends
  async function endSketch() {
    drawing = false;
    // update tile data in firebase
    await mapDoc.update({
      tiles: tileData
    });
  }

  // clears all tiles on screen
  async function clearTiles() {
    if (window.confirm('Clear all tiles?')) {
      // update data in firebase
      tileData = clearTiles;
      await mapDoc.update({
        tiles: clearData
      });
    }
  }

  // get canvas and context on start
  useEffect(() => {
    canvas = canvasRef.current;
    ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
  }, []);

  // load tile images when image data changes
  useEffect(() => {
    if (imagesData) loadImages();
  }, [imagesData]); // eslint-disable-line react-hooks/exhaustive-deps

  // load tiles when map data changes
  useEffect(() => {
    if (mapData && tiles) loadTiles(false);
  }, [mapData]); // eslint-disable-line react-hooks/exhaustive-deps

  // reload all tiles when images update
  useEffect(() => {
    if (tiles) loadTiles(true);
  }, [tiles]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="Canvas">
      {
        loaded ?
        <Toolbar
          tiles={tiles}
          tileIndex={tileIndex}
          setTileIndex={setTileIndex}
          clearTiles={clearTiles}
        /> :
        <p className="loading-text">Loading...</p>
      }
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onMouseDown={e => sketch('down', e)}
        onMouseMove={e => sketch('move', e)}
        onMouseUp={e => endSketch()}
        onMouseLeave={e => endSketch()}
        style={{display: loaded ? 'inline' : 'none'}}
      />
    </div>
  );
}

export default Canvas;
