
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

// R3F's useLoader cache is keyed only by [LoaderClass, url] - the "extensions"
// callback (where materials get linked to the OBJLoader) is NOT part of that
// key. So a preload has to run the exact same loading sequence a real
// TexturedModel mount would, otherwise the cached OBJ entry ends up without
// its materials attached and the later real render silently gets an
// unlinked (or re-tinted) result instead of the textured one.
const preloadedModelKeys = new Set<string>();

export const preloadUnitModel = async (source: UnitModelSource | undefined) => {
  if (!source) return;

  if (typeof source === 'string') {
    if (preloadedModelKeys.has(source)) return;
    preloadedModelKeys.add(source);
    useLoader.preload(OBJLoader, source);
    return;
  }

  const key = `${source.obj}|${source.mtl}`;
  if (preloadedModelKeys.has(key)) return;
  preloadedModelKeys.add(key);

  useLoader.preload(MTLLoader, source.mtl);
  try {
    // A standalone load (not the R3F-cached one) just to get a resolved
    // MaterialCreator we can synchronously hand to the OBJLoader preload -
    // the .mtl file itself is tiny, so loading it twice is negligible next
    // to the multi-megabyte .obj/.textures this unlocks caching for.
    const materials = await new MTLLoader().loadAsync(source.mtl);
    useLoader.preload(OBJLoader, source.obj, (loader) => {
      materials.preload();
      (loader as OBJLoader).setMaterials(materials);
    });
  } catch (e) {
    console.warn('Failed to preload unit model', source, e);
  }
};

export const preloadUnitModels = (modelsByFaction: Record<string, Record<string, UnitModelSource>>, factions: string[]) => {
  const uniqueFactions = Array.from(new Set(factions));
  uniqueFactions.forEach((faction) => {
    const byType = modelsByFaction[faction];
    if (!byType) return;
    Object.values(byType).forEach((source) => {
      preloadUnitModel(source);
    });
  });
};

// Battle groups top out at 3 units per hex per faction (game rule). Rather
// than one isolated Canvas per unit, a whole side's models share a single
// scene/camera so they visually read as one formation - and so a future 3D
// battle backdrop has one place to live instead of N duplicated ones.
const FORMATION_OFFSETS: Record<number, [number, number][]> = {
  1: [[0, 0]],
  2: [[-0.9, 0.25], [0.9, -0.25]],
  3: [[-1.3, -0.15], [0, 0.45], [1.3, -0.15]],
};

export interface FormationUnit {
  id: string;
  modelUrl: ModelSource;
  color: string;
}

interface UnitFormation3DProps {
  units: FormationUnit[];
  /** Yaw rotation shared by the whole formation (radians). Positive/negative mirrors Unit3DModel's rotationY. */
  rotationY: number;
  width?: number;
  height?: number;
  targetHeight?: number;
}

export const UnitFormation3D: React.FC<UnitFormation3DProps> = ({ units, rotationY, width = 200, height = 110, targetHeight = 3 }) => {
  const count = Math.min(units.length, 3);
  const offsets = FORMATION_OFFSETS[count] || FORMATION_OFFSETS[3];
  // Wider groups need the camera pulled back so all members stay in frame
  // without shrinking each individual model's apparent size too much.
  const cameraZ = 5 + (count - 1) * 1.4;

  return (
    <div style={{ width, height }}>
      <Canvas camera={{ position: [0, 2, cameraZ], fov: 45 }} gl={{ antialias: true, alpha: true }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />
        <React.Suspense fallback={null}>
          {/* Center wraps the combined bounding box of every unit in the
              formation, so the whole group stays framed together regardless
              of how many members it has. */}
          <Center>
            <group>
              {units.slice(0, 3).map((u, i) => {
                const [x, z] = offsets[i];
                return (
                  <group key={u.id} position={[x, 0, z]} rotation={[0.1, rotationY, 0]}>
                    <Model url={u.modelUrl} color={u.color} targetHeight={targetHeight} />
                  </group>
                );
              })}
            </group>
          </Center>
        </React.Suspense>
        {/* No 3D backdrop yet - left transparent so the parent panel's own
            background shows through until a battle-scene model is available. */}
        <Environment preset="city" />
      </Canvas>
    </div>
  );
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
          {/* Plain centering (not "top"): most character exports already place
              their feet at local y=0, so drei's `top` alignment computes a
              net-zero vertical shift and leaves the model floating entirely
              above the camera's look-at point - cropping the head and wasting
              the bottom half of the frame on empty background. */}
          <Center>
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
