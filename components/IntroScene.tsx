
import React, { useState, useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera, Text } from '@react-three/drei';
import * as THREE from 'three';

interface IntroSceneProps {
  onComplete: () => void;
  lang: 'PT' | 'EN';
}

const IntroScene: React.FC<IntroSceneProps> = ({ onComplete, lang }) => {
  const { camera } = useThree();
  const [phase, setPhase] = useState<'WATCHING' | 'EMERGENCY' | 'TRANSITION'>('WATCHING');
  const [lightning, setLightning] = useState(false);
  const screenRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    const timeouts = [
      setTimeout(() => setPhase('EMERGENCY'), 3000),
      setTimeout(() => setPhase('TRANSITION'), 6500),
      setTimeout(() => onComplete(), 9500),
    ];
    return () => timeouts.forEach(clearTimeout);
  }, [onComplete]);

  useFrame((state) => {
    if (phase === 'WATCHING') {
      camera.position.lerp(new THREE.Vector3(0, 2.2, 2.5), 0.05);
      camera.lookAt(0, 2, -5);
    } else if (phase === 'EMERGENCY') {
      camera.position.x += (Math.random() - 0.5) * 0.05;
      camera.position.y += (Math.random() - 0.5) * 0.05;
      camera.lookAt(0, 2, -5);
      if (Math.random() > 0.95) {
          setLightning(true);
          setTimeout(() => setLightning(false), 50);
      }
    } else if (phase === 'TRANSITION') {
      camera.position.lerp(new THREE.Vector3(-2.5, 2.5, 2), 0.04);
      camera.lookAt(-100, 2, 2);
    }
    
    if (screenRef.current && phase === 'EMERGENCY') {
        const intensity = Math.sin(state.clock.elapsedTime * 25) > 0 ? 5 : 0.5;
        if (screenRef.current.material) {
            (screenRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = intensity;
        }
    }
  });

  const getStatusText = (): string => {
    if (phase === 'WATCHING') return "MONITORAMENTO:\nESTÁVEL";
    if (phase === 'EMERGENCY') return "!!! ALERTA !!!\nPROCURE ABRIGO\nTORNADO EF5";
    return "...";
  };

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 2, 6]} fov={60} />
      <ambientLight intensity={lightning ? 2.5 : 0.4} color="#ffffff" />
      <pointLight position={[0, 4, 0]} intensity={lightning ? 1 : 4} color="#ffcc80" />

      <group>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
          <planeGeometry args={[20, 20]} />
          <meshStandardMaterial color="#2d1b0d" />
        </mesh>
        
        <mesh position={[0, 4, -5]}>
          <boxGeometry args={[10, 8, 0.5]} />
          <meshStandardMaterial color="#4e342e" />
        </mesh>

        <group position={[-5, 4, 0]} rotation={[0, Math.PI / 2, 0]}>
          <mesh position={[0, 2.5, 0]}><boxGeometry args={[10, 3, 0.5]} /><meshStandardMaterial color="#4e342e" /></mesh>
          <mesh position={[0, -2.5, 0]}><boxGeometry args={[10, 3, 0.5]} /><meshStandardMaterial color="#4e342e" /></mesh>
          <mesh position={[-3.5, 0, 0]}><boxGeometry args={[3, 2, 0.5]} /><meshStandardMaterial color="#4e342e" /></mesh>
          <mesh position={[3.5, 0, 0]}><boxGeometry args={[3, 2, 0.5]} /><meshStandardMaterial color="#4e342e" /></mesh>
        </group>

        <mesh position={[5, 4, 0]} rotation={[0, Math.PI / 2, 0]}>
          <boxGeometry args={[10, 8, 0.5]} />
          <meshStandardMaterial color="#4e342e" />
        </mesh>

        <group position={[0, 2.2, -4.1]}>
          <mesh><boxGeometry args={[3.4, 2, 0.2]} /><meshStandardMaterial color="#000" /></mesh>
          <mesh ref={screenRef} position={[0, 0, 0.11]}>
            <planeGeometry args={[3.2, 1.8]} />
            <meshStandardMaterial color={phase === 'EMERGENCY' ? "#ff0000" : "#0d47a1"} emissive={phase === 'EMERGENCY' ? "#ff0000" : "#0d47a1"} emissiveIntensity={1} />
          </mesh>
          <Text 
            position={[0, 0, 0.15]} 
            fontSize={0.16} 
            color="white" 
            anchorX="center" 
            anchorY="middle" 
            maxWidth={2.8} 
            textAlign="center"
          >
            {getStatusText() || ""}
          </Text>
        </group>

        <group position={[-4.8, 4, 0]}>
             <mesh rotation={[0, Math.PI/2, 0]}>
                <planeGeometry args={[4, 2]} />
                <meshStandardMaterial color="#050510" emissive={lightning ? "#ffffff" : "#000000"} emissiveIntensity={lightning ? 5 : 0} />
             </mesh>
             <group rotation={[0, Math.PI/2, 0]}>
                <mesh position={[0, 1, 0.1]}><boxGeometry args={[4.2, 0.2, 0.1]} /><meshStandardMaterial color="#211105" /></mesh>
                <mesh position={[0, -1, 0.1]}><boxGeometry args={[4.2, 0.2, 0.1]} /><meshStandardMaterial color="#211105" /></mesh>
                <mesh position={[0, 0, 0.1]}><boxGeometry args={[4, 0.05, 0.05]} /><meshStandardMaterial color="#211105" /></mesh>
             </group>
        </group>
      </group>
    </>
  );
};

export default IntroScene;
