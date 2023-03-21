// Variables for renderer, scene, camera, and HUD elements
let renderer, scene, camera;
let objects = [];

function createRandomObject() {
  const geometries = [
    new THREE.TorusGeometry(0.1, 0.03, 8, 32),
    new THREE.BoxGeometry(0.1, 0.1, 0.2),
    new THREE.ConeGeometry(0.1, 0.2, 8),
    new THREE.CylinderGeometry(0.03, 0.03, 0.2, 8),
  ];

  const palette = [
    0xe6c229, // Red
    0xf17105, // Green
    0xd11149, // Blue
    0x6610f2, // Yellow
    0x1a8fee, // Magenta
  ];

  const randomGeometry = geometries[Math.floor(Math.random() * geometries.length)];
  const color1 = new THREE.Color(palette[Math.floor(Math.random() * palette.length)]);
  const color2 = new THREE.Color(palette[Math.floor(Math.random() * palette.length)]);
  const t = Math.random(); // Range between 0 and 1
  const color = new THREE.Color().lerpColors(color1, color2, t);
  const material = new THREE.MeshPhongMaterial({ color: color });

  return new THREE.Mesh(randomGeometry, material);
}

let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
let clickedObject = null;
let clickTime = null;

function onMouseDown(event) {
  event.preventDefault();

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects(scene.children);

  if (intersects.length > 0) {
    const clickedObject = intersects[0].object;

    // Check if the clicked object is adjacent to any previously clicked objects
    const adjacentObjects = [];
    for (let i = 0; i < clickedObjects.length; i++) {
      const obj = clickedObjects[i];
      if (obj.position.distanceTo(clickedObject.position) < 0.3) {
        adjacentObjects.push(obj);
      }
    }

    // Remove adjacent objects from the scene, add them to clickedObjects, and apply scale factor
    if (adjacentObjects.length > 0) {
      for (let i = 0; i < adjacentObjects.length; i++) {
        const obj = adjacentObjects[i];
        clickedObjects.push(obj);
        const index = objects.flat().indexOf(obj);
        objects.flat().splice(index, 1);
        scene.remove(obj);

        let scaleFactor = obj.scale.x * 1.05; // Adjust this value to control the growth rate
        scaleFactor = Math.min(scaleFactor, MAX_SCALE); // Cap the scale factor to the maximum value
        obj.scale.set(scaleFactor, scaleFactor, scaleFactor);

        // Apply scale factor to all clicked objects
        for (let k = 0; k < clickedObjects.length; k++) {
          let clickedObj = clickedObjects[k];
          if (clickedObj.scale.x < MAX_SCALE) { // Check if the scale is below the maximum value
            let objScaleFactor = clickedObj.scale.x * 1.005; // Adjust this value to control the growth rate
            objScaleFactor = Math.min(objScaleFactor, MAX_SCALE); // Cap the scale factor to the maximum value
            clickedObj.scale.set(objScaleFactor, objScaleFactor, objScaleFactor);
          }
        }
      }
    } else { // If the clicked object is not adjacent to any previously clicked objects
      clickedObjects.push(clickedObject);
      let scaleFactor = clickedObject.scale.x * 1.05; // Adjust this value to control the growth rate
      scaleFactor = Math.min(scaleFactor, MAX_SCALE); // Cap the scale factor to the maximum value
      clickedObject.scale.set(scaleFactor, scaleFactor, scaleFactor);
    }

    clickTime = performance.now();
  }
}



function init() {
  // Set up renderer, scene, and camera
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
  scene = new THREE.Scene();

  // Use OrthographicCamera instead of PerspectiveCamera
  camera = new THREE.OrthographicCamera(
    window.innerWidth / -80,
    window.innerWidth / 80,
    window.innerHeight / 80,
    window.innerHeight / -80,
    0.1,
    1000
  );

  const gridSize = 32;
  const spacing = 0.2;

  for (let i = 0; i < gridSize; i++) {
    objects[i] = [];
    for (let j = 0; j < gridSize; j++) {
      const obj = createRandomObject();
      obj.position.set(i * spacing - gridSize * spacing * 0.5, j * spacing - gridSize * spacing * 0.5, 0);
      scene.add(obj);
      objects[i][j] = obj;
    }

  window.addEventListener("resize", onWindowResize, false);
  }


function zoomOrthographicCamera(camera, zoomFactor) {
  const zoom = 1 / zoomFactor;

  const newWidth = (camera.right - camera.left) * zoom;
  const newHeight = (camera.top - camera.bottom) * zoom;

  camera.left = -(newWidth / 2);
  camera.right = newWidth / 2;
  camera.top = newHeight / 2;
  camera.bottom = -(newHeight / 2);

  // Update the projection matrix after changing camera properties
  camera.updateProjectionMatrix();
}

  // Add a point light to the scene
  const pointLight = new THREE.PointLight(0xffffff, 1, 100);
  pointLight.position.set(5, 5, 5);
  scene.add(pointLight);

  camera.position.z = 20;
  zoomOrthographicCamera(camera, 3);

  window.addEventListener("mousedown", onMouseDown, false);
}

