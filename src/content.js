
console.log('ml5 version:', ml5.version);

const eyeImg = new Image();
eyeImg.src = chrome.runtime.getURL("src/images/eye.png");
eyeImg.width = 50;
eyeImg.height = 50;
eyeImg.onload = () => console.log("eye image loaded");

const detectionOptions = {
  withLandmarks: true,
  withDescriptors: false,
};
const faceapi = ml5.faceApi(detectionOptions, modelLoaded);

function modelLoaded() {
  console.log('ml5 face model loaded!');
  // process images already on page
  document.querySelectorAll('img').forEach(detectAndDrawWhenVisible);

  // detect new images added to DOM
  const observer = new MutationObserver((mutations) => {
    mutations.filter(mut => mut.type === 'childList' && mut.addedNodes.length).forEach(mut => {
      // console.log("DOM changed, checking for new images");
      // console.log(mut.addedNodes);
      mut.addedNodes.forEach(node => {
        node.querySelectorAll('img').forEach(detectAndDrawWhenVisible);
      });
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });
}
    

// if image is visible, call detectAndDraw, otherwise watch for visibility
function detectAndDrawWhenVisible(img) {
  if (isVisible(img)) {
    detectAndDraw(img);
  } else {
    // add IntersectionObserver to draw when image comes into view, stop observing when image is drawn
    const intersectionObserverOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    }
    const observer = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          detectAndDraw(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, intersectionObserverOptions);
    observer.observe(img);
  }
}

// use ml5 to detect faces in image, and draw eyes
function detectAndDraw(img) {
  img.crossOrigin = "anonymous";
  faceapi.detect(img, (err, results) => {
    if (err) {
      console.log("[???] faceapi detect err", err);
    } else if (results.length) {
      console.log("faces detected!");
      // create a canvas directly over image, zindex one greater
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.style.position = 'absolute';
      canvas.style.top = img.offsetTop + 'px';
      canvas.style.left = img.offsetLeft + 'px';
      canvas.style.zIndex = img.style.zIndex + 1;
      img.parentNode.appendChild(canvas);
      // draw stuff.
      let ctx = canvas.getContext("2d");
      // ctx.lineWidth = 2;
      // ctx.strokeStyle = '#ff7755';
      // ctx.strokeRect(0, 0, img.width, img.height); // border image
      // outline eyes
      // results.forEach(result => {
      //   outline(ctx, result.parts.leftEye);
      //   outline(ctx, result.parts.rightEye);
      // });
      // put googly eye over each eye
      results.forEach(result => {
        draw(ctx, result.parts.leftEye, eyeImg);
        draw(ctx, result.parts.rightEye, eyeImg);
      });
    } else {
      console.log("no faces...");
    }
  });
}

// // creates an outline on a canvas given an array of point objects with .x and .y
// function outline(ctx, points) {
//   if (points.length < 2) return console.log("[???] points array too short");
//   ctx.beginPath();
//   ctx.moveTo(points[0].x, points[0].y);
//   for (let i = 1; i < points.length; i++) {
//     ctx.lineTo(points[i].x, points[i].y);
//   }
//   ctx.closePath();
//   ctx.stroke();
// }

// draw an image from file on a canvas in middle of array of points
function draw(ctx, points, img) {
  // find center and bounds of points
  let left = Infinity, right = -Infinity, top = Infinity, bottom = -Infinity;
  points.forEach(point => {
    left = Math.min(left, point.x);
    right = Math.max(right, point.x);
    top = Math.min(top, point.y);
    bottom = Math.max(bottom, point.y);
  });
  const midX = (left + right) / 2;
  const midY = (top + bottom) / 2;
  // scale image to fit 1.5x width
  const width = (right - left) * 1.5;
  const height = img.height * width / img.width;
  
  // draw scaled image, centered in middle of points
  ctx.drawImage(img, midX - width / 2, midY - height / 2, width, height);
}

// returns true if element is visible in viewport
function isVisible(elem) {
  const rect = elem.getBoundingClientRect();
  const viewHeight = Math.max(document.documentElement.clientHeight, window.innerHeight);
  return !(rect.bottom < 0 || rect.top - viewHeight >= 0);
}