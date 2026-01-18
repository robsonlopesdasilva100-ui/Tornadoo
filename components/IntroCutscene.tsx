
import React, { useState, useEffect } from 'react';
import { PerspectiveCamera, Text, Float, Sky } from '@react-three/drei';
import * as THREE from 'three';
import Tornado from './Tornado';
import Terrain from './Terrain';

interface Props {
  onComplete: () => void;
}

const IntroCutscene: React.FC<Props> = ({ onComplete }) => {
  const [showText, setShowText] = useState(false);
  const [tornadoTarget] = useState(new THREE.Vector3(-100, 0, -300));
  
  useEffect(() => {
    const t1 = setTimeout(() => setShowText(true), 2000);
    const t2 = setTimeout(() => onComplete(), 7000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onComplete]);

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 2, 0]} fov={50} />
      <Sky sunPosition={[0, -1, -1]} turbidity={10} rayleigh={0.1} />
      <fog attach="fog" args={["#050510", 10, 500]} />
      <ambientLight intensity={0.1} />
      
      <Terrain size={1500} />
      
      {/* O Tornado Gigante e Lento no horizonte */}
      <group position={[-100, 0, -400]}>
        <Tornado targetPos={tornadoTarget} />
      </group>

      {showText && (
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
          <Text
            position={[0, 2.5, -5]}
            fontSize={0.25}
            color="white"
            maxWidth={4}
            textAlign="center"
          >
            "Parece que começou cedo..."
          </Text>
        </Float>
      )}

      {/* Simulação de silhueta do personagem (braços/ombros) */}
      <mesh position={[0.4, 1.2, -0.5]} rotation={[0.2, 0, 0.1]}>
        <boxGeometry args={[0.2, 0.8, 0.2]} />
        <meshStandardMaterial color="#111" />
      </mesh>
    </>
  );
};

export default IntroCutscene;
