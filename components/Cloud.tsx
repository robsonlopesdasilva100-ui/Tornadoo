
import React, { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface CloudProps {
  position: [number, number, number];
  speed: number;
}

const Cloud: React.FC<CloudProps> = ({ position, speed }) => {
  const meshRef = React.useRef<THREE.Group>(null);
  
  const cloudParts = useMemo(() => {
    return Array.from({ length: 5 }).map(() => ({
      pos: [
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 5,
        (Math.random() - 0.5) * 10
      ] as [number, number, number],
      scale: 5 + Math.random() * 8
    }));
  }, []);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.position.x += speed * delta;
      if (meshRef.current.position.x > 800) meshRef.current.position.x = -800;
    }
  });

  return (
    <group ref={meshRef} position={position}>
      {cloudParts.map((part, i) => (
        <mesh key={i} position={part.pos} castShadow>
          <boxGeometry args={[part.scale, part.scale * 0.6, part.scale]} />
          <meshStandardMaterial color="#333333" transparent opacity={0.8} flatShading />
        </mesh>
      ))}
    </group>
  );
};

export default Cloud;
