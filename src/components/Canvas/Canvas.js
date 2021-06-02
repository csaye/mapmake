import React, { useEffect, useRef, useState } from 'react';

import Tilebar from '../Tilebar/Tilebar.js';
import Toolbar from '../Toolbar/Toolbar.js';

import firebase from 'firebase/app';
import { useDocumentData } from 'react-firebase-hooks/firestore';

import './Canvas.css';

// canvas reference
let canvas;
let ctx;

// canvas pixel dimensions
let gridSize = 32;
let canvasPixels = 512;
let gridPixels = canvasPixels / gridSize;

let drawing = false;
let lastX, lastY;
const tileCount = 10;

// initialize tile data as empty
let tileData = '-'.repeat(gridSize * gridSize);

function Canvas() {
  const [canvasSize, setCanvasSize] = useState(canvasPixels);
  const [gridSizeHook, setGridSizeHook] = useState(gridSize);

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
      image.crossOrigin = 'anonymous';
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
    ctx.fillRect(x * gridPixels, y * gridPixels, gridPixels, gridPixels);
    ctx.fillStyle = '#fff';
    ctx.fillRect(x * gridPixels + 0.5, y * gridPixels + 0.5, gridPixels - 1, gridPixels - 1);
  }

  // loads tiles
  function loadTiles(loadAll) {
    const mapTiles = mapData.tiles;
    // if map size different, adjust local grid size
    if (mapTiles.length !== tileData.length) {
      const newGridSize = Math.round(Math.sqrt(mapTiles.length));
      gridSize = newGridSize;
      gridPixels = canvasPixels / newGridSize;
      tileData = '-'.repeat(mapTiles.length);
      setGridSizeHook(newGridSize);
      return;
    }
    // for each tile on canvas
    for (let x = 0; x < gridSize; x++) {
      for (let y = 0; y < gridSize; y++) {
        const i = y * gridSize + x;
        // if tile data does not match map data
        const mapTile = mapTiles[i];
        if (loadAll || tileData[i] !== mapTile) {
          // load image
          if (mapTile === '-') clearTile(x, y);
          else {
            const index = parseInt(mapTile);
            ctx.drawImage(tiles[index], x * gridPixels, y * gridPixels, gridPixels, gridPixels);
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
    const gridX = Math.floor(mouseX / gridPixels);
    const gridY = Math.floor(mouseY / gridPixels);

    // if moving and same grid square as last, return
    if (mode === 'move' && gridX === lastX && gridY === lastY) return;

    // update last position
    lastX = gridX;
    lastY = gridY;

    // draw tile
    if (tileIndex === -1) clearTile(gridX, gridY);
    else if (tiles[tileIndex]) {
      ctx.drawImage(tiles[tileIndex], gridX * gridPixels, gridY * gridPixels, gridPixels, gridPixels);
    }

    // update tile data
    const index = gridY * gridSize + gridX;
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
    // confirm clear
    if (!window.confirm('Clear all tiles?')) return;
    // update tile data in firebase
    const clearData = '-'.repeat(gridSize * gridSize);
    await mapDoc.update({
      tiles: clearData
    });
  }

  // downloads canvas as a png
  function downloadPNG() {
    // get object url
    canvas.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      // download from link element
      const link = document.createElement('a');
      link.download = 'map.png';
      link.href = url;
      link.click();
    })
  }

  // downloads canvas as a JSON
  function downloadJSON() {
    // construct tiles json data string
    const chars = [];
    for (let char of mapData.tiles) chars.push(char);
    const tilesJson = { tiles: chars };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(tilesJson));
    // download from link element
    const link = document.createElement('a');
    link.download = 'map.json';
    link.href = dataStr;
    link.click();
  }

  // updates canvas to match given size
  function updateCanvasSize(pixels) {
    canvasPixels = pixels;
    gridPixels = canvasPixels / gridSize;
    setCanvasSize(canvasPixels);
  }

  // scales down a string representing 2d space
  function scaleDown2D(str, side, factor) {
    let out = '';
    for (let x = 0; x < side; x += factor) {
      for (let y = 0; y < side; y += factor) {
        const i = x * side + y;
        out += str[i];
      }
    }
    return out;
  }

  // scales up a string representing 2d space
  function scaleUp2D(str, side, factor) {
    let out = '';
    for (let x = 0; x < side * factor; x++) {
      for (let y = 0; y < side * factor; y++) {
        const x2 = Math.floor(x / factor);
        const y2 = Math.floor(y / factor);
        const i = x2 * side + y2;
        out += str[i];
      }
    }
    return out;
  }

  // updates tile grid to match given size
  async function updateGridSize(sizePower) {
    // confirm switch
    if (!window.confirm('Update grid size?')) return;

    // update canvas dimensions
    gridSize = Math.pow(2, sizePower);
    gridPixels = canvasPixels / gridSize;

    // update tile data
    const gridGrid = gridSize * gridSize;
    const tileSide = Math.round(Math.sqrt(tileData.length));
    if (tileData.length !== gridGrid) {
      // scale tile data up
      if (tileData.length < gridGrid) {
        const factor = gridSize / tileSide;
        tileData = scaleUp2D(tileData, tileSide, factor);
      // scale tile data down
      } else {
        const factor = tileSide / gridSize;
        tileData = scaleDown2D(tileData, tileSide, factor);
      }
    }
    await mapDoc.update({
      tiles: tileData
    });

    setGridSizeHook(gridSize);
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

  // reload all tiles when images or canvas dimensions update
  useEffect(() => {
    if (tiles) loadTiles(true);
  }, [tiles, canvasSize, gridSizeHook]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="Canvas">
      {!loaded && <p className="loading-text">Loading...</p>}
      {
        loaded &&
        <Toolbar
          downloadPNG={downloadPNG}
          downloadJSON={downloadJSON}
          canvasSize={canvasSize}
          updateCanvasSize={updateCanvasSize}
          gridSize={gridSizeHook}
          updateGridSize={updateGridSize}
        />
      }
      <canvas
        ref={canvasRef}
        width={canvasSize}
        height={canvasSize}
        onMouseDown={e => sketch('down', e)}
        onMouseMove={e => sketch('move', e)}
        onMouseUp={e => endSketch()}
        onMouseLeave={e => endSketch()}
        style={{display: loaded ? 'inline' : 'none'}}
      />
      {
        loaded &&
        <Tilebar
          tiles={tiles}
          tileIndex={tileIndex}
          setTileIndex={setTileIndex}
          clearTiles={clearTiles}
        />
      }
    </div>
  );
}

export default Canvas;
