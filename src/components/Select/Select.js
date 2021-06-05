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
      }
    </div>
  );
}

export default Select;
