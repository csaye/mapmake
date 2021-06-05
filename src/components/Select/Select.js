import React, { useEffect, useState } from 'react';

import Canvas from '../Canvas/Canvas.js';
import ExitToAppIcon from '@material-ui/icons/ExitToApp';

import firebase from 'firebase/app';

import { useCollectionData, useDocumentData } from 'react-firebase-hooks/firestore';

import './Select.css';

function Select() {
  const [mapName, setMapName] = useState('');

  const uid = firebase.auth().currentUser.uid;
  const mapsRef = firebase.firestore().collection('maps');
  const mapsQuery = mapsRef.where('users', 'array-contains', uid).orderBy('name');
  const [maps] = useCollectionData(mapsQuery, { idField: 'id' });

  const usersRef = firebase.firestore().collection('users');
  const userDoc = usersRef.doc(uid);
  const [userData] = useDocumentData(userDoc);

  async function selectMap(map) {
    await userDoc.update({
      map: map.id
    });
  }

  async function createMap(e) {
    e.preventDefault();
    await mapsRef.add({
      name: mapName,
      users: [uid]
    }).then(doc => {
      const dataCollection = doc.collection('data');
      dataCollection.doc('map').set({
        tiles: '-'.repeat(32 * 32)
      });
      dataCollection.doc('images').set({
        tile0: '',
        tile1: '',
        tile2: '',
        tile3: '',
        tile4: '',
        tile5: '',
        tile6: '',
        tile7: '',
        tile8: '',
        tile9: ''
      });
      userDoc.update({
        map: doc.id
      });
    });
  }

  async function checkUserMap() {
    // if user map invalid, set to none
    if (userData.map && !maps.some(map => map.id === userData.map)) {
      await userDoc.update({
        map: ''
      });
    }
  }

  useEffect(() => {
    if (userData) checkUserMap();
  }, [userData]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!userData) return <p className="loading-text">Loading maps...</p>;
  if (userData.map) return <Canvas map={userData.map} />;
  if (!maps) return <p className="loading-text">Loading maps...</p>;

  return (
    <div className="Select">
      {
        maps.map((m, i) =>
          <button key={`selectmap-${i}`} onClick={() => selectMap(m)}>
            {m.name}
          </button>
        )
      }
      <form onSubmit={createMap}>
        <input
          value={mapName}
          onChange={e => setMapName(e.target.value)}
          required
        />
        <button>Create Map</button>
      </form>
      <button
        className="signout-btn"
        onClick={() => firebase.auth().signOut()}
      >
        <ExitToAppIcon />
      </button>
    </div>
  );
}

export default Select;
