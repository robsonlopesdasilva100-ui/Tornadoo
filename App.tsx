
import React, { useState, useEffect, useRef, useCallback, useMemo, Suspense } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { PointerLockControls, Sky, Stars, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { 
  Clock, DollarSign, Volume2, VolumeX, Shield, Zap, Target, ShoppingBag, Play, StopCircle, Video, Key
} from 'lucide-react';

import Tornado from './components/Tornado';
import InstancedTrees from './components/InstancedTrees';
import Terrain, { getTerrainHeight } from './components/Terrain';
import House from './components/House';
import Car from './components/Car';
import Weather from './components/Weather';
import IntroScene from './components/IntroScene';
import IntroCutscene from './components/IntroCutscene';
import TabletUI from './components/TabletUI';
import Radar from './components/Radar';
import { TreeData, RadarData, CarData, GamePhase, Upgrades, VideoRecording, CarModelId } from './types';

const GROUND_SIZE = 1500;
const TREE_COUNT = 2500;
const JUMP_FORCE = 0.55;
const GRAVITY = 0.022;
const HOUSE_POS: [number, number] = [0, 0];
const SAVE_KEY = 'storm_chaser_save_v1';
const VIDEO_SAVE_KEY = 'storm_chaser_videos';

const SFX_URLS = {
  UI_CLICK: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
  JUMP: 'https://assets.mixkit.co/active_storage/sfx/2048/2048-preview.mp3',
  FOOTSTEP: 'https://assets.mixkit.co/active_storage/sfx/1077/1077-preview.mp3',
  CASH: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3',
  CRASH: 'https://assets.mixkit.co/active_storage/sfx/1012/1012-preview.mp3'
};

interface Particle {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  rot: THREE.Euler;
  rotVel: THREE.Vector3;
  life: number;
  type: 'wood' | 'brick';
}

const DestructionParticles = ({ events }: { events: { id: number, pos: THREE.Vector3, type: 'tree' | 'house' }[] }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const brickMeshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const woodParticles = useRef<Particle[]>([]);
  const brickParticles = useRef<Particle[]>([]);

  useEffect(() => {
    if (events.length > 0) {
      const lastEvent = events[events.length - 1];
      const isHouse = lastEvent.type === 'house';
      const count = isHouse ? 40 : 12;
      const targetArr = isHouse ? brickParticles : woodParticles;

      for(let i=0; i<count; i++) {
        targetArr.current.push({
          pos: lastEvent.pos.clone().add(new THREE.Vector3(0, Math.random() * 5, 0)),
          vel: new THREE.Vector3(
            (Math.random()-0.5) * (isHouse ? 30 : 20), 
            15 + Math.random() * 20, 
            (Math.random()-0.5) * (isHouse ? 30 : 20)
          ),
          rot: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, 0),
          rotVel: new THREE.Vector3(Math.random() * 5, Math.random() * 5, Math.random() * 5),
          life: 1.0,
          type: isHouse ? 'brick' : 'wood'
        });
      }
    }
  }, [events]);

  useFrame((_, delta) => {
    const processParticles = (arr: React.MutableRefObject<Particle[]>, mesh: THREE.InstancedMesh | null) => {
      if (!mesh) return;
      arr.current.forEach((p, i) => {
        p.pos.add(p.vel.clone().multiplyScalar(delta));
        p.vel.y -= 35 * delta;
        p.life -= delta * 0.7;
        
        p.rot.x += p.rotVel.x * delta;
        p.rot.y += p.rotVel.y * delta;
        p.rot.z += p.rotVel.z * delta;

        dummy.position.copy(p.pos);
        dummy.rotation.copy(p.rot);
        dummy.scale.setScalar(p.life * (p.type === 'brick' ? 2.5 : 1.5));
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      });
      arr.current = arr.current.filter(p => p.life > 0 && p.pos.y > -10);
      mesh.count = arr.current.length;
      mesh.instanceMatrix.needsUpdate = true;
    };

    processParticles(woodParticles, meshRef.current);
    processParticles(brickParticles, brickMeshRef.current);
  });

  return (
    <>
      <instancedMesh ref={meshRef} args={[undefined, undefined, 1000]}>
        <boxGeometry args={[0.6, 0.4, 0.6]} />
        <meshStandardMaterial color="#5d4037" />
      </instancedMesh>
      <instancedMesh ref={brickMeshRef} args={[undefined, undefined, 1000]}>
        <boxGeometry args={[0.8, 0.5, 1.2]} />
        <meshStandardMaterial color="#424242" />
      </instancedMesh>
    </>
  );
};

