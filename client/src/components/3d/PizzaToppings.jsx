import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { hashRandom } from './pizzaVisualConfig';

const TOPPING_COUNT = {
  onion: 10,
  capsicum: 11,
  tomato: 9,
  corn: 22,
  mushroom: 10,
  olives: 10,
  paneer: 9,
  jalapeno: 10,
};

/**
 * Realistic 3D toppings for builder vegetable keys only.
 * Placement is deterministic from seed strings.
 */
function PizzaToppings({
  vegetables = [],
  baseHeight = 0.1,
  reducedMotion = false,
}) {
  const toppings = useMemo(() => {
    const items = [];
    vegetables.forEach((veg) => {
      const count = TOPPING_COUNT[veg] || 10;
      for (let i = 0; i < count; i += 1) {
        const seed = `${veg}-${i}`;
        // Soft rejection sampling toward natural scatter (not a grid)
        let x = 0;
        let z = 0;
        let attempts = 0;
        do {
          const angle = hashRandom(`${seed}-a-${attempts}`) * Math.PI * 2;
          const radius = 0.14 + hashRandom(`${seed}-r-${attempts}`) * 0.55;
          x = Math.cos(angle) * radius;
          z = Math.sin(angle) * radius;
          attempts += 1;
        } while (
          attempts < 4 &&
          items.some(
            (other) =>
              other.veg === veg &&
              (other.x - x) ** 2 + (other.z - z) ** 2 < 0.018,
          )
        );

        items.push({
          id: seed,
          veg,
          x,
          z,
          rotY: hashRandom(`${seed}-rot`) * Math.PI * 2,
          rotX: (hashRandom(`${seed}-rx`) - 0.5) * 0.55,
          rotZ: (hashRandom(`${seed}-rz`) - 0.5) * 0.4,
          scale: 0.78 + hashRandom(`${seed}-s`) * 0.5,
          lift: 0.002 + hashRandom(`${seed}-h`) * 0.012,
        });
      }
    });
    return items;
  }, [vegetables]);

  return (
    <group position={[0, baseHeight + 0.038, 0]}>
      {toppings.map((item) => (
        <ToppingMesh
          key={item.id}
          item={item}
          reducedMotion={reducedMotion}
        />
      ))}
    </group>
  );
}

function ToppingMesh({ item, reducedMotion }) {
  const groupRef = useRef(null);
  const [mounted, setMounted] = useState(reducedMotion);

  useEffect(() => {
    if (reducedMotion) {
      setMounted(true);
      return undefined;
    }
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, [reducedMotion]);

  useFrame((_, delta) => {
    if (!groupRef.current || reducedMotion) return;
    const current = groupRef.current.scale.x;
    const target = mounted ? item.scale : 0.02;
    const next = current + (target - current) * Math.min(1, delta * 10);
    groupRef.current.scale.setScalar(next);
  });

  return (
    <group
      ref={groupRef}
      position={[item.x, item.lift, item.z]}
      rotation={[item.rotX - Math.PI / 2.35, item.rotY, item.rotZ]}
      scale={reducedMotion ? item.scale : 0.02}
    >
      <IngredientMesh veg={item.veg} />
    </group>
  );
}

function IngredientMesh({ veg }) {
  switch (veg) {
    case 'onion':
      return <OnionSlice />;
    case 'capsicum':
      return <PepperStrip />;
    case 'tomato':
      return <TomatoWedge />;
    case 'corn':
      return <CornKernels />;
    case 'mushroom':
      return <MushroomSlice />;
    case 'olives':
      return <OliveRing />;
    case 'paneer':
      return <PaneerCube />;
    case 'jalapeno':
      return <JalapenoRing />;
    default:
      return (
        <mesh castShadow>
          <sphereGeometry args={[0.045, 12, 12]} />
          <meshStandardMaterial color="#ccc" roughness={0.7} />
        </mesh>
      );
  }
}

function OnionSlice() {
  return (
    <group>
      <mesh castShadow receiveShadow>
        <torusGeometry args={[0.058, 0.011, 10, 28, Math.PI * 1.45]} />
        <meshPhysicalMaterial
          color="#f4e8ff"
          roughness={0.32}
          transmission={0.42}
          thickness={0.25}
          transparent
          opacity={0.86}
          metalness={0.01}
        />
      </mesh>
      <mesh rotation={[0, 0, 0.35]} castShadow>
        <torusGeometry args={[0.042, 0.008, 8, 22, Math.PI * 1.2]} />
        <meshPhysicalMaterial
          color="#e8d4f5"
          roughness={0.35}
          transmission={0.38}
          thickness={0.2}
          transparent
          opacity={0.8}
        />
      </mesh>
    </group>
  );
}

function PepperStrip() {
  const geo = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-0.07, -0.012);
    shape.quadraticCurveTo(-0.03, 0.05, 0.055, 0.028);
    shape.quadraticCurveTo(0.08, -0.005, 0.05, -0.035);
    shape.quadraticCurveTo(0.01, -0.05, -0.07, -0.012);
    return new THREE.ExtrudeGeometry(shape, {
      depth: 0.014,
      bevelEnabled: true,
      bevelThickness: 0.003,
      bevelSize: 0.002,
      bevelSegments: 2,
    });
  }, []);

  return (
    <mesh geometry={geo} castShadow receiveShadow>
      <meshStandardMaterial color="#2fbf55" roughness={0.45} metalness={0.04} />
    </mesh>
  );
}

