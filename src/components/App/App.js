import React, { useEffect, useState } from 'react';

import Select from '../Select/Select.js';
import Auth from '../Auth/Auth.js';

import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';
import 'firebase/storage';

import { firebaseConfig } from '../../util/firebaseConfig.js';
import { useAuthState } from 'react-firebase-hooks/auth';

import './App.css';

firebase.initializeApp(firebaseConfig);

function App() {
  useAuthState(firebase.auth());

  const [loaded, setLoaded] = useState(false);

  // set loaded after auth initialization
  useEffect(() => {
    firebase.auth().onAuthStateChanged(() => {
      setLoaded(true);
    })
  }, []);

  return (
    <div className="App">
      {
        !loaded ?
        <p className="loading-text">Loading...</p> :
        firebase.auth().currentUser ?
        <Select /> :
        <Auth />
      }
    </div>
  );
}

export default App;
