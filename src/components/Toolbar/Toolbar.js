import React, { useState } from 'react';

import EditIcon from '@material-ui/icons/Edit';
import GetAppIcon from '@material-ui/icons/GetApp';
import ImageIcon from '@material-ui/icons/Image';
import DescriptionIcon from '@material-ui/icons/Description';
import PublishIcon from '@material-ui/icons/Publish';
import ExitToAppIcon from '@material-ui/icons/ExitToApp';
import FormatColorFillIcon from '@material-ui/icons/FormatColorFill';

import Popup from 'reactjs-popup';

import { useCollectionData, useDocumentData } from 'react-firebase-hooks/firestore';

import firebase from 'firebase/app';

import './Toolbar.css';

function Toolbar(props) {
  const [error, setError] = useState('');
  const [mapName, setMapName] = useState('');
  const [member, setMember] = useState('');

  const usernamesRef = firebase.firestore().collection('usernames');
  const [usernamesData] = useCollectionData(usernamesRef);

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

  // adds member to current map
  async function addMember() {
    const newMember = member;
    setMember('');
    // retrieve new member uid
    const matches = usernamesData.filter(user => user.username === newMember);
    if (matches.length === 0) {
      setError(`No user @${newMember} found`)
      setTimeout(() => setError(''), 2000);
      return;
    }
    const memberUid = matches[0].uid;
    // update document in firebase
    await mapDoc.update({
      users: firebase.firestore.FieldValue.arrayUnion(memberUid)
    });
  }

  // returns username for user with given uid
  function getUsername(userId) {
    if (!usernamesData) return null;
    const matches = usernamesData.filter(user => user.uid === userId);
    return matches.length === 0 ? null : matches[0].username;
  }

  return (
    <div className="Toolbar">
      <div className="container">
        <p>Fill</p>
        <input
          checked={props.fill}
          onChange={e => props.setFill(e.target.checked)}
          type="checkbox"
        />
        <FormatColorFillIcon />
      </div>
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
        <p>Canvas: {props.canvasSize}px</p>
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
        <p>Grid: {props.gridSize} tiles</p>
        <input
          type="range"
          min="4"
          max="8"
          step="1"
          value={Math.round(Math.log(props.gridSize) / Math.log(2))}
          onChange={e => props.updateGridSize(e.target.value)}
        />
      </div>
      <Popup
        trigger={
          <button className="editmap-btn">
            <EditIcon />
          </button>
        }
        onOpen={() => {
          if (mapData) setMapName(mapData.name);
        }}
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
              <form style={{marginTop: '5px'}} onSubmit={e => {
                e.preventDefault();
                addMember();
              }}>
                <input
                  placeholder="username"
                  value={member}
                  onChange={e => setMember(e.target.value)}
                  required
                />
                <button>Add Member</button>
              </form>
              {error && <p style={{margin: '10px 0 0 0', color: 'red'}}>{error}</p>}
              <p style={{margin: '10px 0'}}><u>Members</u></p>
              {
                mapData &&
                <p style={{margin: '0'}}>
                  {mapData.users.map(u => getUsername(u)).join(', ')}
                </p>
              }
            </div>
          )
        }
      </Popup>
      <button onClick={() => exitMap()}>
        <ExitToAppIcon />
      </button>
    </div>
  );
}

export default Toolbar;
