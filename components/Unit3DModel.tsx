
import React, { useMemo } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { OBJLoader, MTLLoader } from 'three-stdlib';
import { Center, Environment, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { UnitModelSource } from '../types';

export type ModelSource = UnitModelSource;

interface Unit3DModelProps {
  modelUrl: ModelSource;
  color: string;
  size?: number;
  targetHeight?: number;
  /** Tilt looking slightly down at the model (radians). Matches the board icon's angle by default. */
  tiltX?: number;
  /** Yaw rotation (radians). Positive turns the model towards its right, negative towards its left. */
  rotationY?: number;
}

// OBJ exports vary wildly in scale depending on the source tool/units (some
// export in meters, others in cm or arbitrary units). A single fixed scale
// factor only looks right for whatever export size it was tuned against - for
// any other model it renders as either a speck or an oversized blob. Instead,
// measure the loaded model's actual height and normalize it to a target size.
const cloneAndNormalize = (source: THREE.Object3D, targetHeight: number, colorOverride?: string) => {
  const clone = source.clone(true);

  const hasTexture = (material: THREE.Material | THREE.Material[] | undefined) => {
    const materials = Array.isArray(material) ? material : material ? [material] : [];
    return materials.some((m) => !!(m as THREE.MeshStandardMaterial).map);
  };

  clone.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      if (colorOverride && !hasTexture(child.material)) {
        // No real texture data (e.g. a bare .obj with no .mtl) - fall back to a flat tint.
        child.material = new THREE.MeshStandardMaterial({
          color: new THREE.Color(colorOverride),
          roughness: 0.5,
          metalness: 0.5
        });
      } else {
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((m) => {
          const map = (m as THREE.MeshStandardMaterial).map;
          if (map) map.colorSpace = THREE.SRGBColorSpace;
        });
      }
    }
  });

  const box = new THREE.Box3().setFromObject(clone);
  const height = box.max.y - box.min.y;
  const scale = height && isFinite(height) ? targetHeight / height : 1;
  return { object: clone, scale };
};

// useLoader caches and reuses the same Object3D for a given URL. Since an
// Object3D can only belong to one scene at a time, reusing it directly (e.g.
// two units of the same type on the board) would silently steal it from
// whichever instance mounted first. Both variants below clone per-instance.

const TexturedModel: React.FC<{ objUrl: string; mtlUrl: string; targetHeight: number }> = ({ objUrl, mtlUrl, targetHeight }) => {
  const materials = useLoader(MTLLoader, mtlUrl);
  const source = useLoader(OBJLoader, objUrl, (loader) => {
    materials.preload();
    (loader as OBJLoader).setMaterials(materials);
  });

  const { object, scale } = useMemo(
    () => cloneAndNormalize(source, targetHeight),
    [source, targetHeight]
  );

  return <primitive object={object} scale={scale} />;
};

const TintedModel: React.FC<{ objUrl: string; color: string; targetHeight: number }> = ({ objUrl, color, targetHeight }) => {
  const source = useLoader(OBJLoader, objUrl);

  const { object, scale } = useMemo(
    () => cloneAndNormalize(source, targetHeight, color),
    [source, color, targetHeight]
  );

  return <primitive object={object} scale={scale} />;
};

export const Model: React.FC<{ url: ModelSource; color: string; targetHeight: number }> = ({ url, color, targetHeight }) => {
  if (typeof url === 'object' && url.mtl) {
    return <TexturedModel objUrl={url.obj} mtlUrl={url.mtl} targetHeight={targetHeight} />;
  }
  const objUrl = typeof url === 'string' ? url : url.obj;
  return <TintedModel objUrl={objUrl} color={color} targetHeight={targetHeight} />;
};

const Unit3DModel: React.FC<Unit3DModelProps> = ({ modelUrl, color, size = 40, targetHeight = 3, tiltX = 0.3, rotationY = 0.5 }) => {
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
            <group rotation={[tiltX, rotationY, 0]}> {/* "A little angle" as requested */}
              <Model url={modelUrl} color={color} targetHeight={targetHeight} />
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
