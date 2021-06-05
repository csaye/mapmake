import React, { useState } from 'react';

import Canvas from '../Canvas/Canvas.js';
import ExitToAppIcon from '@material-ui/icons/ExitToApp';

import firebase from 'firebase/app';

import { useCollectionData, useDocumentData } from 'react-firebase-hooks/firestore';

import './Select.css';

function Select() {
  const [mapName, setMapName] = useState('');

  const uid = firebase.auth().currentUser.uid;
  const mapsRef = firebase.firestore().collection('maps');
  const mapsQuery = mapsRef.where('users', 'array-contains', uid);//.orderBy('name');
  const [maps] = useCollectionData(mapsQuery, { idField: 'id' });

  const usersRef = firebase.firestore().collection('users');
  const userRef = usersRef.doc(uid);
  const [userData] = useDocumentData(userRef);

  async function selectMap(map) {
    await userRef.update({
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
    });
  }

  if (!userData) return (
    <div className="Select">
      <p>Loading...</p>
    </div>
  )

  return (
    <div className="Select">
      {
        userData.map ?
        <Canvas map={userData.map} /> :
        maps ?
        <>
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
        </> :
        <p>Loading...</p>
      }
    </div>
  );
}

export default Select;
