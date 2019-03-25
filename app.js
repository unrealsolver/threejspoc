const scene = new THREE.Scene()
scene.background = new THREE.Color(0x77B5FE)
const cam   = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, .1, 1000)
const renderer = new THREE.WebGLRenderer({antialias: true})
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

const geometry = new THREE.BufferGeometry()

// -- HEIGHTS --
const SIZE = 100
const heightmap = new Float32Array(SIZE * SIZE)
for (let ix = 0; ix < heightmap.length; ix++) {
  heightmap[ix] = Math.random()
}

// -- TERRAIN --
// subdivide level
const GRID_SIZE = 12
const offset = {x: 0, y: 0}

const terrain = new Float32Array(3 * GRID_SIZE * GRID_SIZE)
for (let ix = 0; ix < terrain.length; ix++) {
  comp = ix % 3
  terrain[ix] =
    comp == 0 ? Math.floor(ix / (3 * GRID_SIZE)) : // X comp
    comp == 1 ? Math.floor(ix / 3) % GRID_SIZE : // Y comp
    // 'Realistic' terrain
    Math.random() + Math.sin(3.14 * (Math.floor(ix / (3 * GRID_SIZE)) / GRID_SIZE))
}

// 2 triangles per plane, 3 dimensions per triangle
terrainVert = new Float32Array(2 * 3 * 3 * GRID_SIZE * GRID_SIZE)

k = 0
for (let i = 0; i < GRID_SIZE - 1; i++) {
  for (let j = 0; j < GRID_SIZE - 1; j++) {
    let v0offset = 3 * i * GRID_SIZE + j * 3
    terrainVert[k]     = terrain[v0offset]
    terrainVert[k + 1] = terrain[v0offset + 1]
    terrainVert[k + 2] = terrain[v0offset + 2]

    let v1offset = (3 * (i + 1)) * GRID_SIZE + j * 3
    terrainVert[k + 3] = terrain[v1offset]
    terrainVert[k + 4] = terrain[v1offset + 1]
    terrainVert[k + 5] = terrain[v1offset + 2]

    let v2offset = 3 * i * GRID_SIZE + ((j + 1) * 3)
    terrainVert[k + 6] = terrain[v2offset]
    terrainVert[k + 7] = terrain[v2offset + 1]
    terrainVert[k + 8] = terrain[v2offset + 2]

    let v3offset = 3 * (i + 1) * GRID_SIZE + ((j + 1) * 3)
    terrainVert[k + 9] = terrain[v3offset]
    terrainVert[k + 10] = terrain[v3offset + 1]
    terrainVert[k + 11] = terrain[v3offset + 2]

    terrainVert[k + 12] = terrain[v2offset]
    terrainVert[k + 13] = terrain[v2offset + 1]
    terrainVert[k + 14] = terrain[v2offset + 2]

    terrainVert[k + 15] = terrain[v1offset]
    terrainVert[k + 16] = terrain[v1offset + 1]
    terrainVert[k + 17] = terrain[v1offset + 2]

    k += 18
  }
}

const buf = new THREE.BufferAttribute( terrainVert, 3 )
buf.dynamic = true
geometry.addAttribute( 'position',  buf)

const texture = new THREE.TextureLoader().load('mapimg.png')

const material = new THREE.MeshBasicMaterial({color: 0xDDDDDD})
material.wireframe = true
material.wireframeLinewidth = 3

const mesh = new THREE.Mesh( geometry, material )

const curves = [
  new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 2, 0), 
    new THREE.Vector3(0, -2, 0), 
    new THREE.Vector3(2, -2, 0),
  ]),

  new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 2, 0),
    new THREE.Vector3(0, -2, .5),
    new THREE.Vector3(2, -2, .5),
  ]),

  new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 2, 0),
    new THREE.Vector3(0, -2, -.5),
    new THREE.Vector3(2, -2, -.5),
  ])
]

const curveMat = new THREE.LineBasicMaterial({color: 0xDD5533, linewidth: 4})
const curvePoints = curves.map((d) => d.getPoints(20))
const curveGeoms = curvePoints.map((d) => new THREE.BufferGeometry().setFromPoints(d))
const curveObjs = curveGeoms.map((d) => new THREE.Line(d, curveMat.clone()))


const raycaster = new THREE.Raycaster()
raycaster.linePrecision = .1
const mouse = new THREE.Vector2()

function onMouseMove(ev) {
  mouse.x =  (ev.clientX / window.innerWidth)  * 2 - 1
  mouse.y = -(ev.clientY / window.innerHeight) * 2 + 1
}


curveObjs.map((d) => scene.add(d))
scene.add(mesh)
cam.position.z = 5
cam.position.y = 1

mesh.rotation.x = -Math.PI / 2
mesh.position.x = -(GRID_SIZE - 1) / 2
mesh.position.z = (GRID_SIZE - 1) / 2

let controls = new THREE.OrbitControls(cam)
controls.update()

let cnt = 0
let intersects
let active

function tick() {
  raycaster.setFromCamera(mouse, cam)
  if (cnt++ % 60 == 0) {
    console.log(active)
  }
  intersects = raycaster.intersectObjects(scene.children)
  if (intersects.length) {
    if (active != intersects[0].object) {
      if (active) active.material.color.set(active.currentColor)
      active = intersects[0].object
      active.currentColor = active.material.color.getHex()
      active.material.color.set(0x00CC22)
    }
  } else {
    if (active) active.material.color.set(active.currentColor)
    active = undefined
  }

  requestAnimationFrame(tick)
  controls.update()
  renderer.render(scene, cam)
}

window.addEventListener('mousemove', onMouseMove, false)
tick()
