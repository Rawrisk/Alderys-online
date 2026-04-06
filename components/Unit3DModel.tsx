
import React, { useMemo } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { OBJLoader } from 'three-stdlib';
import { Center, Environment, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

interface Unit3DModelProps {
  modelUrl: string;
  color: string;
  size?: number;
}

const Model: React.FC<{ url: string; color: string }> = ({ url, color }) => {
  const obj = useLoader(OBJLoader, url);
  
  // Apply color to all meshes in the object
  useMemo(() => {
    obj.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material = new THREE.MeshStandardMaterial({ 
          color: new THREE.Color(color),
          roughness: 0.5,
          metalness: 0.5
        });
      }
    });
  }, [obj, color]);

  return <primitive object={obj} scale={0.015} />;
};

const Unit3DModel: React.FC<Unit3DModelProps> = ({ modelUrl, color, size = 40 }) => {
  return (
    <div style={{ width: size, height: size }}>
      <Canvas 
        camera={{ position: [0, 2, 5], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />
        
        <React.Suspense fallback={null}>
          <Center top>
            <group rotation={[0.3, 0.5, 0]}> {/* "A little angle" as requested */}
              <Model url={modelUrl} color={color} />
            </group>
          </Center>
        </React.Suspense>
        
        <Environment preset="city" />
        {/* Disable controls to keep it static but angled */}
        {/* <OrbitControls enableZoom={false} enablePan={false} /> */}
      </Canvas>
    </div>
  );
};

export default Unit3DModel;
