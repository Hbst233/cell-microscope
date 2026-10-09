export interface StainTheme {
  cytoplasmInner: string;
  cytoplasmOuter: string;
  membraneColor: string;
  membraneWidth: number;
  nucleusInner: string;
  nucleusOuter: string;
  nucleusBorder: string;
  nucleolusColor: string;
  mitochondriaColor: string;
  mitochondriaGlow: string;
  ribosomeColor: string;
  glowEnabled: boolean;
  glowColor?: string;
  glowBlur?: number;
}

export const STAIN_THEMES: Record<string, StainTheme> = {
  normal: {
    cytoplasmInner: 'rgba(74, 222, 128, 0.22)',
    cytoplasmOuter: 'rgba(34, 197, 94, 0.35)',
    membraneColor: '#15803d',
    membraneWidth: 4,
    nucleusInner: 'rgba(59, 130, 246, 0.35)',
    nucleusOuter: 'rgba(29, 78, 216, 0.55)',
    nucleusBorder: '#1e3a8a',
    nucleolusColor: '#172554',
    mitochondriaColor: '#ef4444',
    mitochondriaGlow: 'none',
    ribosomeColor: '#facc15',
    glowEnabled: false
  },
  fluorescence: {
    cytoplasmInner: 'rgba(16, 185, 129, 0.15)',
    cytoplasmOuter: 'rgba(5, 150, 105, 0.25)',
    membraneColor: '#34d399',
    membraneWidth: 5,
    nucleusInner: 'rgba(168, 85, 247, 0.5)',
    nucleusOuter: 'rgba(126, 34, 206, 0.7)',
    nucleusBorder: '#c084fc',
    nucleolusColor: '#faf5ff',
    mitochondriaColor: '#f43f5e',
    mitochondriaGlow: '#fb7185',
    ribosomeColor: '#38bdf8',
    glowEnabled: true,
    glowColor: '#a855f7',
    glowBlur: 15
  },
  membrane: {
    cytoplasmInner: 'rgba(15, 23, 42, 0.8)',
    cytoplasmOuter: 'rgba(30, 41, 59, 0.9)',
    membraneColor: '#38bdf8',
    membraneWidth: 6,
    nucleusInner: 'rgba(51, 65, 85, 0.8)',
    nucleusOuter: 'rgba(71, 85, 105, 0.9)',
    nucleusBorder: '#0284c7',
    nucleolusColor: '#0f172a',
    mitochondriaColor: '#fb923c',
    mitochondriaGlow: '#fdba74',
    ribosomeColor: '#f43f5e',
    glowEnabled: true,
    glowColor: '#38bdf8',
    glowBlur: 12
  }
};
