import { Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { ContactShadows, Environment, OrbitControls } from '@react-three/drei';
import Pizza3D from './Pizza3D';
import { defaultCustomization } from './pizzaVisualConfig';

/**
 * Food-photography style lighting + soft orbit around the procedural pizza.
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
  const camera = useMemo(
    () => ({ position: [0.15, 2.55, 2.85], fov: 38, near: 0.1, far: 40 }),
    [],
  );

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
          toneMappingExposure: 1.05,
        }}
        style={{ touchAction: 'none' }}
      >
        <ambientLight intensity={0.42} color="#fff6ea" />
        <hemisphereLight
          intensity={0.55}
          color="#ffe8cc"
          groundColor="#1a120e"
        />
        <directionalLight
          castShadow
          position={[3.2, 5.6, 2.4]}
          intensity={1.35}
          color="#fff2d8"
          shadow-mapSize={[1024, 1024]}
          shadow-bias={-0.00025}
        />
        <directionalLight
          position={[-2.8, 3.4, -1.8]}
          intensity={0.35}
          color="#ffd4a8"
        />
        <spotLight
          position={[0.2, 4.8, 1.2]}
          angle={0.42}
          penumbra={0.75}
          intensity={0.55}
          color="#ffe6c2"
          castShadow
        />

        <Suspense fallback={null}>
          <Environment preset="apartment" environmentIntensity={0.28} />
          <Pizza3D
            customization={customization}
            autoRotate={autoRotate}
            reducedMotion={reducedMotion}
            float={float}
          />
          <ContactShadows
            position={[0, -0.55, 0]}
            opacity={0.48}
            scale={7}
            blur={2.8}
            far={3.5}
          />
        </Suspense>

        {enableOrbit ? (
          <OrbitControls
            enablePan={false}
            target={[0, 0.05, 0]}
            minPolarAngle={Math.PI / 3.6}
            maxPolarAngle={Math.PI / 2.2}
            minDistance={2.4}
            maxDistance={4.6}
            autoRotate={autoRotate && !reducedMotion}
            autoRotateSpeed={0.4}
            enableDamping
            dampingFactor={0.08}
          />
        ) : null}
      </Canvas>
    </div>
  );
}

export default PizzaScene;