let clickedObjects = []; // New array to store clicked objects

function onMouseDown(event) {
  event.preventDefault();

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects(scene.children);

  if (intersects.length > 0) {
    const clickedObject = intersects[0].object;

    if (!clickedObjects.includes(clickedObject)) {
      clickedObjects.push(clickedObject);
      clickedObject.maxScale = 4 + Math.random() * 4; // Assign a random max scale between 4 and 8
      clickTime = performance.now();
    }
  }
}


function onWindowResize() {
  // Update camera aspect ratio and dimensions
  const aspectRatio = window.innerWidth / window.innerHeight;
  const camWidth = camera.right - camera.left;
  const camHeight = camWidth / aspectRatio;

  camera.left = -(camWidth / 2);
  camera.right = camWidth / 2;
  camera.top = camHeight / 2;
  camera.bottom = -(camHeight / 2);
  camera.updateProjectionMatrix();

  // Update renderer dimensions
  renderer.setSize(window.innerWidth, window.innerHeight);
}


function animate() {
  requestAnimationFrame(animate);

  // Animate HUD elements
  for (let i = 0; i < objects.length; i++) {
    for (let j = 0; j < objects[i].length; j++) {
      const obj = objects[i][j];
      if (obj) {
        obj.rotation.x += 0.01;
        obj.rotation.y += 0.01;
      }
    }
  }

  // Apply scale factor to the most recently clicked object
  if (clickedObjects.length > 0) {
    const mostRecentObj = clickedObjects[clickedObjects.length - 1];
    let scaleFactor = mostRecentObj.scale.x * 1.005;
    scaleFactor = Math.min(scaleFactor, mostRecentObj.maxScale); // Use the object's max scale
    mostRecentObj.scale.set(scaleFactor, scaleFactor, scaleFactor);

    // Absorb intersecting meshes
    const box1 = new THREE.Box3().setFromObject(mostRecentObj);
    for (let i = 0; i < objects.length; i++) {
      for (let j = 0; j < objects[i].length; j++) {
        const obj = objects[i][j];
        if (obj && !clickedObjects.includes(obj)) { // Only check objects that haven't been clicked
          const box2 = new THREE.Box3().setFromObject(obj);
          if (box1.intersectsBox(box2)) {
            scene.remove(obj);
            objects[i][j] = null;
          }
        }
      }
    }
  }

  // Render the scene
  renderer.render(scene, camera);
}



function animate() {
  const MAX_SCALE = 4; // Maximum scale value
  requestAnimationFrame(animate);

  // Animate HUD elements
  for (let i = 0; i < objects.length; i++) {
    for (let j = 0; j < objects[i].length; j++) {
      const obj = objects[i][j];
      if (obj) {
        obj.rotation.x += 0.01;
        obj.rotation.y += 0.01;
      }
    }
  }

  // Apply scale factor to the most recently clicked object
  if (clickedObjects.length > 0) {
    const mostRecentObj = clickedObjects[clickedObjects.length - 1];
    let scaleFactor = mostRecentObj.scale.x * 1.005;
    scaleFactor = Math.min(scaleFactor, MAX_SCALE);
    mostRecentObj.scale.set(scaleFactor, scaleFactor, scaleFactor);

    // Absorb intersecting meshes
    const box1 = new THREE.Box3().setFromObject(mostRecentObj);
    for (let i = 0; i < objects.length; i++) {
      for (let j = 0; j < objects[i].length; j++) {
        const obj = objects[i][j];
        if (obj && !clickedObjects.includes(obj)) { // Only check objects that haven't been clicked
          const box2 = new THREE.Box3().setFromObject(obj);
          if (box1.intersectsBox(box2)) {
            scene.remove(obj);
            objects[i][j] = null;
          }
        }
      }
    }
  }

  // Render the scene
  renderer.render(scene, camera);
}



init();
animate();