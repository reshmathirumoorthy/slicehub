import { CHEESE_COLOR } from './pizzaVisualConfig';

/**
 * Cheese layer (and optional extra cheese pass).
 */
function PizzaCheese({
  cheese = 'mozzarella',
  baseHeight = 0.1,
  extra = false,
  opacity = 1,
}) {
  const color = CHEESE_COLOR[cheese] || CHEESE_COLOR.mozzarella;
  const y = baseHeight + (extra ? 0.035 : 0.02);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, y, 0]} receiveShadow>
      <circleGeometry args={[extra ? 0.84 : 0.86, 48]} />
      <meshStandardMaterial
        color={color}
        roughness={0.45}
        transparent={opacity < 1}
        opacity={opacity}
      />
    </mesh>
  );
}

export default PizzaCheese;
