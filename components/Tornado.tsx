
import React, { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { PositionalAudio } from '@react-three/drei';
import * as THREE from 'three';

interface TornadoProps {
  targetPos: THREE.Vector3;
  isMuted?: boolean;
}

const Tornado: React.FC<TornadoProps> = ({ targetPos, isMuted }) => {
  const groupRef = useRef<THREE.Group>(null);
  const funnelGroupRef = useRef<THREE.Group>(null);
  const debrisGroupRef = useRef<THREE.Group>(null);
  const audioRef = useRef<THREE.PositionalAudio>(null);
  const dustRef = useRef<THREE.Group>(null);
  const [scaleY, setScaleY] = useState(0);
  
  const segments = useMemo(() => {
    return Array.from({ length: 50 }).map((_, i) => ({
      size: 12 + i * 4, 
      height: i * 4,    
      speed: 0.1 + (i * 0.005)
    }));
  }, []);

  const debrisOrbitals = useMemo(() => {
    return Array.from({ length: 40 }).map(() => ({
      pos: new THREE.Vector3((Math.random() - 0.5) * 50, Math.random() * 120, (Math.random() - 0.5) * 50),
      scale: 0.4 + Math.random() * 1.8,
      speed: 1.5 + Math.random() * 4,
      radius: 12 + Math.random() * 45
    }));
  }, []);

  const dustParticles = useMemo(() => {
    return Array.from({ length: 15 }).map(() => ({
      pos: new THREE.Vector3((Math.random() - 0.5) * 60, Math.random() * 10, (Math.random() - 0.5) * 60),
      scale: 15 + Math.random() * 20,
      rotVel: (Math.random() - 0.5) * 2
    }));
  }, []);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    if (scaleY < 1) setScaleY(prev => Math.min(1, prev + delta * 0.5));
    groupRef.current.scale.y = scaleY;
    groupRef.current.position.lerp(targetPos, 0.08);

    // Animando Funil
    if (funnelGroupRef.current) {
      funnelGroupRef.current.children.forEach((child, i) => {
        const seg = segments[i];
        if (seg) {
          child.rotation.y += seg.speed;
          child.position.x = Math.sin(state.clock.elapsedTime * 2.5 + i * 0.25) * (1.5 + i * 0.4);
          child.position.z = Math.cos(state.clock.elapsedTime * 2.5 + i * 0.25) * (1.5 + i * 0.4);
        }
      });
    }

    // Animando Detritos
    if (debrisGroupRef.current) {
      debrisGroupRef.current.children.forEach((child, i) => {
        const deb = debrisOrbitals[i];
        if (deb) {
          const time = state.clock.elapsedTime * deb.speed;
          child.position.x = Math.sin(time) * deb.radius;
          child.position.z = Math.cos(time) * deb.radius;
          child.rotation.x += 0.15;
          child.rotation.y += 0.15;
        }
      });
    }

    // Animando Poeira
    if (dustRef.current) {
      dustRef.current.rotation.y += delta * 1.5;
      dustRef.current.children.forEach((child, i) => {
        const dp = dustParticles[i];
        if (dp) {
          child.rotation.z += dp.rotVel * delta;
          child.scale.setScalar(dp.scale * (0.8 + Math.sin(state.clock.elapsedTime * 2 + i) * 0.2));
        }
      });
    }

    if (audioRef.current) {
      audioRef.current.setVolume(isMuted ? 0 : 2.5);
    }
  });

  return (
    <group ref={groupRef}>
      {!isMuted && (
        <PositionalAudio
          ref={audioRef}
          url="https://assets.mixkit.co/active_storage/sfx/1233/1233-preview.mp3"
          distance={500}
          loop
          autoplay
        />
      )}
      
      <group ref={funnelGroupRef}>
        {segments.map((seg, i) => (
          <mesh key={`seg-${i}`} position={[0, seg.height, 0]} castShadow>
            <boxGeometry args={[seg.size, 4.5, seg.size]} />
            <meshStandardMaterial 
              color="#080808" 
              transparent 
              opacity={Math.max(0.3, 0.9 - (i * 0.012))} 
            />
          </mesh>
        ))}
      </group>

      <group ref={debrisGroupRef}>
        {debrisOrbitals.map((deb, i) => (
          <mesh key={`deb-${i}`} position={deb.pos.toArray()}>
            <boxGeometry args={[deb.scale, deb.scale * 0.6, deb.scale]} />
            <meshStandardMaterial color={i % 3 === 0 ? "#5d4037" : (i % 3 === 1 ? "#212121" : "#424242")} />
          </mesh>
        ))}
      </group>

      <group ref={dustRef}>
        {dustParticles.map((dp, i) => (
          <mesh key={`dust-${i}`} position={dp.pos.toArray()}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#1a1a1a" transparent opacity={0.15} />
          </mesh>
        ))}
      </group>

      <pointLight position={[0, 80, 0]} intensity={40} color="#4c51bf" distance={500} />
      <pointLight position={[0, 30, 0]} intensity={Math.random() > 0.92 ? 200 : 10} color="#ffffff" distance={600} />
    </group>
  );
};

export default Tornado;
