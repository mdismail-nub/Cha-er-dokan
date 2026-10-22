import React, { useCallback, useEffect, useState } from 'react';
import {
  Box,
  ChevronDown,
  ChevronUp,
  Compass,
  Flame,
  FolderUp,
  Hand,
  Sun,
} from 'lucide-react';
import { AssetImportModal } from './components/AssetImportModal';
import { ChaDokanCanvas } from './components/ChaDokanCanvas';
import { executeStationInteraction } from './three/stations';
import {
  ActivePromptScreen,
  CameraPreset,
  CustomLoadedModelInfo,
  CustomModelSlot,
  LightingPreset,
  StallSimState,
  StationId,
} from './types/game';

const INITIAL_SIM_STATE: StallSimState = {
  stoveLit: true,
  kettleBoiling: true,
  teaBrewLevel: 100,
  cupsFilledCount: 3,
  biscuitsRemaining: 16,
  heldItem: 'none',
  customersServed: 0,
  lastActionToast:
    'Walk around the stall with WASD, look with Mouse drag, and press E near the Stove, Kettle, Cups, or Counter.',
};

const HELD_ITEM_LABEL: Record<StallSimState['heldItem'], string> = {
  none: 'Empty Hands',
  kettle: 'Aluminum Kettle (Hot Cha)',
  filled_cup: 'Glass Cup of Dudh Cha',
  biscuit: 'Crispy Toast Biscuit',
};

