import { lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import PizzaFallback from './PizzaFallback';
import { defaultCustomization } from './pizzaVisualConfig';
import { canUseWebGL, prefersReducedMotion } from '../../utils/webgl';

const PizzaCanvas = lazy(() => import('./PizzaCanvas'));

const heroCustomization = {
  ...defaultCustomization,
  size: 'large',
  base: 'cheese_burst',
  sauce: 'tomato',
  cheese: 'mozzarella',
  vegetables: ['mushroom', 'olives', 'capsicum', 'onion', 'tomato'],
  extraCheese: true,
};

/**
 * Landing-page hero 3D pizza with lazy load + fallback.
 */
function PizzaHero({ className = '' }) {
  const webgl = typeof window !== 'undefined' ? canUseWebGL() : true;
  const reducedMotion =
    typeof window !== 'undefined' ? prefersReducedMotion() : false;

  if (!webgl) {
    return <PizzaFallback className={`min-h-[320px] ${className}`} />;
  }

  return (
    <motion.div
      className={`relative min-h-[280px] w-full sm:min-h-[360px] lg:min-h-[420px] ${className}`}
      initial={reducedMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      aria-label="Interactive 3D pizza preview"
    >
      <Suspense fallback={<PizzaFallback className="h-full min-h-[280px]" compact />}>
        <PizzaCanvas
          customization={heroCustomization}
          className="h-full min-h-[280px] sm:min-h-[360px] lg:min-h-[420px]"
          autoRotate
          float
          enableOrbit
          compactFallback
        />
      </Suspense>
    </motion.div>
  );
}

export default PizzaHero;
