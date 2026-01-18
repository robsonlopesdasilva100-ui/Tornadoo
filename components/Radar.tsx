
import React from 'react';
import * as THREE from 'three';

interface RadarProps {
  position: THREE.Vector3;
  active: boolean;
}

const Radar: React.FC<RadarProps> = ({ position, active }) => {
  return (
    <group position={position}>
      {/* Base */}
      <mesh position={[0, 0.2, 0]} castShadow>
        <boxGeometry args={[0.6, 0.4, 0.6]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      {/* Antena */}
      <mesh position={[0, 0.8, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.8]} />
        <meshStandardMaterial color="#666" />
      </mesh>
      {/* Luz indicadora */}
      <mesh position={[0, 1.2, 0]}>
        <sphereGeometry args={[0.1]} />
        <meshStandardMaterial 
          color={active ? "#00ff00" : "#ff0000"} 
          emissive={active ? "#00ff00" : "#ff0000"} 
          emissiveIntensity={2} 
        />
      </mesh>
      {active && <pointLight position={[0, 1.2, 0]} intensity={1} color="#00ff00" distance={5} />}
    </group>
  );
};

export default Radar;
