import * as THREE from 'three';
import { AABBCollider, HeldItem } from '../types/game';
import {
  createAsphaltRoadTexture,
  createBrickPlinthTexture,
  createCorrugatedTinTexture,
  createEarthGroundTexture,
  createLungiTexture,
  createSignboardTexture,
  createWeatheredWoodTexture,
} from './textures';

export interface SceneRefs {
  playerGroup: THREE.Group;
  playerLeftArm: THREE.Group;
  playerRightArm: THREE.Group;
  playerLeftLeg: THREE.Group;
  playerRightLeg: THREE.Group;
  heldItemAnchor: THREE.Group;
  heldKettleMesh: THREE.Group;
  heldCupMesh: THREE.Group;
  heldBiscuitMesh: THREE.Group;
  stoveFlameGroup: THREE.Group;
  stoveLight: THREE.PointLight;
  kettleOnCounter: THREE.Group;
  steamParticles: THREE.Mesh[];
  cupLiquidMeshes: THREE.Mesh[];
  biscuitMeshes: THREE.Mesh[];
  highlightRing: THREE.Mesh;
  stallLanternLight: THREE.PointLight;
  cngGroup: THREE.Group;
  rickshawGroup: THREE.Group;
  characterBodyGroup: THREE.Group;
  colliders: AABBCollider[];
}

