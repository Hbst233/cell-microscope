import { MicroscopeState } from '../state/microscopeState';
import { CellSimulation } from '../core/cell';
import { STAIN_THEMES } from './stainThemes';
import { SecretoryPathwayProcess } from '../core/processes/secretoryPathway';

export class MicroscopeRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private cellSimulation: CellSimulation;
  private time: number = 0;

  constructor(canvas: HTMLCanvasElement, cellSimulation: CellSimulation) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.cellSimulation = cellSimulation;
  }

  public resize(width: number, height: number) {
    this.canvas.width = width;
    this.canvas.height = height;
  }

  public render(state: MicroscopeState, secretoryProcess?: SecretoryPathwayProcess) {
    const { width, height } = this.canvas;
    this.time += 0.016;
    this.ctx.clearRect(0, 0, width, height);

    this.ctx.save();
    
    // Apply camera pan & zoom
    this.ctx.translate(width / 2 + state.panX, height / 2 + state.panY);
    this.ctx.scale(state.zoom, state.zoom);
    this.ctx.translate(-width / 2, -height / 2);

    // 1. Draw Microscope Field Background
    this.drawSlideBackground(width, height);

    // 2. Draw Cell Cytoplasm & Membrane & Organelles
    this.drawCell(state, secretoryProcess);

    this.ctx.restore();

    // 3. Draw microscope lens artifacts & vignette
    this.drawMicroscopeLensOverlay(width, height, state.zoom);
  }

  private drawSlideBackground(width: number, height: number) {
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
  }

  private drawCell(state: MicroscopeState, secretoryProcess?: SecretoryPathwayProcess) {
    const { x, y, radius, nucleus, mitochondria, ribosomes, roughER, smoothER, golgiApparatus, vesicles, lysosomes, cytoplasmicParticles } = this.cellSimulation;
    const theme = STAIN_THEMES[state.stainMode] || STAIN_THEMES.normal;
    const activeOrgId = secretoryProcess?.activeOrganelleId;

    const blurAmount = Math.abs(state.focusZ) * 4;
    this.ctx.filter = blurAmount > 0.2 ? `blur(${blurAmount.toFixed(1)}px)` : 'none';

    // Cytoplasm background with organic undulating membrane boundary
    const grad = this.ctx.createRadialGradient(x - 20, y - 20, 10, x, y, radius);
    grad.addColorStop(0, theme.cytoplasmInner);
    grad.addColorStop(0.7, theme.cytoplasmOuter);
    grad.addColorStop(1, 'rgba(40, 80, 20, 0.4)');

    this.ctx.beginPath();
    const segments = 36;
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const deformation = Math.sin(angle * 3 + this.time * 0.8) * 3.5 + Math.cos(angle * 5 - this.time * 0.5) * 2.0;
      const currentRadius = radius + deformation;
      const px = x + Math.cos(angle) * currentRadius;
      const py = y + Math.sin(angle) * currentRadius;
      if (i === 0) {
        this.ctx.moveTo(px, py);
      } else {
        this.ctx.lineTo(px, py);
      }
    }
    this.ctx.closePath();
    this.ctx.fillStyle = grad;
    this.ctx.fill();

    // Cytoskeleton filaments & streaming cytoplasmic currents
    this.ctx.strokeStyle = 'rgba(100, 180, 255, 0.08)';
    this.ctx.lineWidth = 1;
    for (let i = 0; i < 14; i++) {
      this.ctx.beginPath();
      const angle = (i / 14) * Math.PI * 2 + Math.sin(this.time * 0.1) * 0.2;
      const startDist = nucleus.radius + 5;
      const endDist = radius - 15;
      this.ctx.moveTo(x + Math.cos(angle) * startDist, y + Math.sin(angle) * startDist);
      this.ctx.quadraticCurveTo(
        x + Math.cos(angle + 0.5) * ((startDist + endDist) / 2),
        y + Math.sin(angle + 0.5) * ((startDist + endDist) / 2),
        x + Math.cos(angle) * endDist,
        y + Math.sin(angle) * endDist
      );
      this.ctx.stroke();
    }

    // Dynamic non-uniform cytoplasmic micro-particles & granules
    for (const cp of cytoplasmicParticles) {
      this.ctx.beginPath();
      this.ctx.arc(cp.x, cp.y, cp.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(220, 240, 200, ${cp.alpha})`;
      this.ctx.fill();
    }

    // Plasma Membrane (Organically deformed contour)
    this.ctx.lineWidth = theme.membraneWidth + 3;
    this.ctx.strokeStyle = 'rgba(15, 35, 10, 0.7)';
    this.ctx.beginPath();
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const deformation = Math.sin(angle * 3 + this.time * 0.8) * 3.5 + Math.cos(angle * 5 - this.time * 0.5) * 2.0;
      const currentRadius = radius + deformation;
      const px = x + Math.cos(angle) * currentRadius;
      const py = y + Math.sin(angle) * currentRadius;
      if (i === 0) this.ctx.moveTo(px, py);
      else this.ctx.lineTo(px, py);
    }
    this.ctx.closePath();
    this.ctx.stroke();

    this.ctx.lineWidth = theme.membraneWidth;
    this.ctx.strokeStyle = activeOrgId === 'membrane' ? '#38bdf8' : theme.membraneColor;
    if (activeOrgId === 'membrane') {
      this.ctx.shadowColor = '#38bdf8';
      this.ctx.shadowBlur = 12;
    }
    this.ctx.stroke();
    this.ctx.shadowBlur = 0;

    // Smooth ER
    for (let i = 0; i < smoothER.length; i++) {
      const ser = smoothER[i];
      const isActive = activeOrgId === 'smoothER';
      this.ctx.beginPath();
      this.ctx.arc(ser.x, ser.y, ser.radius + Math.sin(this.time * 3 + i) * 1, 0, Math.PI * 2);
      this.ctx.fillStyle = '#65a30d';
      this.ctx.fill();
      this.ctx.lineWidth = isActive ? 3 : 2;
      this.ctx.strokeStyle = isActive ? '#38bdf8' : '#4d7c0f';
      if (isActive) {
        this.ctx.shadowColor = '#38bdf8';
        this.ctx.shadowBlur = 10;
      }
      this.ctx.stroke();
      this.ctx.shadowBlur = 0;
    }

    // Rough ER
    const isRoughActive = activeOrgId === 'roughER';
    for (const rer of roughER) {
      this.ctx.save();
      this.ctx.translate(rer.x, rer.y);
      this.ctx.rotate(rer.angle);
      
      this.ctx.fillStyle = isRoughActive ? '#84cc16' : '#65a30d';
      if (isRoughActive) {
        this.ctx.shadowColor = '#38bdf8';
        this.ctx.shadowBlur = 12;
      }
      this.ctx.fillRect(-rer.length / 2, -4, rer.length, 8);
      
      this.ctx.fillStyle = '#fef08a';
      for (let d = -rer.length / 2 + 4; d < rer.length / 2; d += 5) {
        this.ctx.beginPath();
        this.ctx.arc(d, -5.5, 1.8, 0, Math.PI * 2);
        this.ctx.arc(d, 5.5, 1.8, 0, Math.PI * 2);
        this.ctx.fill();
      }
      this.ctx.restore();
    }
    this.ctx.shadowBlur = 0;

    // Render continuous protein cargo inside RER lumen (folding, quality control, folded, er exit site)
    if (this.cellSimulation.proteinCargo) {
      for (const cargo of this.cellSimulation.proteinCargo) {
        this.ctx.save();
        this.ctx.translate(cargo.x, cargo.y);

        if (cargo.stage === 'unfolded') {
          // Unfolded / nascent polypeptide chain as loose wavy filament
          this.ctx.strokeStyle = '#ec4899';
          this.ctx.lineWidth = 2.5;
          this.ctx.beginPath();
          for (let k = -10; k <= 10; k += 3) {
            const py = Math.sin(k * 0.5 + this.time * 3) * 4;
            if (k === -10) this.ctx.moveTo(k, py);
            else this.ctx.lineTo(k, py);
          }
          this.ctx.stroke();
          this.ctx.fillStyle = '#ec4899';
          this.ctx.font = '9px sans-serif';
          this.ctx.fillText('Развернутая цепь', -25, -10);
        } else if (cargo.stage === 'folding') {
          // Folding state: chain gradually twisting into compact 3D tertiary structure
          const fRatio = Math.min(1, cargo.progress / 2.5);
          this.ctx.strokeStyle = '#38bdf8';
          this.ctx.lineWidth = 2.5;
          this.ctx.beginPath();
          let lx = -10 * (1 - fRatio * 0.5);
          let ly = 0;
          this.ctx.moveTo(lx, ly);
          for (let s = 1; s <= 6; s++) {
            const angle = s * 1.5 + fRatio * Math.PI;
            lx += Math.cos(angle) * (8 * (1 - fRatio * 0.3));
            ly += Math.sin(angle) * (6 * (1 - fRatio * 0.3));
            this.ctx.lineTo(lx, ly);
          }
          this.ctx.stroke();
          this.ctx.fillStyle = '#38bdf8';
          this.ctx.font = '9px sans-serif';
          this.ctx.fillText(`Фолдинг (${Math.round(fRatio * 100)}%)`, -25, -10);
        } else if (cargo.stage === 'quality_control') {
          // Quality control state: chaperone binding/checking
          this.ctx.beginPath();
          this.ctx.arc(0, 0, 8, 0, Math.PI * 2);
          this.ctx.fillStyle = '#38bdf8';
          this.ctx.fill();
          this.ctx.lineWidth = 1.5;
          this.ctx.strokeStyle = '#ffffff';
          this.ctx.stroke();

          // Chaperone indicator
          this.ctx.beginPath();
          this.ctx.arc(-12, -8, 5, 0, Math.PI * 2);
          this.ctx.fillStyle = '#facc15';
          this.ctx.fill();
          this.ctx.fillStyle = '#facc15';
          this.ctx.font = '9px sans-serif';
          this.ctx.fillText('Шаперон (Контроль)', -35, -14);
        } else if (cargo.stage === 'folded') {
          // Correctly folded protein
          this.ctx.beginPath();
          this.ctx.arc(0, 0, 9, 0, Math.PI * 2);
          this.ctx.fillStyle = '#4ade80';
          this.ctx.shadowColor = '#4ade80';
          this.ctx.shadowBlur = 10;
          this.ctx.fill();
          this.ctx.lineWidth = 2;
          this.ctx.strokeStyle = '#ffffff';
          this.ctx.stroke();
          this.ctx.shadowBlur = 0;
          this.ctx.fillStyle = '#4ade80';
          this.ctx.font = '9px sans-serif';
          this.ctx.fillText('Свернутый белок ✓', -30, -14);
        } else if (cargo.stage === 'er_exit') {
          // ER Exit site & membrane budding preparation
          this.ctx.beginPath();
          this.ctx.arc(0, 0, 9, 0, Math.PI * 2);
          this.ctx.fillStyle = '#38bdf8';
          this.ctx.fill();
          this.ctx.lineWidth = 2;
          this.ctx.strokeStyle = '#0284c7';
          this.ctx.stroke();

          // Budding bulge
          this.ctx.beginPath();
          this.ctx.arc(12, -4, 7, 0, Math.PI * 2);
          this.ctx.fillStyle = 'rgba(56, 189, 248, 0.7)';
          this.ctx.fill();
          this.ctx.stroke();

          this.ctx.fillStyle = '#38bdf8';
          this.ctx.font = '9px sans-serif';
          this.ctx.fillText('ER Exit Site (Почкование)', -45, -14);
        }

        this.ctx.restore();
      }
    }
    const isGolgiActive = activeOrgId === 'golgi';
    for (let i = 0; i < golgiApparatus.length; i++) {
      const g = golgiApparatus[i];
      this.ctx.save();
      this.ctx.translate(g.x, g.y);
      this.ctx.rotate(g.angle);
      this.ctx.beginPath();
      this.ctx.ellipse(0, 0, g.width / 2, 5, 0, 0, Math.PI * 2);
      this.ctx.fillStyle = isGolgiActive ? '#fb923c' : '#f97316';
      if (isGolgiActive) {
        this.ctx.shadowColor = '#38bdf8';
        this.ctx.shadowBlur = 12;
      }
      this.ctx.fill();
      this.ctx.lineWidth = 1.5;
      this.ctx.strokeStyle = isGolgiActive ? '#38bdf8' : '#c2410c';
      this.ctx.stroke();
      this.ctx.restore();
    }
    this.ctx.shadowBlur = 0;

    // Free Ribosomes
    this.ctx.fillStyle = theme.ribosomeColor;
    for (const ribo of ribosomes) {
      this.ctx.beginPath();
      this.ctx.arc(ribo.x, ribo.y, 2, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // Transport Vesicles with route stage rendering (cis -> medial -> trans -> TGN -> secretory -> docking -> fusion -> exocytosis)
    for (const ves of vesicles) {
      this.ctx.beginPath();
      this.ctx.arc(ves.x, ves.y, ves.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = ves.cargoType === 'protein' ? 'rgba(56, 189, 248, 0.9)' : 'rgba(234, 179, 8, 0.85)';
      this.ctx.fill();
      this.ctx.lineWidth = 1.5;
      this.ctx.strokeStyle = ves.stage === 'fusion' || ves.stage === 'exocytosis' ? '#4ade80' : '#0284c7';
      this.ctx.stroke();

      // Label current stage if zoom is high enough
      if (state.zoom >= 2.0 && ves.stage && ves.stage !== 'transport_to_golgi' && ves.stage !== 'er_exit') {
        this.ctx.fillStyle = '#38bdf8';
        this.ctx.font = '9px sans-serif';
        const label = ves.stage === 'cis' ? 'cis-Гольджи' :
                      ves.stage === 'medial' ? 'medial-Гольджи' :
                      ves.stage === 'trans' ? 'trans-Гольджи' :
                      ves.stage === 'tgn' ? 'TGN (Сортировка)' :
                      ves.stage === 'secretory_transport' ? 'Секреторная везикула' :
                      ves.stage === 'docking_membrane' ? 'Докинг у мембраны' :
                      ves.stage === 'fusion' ? 'Слияние мембран' :
                      ves.stage === 'exocytosis' ? 'Экзоцитоз (Выброс белка)' : ves.stage;
        this.ctx.fillText(label, ves.x + 10, ves.y - 6);
      }
    }

    // Lysosomes
    const isLysosomeActive = activeOrgId === 'lysosome';
    for (const lys of lysosomes) {
      this.ctx.beginPath();
      this.ctx.arc(lys.x, lys.y, lys.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = '#a855f7';
      if (isLysosomeActive) {
        this.ctx.shadowColor = '#38bdf8';
        this.ctx.shadowBlur = 12;
      }
      this.ctx.fill();
      this.ctx.lineWidth = 1.5;
      this.ctx.strokeStyle = isLysosomeActive ? '#38bdf8' : '#7e22ce';
      this.ctx.stroke();
    }
    this.ctx.shadowBlur = 0;

    // Mitochondria
    const isMitoActive = activeOrgId === 'mitochondrion';
    for (const mito of mitochondria) {
      this.ctx.save();
      this.ctx.translate(mito.x, mito.y);
      this.ctx.rotate(mito.angle);

      this.ctx.beginPath();
      this.ctx.ellipse(0, 0, mito.length / 2, mito.width / 2, 0, 0, Math.PI * 2);
      this.ctx.fillStyle = theme.mitochondriaColor;
      if (isMitoActive || theme.mitochondriaGlow !== 'none') {
        this.ctx.shadowColor = isMitoActive ? '#38bdf8' : theme.mitochondriaGlow;
        this.ctx.shadowBlur = isMitoActive ? 15 : 8;
      }
      this.ctx.fill();
      this.ctx.lineWidth = 1.5;
      this.ctx.strokeStyle = isMitoActive ? '#38bdf8' : '#7f1d1d';
      this.ctx.stroke();

      // Cristae
      this.ctx.strokeStyle = 'rgba(254, 240, 138, 0.75)';
      this.ctx.lineWidth = 1.5;
      this.ctx.beginPath();
      this.ctx.moveTo(-mito.length / 4, -mito.width / 3);
      this.ctx.lineTo(-mito.length / 4, mito.width / 3);
      this.ctx.moveTo(0, -mito.width / 3 + 1);
      this.ctx.lineTo(0, mito.width / 3 - 1);
      this.ctx.moveTo(mito.length / 4, -mito.width / 3);
      this.ctx.lineTo(mito.length / 4, mito.width / 3);
      this.ctx.stroke();

      this.ctx.restore();
    }
    this.ctx.shadowBlur = 0;

    // Nucleus & Nucleolus & Nuclear Envelope Detailed Breakdown (Outer Membrane, Perinuclear Space, Inner Membrane, Lamina, Pores, Chromatin, DNA)
    const isNucleusActive = activeOrgId === 'nucleus' || activeOrgId === 'nucleolus';
    
    // 1. Outer Nuclear Membrane
    this.ctx.lineWidth = 2.0;
    this.ctx.strokeStyle = isNucleusActive ? '#38bdf8' : '#a855f7';
    this.ctx.beginPath();
    this.ctx.arc(nucleus.x, nucleus.y, nucleus.radius + 6, 0, Math.PI * 2);
    this.ctx.stroke();

    // 2. Perinuclear Space (lumen between outer and inner membranes)
    this.ctx.fillStyle = 'rgba(168, 85, 247, 0.12)';
    this.ctx.beginPath();
    this.ctx.arc(nucleus.x, nucleus.y, nucleus.radius + 6, 0, Math.PI * 2);
    this.ctx.arc(nucleus.x, nucleus.y, nucleus.radius, Math.PI * 2, 0, true);
    this.ctx.fill();

    // 3. Inner Nuclear Membrane
    this.ctx.lineWidth = 1.8;
    this.ctx.strokeStyle = isNucleusActive ? '#38bdf8' : '#c084fc';
    this.ctx.beginPath();
    this.ctx.arc(nucleus.x, nucleus.y, nucleus.radius, 0, Math.PI * 2);
    this.ctx.stroke();

    // 4. Nuclear Lamina (fibrous network underneath inner membrane)
    this.ctx.lineWidth = 1.2;
    this.ctx.strokeStyle = 'rgba(236, 72, 153, 0.6)';
    this.ctx.beginPath();
    this.ctx.arc(nucleus.x, nucleus.y, nucleus.radius - 3, 0, Math.PI * 2);
    this.ctx.stroke();

    // Nucleoplasm Gradient Fill
    const nGrad = this.ctx.createRadialGradient(nucleus.x - 20, nucleus.y - 20, 10, nucleus.x, nucleus.y, nucleus.radius - 4);
    nGrad.addColorStop(0, theme.nucleusInner);
    nGrad.addColorStop(1, theme.nucleusOuter);

    if (isNucleusActive || (theme.glowEnabled && theme.glowColor && theme.glowBlur)) {
      this.ctx.shadowColor = isNucleusActive ? '#38bdf8' : (theme.glowColor || '#a855f7');
      this.ctx.shadowBlur = isNucleusActive ? 20 : (theme.glowBlur || 15);
    }

    this.ctx.beginPath();
    this.ctx.arc(nucleus.x, nucleus.y, nucleus.radius - 4, 0, Math.PI * 2);
    this.ctx.fillStyle = nGrad;
    this.ctx.fill();

    // 5. Detailed Chromatin Fibers & Euchromatin/Heterochromatin
    this.ctx.strokeStyle = 'rgba(244, 63, 94, 0.45)';
    this.ctx.lineWidth = 2.5;
    this.ctx.beginPath();
    this.ctx.arc(nucleus.x + 12, nucleus.y - 15, 26, 0.2, Math.PI * 1.2);
    this.ctx.stroke();
    this.ctx.beginPath();
    this.ctx.arc(nucleus.x - 15, nucleus.y + 12, 32, Math.PI * 0.3, Math.PI * 1.5);
    this.ctx.stroke();

    // 6. Nuclear Pores (Complex barrel structures crossing outer and inner membranes) - Only visible at adequate zoom / magnification
    if (state.zoom >= 1.5) {
      for (const pore of this.cellSimulation.nuclearPores) {
        const isTransporting = pore.state === 'transporting';
        this.ctx.beginPath();
        this.ctx.arc(pore.x, pore.y, isTransporting ? 5.5 : 4.0, 0, Math.PI * 2);
        this.ctx.fillStyle = '#0f172a';
        if (isTransporting) {
          this.ctx.shadowColor = '#38bdf8';
          this.ctx.shadowBlur = 12;
        }
        this.ctx.fill();
        this.ctx.lineWidth = isTransporting ? 2.2 : 1.5;
        this.ctx.strokeStyle = isTransporting ? '#38bdf8' : '#c084fc';
        this.ctx.stroke();
        this.ctx.shadowBlur = 0;
      }

      // Render active mRNA particles in nucleus and exporting through pores
      for (const mrna of this.cellSimulation.mrnaParticles) {
        this.ctx.beginPath();
        this.ctx.arc(mrna.x, mrna.y, 3.5, 0, Math.PI * 2);
        this.ctx.fillStyle = `rgba(56, 189, 248, ${mrna.alpha})`;
        this.ctx.shadowColor = '#38bdf8';
        this.ctx.shadowBlur = mrna.stage === 'exporting' ? 15 : 8;
        this.ctx.fill();
        this.ctx.lineWidth = 1.5;
        this.ctx.strokeStyle = `rgba(255, 255, 255, ${mrna.alpha})`;
        this.ctx.stroke();
        this.ctx.shadowBlur = 0;
      }
    }
    this.ctx.shadowBlur = 0;

    // 7. Nucleolus
    const isNucleolusActive = activeOrgId === 'nucleolus';
    this.ctx.beginPath();
    this.ctx.arc(nucleus.nucleolusX, nucleus.nucleolusY, nucleus.nucleolusRadius, 0, Math.PI * 2);
    this.ctx.fillStyle = theme.nucleolusColor;
    if (isNucleolusActive) {
      this.ctx.shadowColor = '#38bdf8';
      this.ctx.shadowBlur = 15;
    }
    this.ctx.fill();
    this.ctx.lineWidth = 1.5;
    this.ctx.strokeStyle = isNucleolusActive ? '#38bdf8' : 'rgba(255, 255, 255, 0.25)';
    this.ctx.stroke();

    this.ctx.shadowBlur = 0;
    this.ctx.filter = 'none';

    // Render active process object & animations based on step index
    if (secretoryProcess && secretoryProcess.currentStepIndex < secretoryProcess.steps.length) {
      const stepIdx = secretoryProcess.currentStepIndex;
      const step = secretoryProcess.steps[stepIdx];
      const progress = Math.min(1, secretoryProcess.elapsedInStep / step.durationSeconds);

      if (stepIdx === 0) {
        // Step 0: Transcription & Nuclear Pore Passage
        const dnaCenterX = this.cellSimulation.nucleus.x - 20;
        const dnaCenterY = this.cellSimulation.nucleus.y - 15;
        const poreAngle = -Math.PI / 4;
        const poreX = this.cellSimulation.nucleus.x + Math.cos(poreAngle) * this.cellSimulation.nucleus.radius;
        const poreY = this.cellSimulation.nucleus.y + Math.sin(poreAngle) * this.cellSimulation.nucleus.radius;
        const cytoplasmTargetX = poreX + 55;
        const cytoplasmTargetY = poreY - 45;

        this.ctx.save();
        
        this.ctx.strokeStyle = '#f43f5e';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        for (let i = -30; i <= 30; i += 3) {
          const px = dnaCenterX + i;
          const py1 = dnaCenterY + Math.sin(i * 0.15 + this.time * 2) * 8;
          if (i === -30) this.ctx.moveTo(px, py1);
          else this.ctx.lineTo(px, py1);
        }
        this.ctx.stroke();

        this.ctx.fillStyle = '#f43f5e';
        this.ctx.font = 'bold 10px sans-serif';
        this.ctx.fillText('DNA (Ген)', dnaCenterX - 35, dnaCenterY - 16);

        let mrnaX = dnaCenterX;
        let mrnaY = dnaCenterY;
        let statusLabel = 'Синтез мРНК на матрице ДНК';

        if (progress < 0.3) {
          const pA = progress / 0.3;
          mrnaX = dnaCenterX + pA * 10;
          mrnaY = dnaCenterY - pA * 8;
          statusLabel = 'Транскрипция: DNA → mRNA';
        } else if (progress < 0.65) {
          const pB = (progress - 0.3) / 0.35;
          const innerPoreX = this.cellSimulation.nucleus.x + Math.cos(poreAngle) * (this.cellSimulation.nucleus.radius - 8);
          const innerPoreY = this.cellSimulation.nucleus.y + Math.sin(poreAngle) * (this.cellSimulation.nucleus.radius - 8);
          mrnaX = (dnaCenterX + 10) + (innerPoreX - (dnaCenterX + 10)) * pB;
          mrnaY = (dnaCenterY - 8) + (innerPoreY - (dnaCenterY - 8)) * pB;
          statusLabel = 'Движение мРНК к ядерной поре';
        } else if (progress < 0.85) {
          const pC = (progress - 0.65) / 0.2;
          const innerPoreX = this.cellSimulation.nucleus.x + Math.cos(poreAngle) * (this.cellSimulation.nucleus.radius - 8);
          const innerPoreY = this.cellSimulation.nucleus.y + Math.sin(poreAngle) * (this.cellSimulation.nucleus.radius - 8);
          const outerPoreX = this.cellSimulation.nucleus.x + Math.cos(poreAngle) * (this.cellSimulation.nucleus.radius + 8);
          const outerPoreY = this.cellSimulation.nucleus.y + Math.sin(poreAngle) * (this.cellSimulation.nucleus.radius + 8);
          mrnaX = innerPoreX + (outerPoreX - innerPoreX) * pC;
          mrnaY = innerPoreY + (outerPoreY - innerPoreY) * pC;
          statusLabel = 'Прохождение через ядерную пору (Ядро → Цитоплазма)';
        } else {
          const pD = (progress - 0.85) / 0.15;
          const outerPoreX = this.cellSimulation.nucleus.x + Math.cos(poreAngle) * (this.cellSimulation.nucleus.radius + 8);
          const outerPoreY = this.cellSimulation.nucleus.y + Math.sin(poreAngle) * (this.cellSimulation.nucleus.radius + 8);
          mrnaX = outerPoreX + (cytoplasmTargetX - outerPoreX) * pD;
          mrnaY = outerPoreY + (cytoplasmTargetY - outerPoreY) * pD;
          statusLabel = 'мРНК вышла в цитоплазму';
        }

        this.ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
        this.ctx.lineWidth = 1.5;
        this.ctx.setLineDash([3, 3]);
        this.ctx.beginPath();
        this.ctx.moveTo(dnaCenterX, dnaCenterY);
        this.ctx.lineTo(poreX, poreY);
        this.ctx.lineTo(cytoplasmTargetX, cytoplasmTargetY);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        this.ctx.beginPath();
        this.ctx.arc(mrnaX, mrnaY, 7, 0, Math.PI * 2);
        this.ctx.fillStyle = '#38bdf8';
        this.ctx.shadowColor = '#38bdf8';
        this.ctx.shadowBlur = 18;
        this.ctx.fill();
        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.stroke();
        this.ctx.shadowBlur = 0;

        this.ctx.fillStyle = '#38bdf8';
        this.ctx.font = 'bold 11px sans-serif';
        this.ctx.fillText(`▶ ${statusLabel}`, mrnaX + 12, mrnaY - 4);

        if (progress >= 0.6 && progress <= 0.9) {
          this.ctx.beginPath();
          this.ctx.arc(poreX, poreY, 12, 0, Math.PI * 2);
          this.ctx.strokeStyle = '#38bdf8';
          this.ctx.lineWidth = 2.5;
          this.ctx.shadowColor = '#38bdf8';
          this.ctx.shadowBlur = 20;
          this.ctx.stroke();
          this.ctx.shadowBlur = 0;
        }

        this.ctx.restore();

      } else if (stepIdx === 1) {
        // Step 1: Ribosome translation & polypeptide entry into RER lumen (No teleportation)
        const riboX = this.cellSimulation.x - 60;
        const riboY = this.cellSimulation.y - 60;
        const lumenX = riboX + 15;
        const lumenY = riboY + 12;

        this.ctx.save();

        // Draw Ribosome on RER surface
        this.ctx.beginPath();
        this.ctx.arc(riboX - 4, riboY - 6, 8, 0, Math.PI * 2);
        this.ctx.arc(riboX + 4, riboY + 4, 6, 0, Math.PI * 2);
        this.ctx.fillStyle = '#fef08a';
        this.ctx.shadowColor = '#facc15';
        this.ctx.shadowBlur = 20;
        this.ctx.fill();
        this.ctx.lineWidth = 1.5;
        this.ctx.strokeStyle = '#ca8a04';
        this.ctx.stroke();
        this.ctx.shadowBlur = 0;

        this.ctx.fillStyle = '#fef08a';
        this.ctx.font = 'bold 11px sans-serif';
        this.ctx.fillText('Рибосома на ШЭПС', riboX - 45, riboY - 22);

        // Continuous polypeptide transfer: from ribosome through membrane channel into RER lumen
        const currentEndX = riboX + (lumenX - riboX) * progress;
        const currentEndY = riboY + (lumenY - riboY) * progress;

        this.ctx.strokeStyle = '#ec4899';
        this.ctx.lineWidth = 3.5;
        this.ctx.beginPath();
        this.ctx.moveTo(riboX, riboY);
        this.ctx.lineTo(currentEndX, currentEndY);
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.arc(currentEndX, currentEndY, 4, 0, Math.PI * 2);
        this.ctx.fillStyle = '#ec4899';
        this.ctx.shadowColor = '#ec4899';
        this.ctx.shadowBlur = 12;
        this.ctx.fill();
        this.ctx.shadowBlur = 0;

        this.ctx.fillStyle = '#ec4899';
        this.ctx.font = 'bold 11px sans-serif';
        this.ctx.fillText(`▶ Поступление полипептида в просвет ШЭПС (${Math.round(progress * 100)}%)`, riboX + 15, riboY + 30);

        this.ctx.restore();

      } else if (stepIdx === 2) {
        // Step 2: ER Folding and Quality Control (ERAD)
        const foldX = this.cellSimulation.x - 50;
        const foldY = this.cellSimulation.y - 50;

        this.ctx.save();

        this.ctx.fillStyle = '#84cc16';
        this.ctx.font = 'bold 11px sans-serif';
        this.ctx.fillText('Шероховатая ЭПС (Люмен)', foldX - 50, foldY - 25);

        // Folding stages visualization: progress 0.0 -> 0.6 (nascent/unfolded linear chain -> folding 3D structure), 0.6 -> 1.0 (Quality control: chaperones assist or ERAD degradation if misfolded)
        if (progress < 0.6) {
          // Folding process: linear/flexible chain twisting into a compact globular protein shape
          const fProg = progress / 0.6;
          this.ctx.strokeStyle = '#38bdf8';
          this.ctx.lineWidth = 3;
          this.ctx.beginPath();
          // Draw looping folded backbone
          let lx = foldX - 20;
          let ly = foldY;
          this.ctx.moveTo(lx, ly);
          for (let s = 1; s <= 8; s++) {
            const angle = s * 1.2 + fProg * Math.PI * 2;
            lx += Math.cos(angle) * (12 * (1 - fProg * 0.5));
            ly += Math.sin(angle) * (8 * (1 - fProg * 0.5));
            this.ctx.lineTo(lx, ly);
          }
          this.ctx.stroke();

          this.ctx.fillStyle = '#38bdf8';
          this.ctx.font = 'bold 11px sans-serif';
          this.ctx.fillText(`▶ Фолдинг белка (Сворачивание цепи): ${Math.round(fProg * 100)}%`, foldX - 40, foldY + 30);
        } else {
          // Quality Control / Chaperones & ERAD state
          const qProg = (progress - 0.6) / 0.4;
          
          // Draw folded functional protein
          this.ctx.beginPath();
          this.ctx.arc(foldX, foldY, 12, 0, Math.PI * 2);
          this.ctx.fillStyle = '#38bdf8';
          this.ctx.shadowColor = '#38bdf8';
          this.ctx.shadowBlur = 15;
          this.ctx.fill();
          this.ctx.lineWidth = 2;
          this.ctx.strokeStyle = '#ffffff';
          this.ctx.stroke();
          this.ctx.shadowBlur = 0;

          // Chaperone assistance indicator
          this.ctx.beginPath();
          this.ctx.arc(foldX - 16, foldY - 12, 6, 0, Math.PI * 2);
          this.ctx.fillStyle = '#facc15';
          this.ctx.fill();
          this.ctx.fillStyle = '#1e293b';
          this.ctx.font = '9px sans-serif';
          this.ctx.fillText('Шаперон', foldX - 35, foldY - 22);

          this.ctx.fillStyle = '#4ade80';
          this.ctx.font = 'bold 11px sans-serif';
          this.ctx.fillText(`✓ Контроль качества пройден: Свернутый белок готов`, foldX - 60, foldY + 30);
        }

        this.ctx.restore();

      } else if (stepIdx === 3) {
        // Step 3: RER Vesicle Budding (COPII vesicle forming from ER membrane and pinching off without teleportation)
        const erBaseX = this.cellSimulation.x - 40;
        const erBaseY = this.cellSimulation.y - 45;
        const budMaxDist = 35;
        
        this.ctx.save();
        this.ctx.fillStyle = '#84cc16';
        this.ctx.font = 'bold 11px sans-serif';
        this.ctx.fillText('Почкование везикулы из ШЭПС (COPII)', erBaseX - 55, erBaseY - 30);

        // Budding stages: progress 0.0 -> 0.4 (membrane bulging out), 0.4 -> 0.8 (neck narrowing), 0.8 -> 1.0 (pinch off and independent vesicle movement)
        let vesX = erBaseX;
        let vesY = erBaseY;
        let budRadius = 4;

        if (progress < 0.4) {
          const bProg = progress / 0.4;
          budRadius = 3 + bProg * 5;
          vesX = erBaseX + bProg * 10;
          vesY = erBaseY - bProg * 5;

          // Draw bulging membrane connection
          this.ctx.beginPath();
          this.ctx.arc(vesX, vesY, budRadius, 0, Math.PI * 2);
          this.ctx.fillStyle = 'rgba(56, 189, 248, 0.85)';
          this.ctx.fill();
          this.ctx.lineWidth = 2;
          this.ctx.strokeStyle = '#0284c7';
          this.ctx.stroke();

          // Neck connection to ER
          this.ctx.beginPath();
          this.ctx.moveTo(erBaseX, erBaseY);
          this.ctx.lineTo(vesX - 3, vesY + 4);
          this.ctx.lineWidth = 3;
          this.ctx.strokeStyle = '#65a30d';
          this.ctx.stroke();

          this.ctx.fillStyle = '#38bdf8';
          this.ctx.font = '10px sans-serif';
          this.ctx.fillText(`1. Выпячивание мембраны ЭПС: ${Math.round(bProg * 100)}%`, erBaseX - 40, erBaseY + 25);
        } else if (progress < 0.8) {
          const nProg = (progress - 0.4) / 0.4;
          budRadius = 8;
          vesX = erBaseX + 10 + nProg * 15;
          vesY = erBaseY - 5 - nProg * 8;

          // COPII coat proteins surrounding bud
          this.ctx.beginPath();
          this.ctx.arc(vesX, vesY, budRadius + 2, 0, Math.PI * 2);
          this.ctx.fillStyle = 'rgba(250, 204, 21, 0.35)';
          this.ctx.fill();

          // Vesicle
          this.ctx.beginPath();
          this.ctx.arc(vesX, vesY, budRadius, 0, Math.PI * 2);
          this.ctx.fillStyle = 'rgba(56, 189, 248, 0.9)';
          this.ctx.fill();
          this.ctx.lineWidth = 2;
          this.ctx.strokeStyle = '#0284c7';
          this.ctx.stroke();

          // Narrowing neck (pinching)
          this.ctx.beginPath();
          this.ctx.moveTo(erBaseX + 5, erBaseY - 2);
          this.ctx.lineTo(vesX - 6, vesY + 6);
          this.ctx.lineWidth = Math.max(0.5, 3 * (1 - nProg));
          this.ctx.strokeStyle = '#65a30d';
          this.ctx.stroke();

          this.ctx.fillStyle = '#facc15';
          this.ctx.font = '10px sans-serif';
          this.ctx.fillText(`2. Сужение и отделение (Покрытие COPII)`, erBaseX - 40, erBaseY + 25);
        } else {
          const sProg = (progress - 0.8) / 0.2;
          budRadius = 8;
          vesX = erBaseX + 25 + sProg * 20;
          vesY = erBaseY - 13 - sProg * 12;

          // Free independent vesicle moving away from RER membrane
          this.ctx.beginPath();
          this.ctx.arc(vesX, vesY, budRadius, 0, Math.PI * 2);
          this.ctx.fillStyle = '#38bdf8';
          this.ctx.shadowColor = '#38bdf8';
          this.ctx.shadowBlur = 15;
          this.ctx.fill();
          this.ctx.lineWidth = 2;
          this.ctx.strokeStyle = '#ffffff';
          this.ctx.stroke();
          this.ctx.shadowBlur = 0;

          this.ctx.fillStyle = '#4ade80';
          this.ctx.font = 'bold 11px sans-serif';
          this.ctx.fillText(`✓ Транспортная везикула полностью отделилась от ЭПС`, erBaseX - 45, erBaseY + 25);
        }

        this.ctx.restore();

      } else if (stepIdx === 4) {
        // Step 4: Cytosolic Transport along Cytoskeleton Filaments (microtubules with motor protein kinesin carrying vesicle towards Golgi)
        const startX = this.cellSimulation.x - 15;
        const startY = this.cellSimulation.y - 70;
        const endX = this.cellSimulation.x + 65;
        const endY = this.cellSimulation.y - 35;

        const curX = startX + (endX - startX) * progress;
        const curY = startY + (endY - startY) * progress;

        this.ctx.save();
        this.ctx.fillStyle = '#38bdf8';
        this.ctx.font = 'bold 11px sans-serif';
        this.ctx.fillText('Цитоскелет: Направленный транспорт везикулы (Кинезин)', startX - 50, startY - 30);

        // Draw microtubule track
        this.ctx.strokeStyle = 'rgba(96, 165, 250, 0.6)';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(startX - 15, startY + 10);
        this.ctx.quadraticCurveTo(this.cellSimulation.x + 20, this.cellSimulation.y - 60, endX + 15, endY + 10);
        this.ctx.stroke();

        // Draw motor protein (kinesin feet on microtubule)
        this.ctx.fillStyle = '#facc15';
        this.ctx.beginPath();
        this.ctx.arc(curX - 4, curY + 6, 4, 0, Math.PI * 2);
        this.ctx.arc(curX + 4, curY + 6, 4, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = '#1e293b';
        this.ctx.font = '9px sans-serif';
        this.ctx.fillText('Кинезин', curX - 16, curY + 22);

        // Vesicle being transported
        this.ctx.beginPath();
        this.ctx.arc(curX, curY, 9, 0, Math.PI * 2);
        this.ctx.fillStyle = '#38bdf8';
        this.ctx.shadowColor = '#38bdf8';
        this.ctx.shadowBlur = 18;
        this.ctx.fill();
        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.stroke();
        this.ctx.shadowBlur = 0;

        this.ctx.fillStyle = '#38bdf8';
        this.ctx.font = 'bold 11px sans-serif';
        this.ctx.fillText(`▶ Транспорт к Гольджи: ${Math.round(progress * 100)}%`, curX + 14, curY - 4);

        this.ctx.restore();

      } else if (stepIdx === 5) {
        // Step 5: Golgi Apparatus Processing & Sorting in TGN (Trans-Golgi Network)
        const golgiStartX = this.cellSimulation.x + 65;
        const golgiStartY = this.cellSimulation.y - 35;
        const cisX = this.cellSimulation.x + 70;
        const cisY = this.cellSimulation.y - 30;
        const medialX = this.cellSimulation.x + 80;
        const medialY = this.cellSimulation.y - 20;
        const transX = this.cellSimulation.x + 90;
        const transY = this.cellSimulation.y - 10;
        const tgnX = this.cellSimulation.x + 105;
        const tgnY = this.cellSimulation.y;

        this.ctx.save();
        this.ctx.fillStyle = '#f97316';
        this.ctx.font = 'bold 11px sans-serif';
        this.ctx.fillText('Аппарат Гольджи: TGN и Сортировка груза (Разные маршруты)', cisX - 50, cisY - 35);

        let curX = cisX;
        let curY = cisY;
        let stageName = 'Транзит через цис/медиальные цистерны';
        let cargoColor = '#38bdf8';

        if (progress < 0.25) {
          const p = progress / 0.25;
          curX = golgiStartX + (cisX - golgiStartX) * p;
          curY = golgiStartY + (cisY - golgiStartY) * p;
          stageName = 'Слияние с цис-лицом Гольджи';
          cargoColor = '#38bdf8';
        } else if (progress < 0.5) {
          const p = (progress - 0.25) / 0.25;
          curX = cisX + (medialX - cisX) * p;
          curY = cisY + (medialY - cisY) * p;
          stageName = 'Медиальные цистерны: Гликозилирование';
          cargoColor = '#fb923c';
        } else if (progress < 0.75) {
          const p = (progress - 0.5) / 0.25;
          curX = medialX + (transX - medialX) * p;
          curY = medialY + (transY - medialY) * p;
          stageName = 'Транс-цистерны (trans-Golgi)';
          cargoColor = '#facc15';
        } else {
          const p = (progress - 0.75) / 0.25;
          curX = transX + (tgnX - transX) * p;
          curY = transY + (tgnY - transY) * p;
          stageName = 'TGN: Сортировка по адресам назначения';
          cargoColor = '#4ade80';
        }

        // Draw Golgi stack highlight
        this.ctx.strokeStyle = '#38bdf8';
        this.ctx.lineWidth = 2.5;
        this.ctx.beginPath();
        this.ctx.ellipse(curX, curY, 22, 6, 0.3, 0, Math.PI * 2);
        this.ctx.stroke();

        // Cargo inside Golgi / TGN sorting branching visualization at the end
        if (progress >= 0.75) {
          // Multiple destination branches visualization (extensible architecture)
          // 1. Secretory pathway (towards plasma membrane)
          this.ctx.beginPath();
          this.ctx.arc(curX + 15 * (progress - 0.75) * 4, curY - 10 * (progress - 0.75) * 4, 5, 0, Math.PI * 2);
          this.ctx.fillStyle = '#38bdf8'; // Secretory route
          this.ctx.fill();
          this.ctx.stroke();

          // 2. Lysosomal / Endosomal route (branching inwards)
          this.ctx.beginPath();
          this.ctx.arc(curX - 10 * (progress - 0.75) * 4, curY + 12 * (progress - 0.75) * 4, 4.5, 0, Math.PI * 2);
          this.ctx.fillStyle = '#a855f7'; // Lysosomal route
          this.ctx.fill();
          this.ctx.stroke();

          // 3. Plasma membrane integral proteins route
          this.ctx.beginPath();
          this.ctx.arc(curX + 5 * (progress - 0.75) * 4, curY + 15 * (progress - 0.75) * 4, 4, 0, Math.PI * 2);
          this.ctx.fillStyle = '#eab308'; // Membrane route
          this.ctx.fill();
          this.ctx.stroke();

          this.ctx.fillStyle = '#4ade80';
          this.ctx.font = '10px sans-serif';
          this.ctx.fillText('Сортировка: Секреция | Лизосомы | Мембрана', curX - 60, curY + 32);
        } else {
          this.ctx.beginPath();
          this.ctx.arc(curX, curY, 8, 0, Math.PI * 2);
          this.ctx.fillStyle = cargoColor;
          this.ctx.shadowColor = cargoColor;
          this.ctx.shadowBlur = 18;
          this.ctx.fill();
          this.ctx.lineWidth = 2;
          this.ctx.strokeStyle = '#ffffff';
          this.ctx.stroke();
          this.ctx.shadowBlur = 0;
        }

        this.ctx.fillStyle = cargoColor;
        this.ctx.font = 'bold 11px sans-serif';
        this.ctx.fillText(`▶ ${stageName} (${Math.round(progress * 100)}%)`, curX + 16, curY - 4);

        this.ctx.restore();

      } else if (stepIdx === 6) {
        // Step 6: Exocytosis at Plasma Membrane (vesicle approaches membrane, docks, fuses, and releases cargo outside)
        const tgnX = this.cellSimulation.x + 105;
        const tgnY = this.cellSimulation.y;
        
        // Find membrane point on the right (angle ~0)
        const membX = this.cellSimulation.x + this.cellSimulation.radius - 8;
        const membY = this.cellSimulation.y + 15;

        this.ctx.save();
        this.ctx.fillStyle = '#38bdf8';
        this.ctx.font = 'bold 11px sans-serif';
        this.ctx.fillText('Плазматическая мембрана: Экзоцитоз', membX - 100, membY - 45);

        let curX = tgnX;
        let curY = tgnY;
        let exocStatus = 'Транспорт из TGN к плазмолемме';

        if (progress < 0.4) {
          const p = progress / 0.4;
          curX = tgnX + (membX - 35 - tgnX) * p;
          curY = tgnY + (membY - tgnY) * p;
          exocStatus = 'Доставка секреторной везикулы к мембране';

          this.ctx.beginPath();
          this.ctx.arc(curX, curY, 9, 0, Math.PI * 2);
          this.ctx.fillStyle = '#38bdf8';
          this.ctx.shadowColor = '#38bdf8';
          this.ctx.shadowBlur = 16;
          this.ctx.fill();
          this.ctx.lineWidth = 2;
          this.ctx.strokeStyle = '#ffffff';
          this.ctx.stroke();
          this.ctx.shadowBlur = 0;
        } else if (progress < 0.7) {
          const p = (progress - 0.4) / 0.3;
          curX = membX - 35 + p * 25;
          curY = membY;
          exocStatus = 'Сближение и докинг (SNARE-комплекс)';

          this.ctx.beginPath();
          this.ctx.arc(curX, curY, 9, 0, Math.PI * 2);
          this.ctx.fillStyle = '#38bdf8';
          this.ctx.shadowColor = '#38bdf8';
          this.ctx.shadowBlur = 18;
          this.ctx.fill();
          this.ctx.lineWidth = 2;
          this.ctx.strokeStyle = '#ffffff';
          this.ctx.stroke();
          this.ctx.shadowBlur = 0;

          // SNARE docking whiskers
          this.ctx.strokeStyle = '#facc15';
          this.ctx.lineWidth = 2;
          this.ctx.beginPath();
          this.ctx.moveTo(curX + 9, curY);
          this.ctx.lineTo(membX - 2, membY);
          this.ctx.stroke();
        } else {
          const p = (progress - 0.7) / 0.3;
          curX = membX;
          curY = membY;
          exocStatus = 'СЛИЯНИЕ И ВЫБРОС ГРУЗА НАРУЖУ (Экзоцитоз)';

          // Vesicle fusing into membrane opening up
          this.ctx.beginPath();
          this.ctx.arc(curX - 2, curY, 9, -Math.PI / 2, Math.PI / 2, false);
          this.ctx.lineWidth = 2.5;
          this.ctx.strokeStyle = '#38bdf8';
          this.ctx.stroke();

          // Released cargo outside cell
          const outX = membX + 15 + p * 30;
          const outY = membY + (p - 0.5) * 15;

          this.ctx.beginPath();
          this.ctx.arc(outX, outY, 7, 0, Math.PI * 2);
          this.ctx.fillStyle = '#4ade80';
          this.ctx.shadowColor = '#4ade80';
          this.ctx.shadowBlur = 20;
          this.ctx.fill();
          this.ctx.lineWidth = 2;
          this.ctx.strokeStyle = '#ffffff';
          this.ctx.stroke();
          this.ctx.shadowBlur = 0;

          this.ctx.fillStyle = '#4ade80';
          this.ctx.font = 'bold 11px sans-serif';
          this.ctx.fillText('Секретируемый белок во внеклеточной среде', outX + 12, outY - 4);
        }

        this.ctx.fillStyle = '#38bdf8';
        this.ctx.font = 'bold 11px sans-serif';
        this.ctx.fillText(`▶ ${exocStatus}`, curX - 40, curY + 25);

        this.ctx.restore();
      }
    }
  }

  private drawMicroscopeLensOverlay(width: number, height: number, zoom: number) {
    this.ctx.save();

    const gradient = this.ctx.createRadialGradient(
      width / 2, height / 2, Math.min(width, height) * 0.35,
      width / 2, height / 2, Math.min(width, height) * 0.55
    );
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.85)');

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, width, height);

    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(width / 2 - 15, height / 2);
    this.ctx.lineTo(width / 2 + 15, height / 2);
    this.ctx.moveTo(width / 2, height / 2 - 15);
    this.ctx.lineTo(width / 2, height / 2 + 15);
    this.ctx.stroke();

    this.ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    this.ctx.fillRect(15, 15, 180, 44);
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    this.ctx.strokeRect(15, 15, 180, 44);

    this.ctx.fillStyle = '#38bdf8';
    this.ctx.font = '12px monospace';
    this.ctx.fillText(`Увеличение: ${(zoom * 40).toFixed(0)}x (Уровень ${zoom < 1.8 ? 1 : zoom < 3.0 ? 2 : 3})`, 22, 30);
    this.ctx.fillStyle = '#94a3b8';
    this.ctx.font = '11px sans-serif';
    this.ctx.fillText('Причинно-следственная модель клетки', 22, 48);

    this.ctx.restore();
  }
}
