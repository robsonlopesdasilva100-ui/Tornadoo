
import React, { useMemo } from 'react';
import * as THREE from 'three';

export const getTerrainHeight = (x: number, z: number, size: number = 1500) => {
  const margin = 30;
  const edgeDist = Math.max(Math.abs(x), Math.abs(z));
  let height = (Math.sin(x / 80) * Math.cos(z / 80) * 8);
  if (edgeDist > (size / 2) - margin) {
    const wallFactor = (edgeDist - ((size / 2) - margin)) / margin;
    height += Math.pow(wallFactor, 2) * 150;
  }
  return height;
};

// Verifica se uma posição está em uma "estrada"
export const isOnRoad = (x: number, z: number) => {
  const roadWidth = 10;
  return Math.abs(x % 300) < roadWidth || Math.abs(z % 300) < roadWidth;
};

const Terrain = ({ size }: { size: number }) => {
  // Criação de texturas procedurais para maior detalhe
  const textures = useMemo(() => {
    // 1. Detail Map (Textura de ruído para grama/terra)
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    
    // Base de ruído granulado
    for(let x=0; x<256; x++){
      for(let y=0; y<256; y++){
        const noise = Math.random() * 50;
        ctx.fillStyle = `rgb(${150+noise}, ${150+noise}, ${150+noise})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
    const detailTex = new THREE.CanvasTexture(canvas);
    detailTex.wrapS = detailTex.wrapT = THREE.RepeatWrapping;
    detailTex.repeat.set(100, 100);

    // 2. Normal Map Procedural (Simulação de micro-relevo)
    const normalCanvas = document.createElement('canvas');
    normalCanvas.width = 256;
    normalCanvas.height = 256;
    const nCtx = normalCanvas.getContext('2d')!;
    nCtx.fillStyle = '#8080ff'; // Cor neutra de normal map
    nCtx.fillRect(0, 0, 256, 256);
    
    for(let i=0; i<2000; i++){
      const x = Math.random()*256;
      const y = Math.random()*256;
      const shade = 128 + (Math.random()-0.5)*60;
      nCtx.fillStyle = `rgb(${shade}, ${shade}, 255)`;
      nCtx.fillRect(x, y, 2, 2);
    }
    const normalTex = new THREE.CanvasTexture(normalCanvas);
    normalTex.wrapS = normalTex.wrapT = THREE.RepeatWrapping;
    normalTex.repeat.set(100, 100);

    return { detailTex, normalTex };
  }, []);

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(size, size, 128, 128);
    const vertices = geo.attributes.position.array;
    const colorAttr = new Float32Array(vertices.length);
    
    for (let i = 0; i < vertices.length; i += 3) {
      const x = vertices[i];
      const y = vertices[i + 1];
      const h = getTerrainHeight(x, y, size);
      vertices[i + 2] = h;
      
      const onRoad = isOnRoad(x, y);
      // Cores mais ricas para grama e estrada
      const color = onRoad 
        ? new THREE.Color("#4a3728") // Terra batida escura
        : new THREE.Color("#1a4d1a"); // Verde floresta profundo
        
      colorAttr[i] = color.r;
      colorAttr[i+1] = color.g;
      colorAttr[i+2] = color.b;
    }
    
    geo.setAttribute('color', new THREE.BufferAttribute(colorAttr, 3));
    geo.computeVertexNormals();
    return geo;
  }, [size]);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <primitive object={geometry} attach="geometry" />
      <meshStandardMaterial 
        vertexColors 
        roughness={0.9} 
        metalness={0.05}
        map={textures.detailTex}
        normalMap={textures.normalTex}
        normalScale={new THREE.Vector2(0.5, 0.5)}
      />
    </mesh>
  );
};

export default Terrain;