export function buildChaDokanEnvironment(
  scene: THREE.Scene,
  maxAnisotropy: number,
  isSoftwareGl: boolean
): SceneRefs {
  const colliders: AABBCollider[] = [];

  // 1. Textures
  const tinTex = createCorrugatedTinTexture(maxAnisotropy);
  const woodCounterTex = createWeatheredWoodTexture(maxAnisotropy, '#6e472b', '#3f2512', 2, 1);
  const woodPostTex = createWeatheredWoodTexture(maxAnisotropy, '#54351e', '#2e1a0c', 1, 2);
  const woodBenchTex = createWeatheredWoodTexture(maxAnisotropy, '#7a5234', '#472c18', 2, 1);
  const brickTex = createBrickPlinthTexture(maxAnisotropy);
  const roadTex = createAsphaltRoadTexture(maxAnisotropy);
  const earthTex = createEarthGroundTexture(maxAnisotropy);
  const signboardTex = createSignboardTexture(maxAnisotropy);
  const playerLungiTex = createLungiTexture(maxAnisotropy, '#1e3a8a', '#172554', '#93c5fd');
  const npcLungiTex = createLungiTexture(maxAnisotropy, '#14532d', '#052e16', '#86efac');

  // 2. Shared Materials (Calibrated PBR)
  const earthMat = new THREE.MeshStandardMaterial({
    map: earthTex,
    roughness: 0.94,
    metalness: 0.02,
  });

  const roadMat = new THREE.MeshStandardMaterial({
    map: roadTex,
    roughness: 0.86,
    metalness: 0.05,
  });

  const brickMat = new THREE.MeshStandardMaterial({
    map: brickTex,
    roughness: 0.88,
    metalness: 0.04,
  });

  const woodCounterMat = new THREE.MeshStandardMaterial({
    map: woodCounterTex,
    roughness: 0.72,
    metalness: 0.05,
  });

  const woodPostMat = new THREE.MeshStandardMaterial({
    map: woodPostTex,
    roughness: 0.82,
    metalness: 0.04,
  });

  const woodBenchMat = new THREE.MeshStandardMaterial({
    map: woodBenchTex,
    roughness: 0.76,
    metalness: 0.05,
  });

  const tinRoofMat = new THREE.MeshStandardMaterial({
    map: tinTex.map,
    bumpMap: tinTex.bumpMap,
    bumpScale: 0.035,
    roughness: 0.46,
    metalness: 0.68,
  });

  const aluminumMat = new THREE.MeshStandardMaterial({
    color: 0xd6dce0,
    roughness: 0.26,
    metalness: 0.88,
  });

  const darkIronMat = new THREE.MeshStandardMaterial({
    color: 0x2b2d2f,
    roughness: 0.55,
    metalness: 0.78,
  });

  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xc89d42,
    roughness: 0.3,
    metalness: 0.85,
  });

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xf4f9ff,
    roughness: 0.08,
    metalness: 0.0,
    transmission: isSoftwareGl ? 0 : 0.86,
    transparent: true,
    opacity: isSoftwareGl ? 0.42 : 1.0,
    ior: 1.5,
    thickness: 0.12,
    depthWrite: false,
  });

  const chaLiquidMat = new THREE.MeshStandardMaterial({
    color: 0xb5723b, // Authentic creamy Dudh Cha caramel color
    roughness: 0.22,
    metalness: 0.05,
  });

  const redPlasticMat = new THREE.MeshStandardMaterial({
    color: 0xc82828,
    roughness: 0.36,
    metalness: 0.05,
  });

  const bluePlasticMat = new THREE.MeshStandardMaterial({
    color: 0x1d56b8,
    roughness: 0.36,
    metalness: 0.05,
  });

  const biscuitMat = new THREE.MeshStandardMaterial({
    color: 0xd49442,
    roughness: 0.68,
    metalness: 0.02,
  });

  // ============================================================================
  // A. GROUND, ROAD & ROADSIDE SURROUNDINGS
  // ============================================================================
  const groundMesh = new THREE.Mesh(new THREE.PlaneGeometry(64, 64), earthMat);
  groundMesh.rotation.x = -Math.PI / 2;
  groundMesh.position.y = 0;
  groundMesh.receiveShadow = true;
  scene.add(groundMesh);

  // Asphalt road along Z = 4.3
  const roadMesh = new THREE.Mesh(new THREE.PlaneGeometry(64, 5.4), roadMat);
  roadMesh.rotation.x = -Math.PI / 2;
  roadMesh.position.set(0, 0.02, 4.3); // +0.02 Y offset prevents Z-fighting
  roadMesh.receiveShadow = true;
  scene.add(roadMesh);

  // Roadside earthen footpath / curb stones separating stall yard from road
  const curbGeo = new THREE.BoxGeometry(1.1, 0.12, 0.22);
  const curbMat = new THREE.MeshStandardMaterial({
    color: 0x9c8e7b,
    roughness: 0.9,
    metalness: 0.03,
  });
  for (let i = -8; i <= 8; i++) {
    if (i === 0 || i === 1) continue; // leave walkway opening to road
    const curb = new THREE.Mesh(curbGeo, curbMat);
    curb.position.set(i * 1.35, 0.06, 1.52);
    curb.castShadow = true;
    curb.receiveShadow = true;
    scene.add(curb);
  }

  // ============================================================================
  // B. THE CHA-ER DOKAN (TEA STALL STRUCTURE)
  // ============================================================================
  const stallGroup = new THREE.Group();
  stallGroup.position.set(0, 0, -2.0);
  scene.add(stallGroup);

  // Raised brick plinth base (walkable low step, no blocking collider so player can walk inside stall)
  const plinthMesh = new THREE.Mesh(new THREE.BoxGeometry(4.9, 0.12, 3.4), brickMat);
  plinthMesh.position.set(0, 0.06, 0);
  plinthMesh.receiveShadow = true;
  plinthMesh.castShadow = true;
  stallGroup.add(plinthMesh);

  // Cement floor slab atop brick plinth
  const floorSlabMat = new THREE.MeshStandardMaterial({
    color: 0x6f6b64,
    roughness: 0.85,
    metalness: 0.05,
  });
  const floorSlab = new THREE.Mesh(new THREE.BoxGeometry(4.74, 0.03, 3.24), floorSlabMat);
  floorSlab.position.set(0, 0.135, 0);
  floorSlab.receiveShadow = true;
  stallGroup.add(floorSlab);

  // 4 Wooden Support Posts
  const postPositions: [number, number, string][] = [
    [-2.22, -1.5, 'Rear-Left Post'],
    [2.22, -1.5, 'Rear-Right Post'],
    [-2.22, 1.5, 'Front-Left Post'],
    [2.22, 1.5, 'Front-Right Post'],
  ];
  const postGeo = new THREE.BoxGeometry(0.16, 2.75, 0.16);
  postPositions.forEach(([px, pz, label], idx) => {
    const post = new THREE.Mesh(postGeo, woodPostMat);
    post.position.set(px, 1.45, pz);
    post.castShadow = true;
    post.receiveShadow = true;
    stallGroup.add(post);

    // Concrete footing collar at bottom of post
    const collar = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, 0.24), curbMat);
    collar.position.set(px, 0.24, pz);
    stallGroup.add(collar);

    const worldX = px;
    const worldZ = pz - 2.0;
    colliders.push({
      id: `post_${idx}`,
      label,
      minX: worldX - 0.12,
      maxX: worldX + 0.12,
      minZ: worldZ - 0.12,
      maxZ: worldZ + 0.12,
    });
  });

  // Back Wooden Slat Wall & Storage Shelf (at z = -1.5 local -> z = -3.5 world)
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(4.48, 2.35, 0.12), woodPostMat);
  backWall.position.set(0, 1.32, -1.5);
  backWall.castShadow = true;
  backWall.receiveShadow = true;
  stallGroup.add(backWall);

  colliders.push({
    id: 'stall_back_wall',
    label: 'Stall Back Wall',
    minX: -2.3,
    maxX: 2.3,
    minZ: -3.62,
    maxZ: -3.38,
  });

  // Left Side Half-Partition Wall
  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.15, 3.0), woodPostMat);
  leftWall.position.set(-2.22, 0.72, 0);
  leftWall.castShadow = true;
  leftWall.receiveShadow = true;
  stallGroup.add(leftWall);

  colliders.push({
    id: 'stall_left_wall',
    label: 'Stall Left Wall',
    minX: -2.32,
    maxX: -2.12,
    minZ: -3.5,
    maxZ: -0.5,
  });

  // Back Wall Wooden Storage Shelf with extra tea & sugar tins
  const backShelf = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.06, 0.34), woodCounterMat);
  backShelf.position.set(0, 1.55, -1.3);
  backShelf.castShadow = true;
  backShelf.receiveShadow = true;
  stallGroup.add(backShelf);

  // Decorative storage tins on back shelf
  for (let i = 0; i < 5; i++) {
    const tin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.09, 0.09, 0.24, 16),
      i % 2 === 0 ? aluminumMat : brassMat
    );
    tin.position.set(-1.3 + i * 0.65, 1.7, -1.3);
    tin.castShadow = true;
    stallGroup.add(tin);
  }

  // Main Wooden Counter (Front-left to center, leaving right side open for player passage)
  // Local X: -2.15 to +0.95 (width 3.10), Local Z: +0.85 to +1.55 (depth 0.70, centered at +1.20 -> world Z = -0.80)
  const counterGroup = new THREE.Group();
  counterGroup.position.set(-0.6, 0.15, 1.2);
  stallGroup.add(counterGroup);

  const counterBody = new THREE.Mesh(new THREE.BoxGeometry(3.04, 0.82, 0.68), woodPostMat);
  counterBody.position.set(0, 0.41, 0);
  counterBody.castShadow = true;
  counterBody.receiveShadow = true;
  counterGroup.add(counterBody);

  const counterTop = new THREE.Mesh(new THREE.BoxGeometry(3.16, 0.06, 0.78), woodCounterMat);
  counterTop.position.set(0, 0.85, 0);
  counterTop.castShadow = true;
  counterTop.receiveShadow = true;
  counterGroup.add(counterTop);

  // Register Counter Collider (World X: -2.18 to +0.98, World Z: -1.19 to -0.41)
  colliders.push({
    id: 'wooden_counter',
    label: 'Wooden Tea Counter',
    minX: -2.18,
    maxX: 0.98,
    minZ: -1.19,
    maxZ: -0.41,
  });

  // Roof Wooden Rafters & Corrugated Tin Roof (Sloped slightly for rain runoff)
  const roofGroup = new THREE.Group();
  roofGroup.position.set(0, 2.76, 0);
  roofGroup.rotation.x = 0.09; // Authentic slight forward pitch
  stallGroup.add(roofGroup);

  // Bamboo / Timber cross-rafters under the tin
  for (let r = -2; r <= 2; r++) {
    const rafter = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.09, 4.1), woodPostMat);
    rafter.position.set(r * 1.1, -0.05, 0.1);
    rafter.castShadow = true;
    roofGroup.add(rafter);
  }
  for (let zBeam = -1; zBeam <= 1; zBeam++) {
    const purlin = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.07, 0.08), woodPostMat);
    purlin.position.set(0, 0.0, zBeam * 1.35);
    roofGroup.add(purlin);
  }

  // Corrugated Tin Panels (4 overlapping sheets)
  const tinSheetGeo = new THREE.BoxGeometry(1.38, 0.025, 4.25);
  for (let s = 0; s < 4; s++) {
    const sheet = new THREE.Mesh(tinSheetGeo, tinRoofMat);
    sheet.position.set(-1.95 + s * 1.3, 0.05 + (s % 2) * 0.008, 0.12);
    sheet.castShadow = true;
    sheet.receiveShadow = true;
    roofGroup.add(sheet);
  }

  // Bengali & English Signboard mounted on front fascia
  const signboardMat = new THREE.MeshStandardMaterial({
    map: signboardTex,
    roughness: 0.55,
    metalness: 0.1,
  });
  const signboardMesh = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.58, 0.05), [
    woodPostMat,
    woodPostMat,
    woodPostMat,
    woodPostMat,
    signboardMat,
    woodPostMat,
  ]);
  signboardMesh.position.set(0, 2.58, 2.02);
  signboardMesh.castShadow = true;
  stallGroup.add(signboardMesh);

  // Hanging Warm Tungsten Bulb & Enamel Shade inside the stall
  const cordMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.45, 8), darkIronMat);
  cordMesh.position.set(-0.2, 2.52, 0.4);
  stallGroup.add(cordMesh);

  const shadeMesh = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.12, 16, 1, true), darkIronMat);
  shadeMesh.position.set(-0.2, 2.3, 0.4);
  stallGroup.add(shadeMesh);

  const bulbMat = new THREE.MeshStandardMaterial({
    color: 0xfff3c4,
    emissive: 0xffb347,
    emissiveIntensity: 2.2,
    roughness: 0.2,
  });
  const bulbMesh = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 12), bulbMat);
  bulbMesh.position.set(-0.2, 2.24, 0.4);
  stallGroup.add(bulbMesh);

  const stallLanternLight = new THREE.PointLight(0xffb85c, 2.4, 8.5, 1.8);
  stallLanternLight.position.set(-0.2, 2.15, -1.6);
  scene.add(stallLanternLight);

  // ============================================================================
  // C. STOVE, METAL KETTLE, GLASS TEA CUPS & BISCUIT JARS (ON COUNTER y = 1.03)
  // ============================================================================
  const counterSurfaceY = 1.03;

  // 1. Traditional Stove (Chula) at World (-1.55, 1.03, -0.80)
  const stoveGroup = new THREE.Group();
  stoveGroup.position.set(-1.55, counterSurfaceY, -0.8);
  scene.add(stoveGroup);

  const stoveBase = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.14, 0.42), darkIronMat);
  stoveBase.position.y = 0.07;
  stoveBase.castShadow = true;
  stoveBase.receiveShadow = true;
  stoveGroup.add(stoveBase);

  const burnerRing = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.05, 20), darkIronMat);
  burnerRing.position.y = 0.165;
  stoveGroup.add(burnerRing);

  // Brass valve knob on front of stove
  const stoveKnob = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.04, 12), brassMat);
  stoveKnob.rotation.x = Math.PI / 2;
  stoveKnob.position.set(0.12, 0.08, 0.22);
  stoveGroup.add(stoveKnob);

  // Iron grate prongs
  for (let g = 0; g < 4; g++) {
    const prong = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.02, 0.025), darkIronMat);
    prong.position.y = 0.195;
    prong.rotation.y = (g * Math.PI) / 4;
    stoveGroup.add(prong);
  }

  // Stove Flame Ring (Animated in loop when stoveLit = true)
  const stoveFlameGroup = new THREE.Group();
  stoveFlameGroup.position.y = 0.18;
  stoveGroup.add(stoveFlameGroup);

  const flameMat = new THREE.MeshStandardMaterial({
    color: 0xff7700,
    emissive: 0xff5500,
    emissiveIntensity: 3.0,
    roughness: 0.2,
  });
  for (let f = 0; f < 8; f++) {
    const angle = (f / 8) * Math.PI * 2;
    const flameCone = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.065, 8), flameMat);
    flameCone.position.set(Math.cos(angle) * 0.095, 0.02, Math.sin(angle) * 0.095);
    stoveFlameGroup.add(flameCone);
  }

  const stoveLight = new THREE.PointLight(0xff6a1a, 1.4, 2.5, 2);
  stoveLight.position.set(-1.55, counterSurfaceY + 0.28, -0.8);
  scene.add(stoveLight);

  // 2. Classic Bangladeshi Metal Kettle (Cha-er Ketli)
  const createKettleModel = (): THREE.Group => {
    const kGroup = new THREE.Group();

    // Lathe profile for authentic rounded aluminum kettle belly
    const lathePoints = [
      new THREE.Vector2(0.0, 0.0),
      new THREE.Vector2(0.14, 0.0),
      new THREE.Vector2(0.17, 0.07),
      new THREE.Vector2(0.15, 0.18),
      new THREE.Vector2(0.1, 0.24),
      new THREE.Vector2(0.11, 0.26),
      new THREE.Vector2(0.0, 0.26),
    ];
    const bodyGeo = new THREE.LatheGeometry(lathePoints, 24);
    const bodyMesh = new THREE.Mesh(bodyGeo, aluminumMat);
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    kGroup.add(bodyMesh);

    // Domed lid with black heat-resistant knob
    const lidMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.1, 0.025, 20), aluminumMat);
    lidMesh.position.y = 0.27;
    kGroup.add(lidMesh);

    const lidKnob = new THREE.Mesh(new THREE.SphereGeometry(0.024, 12, 12), darkIronMat);
    lidKnob.position.y = 0.295;
    kGroup.add(lidKnob);

    // Gooseneck pouring spout via TubeGeometry
    const spoutCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.13, 0.08, 0),
      new THREE.Vector3(0.22, 0.14, 0),
      new THREE.Vector3(0.25, 0.25, 0),
      new THREE.Vector3(0.28, 0.28, 0),
    ]);
    const spoutGeo = new THREE.TubeGeometry(spoutCurve, 16, 0.022, 10, false);
    const spoutMesh = new THREE.Mesh(spoutGeo, aluminumMat);
    spoutMesh.castShadow = true;
    kGroup.add(spoutMesh);

    // Overhead arched handle with black rubber grip
    const handleCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.11, 0.21, 0),
      new THREE.Vector3(-0.14, 0.36, 0),
      new THREE.Vector3(0.0, 0.4, 0),
      new THREE.Vector3(0.11, 0.36, 0),
      new THREE.Vector3(0.1, 0.22, 0),
    ]);
    const handleGeo = new THREE.TubeGeometry(handleCurve, 20, 0.012, 8, false);
    const handleMesh = new THREE.Mesh(handleGeo, aluminumMat);
    handleMesh.castShadow = true;
    kGroup.add(handleMesh);

    const gripGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.13, 10);
    gripGeo.rotateZ(Math.PI / 2);
    const gripMesh = new THREE.Mesh(gripGeo, darkIronMat);
    gripMesh.position.set(-0.01, 0.398, 0);
    kGroup.add(gripMesh);

    return kGroup;
  };

  // Kettle resting on stove/counter at (-1.12, counterSurfaceY, -0.78)
  const kettleOnCounter = createKettleModel();
  kettleOnCounter.position.set(-1.12, counterSurfaceY, -0.78);
  scene.add(kettleOnCounter);

  // Rising Steam Puffs above Kettle Spout
  const steamParticles: THREE.Mesh[] = [];
  const steamMat = new THREE.MeshBasicMaterial({
    color: 0xfaf6f0,
    transparent: true,
    opacity: 0.38,
    depthWrite: false,
  });
  for (let s = 0; s < 5; s++) {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(0.032 + s * 0.008, 10, 10), steamMat.clone());
    puff.position.set(-1.12 + 0.28, counterSurfaceY + 0.32 + s * 0.09, -0.78);
    scene.add(puff);
    steamParticles.push(puff);
  }

  // 3. Glass Tea Cups Tray & Condensed Milk Tins at (-0.25, counterSurfaceY, -0.78)
  const cupsTrayGroup = new THREE.Group();
  cupsTrayGroup.position.set(-0.25, counterSurfaceY, -0.78);
  scene.add(cupsTrayGroup);

  const metalTray = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.02, 0.42), aluminumMat);
  metalTray.position.y = 0.01;
  metalTray.receiveShadow = true;
  cupsTrayGroup.add(metalTray);

  const cupLiquidMeshes: THREE.Mesh[] = [];
  const cupGeo = new THREE.CylinderGeometry(0.036, 0.028, 0.095, 14, 1, true);
  const cupBottomGeo = new THREE.CylinderGeometry(0.028, 0.028, 0.01, 14);
  const liquidGeo = new THREE.CylinderGeometry(0.033, 0.026, 0.072, 14);

  for (let c = 0; c < 6; c++) {
    const row = Math.floor(c / 3);
    const col = c % 3;
    const cx = -0.18 + col * 0.11;
    const cz = -0.07 + row * 0.14;

    const singleCupGroup = new THREE.Group();
    singleCupGroup.position.set(cx, 0.02, cz);

    const glassWall = new THREE.Mesh(cupGeo, glassMat);
    glassWall.position.y = 0.048;
    glassWall.renderOrder = 2;
    singleCupGroup.add(glassWall);

    const glassBase = new THREE.Mesh(cupBottomGeo, glassMat);
    glassBase.position.y = 0.005;
    singleCupGroup.add(glassBase);

    const liquidMesh = new THREE.Mesh(liquidGeo, chaLiquidMat);
    liquidMesh.position.y = 0.04;
    liquidMesh.visible = c < 3; // Initially 3 cups filled with steaming cha
    singleCupGroup.add(liquidMesh);
    cupLiquidMeshes.push(liquidMesh);

    cupsTrayGroup.add(singleCupGroup);
  }

  // Condensed Milk Tin & Red Tea Leaf Tin next to the cups on the tray
  const milkTinMat = new THREE.MeshStandardMaterial({
    color: 0xfef3c7,
    roughness: 0.35,
    metalness: 0.4,
  });
  const milkTin = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.13, 18), milkTinMat);
  milkTin.position.set(0.21, 0.085, -0.08);
  milkTin.castShadow = true;
  cupsTrayGroup.add(milkTin);

  const teaLeafTin = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.06, 0.16, 18),
    redPlasticMat
  );
  teaLeafTin.position.set(0.21, 0.1, 0.09);
  teaLeafTin.castShadow = true;
  cupsTrayGroup.add(teaLeafTin);

  // 4. Glass Biscuit Jars (Boiyam) at (+0.52, counterSurfaceY, -0.78)
  const jarsGroup = new THREE.Group();
  jarsGroup.position.set(0.52, counterSurfaceY, -0.78);
  scene.add(jarsGroup);

  const biscuitMeshes: THREE.Mesh[] = [];
  for (let j = 0; j < 2; j++) {
    const jx = (j - 0.5) * 0.28;
    const jarBody = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.26, 0.2), glassMat);
    jarBody.position.set(jx, 0.13, 0);
    jarBody.renderOrder = 3;
    jarsGroup.add(jarBody);

    // Ribbed red plastic lid
    const jarLid = new THREE.Mesh(
      new THREE.CylinderGeometry(0.085, 0.09, 0.045, 18),
      redPlasticMat
    );
    jarLid.position.set(jx, 0.28, 0);
    jarLid.castShadow = true;
    jarsGroup.add(jarLid);

    // Stacked golden biscuits inside the glass jar
    for (let b = 0; b < 8; b++) {
      const bMesh = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.022, 0.09), biscuitMat);
      bMesh.position.set(
        jx + ((b % 2) - 0.5) * 0.02,
        0.025 + b * 0.026,
        ((b % 3) - 1) * 0.015
      );
      bMesh.rotation.y = b * 0.25;
      jarsGroup.add(bMesh);
      biscuitMeshes.push(bMesh);
    }
  }

  // ============================================================================
  // D. PLASTIC STOOLS & WOODEN CUSTOMER BENCH
  // ============================================================================
  const createPlasticStool = (x: number, z: number, mat: THREE.Material, id: string) => {
    const stool = new THREE.Group();
    stool.position.set(x, 0, z);

    // Molded top seat
    const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.2, 0.045, 20), mat);
    seat.position.y = 0.44;
    seat.castShadow = true;
    seat.receiveShadow = true;
    stool.add(seat);

    // 4 slightly flared plastic legs
    for (let l = 0; l < 4; l++) {
      const angle = (l * Math.PI) / 2 + Math.PI / 4;
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.018, 0.44, 10), mat);
      leg.position.set(Math.cos(angle) * 0.13, 0.22, Math.sin(angle) * 0.13);
      leg.rotation.z = -Math.cos(angle) * 0.1;
      leg.rotation.x = Math.sin(angle) * 0.1;
      leg.castShadow = true;
      stool.add(leg);
    }

    scene.add(stool);
    colliders.push({
      id,
      label: 'Plastic Stool',
      minX: x - 0.22,
      maxX: x + 0.22,
      minZ: z - 0.22,
      maxZ: z + 0.22,
    });
  };

  createPlasticStool(-1.35, 0.55, redPlasticMat, 'stool_red_1');
  createPlasticStool(0.15, 0.65, bluePlasticMat, 'stool_blue_1');
  createPlasticStool(1.75, 0.48, redPlasticMat, 'stool_red_2');

  // Wooden Customer Bench (Kath-er Bench) at (3.05, 0, -1.55)
  const benchGroup = new THREE.Group();
  benchGroup.position.set(3.05, 0, -1.55);
  scene.add(benchGroup);

  // Two wooden top planks
  for (let p = -1; p <= 1; p += 2) {
    const plank = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.045, 2.2), woodBenchMat);
    plank.position.set(p * 0.12, 0.48, 0);
    plank.castShadow = true;
    plank.receiveShadow = true;
    benchGroup.add(plank);
  }
  // Bench legs & stretcher beam
  for (let lz = -0.85; lz <= 0.85; lz += 1.7) {
    const legFrame = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.46, 0.08), woodPostMat);
    legFrame.position.set(0, 0.23, lz);
    legFrame.castShadow = true;
    benchGroup.add(legFrame);
  }
  const stretcher = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 1.78), woodPostMat);
  stretcher.position.set(0, 0.2, 0);
  benchGroup.add(stretcher);

  colliders.push({
    id: 'wooden_bench',
    label: 'Wooden Customer Bench',
    minX: 3.05 - 0.3,
    maxX: 3.05 + 0.3,
    minZ: -1.55 - 1.15,
    maxZ: -1.55 + 1.15,
  });

  // Seated Customer NPC on the Wooden Bench holding a glass of cha
  const npcGroup = new THREE.Group();
  npcGroup.position.set(3.02, 0.48, -1.35);
  npcGroup.rotation.y = -Math.PI / 2; // Facing the tea stall
  scene.add(npcGroup);

  const skinMat = new THREE.MeshStandardMaterial({
    color: 0x8d5b3e,
    roughness: 0.65,
    metalness: 0.02,
  });
  const hairMat = new THREE.MeshStandardMaterial({
    color: 0x181512,
    roughness: 0.8,
  });
  const npcShirtMat = new THREE.MeshStandardMaterial({
    color: 0xd9cbb8,
    roughness: 0.78,
  });
  const npcLungiMat = new THREE.MeshStandardMaterial({
    map: npcLungiTex,
    roughness: 0.82,
  });

  const npcTorso = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.52, 0.22), npcShirtMat);
  npcTorso.position.y = 0.32;
  npcTorso.castShadow = true;
  npcGroup.add(npcTorso);

  const npcHead = new THREE.Mesh(new THREE.SphereGeometry(0.125, 16, 16), skinMat);
  npcHead.position.y = 0.7;
  npcHead.castShadow = true;
  npcGroup.add(npcHead);

  const npcHair = new THREE.Mesh(
    new THREE.SphereGeometry(0.13, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.58),
    hairMat
  );
  npcHair.position.y = 0.71;
  npcGroup.add(npcHair);

  const npcLegs = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.42, 0.34), npcLungiMat);
  npcLegs.position.set(0, -0.15, 0.14);
  npcLegs.castShadow = true;
  npcGroup.add(npcLegs);

  // ============================================================================
  // E. BANGLADESHI CNG AUTO-RICKSHAW & CYCLE RICKSHAW + ROADSIDE TREES
  // ============================================================================
  // 1. Composite Bangladeshi Green CNG Auto-Rickshaw at (-4.5, 0, 2.2)
  const cngGroup = new THREE.Group();
  cngGroup.position.set(-4.5, 0, 2.2);
  cngGroup.rotation.y = 0.18;
  scene.add(cngGroup);

  const cngGreenMat = new THREE.MeshPhysicalMaterial({
    color: 0x15803d, // Iconic Dhaka/Bangladesh natural-gas green
    roughness: 0.32,
    metalness: 0.35,
    clearcoat: 0.65,
  });
  const cngHoodMat = new THREE.MeshStandardMaterial({
    color: 0x22201e,
    roughness: 0.88,
    metalness: 0.05,
  });
  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    roughness: 0.85,
    metalness: 0.1,
  });

  // Lower body chassis
  const cngRearBody = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.68, 1.18), cngGreenMat);
  cngRearBody.position.set(-0.25, 0.52, 0);
  cngRearBody.castShadow = true;
  cngRearBody.receiveShadow = true;
  cngGroup.add(cngRearBody);

  // Front nose cowl
  const cngFrontCowl = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.46, 0.75, 16), cngGreenMat);
  cngFrontCowl.position.set(0.68, 0.55, 0);
  cngFrontCowl.rotation.z = -0.15;
  cngFrontCowl.castShadow = true;
  cngGroup.add(cngFrontCowl);

  // Windshield frame & glass
  const cngWindshield = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.56, 0.96), glassMat);
  cngWindshield.position.set(0.62, 1.15, 0);
  cngWindshield.rotation.z = 0.22;
  cngGroup.add(cngWindshield);

  // Canvas canopy roof
  const cngRoof = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.14, 1.22), cngHoodMat);
  cngRoof.position.set(-0.08, 1.52, 0);
  cngRoof.castShadow = true;
  cngGroup.add(cngRoof);

  // Security mesh cage doors (characteristic of Bangladeshi CNG)
  const cageGeo = new THREE.BoxGeometry(1.3, 0.62, 1.2);
  const cageWireMat = new THREE.MeshStandardMaterial({
    color: 0x9ca3af,
    roughness: 0.4,
    metalness: 0.8,
    wireframe: true,
  });
  const cngCage = new THREE.Mesh(cageGeo, cageWireMat);
  cngCage.position.set(-0.2, 1.16, 0);
  cngGroup.add(cngCage);

  // Single front headlight
  const headlight = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.08, 16), bulbMat);
  headlight.rotation.z = Math.PI / 2;
  headlight.position.set(1.06, 0.62, 0);
  cngGroup.add(headlight);

  // 3 Wheels (1 front, 2 rear)
  const wheelGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.14, 18);
  wheelGeo.rotateX(Math.PI / 2);
  const wheelCoords: [number, number, number][] = [
    [0.88, 0.24, 0],
    [-0.65, 0.24, 0.58],
    [-0.65, 0.24, -0.58],
  ];
  wheelCoords.forEach(([wx, wy, wz]) => {
    const wheel = new THREE.Mesh(wheelGeo, tireMat);
    wheel.position.set(wx, wy, wz);
    wheel.castShadow = true;
    cngGroup.add(wheel);

    const hub = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11, 0.11, 0.15, 12).rotateX(Math.PI / 2),
      aluminumMat
    );
    hub.position.set(wx, wy, wz);
    cngGroup.add(hub);
  });

  colliders.push({
    id: 'cng_rickshaw',
    label: 'CNG Auto-Rickshaw',
    minX: -4.5 - 1.15,
    maxX: -4.5 + 1.15,
    minZ: 2.2 - 0.75,
    maxZ: 2.2 + 0.75,
  });

  // 2. Composite Bangladeshi Cycle Rickshaw at (4.7, 0, 2.1)
  const rickshawGroup = new THREE.Group();
  rickshawGroup.position.set(4.7, 0, 2.1);
  rickshawGroup.rotation.y = -0.25;
  scene.add(rickshawGroup);

  const rickshawHoodMat = new THREE.MeshStandardMaterial({
    color: 0xd97706, // vibrant marigold-amber rickshaw hood
    roughness: 0.6,
    metalness: 0.1,
  });
  const rickshawSeatMat = new THREE.MeshStandardMaterial({
    color: 0x991b1b,
    roughness: 0.5,
  });

  const rWheelGeo = new THREE.TorusGeometry(0.34, 0.028, 10, 24);
  const rWheelPositions: [number, number, number][] = [
    [-0.95, 0.36, 0], // front bicycle wheel
    [0.35, 0.36, 0.52], // rear left wheel
    [0.35, 0.36, -0.52], // rear right wheel
  ];
  rWheelPositions.forEach(([rx, ry, rz]) => {
    const tire = new THREE.Mesh(rWheelGeo, tireMat);
    tire.position.set(rx, ry, rz);
    tire.castShadow = true;
    rickshawGroup.add(tire);

    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.02, 16).rotateX(Math.PI / 2), cageWireMat);
    rim.position.set(rx, ry, rz);
    rickshawGroup.add(rim);
  });

  // Passenger platform & seat
  const rPlatform = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.08, 0.92), woodBenchMat);
  rPlatform.position.set(0.25, 0.52, 0);
  rPlatform.castShadow = true;
  rickshawGroup.add(rPlatform);

  const rCushion = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.18, 0.86), rickshawSeatMat);
  rCushion.position.set(0.42, 0.68, 0);
  rCushion.castShadow = true;
  rickshawGroup.add(rCushion);

  // Arched folding rickshaw hood
  const rHood = new THREE.Mesh(
    new THREE.CylinderGeometry(0.52, 0.52, 0.92, 16, 1, false, 0, Math.PI).rotateX(Math.PI / 2),
    rickshawHoodMat
  );
  rHood.position.set(0.4, 1.15, 0);
  rHood.castShadow = true;
  rickshawGroup.add(rHood);

  // Frame connecting to front handlebars
  const rFrameBar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.025, 1.35, 8).rotateZ(Math.PI / 2.3),
    darkIronMat
  );
  rFrameBar.position.set(-0.35, 0.62, 0);
  rickshawGroup.add(rFrameBar);

  colliders.push({
    id: 'cycle_rickshaw',
    label: 'Cycle Rickshaw',
    minX: 4.7 - 1.15,
    maxX: 4.7 + 0.95,
    minZ: 2.1 - 0.7,
    maxZ: 2.1 + 0.7,
  });

  // 3. Roadside Trees & Utility Pole
  const trunkMat = new THREE.MeshStandardMaterial({
    color: 0x4a3525,
    roughness: 0.92,
    metalness: 0.02,
  });
  const foliageMat1 = new THREE.MeshStandardMaterial({
    color: 0x2d5a27,
    roughness: 0.85,
    metalness: 0.02,
  });
  const foliageMat2 = new THREE.MeshStandardMaterial({
    color: 0x3b6e33,
    roughness: 0.82,
    metalness: 0.02,
  });

  const createRoadsideTree = (tx: number, tz: number, scale: number, id: string) => {
    const tree = new THREE.Group();
    tree.position.set(tx, 0, tz);
    tree.scale.setScalar(scale);

    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.38, 2.6, 12), trunkMat);
    trunk.position.y = 1.3;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    tree.add(trunk);

    const crownPositions: [number, number, number, number, THREE.Material][] = [
      [0, 3.2, 0, 1.45, foliageMat1],
      [-0.85, 2.8, 0.5, 1.1, foliageMat2],
      [0.9, 2.9, -0.4, 1.15, foliageMat2],
      [0.2, 3.8, 0.4, 1.05, foliageMat1],
    ];
    crownPositions.forEach(([cx, cy, cz, r, mat]) => {
      const canopy = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 1), mat);
      canopy.position.set(cx, cy, cz);
      canopy.castShadow = true;
      canopy.receiveShadow = true;
      tree.add(canopy);
    });

    scene.add(tree);
    colliders.push({
      id,
      label: 'Roadside Tree',
      minX: tx - 0.42 * scale,
      maxX: tx + 0.42 * scale,
      minZ: tz - 0.42 * scale,
      maxZ: tz + 0.42 * scale,
    });
  };

  createRoadsideTree(-4.8, -2.6, 1.1, 'tree_west');
  createRoadsideTree(5.4, -2.5, 0.95, 'tree_east');

  // Electric / Utility Pole at (-3.6, 0, 1.2)
  const poleGroup = new THREE.Group();
  poleGroup.position.set(-3.6, 0, 1.2);
  scene.add(poleGroup);

  const poleMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.13, 5.8, 12), curbMat);
  poleMesh.position.y = 2.9;
  poleMesh.castShadow = true;
  poleGroup.add(poleMesh);

  const crossArm = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.08, 0.08), darkIronMat);
  crossArm.position.y = 5.3;
  poleGroup.add(crossArm);

  colliders.push({
    id: 'utility_pole',
    label: 'Utility Pole',
    minX: -3.6 - 0.18,
    maxX: -3.6 + 0.18,
    minZ: 1.2 - 0.18,
    maxZ: 1.2 + 0.18,
  });

  // ============================================================================
  // F. THIRD-PERSON PLAYER CHARACTER (COMPOSITE MULTI-PART MODEL)
  // ============================================================================
  const playerGroup = new THREE.Group();
  // Start behind the stall counter or right by the stall entrance facing the counter
  playerGroup.position.set(1.35, 0, -1.65);
  playerGroup.rotation.y = -Math.PI * 0.65;
  scene.add(playerGroup);

  const characterBodyGroup = new THREE.Group();
  playerGroup.add(characterBodyGroup);

  const shirtMat = new THREE.MeshStandardMaterial({
    color: 0xeae0c8, // Off-white / cream cotton fatua/panjabi
    roughness: 0.78,
    metalness: 0.02,
  });
  const vestMat = new THREE.MeshStandardMaterial({
    color: 0x7c4d2b, // Warm woven waistcoat / gamcha accent
    roughness: 0.82,
    metalness: 0.03,
  });
  const playerLungiMat = new THREE.MeshStandardMaterial({
    map: playerLungiTex,
    roughness: 0.8,
    metalness: 0.02,
  });

  // Legs (Pivot at hip y = 0.72)
  const playerLeftLeg = new THREE.Group();
  playerLeftLeg.position.set(-0.1, 0.72, 0);
  characterBodyGroup.add(playerLeftLeg);

  const leftLegMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.06, 0.68, 12), skinMat);
  leftLegMesh.position.y = -0.34;
  leftLegMesh.castShadow = true;
  playerLeftLeg.add(leftLegMesh);

  const leftSandal = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.04, 0.22), darkIronMat);
  leftSandal.position.set(0, -0.69, 0.03);
  playerLeftLeg.add(leftSandal);

  const playerRightLeg = new THREE.Group();
  playerRightLeg.position.set(0.1, 0.72, 0);
  characterBodyGroup.add(playerRightLeg);

  const rightLegMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.06, 0.68, 12), skinMat);
  rightLegMesh.position.y = -0.34;
  rightLegMesh.castShadow = true;
  playerRightLeg.add(rightLegMesh);

  const rightSandal = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.04, 0.22), darkIronMat);
  rightSandal.position.set(0, -0.69, 0.03);
  playerRightLeg.add(rightSandal);

  // Lungi Lower Wrap (covers hips down to calves)
  const lungiMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.23, 0.62, 18),
    playerLungiMat
  );
  lungiMesh.position.y = 0.52;
  lungiMesh.castShadow = true;
  lungiMesh.receiveShadow = true;
  characterBodyGroup.add(lungiMesh);

  // Torso (Cotton Panjabi/Fatua + Gamcha shoulder drape)
  const torsoMesh = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.56, 0.24), shirtMat);
  torsoMesh.position.y = 1.08;
  torsoMesh.castShadow = true;
  torsoMesh.receiveShadow = true;
  characterBodyGroup.add(torsoMesh);

  const gamchaScarf = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.12, 0.26), vestMat);
  gamchaScarf.position.set(0, 1.29, 0);
  characterBodyGroup.add(gamchaScarf);

  // Head & Hair
  const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.14, 18, 18), skinMat);
  headMesh.position.y = 1.52;
  headMesh.castShadow = true;
  characterBodyGroup.add(headMesh);

  const hairCap = new THREE.Mesh(
    new THREE.SphereGeometry(0.146, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.55),
    hairMat
  );
  hairCap.position.y = 1.53;
  hairCap.rotation.x = -0.15;
  characterBodyGroup.add(hairCap);

  // Left & Right Arms (Pivoted at shoulders y = 1.30)
  const playerLeftArm = new THREE.Group();
  playerLeftArm.position.set(-0.27, 1.3, 0);
  characterBodyGroup.add(playerLeftArm);

  const leftSleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.052, 0.26, 12), shirtMat);
  leftSleeve.position.y = -0.12;
  leftSleeve.castShadow = true;
  playerLeftArm.add(leftSleeve);

  const leftForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.042, 0.28, 12), skinMat);
  leftForearm.position.y = -0.36;
  leftForearm.castShadow = true;
  playerLeftArm.add(leftForearm);

  const playerRightArm = new THREE.Group();
  playerRightArm.position.set(0.27, 1.3, 0);
  characterBodyGroup.add(playerRightArm);

  const rightSleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.052, 0.26, 12), shirtMat);
  rightSleeve.position.y = -0.12;
  rightSleeve.castShadow = true;
  playerRightArm.add(rightSleeve);

  const rightForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.042, 0.28, 12), skinMat);
  rightForearm.position.y = -0.36;
  rightForearm.castShadow = true;
  playerRightArm.add(rightForearm);

  // Held Item Anchor at Right Hand
  const heldItemAnchor = new THREE.Group();
  heldItemAnchor.position.set(0, -0.48, 0.14);
  playerRightArm.add(heldItemAnchor);

  const heldKettleMesh = createKettleModel();
  heldKettleMesh.scale.setScalar(0.75);
  heldKettleMesh.position.set(0, -0.12, 0.05);
  heldKettleMesh.visible = false;
  heldItemAnchor.add(heldKettleMesh);

  const heldCupMesh = new THREE.Group();
  const hCupGlass = new THREE.Mesh(cupGeo, glassMat);
  hCupGlass.position.y = 0.045;
  const hCupLiquid = new THREE.Mesh(liquidGeo, chaLiquidMat);
  hCupLiquid.position.y = 0.04;
  heldCupMesh.add(hCupGlass, hCupLiquid);
  heldCupMesh.visible = false;
  heldItemAnchor.add(heldCupMesh);

  const heldBiscuitMesh = new THREE.Group();
  const hBiscuit = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.025, 0.08), biscuitMat);
  heldBiscuitMesh.add(hBiscuit);
  heldBiscuitMesh.visible = false;
  heldItemAnchor.add(heldBiscuitMesh);

  // Soft Contact Shadow Disc under Player
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = 64;
  shadowCanvas.height = 64;
  const sCtx = shadowCanvas.getContext('2d')!;
  const sGrad = sCtx.createRadialGradient(32, 32, 4, 32, 32, 30);
  sGrad.addColorStop(0, 'rgba(0,0,0,0.55)');
  sGrad.addColorStop(1, 'rgba(0,0,0,0)');
  sCtx.fillStyle = sGrad;
  sCtx.fillRect(0, 0, 64, 64);
  const contactShadowTex = new THREE.CanvasTexture(shadowCanvas);

  const contactShadowMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(0.75, 0.75),
    new THREE.MeshBasicMaterial({
      map: contactShadowTex,
      transparent: true,
      depthWrite: false,
    })
  );
  contactShadowMesh.rotation.x = -Math.PI / 2;
  contactShadowMesh.position.y = 0.025;
  playerGroup.add(contactShadowMesh);

  // Interactive Station Highlight Ring (shows on counter prop when player is in range)
  const highlightRing = new THREE.Mesh(
    new THREE.RingGeometry(0.18, 0.23, 28),
    new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    })
  );
  highlightRing.rotation.x = -Math.PI / 2;
  highlightRing.visible = false;
  scene.add(highlightRing);

  return {
    playerGroup,
    playerLeftArm,
    playerRightArm,
    playerLeftLeg,
    playerRightLeg,
    heldItemAnchor,
    heldKettleMesh,
    heldCupMesh,
    heldBiscuitMesh,
    stoveFlameGroup,
    stoveLight,
    kettleOnCounter,
    steamParticles,
    cupLiquidMeshes,
    biscuitMeshes,
    highlightRing,
    stallLanternLight,
    cngGroup,
    rickshawGroup,
    characterBodyGroup,
    colliders,
  };
}

export function syncHeldItemVisuals(refs: SceneRefs, heldItem: HeldItem) {
  refs.heldKettleMesh.visible = heldItem === 'kettle';
  refs.heldCupMesh.visible = heldItem === 'filled_cup';
  refs.heldBiscuitMesh.visible = heldItem === 'biscuit';
  refs.kettleOnCounter.visible = heldItem !== 'kettle';
}
