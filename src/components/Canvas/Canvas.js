import React, { useRef } from 'react';

import './Canvas.css';

const width = 512;
const height = 512;

let canvas;
let ctx;

function Canvas() {
  const canvasRef = useRef();

  // get canvas and context on start
  useEffect(() => {
    canvas = canvasRef.current;
    ctx = canvas.getContext('2d');
  }, []);

  return (
    <div className="Canvas">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onMouseDown={e => drawTile(e)}
      />
    </div>
  );
}

export default Canvas;
