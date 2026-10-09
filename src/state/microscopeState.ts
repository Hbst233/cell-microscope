export interface MicroscopeState {
  zoom: number;
  focusZ: number;
  panX: number;
  panY: number;
  stainMode: 'normal' | 'fluorescence' | 'membrane';
}

export interface OrganelleInfo {
  id: string;
  type: 'nucleus' | 'mitochondrion' | 'cytoplasm' | 'membrane' | 'vesicle';
  name: string;
  description: string;
  x: number;
  y: number;
  radius: number;
}
