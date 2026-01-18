
import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const Weather = ({ isMuted }: { isMuted?: boolean }) => {
  const rainCount = 1500;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const audioCtx = useRef<AudioContext | null>(null);
  const filterNode = useRef<BiquadFilterNode | null>(null);
  const gainNode = useRef<GainNode | null>(null);
  
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  const particles = useMemo(() => {
    return Array.from({ length: rainCount }).map(() => ({
      pos: new THREE.Vector3(
        (Math.random() - 0.5) * 600,
        Math.random() * 150,
        (Math.random() - 0.5) * 600
      ),
      speed: 40 + Math.random() * 40
    }));
  }, []);

  useEffect(() => {
    if (!audioCtx.current) {
      const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
      if (!AudioContextClass) return;
      
      audioCtx.current = new AudioContextClass();
      
      const bufferSize = 2 * audioCtx.current.sampleRate;
      const noiseBuffer = audioCtx.current.createBuffer(1, bufferSize, audioCtx.current.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = audioCtx.current.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      filterNode.current = audioCtx.current.createBiquadFilter();
      filterNode.current.type = 'lowpass';
      filterNode.current.frequency.value = 800;

      gainNode.current = audioCtx.current.createGain();
      gainNode.current.gain.value = isMuted ? 0 : 0.05;

      whiteNoise.connect(filterNode.current);
      filterNode.current.connect(gainNode.current);
      gainNode.current.connect(audioCtx.current.destination);
      whiteNoise.start();
    }
  }, []);

  useEffect(() => {
    if (gainNode.current && audioCtx.current) {
      const targetGain = isMuted ? 0 : 0.05;
      const now = audioCtx.current.currentTime;
      if (Number.isFinite(now) && Number.isFinite(targetGain)) {
        if (audioCtx.current.state === 'suspended' && !isMuted) {
          audioCtx.current.resume();
        }
        gainNode.current.gain.setTargetAtTime(targetGain, now, 0.1);
      }
    }
  }, [isMuted]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    
    particles.forEach((p, i) => {
      p.pos.y -= p.speed * delta;
      if (p.pos.y < 0) p.pos.y = 150;
      dummy.position.copy(p.pos);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;

    if (filterNode.current && !isMuted && audioCtx.current) {
      const freq = 400 + Math.sin(state.clock.elapsedTime * 0.5) * 200;
      const now = audioCtx.current.currentTime;
      if (Number.isFinite(freq) && Number.isFinite(now)) {
        filterNode.current.frequency.setTargetAtTime(freq, now, 0.1);
      }
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, rainCount]}>
      <boxGeometry args={[0.05, 1.2, 0.05]} />
      <meshBasicMaterial color="#81d4fa" transparent opacity={0.3} />
    </instancedMesh>
  );
};

export default Weather;
