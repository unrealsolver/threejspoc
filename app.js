// World to screen pos
// :ptype worldPos: Vector3
// :ptype cam: Camera
// :ptype screenSize: Vector2
const w2s = function(worldPos, cam, screenSize) {
  const vec = worldPos.clone().project(cam)
  vec.x = (vec.x + 1) / 2 * screenSize.x
  vec.y = (vec.y - 1) / 2 * screenSize.y
  return vec
}

const RESOLUTION = new THREE.Vector2(window.innerWidth, window.innerHeight)
const scene = new THREE.Scene();
const sceneHud = new THREE.Scene()
scene.background = new THREE.Color(0x77B5FE)
const cam = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  1,
  20000
);

const camHud   = new THREE.OrthographicCamera(
  RESOLUTION.x / -2,
  RESOLUTION.x / 2,
  RESOLUTION.y / 2,
  RESOLUTION.y / -2,
  -1000,
  1000
)


const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

const worldWidth = 256,
  worldDepth = 256,
  worldHalfWidth = worldWidth / 2,
  worldHalfDepth = worldDepth / 2;
const geometry = new THREE.PlaneBufferGeometry(
  7500,
  7500,
  worldWidth - 1,
  worldDepth - 1
);
geometry.rotateX(-Math.PI / 2);
const vertices = geometry.attributes.position.array;
const data = generateHeight(worldWidth, worldDepth);
for (var i = 0, j = 0, l = vertices.length; i < l; i++, j += 3) {
  vertices[j + 1] = data[i] * 10;
}
const texture = new THREE.TextureLoader().load("mapimg.png");

const material = new THREE.MeshBasicMaterial({ color: 0xdddddd, map: texture });
material.wireframe = true;
material.wireframeLinewidth = 3;

const mesh = new THREE.Mesh(geometry, material);
mesh.position.y += 750
mesh.name = 'Terrain'

// -- WELL TOP CONE --
const wellTop = new THREE.Mesh(
  new THREE.ConeBufferGeometry(240, 400, 4),
  new THREE.MeshBasicMaterial({color: 0xEE8800})
)
wellTop.name = 'Well'
wellTop.position.y = 2000
scene.add(wellTop)

// -- CAMERA SPACE OBJECTS --
const TOOLTIP_COLOR = 0xFFFFFF
const objMat = new THREE.MeshBasicMaterial({color: TOOLTIP_COLOR})
objMat.depthTest = false
const obj = new THREE.Mesh(
  new THREE.CircleGeometry(4, 9),
  objMat
)

const TOOLTIP_LEN = 100
const tooltipLineMat = new THREE.LineBasicMaterial({color: TOOLTIP_COLOR, linewidth: 2})
const tooltipLineGeom = new THREE.Geometry()
tooltipLineGeom.vertices.push(new THREE.Vector3(0, 0, 0))
tooltipLineGeom.vertices.push(new THREE.Vector3(100, 100, 0))
tooltipLineGeom.vertices.push(new THREE.Vector3(150, 100, 0))
const tooltipLine = new THREE.Line(tooltipLineGeom, tooltipLineMat)

let textGeom = new THREE.BufferGeometry()
const textEl = document.getElementById('text')

camHud.position.z = 10
sceneHud.add(obj)

const curves = [
  new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 2000, 0),
    new THREE.Vector3(0, -2000, 0),
    new THREE.Vector3(2000, -2000, 0)
  ]),

  new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 2000, 0),
    new THREE.Vector3(0, -2000, 100),
    new THREE.Vector3(2000, -2000, 500)
  ]),

  new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 2000, 0),
    new THREE.Vector3(0, -2000, -100),
    new THREE.Vector3(2000, -2000, -500)
  ])
];

const curveMat = new THREE.LineBasicMaterial({color: 0xDD5533, linewidth: 4})
const curvePoints = curves.map((d) => d.getPoints(20))
const curveGeoms = curvePoints.map(d =>
  new THREE.BufferGeometry().setFromPoints(d)
)
const curveObjs = curveGeoms.map((d) => new THREE.Line(d, curveMat.clone()))
curveObjs[0].name = 'Well A'
curveObjs[1].name = 'Well B'
curveObjs[2].name = 'Well C'

