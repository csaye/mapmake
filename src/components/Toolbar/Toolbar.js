import React, { useState } from 'react';

import EditIcon from '@material-ui/icons/Edit';
import GetAppIcon from '@material-ui/icons/GetApp';
import ImageIcon from '@material-ui/icons/Image';
import DescriptionIcon from '@material-ui/icons/Description';
import PublishIcon from '@material-ui/icons/Publish';
import ExitToAppIcon from '@material-ui/icons/ExitToApp';

import Popup from 'reactjs-popup';

import { useCollectionData, useDocumentData } from 'react-firebase-hooks/firestore';

import firebase from 'firebase/app';

import './Toolbar.css';

function Toolbar(props) {
  const [error, setError] = useState('');
  const [mapName, setMapName] = useState('');

  const mapDoc = firebase.firestore().collection('maps').doc(props.map);
  const [mapData] = useDocumentData(mapDoc);

  // sets user current map to empty
  async function exitMap() {
    const uid = firebase.auth().currentUser.uid;
    const userDoc = firebase.firestore().collection('users').doc(uid);
    await userDoc.update({
      map: ''
    });
  }

  // updates current map
  async function updateMap() {
    const newMapName = mapName;
    setMapName('');
    await mapDoc.update({
      name: newMapName
    });
  }

  return (
    <div className="Toolbar">
      <div className="container">
        <ImageIcon />
        <button onClick={props.downloadPNG}>
          <GetAppIcon />
        </button>
      </div>
      <div className="container">
        <DescriptionIcon />
        <button onClick={props.downloadJSON}>
          <GetAppIcon />
        </button>
      </div>
      <div className="container">
        <DescriptionIcon />
        <label htmlFor="json-input">
          <PublishIcon />
        </label>
        <input
          id="json-input"
          className="file-input"
          type="file"
          accept="application/json"
          onChange={e => props.uploadJSON(e.target.files[0])}
        />
      </div>
      <div className="container">
        <p>Canvas Size: {props.canvasSize}px</p>
        <input
          type="range"
          min="128"
          max="1024"
          step="128"
          defaultValue="512"
          onChange={e => props.updateCanvasSize(e.target.value)}
        />
      </div>
      <div className="container">
        <p>Grid Size: {props.gridSize} tiles</p>
        <input
          type="range"
          min="4"
          max="7"
          step="1"
          value={Math.round(Math.log(props.gridSize) / Math.log(2))}
          onChange={e => props.updateGridSize(e.target.value)}
        />
      </div>
      <button onClick={() => exitMap()}>
        <ExitToAppIcon />
      </button>
      <Popup
        trigger={
          <button className="editmap-btn">
            <EditIcon />
          </button>
        }
        modal
      >
        {
          close => (
            <div className="modal">
              <button className="close" onClick={close}>&times;</button>
              <h1>Editing {mapData ? mapData.name : '...'}</h1>
              <form
                onSubmit={e => {
                  e.preventDefault();
                  updateMap();
                  close();
                }}
              >
                <input
                  placeholder="map name"
                  value={mapName}
                  onChange={e => setMapName(e.target.value)}
                  required
                />
                <button>Update Map</button>
              </form>
            </div>
          )
        }
      </Popup>
    </div>
  );
}

export default Toolbar;
