import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';

function Model({ path, scale = [1, 1, 1], position = [0, 0, 0] }) {
    const { scene } = useGLTF(path);
    return <primitive object={scene} scale={scale} position={position} />;
}

function App() {
    return (
        <div style={{ width: '100vw', height: '100vh' }}>
            <Canvas camera={{ position: [0, 2, -120], fov: 50 }}>
                {/* Lights */}
                <ambientLight intensity={0.5} />
                <directionalLight position={[5, 5, 5]} intensity={1} />

                {/* Background model - Larger scale and positioned further back */}
                <Model path="/background.glb" scale={[200, 200, 200]} position={[0, 0, -5]} />

                {/* Pacman model - Positioned closer to the camera */}
                <Model path="/pacman.glb" scale={[1, 1, 1]} position={[0, -40, 0]} />

                {/* OrbitControls to enable 360-degree rotation */}
                <OrbitControls enableZoom={true} maxPolarAngle={Math.PI} minPolarAngle={0} />
            </Canvas>
        </div>
    );
}

export default App;