const raycaster = new THREE.Raycaster()
raycaster.linePrecision = 100
const mouse = new THREE.Vector2()

function onMouseMove(ev) {
  mouse.x = (ev.clientX / window.innerWidth) * 2 - 1
  mouse.y = -(ev.clientY / window.innerHeight) * 2 + 1
}

curveObjs.map(d => scene.add(d));
scene.add(mesh);
cam.position.z = 5000;
cam.position.y = 5000;
cam.position.x = 8000

curveObjs.map((d) => scene.add(d))
console.log(scene)
scene.add(mesh)

let controls = new THREE.OrbitControls(cam);
controls.update();

function onClick() {
  if (intersects.length && active != intersects[0].object) {
    if (active) active.material.color.set(active.currentColor)
    active = intersects[0].object
    active.currentColor = active.material.color.getHex()
    active.material.color.set(0x00CC22)
    displayTooltip(active)
  } else {
    if (active) active.material.color.set(active.currentColor)
    active = undefined
    hideTooltip()
  }
}

function displayTooltip(target) {
  sceneHud.add(tooltipLine)
  sceneHud.add(obj)
  textEl.style.display = 'initial'
  textEl.innerHTML = target.name
}

function hideTooltip() {
  sceneHud.remove(tooltipLine)
  sceneHud.remove(obj)
  textEl.style.display = 'none'
}

function generateHeight(width, height) {
  var size = width * height,
    data = new Uint8Array(size),
    perlin = new ImprovedNoise(),
    quality = 1,
    z = Math.random() * 100;
  for (var j = 0; j < 4; j++) {
    for (var i = 0; i < size; i++) {
      var x = i % width,
        y = ~~(i / width);
      data[i] += Math.abs(
        perlin.noise(x / quality, y / quality, z) * quality * 1.75
      );
    }
    quality *= 5;
  }
  return data;
}

hideTooltip()
renderer.autoClear = false

let cnt = 0;
let intersects;
let active;
let pos
let vec = new THREE.Vector3()

function tick() {
  raycaster.setFromCamera(mouse, cam);
  if (active) {
    pos = w2s(active.position, cam, RESOLUTION)
    obj.position.x = pos.x - RESOLUTION.x / 2
    obj.position.y = pos.y + RESOLUTION.y / 2

    // Fixes weird WebGL/OpenGL behavior, when the entire geometry doesn't get displayed
    // Probably, due to large values at verticies (either frustumming, camera optimization, etc)
    vec.x = Math.max(-RESOLUTION.x / 2, Math.min(obj.position.x, RESOLUTION.x / 2))
    vec.y = Math.max(-RESOLUTION.y / 2, Math.min(obj.position.y, RESOLUTION.y / 2))
    tooltipLine.geometry.vertices[0].x = vec.x
    tooltipLine.geometry.vertices[0].y = vec.y
    tooltipLine.geometry.vertices[1].x = vec.x + 100
    tooltipLine.geometry.vertices[1].y = vec.y + 100
    tooltipLine.geometry.vertices[2].x = vec.x + 150
    tooltipLine.geometry.vertices[2].y = vec.y + 100
    tooltipLine.geometry.verticesNeedUpdate = true
    textEl.style.left = obj.position.x + 103 + RESOLUTION.x / 2 + 'px'
    textEl.style.top  = -obj.position.y - 123 + RESOLUTION.y / 2 + 'px'
  }
  if (cnt++ % 60 == 0) {
    //console.log(tooltipLine.geometry.vertices[0])
  }
  intersects = raycaster.intersectObjects(scene.children);

  requestAnimationFrame(tick);
  controls.update();
  renderer.clear()
  renderer.render(scene, cam)
  renderer.render(sceneHud, camHud)
}

window.addEventListener("mousemove", onMouseMove, false);
window.addEventListener('click', onClick, false)
tick();
