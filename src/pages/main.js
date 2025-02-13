import * as THREE from 'three';
import { createMoon } from '../components/moon.js';
import React, { useEffect } from 'react';

function Main() {
    useEffect(() => {
        // Set up scene
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer();
        renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(renderer.domElement);

        // Create moon and add to scene
        const moon = createMoon();
        scene.add(moon);

        // Add axes helpers for debugging with custom materials that ignore depth testing
        const axesLength = 2;
        const axes = new THREE.Group();

        // Create X axis (red)
        const xGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(axesLength, 0, 0)
        ]);
        const xMaterial = new THREE.LineBasicMaterial({ 
            color: 0xff0000, 
            depthTest: false,
            depthWrite: false
        });
        const xAxis = new THREE.Line(xGeometry, xMaterial);
        axes.add(xAxis);

        // Create Y axis (green)
        const yGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, axesLength, 0)
        ]);
        const yMaterial = new THREE.LineBasicMaterial({ 
            color: 0x00ff00, 
            depthTest: false,
            depthWrite: false
        });
        const yAxis = new THREE.Line(yGeometry, yMaterial);
        axes.add(yAxis);

        // Create Z axis (blue)
        const zGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, axesLength)
        ]);
        const zMaterial = new THREE.LineBasicMaterial({ 
            color: 0x0000ff, 
            depthTest: false,
            depthWrite: false
        });
        const zAxis = new THREE.Line(zGeometry, zMaterial);
        axes.add(zAxis);

        scene.add(axes);

        // Add a smaller set of axes for the camera
        const cameraAxesLength = 0.5;
        const cameraAxes = axes.clone();
        cameraAxes.scale.set(cameraAxesLength/axesLength, cameraAxesLength/axesLength, cameraAxesLength/axesLength);
        camera.add(cameraAxes);
        scene.add(camera);

        // Position the moon slightly below to create the ground effect
        moon.position.y = -2;

        // Position camera very close to surface with a low angle
        camera.position.set(2, 4, 2);
        camera.lookAt(0, 1, 0);

        // Add lighting for better surface detail visibility
        const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(-5, 3, 5);
        scene.add(directionalLight);

        const secondaryLight = new THREE.DirectionalLight(0x404040, 0.3);
        secondaryLight.position.set(5, -3, -5);
        scene.add(secondaryLight);

        // Animation loop
        function animate() {
            requestAnimationFrame(animate);
            moon.rotation.y += 0.001;
            renderer.render(scene, camera);
        }

        animate();

        // Handle window resizing
        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };

        window.addEventListener('resize', handleResize);

        // Cleanup function
        return () => {
            window.removeEventListener('resize', handleResize);
            document.body.removeChild(renderer.domElement);
        };
    }, []); // Empty dependency array means this runs once on mount

    return <div id="three-container"></div>;
}

export default Main;