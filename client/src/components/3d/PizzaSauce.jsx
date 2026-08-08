import { SAUCE_COLOR } from './pizzaVisualConfig';

/**
 * Sauce layer sitting on the crust.
 */
function PizzaSauce({ sauce = 'tomato', baseHeight = 0.1 }) {
  const color = SAUCE_COLOR[sauce] || SAUCE_COLOR.tomato;

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, baseHeight + 0.01, 0]}
      receiveShadow
    >
      <circleGeometry args={[0.88, 48]} />
      <meshStandardMaterial color={color} roughness={0.55} metalness={0.05} />
    </mesh>
  );
}

export default PizzaSauce;
