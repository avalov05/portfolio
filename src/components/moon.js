import * as THREE from 'three';

export function createMoon() {
    // Create a detailed sphere geometry with more segments for better detail
    const radius = 5;
    const geometry = new THREE.SphereGeometry(radius, 128, 128);
    
    // Create height map for the surface
    const vertices = geometry.attributes.position.array;
    for (let i = 0; i < vertices.length; i += 3) {
        const x = vertices[i];
        const y = vertices[i + 1];
        const z = vertices[i + 2];
        
        // Add general terrain roughness
        const noise = (Math.random() - 0.5) * 0.2;
        
        // Add several larger craters
        for (let j = 0; j < 15; j++) {
            const craterCenter = new THREE.Vector3(
                Math.random() * 2 - 1,
                Math.random() * 2 - 1,
                Math.random() * 2 - 1
            ).normalize().multiplyScalar(radius);
            
            const distance = Math.sqrt(
                Math.pow(x - craterCenter.x, 2) +
                Math.pow(y - craterCenter.y, 2) +
                Math.pow(z - craterCenter.z, 2)
            );
            
            const craterSize = Math.random() * 2 + 1;
            const craterDepth = 0.2;
            if (distance < craterSize) {
                const impact = (1 - (distance / craterSize)) * craterDepth;
                vertices[i] -= (x / radius) * impact;
                vertices[i + 1] -= (y / radius) * impact;
                vertices[i + 2] -= (z / radius) * impact;
            }
        }
        
        // Apply the noise to create an uneven surface
        const normalizedPos = new THREE.Vector3(x, y, z).normalize();
        vertices[i] = normalizedPos.x * (radius + noise);
        vertices[i + 1] = normalizedPos.y * (radius + noise);
        vertices[i + 2] = normalizedPos.z * (radius + noise);
    }
    
    // Update normals for proper lighting
    geometry.computeVertexNormals();
    
    // Create material with bump mapping for additional surface detail
    const material = new THREE.MeshStandardMaterial({
        color: 0x888888,
        roughness: 0.9,
        metalness: 0.1,
        bumpScale: 0.02,
    });
    
    const moon = new THREE.Mesh(geometry, material);
    return moon;
} 