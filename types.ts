
import * as THREE from 'three';
import { ThreeElements } from '@react-three/fiber';

declare global {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}

export type CarModelId = 'scout' | 'tracker' | 'beast';

export interface CarModel {
  id: CarModelId;
  name: string;
  price: number;
  baseSpeed: number;
  baseHealth: number;
  description: string;
}

export interface TreeData {
  id: number;
  position: [number, number, number];
  scale: number;
  destroyed: boolean;
}

export interface RadarData {
  id: string;
  position: THREE.Vector3;
  active: boolean;
  windSpeed: number;
}

export interface CarData {
  id: string;
  model: CarModelId;
  position: THREE.Vector3;
  rotation: number;
  velocity: THREE.Vector3;
  isDriving: boolean;
  health: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  icon: string;
  active: boolean;
}

export interface Upgrades {
  engine: number;
  chassis: number;
  radar: number;
}

export interface VideoRecording {
  id: string;
  timestamp: number;
  dataUrl: string;
}

export type GamePhase = 'START' | 'CUTSCENE_LOOK' | 'STORY_INTRO' | 'PLAYING' | 'GAMEOVER';
