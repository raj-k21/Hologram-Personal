import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { VisualType } from '../types';
import { Play, Pause, ChevronLeft, ChevronRight, Shuffle, MonitorPlay } from 'lucide-react';

interface HologramVisualsProps {
  currentVisual: VisualType;
  colorPreset: 'cyan' | 'red' | 'purple' | 'green' | 'amber';
  glow: number;
  onVisualChange: (visual: VisualType) => void;
  audioSensitivity: number;
  audioBassResponse: number;
  audioReactionSource: 'microphone' | 'procedural';
  isIdle?: boolean;
}

// Visual catalog list
const visualsCatalog: Array<{ type: VisualType; label: string; desc: string }> = [
  { type: 'vortex', label: 'Neon Particle Vortex', desc: 'A swirling energetic funnel of glowing cosmic points.' },
  { type: 'core', label: 'Rotating Energy Core', desc: 'Nested technological rings surrounding a burning central power source.' },
  { type: 'tunnel', label: 'Cyberpunk Wire Tunnel', desc: 'Endless high-speed vector wireframe tunnel traversal.' },
  { type: 'helix', label: 'Floating DNA Helix', desc: 'A double-helix chemical chain of rotating neon indicators.' },
  { type: 'grid', label: 'Sci-Fi Hologram Grid', desc: 'A digital landscape terrain waving dynamically in 3D space.' },
  { type: 'matrix', label: 'Matrix Code Rain', desc: 'Streaming columns of glowing matrix code letters.' },
  { type: 'galaxy', label: 'Galaxy Spiral Network', desc: 'Vibrant galactic star arms revolving around an event horizon.' },
  { type: 'synth', label: 'Ambient Wave Synth', desc: 'Soundwave terrain model responding dynamically to frequency pulses.' },
  { type: 'wireframe', label: 'Geodesic Wire Sphere', desc: 'High-tech rotating orbital wireframe sphere of vector hubs.' },
  { type: 'geometric', label: 'Infinite Math Patterns', desc: 'Shifting fractal coordinate grids executing procedurally.' },
  { type: 'cube', label: 'Rotating Hyper Cube', desc: 'Double-nested 3D wireframe cube rotating across multi-dimensional axes.' },
  { type: 'earth', label: 'Planet Earth Globe', desc: 'Point-cloud holographic sphere illustrating coordinate continent maps.' },
  { type: 'solar', label: 'Holographic Solar System', desc: 'A nested arrangement of planets orbiting a central sun flare.' },
];

