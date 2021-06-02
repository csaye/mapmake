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
    </div>
  );
}

export default Toolbar;