function TomatoWedge() {
  return (
    <group>
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.052, 0.056, 0.016, 24]} />
        <meshStandardMaterial color="#c6281c" roughness={0.4} metalness={0.03} />
      </mesh>
      <mesh position={[0, 0.009, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.014, 0.04, 20]} />
        <meshStandardMaterial
          color="#f0a090"
          roughness={0.55}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh position={[0, 0.01, 0]}>
        <sphereGeometry args={[0.012, 10, 10]} />
        <meshPhysicalMaterial
          color="#f5c4b4"
          roughness={0.4}
          transmission={0.15}
          thickness={0.1}
          transparent
          opacity={0.9}
        />
      </mesh>
    </group>
  );
}

function CornKernels() {
  return (
    <group>
      {[
        [0, 0, 0],
        [0.028, 0.004, 0.012],
        [-0.022, 0.003, 0.018],
        [0.01, 0.005, -0.024],
      ].map((pos, i) => (
        <mesh key={i} castShadow position={pos}>
          <sphereGeometry args={[0.016 + i * 0.002, 10, 10]} />
          <meshStandardMaterial
            color={i % 2 === 0 ? '#f2d35b' : '#e8c44a'}
            roughness={0.38}
            metalness={0.06}
          />
        </mesh>
      ))}
    </group>
  );
}

function MushroomSlice() {
  return (
    <group>
      <mesh castShadow receiveShadow position={[0, 0.012, 0]}>
        <sphereGeometry args={[0.052, 18, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#d5c6b0" roughness={0.78} />
      </mesh>
      <mesh position={[0, 0.011, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.045, 18]} />
        <meshStandardMaterial color="#c4b19a" roughness={0.85} />
      </mesh>
      <mesh castShadow position={[0, 0.001, 0]}>
        <cylinderGeometry args={[0.016, 0.02, 0.028, 12]} />
        <meshStandardMaterial color="#cbb9a4" roughness={0.82} />
      </mesh>
    </group>
  );
}

function OliveRing() {
  return (
    <mesh castShadow receiveShadow rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[0.034, 0.015, 12, 24]} />
      <meshStandardMaterial color="#1a1714" roughness={0.32} metalness={0.1} />
    </mesh>
  );
}

function PaneerCube() {
  const geo = useMemo(() => {
    const g = new THREE.BoxGeometry(0.068, 0.026, 0.052, 2, 1, 2);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i += 1) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const n =
        1 +
        Math.sin(x * 40 + z * 30) * 0.04 +
        Math.cos(z * 35) * 0.03;
      pos.setXYZ(i, x * n, y, z * n);
    }
    pos.needsUpdate = true;
    g.computeVertexNormals();
    return g;
  }, []);

  return (
    <mesh geometry={geo} castShadow receiveShadow>
      <meshStandardMaterial color="#fff6e4" roughness={0.58} metalness={0.02} />
    </mesh>
  );
}

function JalapenoRing() {
  return (
    <mesh castShadow receiveShadow rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[0.04, 0.012, 10, 22, Math.PI * 1.6]} />
      <meshPhysicalMaterial
        color="#2f9a3a"
        roughness={0.32}
        transmission={0.2}
        thickness={0.18}
        transparent
        opacity={0.9}
      />
    </mesh>
  );
}

export default PizzaToppings;
