
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Upgrades, CarModelId } from '../types';

interface CarProps {
  model: CarModelId;
  position: THREE.Vector3;
  rotation: number;
  tornadoPos: THREE.Vector3;
  isDriving: boolean;
  health: number;
  upgrades: Upgrades;
}

const Car: React.FC<CarProps> = ({ model, position, rotation, tornadoPos, isDriving, health, upgrades }) => {
  const groupRef = useRef<THREE.Group>(null);
  const flyRef = useRef({ velocityY: 0, isFlying: false, rotationX: 0, rotationZ: 0 });

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    const dist = groupRef.current.position.distanceTo(tornadoPos);
    
    // Model resistance factors
    const weightFactor = model === 'beast' ? 0.4 : (model === 'tracker' ? 0.8 : 1.2);
    
    // Stability upgrade reduces pull from tornado
    const pullThreshold = (40 + (upgrades.chassis * 5)) * weightFactor;
    const pullStrength = Math.max(0, 100 - (upgrades.chassis * 15)) * weightFactor;

    if (dist < pullThreshold) {
      flyRef.current.isFlying = true;
      flyRef.current.velocityY += delta * (pullStrength / 2);
      flyRef.current.rotationX += delta * 5;
      flyRef.current.rotationZ += delta * 3;
      
      const dirAway = groupRef.current.position.clone().sub(tornadoPos).normalize();
      groupRef.current.position.add(dirAway.multiplyScalar(delta * pullStrength));
    }

    if (flyRef.current.isFlying) {
      groupRef.current.position.y += flyRef.current.velocityY * delta;
      flyRef.current.velocityY -= 9.8 * delta * 5;
      groupRef.current.rotation.x = flyRef.current.rotationX;
      groupRef.current.rotation.z = flyRef.current.rotationZ;
      
      if (groupRef.current.position.y < position.y - 0.5) {
         flyRef.current.isFlying = false;
         flyRef.current.velocityY = 0;
         groupRef.current.position.y = position.y;
         groupRef.current.rotation.x = 0;
         groupRef.current.rotation.z = 0;
      }
    } else {
      // Sincroniza posição e rotação mutáveis diretamente
      groupRef.current.position.copy(position);
      groupRef.current.rotation.y = rotation;
    }
  });

  const bodyColor = useMemo(() => {
    const hFactor = Math.max(0.2, health / 100);
    if (model === 'scout') return new THREE.Color(0.4 * hFactor, 0.3 * hFactor, 0.2 * hFactor); // Rusted
    if (model === 'tracker') return new THREE.Color(0.2 * hFactor, 0.2 * hFactor, 0.6 * hFactor); // Blueish
    return new THREE.Color(0.1 * hFactor, 0.1 * hFactor, 0.1 * hFactor); // Black/Grey
  }, [health, model]);

  return (
    <group ref={groupRef}>
      {/* Model-specific geometry */}
      {model === 'scout' && (
        <group>
          <mesh position={[0, 0.6, 0]} castShadow>
            <boxGeometry args={[2, 0.8, 4]} />
            <meshStandardMaterial color={bodyColor} />
          </mesh>
          <mesh position={[0, 1.3, -0.2]} castShadow>
            <boxGeometry args={[1.8, 0.6, 2]} />
            <meshStandardMaterial color="#333" transparent opacity={0.6} />
          </mesh>
        </group>
      )}

      {model === 'tracker' && (
        <group>
          <mesh position={[0, 0.7, 0]} castShadow>
            <boxGeometry args={[2.4, 1, 4.5]} />
            <meshStandardMaterial color={bodyColor} />
          </mesh>
          <mesh position={[0, 1.5, -0.4]} castShadow>
            <boxGeometry args={[2, 0.8, 2.5]} />
            <meshStandardMaterial color="#1a1a1a" transparent opacity={0.8} />
          </mesh>
          {/* Radar dish on top */}
          <mesh position={[0, 1.9, -0.4]} rotation={[0.4, 0, 0]}>
            <cylinderGeometry args={[0.5, 0.8, 0.2]} />
            <meshStandardMaterial color="#555" />
          </mesh>
        </group>
      )}

      {model === 'beast' && (
        <group>
          {/* Heavy Base */}
          <mesh position={[0, 0.5, 0]} castShadow>
            <boxGeometry args={[3, 1.2, 6]} />
            <meshStandardMaterial color={bodyColor} metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Sloped armor */}
          <mesh position={[0, 1.2, 0]} castShadow>
             <boxGeometry args={[2.5, 0.8, 4.5]} />
             <meshStandardMaterial color={bodyColor} />
          </mesh>
          {/* External rollcage bars */}
          {[[-1.4, 0.5, 0], [1.4, 0.5, 0]].map((p, i) => (
            <mesh key={i} position={[p[0], 0.8, p[2]]}>
              <boxGeometry args={[0.2, 1.5, 6]} />
              <meshStandardMaterial color="#222" />
            </mesh>
          ))}
        </group>
      )}
      
      {/* Shared Wheels */}
      {[[-1.2, 0.4, 1.5], [1.2, 0.4, 1.5], [-1.2, 0.4, -1.5], [1.2, 0.4, -1.5]].map((pos, i) => (
        <mesh key={i} position={pos as any} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.5, 0.5, 0.4]} />
          <meshStandardMaterial color="#111" />
        </mesh>
      ))}
      
      {/* Dynamic Headlights */}
      <mesh position={[-0.8, 0.8, 2.3]}>
        <boxGeometry args={[0.4, 0.2, 0.1]} />
        <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={isDriving ? 3 : 0.2} />
      </mesh>
      <mesh position={[0.8, 0.8, 2.3]}>
        <boxGeometry args={[0.4, 0.2, 0.1]} />
        <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={isDriving ? 3 : 0.2} />
      </mesh>
      <pointLight position={[0, 1, 3.5]} intensity={isDriving ? 15 : 0} color="#fff" distance={80} />
    </group>
  );
};

export default Car;
