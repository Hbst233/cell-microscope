import { useEffect } from 'react';
import { MicroscopeState } from '../state/microscopeState';
import { PlantCellRenderer } from './plantCellRenderer';

export function usePlantMicroscopeLoop(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  microscopeState: MicroscopeState
) {
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    
    const width = canvas.parentElement?.clientWidth || 800;
    const height = canvas.parentElement?.clientHeight || 600;

    const renderer = new PlantCellRenderer(canvas);
    renderer.resize(width, height);

    let animationFrameId: number;

    const renderLoop = () => {
      renderer.render(microscopeState);
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
    if (canvasRef.current) {
      const width = canvasRef.current.parentElement?.clientWidth || 800;
      const height = canvasRef.current.parentElement?.clientHeight || 600;
      const renderer = new PlantCellRenderer(canvasRef.current);
      renderer.resize(width, height);
      renderer.render(microscopeState);
    }
  }, [microscopeState]);
}
