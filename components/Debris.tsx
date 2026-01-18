
import React from 'react';
import * as THREE from 'three';

interface DebrisProps {
  position: [number, number, number];
}

const Debris: React.FC<DebrisProps> = ({ position }) => {
  return (
    <group position={position}>
      <mesh rotation={[Math.random(), Math.random(), Math.random()]}>
        <boxGeometry args={[0.4, 0.2, 0.8]} />
        <meshStandardMaterial color="#3e2723" />
      </mesh>
      <mesh position={[0.3, 0, 0.3]} rotation={[Math.random(), Math.random(), Math.random()]}>
        <boxGeometry args={[0.5, 0.1, 0.5]} />
        <meshStandardMaterial color="#2e7d32" />
      </mesh>
    </group>
  );
};

export default Debris;
