import LayersClearIcon from '@material-ui/icons/LayersClear';
import DeleteIcon from '@material-ui/icons/Delete';
import PublishIcon from '@material-ui/icons/Publish';
import ClearIcon from '@material-ui/icons/Clear';

import firebase from 'firebase/app';

import './Tilebar.css';

function Tilebar(props) {
  async function uploadTileImage(index, file) {
    if (!file) return;
    // put file into storage
    await firebase.storage().ref(`${props.map}/tile${index}`).put(file).then(snapshot => {
      // update tile url in firestore
      snapshot.ref.getDownloadURL().then(url => {
        const imagesRef = props.dataCollection.doc('images');
        imagesRef.update({
          [`tile${index}`]: url
        });
      });
    });
  }

  return (
    <div className="Tilebar">
      <div className="tile-select">
        <div className="tile-display">
          <button
            className={props.tileIndex === -1 ? 'tile-btn selected' : 'tile-btn'}
            onClick={() => props.setTileIndex(-1)}
          >
            <LayersClearIcon />
          </button>
          <button className="delete-btn" onClick={props.clearTiles}>
            <DeleteIcon />
          </button>
        </div>
        {
          props.tiles &&
          props.tiles.map((tile, i) =>
            <div className="tile-display" key={`tileform-${i}`}>
              <button
                type="button"
                className={props.tileIndex === i ? 'tile-btn selected' : 'tile-btn'}
                onClick={() => props.setTileIndex(i)}
              >
                {
                  tile ?
                  <img src={tile.src} alt="" /> :
                  <ClearIcon />
                }
              </button>
              <label htmlFor={`tileinput-${i}`}>
                <PublishIcon />
              </label>
              <input
                id={`tileinput-${i}`}
                type="file"
                accept="image/*"
                className="file-input"
                onChange={e => uploadTileImage(i, e.target.files[0])}
                required
              />
            </div>
          )
        }
      </div>
    </div>
  );
}

export default Tilebar;
