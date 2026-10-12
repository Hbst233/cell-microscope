import { MicroscopeState } from '../state/microscopeState';

export class PlantCellRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private time: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
  }

  public resize(width: number, height: number) {
    this.canvas.width = width;
    this.canvas.height = height;
  }

  public render(state: MicroscopeState, selectedStructureId?: string | null) {
    const { width, height } = this.canvas;
    this.time += 0.016;
    this.ctx.clearRect(0, 0, width, height);

    this.ctx.save();
    
    // Apply camera pan & zoom
    this.ctx.translate(width / 2 + state.panX, height / 2 + state.panY);
    this.ctx.scale(state.zoom, state.zoom);
    this.ctx.translate(-width / 2, -height / 2);

    // 1. Draw Microscope Slide Background
    this.ctx.fillStyle = '#161e2e';
    this.ctx.fillRect(0, 0, width, height);

    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
    this.ctx.lineWidth = 1;
    const step = 45;
    for (let x = 0; x < width; x += step) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, height);
      this.ctx.stroke();
    }
    for (let y = 0; y < height; y += step) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(width, y);
      this.ctx.stroke();
    }

    // 2. Draw Plant Cell Schematics
    const cx = width / 2;
    const cy = height / 2;
    const boxWidth = 260;
    const boxHeight = 180;

    const blurAmount = Math.abs(state.focusZ) * 4;
    this.ctx.filter = blurAmount > 0.2 ? `blur(${blurAmount.toFixed(1)}px)` : 'none';

    // 1. Outer Cell Wall (Клеточная стенка)
    const isCellWallSelected = selectedStructureId === 'cellWall';
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.roundRect(cx - boxWidth / 2, cy - boxHeight / 2, boxWidth, boxHeight, 18);
    this.ctx.fillStyle = '#365314';
    this.ctx.fill();
    this.ctx.lineWidth = isCellWallSelected ? 12 : 8;
    this.ctx.strokeStyle = isCellWallSelected ? '#38bdf8' : '#65a30d';
    if (isCellWallSelected) {
      this.ctx.shadowColor = '#38bdf8';
      this.ctx.shadowBlur = 18;
    }
    this.ctx.stroke();
    this.ctx.restore();

    // 2. Inner Plasma Membrane (Плазматическая мембрана)
    const isMembraneSelected = selectedStructureId === 'membrane';
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.roundRect(cx - boxWidth / 2 + 8, cy - boxHeight / 2 + 8, boxWidth - 16, boxHeight - 16, 12);
    this.ctx.fillStyle = selectedStructureId === 'cytoplasm' ? 'rgba(74, 222, 128, 0.3)' : '#14532d';
    this.ctx.fill();
    this.ctx.lineWidth = isMembraneSelected ? 5 : 2.5;
    this.ctx.strokeStyle = isMembraneSelected ? '#38bdf8' : '#4ade80';
    if (isMembraneSelected) {
      this.ctx.shadowColor = '#38bdf8';
      this.ctx.shadowBlur = 15;
    }
    this.ctx.stroke();
    this.ctx.restore();

    // 3. Large Central Vacuole (Центральная вакуоль)
    const isVacuoleSelected = selectedStructureId === 'vacuole';
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.roundRect(cx - boxWidth / 2 + 25, cy - boxHeight / 2 + 20, 110, 140, 10);
    const vacGrad = this.ctx.createRadialGradient(cx - 20, cy, 10, cx - 20, cy, 80);
    vacGrad.addColorStop(0, 'rgba(186, 230, 253, 0.35)');
    vacGrad.addColorStop(1, 'rgba(14, 165, 233, 0.2)');
    this.ctx.fillStyle = vacGrad;
    this.ctx.fill();
    this.ctx.lineWidth = isVacuoleSelected ? 4 : 2;
    this.ctx.strokeStyle = isVacuoleSelected ? '#38bdf8' : 'rgba(56, 189, 248, 0.6)';
    if (isVacuoleSelected) {
      this.ctx.shadowColor = '#38bdf8';
      this.ctx.shadowBlur = 15;
    }
    this.ctx.stroke();
    this.ctx.restore();

    this.ctx.fillStyle = '#38bdf8';
    this.ctx.font = '10px sans-serif';
    this.ctx.fillText('Центральная вакуоль (Тургор)', cx - 55, cy - 10);

    // 4. Nucleus (Ядро)
    const isNucleusSelected = selectedStructureId === 'nucleus';
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.arc(cx + 75, cy - 35, 28, 0, Math.PI * 2);
    this.ctx.fillStyle = '#581c87';
    this.ctx.fill();
    this.ctx.lineWidth = isNucleusSelected ? 4 : 2;
    this.ctx.strokeStyle = isNucleusSelected ? '#38bdf8' : '#c084fc';
    if (isNucleusSelected) {
      this.ctx.shadowColor = '#38bdf8';
      this.ctx.shadowBlur = 18;
    }
    this.ctx.stroke();
    this.ctx.restore();

    this.ctx.fillStyle = '#e9d5ff';
    this.ctx.font = '10px sans-serif';
    this.ctx.fillText('Ядро', cx + 60, cy - 35);

    // 5. Chloroplasts (Хлоропласты)
    const isChloroplastSelected = selectedStructureId === 'chloroplast';
    const chloroplasts = [
      { x: cx + 60, y: cy + 45, angle: 0.3 },
      { x: cx - 75, y: cy - 55, angle: -0.4 },
      { x: cx - 65, y: cy + 50, angle: 0.7 }
    ];

    for (const cp of chloroplasts) {
      this.ctx.save();
      this.ctx.translate(cp.x, cp.y);
      this.ctx.rotate(cp.angle);
      this.ctx.beginPath();
      this.ctx.ellipse(0, 0, 16, 9, 0, 0, Math.PI * 2);
      this.ctx.fillStyle = '#15803d';
      this.ctx.fill();
      this.ctx.lineWidth = isChloroplastSelected ? 3.5 : 1.5;
      this.ctx.strokeStyle = isChloroplastSelected ? '#38bdf8' : '#86efac';
      if (isChloroplastSelected) {
        this.ctx.shadowColor = '#38bdf8';
        this.ctx.shadowBlur = 15;
      }
      this.ctx.stroke();

      // Granum / Thylakoids inside chloroplast
      this.ctx.fillStyle = '#4ade80';
      this.ctx.fillRect(-8, -3, 5, 6);
      this.ctx.fillRect(2, -3, 5, 6);
      this.ctx.restore();
    }

    this.ctx.fillStyle = '#86efac';
    this.ctx.font = '10px sans-serif';
    this.ctx.fillText('Хлоропласты', cx + 30, cy + 65);

    this.ctx.restore();
    this.ctx.filter = 'none';

    // 3. Microscope Lens Overlay & Title
    this.ctx.save();
    const gradient = this.ctx.createRadialGradient(
      width / 2, height / 2, Math.min(width, height) * 0.35,
      width / 2, height / 2, Math.min(width, height) * 0.55
    );
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.85)');

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, width, height);

    this.ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    this.ctx.fillRect(15, 15, 240, 44);
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    this.ctx.strokeRect(15, 15, 240, 44);

    this.ctx.fillStyle = '#38bdf8';
    this.ctx.font = '12px monospace';
    this.ctx.fillText('Увеличение: 60x (Растительная клетка)', 22, 30);
    this.ctx.fillStyle = '#94a3b8';
    this.ctx.font = '11px sans-serif';
    this.ctx.fillText('Кликните по структуре для справки', 22, 48);

    this.ctx.restore();
  }

  public getStructureAt(px: number, py: number, width: number, height: number): string | null {
    const cx = width / 2;
    const cy = height / 2;

    // Check Chloroplasts
    const chloroplasts = [
      { x: cx + 60, y: cy + 45 },
      { x: cx - 75, y: cy - 55 },
      { x: cx - 65, y: cy + 50 }
    ];
    for (const cp of chloroplasts) {
      const dx = px - cp.x;
      const dy = py - cp.y;
      if (dx * dx + dy * dy <= 20 * 20) {
        return 'chloroplast';
      }
    }

    // Check Nucleus
    const ndx = px - (cx + 75);
    const ndy = py - (cy - 35);
    if (ndx * ndx + ndy * ndy <= 30 * 30) {
      return 'nucleus';
    }

    // Check Vacuole
    if (px >= cx - 130 + 25 && px <= cx - 130 + 135 && py >= cy - 90 + 20 && py <= cy - 90 + 160) {
      return 'vacuole';
    }

    // Check Cell Wall vs Plasma Membrane vs Cytoplasm
    if (px >= cx - 130 && px <= cx + 130 && py >= cy - 90 && py <= cy + 90) {
      if (px <= cx - 130 + 8 || px >= cx + 130 - 8 || py <= cy - 90 + 8 || py >= cy + 90 - 8) {
        return 'cellWall';
      }
      if (px <= cx - 130 + 16 || px >= cx + 130 - 16 || py <= cy - 90 + 16 || py >= cy + 90 - 16) {
        return 'membrane';
      }
      return 'cytoplasm';
    }

    return null;
  }
}
