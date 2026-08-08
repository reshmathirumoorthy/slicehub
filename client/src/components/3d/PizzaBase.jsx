import { useMemo } from 'react';
import { BASE_STYLE } from './pizzaVisualConfig';

/**
 * Procedural pizza crust / base disk.
 */
function PizzaBase({ base = 'thin_crust' }) {
  const style = BASE_STYLE[base] || BASE_STYLE.thin_crust;

  const rimGeo = useMemo(() => ({ args: [1.02, 0.9, 32] }), []);

  return (
    <group>
      <mesh castShadow receiveShadow position={[0, style.height / 2, 0]}>
        <cylinderGeometry args={[1, 1.02, style.height, 48]} />
        <meshStandardMaterial color={style.color} roughness={0.85} />
      </mesh>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, style.height + 0.001, 0]}
      >
        <ringGeometry args={rimGeo.args} />
        <meshStandardMaterial color={style.rim} roughness={0.7} />
      </mesh>
    </group>
  );
}

export default PizzaBase;
