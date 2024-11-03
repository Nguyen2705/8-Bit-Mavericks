import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, useAnimations } from '@react-three/drei';

function Model({ path, scale = [1, 1, 1], position = [0, 0, 0] }) {
  const { scene, animations } = useGLTF(path);
  const { actions } = useAnimations(animations, scene);

  React.useEffect(() => {
    if (actions) {
      Object.values(actions).forEach((action) => action.play());
    }
  }, [actions]);

  return <primitive object={scene} scale={scale} position={position} />;
}

function App() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas camera={{ position: [0, 2, 120], fov: 50 }}>
        {/* Lights */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} />

        {/* Background model */}
        <Model path="/background.glb" scale={[200, 200, 200]} position={[0, 0, -5]} />

        {/* Pacman model */}
        <Model path="/pacman.glb" scale={[1, 1, 1]} position={[0, -40, 0]} />

        {/* Console model */}
        <Model path="/console.glb" scale={[7, 7, 7]} position={[-60, -35, 50]} />

        {/* OrbitControls to enable 360-degree rotation */}
        <OrbitControls
          enableZoom={true}
          minDistance={50}
          maxDistance={150}
          maxPolarAngle={Math.PI}
          minPolarAngle={0}
        />
      </Canvas>
    </div>
  );
}

export default App;