export default function HologramVisuals({
  currentVisual,
  colorPreset,
  glow,
  onVisualChange,
  audioSensitivity,
  audioBassResponse,
  audioReactionSource,
  isIdle = false,
}: HologramVisualsProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Audio reactive Web Audio states/refs
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const [micActive, setMicActive] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [customSpeed, setCustomSpeed] = useState<number>(1.0); // Speed scales

  // Microphone lifecycle hook
  useEffect(() => {
    if (audioReactionSource === 'microphone') {
      let active = true;
      const initMic = async () => {
        try {
          if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error("Audio capture devices not supported in this client environment.");
          }

          const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
          if (!active) {
            stream.getTracks().forEach(track => track.stop());
            return;
          }

          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          const ctx = new AudioContextClass();
          const source = ctx.createMediaStreamSource(stream);
          const analyser = ctx.createAnalyser();
          
          analyser.fftSize = 128; // compact bin sizes for performance
          const bufferLength = analyser.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);
          
          source.connect(analyser);
          
          audioContextRef.current = ctx;
          analyserRef.current = analyser;
          dataArrayRef.current = dataArray;
          mediaStreamRef.current = stream;
          setMicActive(true);
          setMicError(null);
        } catch (err: any) {
          console.warn("Microphone access failed for visualizer: ", err.message || err);
          setMicError(err.message || "Access Denied");
          setMicActive(false);
        }
      };

      initMic();

      return () => {
        active = false;
        setMicActive(false);
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach(track => track.stop());
          mediaStreamRef.current = null;
        }
        if (audioContextRef.current) {
          audioContextRef.current.close().catch(() => {});
          audioContextRef.current = null;
        }
        analyserRef.current = null;
        dataArrayRef.current = null;
      };
    } else {
      setMicActive(false);
      setMicError(null);
    }
  }, [audioReactionSource]);

  // Map theme preset to solid codes
  const getColorHex = (preset = colorPreset) => {
    switch (preset) {
      case 'cyan': return 0x22d3ee;
      case 'red': return 0xef4444;
      case 'purple': return 0xa855f7;
      case 'green': return 0x22c55e;
      case 'amber': return 0xf59e0b;
      default: return 0x22d3ee;
    }
  };

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    
    // WebGL Config
    let width = containerRef.current.clientWidth || window.innerWidth;
    let height = containerRef.current.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    
    // Add atmospheric black backgrounds
    scene.background = new THREE.Color(0x000000);

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.z = 25;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);

    // Track active scene geometries for complete cleanups
    let activeGroup = new THREE.Group();
    scene.add(activeGroup);

    let materialsToDispose: THREE.Material[] = [];
    let geometriesToDispose: THREE.BufferGeometry[] = [];

    const registerAsset = (geom: THREE.BufferGeometry, mat: THREE.Material) => {
      geometriesToDispose.push(geom);
      materialsToDispose.push(mat);
    };

    // Construct selected Visual geometry
    const activeColor = getColorHex();

    const rebuildScene = () => {
      // Clean up previous structures
      while (activeGroup.children.length > 0) {
        const obj = activeGroup.children[0];
        activeGroup.remove(obj);
      }
      geometriesToDispose.forEach(g => g.dispose());
      materialsToDispose.forEach(m => m.dispose());
      geometriesToDispose = [];
      materialsToDispose = [];

      // Add lights
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
      activeGroup.add(ambientLight);

      const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
      dirLight.position.set(5, 10, 7);
      activeGroup.add(dirLight);

      const primaryMatColor = new THREE.Color(activeColor);

      switch (currentVisual) {
        case 'vortex': {
          // Neon Particle Vortex
          const count = 3000;
          const geom = new THREE.BufferGeometry();
          const positions = new Float32Array(count * 3);
          const colors = new Float32Array(count * 3);

          const endColor = new THREE.Color(0x000000);

          for (let i = 0; i < count; i++) {
            const ratio = i / count;
            const theta = ratio * Math.PI * 150; // Swirl turns
            const radius = ratio * 12 + 0.5;
            const y = (ratio - 0.5) * 16;

            const x = Math.cos(theta) * radius + (Math.random() - 0.5) * 0.3;
            const z = Math.sin(theta) * radius + (Math.random() - 0.5) * 0.3;

            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;

            // Gradient fade to black
            const lerpColor = primaryMatColor.clone().lerp(endColor, 1 - ratio);
            colors[i * 3] = lerpColor.r;
            colors[i * 3 + 1] = lerpColor.g;
            colors[i * 3 + 2] = lerpColor.b;
          }

          geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
          geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));

          const mat = new THREE.PointsMaterial({
            size: 0.12,
            vertexColors: true,
            transparent: true,
            opacity: 0.85,
          });

          const points = new THREE.Points(geom, mat);
          activeGroup.add(points);
          registerAsset(geom, mat);
          break;
        }

        case 'core': {
          // Rotating Energy Core: Nested glowing toruses and wireframe spheres
          const ringGeom1 = new THREE.TorusGeometry(8, 0.1, 16, 100);
          const ringGeom2 = new THREE.TorusGeometry(6, 0.08, 16, 100);
          const ringGeom3 = new THREE.TorusGeometry(4, 0.05, 16, 100);
          const centerGeom = new THREE.SphereGeometry(2, 24, 24);

          const ringMat = new THREE.MeshBasicMaterial({
            color: primaryMatColor,
            wireframe: true,
            transparent: true,
            opacity: 0.8,
          });

          const coreColorMat = new THREE.MeshBasicMaterial({
            color: primaryMatColor,
            wireframe: true,
            transparent: true,
            opacity: 0.45,
          });

          const r1 = new THREE.Mesh(ringGeom1, ringMat);
          const r2 = new THREE.Mesh(ringGeom2, ringMat);
          const r3 = new THREE.Mesh(ringGeom3, ringMat);
          const coreSphere = new THREE.Mesh(centerGeom, coreColorMat);

          r1.rotation.x = Math.PI / 2;
          r2.rotation.y = Math.PI / 4;
          r3.rotation.z = Math.PI / 6;

          activeGroup.add(r1, r2, r3, coreSphere);

          // Register
          registerAsset(ringGeom1, ringMat);
          registerAsset(ringGeom2, ringMat);
          registerAsset(ringGeom3, ringMat);
          registerAsset(centerGeom, coreColorMat);
          break;
        }

        case 'tunnel': {
          // Cyberpunk Wireframe Tunnel
          const tunnelCount = 18;
          const ringGeom = new THREE.TorusGeometry(7, 0.08, 8, 48);
          const ringMat = new THREE.MeshBasicMaterial({
            color: primaryMatColor,
            wireframe: true,
            transparent: true,
            opacity: 0.7,
          });

          for (let i = 0; i < tunnelCount; i++) {
            const rMesh = new THREE.Mesh(ringGeom, ringMat);
            rMesh.position.z = -((i * 3.5) % 60);
            activeGroup.add(rMesh);
          }

          registerAsset(ringGeom, ringMat);
          break;
        }

        case 'helix': {
          // Floating DNA Helix Particle Chains
          const pointsCount = 400;
          const geom = new THREE.BufferGeometry();
          const positions = new Float32Array(pointsCount * 3);

          for (let i = 0; i < pointsCount; i++) {
            const ratio = i / pointsCount;
            const t = ratio * Math.PI * 8; // spiral
            const radius = 3.5;

            // We alternate branches of DNA
            const angleOffset = i % 2 === 0 ? 0 : Math.PI;

            positions[i * 3] = Math.cos(t + angleOffset) * radius;
            positions[i * 3 + 1] = (ratio - 0.5) * 16;
            positions[i * 3 + 2] = Math.sin(t + angleOffset) * radius;
          }

          geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
          
          const mat = new THREE.PointsMaterial({
            size: 0.18,
            color: primaryMatColor,
            transparent: true,
            opacity: 0.9,
          });

          const points = new THREE.Points(geom, mat);
          activeGroup.add(points);
          registerAsset(geom, mat);

          // Add ladder link lines matching floating coordinates
          const linesGeom = new THREE.BufferGeometry();
          const linePositions: number[] = [];
          for (let i = 0; i < pointsCount; i += 8) {
            const ratio = i / pointsCount;
            const t = ratio * Math.PI * 8;
            const radius = 3.5;
            const currY = (ratio - 0.5) * 16;

            const l1x = Math.cos(t) * radius;
            const l1z = Math.sin(t) * radius;
            const l2x = Math.cos(t + Math.PI) * radius;
            const l2z = Math.sin(t + Math.PI) * radius;

            linePositions.push(l1x, currY, l1z, l2x, currY, l2z);
          }

          linesGeom.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
          const lineMat = new THREE.LineBasicMaterial({
            color: primaryMatColor,
            transparent: true,
            opacity: 0.35,
          });

          const lines = new THREE.LineSegments(linesGeom, lineMat);
          activeGroup.add(lines);
          registerAsset(linesGeom, lineMat);
          break;
        }

        case 'grid': {
          // Sci-Fi Hologram Wave Grid Plane
          const divisions = 30;
          const size = 18;
          const gridGeom = new THREE.PlaneGeometry(size, size, divisions, divisions);
          const gridMat = new THREE.MeshBasicMaterial({
            color: primaryMatColor,
            wireframe: true,
            transparent: true,
            opacity: 0.55,
          });

          const plane = new THREE.Mesh(gridGeom, gridMat);
          plane.rotation.x = -Math.PI / 2.8; // tilt back slightly
          plane.position.y = -2;
          activeGroup.add(plane);
          registerAsset(gridGeom, gridMat);
          break;
        }

        case 'matrix': {
          // Matrix code rain lines using vertical tubes
          const colCount = 45;
          const tubeGeom = new THREE.CylinderGeometry(0.04, 0.04, 18, 4);
          const tubeMat = new THREE.MeshBasicMaterial({
            color: primaryMatColor,
            wireframe: true,
            transparent: true,
            opacity: 0.4,
          });

          for (let i = 0; i < colCount; i++) {
            const cylinder = new THREE.Mesh(tubeGeom, tubeMat);
            cylinder.position.x = (Math.random() - 0.5) * 26;
            cylinder.position.y = (Math.random() - 0.5) * 4;
            cylinder.position.z = (Math.random() - 0.5) * 15;
            activeGroup.add(cylinder);
          }

          registerAsset(tubeGeom, tubeMat);
          break;
        }

        case 'galaxy': {
          // Galaxy Spiral Rotating points
          const count = 4000;
          const geom = new THREE.BufferGeometry();
          const positions = new Float32Array(count * 3);

          for (let i = 0; i < count; i++) {
            const ratio = i / count;
            const numArms = 2;
            const arm = i % numArms;
            const t = ratio * Math.PI * 5 + (arm * (Math.PI / numArms));
            const radius = ratio * 10;

            const randomSpread = (Math.random() - 0.5) * (1.2 * (1.0 - ratio));

            positions[i * 3] = Math.cos(t) * radius + randomSpread * 1.5;
            positions[i * 3 + 1] = randomSpread * 0.4;
            positions[i * 3 + 2] = Math.sin(t) * radius + randomSpread * 1.5;
          }

          geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
          
          const mat = new THREE.PointsMaterial({
            size: 0.1,
            color: primaryMatColor,
            transparent: true,
            opacity: 0.85,
          });

          const points = new THREE.Points(geom, mat);
          points.rotation.x = Math.PI / 6;
          activeGroup.add(points);
          registerAsset(geom, mat);
          break;
        }

        case 'synth': {
          // Ambient Audio-reactive wave concentric rings
          const ringCount = 12;
          const ringMatArr = [];

          for (let i = 0; i < ringCount; i++) {
            const size = (i + 1) * 1.1;
            const rGeom = new THREE.RingGeometry(size, size + 0.05, 64);
            const rMat = new THREE.MeshBasicMaterial({
              color: primaryMatColor,
              side: THREE.DoubleSide,
              transparent: true,
              opacity: Math.max(0.1, 1 - (i / ringCount)),
            });

            const mesh = new THREE.Mesh(rGeom, rMat);
            mesh.rotation.x = Math.PI / 2;
            activeGroup.add(mesh);
            registerAsset(rGeom, rMat);
          }
          break;
        }

        case 'wireframe': {
          // Rotating Geodesic Hub wireframe sphere
          const sphereGeom = new THREE.IcosahedronGeometry(7, 2);
          const sphereMat = new THREE.MeshBasicMaterial({
            color: primaryMatColor,
            wireframe: true,
            transparent: true,
            opacity: 0.8,
          });

          const mesh = new THREE.Mesh(sphereGeom, sphereMat);
          activeGroup.add(mesh);

          // Add vertices centers points to glow
          const dotGeom = new THREE.IcosahedronGeometry(7.05, 2);
          const dotMat = new THREE.PointsMaterial({
            size: 0.22,
            color: primaryMatColor,
            transparent: true,
            opacity: 0.95,
          });
          const pointsMesh = new THREE.Points(dotGeom, dotMat);
          activeGroup.add(pointsMesh);

          registerAsset(sphereGeom, sphereMat);
          registerAsset(dotGeom, dotMat);
          break;
        }

        case 'geometric': {
          // Infinite mathematical nested star octahedrons
          const starGeom = new THREE.OctahedronGeometry(6, 1);
          const starMat = new THREE.MeshBasicMaterial({
            color: primaryMatColor,
            wireframe: true,
            transparent: true,
            opacity: 0.7,
          });

          const innerStarGeom = new THREE.OctahedronGeometry(3.5, 1);
          const innerStarMat = new THREE.MeshBasicMaterial({
            color: primaryMatColor,
            wireframe: true,
            transparent: true,
            opacity: 0.4,
          });

          const star1 = new THREE.Mesh(starGeom, starMat);
          const star2 = new THREE.Mesh(innerStarGeom, innerStarMat);

          activeGroup.add(star1, star2);

          registerAsset(starGeom, starMat);
          registerAsset(innerStarGeom, innerStarMat);
          break;
        }

        case 'cube': {
          // Floating Holographic cube nested inside a transparent shell
          const geoOutline = new THREE.BoxGeometry(7, 7, 7);
          const matOutline = new THREE.MeshBasicMaterial({
            color: primaryMatColor,
            wireframe: true,
            transparent: true,
            opacity: 0.7,
          });

          const innerGeo = new THREE.BoxGeometry(4, 4, 4);
          const innerMat = new THREE.MeshBasicMaterial({
            color: primaryMatColor,
            wireframe: true,
            transparent: true,
            opacity: 0.35,
          });

          const outC = new THREE.Mesh(geoOutline, matOutline);
          const inC = new THREE.Mesh(innerGeo, innerMat);

          activeGroup.add(outC, inC);
          registerAsset(geoOutline, matOutline);
          registerAsset(innerGeo, innerMat);
          break;
        }

        case 'earth': {
          // Holographic Globe Point Cloud
          const globeGeom = new THREE.SphereGeometry(6.5, 32, 32);
          const globeMat = new THREE.MeshBasicMaterial({
            color: primaryMatColor,
            wireframe: true,
            transparent: true,
            opacity: 0.5,
          });

          const pointsGeom = new THREE.SphereGeometry(6.6, 24, 24);
          const pointsMat = new THREE.PointsMaterial({
            size: 0.16,
            color: primaryMatColor,
            transparent: true,
            opacity: 0.75,
          });

          const globe = new THREE.Mesh(globeGeom, globeMat);
          const dots = new THREE.Points(pointsGeom, pointsMat);

          activeGroup.add(globe, dots);
          registerAsset(globeGeom, globeMat);
          registerAsset(pointsGeom, pointsMat);
          break;
        }

        case 'solar': {
          // Nested pathways with floating planet shells
          const path1Geom = new THREE.RingGeometry(5, 5.05, 64);
          const path2Geom = new THREE.RingGeometry(8, 8.05, 64);
          const pathMat = new THREE.MeshBasicMaterial({
            color: primaryMatColor,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.25,
          });

          const sunGeom = new THREE.SphereGeometry(1.6, 16, 16);
          const sunMat = new THREE.MeshBasicMaterial({
            color: primaryMatColor,
            wireframe: true,
            transparent: true,
            opacity: 0.8,
          });

          const p1Geom = new THREE.SphereGeometry(0.35, 8, 8);
          const p2Geom = new THREE.SphereGeometry(0.48, 8, 8);
          const planetMat = new THREE.MeshBasicMaterial({
            color: primaryMatColor,
            wireframe: true,
          });

          const path1 = new THREE.Mesh(path1Geom, pathMat);
          const path2 = new THREE.Mesh(path2Geom, pathMat);
          const sunObj = new THREE.Mesh(sunGeom, sunMat);
          const planet1 = new THREE.Mesh(p1Geom, planetMat);
          const planet2 = new THREE.Mesh(p2Geom, planetMat);

          path1.rotation.x = Math.PI / 2.3;
          path2.rotation.x = Math.PI / 2.3;

          activeGroup.add(path1, path2, sunObj, planet1, planet2);

          // custom names to retrieve and rotate planetary orbits in tick thread
          planet1.name = 'planet1';
          planet2.name = 'planet2';

          registerAsset(path1Geom, pathMat);
          registerAsset(path2Geom, pathMat);
          registerAsset(sunGeom, sunMat);
          registerAsset(p1Geom, planetMat);
          registerAsset(p2Geom, planetMat);
          break;
        }
      }
    };

    rebuildScene();

    // Resize Handler
    const handleResize = () => {
      if (!containerRef.current) return;
      width = containerRef.current.clientWidth;
      height = containerRef.current.clientHeight;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    // Animation Ticks
    let animationId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationId = requestAnimationFrame(animate);

      if (isPlaying) {
        const delta = clock.getDelta();
        const elapsedTime = clock.getElapsedTime() * customSpeed;

        // Dynamic Audio Analysis and Simulation values
        let audioLevel = 1.0;
        let bassLevel = 1.0;

        if (audioReactionSource === 'microphone' && analyserRef.current && dataArrayRef.current) {
          analyserRef.current.getByteFrequencyData(dataArrayRef.current);
          
          let total = 0;
          for (let i = 0; i < dataArrayRef.current.length; i++) {
            total += dataArrayRef.current[i];
          }
          const avg = total / dataArrayRef.current.length; // 0 to 255
          
          let bassTotal = 0;
          const bassBins = Math.min(6, dataArrayRef.current.length);
          for (let i = 0; i < bassBins; i++) {
            bassTotal += dataArrayRef.current[i];
          }
          const bassAvg = bassTotal / bassBins; // 0 to 255
          
          // Map to volume multiplier with custom sensitivity/bass response
          audioLevel = 0.4 + (avg / 255) * 4.0 * audioSensitivity;
          bassLevel = 0.4 + (bassAvg / 255) * 4.0 * audioBassResponse;
        } else {
          // Virtual emulated procedurals mapped cleanly to slider settings
          const timeFactor = elapsedTime * 2.8;
          const rawSim = 0.7 + Math.sin(timeFactor) * 0.35 + Math.cos(timeFactor * 1.4) * 0.15;
          audioLevel = rawSim * audioSensitivity;

          const rawBassSim = 0.7 + Math.sin(timeFactor * 0.5) * 0.4 + Math.cos(timeFactor * 1.1) * 0.2;
          bassLevel = rawBassSim * audioBassResponse;
        }

        // Visual specific fine animation ticks
        switch (currentVisual) {
          case 'vortex':
            activeGroup.rotation.y += delta * 0.15 * customSpeed * audioLevel;
            activeGroup.rotation.z = Math.sin(elapsedTime * 0.05) * 0.05;
            break;
          case 'core':
            activeGroup.children.forEach((mesh, index) => {
              const speedMultiplier = 1.0 + (index === 3 ? bassLevel - 1.0 : audioLevel - 1.0) * 0.5;
              if (index === 0) mesh.rotation.y += delta * 0.25 * customSpeed * speedMultiplier;
              if (index === 1) mesh.rotation.x += delta * 0.35 * customSpeed * speedMultiplier;
              if (index === 2) mesh.rotation.z += delta * 0.15 * customSpeed * speedMultiplier;
              if (index === 3) {
                mesh.rotation.y -= delta * 0.1 * customSpeed * speedMultiplier;
                const scale = 1.0 + (bassLevel - 1.0) * 0.3;
                mesh.scale.set(scale, scale, scale);
              }
            });
            break;
          case 'tunnel':
            activeGroup.children.forEach((mesh) => {
              if (mesh instanceof THREE.Mesh) {
                mesh.position.z += delta * 12.0 * customSpeed * audioLevel;
                mesh.rotation.z += delta * 0.1 * customSpeed;
                if (mesh.position.z > 5) {
                  mesh.position.z = -55;
                }
              }
            });
            break;
          case 'helix':
            activeGroup.rotation.y += delta * 0.35 * customSpeed * audioLevel;
            break;
          case 'grid': {
            const mesh = activeGroup.children[1]; // plane mesh
            if (mesh instanceof THREE.Mesh && mesh.geometry) {
              const posAttr = mesh.geometry.attributes.position;
              const timeFactor = elapsedTime * 1.5 * audioLevel;
              const waveHeight = 0.75 * bassLevel;
              for (let i = 0; i < posAttr.count; i++) {
                const x = posAttr.getX(i);
                const y = posAttr.getY(i);
                const zNorm = Math.sin(x * 0.2 + timeFactor) * Math.cos(y * 0.2 + timeFactor) * waveHeight;
                posAttr.setZ(i, zNorm);
              }
              posAttr.needsUpdate = true;
            }
            break;
          }
          case 'matrix':
            activeGroup.children.forEach(cylinder => {
              if (cylinder instanceof THREE.Mesh) {
                cylinder.position.y -= delta * 3.5 * customSpeed * audioLevel;
                if (cylinder.position.y < -12) {
                  cylinder.position.y = 12;
                  cylinder.position.x = (Math.random() - 0.5) * 26;
                }
              }
            });
            break;
          case 'galaxy':
            activeGroup.rotation.y += delta * 0.08 * customSpeed * audioLevel;
            break;
          case 'synth':
            activeGroup.children.forEach((mesh, index) => {
              if (mesh instanceof THREE.Mesh) {
                let freqScale = 1.0;
                if (audioReactionSource === 'microphone' && analyserRef.current && dataArrayRef.current) {
                  const binIdx = Math.floor((index / activeGroup.children.length) * dataArrayRef.current.length);
                  const binVal = dataArrayRef.current[binIdx] || 0;
                  const isBassRing = index < 4;
                  const responseCoeff = isBassRing ? audioBassResponse : audioSensitivity;
                  freqScale = 0.5 + (binVal / 255) * 3.5 * responseCoeff;
                } else {
                  const isBassRing = index < 4;
                  const responseCoeff = isBassRing ? audioBassResponse : audioSensitivity;
                  const beat = Math.sin(elapsedTime * 3.5 + index * 0.6) * 0.15 * responseCoeff;
                  freqScale = 1.0 + beat;
                }
                mesh.scale.set(freqScale, freqScale, freqScale);
                if (mesh.material && 'opacity' in mesh.material) {
                  const baseOpacity = Math.max(0.12, 1 - (index / activeGroup.children.length));
                  mesh.material.opacity = Math.min(1.0, baseOpacity * freqScale);
                }
              }
            });
            break;
          case 'wireframe':
            activeGroup.rotation.y += delta * 0.22 * customSpeed * audioLevel;
            activeGroup.rotation.x += delta * 0.08 * customSpeed;
            // Pulse sphere scale slightly with bass
            const sphereScale = 1.0 + (bassLevel - 1.0) * 0.15;
            activeGroup.scale.set(sphereScale, sphereScale, sphereScale);
            break;
          case 'geometric':
            activeGroup.rotation.y += delta * 0.15 * customSpeed * audioLevel;
            activeGroup.rotation.z -= delta * 0.05 * customSpeed;
            break;
          case 'cube':
            activeGroup.children.forEach((mesh, i) => {
              if (mesh instanceof THREE.Mesh) {
                const scaleVal = i === 1 ? -0.2 : 0.2;
                const reactionScale = 1.0 + (i === 1 ? (bassLevel - 1.0) * 0.22 : (audioLevel - 1.0) * 0.15);
                mesh.rotation.y += delta * scaleVal * customSpeed * reactionScale;
                mesh.rotation.z += delta * 0.05 * customSpeed;
                mesh.rotation.x += delta * 0.08 * customSpeed;
                mesh.scale.set(reactionScale, reactionScale, reactionScale);
              }
            });
            break;
          case 'earth':
            activeGroup.rotation.y += delta * 0.15 * customSpeed * audioLevel;
            activeGroup.rotation.x = Math.PI / 8;
            break;
          case 'solar': {
            activeGroup.rotation.y += delta * 0.05 * customSpeed * audioLevel;
            const p1 = activeGroup.getObjectByName('planet1');
            const p2 = activeGroup.getObjectByName('planet2');
            
            if (p1) {
              const r1 = 5;
              const angle1 = elapsedTime * 0.8 * audioLevel;
              p1.position.set(Math.cos(angle1) * r1, 0, Math.sin(angle1) * r1);
            }
            if (p2) {
              const r2 = 8;
              const angle2 = elapsedTime * 0.5 * bassLevel;
              p2.position.set(Math.cos(angle2) * r2, 0, Math.sin(angle2) * r2);
            }
            break;
          }
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      activeGroup.children.forEach(c => {
        scene.remove(c);
      });
      geometriesToDispose.forEach(g => g.dispose());
      materialsToDispose.forEach(m => m.dispose());
      renderer.dispose();
    };
  }, [currentVisual, colorPreset, isPlaying, customSpeed, audioSensitivity, audioBassResponse, audioReactionSource]);

  const activeCatalogItem = visualsCatalog.find(item => item.type === currentVisual) || visualsCatalog[0];

  const handleNext = () => {
    const currentIndex = visualsCatalog.findIndex(v => v.type === currentVisual);
    const nextIndex = (currentIndex + 1) % visualsCatalog.length;
    onVisualChange(visualsCatalog[nextIndex].type);
  };

  const handlePrev = () => {
    const currentIndex = visualsCatalog.findIndex(v => v.type === currentVisual);
    const prevIndex = (currentIndex - 1 + visualsCatalog.length) % visualsCatalog.length;
    onVisualChange(visualsCatalog[prevIndex].type);
  };

  const handleShuffle = () => {
    const filters = visualsCatalog.filter(v => v.type !== currentVisual);
    const random = filters[Math.floor(Math.random() * filters.length)];
    onVisualChange(random.type);
  };

  return (
    <div ref={containerRef} id="hologram-visuals-screen" className="relative w-full h-full bg-black overflow-hidden flex flex-col justify-end">
      
      {/* Target Canvas container */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block z-0"
        style={{
          filter: `drop-shadow(0 0 ${glow}px var(--hologram-glow))`
        }}
      />

      {/* Futuristic Floating Dashboard Menu */}
      <div className={`absolute inset-x-6 top-6 z-10 flex flex-col items-center justify-center gap-3 pointer-events-none md:flex-row md:justify-between w-[90%] md:w-[95%] left-[5%] transition-all duration-500 ${isIdle ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <div className="flex flex-col sm:flex-row items-center gap-2 pointer-events-auto">
          <div className="bg-black/60 border border-white/10 px-4 py-2.5 rounded-xl backdrop-blur-md flex items-center gap-3">
            <MonitorPlay className={`w-5 h-5 ${
              colorPreset === 'cyan' ? 'text-cyan-400' :
              colorPreset === 'red' ? 'text-red-400' :
              colorPreset === 'purple' ? 'text-purple-400' :
              colorPreset === 'green' ? 'text-green-400' : 'text-amber-400'
            }`} />
            <div>
              <div className="text-[10px] font-mono tracking-widest text-white/40">CORE ORBIT SYSTEM</div>
              <div className={`text-sm font-mono font-black capitalize ${
                colorPreset === 'cyan' ? 'text-cyan-400' :
                colorPreset === 'red' ? 'text-red-400' :
                colorPreset === 'purple' ? 'text-purple-400' :
                colorPreset === 'green' ? 'text-green-400' : 'text-amber-400'
              }`}>{activeCatalogItem.label}</div>
            </div>
          </div>

          {/* Audio Reactivity Status Indicator */}
          <div className="bg-black/60 border border-white/10 px-3.5 py-2.5 rounded-xl backdrop-blur-md flex items-center gap-2.5">
            <div className={`w-2 h-2 rounded-full ${
              audioReactionSource === 'microphone' && micActive
                ? 'bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]'
                : 'bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]'
            }`} />
            <div className="text-left">
              <div className="text-[8px] font-mono tracking-widest text-white/40">AUDIO REACTIVE INPUT</div>
              <div className="text-[10px] font-mono font-bold text-white/80 uppercase">
                {audioReactionSource === 'microphone' ? (micActive ? 'Microphone Active' : 'Mic Denied (Simulation)') : 'Procedural Core'}
              </div>
            </div>
          </div>
        </div>

        <div className="hidden md:block text-right bg-black/40 border border-white/5 px-3 py-1.5 rounded-lg text-[9px] font-mono text-white/30 tracking-wider">
          {activeCatalogItem.desc}
        </div>
      </div>

      {/* Visual Controls Hub floating above the canvas bottom */}
      <div className={`z-10 bg-black/60 border border-white/10 px-6 py-4 rounded-t-3xl md:rounded-full md:mb-6 md:mx-auto max-w-xl w-full backdrop-blur-md flex flex-col gap-3 transition-opacity duration-500 ${isIdle ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <div className="flex items-center justify-between gap-6">
          
          {/* Deck selector */}
          <div className="flex items-center gap-2">
            <button
              id="btn-vis-prev"
              onClick={handlePrev}
              className="p-2 border border-white/5 bg-white/[0.02] rounded-full hover:bg-white/10 text-white/70 hover:text-cyan-400 transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <button
              id="btn-vis-play"
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2 border border-white/5 bg-white/[0.02] rounded-full hover:bg-white/10 text-white/70 hover:text-cyan-400 transition-all cursor-pointer"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>

            <button
              id="btn-vis-next"
              onClick={handleNext}
              className="p-2 border border-white/5 bg-white/[0.02] rounded-full hover:bg-white/10 text-white/70 hover:text-cyan-400 transition-all cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Quick random selection */}
          <button
            id="btn-vis-shuffle"
            onClick={handleShuffle}
            className="flex items-center gap-2 px-3 py-2 border border-white/10 bg-cyan-950/20 hover:bg-cyan-900/30 rounded-lg text-xs font-mono text-cyan-400 transition-all cursor-pointer shadow-[0_0_12px_rgba(34,211,238,0.15)]"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span className="font-bold tracking-wider uppercase">SCREENSAVER AUTO</span>
          </button>
        </div>

        {/* Speed Adjustment Scrubber */}
        <div className="flex items-center gap-3">
          <span className="text-[9px] font-mono text-white/40 tracking-wider">ROTATION ACCELERATION:</span>
          <input
            id="slider-vis-speed"
            type="range"
            min="0.2"
            max="3.0"
            step="0.1"
            value={customSpeed}
            onChange={(e) => setCustomSpeed(parseFloat(e.target.value))}
            className="flex-1 accent-cyan-400 h-1 bg-white/10 rounded cursor-pointer"
          />
          <span className="text-[9px] font-mono text-cyan-400 w-8 text-right">
            {customSpeed.toFixed(1)}x
          </span>
        </div>
      </div>
    </div>
  );
}
export { visualsCatalog };
