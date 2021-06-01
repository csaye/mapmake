import React, { useState } from 'react';

import firebase from 'firebase/app';

import './Toolbar.css';

function Toolbar() {
  const [file, setFile] = useState(undefined);

  async function uploadFile(e) {
    e.preventDefault();
    if (!file) return;

    await firebase.storage().ref('tiles/tile').put(file).then(snapshot => {
      snapshot.ref.getDownloadURL().then(url => {
        firebase.firestore().collection('maps').doc('map').update({
          tileURL: url
        });
      });
    });
  }

  return (
    <div className="Toolbar">
      <div className="tile-select">
        <form onSubmit={uploadFile}>
          <input
            type="file"
            onChange={e => setFile(e.target.files[0])}
            required
          />
          <button type="submit">Upload</button>
        </form>
      </div>
    </div>
  );
}

export default Toolbar;
