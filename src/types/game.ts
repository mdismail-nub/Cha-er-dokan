export type StationId = 'stove' | 'kettle' | 'cups' | 'biscuits' | 'counter';

export type HeldItem = 'none' | 'kettle' | 'filled_cup' | 'biscuit';

export type LightingPreset = 'golden_hour' | 'morning_mist' | 'evening_lantern';

export type CameraPreset = 'third_person' | 'stall_overview' | 'counter_closeup' | 'roadside_angle';

export interface AABBCollider {
  id: string;
  label: string;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  minY?: number;
  maxY?: number;
}

export interface InteractiveStation {
  id: StationId;
  title: string;
  bengaliTitle: string;
  worldPos: [number, number, number];
  interactionRadius: number;
  getActionLabel: (state: StallSimState) => string;
  getSubPrompt: (state: StallSimState) => string;
}

export interface StallSimState {
  stoveLit: boolean;
  kettleBoiling: boolean;
  teaBrewLevel: number; // 0 to 100
  cupsFilledCount: number; // 0 to 6
  biscuitsRemaining: number; // 0 to 16
  heldItem: HeldItem;
  customersServed: number;
  lastActionToast: string;
}

export interface ActivePromptScreen {
  stationId: StationId;
  title: string;
  bengaliTitle: string;
  actionLabel: string;
  subPrompt: string;
  screenX: number;
  screenY: number;
  visible: boolean;
  distance: number;
}

export type CustomModelSlot = 'character' | 'cng' | 'rickshaw';

export interface CustomLoadedModelInfo {
  slot: CustomModelSlot;
  fileName: string;
  loadedAt: string;
  polyCount: number;
}
