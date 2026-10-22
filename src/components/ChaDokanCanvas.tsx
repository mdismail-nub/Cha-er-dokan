import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { buildChaDokanEnvironment, SceneRefs, syncHeldItemVisuals } from '../three/models';
import { INTERACTIVE_STATIONS } from '../three/stations';
import {
  AABBCollider,
  ActivePromptScreen,
  CameraPreset,
  CustomLoadedModelInfo,
  CustomModelSlot,
  LightingPreset,
  StallSimState,
  StationId,
} from '../types/game';

// Pre-allocated math helpers at module scope (Zero GC inside render loop)
const _forward = new THREE.Vector3();
const _right = new THREE.Vector3();
const _moveVec = new THREE.Vector3();
const _camTarget = new THREE.Vector3();
const _desiredCamPos = new THREE.Vector3();
const _projVec = new THREE.Vector3();

interface ChaDokanCanvasProps {
  simState: StallSimState;
  lightingPreset: LightingPreset;
  cameraPreset: CameraPreset;
  showColliders: boolean;
  mobileMoveInput: { x: number; y: number };
  onReleaseCameraPreset: () => void;
  onActivePromptChange: (prompt: ActivePromptScreen | null) => void;
  onTriggerInteract: (stationId: StationId) => void;
  onPlayerTelemetryChange: (pos: [number, number, number], collidingWith: string | null) => void;
  pendingModelUpload: { slot: CustomModelSlot; file: File } | null;
  onModelUploadComplete: (info: CustomLoadedModelInfo) => void;
  onModelUploadError: (errMessage: string) => void;
}

function resolveCircleAABB(
  px: number,
  pz: number,
  radius: number,
  colliders: AABBCollider[]
): { x: number; z: number; hitLabel: string | null } {
  let x = THREE.MathUtils.clamp(px, -14.5, 14.5);
  let z = THREE.MathUtils.clamp(pz, -7.5, 8.5);
  let hitLabel: string | null = null;

  for (let i = 0; i < colliders.length; i++) {
    const box = colliders[i];
    const closestX = Math.max(box.minX, Math.min(x, box.maxX));
    const closestZ = Math.max(box.minZ, Math.min(z, box.maxZ));

    const dx = x - closestX;
    const dz = z - closestZ;
    const distSq = dx * dx + dz * dz;

    if (distSq < radius * radius) {
      hitLabel = box.label;
      const dist = Math.sqrt(distSq);
      if (dist > 0.00001) {
        const overlap = radius - dist;
        x += (dx / dist) * overlap;
        z += (dz / dist) * overlap;
      } else {
        // Center is inside AABB; push out along shallowest axis
        const penLeft = Math.abs(x - box.minX);
        const penRight = Math.abs(box.maxX - x);
        const penBack = Math.abs(z - box.minZ);
        const penFront = Math.abs(box.maxZ - z);
        const minPen = Math.min(penLeft, penRight, penBack, penFront);
        if (minPen === penLeft) x = box.minX - radius;
        else if (minPen === penRight) x = box.maxX + radius;
        else if (minPen === penBack) z = box.minZ - radius;
        else z = box.maxZ + radius;
      }
    }
  }

  return { x, z, hitLabel };
}

