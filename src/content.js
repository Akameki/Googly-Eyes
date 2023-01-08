
console.log('ml5 version:', ml5.version);

const eyeImg = new Image();
eyeImg.src = chrome.runtime.getURL("src/images/eye.png");
eyeImg.width = 50;
eyeImg.height = 50;
eyeImg.onload = () => console.log("eye image loaded");

const faceapi = ml5.faceApi({ withLandmarks: true, withDescriptors: false }, onModelLoaded);

let enabled = true;
const canvases = [];
const queue = []; // when disabled, queue up images to call detectAndDrawWhenVisible on when enabled

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  enabled = request.enabled;
  if (enabled) {
    canvases.forEach(canvas => canvas.style.display = 'block');
    queue.forEach(detectAndDrawWhenVisible);
  } else {
    canvases.forEach(canvas => canvas.style.display = 'none');
  }
});

function onModelLoaded() {
  console.log('ml5 face model loaded!');
  // process images already on page
  document.querySelectorAll('img').forEach(detectAndDrawWhenVisible);

  // detect changes to DOM and process new img tags
  const observer = new MutationObserver((mutations) => {
    mutations.filter(mut => mut.type === 'childList' && mut.addedNodes.length).forEach(mut => {
      mut.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          node.querySelectorAll('img').forEach(detectAndDrawWhenVisible);
        }
      });
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });
}
    
// if image is visible, call detectAndDraw, otherwise watch for visibility with IntersectionObserver to call detectAndDraw
async function detectAndDrawWhenVisible(img) {
  if (!enabled) {
    queue.push(img);
    return;
  } else {
    const intersectionObserverOptions = { root: null, rootMargin: '0px', threshold: 0.1 }
    const observer = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { // visible?
          detectAndDraw(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, intersectionObserverOptions);
    observer.observe(img);
  }
}

// use ml5 to detect faces in image, and draw eyes
async function detectAndDraw(img) {
  // ignore if too small
  if (img.width < 100 || img.height < 100) {
    return;
  } else if (!enabled) {
    queue.push(img); // try again when enabled...
    return;
  }
  img.crossOrigin = "anonymous";

  faceapi.detect(img, (err, results) => {
    if (err) {
      console.log("[???] faceapi detect err", err);
    } else if (results.length) {
      console.log("faces detected!");
      // create a canvas directly over image, zindex one greater
      const canvas = document.createElement("canvas");
      if (!enabled) canvas.style.display = 'none';
      canvases.push(canvas);
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

/// creates an outline on a canvas given an array of point objects with .x and .y
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

/// returns true if element is visible in viewport
// function isVisible(elem) {
//   const rect = elem.getBoundingClientRect();
//   const viewHeight = Math.max(document.documentElement.clientHeight, window.innerHeight);
//   return !(rect.bottom < 0 || rect.top - viewHeight >= 0);
// }