const PlayerController = ({ 
  onPlaceRadar, tornadoPos, onDamage, playerPosRef, 
  tornadoActive, isPaused, toggleTablet, carData, 
  setCarData, flashlightActive, isMuted, upgrades, setNearCar
}: any) => {
  const { camera, scene } = useThree();
  const moveState = useRef({ forward: false, backward: false, left: false, right: false, run: false });
  const velocityY = useRef(0);
  const isJumping = useRef(false);
  const footstepTimer = useRef(0);
  const isNearCarRef = useRef(false);
  
  const jumpSound = useMemo(() => new Audio(SFX_URLS.JUMP), []);
  const footstepSound = useMemo(() => new Audio(SFX_URLS.FOOTSTEP), []);

  const flashlightTarget = useMemo(() => {
    const obj = new THREE.Object3D();
    scene.add(obj);
    return obj;
  }, [scene]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyW') moveState.current.forward = true;
      if (e.code === 'KeyS') moveState.current.backward = true;
      if (e.code === 'KeyA') moveState.current.left = true;
      if (e.code === 'KeyD') moveState.current.right = true;
      if (e.code === 'ShiftLeft' || e.code === 'ControlLeft') moveState.current.run = true;
      
      if (e.code === 'KeyC') toggleTablet();

      if (!isPaused) {
        if (e.code === 'KeyH') {
          const pos = camera.position.clone();
          const forward = new THREE.Vector3(0, 0, -2).applyQuaternion(camera.quaternion);
          pos.add(forward);
          pos.y = getTerrainHeight(pos.x, pos.z, GROUND_SIZE);
          onPlaceRadar(pos);
        }
        if (e.code === 'Space' && !isJumping.current && !carData?.isDriving) {
          velocityY.current = JUMP_FORCE;
          isJumping.current = true;
          if (!isMuted) {
            jumpSound.volume = 0.3;
            jumpSound.currentTime = 0;
            jumpSound.play().catch(() => {});
          }
        }
        
        if (e.code === 'KeyF' && carData) {
          const dist = camera.position.distanceTo(carData.position);
          if (dist < 15) {
            setCarData((prev: any) => prev ? {...prev, isDriving: !prev.isDriving} : null);
          }
        }
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'KeyW') moveState.current.forward = false;
      if (e.code === 'KeyS') moveState.current.backward = false;
      if (e.code === 'KeyA') moveState.current.left = false;
      if (e.code === 'KeyD') moveState.current.right = false;
      if (e.code === 'ShiftLeft' || e.code === 'ControlLeft') moveState.current.run = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      scene.remove(flashlightTarget);
    };
  }, [camera, onPlaceRadar, isPaused, toggleTablet, carData, setCarData, scene, flashlightTarget, jumpSound, isMuted]);

  useFrame((state, delta) => {
    if (isPaused) return;

    let moving = false;
    
    if (carData) {
        const distToCar = camera.position.distanceTo(carData.position);
        const nearValue = distToCar < 15 && !carData.isDriving;
        if (nearValue !== isNearCarRef.current) {
            isNearCarRef.current = nearValue;
            setNearCar(nearValue);
        }
    }

    if (carData?.isDriving) {
      const turnSpeed = 1.8; 
      const engineBonus = upgrades.engine * 10;
      
      let baseSpeed = 20;
      if (carData.model === 'tracker') baseSpeed = 30;
      if (carData.model === 'beast') baseSpeed = 40;

      const healthPenalty = (carData.health / 100); 
      const driveSpeed = (baseSpeed + engineBonus) * (0.3 + 0.7 * healthPenalty); 
      
      if (moveState.current.left) carData.rotation += turnSpeed * delta;
      if (moveState.current.right) carData.rotation -= turnSpeed * delta;
      
      const forward = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), carData.rotation);
      
      if (moveState.current.forward) {
        carData.position.x += forward.x * driveSpeed * delta;
        carData.position.z += forward.z * driveSpeed * delta;
      }
      if (moveState.current.backward) {
        carData.position.x -= forward.x * driveSpeed * 0.5 * delta;
        carData.position.z -= forward.z * driveSpeed * 0.5 * delta;
      }
      
      carData.position.y = getTerrainHeight(carData.position.x, carData.position.z, GROUND_SIZE);
      
      const camTarget = carData.position.clone().add(new THREE.Vector3(0, 1, 0));
      camera.position.copy(carData.position).add(new THREE.Vector3(0, 7, 0)).sub(forward.clone().multiplyScalar(20));
      camera.lookAt(camTarget);
      moving = moveState.current.forward || moveState.current.backward;
    } else {
      const basePlayerSpeed = moveState.current.run ? 15 : 8;
      const speed = basePlayerSpeed * delta;
      const direction = new THREE.Vector3();
      const frontVector = new THREE.Vector3(0, 0, Number(moveState.current.backward) - Number(moveState.current.forward));
      const sideVector = new THREE.Vector3(Number(moveState.current.left) - Number(moveState.current.right), 0, 0);
      
      direction.subVectors(frontVector, sideVector).normalize().multiplyScalar(speed).applyQuaternion(camera.quaternion);
      camera.position.x += direction.x;
      camera.position.z += direction.z;
      
      const groundHeight = getTerrainHeight(camera.position.x, camera.position.z, GROUND_SIZE) + 1.8;
      
      moving = direction.lengthSq() > 0.0001 && !isJumping.current;

      if (isJumping.current) {
        camera.position.y += velocityY.current;
        velocityY.current -= GRAVITY;
        if (camera.position.y <= groundHeight) { 
          camera.position.y = groundHeight; 
          isJumping.current = false; 
          velocityY.current = 0; 
        }
      } else { 
        camera.position.y = groundHeight; 
      }
    }

    if (moving && !isMuted) {
      footstepTimer.current += delta;
      const stepInterval = moveState.current.run ? 0.3 : 0.6;
      if (footstepTimer.current > stepInterval) {
        footstepSound.volume = 0.1;
        footstepSound.currentTime = 0;
        footstepSound.play().catch(() => {});
        footstepTimer.current = 0;
      }
    }

    playerPosRef.current.copy(camera.position);
    flashlightTarget.position.copy(camera.position.clone().add(new THREE.Vector3(0, 0, -10).applyQuaternion(camera.quaternion)));
    flashlightTarget.updateMatrixWorld();

    if (tornadoActive) {
      const dist = camera.position.distanceTo(tornadoPos);
      if (dist < 50) onDamage(delta * 450); 
      else if (dist < 100) onDamage(delta * 35);
    }
  });

  return (
    <>
      {!isPaused && <PointerLockControls />}
      <spotLight 
        position={[0, 2, 0]} 
        angle={0.5} 
        penumbra={0.4} 
        intensity={flashlightActive ? 20 : 0} 
        distance={250} 
        castShadow 
        target={flashlightTarget} 
      />
      <audioListener />
    </>
  );
};

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GamePhase>('START');
  const [showTablet, setShowTablet] = useState(false);
  const [health, setHealth] = useState(100);
  const [money, setMoney] = useState(500);
  const [tornadoPos, setTornadoPos] = useState(new THREE.Vector3(600, 0, 600));
  const [trees, setTrees] = useState<TreeData[]>([]);
  const [radars, setRadars] = useState<RadarData[]>([]);
  const [timeOfDay, setTimeOfDay] = useState(20); 
  const [isMuted, setIsMuted] = useState(false);
  const [upgrades, setUpgrades] = useState<Upgrades>({ engine: 0, chassis: 0, radar: 0 });
  const [unlockedModels, setUnlockedModels] = useState<CarModelId[]>(['scout']);
  const [isHouseDestroyed, setIsHouseDestroyed] = useState(false);
  const [destructionEvents, setDestructionEvents] = useState<{id: number, pos: THREE.Vector3, type: 'tree' | 'house'}[]>([]);
  const [recordings, setRecordings] = useState<VideoRecording[]>([]);
  const [nearCar, setNearCar] = useState(false);
  
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoChunksRef = useRef<Blob[]>([]);
  const videoStreamRef = useRef<MediaStream | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);

  const [inventory, setInventory] = useState([
    { id: 'flashlight', name: 'Lanterna Tática', active: true },
    { id: 'radar_unit', name: 'Módulo Radar EF', active: false },
  ]);

  const [placedCar, setPlacedCar] = useState<CarData | null>({
    id: 'intercept-1',
    model: 'scout',
    position: new THREE.Vector3(35, 0, 35),
    rotation: 0,
    velocity: new THREE.Vector3(),
    isDriving: false,
    health: 100
  });
  const [takingDamage, setTakingDamage] = useState(false);
  
  const playerPosRef = useRef(new THREE.Vector3(0, 5, 0));
  const isNight = timeOfDay > 18 || timeOfDay < 6;

  useEffect(() => {
    const savedString = localStorage.getItem(SAVE_KEY);
    if (savedString) {
      try {
        const data = JSON.parse(savedString);
        setMoney(data.money);
        setUpgrades(data.upgrades);
        if (data.unlockedModels) setUnlockedModels(data.unlockedModels);
        if (data.placedCar) setPlacedCar(p => ({
            ...p!, 
            model: data.placedCar.model || 'scout',
            position: new THREE.Vector3().fromArray(data.placedCar.position)
        }));
      } catch (e) {
        console.warn("Falha no auto-load");
      }
    }

    const savedVideos = localStorage.getItem(VIDEO_SAVE_KEY);
    if (savedVideos) {
        try {
            setRecordings(JSON.parse(savedVideos));
        } catch(e) {
            console.warn("Falha ao carregar vídeos");
        }
    }
  }, []);

  const startRecording = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 }, audio: true });
        videoStreamRef.current = stream;
        if (videoPreviewRef.current) videoPreviewRef.current.srcObject = stream;
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        videoChunksRef.current = [];
        mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) videoChunksRef.current.push(e.data); };
        mediaRecorder.onstop = async () => {
            const blob = new Blob(videoChunksRef.current, { type: 'video/webm' });
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = () => {
                const base64data = reader.result as string;
                if (!base64data) return;
                const newRec: VideoRecording = {
                    id: Math.random().toString(36).substr(2, 9),
                    timestamp: Date.now(),
                    dataUrl: base64data
                };
                setRecordings(prev => {
                    const next = [newRec, ...prev].slice(0, 5); 
                    localStorage.setItem(VIDEO_SAVE_KEY, JSON.stringify(next));
                    return next;
                });
            };
            stream.getTracks().forEach(track => track.stop());
            videoStreamRef.current = null;
        };
        mediaRecorder.start();
        setIsRecording(true);
    } catch (err: any) { console.error(err); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
    }
  };

  const toggleTablet = useCallback(() => {
    if (!isMuted) new Audio(SFX_URLS.UI_CLICK).play().catch(() => {});
    setShowTablet(prev => !prev);
  }, [isMuted]);

  const toggleInventoryItem = (id: string) => {
    if (!isMuted) new Audio(SFX_URLS.UI_CLICK).play().catch(() => {});
    setInventory(prev => prev.map(item => item.id === id ? { ...item, active: !item.active } : item));
  };

  const handlePlaceRadar = useCallback((pos: THREE.Vector3) => {
    setRadars(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      position: pos.clone(),
      active: true,
      windSpeed: 0
    }]);
  }, []);

  const handleDamage = useCallback((amount: number) => {
    setHealth(prev => {
        if (prev <= 0) return 0;
        const next = Math.max(0, prev - amount);
        if (next < prev) {
            setTakingDamage(true);
            setTimeout(() => setTakingDamage(false), 50);
        }
        return next;
    });
    if (placedCar?.isDriving) {
        setPlacedCar(prev => prev ? { ...prev, health: Math.max(0, prev.health - amount * 0.1) } : null);
    }
  }, [placedCar]);

  const handleRepairCar = () => {
    const cost = 250;
    if (money >= cost && placedCar) {
        setMoney(m => m - cost);
        setPlacedCar(p => p ? { ...p, health: 100 } : null);
        if (!isMuted) new Audio(SFX_URLS.CASH).play().catch(() => {});
    }
  };

  const handleUpgrade = (type: keyof Upgrades) => {
    const level = upgrades[type];
    const cost = (level + 1) * 400;
    if (money >= cost && level < 5) {
        setMoney(m => m - cost);
        setUpgrades(prev => ({ ...prev, [type]: prev[type] + 1 }));
        if (!isMuted) new Audio(SFX_URLS.CASH).play().catch(() => {});
    }
  };

  const handleBuyInterceptor = (modelId: CarModelId, price: number) => {
    if (money >= price && !unlockedModels.includes(modelId)) {
        setMoney(m => m - price);
        setUnlockedModels(prev => [...prev, modelId]);
        setPlacedCar(prev => prev ? { ...prev, model: modelId, health: 100 } : null);
        if (!isMuted) new Audio(SFX_URLS.CASH).play().catch(() => {});
    } else if (unlockedModels.includes(modelId)) {
        setPlacedCar(prev => prev ? { ...prev, model: modelId } : null);
    }
  };

  const saveGame = useCallback(() => {
    const saveData = {
      money,
      health,
      upgrades,
      unlockedModels,
      trees,
      isHouseDestroyed,
      timeOfDay,
      inventory,
      placedCar: placedCar ? {
        ...placedCar,
        position: placedCar.position.toArray(),
        model: placedCar.model
      } : null,
      playerPos: playerPosRef.current.toArray()
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
    if (!isMuted) new Audio(SFX_URLS.UI_CLICK).play().catch(() => {});
    alert("Progresso salvo!");
  }, [money, health, upgrades, unlockedModels, trees, isHouseDestroyed, timeOfDay, inventory, placedCar, isMuted]);

  const loadGame = useCallback(() => {
    const savedString = localStorage.getItem(SAVE_KEY);
    if (!savedString) return;
    try {
      const data = JSON.parse(savedString);
      setMoney(data.money);
      setHealth(data.health);
      setUpgrades(data.upgrades);
      setUnlockedModels(data.unlockedModels || ['scout']);
      setTrees(data.trees);
      setIsHouseDestroyed(data.isHouseDestroyed);
      setTimeOfDay(data.timeOfDay);
      setInventory(data.inventory);
      if (data.placedCar) {
        setPlacedCar({
          ...data.placedCar,
          position: new THREE.Vector3().fromArray(data.placedCar.position)
        });
      }
      playerPosRef.current.fromArray(data.playerPos);
      if (!isMuted) new Audio(SFX_URLS.CASH).play().catch(() => {});
      setShowTablet(false);
    } catch (e) { console.error(e); }
  }, [isMuted]);

  useEffect(() => {
    const initialTrees = Array.from({ length: TREE_COUNT }).map((_, i) => {
      const x = (Math.random()-0.5)*1400;
      const z = (Math.random()-0.5)*1400;
      return { id: i, position: [x, getTerrainHeight(x, z, GROUND_SIZE), z] as [number, number, number], scale: 3 + Math.random()*7, destroyed: false };
    });
    setTrees(initialTrees);
  }, []);

  useEffect(() => {
    if (gameState !== 'PLAYING' || showTablet) return;
    const interval = setInterval(() => setTimeOfDay(prev => (prev + 0.03) % 24), 100);
    return () => clearInterval(interval);
  }, [gameState, showTablet]);

  useEffect(() => {
    if (gameState !== 'PLAYING' || !isNight || showTablet) return;
    const interval = setInterval(() => {
      setTornadoPos(prev => {
        const next = prev.clone();
        const dirToPlayer = playerPosRef.current.clone().sub(next).normalize();
        next.add(dirToPlayer.multiplyScalar(5.5)); 
        next.y = getTerrainHeight(next.x, next.z, GROUND_SIZE);
        return next;
      });
      const houseVec = new THREE.Vector3(HOUSE_POS[0], 0, HOUSE_POS[1]);
      if (!isHouseDestroyed && tornadoPos.distanceTo(houseVec) < 45) {
        setIsHouseDestroyed(true);
        setMoney(m => m + 1000);
        setDestructionEvents(prev => [...prev, { id: Date.now(), pos: houseVec, type: 'house' }]);
        if (!isMuted) new Audio(SFX_URLS.CRASH).play().catch(() => {});
      }
    }, 500);
    return () => clearInterval(interval);
  }, [gameState, isNight, showTablet, tornadoPos, isHouseDestroyed, isMuted]);

  const onTreeDestroyed = useCallback((id: number) => {
    setTrees(prev => {
      const tree = prev.find(t => t.id === id);
      if (tree && !tree.destroyed) {
        setDestructionEvents(ev => [...ev, { id: Date.now() + Math.random(), pos: new THREE.Vector3(...tree.position), type: 'tree' }]);
        return prev.map(t => t.id === id ? { ...t, destroyed: true } : t);
      }
      return prev;
    });
    setMoney(m => m + 25);
  }, []);

  if (health <= 0) return (
    <div className="w-full h-full bg-red-950 flex flex-col items-center justify-center text-white font-mono p-10 text-center z-[2000] relative">
      <h1 className="text-8xl font-black mb-4">SINAL PERDIDO</h1>
      <button onClick={() => window.location.reload()} className="bg-red-500 px-16 py-6 font-black rounded-3xl hover:bg-white hover:text-red-900 transition-all shadow-2xl">RECONECTAR</button>
    </div>
  );

  return (
    <div className="relative w-full h-full bg-black overflow-hidden select-none font-mono">
      <div className="scanline"></div>
      {takingDamage && <div className="absolute inset-0 z-[100] bg-red-600/30 pointer-events-none transition-opacity border-[20px] border-red-600/50"></div>}

      {gameState === 'PLAYING' && (
        <>
            {nearCar && (
                <div className="absolute top-[60%] left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none">
                    <div className="bg-green-500 text-black px-6 py-2 rounded-xl font-black text-sm animate-bounce shadow-2xl">
                        PRESSIONAR [F] PARA DIRIGIR
                    </div>
                </div>
            )}
            
            <div className="absolute bottom-8 right-8 z-[200] flex flex-col items-end gap-4">
                {isRecording && (
                    <div className="bg-black/80 border-2 border-red-600 rounded-2xl p-2 w-48 aspect-video overflow-hidden shadow-2xl pointer-events-none">
                        <video ref={videoPreviewRef} autoPlay muted className="w-full h-full object-cover rounded-lg" />
                    </div>
                )}
                <button 
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`p-6 rounded-full flex items-center justify-center transition-all shadow-2xl border-4 ${isRecording ? 'bg-red-600 text-white animate-pulse' : 'bg-black/60 text-white border-white/20'}`}
                >
                    {isRecording ? <StopCircle size={32} /> : <Video size={32} />}
                </button>
            </div>
        </>
      )}

      {gameState === 'START' && (
        <div className="absolute inset-0 z-[500] bg-black flex flex-col items-center justify-center text-green-500 p-10 overflow-hidden">
          <div className="relative z-10 flex flex-col items-center max-w-4xl text-center">
            <h1 className="text-[10rem] font-black text-white leading-none italic tracking-tighter animate-pulse mb-2 drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]">
              STORM<br/><span className="text-green-500">CHASER</span>
            </h1>
            <div className="flex gap-6 w-full max-w-2xl mt-12">
                <button onClick={() => setGameState('CUTSCENE_LOOK')} className="flex-1 bg-green-500 text-black px-12 py-8 rounded-[2rem] font-black text-3xl hover:scale-105 transition-all">INICIAR</button>
                <button onClick={() => setShowTablet(true)} className="flex-1 bg-white/5 border-4 border-white/10 text-white px-12 py-8 rounded-[2rem] font-black text-3xl hover:bg-white/10 transition-all">GARAGEM</button>
            </div>
            <div className="mt-16 flex items-center gap-10">
                <div className="flex flex-col items-center"><span className="text-white text-3xl font-black">${money}</span></div>
            </div>
          </div>
        </div>
      )}

      {showTablet && (
        <TabletUI 
          onClose={toggleTablet} 
          inventory={inventory} 
          toggleItem={toggleInventoryItem} 
          money={money}
          carHealth={placedCar?.health || 0}
          currentCarModel={placedCar?.model || 'scout'}
          unlockedModels={unlockedModels}
          upgrades={upgrades}
          onRepair={handleRepairCar}
          onUpgrade={handleUpgrade}
          onBuyInterceptor={handleBuyInterceptor}
          onSave={saveGame}
          onLoad={loadGame}
          recordings={recordings}
        />
      )}

      {(gameState !== 'START') && (
        <div className="w-full h-full">
          {gameState === 'PLAYING' && (
            <>
              {!placedCar?.isDriving && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-white/60 rounded-full z-50 pointer-events-none mix-blend-difference" />}
              <div className="absolute top-8 left-8 z-10 flex flex-col gap-4">
                <div className="bg-black/80 p-4 rounded-2xl border border-white/10 flex items-center gap-4"><Clock size={18} /><span className="text-white font-black">{Math.floor(timeOfDay).toString().padStart(2,'0')}:00</span></div>
                <div className="bg-black/80 p-4 rounded-2xl border border-white/10 flex items-center gap-4"><DollarSign size={18} /><span className="text-white font-black">${money}</span></div>
              </div>
              <div className="absolute top-8 right-8 z-10 w-80">
                <div className="h-3 bg-gray-900/80 rounded-full overflow-hidden border-2 border-white/10">
                  <div className="h-full bg-red-600 transition-all" style={{ width: `${health}%` }}></div>
                </div>
              </div>
            </>
          )}

          <Canvas shadows dpr={[1, 1.5]} gl={{ antialias: false, powerPreference: 'high-performance' }}>
            <Suspense fallback={null}>
              {gameState === 'CUTSCENE_LOOK' ? (
                <IntroCutscene onComplete={() => setGameState('STORY_INTRO')} />
              ) : gameState === 'STORY_INTRO' ? (
                <IntroScene lang={'PT'} onComplete={() => setGameState('PLAYING')} />
              ) : (
                <>
                  <PerspectiveCamera makeDefault position={[0, 5, 0]} fov={75} />
                  <Sky sunPosition={[Math.sin(timeOfDay*Math.PI/12)*200, -Math.cos(timeOfDay*Math.PI/12)*200, -100]} turbidity={isNight ? 10 : 0.5} rayleigh={isNight ? 0.1 : 3} />
                  <Stars radius={400} count={isNight ? 25000 : 0} factor={10} />
                  <ambientLight intensity={isNight ? 0.2 : 0.7} color={isNight ? "#202040" : "#ffffff"} />
                  <directionalLight position={[300, 300, 100]} intensity={isNight ? 0.1 : 1.5} castShadow />
                  <Terrain size={GROUND_SIZE} />
                  <House position={HOUSE_POS} isDestroyed={isHouseDestroyed} />
                  <Weather isMuted={isMuted} />
                  <InstancedTrees trees={trees} tornadoPos={tornadoPos} onDestroy={onTreeDestroyed} />
                  <DestructionParticles events={destructionEvents} />
                  {radars.map(radar => <Radar key={radar.id} position={radar.position} active={radar.active} />)}
                  {isNight && <Tornado targetPos={tornadoPos} isMuted={isMuted} />}
                  {placedCar && <Car model={placedCar.model} position={placedCar.position} rotation={placedCar.rotation} tornadoPos={tornadoPos} isDriving={placedCar.isDriving} health={placedCar.health} upgrades={upgrades} />}
                  <PlayerController onPlaceRadar={handlePlaceRadar} tornadoPos={tornadoPos} onDamage={handleDamage} playerPosRef={playerPosRef} tornadoActive={isNight} isPaused={showTablet} toggleTablet={toggleTablet} carData={placedCar} setCarData={setPlacedCar} flashlightActive={inventory.find(i => i.id === 'flashlight')?.active} isMuted={isMuted} upgrades={upgrades} setNearCar={setNearCar} />
                  <fog attach="fog" args={[isNight ? "#050510" : "#a2c5d1", 5, 1300]} />
                </>
              )}
            </Suspense>
          </Canvas>
        </div>
      )}
    </div>
  );
};

export default App;
