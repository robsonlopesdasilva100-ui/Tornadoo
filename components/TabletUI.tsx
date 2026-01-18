
import React, { useState } from 'react';
import { 
  Package, Radar as RadarIcon, Settings, X, 
  Gamepad2, Lightbulb, ShoppingCart, Shield, Zap, Target, DollarSign, Wrench, 
  Save, Download, Film, Trash2, PlayCircle, Car as CarIcon
} from 'lucide-react';
import { Upgrades, VideoRecording, CarModelId, CarModel } from '../types';

const VEHICLE_MODELS: CarModel[] = [
    { id: 'scout', name: 'Lata de Velha', price: 0, baseSpeed: 15, baseHealth: 100, description: 'Enferrujado e barulhento. Quase se desfaz no vento.' },
    { id: 'tracker', name: 'Rastreador Pro', price: 1500, baseSpeed: 22, baseHealth: 250, description: 'Chassi reforçado e motor turbo. Ótimo para fugas.' },
    { id: 'beast', name: 'O Interceptador', price: 5000, baseSpeed: 30, baseHealth: 600, description: 'Um tanque blindado. Ignora ventos leves.' }
];

interface TabletUIProps {
  onClose: () => void;
  inventory: { id: string, name: string, active: boolean }[];
  toggleItem: (id: string) => void;
  money: number;
  carHealth: number;
  currentCarModel: CarModelId;
  unlockedModels: CarModelId[];
  upgrades: Upgrades;
  onRepair: () => void;
  onUpgrade: (type: keyof Upgrades) => void;
  onBuyInterceptor: (modelId: CarModelId, price: number) => void;
  onSave: () => void;
  onLoad: () => void;
  recordings: VideoRecording[];
}

