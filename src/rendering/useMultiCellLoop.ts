import { useEffect, useRef } from 'react';
import { MicroscopeState } from '../state/microscopeState';
import { CellSimulation } from '../core/cell';
import { MicroscopeRenderer } from './renderer';
import { PlantCellRenderer } from './plantCellRenderer';
import { SecretoryPathwayProcess } from '../core/processes/secretoryPathway';

export function useMultiCellLoop(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  microscopeState: MicroscopeState,
  processRef: React.RefObject<SecretoryPathwayProcess>,
  selectedCellType: 'animal' | 'plant' | 'bacterial',
  selectedStructureId?: string | null,
  onSimulationReady?: (sim: CellSimulation) => void
) {
  const simulationRef = useRef<CellSimulation | null>(null);
  const animalRendererRef = useRef<MicroscopeRenderer | null>(null);
  const plantRendererRef = useRef<PlantCellRenderer | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    
    const width = canvas.parentElement?.clientWidth || 800;
    const height = canvas.parentElement?.clientHeight || 600;

    const simulation = new CellSimulation(width, height);
    simulationRef.current = simulation;
    if (onSimulationReady) {
      onSimulationReady(simulation);
    }

    const animalRenderer = new MicroscopeRenderer(canvas, simulation);
    animalRenderer.resize(width, height);
    animalRendererRef.current = animalRenderer;

    const plantRenderer = new PlantCellRenderer(canvas);
    plantRenderer.resize(width, height);
    plantRendererRef.current = plantRenderer;

    let animationFrameId: number;

    const renderLoop = () => {
      if (selectedCellType === 'animal' || selectedCellType === 'bacterial') {
        const speed = processRef.current?.speed || 1.0;
        const state = processRef.current?.state;
        const dt = state === 'paused' ? 0 : 0.016 * speed;
        simulation.update(dt, processRef.current);
        animalRenderer.render(microscopeState, processRef.current);
      } else if (selectedCellType === 'plant') {
        plantRenderer.render(microscopeState, selectedStructureId);
      }
      animationFrameId = requestAnimationFrame(renderLoop);
    };

    animationFrameId = requestAnimationFrame(renderLoop);

    const handleResize = () => {
      if (!canvas.parentElement) return;
      const w = canvas.parentElement.clientWidth;
      const h = canvas.parentElement.clientHeight;
      animalRenderer.resize(w, h);
      plantRenderer.resize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [selectedCellType]);

  useEffect(() => {
    if (canvasRef.current) {
      const width = canvasRef.current.parentElement?.clientWidth || 800;
      const height = canvasRef.current.parentElement?.clientHeight || 600;
      if (selectedCellType === 'plant' && plantRendererRef.current) {
        plantRendererRef.current.resize(width, height);
        plantRendererRef.current.render(microscopeState, selectedStructureId);
      } else if (animalRendererRef.current) {
        animalRendererRef.current.resize(width, height);
        animalRendererRef.current.render(microscopeState, processRef.current);
      }
    }
  }, [microscopeState, selectedCellType, selectedStructureId]);

  return { simulationRef, plantRendererRef };
}
