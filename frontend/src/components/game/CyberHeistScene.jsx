import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * CyberHeistScene – Three.js 3D environment for gameplay.
 * Renders a cyberpunk server room the player navigates.
 * onAction callback fires when player interacts with objects:
 *   { type: 'puzzle' | 'item' | 'detection', id, data }
 */
export default function CyberHeistScene({ onAction, detectionLevel }) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    const w = mount.clientWidth;
    const h = mount.clientHeight;

    // --- Renderer ---
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(w, h);
    renderer.setClearColor(0x050510);
    renderer.shadowMap.enabled = true;
    mount.appendChild(renderer.domElement);

    // --- Scene ---
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050510, 0.04);
    sceneRef.current = scene;

    // --- Camera ---
    const camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 100);
    camera.position.set(0, 4, 10);
    camera.lookAt(0, 0, 0);

    // --- Lighting ---
    const ambient = new THREE.AmbientLight(0x111122, 0.8);
    scene.add(ambient);

    const greenLight = new THREE.PointLight(0x00ff99, 2, 20);
    greenLight.position.set(0, 5, 0);
    scene.add(greenLight);

    const redLight = new THREE.PointLight(0xff3355, 1.5, 15);
    redLight.position.set(-6, 3, -4);
    scene.add(redLight);

    // --- Floor grid ---
    const gridHelper = new THREE.GridHelper(30, 30, 0x00ff9933, 0x00ff9911);
    gridHelper.position.y = -0.01;
    scene.add(gridHelper);

    const floorGeo = new THREE.PlaneGeometry(30, 30);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x080818 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // --- Server racks (interactive objects) ---
    const serverPositions = [
      [-4, 0, -3], [-1.5, 0, -3], [1.5, 0, -3], [4, 0, -3],
      [-4, 0, -6], [4, 0, -6]
    ];
    const interactiveObjects = [];

    serverPositions.forEach(([x, y, z], i) => {
      const rackGeo = new THREE.BoxGeometry(1.2, 3, 0.8);
      const rackMat = new THREE.MeshStandardMaterial({
        color: 0x1a1a2e,
        emissive: 0x00ff99,
        emissiveIntensity: 0.05
      });
      const rack = new THREE.Mesh(rackGeo, rackMat);
      rack.position.set(x, 1.5, z);
      rack.castShadow = true;
      rack.userData = { type: 'server', id: `server_${i}`, index: i };
      scene.add(rack);
      interactiveObjects.push(rack);

      // Blinking LED strip on each rack
      const ledGeo = new THREE.PlaneGeometry(0.8, 0.05);
      const ledMat = new THREE.MeshBasicMaterial({ color: i % 2 === 0 ? 0x00ff99 : 0xff3355 });
      const led = new THREE.Mesh(ledGeo, ledMat);
      led.position.set(x, 2.8, z + 0.41);
      scene.add(led);
    });

    // --- Floating data cube (collectible) ---
    const cubeGeo = new THREE.OctahedronGeometry(0.4);
    const cubeMat = new THREE.MeshStandardMaterial({
      color: 0xffaa00, emissive: 0xffaa00, emissiveIntensity: 0.4,
      wireframe: false
    });
    const dataCube = new THREE.Mesh(cubeGeo, cubeMat);
    dataCube.position.set(0, 1.5, 2);
    dataCube.userData = { type: 'item', id: 'data_core', points: 100 };
    scene.add(dataCube);
    interactiveObjects.push(dataCube);

    // --- Raycaster for click detection ---
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleClick = (e) => {
      const rect = mount.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(interactiveObjects);
      if (hits.length > 0) {
        const obj = hits[0].object;
        onAction && onAction({ type: obj.userData.type, id: obj.userData.id, data: obj.userData });
        // Flash feedback
        obj.material.emissiveIntensity = 0.8;
        setTimeout(() => { obj.material.emissiveIntensity = 0.05; }, 300);
      }
    };
    mount.addEventListener('click', handleClick);

    // --- Camera orbit on mouse move ---
    let mouseX = 0, mouseY = 0;
    const handleMouseMove = (e) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // --- Animation loop ---
    let frame;
    let t = 0;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      t += 0.016;

      // Rotate floating data cube
      dataCube.rotation.y += 0.02;
      dataCube.position.y = 1.5 + Math.sin(t * 1.5) * 0.15;

      // Subtle camera sway
      camera.position.x += (mouseX * 2 - camera.position.x) * 0.01;
      camera.position.y += (4 - mouseY * 0.5 - camera.position.y) * 0.01;
      camera.lookAt(0, 0, 0);

      // Pulse green light based on detection
      greenLight.intensity = 2 - (detectionLevel / 100) * 1.5;
      redLight.intensity = 0.5 + (detectionLevel / 100) * 2;

      renderer.render(scene, camera);
    };
    animate();

    // --- Resize ---
    const handleResize = () => {
      const nw = mount.clientWidth;
      const nh = mount.clientHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frame);
      mount.removeEventListener('click', handleClick);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      mount.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  // Update detection level in real time without re-mounting
  useEffect(() => {
    if (!sceneRef.current) return;
    // Detection level changes are handled inside the animation loop via closure
  }, [detectionLevel]);

  return (
    <div ref={mountRef} style={{ width: '100%', height: '100%', cursor: 'crosshair' }} />
  );
}
