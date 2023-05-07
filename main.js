// Functions
// Create initial tessaract
function createHypercube(length) {
  const vertices = [];
  const numVertices = Math.pow(2, length);
  for (let i = 0; i < numVertices; i++) {
    const vertex = [];
    for (let j = 0; j < length; j++) {
      vertex.push(i & Math.pow(2, j) ? 1 : -1);
    }
    vertices.push(vertex);
  }

  const edges = [];
  for (let i = 0; i < numVertices; i++) {
    for (let j = i + 1; j < numVertices; j++) {
      let numDiffs = 0;
      for (let k = 0; k < length; k++) {
        if (vertices[i][k] !== vertices[j][k]) {
          numDiffs++;
        }
      }
      // only connect adjacent vertices
      if (numDiffs === 1) {
        edges.push([i, j]);
      }
    }
  }

  let vertices_4d = vertices.map((point) => {
    const [x, y, z, w] = point;
    return new THREE.Vector4(x, y, z, w);
  });

  const planes = [];
  for (let i = 0; i < length; i++) {
    for (let j = 0; j < numVertices; j++) {
      let plane = [];
      let constant = 0;
      for (let k = 0; k < length; k++) {
        let coeff = 0;
        if (k === i) {
          coeff = -1;
        } else if (vertices[j][k] === 1) {
          coeff = 1;
        }
        plane.push(coeff);
        constant += coeff * vertices[j][k];
      }
      planes.push([plane, constant]);
    }
  }

  return { vertices_4d, edges, planes };
}

function createPerspectiveMatrix(fov, aspectRatio, near, far) {
  const f = 1.0 / Math.tan(fov * 0.5);
  const nf = 1.0 / (near - far);
  const projectionMatrix = new THREE.Matrix4().set(
    f / aspectRatio,
    0,
    0,
    0,
    0,
    f,
    0,
    0,
    0,
    0,
    (far + near) * nf,
    -1,
    0,
    0,
    2 * far * near * nf,
    0
  );
  return projectionMatrix;
}

// gets the rotattion matrices for rotation along xw, yw, zw planes
function rotateXW(angle) {
  const mat = new THREE.Matrix4();
  mat.set(
    Math.cos(angle),
    0,
    0,
    -Math.sin(angle),
    0,
    1,
    0,
    0,
    0,
    0,
    1,
    0,
    Math.sin(angle),
    0,
    0,
    Math.cos(angle)
  );
  return mat;
}

function rotateYW(angle) {
  const mat = new THREE.Matrix4();
  mat.set(
    1,
    0,
    0,
    0,
    0,
    Math.cos(angle),
    0,
    Math.sin(angle),
    0,
    0,
    1,
    0,
    0,
    -Math.sin(angle),
    0,
    Math.cos(angle)
  );
  return mat;
}

function rotateZW(angle) {
  const mat = new THREE.Matrix4();
  mat.set(
    1,
    0,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    0,
    Math.cos(angle),
    -Math.sin(angle),
    0,
    0,
    Math.sin(angle),
    Math.cos(angle)
  );
  return mat;
}

// w is the position of the point
function project(w) {
  const lw = 1.5; // light source
  const mat = new THREE.Matrix4();
  mat.set(
    1 / (lw - w),
    0,
    0,
    0,
    0,
    1 / (lw - w),
    0,
    0,
    0,
    0,
    1 / (lw - w),
    0,
    0,
    0,
    0,
    0
  );
  return mat;
}

function project4Dto3D(vertices_4d, projectionMatrix) {
    const vertices_3d = [];
    for (const vertex of vertices_4d) {
      const projectedVertex = vertex.clone().applyMatrix4(projectionMatrix);
      const perspective = 1;
      vertices_3d.push([
        projectedVertex.x * perspective,
        projectedVertex.y * perspective,
        projectedVertex.z * perspective,
      ]);
    }
    return vertices_3d;
  }

function getPosition(vertices_3d, edges) {
    const positions = new Float32Array(2 * 3 * edges.length);
    for (let i = 0; i < edges.length; ++i) {
    const a = edges[i][0];
    const b = edges[i][1];
    //   console.log(vertices_3d[a], vertices_3d[b]);
    positions.set(vertices_3d[a], 6 * i);
    positions.set(vertices_3d[b], 6 * i + 3);
    }
    return positions;
}

function rotate(angle_xw, angle_yw, angle_zw) {
    // rotate xw, yw, zw
    const matrix_xw = rotateXW(angle_xw);
    const matrix_yw = rotateYW(angle_yw);
    const matrix_zw = rotateZW(angle_zw);
    const matrix = new THREE.Matrix4()
      .multiply(matrix_xw)
      .multiply(matrix_yw)
      .multiply(matrix_zw);
    return matrix;
  }

  // mouse movement
  function onMouseMove(event) {
    mouseX = -(event.clientX / window.innerWidth) * 2 + 1;
    mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
  }

// Setup

// Camera: Perspective
const scene = new THREE.Scene();
const near = 0.1;
const far = 1000;
const fov = 75;
const aspectRatio = window.innerWidth / window.innerHeight;
const camera = new THREE.PerspectiveCamera(fov, aspectRatio, near, far);
camera.position.z = 10;

// Configures
let speed = 0.01;
let mouseX = 0;
let mouseY = 0;

// Create initial tessaract
let { vertices_4d, edges, planes} = createHypercube(4);
let projectionMatrix = createPerspectiveMatrix(90, 1, near, far);
let vertices_3d = project4Dto3D(vertices_4d, projectionMatrix);

// Render
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);
const geometry = new THREE.BufferGeometry();
const positions = getPosition(vertices_3d, edges);
geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

// Color
const material = new THREE.LineBasicMaterial({ color: 0xffffff });
const tesseract = new THREE.LineSegments(geometry, material);


// Animation
const animate = function () {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
};



// Update
function update() {
  const angle_x = Math.PI * mouseX * speed;
  const angle_y = Math.PI * mouseY * speed;
  const angle_z = 0.01;
  const matrix = rotate(angle_x, angle_y, angle_z);

  // Apply matrix directly to vertices_4d
  for (let i = 0; i < vertices_4d.length; i++) {
    vertices_4d[i].applyMatrix4(matrix);
  }

  // Project vertices_4d to vertices_3d
  vertices_3d = project4Dto3D(vertices_4d, project(1));

  // Update positions of vertices in the geometry
  for (let i = 0; i < edges.length; ++i) {
    const a = edges[i][0];
    const b = edges[i][1];
    positions.set(vertices_3d[a], 6 * i);
    positions.set(vertices_3d[b], 6 * i + 3);
  }

  // Mark the attribute as needing an update
  geometry.getAttribute("position").needsUpdate = true;

  //   geometry.applyMatrix4(matrix);
  camera.lookAt(scene.position);
  requestAnimationFrame(update);
}


// Begin
scene.add(tesseract);
document.addEventListener("mousemove", onMouseMove, false);
animate();
update();

