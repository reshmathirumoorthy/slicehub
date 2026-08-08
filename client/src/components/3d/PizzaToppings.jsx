import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { TOPPING_COLOR, hashRandom } from './pizzaVisualConfig';

/**
 * Scatter toppings across the pizza surface.
 * Positions are deterministic per topping key for stable renders.
 */
function PizzaToppings({
  vegetables = [],
  baseHeight = 0.1,
  reducedMotion = false,
}) {
  const toppings = useMemo(() => {
    const items = [];
    vegetables.forEach((veg) => {
      const count = 7;
      for (let i = 0; i < count; i += 1) {
        const seed = `${veg}-${i}`;
        const angle = hashRandom(seed) * Math.PI * 2;
        const radius = 0.18 + hashRandom(`${seed}-r`) * 0.62;
        items.push({
          id: seed,
          veg,
          x: Math.cos(angle) * radius,
          z: Math.sin(angle) * radius,
          rot: hashRandom(`${seed}-rot`) * Math.PI,
          scale: 0.7 + hashRandom(`${seed}-s`) * 0.5,
        });
      }
    });
    return items;
  }, [vegetables]);

  return (
    <group position={[0, baseHeight + 0.045, 0]}>
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
  const meshRef = useRef(null);
  const [mounted, setMounted] = useState(reducedMotion);
  const color = TOPPING_COLOR[item.veg] || '#ddd';
  const isRound = ['olives', 'tomato', 'corn', 'mushroom'].includes(item.veg);

  useEffect(() => {
    if (reducedMotion) {
      setMounted(true);
      return undefined;
    }
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, [reducedMotion]);

  useFrame((_, delta) => {
    if (!meshRef.current || reducedMotion) return;
    const current = meshRef.current.scale.x;
    const target = mounted ? item.scale : 0.05;
    const next = current + (target - current) * Math.min(1, delta * 10);
    meshRef.current.scale.setScalar(next);
  });

  return (
    <mesh
      ref={meshRef}
      position={[item.x, 0, item.z]}
      rotation={[-Math.PI / 2, 0, item.rot]}
      scale={reducedMotion ? item.scale : 0.05}
      castShadow
    >
      {isRound ? (
        <circleGeometry args={[0.07, 16]} />
      ) : (
        <planeGeometry args={[0.12, 0.07]} />
      )}
      <meshStandardMaterial color={color} roughness={0.6} />
    </mesh>
  );
}

export default PizzaToppings;
