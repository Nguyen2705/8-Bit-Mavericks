// App.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';

function Model({
  id,
  path,
  scale = [1, 1, 1],
  position = [0, 0, 0],
  interactive = true,
  fly = false,
  onClick,
  cameraPosition,
  cameraTarget,
  isZoomedIn, // New prop to control hover
}) {
  const { scene, animations } = useGLTF(path);
  const { actions } = useAnimations(animations, scene);
  const [hovered, setHovered] = useState(false);
  const initialPosition = useRef([...position]);

  useEffect(() => {
    if (isZoomedIn || (hovered && interactive)) {
      // Play animation if zoomed in or hovered (when zoomed out)
      Object.values(actions).forEach((action) => action.play());
    } else {
      Object.values(actions).forEach((action) => action.stop());
    }
  }, [isZoomedIn, hovered, actions, interactive]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    if (fly) {
      // Smooth circular motion
      const radiusX = 20;
      const radiusZ = 60;
      const speed = 0.5;

      scene.position.x = initialPosition.current[0] + radiusX * Math.cos(t * speed);
      scene.position.z = initialPosition.current[2] + radiusZ * Math.sin(t * speed);

      const baseY = initialPosition.current[1] + Math.sin(t * speed * 2) * 5;

      if (!isZoomedIn && hovered && interactive) {
        // Apply hover effect only when not zoomed in
        scene.position.y = baseY + Math.sin(t * 6) * 1.5;
      } else {
        scene.position.y = baseY;
      }
    } else if (!isZoomedIn && hovered && interactive) {
      // Apply hover effect when not flying and not zoomed in
      scene.position.y = initialPosition.current[1] + Math.sin(t * 6) * 1.5;
    } else {
      scene.position.set(...initialPosition.current);
    }
  });

  return (
    <primitive
      object={scene}
      scale={scale}
      onPointerOver={(e) => {
        e.stopPropagation();
        if (interactive && !isZoomedIn) setHovered(true);
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        if (interactive) setHovered(false);
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (interactive && onClick) {
          onClick(id, { cameraPosition, cameraTarget });
        }
      }}
    />
  );
}

function CameraController({ cameraState, controlsRef }) {
  const { camera } = useThree();
  const initialCameraPosition = useRef(camera.position.clone());
  const initialCameraTarget = useRef();
  const isInitialTargetSet = useRef(false);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (controlsRef.current && !isInitialTargetSet.current) {
      initialCameraTarget.current = controlsRef.current.target.clone();
      isInitialTargetSet.current = true;
    }
  }, [controlsRef]);

  useEffect(() => {
    if (cameraState) {
      setAnimating(true);
    } else {
      setAnimating(true);
    }
  }, [cameraState]);

  useFrame(() => {
    if (controlsRef.current && isInitialTargetSet.current && animating) {
      let desiredCameraPosition, desiredCameraTarget;

      if (cameraState) {
        desiredCameraPosition = new THREE.Vector3(...cameraState.cameraPosition);
        desiredCameraTarget = new THREE.Vector3(...cameraState.cameraTarget);
      } else {
        desiredCameraPosition = initialCameraPosition.current;
        desiredCameraTarget = initialCameraTarget.current;
      }

      const positionDistance = camera.position.distanceTo(desiredCameraPosition);
      const targetDistance = controlsRef.current.target.distanceTo(desiredCameraTarget);

      if (positionDistance > 0.1 || targetDistance > 0.1) {
        camera.position.lerp(desiredCameraPosition, 0.1);
        controlsRef.current.target.lerp(desiredCameraTarget, 0.1);
        controlsRef.current.update();
      } else {
        camera.position.copy(desiredCameraPosition);
        controlsRef.current.target.copy(desiredCameraTarget);
        controlsRef.current.update();
        setAnimating(false);
      }
    }
  });

  return null;
}

function App() {
  const [cameraState, setCameraState] = useState(null);
  const [currentFocus, setCurrentFocus] = useState(null);
  const controlsRef = useRef();

  const handleModelClick = (id, { cameraPosition, cameraTarget }) => {
    if (currentFocus === id) {
      // If the model is already focused, reset the camera to zoom out
      resetCamera();
    } else {
      // Zoom in to the clicked model
      setCameraState({ cameraPosition, cameraTarget });
      setCurrentFocus(id);
    }
  };

  const resetCamera = () => {
    setCameraState(null);
    setCurrentFocus(null);
  };

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas
        camera={{ position: [0, 10, 170], fov: 50 }}
        onPointerDown={(e) => {
          if (e.button === 0 && !currentFocus) {
            resetCamera();
          }
        }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} />

        <Model
          id="background"
          path="/background.glb"
          scale={[200, 200, 200]}
          position={[0, 0, -5]}
          interactive={false}
          isZoomedIn={currentFocus !== null}
        />

        <Model
          id="pacman"
          path="/pacman.glb"
          scale={[1, 1, 1]}
          position={[0, -40, 0]}
          interactive={true}
          onClick={handleModelClick}
          cameraPosition={[0, 20, 40]}
          cameraTarget={[0, -10, -10]}
          isZoomedIn={currentFocus !== null}
        />

        <Model
          id="console"
          path="/console.glb"
          scale={[7, 7, 7]}
          position={[-60, -35, 50]}
          interactive={true}
          onClick={handleModelClick}
          cameraPosition={[-60, -25, 70]}
          cameraTarget={[-60, -35, 50]}
          isZoomedIn={currentFocus !== null}
        />

        <Model
          id="dance"
          path="/dance.glb"
          scale={[12, 12, 12]}
          position={[-120, -35, 20]}
          interactive={true}
          onClick={handleModelClick}
          cameraPosition={[80, 25, 40]}
          cameraTarget={[80, -35, 20]}
          isZoomedIn={currentFocus !== null}
        />

        <Model
          id="gameboy"
          path="/gameboy.glb"
          scale={[2, 2, 2]}
          position={[-50, 10, 20]}
          interactive={true}
          fly={true}
          isZoomedIn={currentFocus !== null}
        />

        <CameraController cameraState={cameraState} controlsRef={controlsRef} />

        <OrbitControls
          ref={controlsRef}
          enableZoom={true}
          minDistance={10}
          maxDistance={500}
          maxPolarAngle={Math.PI}
          minPolarAngle={0}
        />
      </Canvas>
    </div>
  );
}

export default App;