const TabletUI: React.FC<TabletUIProps> = ({ 
    onClose, inventory, toggleItem, money, carHealth, currentCarModel, unlockedModels, upgrades, onRepair, onUpgrade, onBuyInterceptor, onSave, onLoad, recordings
}) => {
  const [activeTab, setActiveTab] = useState<'INV' | 'SHOP' | 'RADAR' | 'KEYS' | 'CONF' | 'GAL' | 'VEH'>('SHOP');
  const [selectedVideo, setSelectedVideo] = useState<VideoRecording | null>(null);

  return (
    <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4">
      <div className="w-full max-w-4xl aspect-[16/10] tablet-screen rounded-[4rem] p-10 flex flex-col relative overflow-hidden border-[12px] border-neutral-900">
        <div className="scanline"></div>
        <div className="relative z-10 flex justify-between items-center mb-8 border-b border-green-500/20 pb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500 rounded-2xl text-black"><Zap size={24} /></div>
            <div>
                <h2 className="text-green-500 font-black tracking-widest text-xl uppercase">SISTEMA DE INTERCEPTAÇÃO</h2>
            </div>
          </div>
          <div className="flex flex-col items-end">
              <span className="text-green-500/40 text-[10px] font-black uppercase">Créditos</span>
              <div className="flex items-center gap-2"><DollarSign size={20} className="text-green-500" /><span className="text-white font-black text-3xl tracking-tighter">{money}</span></div>
          </div>
          <button onClick={onClose} className="p-4 bg-white/5 hover:bg-red-500 rounded-3xl transition-all"><X size={32} /></button>
        </div>

        <div className="relative z-10 flex gap-3 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          <TabButton active={activeTab === 'SHOP'} onClick={() => setActiveTab('SHOP')} icon={<ShoppingCart size={20}/>} label="Upgrades" />
          <TabButton active={activeTab === 'VEH'} onClick={() => setActiveTab('VEH')} icon={<CarIcon size={20}/>} label="Veículos" />
          <TabButton active={activeTab === 'GAL'} onClick={() => setActiveTab('GAL')} icon={<Film size={20}/>} label="Galeria" />
          <TabButton active={activeTab === 'INV'} onClick={() => setActiveTab('INV')} icon={<Package size={20}/>} label="Inventário" />
          <TabButton active={activeTab === 'KEYS'} onClick={() => setActiveTab('KEYS')} icon={<Gamepad2 size={20}/>} label="Controles" />
          <TabButton active={activeTab === 'CONF'} onClick={() => setActiveTab('CONF')} icon={<Settings size={20}/>} label="Sistema" />
        </div>

        <div className="relative z-10 flex-1 overflow-y-auto pr-4 custom-scrollbar">
          {activeTab === 'VEH' && (
            <div className="grid grid-cols-1 gap-4 pb-10">
                {VEHICLE_MODELS.map(model => {
                    const isUnlocked = unlockedModels.includes(model.id);
                    const isCurrent = currentCarModel === model.id;
                    return (
                        <div key={model.id} className={`p-6 rounded-3xl border-4 transition-all flex justify-between items-center ${isCurrent ? 'bg-green-500/20 border-green-500' : 'bg-black/40 border-white/5'}`}>
                            <div className="flex items-center gap-6">
                                <div className={`p-5 rounded-2xl ${isCurrent ? 'bg-green-500 text-black' : 'bg-white/5 text-white/40'}`}><CarIcon size={32} /></div>
                                <div>
                                    <h4 className="text-white font-black text-xl uppercase tracking-tighter">{model.name}</h4>
                                    <p className="text-white/40 text-xs mt-1 max-w-xs">{model.description}</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => onBuyInterceptor(model.id, model.price)}
                                disabled={isCurrent || (money < model.price && !isUnlocked)}
                                className={`px-10 py-4 rounded-2xl font-black text-sm transition-all ${
                                    isCurrent ? 'bg-green-500 text-black' : 
                                    isUnlocked ? 'bg-blue-500 text-black hover:bg-white' : 
                                    money >= model.price ? 'bg-white text-black hover:bg-green-500' : 'bg-red-500/20 text-red-500 opacity-50'
                                }`}
                            >
                                {isCurrent ? 'ATIVO' : isUnlocked ? 'SELECIONAR' : `$${model.price}`}
                            </button>
                        </div>
                    );
                })}
            </div>
          )}

          {activeTab === 'SHOP' && (
            <div className="space-y-8 pb-10">
                <div className="bg-blue-500/10 border-4 border-blue-500/20 p-8 rounded-[3rem] flex justify-between items-center">
                    <div className="flex items-center gap-6">
                        <div className="bg-blue-500 p-5 rounded-[2rem] text-black"><Wrench size={32} /></div>
                        <div><h3 className="text-white font-black text-xl uppercase">Manutenção</h3><p className="text-blue-400 text-xs font-bold">Integridade: {Math.ceil(carHealth)}%</p></div>
                    </div>
                    <button disabled={carHealth >= 100 || money < 250} onClick={onRepair} className={`px-10 py-5 rounded-2xl font-black ${carHealth >= 100 ? 'bg-neutral-800 text-neutral-500' : 'bg-blue-500 text-black'}`}>$250 - REPARAR</button>
                </div>
                <div className="grid grid-cols-1 gap-4">
                    <UpgradeRow icon={<Zap size={24} />} name="Motor" level={upgrades.engine} cost={(upgrades.engine + 1) * 400} money={money} onUpgrade={() => onUpgrade('engine')} />
                    <UpgradeRow icon={<Shield size={24} />} name="Blindagem" level={upgrades.chassis} cost={(upgrades.chassis + 1) * 400} money={money} onUpgrade={() => onUpgrade('chassis')} />
                    <UpgradeRow icon={<Target size={24} />} name="Sonda Radar" level={upgrades.radar} cost={(upgrades.radar + 1) * 400} money={money} onUpgrade={() => onUpgrade('radar')} />
                </div>
            </div>
          )}

          {activeTab === 'INV' && (
            <div className="grid grid-cols-2 gap-6">
              {inventory.map(item => (
                <button key={item.id} onClick={() => toggleItem(item.id)} className={`p-8 rounded-[2.5rem] border-4 flex flex-col items-center gap-4 transition-all ${item.active ? 'bg-green-500 text-black border-green-400' : 'bg-black/40 text-green-500/50 border-white/5'}`}>
                  {item.id === 'flashlight' ? <Lightbulb size={48} /> : <Package size={48} />}<span className="font-black text-lg uppercase">{item.name}</span>
                </button>
              ))}
            </div>
          )}

          {activeTab === 'GAL' && (
            <div className="grid grid-cols-2 gap-4 pb-10">
                {recordings.length === 0 ? <p className="col-span-2 text-center py-20 text-white/20 font-black">NENHUMA GRAVAÇÃO</p> : recordings.map(rec => (
                    <div key={rec.id} className="bg-white/5 p-4 rounded-3xl border border-white/10 group">
                        <video src={rec.dataUrl} className="w-full aspect-video rounded-xl bg-black mb-2" controls />
                        <div className="flex justify-between items-center text-[10px] text-white/40 font-black"><span>LOG_{rec.id}</span></div>
                    </div>
                ))}
            </div>
          )}

          {activeTab === 'KEYS' && (
            <div className="grid grid-cols-1 gap-3">
                <KeyRow keys="W A S D" action="Pilotar / Movimento" />
                <KeyRow keys="ESPAÇO" action="Propulsão (Pulo)" />
                <KeyRow keys="F" action="Acessar Veículo" />
                <KeyRow keys="H" action="Lançar Sonda Radar" />
                <KeyRow keys="C" action="Alternar Tablet" />
            </div>
          )}

          {activeTab === 'CONF' && (
            <div className="grid grid-cols-2 gap-6 p-10 bg-white/5 rounded-[3rem]">
                <button onClick={onSave} className="bg-green-500 text-black p-10 rounded-3xl font-black flex flex-col items-center gap-4 hover:scale-105 transition-all"><Save size={48} />SALVAR</button>
                <button onClick={onLoad} className="bg-white/10 text-green-500 p-10 rounded-3xl font-black flex flex-col items-center gap-4 hover:bg-white/20 transition-all"><Download size={48} />CARREGAR</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const TabButton = ({ active, onClick, icon, label }: any) => (
  <button onClick={onClick} className={`flex items-center gap-3 px-8 py-5 rounded-3xl font-black text-xs transition-all whitespace-nowrap border-2 ${active ? 'bg-green-500 text-black border-green-400' : 'bg-white/5 text-green-500/60 border-transparent hover:bg-white/10'}`}>
    {icon} {label}
  </button>
);

const UpgradeRow = ({ icon, name, level, cost, money, onUpgrade }: any) => (
    <div className="bg-black/40 border-2 border-white/5 p-6 rounded-[2rem] flex justify-between items-center">
        <div className="flex items-center gap-6"><div className={`p-4 rounded-2xl ${level >= 5 ? 'bg-green-500 text-black' : 'bg-white/5 text-green-500'}`}>{icon}</div><div><h4 className="text-white font-black text-lg uppercase">{name}</h4><div className="flex gap-1.5 mt-2">{[0,1,2,3,4].map(i => (<div key={i} className={`w-8 h-2 rounded-full ${i < level ? 'bg-green-500' : 'bg-neutral-800'}`} />))}</div></div></div>
        <button disabled={level >= 5 || money < cost} onClick={onUpgrade} className={`px-8 py-4 rounded-2xl font-black text-sm ${level >= 5 ? 'bg-neutral-800 text-neutral-500' : money >= cost ? 'bg-green-500 text-black' : 'bg-red-500/20 text-red-500'}`}>{level >= 5 ? 'MAX' : `$${cost}`}</button>
    </div>
);

const KeyRow = ({ keys, action }: any) => (
    <div className="flex justify-between items-center bg-white/5 p-5 rounded-2xl border-2 border-white/5"><span className="text-white/40 font-black text-xs uppercase">{action}</span><span className="bg-green-500/20 px-5 py-2 rounded-xl text-green-500 font-black text-sm border-2 border-green-500/30">{keys}</span></div>
);

export default TabletUI;
