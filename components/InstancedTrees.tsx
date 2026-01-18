
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TreeData } from '../types';

interface InstancedTreesProps {
  trees: TreeData[];
  tornadoPos: THREE.Vector3;
  onDestroy: (id: number) => void;
}

const InstancedTrees: React.FC<InstancedTreesProps> = ({ trees, tornadoPos, onDestroy }) => {
  const trunkMeshRef = useRef<THREE.InstancedMesh>(null);
  const foliage1MeshRef = useRef<THREE.InstancedMesh>(null);
  const foliage2MeshRef = useRef<THREE.InstancedMesh>(null);
  const foliage3MeshRef = useRef<THREE.InstancedMesh>(null);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Geometrias compartilhadas
  const trunkGeo = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const foliageGeo = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);

  useFrame((state, delta) => {
    if (!trunkMeshRef.current || !foliage1MeshRef.current) return;

    trees.forEach((tree, i) => {
      if (tree.destroyed) {
        // Move árvores destruídas para longe (mais rápido que remover do array)
        dummy.position.set(0, -1000, 0);
        dummy.updateMatrix();
        trunkMeshRef.current!.setMatrixAt(i, dummy.matrix);
        foliage1MeshRef.current!.setMatrixAt(i, dummy.matrix);
        foliage2MeshRef.current!.setMatrixAt(i, dummy.matrix);
        foliage3MeshRef.current!.setMatrixAt(i, dummy.matrix);
        return;
      }

      // Lógica de colisão com tornado
      const distSq = Math.pow(tree.position[0] - tornadoPos.x, 2) + Math.pow(tree.position[2] - tornadoPos.z, 2);
      if (distSq < 64) { // 8 unidades de distância
        onDestroy(tree.id);
        return;
      }

      const trunkHeight = tree.scale * 4;
      
      // Tronco
      dummy.position.set(tree.position[0], tree.position[1] + trunkHeight / 2, tree.position[2]);
      dummy.scale.set(1, trunkHeight, 1);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      trunkMeshRef.current!.setMatrixAt(i, dummy.matrix);

      // Folhagem 1
      dummy.position.set(tree.position[0], tree.position[1] + trunkHeight + 2, tree.position[2]);
      dummy.scale.set(tree.scale * 3, 3, tree.scale * 3);
      dummy.updateMatrix();
      foliage1MeshRef.current!.setMatrixAt(i, dummy.matrix);

      // Folhagem 2
      dummy.position.set(tree.position[0], tree.position[1] + trunkHeight + 4.5, tree.position[2]);
      dummy.scale.set(tree.scale * 2, 2.5, tree.scale * 2);
      dummy.updateMatrix();
      foliage2MeshRef.current!.setMatrixAt(i, dummy.matrix);

      // Folhagem 3
      dummy.position.set(tree.position[0], tree.position[1] + trunkHeight + 6, tree.position[2]);
      dummy.scale.set(tree.scale * 1, 1.5, tree.scale * 1);
      dummy.updateMatrix();
      foliage3MeshRef.current!.setMatrixAt(i, dummy.matrix);
    });

    trunkMeshRef.current.instanceMatrix.needsUpdate = true;
    foliage1MeshRef.current.instanceMatrix.needsUpdate = true;
    foliage2MeshRef.current.instanceMatrix.needsUpdate = true;
    foliage3MeshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      <instancedMesh ref={trunkMeshRef} args={[trunkGeo, undefined, trees.length]} castShadow>
        <meshStandardMaterial color="#3e2723" />
      </instancedMesh>
      <instancedMesh ref={foliage1MeshRef} args={[foliageGeo, undefined, trees.length]} castShadow>
        <meshStandardMaterial color="#1b5e20" />
      </instancedMesh>
      <instancedMesh ref={foliage2MeshRef} args={[foliageGeo, undefined, trees.length]} castShadow>
        <meshStandardMaterial color="#2e7d32" />
      </instancedMesh>
      <instancedMesh ref={foliage3MeshRef} args={[foliageGeo, undefined, trees.length]} castShadow>
        <meshStandardMaterial color="#4caf50" />
      </instancedMesh>
    </group>
  );
};

export default InstancedTrees;
