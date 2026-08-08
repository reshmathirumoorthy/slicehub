import { useMemo } from 'react';
import * as THREE from 'three';
import { CHEESE_COLOR } from './pizzaVisualConfig';
import { getPizzaTextures } from './pizzaTextures';

/**
 * Melted cheese blanket with irregular edge, thickness, and soft gloss.
 */
function PizzaCheese({
  cheese = 'mozzarella',
  baseHeight = 0.1,
  extra = false,
  opacity = 1,
}) {
  const color = CHEESE_COLOR[cheese] || CHEESE_COLOR.mozzarella;
  const textures = useMemo(() => getPizzaTextures(), []);
  const y = baseHeight + (extra ? 0.034 : 0.02);

  const geo = useMemo(() => {
    const shape = new THREE.Shape();
    const radius = extra ? 0.74 : 0.76;
    const segments = 64;
    for (let i = 0; i <= segments; i += 1) {
      const t = (i / segments) * Math.PI * 2;
      const wobble =
        1 +
        Math.sin(t * 4.8) * 0.035 +
        Math.cos(t * 9.6) * 0.022 +
        Math.sin(t * 2.3 + 0.7) * 0.016 +
        Math.cos(t * 15.1) * 0.01;
      const x = Math.cos(t) * radius * wobble;
      const y0 = Math.sin(t) * radius * wobble;
      if (i === 0) shape.moveTo(x, y0);
      else shape.lineTo(x, y0);
    }

    const g = new THREE.ExtrudeGeometry(shape, {
      depth: extra ? 0.02 : 0.016,
      bevelEnabled: true,
      bevelThickness: 0.005,
      bevelSize: 0.008,
      bevelSegments: 3,
      curveSegments: 8,
    });

    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i += 1) {
      const x = pos.getX(i);
      const y0 = pos.getY(i);
      const z = pos.getZ(i);
      if (z > 0.006) {
        const melt =
          Math.sin(x * 14.5) * Math.cos(y0 * 12.8) * 0.0055 +
          Math.sin((x * 1.4 + y0) * 9) * 0.004 +
          Math.cos(x * 22 + y0 * 18) * 0.002;
        pos.setZ(i, z + melt);
      }
    }
    pos.needsUpdate = true;
    g.computeVertexNormals();
    return g;
  }, [extra]);

  return (
    <mesh
      geometry={geo}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, y, 0]}
      receiveShadow
      castShadow
    >
      <meshPhysicalMaterial
        map={textures.cheeseMap}
        roughnessMap={textures.cheeseRough}
        normalMap={textures.cheeseNormal}
        normalScale={new THREE.Vector2(0.4, 0.4)}
        color={color}
        roughness={0.34}
        metalness={0.03}
        clearcoat={0.28}
        clearcoatRoughness={0.5}
        reflectivity={0.28}
        transparent={opacity < 1}
        opacity={opacity}
        envMapIntensity={0.45}
      />
    </mesh>
  );
}

export default PizzaCheese;
