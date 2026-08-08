import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import PizzaBase from './PizzaBase';
import PizzaSauce from './PizzaSauce';
import PizzaCheese from './PizzaCheese';
import PizzaToppings from './PizzaToppings';
import {
  BASE_STYLE,
  SIZE_SCALE,
  defaultCustomization,
} from './pizzaVisualConfig';

/**
 * Composed procedural pizza. Purely visual — customization props only.
 */
function Pizza3D({
  customization = defaultCustomization,
  autoRotate = false,
  reducedMotion = false,
  float = false,
}) {
  const groupRef = useRef(null);
  const targetScale = SIZE_SCALE[customization.size] || 1;
  const baseStyle =
    BASE_STYLE[customization.base] || BASE_STYLE.thin_crust;
  const baseHeight = baseStyle.height;

  const config = useMemo(
    () => ({
      ...defaultCustomization,
      ...customization,
      vegetables: customization.vegetables || [],
    }),
    [customization],
  );

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const current = groupRef.current.scale.x;
    const next = current + (targetScale - current) * Math.min(1, delta * 6);
    groupRef.current.scale.setScalar(next);

    if (!reducedMotion && autoRotate) {
      groupRef.current.rotation.y += delta * 0.25;
    }

    if (!reducedMotion && float) {
      groupRef.current.position.y =
        Math.sin(state.clock.elapsedTime * 0.55) * 0.035;
    }
  });

  return (
    <group ref={groupRef} scale={targetScale} rotation={[-0.55, 0.32, 0.03]}>
      <PizzaBase base={config.base} />
      <PizzaSauce sauce={config.sauce} baseHeight={baseHeight} />
      <PizzaCheese cheese={config.cheese} baseHeight={baseHeight} />
      {config.extraCheese ? (
        <PizzaCheese
          cheese={config.cheese}
          baseHeight={baseHeight}
          extra
          opacity={0.82}
        />
      ) : null}
      <PizzaToppings
        vegetables={config.vegetables}
        baseHeight={baseHeight}
        reducedMotion={reducedMotion}
      />
    </group>
  );
}

export default Pizza3D;
