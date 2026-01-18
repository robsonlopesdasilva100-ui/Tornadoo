
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TreeData } from '../types';

interface TreeProps {
  data: TreeData;
  tornadoPos: THREE.Vector3;
  onDestroy: (id: number) => void;
}

const Tree: React.FC<TreeProps> = ({ data, tornadoPos, onDestroy }) => {
  const meshRef = useRef<THREE.Group>(null);
  const trunkHeight = data.scale * 4;

  useFrame((state, delta) => {
    if (!meshRef.current || data.destroyed) return;
    const dist = meshRef.current.position.distanceTo(tornadoPos);
    if (dist < 8) {
      onDestroy(data.id);
    }
  });

  if (data.destroyed) return null;

  return (
    <group ref={meshRef} position={data.position}>
      <mesh position={[0, trunkHeight / 2, 0]} castShadow>
        <boxGeometry args={[1, trunkHeight, 1]} />
        <meshStandardMaterial color="#3e2723" />
      </mesh>
      <mesh position={[0, trunkHeight + 2, 0]} castShadow>
        <boxGeometry args={[data.scale * 3, 3, data.scale * 3]} />
        <meshStandardMaterial color="#1b5e20" />
      </mesh>
      <mesh position={[0, trunkHeight + 4.5, 0]} castShadow>
        <boxGeometry args={[data.scale * 2, 2.5, data.scale * 2]} />
        <meshStandardMaterial color="#2e7d32" />
      </mesh>
      <mesh position={[0, trunkHeight + 6, 0]} castShadow>
        <boxGeometry args={[data.scale * 1, 1.5, data.scale * 1]} />
        <meshStandardMaterial color="#4caf50" />
      </mesh>
    </group>
  );
};

export default Tree;
