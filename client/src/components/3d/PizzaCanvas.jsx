import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import PizzaFallback from './PizzaFallback';
import { defaultCustomization } from './pizzaVisualConfig';
import { canUseWebGL, prefersReducedMotion } from '../../utils/webgl';

const PizzaScene = lazy(() => import('./PizzaScene'));

/**
 * Public wrapper used by builder / hero.
 * Handles WebGL detection, Suspense, and reduced-motion.
 */
function PizzaCanvas({
  customization = defaultCustomization,
  className = '',
  autoRotate = false,
  enableOrbit = true,
  float = false,
  compactFallback = false,
}) {
  const [webgl, setWebgl] = useState(true);
  const reducedMotion = useMemo(() => prefersReducedMotion(), []);

  useEffect(() => {
    setWebgl(canUseWebGL());
  }, []);

  if (!webgl) {
    return (
      <PizzaFallback className={className} compact={compactFallback} />
    );
  }

  return (
    <Suspense
      fallback={
        <PizzaFallback className={className} compact label="Loading 3D pizza" />
      }
    >
      <PizzaScene
        customization={customization}
        className={className}
        autoRotate={autoRotate && !reducedMotion}
        enableOrbit={enableOrbit}
        float={float && !reducedMotion}
        reducedMotion={reducedMotion}
        dpr={typeof window !== 'undefined' && window.innerWidth < 768 ? [1, 1.25] : [1, 1.75]}
      />
    </Suspense>
  );
}

export default PizzaCanvas;
