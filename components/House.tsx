
import React, { useMemo } from 'react';
import * as THREE from 'three';
import { getTerrainHeight } from './Terrain';

interface HouseProps {
  position: [number, number];
  isDestroyed?: boolean;
}

const House: React.FC<HouseProps> = ({ position, isDestroyed = false }) => {
  const x = position[0];
  const z = position[1];
  const y = getTerrainHeight(x, z);

  const debris = useMemo(() => {
    return Array.from({ length: 8 }).map(() => ({
      pos: [(Math.random() - 0.5) * 8, 0.2, (Math.random() - 0.5) * 8] as [number, number, number],
      rot: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI] as [number, number, number],
      scale: 0.5 + Math.random() * 1.5
    }));
  }, []);

  return (
    <group position={[x, y, z]}>
      {!isDestroyed ? (
        <>
          {/* Fundação Rígida */}
          <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
            <boxGeometry args={[8, 0.5, 7]} />
            <meshStandardMaterial color="#424242" />
          </mesh>
          
          {/* Paredes Principais */}
          <mesh position={[0, 2.5, 0]} castShadow receiveShadow>
            <boxGeometry args={[7, 4, 6]} />
            <meshStandardMaterial color="#795548" roughness={1} />
          </mesh>
          
          {/* Telhado Robusto */}
          <mesh position={[0, 5, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
            <coneGeometry args={[6, 3, 4]} />
            <meshStandardMaterial color="#3e2723" flatShading />
          </mesh>
          
          {/* Chaminé */}
          <mesh position={[2, 5.5, 1]} castShadow>
            <boxGeometry args={[1, 3, 1]} />
            <meshStandardMaterial color="#212121" />
          </mesh>
          
          {/* Janelas */}
          <mesh position={[-2.2, 2.5, 3.01]}>
            <boxGeometry args={[1.2, 1.2, 0.2]} />
            <meshStandardMaterial color="#fff176" emissive="#fff176" emissiveIntensity={1} />
          </mesh>
          <mesh position={[2.2, 2.5, 3.01]}>
            <boxGeometry args={[1.2, 1.2, 0.2]} />
            <meshStandardMaterial color="#fff176" emissive="#fff176" emissiveIntensity={1} />
          </mesh>
          
          <pointLight position={[0, 2.5, 0]} intensity={5} color="#ffcc80" distance={20} />
        </>
      ) : (
        <>
          {/* Ruínas */}
          <mesh position={[0, 0.1, 0]}>
            <boxGeometry args={[9, 0.3, 8]} />
            <meshStandardMaterial color="#212121" />
          </mesh>
          
          {debris.map((d, i) => (
            <mesh key={i} position={d.pos} rotation={d.rot}>
              <boxGeometry args={[d.scale, d.scale * 0.4, d.scale * 0.8]} />
              <meshStandardMaterial color={i % 2 === 0 ? "#3e2723" : "#424242"} />
            </mesh>
          ))}

          {/* Fumaça / Fogo nas ruínas */}
          <pointLight position={[0, 1, 0]} intensity={2} color="#ff4400" distance={15} />
          <mesh position={[0, 1.5, 0]}>
            <sphereGeometry args={[1.5, 8, 8]} />
            <meshStandardMaterial color="#111" transparent opacity={0.4} />
          </mesh>
        </>
      )}
    </group>
  );
};

export default House;
