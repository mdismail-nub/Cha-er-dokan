import React, { useRef, useState } from 'react';
import { Check, Copy, FileUp, FolderOpen, Layers, X } from 'lucide-react';
import { CustomLoadedModelInfo, CustomModelSlot } from '../types/game';

interface AssetImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  loadedModels: CustomLoadedModelInfo[];
  uploadError: string | null;
  onUploadFile: (slot: CustomModelSlot, file: File) => void;
}

const GLTF_CODE_SNIPPET = `import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const loader = new GLTFLoader();
loader.load('/models/cng_rickshaw.glb', (gltf) => {
  const model = gltf.scene;

  // 1. Enable shadows on all child meshes
  model.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  // 2. Ground pivot at bottom-center & place on roadside
  const box = new THREE.Box3().setFromObject(model);
  model.position.set(-4.5, -box.min.y, 2.2);
  scene.add(model);
});`;

export const AssetImportModal: React.FC<AssetImportModalProps> = ({
  isOpen,
  onClose,
  loadedModels,
  uploadError,
  onUploadFile,
}) => {
  const [activeTab, setActiveTab] = useState<'importer' | 'status'>('importer');
  const [copied, setCopied] = useState(false);

  const charInputRef = useRef<HTMLInputElement>(null);
  const cngInputRef = useRef<HTMLInputElement>(null);
  const rickshawInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(GLTF_CODE_SNIPPET);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleFileChange = (slot: CustomModelSlot, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadFile(slot, file);
      e.target.value = '';
    }
  };

  const getLoadedForSlot = (slot: CustomModelSlot) =>
    loadedModels.find((m) => m.slot === slot);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="asset-modal-title"
    >
      <div className="w-full max-w-3xl rounded-xl border border-[#3a3228] bg-[#161310] text-[#f5efe6] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2c251d] px-6 py-4">
          <div>
            <h2 id="asset-modal-title" className="text-lg font-semibold text-[#fef3c7]">
              3D Asset Importer & Prototype Status
            </h2>
            <p className="text-xs text-[#a89c8e] mt-0.5">
              Load custom .GLB / .GLTF models live or inspect prototype implementation details
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-[#a89c8e] hover:bg-[#262019] hover:text-white transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Segmented Control Tabs */}
        <div className="flex items-center gap-1 border-b border-[#2c251d] bg-[#120f0c] px-6 py-2.5">
          <button
            onClick={() => setActiveTab('importer')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'importer'
                ? 'bg-[#2c241b] text-[#fef3c7]'
                : 'text-[#a89c8e] hover:text-[#f5efe6]'
            }`}
          >
            Custom .GLB / .GLTF Asset Loader
          </button>
          <button
            onClick={() => setActiveTab('status')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'status'
                ? 'bg-[#2c241b] text-[#fef3c7]'
                : 'text-[#a89c8e] hover:text-[#f5efe6]'
            }`}
          >
            Working Features & Roadmap
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[72vh] overflow-y-auto px-6 py-5 space-y-6">
          {activeTab === 'importer' ? (
            <>
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-[#f5efe6]">
                  1. Live Browser Model Replacement (.glb / .gltf)
                </h3>
                <p className="text-xs text-[#b8ab9c] leading-relaxed">
                  The scene currently renders multi-part procedural 3D meshes for the Player
                  Character, Green Bangladeshi CNG Auto-Rickshaw, and Cycle Rickshaw. If you have
                  your own <span className="font-mono text-[#fcd34d]">.glb</span> file on disk,
                  select a slot below to hot-swap it directly into the live 3D scene with automatic
                  scale normalization and ground-pivot alignment.
                </p>
              </div>

              {uploadError && (
                <div className="rounded-lg border border-red-800/60 bg-red-950/50 px-4 py-2.5 text-xs text-red-200">
                  Import Error: {uploadError}
                </div>
              )}

              {/* 3 Upload Slots */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {/* Character Slot */}
                <div className="rounded-lg border border-[#2e271f] bg-[#1c1814] p-4 flex flex-col justify-between gap-3">
                  <div>
                    <div className="text-xs text-[#a89c8e]">Slot 01 · Player Actor</div>
                    <div className="text-sm font-semibold text-[#f5efe6] mt-0.5">
                      Character Model
                    </div>
                    <div className="text-xs text-[#8c7f70] mt-1 font-mono">
                      {getLoadedForSlot('character')
                        ? `${getLoadedForSlot('character')!.fileName} · ${getLoadedForSlot('character')!.polyCount} tris`
                        : 'Default: Procedural Lungi & Panjabi'}
                    </div>
                  </div>
                  <input
                    ref={charInputRef}
                    type="file"
                    accept=".glb,.gltf"
                    onChange={(e) => handleFileChange('character', e)}
                    className="hidden"
                  />
                  <button
                    onClick={() => charInputRef.current?.click()}
                    className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-md bg-[#2c241b] hover:bg-[#3b3024] text-xs font-medium text-[#fef3c7] transition-colors whitespace-nowrap shrink-0"
                  >
                    <FileUp className="w-3.5 h-3.5" />
                    Load Character .GLB
                  </button>
                </div>

                {/* CNG Slot */}
                <div className="rounded-lg border border-[#2e271f] bg-[#1c1814] p-4 flex flex-col justify-between gap-3">
                  <div>
                    <div className="text-xs text-[#a89c8e]">Slot 02 · Roadside West</div>
                    <div className="text-sm font-semibold text-[#f5efe6] mt-0.5">
                      CNG Auto-Rickshaw
                    </div>
                    <div className="text-xs text-[#8c7f70] mt-1 font-mono">
                      {getLoadedForSlot('cng')
                        ? `${getLoadedForSlot('cng')!.fileName} · ${getLoadedForSlot('cng')!.polyCount} tris`
                        : 'Default: Procedural Green CNG'}
                    </div>
                  </div>
                  <input
                    ref={cngInputRef}
                    type="file"
                    accept=".glb,.gltf"
                    onChange={(e) => handleFileChange('cng', e)}
                    className="hidden"
                  />
                  <button
                    onClick={() => cngInputRef.current?.click()}
                    className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-md bg-[#2c241b] hover:bg-[#3b3024] text-xs font-medium text-[#fef3c7] transition-colors whitespace-nowrap shrink-0"
                  >
                    <FileUp className="w-3.5 h-3.5" />
                    Load CNG .GLB
                  </button>
                </div>

                {/* Rickshaw Slot */}
                <div className="rounded-lg border border-[#2e271f] bg-[#1c1814] p-4 flex flex-col justify-between gap-3">
                  <div>
                    <div className="text-xs text-[#a89c8e]">Slot 03 · Roadside East</div>
                    <div className="text-sm font-semibold text-[#f5efe6] mt-0.5">
                      Cycle Rickshaw
                    </div>
                    <div className="text-xs text-[#8c7f70] mt-1 font-mono">
                      {getLoadedForSlot('rickshaw')
                        ? `${getLoadedForSlot('rickshaw')!.fileName} · ${getLoadedForSlot('rickshaw')!.polyCount} tris`
                        : 'Default: Procedural Cycle Rickshaw'}
                    </div>
                  </div>
                  <input
                    ref={rickshawInputRef}
                    type="file"
                    accept=".glb,.gltf"
                    onChange={(e) => handleFileChange('rickshaw', e)}
                    className="hidden"
                  />
                  <button
                    onClick={() => rickshawInputRef.current?.click()}
                    className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-md bg-[#2c241b] hover:bg-[#3b3024] text-xs font-medium text-[#fef3c7] transition-colors whitespace-nowrap shrink-0"
                  >
                    <FileUp className="w-3.5 h-3.5" />
                    Load Rickshaw .GLB
                  </button>
                </div>
              </div>

              {/* Permanent Project Integration Guide */}
              <div className="space-y-2.5 pt-2 border-t border-[#2c251d]">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-[#f5efe6] flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-amber-400" />
                    2. Permanent Project Import Guide (/public/models/*.glb)
                  </h3>
                  <button
                    onClick={handleCopyCode}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#262019] hover:bg-[#332b22] text-xs text-[#d6c9b8] transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copy Snippet
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs text-[#b8ab9c]">
                  To bundle your own <span className="font-mono">.glb</span> files permanently in
                  the repository, place them in{' '}
                  <span className="font-mono text-[#fcd34d]">/public/models/cng_rickshaw.glb</span>{' '}
                  (or <span className="font-mono">character.glb</span>) and load them with{' '}
                  <span className="font-mono">GLTFLoader</span> inside{' '}
                  <span className="font-mono">src/three/models.ts</span>:
                </p>
                <pre className="rounded-lg bg-[#0d0b09] border border-[#262019] p-3.5 text-xs font-mono text-[#e5dccb] overflow-x-auto leading-relaxed">
                  {GLTF_CODE_SNIPPET}
                </pre>
              </div>
            </>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-emerald-300 flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  Implemented & Working in Prototype
                </h3>
                <ul className="space-y-2 text-xs text-[#d6c9b8] leading-relaxed">
                  <li>
                    <strong className="text-white">Bangladeshi Cha-er Dokan Environment:</strong>{' '}
                    Sloped corrugated tin roof with timber rafters, brick plinth, 4 wooden support
                    posts, wooden L-counter, back storage shelf, and Bengali/English signboard.
                  </li>
                  <li>
                    <strong className="text-white">Countertop Props & Seating:</strong> Kerosene/gas
                    stove with animated burner flame, spun-aluminum kettle with rising steam puffs,
                    6 glass tea cups with condensed milk tins, 2 glass biscuit jars, 3 plastic
                    stools, and wooden customer bench.
                  </li>
                  <li>
                    <strong className="text-white">Roadside Surroundings:</strong> Asphalt road with
                    earthen shoulders, parked green CNG auto-rickshaw, cycle rickshaw, banyan/mango
                    trees, and rural utility pole.
                  </li>
                  <li>
                    <strong className="text-white">Third-Person Controller & Camera:</strong> WASD
                    movement relative to camera orientation, smooth exponential damping follow
                    camera, mouse-drag look & scroll zoom, and limb walking animations.
                  </li>
                  <li>
                    <strong className="text-white">Circle-vs-AABB Sliding Collisions:</strong> Solid
                    collision response against counter, stall walls, posts, wooden bench, plastic
                    stools, CNG, rickshaw, and trees (with optional wireframe view).
                  </li>
                  <li>
                    <strong className="text-white">Contextual E-Key Interactions:</strong> Real-time
                    proximity detection with 3D-to-2D projected screen prompts for Stove, Kettle,
                    Glass Cups, Biscuit Jars, and Customer Counter.
                  </li>
                </ul>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-amber-300">
                  Planned for Next Iteration (Not Yet Implemented)
                </h3>
                <ul className="space-y-2 text-xs text-[#b8ab9c] leading-relaxed">
                  <li>
                    <strong className="text-[#f5efe6]">Taka Economy & Inventory Purchasing:</strong>{' '}
                    Earning Bangladeshi Taka (৳) per cup served and restocking tea leaves, sugar,
                    condensed milk, and biscuits from a wholesale bazaar.
                  </li>
                  <li>
                    <strong className="text-[#f5efe6]">Autonomous NPC Customer Queue & AI:</strong>{' '}
                    Pedestrians walking along the asphalt road, sitting on empty plastic stools,
                    requesting specific tea recipes (Dudh Cha, Lal Cha, Rong Cha, Ginger Cha), and
                    departing after drinking.
                  </li>
                  <li>
                    <strong className="text-[#f5efe6]">Moving Roadside Traffic:</strong> Animated
                    CNG auto-rickshaws and cycle rickshaws driving along the road with horn audio
                    ambience.
                  </li>
                  <li>
                    <strong className="text-[#f5efe6]">Skeletal Rigged GLTF Animations:</strong>{' '}
                    Full <span className="font-mono">THREE.AnimationMixer</span> support for walk,
                    idle, and pour animation clips when a rigged character <span className="font-mono">.glb</span> is imported.
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
