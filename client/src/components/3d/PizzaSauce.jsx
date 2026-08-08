import { useMemo } from 'react';
import * as THREE from 'three';
import { SAUCE_COLOR } from './pizzaVisualConfig';
import { getPizzaTextures } from './pizzaTextures';

/**
 * Brushed tomato (or other) sauce with thickness and irregular edge.
 */
function PizzaSauce({ sauce = 'tomato', baseHeight = 0.1 }) {
  const color = SAUCE_COLOR[sauce] || SAUCE_COLOR.tomato;
  const textures = useMemo(() => getPizzaTextures(), []);

  const geo = useMemo(() => {
    const shape = new THREE.Shape();
    const segments = 64;
    const radius = 0.78;
    for (let i = 0; i <= segments; i += 1) {
      const t = (i / segments) * Math.PI * 2;
      const wobble =
        1 +
        Math.sin(t * 5.8) * 0.03 +
        Math.cos(t * 10.5) * 0.02 +
        Math.sin(t * 2.2) * 0.012;
      const x = Math.cos(t) * radius * wobble;
      const y = Math.sin(t) * radius * wobble;
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }

    const g = new THREE.ExtrudeGeometry(shape, {
      depth: 0.012,
      bevelEnabled: true,
      bevelThickness: 0.003,
      bevelSize: 0.004,
      bevelSegments: 2,
      curveSegments: 6,
    });

    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i += 1) {
      const x = pos.getX(i);
      const y0 = pos.getY(i);
      const z = pos.getZ(i);
      if (z > 0.004) {
        const ripples =
          Math.sin(x * 16) * Math.cos(y0 * 14) * 0.0035 +
          Math.sin((x + y0) * 9) * 0.0025;
        pos.setZ(i, z + ripples);
      }
    }
    pos.needsUpdate = true;
    g.computeVertexNormals();
    return g;
  }, []);

  return (
    <mesh
      geometry={geo}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, baseHeight + 0.008, 0]}
      receiveShadow
      castShadow
    >
      <meshStandardMaterial
        map={textures.sauceMap}
        normalMap={textures.sauceNormal}
        normalScale={new THREE.Vector2(0.45, 0.45)}
        color={color}
        roughness={sauce === 'garlic' ? 0.48 : 0.58}
        metalness={0.02}
        transparent
        opacity={sauce === 'garlic' ? 0.9 : 0.97}
      />
    </mesh>
  );
}

export default PizzaSauce;