export default function App() {
  const [simState, setSimState] = useState<StallSimState>(INITIAL_SIM_STATE);
  const [lightingPreset, setLightingPreset] = useState<LightingPreset>('golden_hour');
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('third_person');
  const [showColliders, setShowColliders] = useState<boolean>(false);
  const [dockCollapsed, setDockCollapsed] = useState<boolean>(false);
  const [activePrompt, setActivePrompt] = useState<ActivePromptScreen | null>(null);
  const [playerPos, setPlayerPos] = useState<[number, number, number]>([1.35, 0, -1.65]);
  const [collidingWith, setCollidingWith] = useState<string | null>(null);
  const [mobileMove, setMobileMove] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Custom 3D Asset Loader state
  const [isAssetModalOpen, setIsAssetModalOpen] = useState<boolean>(false);
  const [loadedModels, setLoadedModels] = useState<CustomLoadedModelInfo[]>([]);
  const [pendingUpload, setPendingUpload] = useState<{
    slot: CustomModelSlot;
    file: File;
  } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleTriggerInteract = useCallback((stationId: StationId) => {
    setSimState((prev) => executeStationInteraction(stationId, prev));
  }, []);

  const handleReleaseCameraPreset = useCallback(() => {
    setCameraPreset('third_person');
  }, []);

  const handleTelemetryChange = useCallback(
    (pos: [number, number, number], hitLabel: string | null) => {
      setPlayerPos(pos);
      setCollidingWith(hitLabel);
    },
    []
  );

  // Keyboard shortcut 'H' to collapse/expand bottom control dock
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyH' && !isAssetModalOpen) {
        setDockCollapsed((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isAssetModalOpen]);

  const handleUploadFile = (slot: CustomModelSlot, file: File) => {
    setUploadError(null);
    setPendingUpload({ slot, file });
  };

  const handleUploadComplete = useCallback((info: CustomLoadedModelInfo) => {
    setPendingUpload(null);
    setLoadedModels((prev) => [...prev.filter((m) => m.slot !== info.slot), info]);
    setSimState((prev) => ({
      ...prev,
      lastActionToast: `Loaded custom 3D model "${info.fileName}" into ${info.slot.toUpperCase()} slot (${info.polyCount} triangles).`,
    }));
  }, []);

  const handleUploadError = useCallback((errMsg: string) => {
    setPendingUpload(null);
    setUploadError(errMsg);
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#12100e] select-none">
      {/* 1. Full-Viewport Interactive 3D Scene */}
      <ChaDokanCanvas
        simState={simState}
        lightingPreset={lightingPreset}
        cameraPreset={cameraPreset}
        showColliders={showColliders}
        mobileMoveInput={mobileMove}
        onReleaseCameraPreset={handleReleaseCameraPreset}
        onActivePromptChange={setActivePrompt}
        onTriggerInteract={handleTriggerInteract}
        onPlayerTelemetryChange={handleTelemetryChange}
        pendingModelUpload={pendingUpload}
        onModelUploadComplete={handleUploadComplete}
        onModelUploadError={handleUploadError}
      />

      {/* 2. Minimal Top-Left Header & Unboxed Stall Telemetry (Zero backdrop-blur over WebGL) */}
      <header className="pointer-events-none fixed top-4 left-4 right-4 z-20 flex flex-wrap items-start justify-between gap-4">
        <div className="pointer-events-auto rounded-xl border border-[#382f24] bg-[#16130f]/95 px-4 py-3 shadow-lg max-w-xl">
          <div className="flex items-baseline gap-3">
            <h1 className="text-base font-bold tracking-tight text-[#fef3c7] whitespace-nowrap shrink-0">
              Cha-er Dokan Simulator
            </h1>
            <span className="text-xs text-[#b8ab9c] whitespace-nowrap shrink-0">
              বিসমিল্লাহ চায়ের দোকান
            </span>
          </div>

          {/* Unboxed Metadata Row with Typographic Separators (Zero-Pill Discipline) */}
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#d6c9b8] font-mono tabular-nums">
            <span>Stove: {simState.stoveLit ? 'Lit' : 'Off'}</span>
            <span aria-hidden="true" className="text-[#6e6254]">
              ·
            </span>
            <span>Cups Filled: {simState.cupsFilledCount}/6</span>
            <span aria-hidden="true" className="text-[#6e6254]">
              ·
            </span>
            <span>Biscuits: {simState.biscuitsRemaining}</span>
            <span aria-hidden="true" className="text-[#6e6254]">
              ·
            </span>
            <span>Served: {simState.customersServed}</span>
            <span aria-hidden="true" className="text-[#6e6254]">
              ·
            </span>
            <span className="text-[#fcd34d]">Holding: {HELD_ITEM_LABEL[simState.heldItem]}</span>
          </div>

          {/* Subtle Action Feedback Line */}
          <p className="mt-1.5 text-xs text-[#a89c8e] leading-snug">
            {simState.lastActionToast}
          </p>
        </div>

        {/* Top-Right Compact Controls Legend & Coordinates */}
        <div className="pointer-events-auto hidden sm:flex flex-col items-end rounded-xl border border-[#382f24] bg-[#16130f]/95 px-3.5 py-2.5 text-xs text-[#b8ab9c] shadow-lg">
          <div className="flex items-center gap-2 text-[#f5efe6] font-medium">
            <span>WASD: Walk</span>
            <span aria-hidden="true" className="text-[#6e6254]">
              ·
            </span>
            <span>Mouse Drag: Look</span>
            <span aria-hidden="true" className="text-[#6e6254]">
              ·
            </span>
            <span>Scroll: Zoom</span>
            <span aria-hidden="true" className="text-[#6e6254]">
              ·
            </span>
            <span className="text-[#fcd34d]">E: Interact</span>
          </div>
          <div className="mt-1 flex items-center gap-2 font-mono text-[11px] text-[#8c7f70] tabular-nums">
            <span>
              Pos ({playerPos[0].toFixed(1)}, {playerPos[2].toFixed(1)})
            </span>
            {collidingWith && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-amber-400">Collision: {collidingWith}</span>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 3. Contextual 3D-Projected [E] Interaction Prompt */}
      {activePrompt && activePrompt.visible && (
        <div
          style={{
            transform: `translate3d(${Math.min(
              Math.max(activePrompt.screenX, 140),
              typeof window !== 'undefined' ? window.innerWidth - 140 : 800
            )}px, ${Math.min(
              Math.max(activePrompt.screenY, 90),
              typeof window !== 'undefined' ? window.innerHeight - 150 : 500
            )}px, 0)`,
          }}
          className="pointer-events-auto fixed top-0 left-0 z-30 -translate-x-1/2 -translate-y-full pb-3 transition-transform duration-75"
        >
          <button
            onClick={() => handleTriggerInteract(activePrompt.stationId)}
            className="group flex items-center gap-3 rounded-xl border border-amber-500/60 bg-[#181410]/96 px-3.5 py-2.5 text-left shadow-2xl hover:border-amber-400 transition-colors"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-sm font-bold text-[#14110d] font-mono shadow-sm">
              E
            </span>
            <div className="min-w-0">
              <div className="text-xs font-medium text-[#fcd34d] whitespace-nowrap">
                {activePrompt.bengaliTitle}
              </div>
              <div className="text-sm font-semibold text-white whitespace-nowrap">
                {activePrompt.actionLabel}
              </div>
              <div className="text-[11px] text-[#b8ab9c] max-w-[260px] truncate">
                {activePrompt.subPrompt}
              </div>
            </div>
          </button>
        </div>
      )}

      {/* 4. Mobile Touch Movement Pad (Visible on small touch screens) */}
      <div className=" fixed bottom-24 left-4 z-20 flex flex-col items-center gap-1 md:hidden">
        <button
          onPointerDown={() => setMobileMove({ x: 0, y: 1 })}
          onPointerUp={() => setMobileMove({ x: 0, y: 0 })}
          onPointerLeave={() => setMobileMove({ x: 0, y: 0 })}
          className="h-11 w-11 rounded-lg border border-[#3a3126] bg-[#16130f]/95 text-xs font-bold text-[#fef3c7] active:bg-amber-500 active:text-black"
        >
          W
        </button>
        <div className="flex gap-1">
          <button
            onPointerDown={() => setMobileMove({ x: -1, y: 0 })}
            onPointerUp={() => setMobileMove({ x: 0, y: 0 })}
            onPointerLeave={() => setMobileMove({ x: 0, y: 0 })}
            className="h-11 w-11 rounded-lg border border-[#3a3126] bg-[#16130f]/95 text-xs font-bold text-[#fef3c7] active:bg-amber-500 active:text-black"
          >
            A
          </button>
          <button
            onPointerDown={() => setMobileMove({ x: 0, y: -1 })}
            onPointerUp={() => setMobileMove({ x: 0, y: 0 })}
            onPointerLeave={() => setMobileMove({ x: 0, y: 0 })}
            className="h-11 w-11 rounded-lg border border-[#3a3126] bg-[#16130f]/95 text-xs font-bold text-[#fef3c7] active:bg-amber-500 active:text-black"
          >
            S
          </button>
          <button
            onPointerDown={() => setMobileMove({ x: 1, y: 0 })}
            onPointerUp={() => setMobileMove({ x: 0, y: 0 })}
            onPointerLeave={() => setMobileMove({ x: 0, y: 0 })}
            className="h-11 w-11 rounded-lg border border-[#3a3126] bg-[#16130f]/95 text-xs font-bold text-[#fef3c7] active:bg-amber-500 active:text-black"
          >
            D
          </button>
        </div>
      </div>

      {/* 5. Unified Collapsible Bottom Control Dock (Zero Viewport Occlusion) */}
      <div
        style={{
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          maxWidth: 'min(940px, 94vw)',
        }}
        className="fixed z-30 w-full flex flex-col items-center pointer-events-none"
      >
        {/* Collapse / Expand Drawer Toggle */}
        <button
          onClick={() => setDockCollapsed((prev) => !prev)}
          className="pointer-events-auto mb-1.5 flex items-center gap-1.5 rounded-t-lg border border-b-0 border-[#382f24] bg-[#16130f]/95 px-3.5 py-1 text-xs font-medium text-[#d6c9b8] hover:text-white transition-colors whitespace-nowrap shrink-0"
        >
          {dockCollapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5 text-amber-400" />
              Show Controls (H)
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5 text-amber-400" />
              Hide Controls (H)
            </>
          )}
        </button>

        {/* Main Horizontal Control Dock */}
        <div
          className={`pointer-events-auto w-full rounded-xl border border-[#382f24] bg-[#16130f]/95 px-4 py-2.5 shadow-2xl transition-all duration-200 ${
            dockCollapsed
              ? 'opacity-0 translate-y-8 pointer-events-none h-0 py-0 overflow-hidden border-0'
              : 'opacity-100 translate-y-0'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Group 1: Camera Presets */}
            <div className="flex items-center gap-1.5">
              <span className="flex items-center gap-1 text-xs font-medium text-[#a89c8e] mr-1 whitespace-nowrap shrink-0">
                <Compass className="w-3.5 h-3.5 text-amber-400" />
                Camera:
              </span>
              <div className="flex items-center gap-1 rounded-lg bg-[#0e0c0a] p-1 border border-[#29221a]">
                {(
                  [
                    ['third_person', 'Follow Cam'],
                    ['stall_overview', 'Stall View'],
                    ['counter_closeup', 'Counter'],
                    ['roadside_angle', 'Roadside CNG'],
                  ] as [CameraPreset, string][]
                ).map(([presetKey, label]) => (
                  <button
                    key={presetKey}
                    onClick={() => setCameraPreset(presetKey)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                      cameraPreset === presetKey
                        ? 'bg-[#2e251b] text-[#fef3c7]'
                        : 'text-[#9e9182] hover:text-[#f5efe6]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Group 2: Lighting / Time of Day */}
            <div className="flex items-center gap-1.5">
              <span className="flex items-center gap-1 text-xs font-medium text-[#a89c8e] mr-1 whitespace-nowrap shrink-0">
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                Lighting:
              </span>
              <div className="flex items-center gap-1 rounded-lg bg-[#0e0c0a] p-1 border border-[#29221a]">
                {(
                  [
                    ['golden_hour', 'Afternoon Sun'],
                    ['morning_mist', 'Morning Mist'],
                    ['evening_lantern', 'Evening Bulb'],
                  ] as [LightingPreset, string][]
                ).map(([lightKey, label]) => (
                  <button
                    key={lightKey}
                    onClick={() => setLightingPreset(lightKey)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                      lightingPreset === lightKey
                        ? 'bg-[#2e251b] text-[#fef3c7]'
                        : 'text-[#9e9182] hover:text-[#f5efe6]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Group 3: Quick Actions, Collider Debug & Custom 3D Asset Loader */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowColliders((prev) => !prev)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  showColliders
                    ? 'border-amber-500/60 bg-amber-500/15 text-[#fcd34d]'
                    : 'border-[#2e271f] bg-[#1c1814] text-[#b8ab9c] hover:text-white'
                }`}
              >
                <Box className="w-3.5 h-3.5" />
                {showColliders ? 'Colliders: On' : 'Colliders: Off'}
              </button>

              {activePrompt && (
                <button
                  onClick={() => handleTriggerInteract(activePrompt.stationId)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-xs font-semibold text-[#14110d] transition-colors whitespace-nowrap shrink-0"
                >
                  <Hand className="w-3.5 h-3.5" />
                  [E] {activePrompt.actionLabel}
                </button>
              )}

              {!activePrompt && (
                <button
                  onClick={() => handleTriggerInteract('stove')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#2e271f] bg-[#1c1814] hover:bg-[#28221c] text-xs font-medium text-[#d6c9b8] transition-colors whitespace-nowrap shrink-0"
                >
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  {simState.stoveLit ? 'Stove: Lit' : 'Light Stove'}
                </button>
              )}

              <button
                onClick={() => setIsAssetModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-500/40 bg-[#261f17] hover:bg-[#33291e] text-xs font-medium text-[#fef3c7] transition-colors whitespace-nowrap shrink-0"
              >
                <FolderUp className="w-3.5 h-3.5 text-amber-400" />
                Import .GLB / Status
                {loadedModels.length > 0 && (
                  <span className="ml-1 font-mono text-amber-300">({loadedModels.length})</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Custom 3D Asset Loader & Prototype Status Modal */}
      <AssetImportModal
        isOpen={isAssetModalOpen}
        onClose={() => setIsAssetModalOpen(false)}
        loadedModels={loadedModels}
        uploadError={uploadError}
        onUploadFile={handleUploadFile}
      />
    </div>
  );
}
