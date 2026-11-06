import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { useTrip } from '../context/TripContext';
import { Compass, Eye, EyeOff, RotateCcw, Plane, Globe, Sparkles, ZoomIn, ZoomOut, Play, Pause } from 'lucide-react';

// Pre-allocate module-scope scratch math objects to ensure zero GC in animation loop
const _vec3 = new THREE.Vector3();
const _scratchPos = new THREE.Vector3();

// High-fidelity procedural photorealistic Earth texture generator
function createRealisticEarthTextures() {
  const width = 2048;
  const height = 1024;

  // 1. Diffuse / Color Map Canvas
  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = width;
  colorCanvas.height = height;
  const ctx = colorCanvas.getContext('2d')!;

  // Deep Ocean Gradient with bathymetry depth
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, height);
  oceanGrad.addColorStop(0, '#04162e'); // Polar deep
  oceanGrad.addColorStop(0.2, '#062044');
  oceanGrad.addColorStop(0.5, '#082b5c'); // Tropical ocean
  oceanGrad.addColorStop(0.8, '#062044');
  oceanGrad.addColorStop(1, '#04162e');
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, width, height);

  // Ocean wave subtle micro-texture
  ctx.fillStyle = 'rgba(12, 45, 90, 0.4)';
  for (let i = 0; i < 400; i++) {
    const ox = (i * 137.5) % width;
    const oy = (i * 223.1) % height;
    ctx.beginPath();
    ctx.ellipse(ox, oy, 12, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. Specular / Roughness Map Canvas
  // Water is white/shiny (smooth specular), Land is black/matte (rough)
  const specCanvas = document.createElement('canvas');
  specCanvas.width = width;
  specCanvas.height = height;
  const sCtx = specCanvas.getContext('2d')!;
  sCtx.fillStyle = '#ffffff'; // Oceans reflect sunlight
  sCtx.fillRect(0, 0, width, height);

  // Helper to draw realistic landmass with shallow shelf, terrain biomes, and specular masking
  const drawLandmass = (
    points: [number, number][],
    biome: 'temperate' | 'desert' | 'rainforest' | 'tundra' | 'ice',
    elevationShading = true
  ) => {
    if (points.length < 3) return;

    // A. Shallow continental shelf turquoise halo (Bahamas, Great Barrier Reef, etc.)
    ctx.save();
    ctx.fillStyle = 'rgba(6, 182, 212, 0.35)'; // Cyan-turquoise shelf
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i][0], points[i][1]);
    }
    ctx.closePath();
    ctx.lineWidth = 14;
    ctx.strokeStyle = 'rgba(14, 165, 233, 0.3)';
    ctx.stroke();
    ctx.restore();

    // B. Main landmass base color
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i][0], points[i][1]);
    }
    ctx.closePath();

    let landGrad: CanvasGradient;
    const minY = Math.min(...points.map((p) => p[1]));
    const maxY = Math.max(...points.map((p) => p[1]));
    landGrad = ctx.createLinearGradient(0, minY, 0, maxY);

    if (biome === 'rainforest') {
      landGrad.addColorStop(0, '#166534');
      landGrad.addColorStop(0.5, '#14532d'); // Deep Amazon/Congo green
      landGrad.addColorStop(1, '#15803d');
    } else if (biome === 'desert') {
      landGrad.addColorStop(0, '#d97706'); // Sahara / Arabia golden sand
      landGrad.addColorStop(0.5, '#b45309'); // Terracotta rock
      landGrad.addColorStop(1, '#92400e');
    } else if (biome === 'ice') {
      landGrad.addColorStop(0, '#f8fafc'); // Antarctica / Greenland ice
      landGrad.addColorStop(0.5, '#e2e8f0');
      landGrad.addColorStop(1, '#cbd5e1');
    } else if (biome === 'tundra') {
      landGrad.addColorStop(0, '#475569'); // Siberian / Canadian tundra
      landGrad.addColorStop(0.5, '#334155');
      landGrad.addColorStop(1, '#1e293b');
    } else {
      // Temperate
      landGrad.addColorStop(0, '#15803d');
      landGrad.addColorStop(0.4, '#166534');
      landGrad.addColorStop(0.8, '#4d7c0f'); // Olive hills
      landGrad.addColorStop(1, '#1e3a1e');
    }

    ctx.fillStyle = landGrad;
    ctx.fill();

    // Natural mountain ridge topo relief
    if (elevationShading && biome !== 'ice') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.stroke();
    }
    ctx.restore();

    // C. Specular mask (Land is non-reflective / matte)
    sCtx.save();
    sCtx.fillStyle = '#18181b'; // Matte land
    sCtx.beginPath();
    sCtx.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) {
      sCtx.lineTo(points[i][0], points[i][1]);
    }
    sCtx.closePath();
    sCtx.fill();
    sCtx.restore();
  };

  // Convert Lon [-180..180], Lat [90..-90] to canvas (x, y)
  const toXY = (lon: number, lat: number): [number, number] => {
    const x = ((lon + 180) / 360) * width;
    const y = ((90 - lat) / 180) * height;
    return [Math.round(x), Math.round(y)];
  };

  // 1. North America (Alaska, Canada, USA, Mexico, Central America)
  drawLandmass(
    [
      toXY(-168, 65), toXY(-140, 70), toXY(-130, 68), toXY(-95, 72), toXY(-80, 62),
      toXY(-60, 50), toXY(-65, 44), toXY(-75, 35), toXY(-80, 25), toXY(-81, 25),
      toXY(-85, 30), toXY(-90, 29), toXY(-97, 26), toXY(-88, 16), toXY(-84, 10),
      toXY(-78, 8), toXY(-82, 9), toXY(-90, 14), toXY(-105, 20), toXY(-110, 23),
      toXY(-115, 32), toXY(-124, 38), toXY(-124, 48), toXY(-130, 54), toXY(-145, 60),
      toXY(-165, 60),
    ],
    'temperate'
  );

  // Florida Peninsula
  drawLandmass(
    [toXY(-82, 30), toXY(-80, 25), toXY(-81, 24), toXY(-83, 28)],
    'temperate'
  );

  // Greenland Ice Sheet
  drawLandmass(
    [toXY(-50, 82), toXY(-20, 80), toXY(-25, 70), toXY(-45, 60), toXY(-55, 70)],
    'ice'
  );

  // 2. South America (Colombia, Brazil, Amazon, Andes, Patagonia)
  drawLandmass(
    [
      toXY(-77, 8), toXY(-60, 10), toXY(-50, -1), toXY(-35, -5), toXY(-38, -13),
      toXY(-42, -22), toXY(-50, -30), toXY(-55, -38), toXY(-65, -45), toXY(-68, -54),
      toXY(-74, -52), toXY(-73, -40), toXY(-71, -30), toXY(-76, -15), toXY(-80, -3),
    ],
    'rainforest'
  );

  // Andes Mountain Crest
  drawLandmass(
    [toXY(-72, -10), toXY(-69, -22), toXY(-70, -35), toXY(-72, -35), toXY(-74, -20)],
    'temperate'
  );

  // 3. Europe & Scandinavia
  drawLandmass(
    [
      toXY(-9, 36), toXY(-9, 43), toXY(0, 44), toXY(-4, 48), toXY(2, 51),
      toXY(8, 54), toXY(5, 58), toXY(5, 62), toXY(15, 65), toXY(28, 70),
      toXY(35, 65), toXY(30, 58), toXY(22, 54), toXY(14, 45), toXY(16, 40),
      toXY(12, 37), toXY(20, 37), toXY(24, 35), toXY(26, 40), toXY(16, 41),
      toXY(5, 43), toXY(-2, 37),
    ],
    'temperate'
  );

  // British Isles & Ireland
  drawLandmass(
    [toXY(-5, 50), toXY(1, 51), toXY(0, 58), toXY(-5, 58), toXY(-3, 54)],
    'temperate'
  );
  drawLandmass(
    [toXY(-10, 52), toXY(-6, 52), toXY(-6, 55), toXY(-10, 54)],
    'temperate'
  );

  // 4. Africa (Sahara, Nile, Congo, South Africa, Madagascar)
  // North Africa / Sahara
  drawLandmass(
    [
      toXY(-15, 30), toXY(10, 37), toXY(25, 32), toXY(34, 31), toXY(32, 24),
      toXY(43, 12), toXY(51, 12), toXY(42, 3), toXY(10, 5), toXY(-15, 12),
    ],
    'desert'
  );

  // Central & Sub-Saharan Africa
  drawLandmass(
    [
      toXY(-15, 12), toXY(10, 5), toXY(42, 3), toXY(40, -10), toXY(35, -25),
      toXY(28, -34), toXY(18, -34), toXY(12, -18), toXY(9, 2), toXY(0, 6),
    ],
    'rainforest'
  );

  // Madagascar
  drawLandmass(
    [toXY(44, -12), toXY(50, -15), toXY(48, -25), toXY(44, -25)],
    'rainforest'
  );

  // 5. Asia (Arabia, India, Russia/Siberia, China, Southeast Asia)
  // Arabian Peninsula
  drawLandmass(
    [toXY(35, 30), toXY(55, 25), toXY(60, 22), toXY(55, 15), toXY(45, 12), toXY(40, 20)],
    'desert'
  );

  // India Peninsula
  drawLandmass(
    [toXY(68, 25), toXY(75, 30), toXY(88, 24), toXY(82, 16), toXY(78, 8), toXY(73, 16)],
    'temperate'
  );

  // Eurasia (Siberia, China, Central Asia)
  drawLandmass(
    [
      toXY(30, 58), toXY(60, 68), toXY(90, 75), toXY(130, 72), toXY(170, 65),
      toXY(145, 50), toXY(130, 42), toXY(120, 32), toXY(110, 20), toXY(100, 10),
      toXY(103, 1), toXY(98, 8), toXY(92, 22), toXY(75, 30), toXY(60, 38),
      toXY(50, 40), toXY(40, 48),
    ],
    'temperate'
  );

  // Japan Archipelago
  drawLandmass(
    [toXY(130, 32), toXY(135, 35), toXY(141, 42), toXY(145, 44), toXY(140, 36), toXY(131, 31)],
    'temperate'
  );

  // Southeast Asian Islands (Indonesia, Philippines)
  drawLandmass(
    [toXY(95, 5), toXY(105, 0), toXY(118, -8), toXY(115, -9), toXY(100, -2)],
    'rainforest'
  );
  drawLandmass(
    [toXY(120, 15), toXY(126, 12), toXY(125, 7), toXY(121, 9)],
    'rainforest'
  );

  // 6. Australia & New Zealand
  drawLandmass(
    [
      toXY(114, -22), toXY(128, -15), toXY(142, -11), toXY(152, -24), toXY(150, -36),
      toXY(138, -36), toXY(135, -34), toXY(118, -35), toXY(114, -28),
    ],
    'desert'
  );

  // Great Barrier Reef Cyan Lagoon
  ctx.save();
  ctx.strokeStyle = 'rgba(6, 182, 212, 0.55)';
  ctx.lineWidth = 10;
  ctx.beginPath();
  const [rx1, ry1] = toXY(142, -11);
  const [rx2, ry2] = toXY(152, -24);
  ctx.moveTo(rx1, ry1);
  ctx.lineTo(rx2, ry2);
  ctx.stroke();
  ctx.restore();

  // New Zealand North & South Islands
  drawLandmass([toXY(173, -35), toXY(178, -38), toXY(175, -41)], 'temperate');
  drawLandmass([toXY(167, -42), toXY(173, -42), toXY(170, -46)], 'temperate');

  // 7. Antarctica (Massive Southern Ice Sheet)
  drawLandmass(
    [
      toXY(-180, -70), toXY(-120, -74), toXY(-60, -65), toXY(-55, -63), toXY(-50, -74),
      toXY(0, -68), toXY(60, -65), toXY(120, -66), toXY(180, -70), toXY(180, -90),
      toXY(-180, -90),
    ],
    'ice',
    false
  );

  // Mountain ridges and snow caps (Himalayas, Alps, Rockies)
  ctx.fillStyle = '#ffffff';
  // Himalayas
  const [hx, hy] = toXY(85, 28);
  ctx.beginPath();
  ctx.ellipse(hx, hy, 35, 7, -0.3, 0, Math.PI * 2);
  ctx.fill();

  // Alps
  const [ax, ay] = toXY(10, 46);
  ctx.beginPath();
  ctx.ellipse(ax, ay, 16, 5, 0.2, 0, Math.PI * 2);
  ctx.fill();

  // Rockies
  const [rkx, rky] = toXY(-112, 44);
  ctx.beginPath();
  ctx.ellipse(rkx, rky, 14, 45, 0.3, 0, Math.PI * 2);
  ctx.fill();

  // Subtle night city lights overlay on populated areas
  ctx.fillStyle = 'rgba(254, 240, 138, 0.35)'; // Amber-gold city light dots
  const cityDots: [number, number][] = [
    toXY(-74, 40), toXY(-87, 41), toXY(-118, 34), toXY(-122, 37), // US
    toXY(-0.1, 51.5), toXY(2.35, 48.8), toXY(13.4, 52.5), toXY(12.5, 41.9), // Europe
    toXY(77.2, 28.6), toXY(72.8, 19.1), // India
    toXY(116.4, 39.9), toXY(121.5, 31.2), toXY(139.7, 35.7), // East Asia / Tokyo
    toXY(151.2, -33.8), toXY(144.9, -37.8), // Australia
  ];
  cityDots.forEach(([cx, cy]) => {
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, Math.PI * 2);
    ctx.fill();
  });

  // 3. Clouds Canvas (2048 x 1024) with realistic trade-wind swirls & cyclonic systems
  const cloudCanvas = document.createElement('canvas');
  cloudCanvas.width = width;
  cloudCanvas.height = height;
  const cCtx = cloudCanvas.getContext('2d')!;
  cCtx.fillStyle = 'rgba(0, 0, 0, 0)';
  cCtx.fillRect(0, 0, width, height);

  // ITCZ Equatorial Trade-Wind Cloud Belt
  cCtx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  for (let i = 0; i < 180; i++) {
    const cx = (i * 24.3) % width;
    const cy = 480 + Math.sin(i * 0.4) * 45;
    cCtx.beginPath();
    cCtx.ellipse(cx, cy, 40 + (i % 30), 16 + (i % 10), Math.sin(i), 0, Math.PI * 2);
    cCtx.fill();
  }

  // Northern Mid-Latitude Weather Fronts & Cyclones (Atlantic & Pacific)
  const drawCyclone = (centerLon: number, centerLat: number, radius: number) => {
    const [ccx, ccy] = toXY(centerLon, centerLat);
    for (let a = 0; a < 8; a++) {
      const angle = (a / 8) * Math.PI * 2;
      const r = (a / 8) * radius;
      cCtx.fillStyle = `rgba(255, 255, 255, ${0.4 - a * 0.03})`;
      cCtx.beginPath();
      cCtx.ellipse(
        ccx + Math.cos(angle) * r,
        ccy + Math.sin(angle) * r * 0.5,
        radius * 0.4,
        radius * 0.2,
        angle,
        0,
        Math.PI * 2
      );
      cCtx.fill();
    }
  };

  drawCyclone(-40, 52, 110); // North Atlantic depression
  drawCyclone(-155, 48, 120); // North Pacific storm
  drawCyclone(80, -55, 130); // Southern Ocean roaring 40s front
  drawCyclone(130, 25, 90); // Western Pacific tropical vortex

  // Wispy cirrus bands in polar jet streams
  cCtx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  for (let i = 0; i < 120; i++) {
    const px = (i * 35.7) % width;
    const py = 160 + ((i * 19) % 180);
    cCtx.beginPath();
    cCtx.ellipse(px, py, 60, 10, 0.15, 0, Math.PI * 2);
    cCtx.fill();
  }

  return { colorCanvas, specCanvas, cloudCanvas };
}

