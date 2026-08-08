import { useMemo } from 'react';
import * as THREE from 'three';
import { BASE_STYLE } from './pizzaVisualConfig';
import { getPizzaTextures } from './pizzaTextures';

/**
 * Hand-formed pizza dough: irregular disc + puffy tube crust (not a perfect cylinder).
 */
function PizzaBase({ base = 'thin_crust' }) {
  const style = BASE_STYLE[base] || BASE_STYLE.thin_crust;
  const textures = useMemo(() => getPizzaTextures(), []);
  const rimRadius = 0.085 + style.height * 0.22;

  const doughGeo = useMemo(() => {
    const geo = new THREE.CylinderGeometry(1, 1.05, style.height, 96, 4, false);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i += 1) {
      const x = pos.getX(i);
      let y = pos.getY(i);
      const z = pos.getZ(i);
      const r = Math.hypot(x, z);
      const angle = Math.atan2(z, x);

      if (r > 0.01) {
        const edgeNoise =
          Math.sin(angle * 6.7) * 0.028 +
          Math.cos(angle * 11.4) * 0.018 +
          Math.sin(angle * 3.1 + 0.8) * 0.014 +
          Math.cos(angle * 17.2) * 0.008;
        const scale = 1 + (r > 0.72 ? edgeNoise : edgeNoise * 0.28);
        pos.setX(i, x * scale);
        pos.setZ(i, z * scale);
      }

      const nr = Math.hypot(pos.getX(i), pos.getZ(i));
      // Center well so toppings sit in a natural dip
      if (y > 0) {
        const dip = Math.max(0, 1 - nr / 0.88) ** 1.35 * style.height * 0.38;
        const blister =
          nr > 0.55
            ? Math.sin(angle * 8 + nr * 10) * style.height * 0.04
            : 0;
        y = y - dip + blister;
        pos.setY(i, y);
      } else {
        // Soft underside unevenness
        pos.setY(i, y + Math.sin(angle * 5) * 0.004 * style.height);
      }
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
    return geo;
  }, [style.height]);

  const crustGeo = useMemo(() => {
    const points = [];
    const segments = 96;
    for (let i = 0; i <= segments; i += 1) {
      const t = (i / segments) * Math.PI * 2;
      const wobble =
        0.93 +
        Math.sin(t * 5.5) * 0.038 +
        Math.cos(t * 9.2) * 0.028 +
        Math.sin(t * 2.4 + 1.1) * 0.018;
      const yLift =
        Math.abs(Math.sin(t * 4.2)) * 0.035 +
        Math.sin(t * 7.1) * 0.012;
      points.push(
        new THREE.Vector3(Math.cos(t) * wobble, yLift, Math.sin(t) * wobble),
      );
    }
    const curve = new THREE.CatmullRomCurve3(points, true, 'catmullrom', 0.45);
    const tube = new THREE.TubeGeometry(curve, 128, rimRadius, 14, true);
    const pos = tube.attributes.position;
    for (let i = 0; i < pos.count; i += 1) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const angle = Math.atan2(z, x);
      const puff = 1 + Math.sin(angle * 6 + y * 20) * 0.045;
      pos.setXYZ(i, x * puff, y * (0.9 + Math.abs(Math.sin(angle * 3)) * 0.35), z * puff);
    }
    pos.needsUpdate = true;
    tube.computeVertexNormals();
    return tube;
  }, [rimRadius]);

  return (
    <group>
      <mesh
        geometry={doughGeo}
        castShadow
        receiveShadow
        position={[0, style.height / 2, 0]}
      >
        <meshStandardMaterial
          map={textures.crustMap}
          normalMap={textures.crustNormal}
          normalScale={new THREE.Vector2(0.7, 0.7)}
          color={style.color}
          roughness={0.94}
          metalness={0.015}
        />
      </mesh>
      <mesh
        geometry={crustGeo}
        castShadow
        receiveShadow
        position={[0, style.height * 0.42, 0]}
      >
        <meshStandardMaterial
          map={textures.crustMap}
          normalMap={textures.crustNormal}
          normalScale={new THREE.Vector2(0.85, 0.85)}
          color={style.rim}
          roughness={0.9}
          metalness={0.02}
        />
      </mesh>
    </group>
  );
}

export default PizzaBase;
