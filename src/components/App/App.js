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

  return (
    <div className="App">
      {
        firebase.auth().currentUser ?
        <Select /> :
        <Auth />
      }
    </div>
  );
}

export default App;