export const ThreeDExplorer: React.FC = () => {
  const { activeTrip } = useTrip();
  const mountRef = useRef<HTMLDivElement>(null);

  // Bottom dock state
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [rotationSpeed, setRotationSpeed] = useState<number>(1);
  const [isRotating, setIsRotating] = useState<boolean>(true);
  const [cloudsVisible, setCloudsVisible] = useState(true);
  const [showFlightPath, setShowFlightPath] = useState(true);
  const [zoomDistance, setZoomDistance] = useState<number>(18);

  // Interactive Drag & Momentum state ref
  const interactionRef = useRef({
    isPointerDown: false,
    startX: 0,
    startY: 0,
    targetRotationY: 0,
    targetRotationX: 0.15,
    currentRotationY: 0,
    currentRotationX: 0.15,
    dragVelocityY: 0,
    dragVelocityX: 0,
    rotationSpeed: 1,
    isRotating: true,
    cloudsVisible: true,
    showFlightPath: true,
    zoomDistance: 18,
    targetZoomDistance: 18,
  });

  useEffect(() => {
    interactionRef.current.rotationSpeed = rotationSpeed;
    interactionRef.current.isRotating = isRotating;
    interactionRef.current.cloudsVisible = cloudsVisible;
    interactionRef.current.showFlightPath = showFlightPath;
  }, [rotationSpeed, isRotating, cloudsVisible, showFlightPath]);

  useEffect(() => {
    interactionRef.current.targetZoomDistance = zoomDistance;
  }, [zoomDistance]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect software WebGL as mandated by Three.js skill
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight - 80;

    // 1. Renderer Setup
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // 2. Scene & Deep Space Background
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 3, 18);

    // Deep space realistic starfield
    const starGeo = new THREE.BufferGeometry();
    const starCount = isSoftwareGl ? 800 : 2500;
    const starPos = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const dist = 120 + Math.random() * 80;

      starPos[i * 3] = dist * Math.sin(phi) * Math.cos(theta);
      starPos[i * 3 + 1] = dist * Math.sin(phi) * Math.sin(theta);
      starPos[i * 3 + 2] = dist * Math.cos(phi);

      // Star color temperatures: cool blue, warm golden, bright white
      const colorType = Math.random();
      if (colorType > 0.8) {
        starColors[i * 3] = 0.6; starColors[i * 3 + 1] = 0.8; starColors[i * 3 + 2] = 1.0;
      } else if (colorType > 0.5) {
        starColors[i * 3] = 1.0; starColors[i * 3 + 1] = 0.9; starColors[i * 3 + 2] = 0.7;
      } else {
        starColors[i * 3] = 0.9; starColors[i * 3 + 1] = 0.95; starColors[i * 3 + 2] = 1.0;
      }
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
    const starMat = new THREE.PointsMaterial({
      size: 1.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
    });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // PMREM Studio Environment
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 3. Balanced Sunlight Rig (Simulating Sun in space)
    const sunLight = new THREE.DirectionalLight(0xfffaed, 3.2);
    sunLight.position.set(15, 12, 14);
    sunLight.castShadow = !isSoftwareGl;
    scene.add(sunLight);

    const spaceAmbient = new THREE.AmbientLight(0x0a192f, 0.4);
    scene.add(spaceAmbient);

    // Subtle blue Earthshine bounce
    const earthshine = new THREE.DirectionalLight(0x1e3a8a, 1.2);
    earthshine.position.set(-15, -6, -10);
    scene.add(earthshine);

    // 4. Generate High-Res Photorealistic Earth Textures
    const { colorCanvas, specCanvas, cloudCanvas } = createRealisticEarthTextures();

    const earthColorTex = new THREE.CanvasTexture(colorCanvas);
    earthColorTex.colorSpace = THREE.SRGBColorSpace;
    earthColorTex.anisotropy = renderer.capabilities.getMaxAnisotropy();

    const earthSpecTex = new THREE.CanvasTexture(specCanvas);
    earthSpecTex.colorSpace = THREE.NoColorSpace;

    const cloudTex = new THREE.CanvasTexture(cloudCanvas);
    cloudTex.colorSpace = THREE.SRGBColorSpace;

    // 5. Composite Procedural Earth Group (Pivot Root)
    const earthSystemGroup = new THREE.Group();
    scene.add(earthSystemGroup);

    // Part 1: Core Earth Sphere with Specular Ocean Reflection
    const earthRadius = 6.0;
    const earthGeo = new THREE.SphereGeometry(earthRadius, isSoftwareGl ? 36 : 64, isSoftwareGl ? 28 : 48);
    const earthMat = new THREE.MeshStandardMaterial({
      map: earthColorTex,
      roughness: 0.65,
      roughnessMap: earthSpecTex, // Water = mirror-like, Land = matte
      metalness: 0.15,
      metalnessMap: earthSpecTex,
      emissive: new THREE.Color(0x020a17),
      emissiveIntensity: 0.15,
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    earthMesh.receiveShadow = !isSoftwareGl;
    earthMesh.castShadow = !isSoftwareGl;
    earthSystemGroup.add(earthMesh);

    // Part 2: Realistic Rayleigh Atmospheric Rim Glow (Custom Fresnel Shader)
    const atmoRadius = earthRadius * 1.025;
    const atmoGeo = new THREE.SphereGeometry(atmoRadius, 48, 36);
    const atmoMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vec3 viewDir = normalize(-vPosition);
          float fresnel = 1.0 - max(dot(viewDir, vNormal), 0.0);
          float intensity = pow(fresnel, 3.2) * 1.35;
          // Space cyan Rayleigh atmospheric glow
          vec3 atmoColor = vec3(0.22, 0.68, 1.0);
          gl_FragColor = vec4(atmoColor, intensity);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      depthWrite: false,
    });
    const atmoMesh = new THREE.Mesh(atmoGeo, atmoMat);
    earthSystemGroup.add(atmoMesh);

    // Part 3: Outer Swirling Cloud Layer
    const cloudRadius = earthRadius * 1.018;
    const cloudGeo = new THREE.SphereGeometry(cloudRadius, 48, 36);
    const cloudMat = new THREE.MeshStandardMaterial({
      map: cloudTex,
      transparent: true,
      opacity: 0.72,
      roughness: 0.95,
      metalness: 0.0,
      depthWrite: false,
    });
    const cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
    earthSystemGroup.add(cloudMesh);

    // Part 4: Dynamic Travel Waypoint Pins on Real Coordinates
    const pinGroup = new THREE.Group();
    earthSystemGroup.add(pinGroup);

    // Pin generator based on genuine Lat/Lng
    const addPin = (name: string, lat: number, lng: number, colorHex: number) => {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lng + 180) * (Math.PI / 180);
      const rad = earthRadius + 0.12;

      const px = -(rad * Math.sin(phi) * Math.cos(theta));
      const pz = rad * Math.sin(phi) * Math.sin(theta);
      const py = rad * Math.cos(phi);

      const stemGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.65, 8);
      const stemMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.8, roughness: 0.2 });
      const stem = new THREE.Mesh(stemGeo, stemMat);

      const headGeo = new THREE.OctahedronGeometry(0.24, 0);
      const headMat = new THREE.MeshStandardMaterial({
        color: colorHex,
        emissive: new THREE.Color(colorHex),
        emissiveIntensity: 0.75,
        roughness: 0.2,
      });
      const head = new THREE.Mesh(headGeo, headMat);
      head.position.y = 0.38;

      const singlePin = new THREE.Group();
      singlePin.add(stem);
      singlePin.add(head);
      singlePin.position.set(px, py, pz);
      singlePin.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), singlePin.position.clone().normalize());

      pinGroup.add(singlePin);
    };

    // Add trip pins dynamically
    const destCoords = activeTrip.itinerary?.days?.[0]?.morning?.coordinates || { lat: 21.3, lng: -157.85 };
    if (activeTrip.destination) {
      addPin(activeTrip.destination, destCoords.lat, destCoords.lng, 0x38bdf8);
    }
    if (activeTrip.origin) {
      addPin(activeTrip.origin, 37.77, -122.41, 0x22c55e);
    }
    // Global sample anchors if empty
    addPin('Tokyo', 35.67, 139.65, 0xf59e0b);
    addPin('Rome', 41.9, 12.5, 0xa855f7);
    addPin('Honolulu', 21.3, -157.85, 0x06b6d4);

    // Part 5: Procedural Airplane on Orbital Flight Arc
    const airplaneGroup = new THREE.Group();
    const planeFuselageGeo = new THREE.ConeGeometry(0.2, 1.2, 8);
    planeFuselageGeo.rotateX(Math.PI / 2);
    const planeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.7, roughness: 0.3 });
    const planeFuselage = new THREE.Mesh(planeFuselageGeo, planeMat);
    airplaneGroup.add(planeFuselage);

    const wingGeo = new THREE.BoxGeometry(1.6, 0.04, 0.35);
    const wingMesh = new THREE.Mesh(wingGeo, planeMat);
    airplaneGroup.add(wingMesh);
    scene.add(airplaneGroup);

    // Orbital Flight Path Curve
    const flightPoints: THREE.Vector3[] = [];
    const arcRadius = earthRadius + 1.2;
    for (let t = 0; t <= 36; t++) {
      const angle = (t / 36) * Math.PI * 0.95;
      const x = Math.cos(angle) * arcRadius;
      const y = Math.sin(angle) * 3.2 + 2;
      const z = Math.sin(angle) * arcRadius * 0.85;
      flightPoints.push(new THREE.Vector3(x, y, z));
    }
    const flightCurve = new THREE.CatmullRomCurve3(flightPoints);
    const flightGeo = new THREE.TubeGeometry(flightCurve, 48, 0.04, 8, false);
    const flightMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.7 });
    const flightMesh = new THREE.Mesh(flightGeo, flightMat);
    scene.add(flightMesh);

    // 6. Interactive Touch & Pointer Swipe Drag Listeners
    let lastPointerX = 0;
    let lastPointerY = 0;

    const onPointerDown = (e: PointerEvent) => {
      interactionRef.current.isPointerDown = true;
      lastPointerX = e.clientX;
      lastPointerY = e.clientY;
      renderer.domElement.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!interactionRef.current.isPointerDown) return;
      const dx = e.clientX - lastPointerX;
      const dy = e.clientY - lastPointerY;
      lastPointerX = e.clientX;
      lastPointerY = e.clientY;

      const dragSensitivity = 0.005;
      interactionRef.current.targetRotationY += dx * dragSensitivity;
      interactionRef.current.targetRotationX += dy * dragSensitivity;

      // Clamp vertical polar angle to avoid gimbal flips
      interactionRef.current.targetRotationX = Math.max(-1.2, Math.min(1.2, interactionRef.current.targetRotationX));

      interactionRef.current.dragVelocityY = dx * dragSensitivity;
      interactionRef.current.dragVelocityX = dy * dragSensitivity;
    };

    const onPointerUp = (e: PointerEvent) => {
      interactionRef.current.isPointerDown = false;
      try {
        renderer.domElement.releasePointerCapture(e.pointerId);
      } catch (err) {
        // Safe catch
      }
    };

    // Zoom via Wheel
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomStep = e.deltaY * 0.015;
      setZoomDistance((prev) => Math.max(9, Math.min(28, prev + zoomStep)));
    };

    const dom = renderer.domElement;
    dom.addEventListener('pointerdown', onPointerDown);
    dom.addEventListener('pointermove', onPointerMove);
    dom.addEventListener('pointerup', onPointerUp);
    dom.addEventListener('pointercancel', onPointerUp);
    dom.addEventListener('wheel', onWheel, { passive: false });

    // 7. Lossless Animation Loop with Damped Interaction Physics
    let frameId = 0;
    const clock = new THREE.Clock();
    let flightProgress = 0;

    function afterDraw(cb: () => void) {
      const glCtx = renderer.getContext() as WebGL2RenderingContext;
      const sync = glCtx.fenceSync(glCtx.SYNC_GPU_COMMANDS_COMPLETE, 0);
      glCtx.flush();
      const poll = () => {
        const state = sync && glCtx.getSyncParameter(sync, glCtx.SYNC_STATUS);
        if (state === glCtx.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          glCtx.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      const delta = clock.getDelta();
      const state = interactionRef.current;

      // Auto rotation when not actively swiping
      if (state.isRotating && !state.isPointerDown) {
        state.targetRotationY += delta * 0.16 * state.rotationSpeed;
      }

      // Smooth damped rotation interpolation
      const damp = 1 - Math.exp(-10 * delta);
      state.currentRotationY += (state.targetRotationY - state.currentRotationY) * damp;
      state.currentRotationX += (state.targetRotationX - state.currentRotationX) * damp;

      earthSystemGroup.rotation.y = state.currentRotationY;
      earthSystemGroup.rotation.x = state.currentRotationX;

      // Clouds rotate slightly faster for realistic atmospheric jet stream
      cloudMesh.rotation.y = state.currentRotationY * 1.15;
      cloudMesh.visible = state.cloudsVisible;

      // Camera distance interpolation
      const currentDist = camera.position.length();
      const targetDist = state.targetZoomDistance;
      const newDist = currentDist + (targetDist - currentDist) * damp;
      camera.position.setLength(newDist);
      camera.lookAt(0, 0, 0);

      // Animate flight along curve
      flightMesh.visible = state.showFlightPath;
      airplaneGroup.visible = state.showFlightPath;
      if (state.showFlightPath) {
        flightProgress = (flightProgress + delta * 0.12 * state.rotationSpeed) % 1;
        const curPoint = flightCurve.getPointAt(flightProgress);
        const nextPoint = flightCurve.getPointAt((flightProgress + 0.02) % 1);
        airplaneGroup.position.copy(curPoint);
        airplaneGroup.lookAt(nextPoint);
      }

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    if (isSoftwareGl) {
      afterDraw(tick);
    } else {
      frameId = requestAnimationFrame(tick);
    }

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', handleResize);
      dom.removeEventListener('pointerdown', onPointerDown);
      dom.removeEventListener('pointermove', onPointerMove);
      dom.removeEventListener('pointerup', onPointerUp);
      dom.removeEventListener('pointercancel', onPointerUp);
      dom.removeEventListener('wheel', onWheel);
      renderer.dispose();
      earthColorTex.dispose();
      earthSpecTex.dispose();
      cloudTex.dispose();
      if (container && renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [activeTrip.origin, activeTrip.destination]);

  return (
    <div className="relative w-full h-[calc(100vh-80px)] min-h-[550px] bg-slate-950 overflow-hidden flex flex-col items-center justify-between">
      {/* 3D WebGL Canvas Mount Container (Touch & drag enabled) */}
      <div
        ref={mountRef}
        className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing touch-none select-none"
      />

      {/* Top Spec & Live Navigation Banner */}
      <div className="relative z-10 w-full px-6 pt-5 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-3 bg-slate-900/85 border border-slate-800 rounded-xl px-4 py-2 pointer-events-auto backdrop-blur-md shadow-2xl">
          <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-sm">
            <Globe className="w-4 h-4 animate-spin-slow" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider font-semibold text-blue-400">Photorealistic 3D Earth</div>
            <div className="text-sm font-bold text-white flex items-center gap-2">
              <span>{activeTrip.origin || 'Any Origin'}</span>
              <span className="text-blue-400">✈</span>
              <span>{activeTrip.destination || 'Global Explorer'}</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/85 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 pointer-events-auto hidden sm:flex items-center gap-2 backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>Interactive Swipe Rotation • NASA Biome Textures</span>
        </div>
      </div>

      {/* Interactive Swipe Prompt Pill */}
      <div className="relative z-10 pointer-events-none text-center bg-slate-900/60 backdrop-blur-sm border border-slate-800/80 px-4 py-1.5 rounded-full text-xs text-slate-300 shadow-lg">
        Drag or swipe anywhere to spin Earth • Scroll to zoom
      </div>

      {/* Unified Bottom Control Dock */}
      <div className="relative z-20 mb-5 max-w-[940px] w-[94vw] flex flex-col items-center">
        {/* Collapse / Expand Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="mb-1.5 px-3 py-1 bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-700/80 rounded-full text-xs font-medium flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
        >
          {isCollapsed ? (
            <>
              <Eye className="w-3.5 h-3.5 text-blue-400" />
              <span>Show Controls</span>
            </>
          ) : (
            <>
              <EyeOff className="w-3.5 h-3.5 text-slate-400" />
              <span>Minimize Dock</span>
            </>
          )}
        </button>

        {/* Dock Content */}
        {!isCollapsed && (
          <div className="w-full bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Play/Pause Rotation & Speed Controls */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsRotating(!isRotating)}
                className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  isRotating
                    ? 'bg-blue-600 hover:bg-blue-500 text-white'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                {isRotating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isRotating ? 'Rotating' : 'Paused'}</span>
              </button>

              <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl p-1">
                {[0.5, 1, 2].map((spd) => (
                  <button
                    key={spd}
                    onClick={() => setRotationSpeed(spd)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      rotationSpeed === spd
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            </div>

            {/* Visual Layers Toggles */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCloudsVisible(!cloudsVisible)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  cloudsVisible
                    ? 'bg-blue-950/80 border-blue-500/50 text-blue-300'
                    : 'bg-slate-950 border-slate-800 text-slate-500'
                }`}
              >
                <span>Atmospheric Clouds</span>
              </button>

              <button
                onClick={() => setShowFlightPath(!showFlightPath)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  showFlightPath
                    ? 'bg-indigo-950/80 border-indigo-500/50 text-indigo-300'
                    : 'bg-slate-950 border-slate-800 text-slate-500'
                }`}
              >
                <Plane className="w-3.5 h-3.5" />
                <span>Flight Path</span>
              </button>
            </div>

            {/* Quick Zoom Actions */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setZoomDistance((z) => Math.max(9, z - 2.5))}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => setZoomDistance((z) => Math.min(28, z + 2.5))}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  interactionRef.current.targetRotationX = 0.15;
                  interactionRef.current.targetRotationY = 0;
                  setZoomDistance(18);
                }}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1 text-xs transition-colors cursor-pointer"
                title="Reset View"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