export const ChaDokanCanvas: React.FC<ChaDokanCanvasProps> = ({
  simState,
  lightingPreset,
  cameraPreset,
  showColliders,
  mobileMoveInput,
  onReleaseCameraPreset,
  onActivePromptChange,
  onTriggerInteract,
  onPlayerTelemetryChange,
  pendingModelUpload,
  onModelUploadComplete,
  onModelUploadError,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  // Store latest React props & callbacks in refs so WebGL canvas never remounts
  const simStateRef = useRef<StallSimState>(simState);
  simStateRef.current = simState;

  const lightingPresetRef = useRef<LightingPreset>(lightingPreset);
  lightingPresetRef.current = lightingPreset;

  const cameraPresetRef = useRef<CameraPreset>(cameraPreset);
  cameraPresetRef.current = cameraPreset;

  const mobileMoveRef = useRef(mobileMoveInput);
  mobileMoveRef.current = mobileMoveInput;

  const callbacksRef = useRef({
    onReleaseCameraPreset,
    onActivePromptChange,
    onTriggerInteract,
    onPlayerTelemetryChange,
    onModelUploadComplete,
    onModelUploadError,
  });
  callbacksRef.current = {
    onReleaseCameraPreset,
    onActivePromptChange,
    onTriggerInteract,
    onPlayerTelemetryChange,
    onModelUploadComplete,
    onModelUploadError,
  };

  const sceneRefsHolder = useRef<SceneRefs | null>(null);
  const colliderHelpersGroupRef = useRef<THREE.Group | null>(null);
  const lightsHolderRef = useRef<{
    scene: THREE.Scene;
    sunLight: THREE.DirectionalLight;
    hemiLight: THREE.HemisphereLight;
    rimLight: THREE.DirectionalLight;
    fog: THREE.FogExp2;
  } | null>(null);

  // Sync held item & cup/biscuit visuals when simState updates
  useEffect(() => {
    const refs = sceneRefsHolder.current;
    if (!refs) return;
    syncHeldItemVisuals(refs, simState.heldItem);
    refs.stoveFlameGroup.visible = simState.stoveLit;
    refs.stoveLight.intensity = simState.stoveLit ? 1.5 : 0;

    refs.cupLiquidMeshes.forEach((mesh, idx) => {
      mesh.visible = idx < simState.cupsFilledCount;
    });
    refs.biscuitMeshes.forEach((mesh, idx) => {
      mesh.visible = idx < simState.biscuitsRemaining;
    });
  }, [simState]);

  // Sync collision debug wireframes
  useEffect(() => {
    if (colliderHelpersGroupRef.current) {
      colliderHelpersGroupRef.current.visible = showColliders;
    }
  }, [showColliders]);

  // Sync lighting preset
  useEffect(() => {
    const lh = lightsHolderRef.current;
    const refs = sceneRefsHolder.current;
    if (!lh || !refs) return;

    if (lightingPreset === 'golden_hour') {
      lh.scene.background = new THREE.Color(0xdca872);
      lh.fog.color.setHex(0xdca872);
      lh.fog.density = 0.018;
      lh.sunLight.color.setHex(0xffe0a3);
      lh.sunLight.intensity = 2.6;
      lh.sunLight.position.set(9, 11, 7);
      lh.hemiLight.color.setHex(0xffeed6);
      lh.hemiLight.groundColor.setHex(0x6b4e35);
      lh.hemiLight.intensity = 0.85;
      refs.stallLanternLight.intensity = 2.2;
    } else if (lightingPreset === 'morning_mist') {
      lh.scene.background = new THREE.Color(0xc9d6df);
      lh.fog.color.setHex(0xc9d6df);
      lh.fog.density = 0.025;
      lh.sunLight.color.setHex(0xfff7e6);
      lh.sunLight.intensity = 2.1;
      lh.sunLight.position.set(-10, 13, 6);
      lh.hemiLight.color.setHex(0xdbeafe);
      lh.hemiLight.groundColor.setHex(0x5c5346);
      lh.hemiLight.intensity = 0.95;
      refs.stallLanternLight.intensity = 1.2;
    } else if (lightingPreset === 'evening_lantern') {
      lh.scene.background = new THREE.Color(0x1b2432);
      lh.fog.color.setHex(0x1b2432);
      lh.fog.density = 0.022;
      lh.sunLight.color.setHex(0x64748b);
      lh.sunLight.intensity = 0.55;
      lh.sunLight.position.set(-6, 10, -8);
      lh.hemiLight.color.setHex(0x334155);
      lh.hemiLight.groundColor.setHex(0x1e1b18);
      lh.hemiLight.intensity = 0.45;
      refs.stallLanternLight.intensity = 4.2;
    }
  }, [lightingPreset]);

  // Handle Custom GLB/GLTF Model Import for Character, CNG, or Rickshaw
  useEffect(() => {
    if (!pendingModelUpload || !sceneRefsHolder.current) return;
    const { slot, file } = pendingModelUpload;
    const refs = sceneRefsHolder.current;

    const objectUrl = URL.createObjectURL(file);
    const loader = new GLTFLoader();

    loader.load(
      objectUrl,
      (gltf) => {
        URL.revokeObjectURL(objectUrl);
        const importedRoot = gltf.scene;

        // Compute bounding box to normalize scale & ground pivot at bottom-center (y = 0)
        const box = new THREE.Box3().setFromObject(importedRoot);
        const size = new THREE.Vector3();
        const center = new THREE.Vector3();
        box.getSize(size);
        box.getCenter(center);

        const targetHeight =
          slot === 'character' ? 1.68 : slot === 'cng' ? 1.62 : 1.55;
        const maxDim = Math.max(size.y, 0.001);
        const scaleFactor = targetHeight / maxDim;

        importedRoot.scale.setScalar(scaleFactor);

        // Recompute after scaling so bottom sits flush at y = 0 and X/Z centered
        const scaledBox = new THREE.Box3().setFromObject(importedRoot);
        const scaledCenter = new THREE.Vector3();
        scaledBox.getCenter(scaledCenter);

        importedRoot.position.x -= scaledCenter.x;
        importedRoot.position.z -= scaledCenter.z;
        importedRoot.position.y -= scaledBox.min.y;

        let polyCount = 0;
        importedRoot.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            if (mesh.geometry) {
              const index = mesh.geometry.index;
              const posAttr = mesh.geometry.attributes.position;
              if (index) polyCount += Math.round(index.count / 3);
              else if (posAttr) polyCount += Math.round(posAttr.count / 3);
            }
          }
        });

        const targetGroup =
          slot === 'character'
            ? refs.characterBodyGroup
            : slot === 'cng'
            ? refs.cngGroup
            : refs.rickshawGroup;

        // Hide default procedural children and attach the imported GLTF model
        targetGroup.children.forEach((child) => {
          child.visible = false;
        });
        targetGroup.add(importedRoot);

        callbacksRef.current.onModelUploadComplete({
          slot,
          fileName: file.name,
          loadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          polyCount,
        });
      },
      undefined,
      (error) => {
        URL.revokeObjectURL(objectUrl);
        callbacksRef.current.onModelUploadError(
          error instanceof Error ? error.message : 'Failed to parse GLB/GLTF model.'
        );
      }
    );
  }, [pendingModelUpload]);

  // Main WebGL initialization & game loop (runs once on mount)
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Software WebGL detection per Three.js Skill Directive
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // 2. Scene, Fog & Studio Environment Reflection (RoomEnvironment)
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xdca872);
    const fog = new THREE.FogExp2(0xdca872, 0.018);
    scene.fog = fog;

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 3. Camera
    const camera = new THREE.PerspectiveCamera(
      52,
      container.clientWidth / container.clientHeight,
      0.1,
      120
    );
    camera.position.set(2.4, 2.5, 1.8);

    // 4. Balanced 3-Point Outdoor + Stall Lighting Rig
    const hemiLight = new THREE.HemisphereLight(0xffeed6, 0x6b4e35, 0.85);
    hemiLight.position.set(0, 25, 0);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xffe0a3, 2.6);
    sunLight.position.set(9, 11, 7);
    sunLight.castShadow = !isSoftwareGl;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    const d = 9.5;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 35;
    sunLight.shadow.bias = -0.0005;
    sunLight.shadow.normalBias = 0.02;
    scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0x93c5fd, 0.55);
    rimLight.position.set(-8, 6, -9);
    scene.add(rimLight);

    lightsHolderRef.current = { scene, sunLight, hemiLight, rimLight, fog };

    // 5. Build the Cha-er Dokan Environment & Models
    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
    const refs = buildChaDokanEnvironment(scene, maxAnisotropy, isSoftwareGl);
    sceneRefsHolder.current = refs;

    // 6. Optional Collision Bounding Box Helpers
    const colliderHelpersGroup = new THREE.Group();
    colliderHelpersGroup.visible = false;
    refs.colliders.forEach((col) => {
      const box3 = new THREE.Box3(
        new THREE.Vector3(col.minX, 0.02, col.minZ),
        new THREE.Vector3(col.maxX, 1.4, col.maxZ)
      );
      const helper = new THREE.Box3Helper(box3, new THREE.Color(0xf59e0b));
      colliderHelpersGroup.add(helper);
    });
    scene.add(colliderHelpersGroup);
    colliderHelpersGroupRef.current = colliderHelpersGroup;

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // 7. Input Listeners (WASD / Arrow Keys, E Key Interaction, Mouse Camera Orbit & Wheel Zoom)
    const keys: Record<string, boolean> = {};
    let activeNearestStationId: StationId | null = null;

    // Camera spherical orbit state around player
    let camYaw = 0.45; // horizontal angle (radians)
    let camPitch = 0.36; // vertical angle (radians)
    let camDistance = 3.55;
    let isPointerDown = false;
    let prevPointerX = 0;
    let prevPointerY = 0;

    const onKeyDown = (e: KeyboardEvent) => {
      if (
        ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(
          e.code
        )
      ) {
        keys[e.code] = true;
        if (cameraPresetRef.current !== 'third_person') {
          callbacksRef.current.onReleaseCameraPreset();
        }
      }
      if (e.code === 'KeyE' && !e.repeat) {
        if (activeNearestStationId) {
          callbacksRef.current.onTriggerInteract(activeNearestStationId);
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keys[e.code] = false;
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      isPointerDown = true;
      prevPointerX = e.clientX;
      prevPointerY = e.clientY;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isPointerDown) return;
      const dx = e.clientX - prevPointerX;
      const dy = e.clientY - prevPointerY;
      prevPointerX = e.clientX;
      prevPointerY = e.clientY;

      camYaw -= dx * 0.0065;
      camPitch = THREE.MathUtils.clamp(camPitch + dy * 0.0055, 0.08, 1.15);

      if (cameraPresetRef.current !== 'third_person') {
        callbacksRef.current.onReleaseCameraPreset();
      }
    };

    const onPointerUp = () => {
      isPointerDown = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      camDistance = THREE.MathUtils.clamp(camDistance + e.deltaY * 0.0025, 1.8, 7.2);
    };

    const domElem = renderer.domElement;
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    domElem.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    domElem.addEventListener('wheel', onWheel, { passive: false });

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // 8. Animation & Physics Loop (with afterDraw software-WebGL pacing)
    let frameId = 0;
    const clock = new THREE.Clock();
    let walkCycleTime = 0;
    let lastTelemetryTime = 0;
    let lastPromptBroadcast = '';

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync ? gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0) : null;
      gl.flush();
      const poll = () => {
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      const rawDelta = clock.getDelta();
      const dt = Math.min(rawDelta, 0.1);
      const elapsed = clock.getElapsedTime();

      // A. Determine movement input vector from WASD/Arrows + Mobile Joystick
      const moveForward =
        (keys['KeyW'] || keys['ArrowUp'] ? 1 : 0) -
        (keys['KeyS'] || keys['ArrowDown'] ? 1 : 0) +
        mobileMoveRef.current.y;
      const moveRight =
        (keys['KeyD'] || keys['ArrowRight'] ? 1 : 0) -
        (keys['KeyA'] || keys['ArrowLeft'] ? 1 : 0) +
        mobileMoveRef.current.x;

      const isMoving = Math.abs(moveForward) > 0.05 || Math.abs(moveRight) > 0.05;

      // Forward direction on XZ plane relative to camera yaw
      _forward.set(-Math.sin(camYaw), 0, -Math.cos(camYaw)).normalize();
      _right.set(_forward.z, 0, -_forward.x).normalize();

      _moveVec.set(0, 0, 0);
      _moveVec.addScaledVector(_forward, moveForward);
      _moveVec.addScaledVector(_right, -moveRight);
      if (_moveVec.lengthSq() > 1) {
        _moveVec.normalize();
      }

      const walkSpeed = 2.85;
      const playerPos = refs.playerGroup.position;
      let collidedLabel: string | null = null;

      if (isMoving) {
        const nextX = playerPos.x + _moveVec.x * walkSpeed * dt;
        const nextZ = playerPos.z + _moveVec.z * walkSpeed * dt;

        // Resolve circle-vs-AABB collisions (player radius = 0.28m)
        const resolved = resolveCircleAABB(nextX, nextZ, 0.28, refs.colliders);
        playerPos.x = resolved.x;
        playerPos.z = resolved.z;
        collidedLabel = resolved.hitLabel;

        // Smoothly step up onto the stall plinth (+0.14m) when inside stall footprint
        const insidePlinth =
          playerPos.x > -2.35 &&
          playerPos.x < 2.35 &&
          playerPos.z > -3.6 &&
          playerPos.z < -0.35;
        const targetY = insidePlinth ? 0.14 : 0.0;
        playerPos.y = THREE.MathUtils.damp(playerPos.y, targetY, 14, dt);

        // Smoothly rotate character toward movement direction
        const targetAngle = Math.atan2(_moveVec.x, _moveVec.z);
        let angleDiff = targetAngle - refs.playerGroup.rotation.y;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        refs.playerGroup.rotation.y += angleDiff * Math.min(1, dt * 12);

        // Walking limb swing kinematics
        walkCycleTime += dt * 9.5;
        const swing = Math.sin(walkCycleTime) * 0.48;
        refs.playerLeftLeg.rotation.x = swing;
        refs.playerRightLeg.rotation.x = -swing;
        refs.playerLeftArm.rotation.x = -swing * 0.7;
        refs.playerRightArm.rotation.x =
          simStateRef.current.heldItem !== 'none' ? -0.55 : swing * 0.7;
      } else {
        // Settle limbs smoothly when idle
        refs.playerLeftLeg.rotation.x = THREE.MathUtils.damp(
          refs.playerLeftLeg.rotation.x,
          0,
          10,
          dt
        );
        refs.playerRightLeg.rotation.x = THREE.MathUtils.damp(
          refs.playerRightLeg.rotation.x,
          0,
          10,
          dt
        );
        refs.playerLeftArm.rotation.x = THREE.MathUtils.damp(
          refs.playerLeftArm.rotation.x,
          Math.sin(elapsed * 1.8) * 0.03,
          10,
          dt
        );
        const idleRightArmTarget =
          simStateRef.current.heldItem !== 'none' ? -0.58 : -Math.sin(elapsed * 1.8) * 0.03;
        refs.playerRightArm.rotation.x = THREE.MathUtils.damp(
          refs.playerRightArm.rotation.x,
          idleRightArmTarget,
          10,
          dt
        );
      }

      // B. Smooth Third-Person Camera or Preset Camera Choreography
      const activePreset = cameraPresetRef.current;
      if (activePreset === 'third_person') {
        _camTarget.set(playerPos.x, playerPos.y + 1.32, playerPos.z);
        const horizDist = camDistance * Math.cos(camPitch);
        const vertDist = camDistance * Math.sin(camPitch);

        _desiredCamPos.set(
          _camTarget.x + Math.sin(camYaw) * horizDist,
          Math.max(0.45, _camTarget.y + vertDist),
          _camTarget.z + Math.cos(camYaw) * horizDist
        );
      } else if (activePreset === 'stall_overview') {
        _camTarget.set(-0.2, 1.25, -1.5);
        _desiredCamPos.set(2.8, 3.1, 2.9);
      } else if (activePreset === 'counter_closeup') {
        _camTarget.set(-0.5, 1.15, -0.8);
        _desiredCamPos.set(-0.4, 1.68, 0.85);
      } else {
        // roadside_angle
        _camTarget.set(-0.8, 1.1, -0.5);
        _desiredCamPos.set(-5.8, 2.2, 4.4);
      }

      camera.position.x = THREE.MathUtils.damp(camera.position.x, _desiredCamPos.x, 8.5, dt);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, _desiredCamPos.y, 8.5, dt);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, _desiredCamPos.z, 8.5, dt);
      camera.lookAt(_camTarget);

      // C. Animate Stove Flame & Rising Kettle Steam Particles
      const sState = simStateRef.current;
      if (sState.stoveLit) {
        refs.stoveFlameGroup.rotation.y = elapsed * 3.0;
        const flicker = 1.35 + Math.sin(elapsed * 19) * 0.2;
        refs.stoveLight.intensity = flicker;
      }

      const showSteam = sState.stoveLit && sState.heldItem !== 'kettle';
      refs.steamParticles.forEach((puff, idx) => {
        puff.visible = showSteam;
        if (showSteam) {
          const cycle = (elapsed * 0.65 + idx * 0.2) % 1;
          puff.position.y = 1.03 + 0.3 + cycle * 0.55;
          puff.position.x = -1.12 + 0.28 + Math.sin(elapsed * 2.5 + idx) * 0.03;
          const scale = 0.6 + cycle * 1.1;
          puff.scale.setScalar(scale);
          (puff.material as THREE.MeshBasicMaterial).opacity = (1 - cycle) * 0.42;
        }
      });

      // D. Proximity Contextual Interaction Detection (Stove, Kettle, Cups, Biscuits, Counter)
      let nearestStation = null;
      let minDistance = Infinity;

      for (let i = 0; i < INTERACTIVE_STATIONS.length; i++) {
        const st = INTERACTIVE_STATIONS[i];
        const dx = playerPos.x - st.worldPos[0];
        const dz = playerPos.z - st.worldPos[2];
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist <= st.interactionRadius && dist < minDistance) {
          minDistance = dist;
          nearestStation = st;
        }
      }

      if (nearestStation) {
        activeNearestStationId = nearestStation.id;
        refs.highlightRing.visible = true;
        refs.highlightRing.position.set(
          nearestStation.worldPos[0],
          1.045,
          nearestStation.worldPos[2]
        );
        refs.highlightRing.rotation.z = elapsed * 1.5;

        // Project 3D station anchor into 2D viewport coordinates
        _projVec.set(
          nearestStation.worldPos[0],
          nearestStation.worldPos[1] + 0.25,
          nearestStation.worldPos[2]
        );
        _projVec.project(camera);

        const screenX = ((_projVec.x + 1) / 2) * domElem.clientWidth;
        const screenY = (-(_projVec.y - 1) / 2) * domElem.clientHeight;
        const actionLabel = nearestStation.getActionLabel(sState);
        const subPrompt = nearestStation.getSubPrompt(sState);

        const sig = `${nearestStation.id}:${Math.round(screenX)}:${Math.round(screenY)}:${actionLabel}:${subPrompt}`;
        if (sig !== lastPromptBroadcast) {
          lastPromptBroadcast = sig;
          callbacksRef.current.onActivePromptChange({
            stationId: nearestStation.id,
            title: nearestStation.title,
            bengaliTitle: nearestStation.bengaliTitle,
            actionLabel,
            subPrompt,
            screenX,
            screenY,
            visible: _projVec.z < 1,
            distance: minDistance,
          });
        }
      } else {
        activeNearestStationId = null;
        refs.highlightRing.visible = false;
        if (lastPromptBroadcast !== 'none') {
          lastPromptBroadcast = 'none';
          callbacksRef.current.onActivePromptChange(null);
        }
      }

      // E. Broadcast player telemetry periodically (~6 times/sec)
      if (elapsed - lastTelemetryTime > 0.16) {
        lastTelemetryTime = elapsed;
        callbacksRef.current.onPlayerTelemetryChange(
          [
            Number(playerPos.x.toFixed(2)),
            Number(playerPos.y.toFixed(2)),
            Number(playerPos.z.toFixed(2)),
          ],
          collidedLabel
        );
      }

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    frameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      domElem.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      domElem.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      if (domElem.parentNode === container) {
        container.removeChild(domElem);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="relative w-full h-full overflow-hidden cursor-grab active:cursor-grabbing"
      aria-label="Interactive 3D Bangladeshi Cha-er Dokan Viewport"
    />
  );
};
