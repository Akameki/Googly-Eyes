// console.log('ml5 version:', ml5.version);

const eyes = {
  eye1: new Image(),
  eye2: new Image(),
  eye3: new Image()
};
Object.keys(eyes).forEach((eye, index) => {
  eyes[eye].src = chrome.runtime.getURL(`src/images/${eye}.png`);
  // eyes[eye].onload = () => console.log(`${eye} image loaded`);
});

let currentEye = 'eye1';

// const faceapi = ml5.faceMesh({ withLandmarks: true, withDescriptors: false }, onModelLoaded);
const faceapi = ml5.faceMesh({ maxFaces: 20 }, onModelLoaded);

let enabled = false;
const imageOverlays = []; // [ { canvas, context, eyeLocations } ]
const queue = [];

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.eye === 'none') {
    enabled = false;
    imageOverlays.forEach(overlayObj => overlayObj.canvas.style.display = 'none');
    chrome.runtime.sendMessage({action: "badgeOff"});
  } else if (['eye1', 'eye2', 'eye3'].includes(request.eye)) {
    currentEye = request.eye;
    enabled = true;
    // redraw
    imageOverlays.forEach(overlayObj => {
      overlayObj.context.clearRect(0, 0, overlayObj.canvas.width, overlayObj.canvas.height);
      draw(overlayObj.context, overlayObj.eyeLocations);
      overlayObj.canvas.style.display = 'block';
    });
    for (i of queue) {
      watchVisbility(queue.shift());
    }
    chrome.runtime.sendMessage({action: "badgeOn"});
  }
});

function onModelLoaded() {
  console.log('ml5 face model loaded! (ml5 version' + ml5.version +')');
  // process images already on page
  document.querySelectorAll('img').forEach(watchVisbility);

  // detect changes to DOM and process new img tags
  const observer = new MutationObserver((mutations) => {
    mutations.filter(mut => mut.type === 'childList' && mut.addedNodes.length).forEach(mut => {
      mut.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          node.querySelectorAll('img').forEach(watchVisbility);
        }
      });
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });
}
    
// if image is visible, call detectAndDraw, otherwise watch for visibility with IntersectionObserver to call detectAndDraw
async function watchVisbility(img) {
  if (img.width < 50 || img.height < 50) {
    return;
  }
  const intersectionObserverOptions = { root: null, rootMargin: '30px', threshold: 0.0 }
  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { // visible?
        observer.unobserve(entry.target);
        detectAndDraw(entry.target);
      }
    });
  }, intersectionObserverOptions);
  observer.observe(img);
}

async function detectAndDraw(img) {
  if (!enabled) {
    queue.push(img); // try again when enabled...
    return;
  }
  img.crossOrigin = "anonymous";

  faceapi.detect(img, (results, err) => {
    if (err) {
      console.log("[???] faceapi detect err", err);
    } else if (results.length) {
      // console.log("faces detected!");
      // create a canvas directly over image, zindex one greater
      const canvas = document.createElement("canvas");
      if (!enabled) canvas.style.display = 'none';
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.style.position = 'absolute';
      canvas.style.top = img.offsetTop + 'px';
      canvas.style.left = img.offsetLeft + 'px';
      canvas.style.zIndex = img.style.zIndex + 1;

      img.parentNode.appendChild(canvas);
      // draw stuff.
      let context = canvas.getContext("2d");
      const eyeLocations = [];
      results.forEach(result => {
        eyeLocations.push( {left: result.leftEye.x, width: result.leftEye.width, midY: result.leftEye.centerY} );
        eyeLocations.push( {left: result.rightEye.x, width: result.rightEye.width, midY: result.rightEye.centerY} );
      });

      imageOverlays.push({ canvas, context, eyeLocations });
      draw(context, eyeLocations);
    } else {
      // console.log("no faces...");
      // put red outline around image
      // img.style.outline = "20px solid red";
    }
  });
}

function draw(ctx, eyeLocations) {
  for (let { left, midY, width } of eyeLocations) {
    width *= 2.0;
    // scale height to maintain aspect ratio
    const height = eyes[currentEye].height * width / eyes[currentEye].width;
    ctx.drawImage(eyes[currentEye], left, midY - height / 2, width, height);
  }
}