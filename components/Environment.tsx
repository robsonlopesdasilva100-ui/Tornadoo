
import React from 'react';
import { Sky, Stars, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

interface EnvironmentProps {
  timeOfDay: number;
}

const Environment: React.FC<EnvironmentProps> = ({ timeOfDay }) => {
  const sunPos = new THREE.Vector3().setFromSphericalCoords(
    1,
    Math.PI * (timeOfDay / 24 - 0.5) * 2,
    Math.PI / 3
  );

  const isNight = timeOfDay > 18 || timeOfDay < 6;
  const lightIntensity = isNight ? 0.2 : 1.2;
  const skyTurbidity = isNight ? 10 : 2;
  const skyRayleigh = isNight ? 0.1 : 3;

  return (
    <>
      <Sky 
        sunPosition={sunPos} 
        turbidity={skyTurbidity} 
        rayleigh={skyRayleigh} 
        mieCoefficient={0.005} 
        mieDirectionalG={0.8} 
      />
      {isNight && <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />}
      
      <ambientLight intensity={lightIntensity * 0.5} color={isNight ? "#1a2a6c" : "#ffffff"} />
      <directionalLight 
        position={sunPos.clone().multiplyScalar(100)} 
        intensity={lightIntensity} 
        castShadow 
        shadow-mapSize={[2048, 2048]}
      />
      
      <ContactShadows 
        opacity={0.4} 
        scale={100} 
        blur={2} 
        far={10} 
        resolution={256} 
        color="#000000" 
      />
    </>
  );
};

export default Environment;
