import { useEffect, useRef } from 'react';
import { MicroscopeState } from '../state/microscopeState';
import { CellSimulation } from '../core/cell';
import { MicroscopeRenderer } from '../rendering/renderer';
import { SecretoryPathwayProcess } from '../core/processes/secretoryPathway';

export function useMicroscopeLoop(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  microscopeState: MicroscopeState,
  processRef: React.RefObject<SecretoryPathwayProcess>,
  onSimulationReady?: (sim: CellSimulation) => void
) {
  const simulationRef = useRef<CellSimulation | null>(null);
  const rendererRef = useRef<MicroscopeRenderer | null>(null);

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

    const renderer = new MicroscopeRenderer(canvas, simulation);
    renderer.resize(width, height);
    rendererRef.current = renderer;

    let animationFrameId: number;

    const renderLoop = () => {
      const speed = processRef.current?.speed || 1.0;
      const state = processRef.current?.state;
      // If paused, do not update simulation physics or dt, just render current frame
      const dt = state === 'paused' ? 0 : 0.016 * speed;
      simulation.update(dt, processRef.current);
      renderer.render(microscopeState, processRef.current);
      animationFrameId = requestAnimationFrame(renderLoop);
    };

    animationFrameId = requestAnimationFrame(renderLoop);

    const handleResize = () => {
      if (!canvas.parentElement) return;
      const w = canvas.parentElement.clientWidth;
      const h = canvas.parentElement.clientHeight;
      renderer.resize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.render(microscopeState, processRef.current);
    }
  }, [microscopeState]);

  return { simulationRef, rendererRef };
}
