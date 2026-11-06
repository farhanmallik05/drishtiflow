import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface ThreeCameraSceneProps {
  interactive?: boolean;
}

export const ThreeCameraScene: React.FC<ThreeCameraSceneProps> = ({ interactive = true }) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 500;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x05070e, 0.035);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 2.5, 7.5);
    camera.lookAt(0, 0.5, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0x0a192f, 2.5);
    scene.add(ambientLight);

    const cyanPoint = new THREE.PointLight(0x00f0ff, 4, 15);
    cyanPoint.position.set(3, 4, 3);
    scene.add(cyanPoint);

    const purplePoint = new THREE.PointLight(0x8b5cf6, 3, 15);
    purplePoint.position.set(-3, 3, 2);
    scene.add(purplePoint);

    const alertPoint = new THREE.PointLight(0xef4444, 1.5, 8);
    alertPoint.position.set(0, 1.5, 1);
    scene.add(alertPoint);

    // Cyber Surveillance Grid Floor
    const gridHelper = new THREE.GridHelper(20, 25, 0x00f0ff, 0x112240);
    gridHelper.position.y = -1.8;
    scene.add(gridHelper);

    // Group for Camera Assembly
    const cameraRig = new THREE.Group();
    cameraRig.position.set(0, 0.8, 0);
    scene.add(cameraRig);

    // 1. Mount Arm / Wall bracket
    const mountGeo = new THREE.CylinderGeometry(0.25, 0.25, 1.2, 16);
    const mountMat = new THREE.MeshStandardMaterial({
      color: 0x111928,
      roughness: 0.3,
      metalness: 0.85,
    });
    const mountArm = new THREE.Mesh(mountGeo, mountMat);
    mountArm.rotation.x = Math.PI / 2;
    mountArm.position.set(0, 0.5, -1.2);
    cameraRig.add(mountArm);

    // Wall base plate
    const plateGeo = new THREE.BoxGeometry(1.2, 1.2, 0.2);
    const plateMat = new THREE.MeshStandardMaterial({ color: 0x0c1322, metalness: 0.9, roughness: 0.2 });
    const wallPlate = new THREE.Mesh(plateGeo, plateMat);
    wallPlate.position.set(0, 0.5, -1.8);
    cameraRig.add(wallPlate);

    // Turret Swivel Head
    const turretHead = new THREE.Group();
    cameraRig.add(turretHead);

    const baseSphereGeo = new THREE.SphereGeometry(0.55, 32, 16);
    const turretMat = new THREE.MeshStandardMaterial({
      color: 0x172136,
      roughness: 0.2,
      metalness: 0.9,
    });
    const turretBase = new THREE.Mesh(baseSphereGeo, turretMat);
    turretHead.add(turretBase);

    // Camera Housing Body
    const bodyGeo = new THREE.CylinderGeometry(0.48, 0.42, 1.6, 32);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.15,
      metalness: 0.85,
    });
    const cameraBody = new THREE.Mesh(bodyGeo, bodyMat);
    cameraBody.rotation.x = Math.PI / 2;
    cameraBody.position.set(0, -0.1, 0.8);
    turretHead.add(cameraBody);

    // Lens Rim Ring (Glowing Cyan)
    const ringGeo = new THREE.TorusGeometry(0.44, 0.04, 16, 32);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00f0ff,
      emissiveIntensity: 1.8,
      roughness: 0.1,
    });
    const lensRing = new THREE.Mesh(ringGeo, ringMat);
    lensRing.position.set(0, -0.1, 1.62);
    turretHead.add(lensRing);

    // Lens Glass
    const glassGeo = new THREE.CircleGeometry(0.4, 32);
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x002233,
      emissive: 0x003344,
      roughness: 0.05,
      transmission: 0.8,
      reflectivity: 0.9,
    });
    const lensGlass = new THREE.Mesh(glassGeo, glassMat);
    lensGlass.position.set(0, -0.1, 1.63);
    turretHead.add(lensGlass);

    // Lens Pupil Center (Optical Eye)
    const pupilGeo = new THREE.SphereGeometry(0.12, 16, 16);
    const pupilMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00f0ff,
      emissiveIntensity: 2.5,
    });
    const pupil = new THREE.Mesh(pupilGeo, pupilMat);
    pupil.position.set(0, -0.1, 1.61);
    turretHead.add(pupil);

    // Status Indicator LED (Blinking Red)
    const ledGeo = new THREE.SphereGeometry(0.06, 16, 16);
    const ledMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xef4444,
      emissiveIntensity: 2.0,
    });
    const led = new THREE.Mesh(ledGeo, ledMat);
    led.position.set(0.35, 0.25, 1.4);
    turretHead.add(led);

    // Holographic Laser Scanner Cone
    const coneGeo = new THREE.ConeGeometry(2.4, 4.8, 32, 1, true);
    const coneMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.16,
      side: THREE.DoubleSide,
      wireframe: false,
      depthWrite: false,
    });
    const laserCone = new THREE.Mesh(coneGeo, coneMat);
    laserCone.rotation.x = -Math.PI / 2;
    laserCone.position.set(0, -0.1, 4.0);
    turretHead.add(laserCone);

    // Laser Edge Ring at Target
    const scanRingGeo = new THREE.RingGeometry(2.35, 2.4, 32);
    const scanRingMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.6,
    });
    const scanRing = new THREE.Mesh(scanRingGeo, scanRingMat);
    scanRing.position.set(0, -0.1, 6.4);
    turretHead.add(scanRing);

    // Floating AI Detection Particle Cloud
    const particleCount = 220;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 10;
      positions[i + 1] = (Math.random() - 0.5) * 6;
      positions[i + 2] = (Math.random() - 0.5) * 10;

      // Cyan to purple gradient particles
      if (Math.random() > 0.3) {
        colors[i] = 0.0;
        colors[i + 1] = 0.94;
        colors[i + 2] = 1.0;
      } else {
        colors[i] = 0.55;
        colors[i + 1] = 0.36;
        colors[i + 2] = 0.96;
      }
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.07,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // 3D Floating Target HUD bracket
    const hudGroup = new THREE.Group();
    scene.add(hudGroup);
    hudGroup.position.set(1.6, 0.4, 2.5);

    const bracketMat = new THREE.LineBasicMaterial({ color: 0x00f0ff, linewidth: 2 });
    const bracketPoints = [
      new THREE.Vector3(-0.4, 0.2, 0),
      new THREE.Vector3(-0.4, 0.4, 0),
      new THREE.Vector3(-0.2, 0.4, 0),

      new THREE.Vector3(0.2, 0.4, 0),
      new THREE.Vector3(0.4, 0.4, 0),
      new THREE.Vector3(0.4, 0.2, 0),

      new THREE.Vector3(0.4, -0.2, 0),
      new THREE.Vector3(0.4, -0.4, 0),
      new THREE.Vector3(0.2, -0.4, 0),

      new THREE.Vector3(-0.2, -0.4, 0),
      new THREE.Vector3(-0.4, -0.4, 0),
      new THREE.Vector3(-0.4, -0.2, 0),
    ];
    const bracketGeo = new THREE.BufferGeometry().setFromPoints(bracketPoints);
    const bracketLine = new THREE.LineSegments(bracketGeo, bracketMat);
    hudGroup.add(bracketLine);

    // Mouse Tracking
    let targetYaw = 0;
    let targetPitch = 0;
    let currentYaw = 0;
    let currentPitch = 0;

    const handleMouseMove = (e: MouseEvent) => {
      if (!interactive) return;
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

      targetYaw = x * 0.75;
      targetPitch = -y * 0.45;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };
    window.addEventListener('resize', handleResize);

    // Animation Loop
    let clock = new THREE.Clock();
    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Autonomous Surveillance sweep if idle or blended with mouse
      const autoSweep = Math.sin(elapsedTime * 0.6) * 0.45;
      const autoTilt = Math.cos(elapsedTime * 0.8) * 0.15;

      const destYaw = targetYaw !== 0 ? targetYaw * 0.8 + autoSweep * 0.2 : autoSweep;
      const destPitch = targetPitch !== 0 ? targetPitch * 0.8 + autoTilt * 0.2 : autoTilt;

      currentYaw += (destYaw - currentYaw) * 0.05;
      currentPitch += (destPitch - currentPitch) * 0.05;

      turretHead.rotation.y = currentYaw;
      turretHead.rotation.x = currentPitch;

      // Laser Cone breathing pulse
      const pulse = 0.14 + Math.sin(elapsedTime * 4) * 0.05;
      coneMat.opacity = pulse;

      // LED blink
      ledMat.emissiveIntensity = Math.sin(elapsedTime * 6) > 0 ? 2.5 : 0.2;

      // Rotate floating particles gently
      particles.rotation.y = elapsedTime * 0.04;
      particles.rotation.x = elapsedTime * 0.02;

      // Floating HUD target tracker motion
      hudGroup.position.x = Math.sin(elapsedTime * 0.9) * 1.8;
      hudGroup.position.y = Math.cos(elapsedTime * 1.1) * 0.5 + 0.3;
      hudGroup.rotation.z = elapsedTime * 0.2;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [interactive]);

  return (
    <div className="relative w-full h-full min-h-[420px] flex items-center justify-center overflow-hidden">
      <div ref={mountRef} className="w-full h-full absolute inset-0 cursor-crosshair" />

      {/* Futuristic HUD overlay badges over the 3D canvas */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none flex flex-col gap-1.5 font-mono text-[11px]">
        <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-slate-900/80 border border-cyan-500/30 text-cyan-400 backdrop-blur-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>PTZ LENS: ACTIVE 4K-HDR</span>
        </div>
        <div className="text-slate-400 px-2 py-0.5 bg-black/60 rounded border border-slate-800 text-[10px]">
          OPTICAL ZOOM: 18X | YAW: 114.2° | TILT: -14.8°
        </div>
      </div>

      <div className="absolute bottom-4 right-4 z-10 pointer-events-none font-mono text-[11px] text-right">
        <div className="px-2.5 py-1 rounded bg-slate-900/80 border border-purple-500/30 text-purple-300 backdrop-blur-sm">
          NEURAL SENSOR: YOLOv10-XL (14ms)
        </div>
        <div className="text-cyan-500/80 text-[10px] mt-1">
          LASER RADAR: LOCK ACQUIRED [360° SWEEP]
        </div>
      </div>
    </div>
  );
};

