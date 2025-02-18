import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import React, { useEffect } from 'react';
import meteor from '../assets/meteor.stl';
import rover from '../assets/rover.glb';

function Main() {
    useEffect(() => {
        // Set up Three.js scene
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer();
        renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(renderer.domElement);

        // Set up Cannon.js world
        const world = new CANNON.World({
            gravity: new CANNON.Vec3(0, 0, 0), // Start with no gravity
        });
        world.broadphase = new CANNON.SAPBroadphase(world);
        world.allowSleep = true;

        // Set up materials
        const meteorMaterial = new THREE.MeshStandardMaterial({
            color: 0x808080,
            roughness: 0.7,
            metalness: 0.2,
            flatShading: false
        });

        // Physics materials
        const groundPhysMaterial = new CANNON.Material('ground');
        const roverPhysMaterial = new CANNON.Material('rover');

        // Contact material (how ground and rover interact)
        const groundRoverContactMaterial = new CANNON.ContactMaterial(
            groundPhysMaterial,
            roverPhysMaterial,
            {
                friction: 0.5,
                restitution: 0.3,
            }
        );
        world.addContactMaterial(groundRoverContactMaterial);

        // Add status display
        const statusDisplay = document.createElement('div');
        statusDisplay.style.position = 'fixed';
        statusDisplay.style.top = '20px';
        statusDisplay.style.left = '20px';
        statusDisplay.style.color = 'white';
        statusDisplay.style.fontFamily = 'Arial, sans-serif';
        statusDisplay.style.fontSize = '16px';
        statusDisplay.style.zIndex = '1000';
        document.body.appendChild(statusDisplay);

        // Load meteor (moon)
        const loader = new STLLoader();
        loader.load(
            meteor,
            (geometry) => {
                geometry.computeVertexNormals();
                const meteor = new THREE.Mesh(geometry, meteorMaterial);
                geometry.center();
                meteor.scale.set(1, 1, 1);
                meteor.position.set(0, 0, 0);
                scene.add(meteor);

                // Create physics body for meteor
                const meteorShape = new CANNON.Sphere(1); // Simplified collision as sphere
                const meteorBody = new CANNON.Body({
                    mass: 0, // Static body
                    shape: meteorShape,
                    material: groundPhysMaterial,
                });
                world.addBody(meteorBody);
            }
        );

        // Load rover
        let roverBody;
        const gltfLoader = new GLTFLoader();
        gltfLoader.load(
            rover,
            (gltf) => {
                const rover = gltf.scene;
                rover.scale.set(0.1, 0.1, 0.1);
                rover.position.set(0, 1.5, 0);
                rover.rotation.y = Math.PI + Math.PI/2;
                scene.add(rover);

                // Create physics body for rover
                const roverShape = new CANNON.Box(new CANNON.Vec3(0.1, 0.1, 0.1));
                roverBody = new CANNON.Body({
                    mass: 1,
                    shape: roverShape,
                    material: roverPhysMaterial,
                    position: new CANNON.Vec3(0, 1.5, 0),
                });
                
                // Set initial rotation for physics body
                const quaternion = new CANNON.Quaternion();
                quaternion.setFromEuler(0, Math.PI - Math.PI/2, 0);
                roverBody.quaternion.copy(quaternion);
                
                world.addBody(roverBody);

                // Update rover position based on physics
                function updateRover() {
                    rover.position.copy(roverBody.position);
                    rover.quaternion.copy(roverBody.quaternion);
                }

                // Add camera offset
                const cameraOffset = {
                    height: 0.5,    // Height above rover
                    distance: 0.5   // Distance behind rover
                };

                // Animation loop
                function animate() {
                    requestAnimationFrame(animate);

                    // Step the physics world
                    world.step(1/60);

                    // Update rover position
                    updateRover();

                    // Update camera position to follow rover
                    if (roverBody) {
                        // Get rover's current position
                        const roverPos = roverBody.position;
                        
                        // Calculate direction from rover to moon center
                        const directionToCenter = new THREE.Vector3(
                            -roverPos.x,
                            -roverPos.y,
                            -roverPos.z
                        ).normalize();

                        // Calculate camera position
                        const cameraPos = new THREE.Vector3(
                            // roverPos.x,
                            // roverPos.y,
                            // roverPos.z
                            1,
                            1.2,
                            1
                        );
                        
                        // Move camera up relative to rover's orientation to moon
                        cameraPos.add(directionToCenter.multiplyScalar(-cameraOffset.distance));
                        cameraPos.add(directionToCenter.clone().multiplyScalar(-cameraOffset.height));
                        
                        // Update camera position
                        camera.position.copy(cameraPos);
                        
                        // Make camera look at moon's center
                        camera.lookAt(-1, 0, -1);
                    }

                    // Apply gravity towards center
                    if (roverBody) {
                        const position = roverBody.position;
                        const direction = position.scale(-1);
                        const distance = direction.length();
                        direction.normalize();
                        
                        const gravityForce = direction.scale(1 / (distance * distance));
                        roverBody.applyForce(gravityForce.scale(10), roverBody.position);

                        statusDisplay.textContent = `Distance from center: ${distance.toFixed(2)} units`;
                    }

                    renderer.render(scene, camera);
                }

                animate();
            }
        );

        // Add lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(-5, 3, 5);
        scene.add(directionalLight);

        const secondaryLight = new THREE.DirectionalLight(0x404040, 0.3);
        secondaryLight.position.set(5, -3, -5);
        scene.add(secondaryLight);

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
            document.body.removeChild(statusDisplay);
        };
    }, []);

    return (
        <div id="three-container" style={{
            overflow: 'hidden',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0
        }}></div>
    );
}

export default Main;