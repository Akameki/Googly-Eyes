const detectionOptions = {
  withLandmarks: true,
  withDescriptors: false,
};

const avg = (arr) => arr.reduce((prev, curr) => prev + curr, 0) / arr.length;

const faceapi = ml5.faceApi(detectionOptions, modelLoaded);

function modelLoaded() {
  console.log('Model Loaded!');
  document.querySelectorAll('img').forEach(i => {
    // get absolute position of image
    const { top, left } = cumulativeOffset(i);

    // create Image object
    img = new Image();
    img.crossOrigin = "anonymous";
    img.src = i.src;
    img.width = i.width;
    img.height = i.height;

    faceapi.detect(img, (err, results) => {
      // debugger;
      console.log("trying to detect a face(s)");
      if (err) {
        console.log("err", err);
      } else if (results.length) {
        const canvas = document.createElement("canvas");
        canvas.width = i.width;
        canvas.height = i.height;
        canvas.style.position = 'absolute';
        canvas.style.top = top + 'px';
        canvas.style.left = left + 'px';
        canvas.style.zIndex = '9999';
        document.body.appendChild(canvas);
        ctx = canvas.getContext("2d");
        // console.log(results);
        results.forEach(result => drawEyes(result.parts));
      }
    });
  });
}

function drawEyes({ leftEye, rightEye }) {
  // console.log("drawing some eyes");
  ctx.beginPath();
  ctx.lineWidth = 2
  ctx.strokeStyle = '#ff7755'
  leftEye.forEach((item, idx) => {
    if (idx === 0) {
      ctx.moveTo(item._x, item._y);
    } else {
      ctx.lineTo(item._x, item._y);
    }
  });
  ctx.closePath();
  ctx.stroke();

  ctx.beginPath();
  rightEye.forEach((item, idx) => {
    if (idx === 0) {
      ctx.moveTo(item._x, item._y)
    } else {
      ctx.lineTo(item._x, item._y)
    }
  });
  ctx.closePath();
  ctx.stroke();
}

function cumulativeOffset(element) {
  var top = 0, left = 0;
  do {
    top += element.offsetTop || 0;
    left += element.offsetLeft || 0;
    element = element.offsetParent;
  } while (element);

  return {
    top: top,
    left: left
  };
}