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
let isFill = false;

// initialize tile data as empty
let tileData = '-'.repeat(gridSize * gridSize);

function Canvas(props) {
  const [canvasSize, setCanvasSize] = useState(canvasPixels);
  const [gridSizeHook, setGridSizeHook] = useState(gridSize);

  const [loaded, setLoaded] = useState(false);
  const [fill, setFill] = useState(false);
  const [tileIndex, setTileIndex] = useState(-1);
  const [tiles, setTiles] = useState(undefined);

  const dataCollection = firebase.firestore().collection('maps').doc(props.map).collection('data');
  const imagesDoc = dataCollection.doc('images');
  const [imagesData] = useDocumentData(imagesDoc);
  const mapDoc = dataCollection.doc('map');
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
            if (tiles[index]) {
              ctx.drawImage(tiles[index], x * gridPixels, y * gridPixels, gridPixels, gridPixels);
            }
          }
        }
      }
    }
    // update tile data
    tileData = mapTiles;
    setLoaded(true);
  }

  // recursive flood fill
  function fillTile(index, replaceType) {
    // return if not correct replace type
    if (tileData[index] !== replaceType) return;
    // fill tile
    const fillX = index % gridSize;
    const fillY = Math.floor(index / gridSize);
    if (tileIndex === -1) clearTile(fillX, fillY);
    else ctx.drawImage(tiles[tileIndex], fillX * gridPixels, fillY * gridPixels, gridPixels, gridPixels);
    setTileData(index, tileIndex);
    // recurse on surrounding tiles
    if (index - gridSize > 0) fillTile(index - gridSize, replaceType); // above
    if (index + gridSize < tileData.length) fillTile(index + gridSize, replaceType); // below
    if (index % gridSize !== gridSize - 1) fillTile(index + 1, replaceType); // right
    if (index % gridSize !== 0) fillTile(index - 1, replaceType); // left
  }

  // sketches tiles to the canvas
  async function sketch(mode, e) {
    // start drawing if mouse down
    if (mode === 'down') drawing = true;
    // if mouse moving
    else if (mode === 'move') {
      // return if not drawing or filling
       if (!drawing || fill) return;
    }

    // get current mouse position
    let mouseX = e.clientX - canvas.offsetLeft + window.scrollX;
    let mouseY = e.clientY - canvas.offsetTop + window.scrollY;

    // round mouse position to nearest gridpoint
    const gridX = Math.floor(mouseX / gridPixels);
    const gridY = Math.floor(mouseY / gridPixels);

    // if moving and same grid square as last, return
    if (mode === 'move' && gridX === lastX && gridY === lastY) return;

    // if filling, start fill
    if (fill) {
      const index = gridY * gridSize + gridX;
      const clickedTile = tileData[index];
      // if selected tile same as clicked, return
      if (tileIndex === clickedTile) return;
      fillTile(index, clickedTile);
      return;
    }

    // update last position
    lastX = gridX;
    lastY = gridY;

    // clear tile
    if (tileIndex === -1) clearTile(gridX, gridY);
    // draw if tile exists
    else if (tiles[tileIndex]) {
      ctx.drawImage(tiles[tileIndex], gridX * gridPixels, gridY * gridPixels, gridPixels, gridPixels);
      // update tile data
      const index = gridY * gridSize + gridX;
      setTileData(index, tileIndex);
    }
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
    const indexes = [];
    for (let char of mapData.tiles) {
      if (char === '-') indexes.push(-1);
      else indexes.push(parseInt(char));
    }
    const tilesJson = { tiles: indexes };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(tilesJson));
    // download from link element
    const link = document.createElement('a');
    link.download = 'map.json';
    link.href = dataStr;
    link.click();
  }

  // uploads given json as map data
  function uploadJSON(file) {
    // read file as text
    const reader = new FileReader();
    reader.readAsText(file);
    // when reader loads file
    reader.onload = e => {
      // parse as json
      const text = e.target.result;
      const json = JSON.parse(text);
      // if valid json
      if (json && json.tiles) {
        // read tile data
        let newTileData = '';
        for (const index of json.tiles) {
          if (index === -1) newTileData += '-';
          else newTileData += index.toString();
        }
        // update tile data in firebase
        mapDoc.update({
          tiles: newTileData
        });
      }
    }
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

  function keyDown(e) {
    const kc = e.keyCode;
    if (kc === 189 || kc === 192) setTileIndex(-1);
    else if (kc === 48) setTileIndex(9);
    else if (kc > 48 && kc < 58) setTileIndex(kc - 49);
    else if (kc === 70) setFill(!isFill);
  }

  // on start
  useEffect(() => {
    // get canvas and context
    canvas = canvasRef.current;
    ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    // add keydown listener
    document.addEventListener('keydown', keyDown);
    return () => document.removeEventListener('keydown', keyDown);
  }, []);

  useEffect(() => isFill = fill, [fill]);

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
      {!loaded && <p className="loading-text">Loading canvas...</p>}
      {
        loaded &&
        <Toolbar
          map={props.map}
          fill={fill}
          setFill={setFill}
          downloadPNG={downloadPNG}
          downloadJSON={downloadJSON}
          uploadJSON={uploadJSON}
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
          map={props.map}
          dataCollection={dataCollection}
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
