import Canvas from '../Canvas/Canvas.js';

import firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/storage';

import { firebaseConfig } from '../../util/firebaseConfig.js';

import './App.css';

firebase.initializeApp(firebaseConfig);

function App() {
  return (
    <div className="App">
      <Canvas />
    </div>
  );
}

export default App;
