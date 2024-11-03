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
  isZoomedIn,
}) {
  const { scene, animations } = useGLTF(path);
  const { actions } = useAnimations(animations, scene);
  const [hovered, setHovered] = useState(false);
  const initialPosition = useRef([...position]);

  useEffect(() => {
    if (isZoomedIn || (hovered && interactive)) {
      Object.values(actions).forEach((action) => action.play());
    } else {
      Object.values(actions).forEach((action) => action.stop());
    }
  }, [isZoomedIn, hovered, actions, interactive]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    if (id === 'console') {
      scene.rotation.y = -Math.PI / 2.5;
    }

    if (fly) {
      const radiusX = 20;
      const radiusZ = 60;
      const speed = 0.5;

      scene.position.x =
        initialPosition.current[0] + radiusX * Math.cos(t * speed);
      scene.position.z =
        initialPosition.current[2] + radiusZ * Math.sin(t * speed);

      const baseY =
        initialPosition.current[1] + Math.sin(t * speed * 2) * 5;

      if (!isZoomedIn && hovered && interactive) {
        scene.position.y = baseY + Math.sin(t * 6) * 1.5;
      } else {
        scene.position.y = baseY;
      }
    } else if (!isZoomedIn && hovered && interactive) {
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
      const targetDistance = controlsRef.current.target.distanceTo(
        desiredCameraTarget
      );

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
  const [showButton, setShowButton] = useState(false);
  const [buttonVisible, setButtonVisible] = useState(false); // New state for visibility after delay
  const controlsRef = useRef();

  // New state variables for button interactions
  const [buttonHover, setButtonHover] = useState(false);
  const [buttonActive, setButtonActive] = useState(false);

  const handleModelClick = (id, { cameraPosition, cameraTarget }) => {
    if (currentFocus === id) {
      resetCamera();
    } else {
      setCameraState({ cameraPosition, cameraTarget });
      setCurrentFocus(id);
      if (id === 'console') {
        setShowButton(true);
        setButtonVisible(false); // Reset visibility state
        setTimeout(() => setButtonVisible(true), 3000); // Show button after 2 seconds
      } else {
        setShowButton(false);
        setButtonVisible(false);
      }
    }
  };

  const resetCamera = () => {
    setCameraState(null);
    setCurrentFocus(null);
    setShowButton(false);
    setButtonVisible(false);
  };

  // Updated button styles
  const buttonStyle = {
    position: 'absolute',
    top: '350px',
    left: '240px',
    padding: '20px 40px',
    fontSize: '30px',
    fontFamily: '"Press Start 2P", cursive',
    color: '#fff',
    background: 'linear-gradient(to bottom, #88ccff, #0055ff)', // Blue gradient
    border: '4px solid #fff',
    borderRadius: '15px',
    textShadow: '2px 2px #000',
    cursor: 'pointer',
    transition: 'opacity 0.5s ease, transform 0.25s ease, box-shadow 0.25s ease', // Smooth transition with opacity
    opacity: buttonVisible ? 1 : 0, // Controls opacity for fade-in
    transform: buttonActive
      ? 'scale(0.95) translateY(4px)'
      : buttonHover
      ? 'scale(1.05)'
      : 'scale(1)',
    boxShadow: buttonActive
      ? 'inset 0 2px 0 #aaddff, 0 4px 0 #0033aa, 0 4px 10px rgba(0,0,0,0.5)'
      : buttonHover
      ? 'inset 0 4px 0 #aaddff, 0 8px 0 #0033aa, 0 8px 20px rgba(0,0,0,0.5)'
      : 'inset 0 4px 0 #aaddff, 0 6px 0 #0033aa, 0 6px 15px rgba(0,0,0,0.5)',
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
          cameraPosition={[0, 20, 30]}
          cameraTarget={[0, -10, -10]}
          isZoomedIn={currentFocus !== null}
        />

        <Model
          id="console"
          path="/console.glb"
          scale={[7, 7, 7]}
          position={[-90, -35, 20]}
          interactive={true}
          onClick={handleModelClick}
          cameraPosition={[-30, -25, 40]}
          cameraTarget={[-70, -25, 35]}
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
          minDistance={20}
          maxDistance={190}
          maxPolarAngle={Math.PI}
          minPolarAngle={0}
        />
      </Canvas>
      {showButton && (
        <button
          style={buttonStyle}
          onMouseEnter={() => setButtonHover(true)}
          onMouseLeave={() => {
            setButtonHover(false);
            setButtonActive(false);
          }}
          onMouseDown={() => setButtonActive(true)}
          onMouseUp={() => setButtonActive(false)}
        >
          Start
        </button>
      )}
    </div>
  );
}

export default App;
