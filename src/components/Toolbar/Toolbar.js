import GetAppIcon from '@material-ui/icons/GetApp';
import ImageIcon from '@material-ui/icons/Image';
import DescriptionIcon from '@material-ui/icons/Description';

import './Toolbar.css';

function Toolbar(props) {
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
    </div>
  );
}

export default Toolbar;
