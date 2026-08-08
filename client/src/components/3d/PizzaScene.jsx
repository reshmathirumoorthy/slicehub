import { Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { ContactShadows, OrbitControls } from '@react-three/drei';
import Pizza3D from './Pizza3D';
import { defaultCustomization } from './pizzaVisualConfig';

/**
 * Shared R3F canvas wrapper for the procedural pizza.
 */
function PizzaScene({
  customization = defaultCustomization,
  className = '',
  autoRotate = false,
  enableOrbit = true,
  float = false,
  reducedMotion = false,
  dpr = [1, 1.5],
}) {
  const camera = useMemo(() => ({ position: [0, 2.2, 3.2], fov: 42 }), []);

  return (
    <div className={`relative h-full w-full ${className}`}>
      <Canvas
        shadows
        camera={camera}
        dpr={dpr}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        style={{ touchAction: 'none' }}
      >
        <ambientLight intensity={0.65} />
        <directionalLight
          castShadow
          position={[3, 5, 2]}
          intensity={1.2}
          shadow-mapSize={[1024, 1024]}
        />
        <spotLight position={[-3, 4, 2]} intensity={0.4} color="#ffc857" />
        <hemisphereLight intensity={0.35} groundColor="#1a120e" />

        <Suspense fallback={null}>
          <Pizza3D
            customization={customization}
            autoRotate={autoRotate}
            reducedMotion={reducedMotion}
            float={float}
          />
          <ContactShadows
            position={[0, -0.55, 0]}
            opacity={0.35}
            scale={6}
            blur={2.4}
            far={3}
          />
        </Suspense>

        {enableOrbit ? (
          <OrbitControls
            enablePan={false}
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={Math.PI / 2.2}
            minDistance={2.4}
            maxDistance={5}
            autoRotate={autoRotate && !reducedMotion}
            autoRotateSpeed={0.6}
          />
        ) : null}
      </Canvas>
    </div>
  );
}

export default PizzaScene;
