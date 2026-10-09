
import { OrganelleInfo } from '../state/microscopeState';
import { BIOLOGICAL_DATABASE } from './biology/biologicalData';
import { SecretoryPathwayProcess } from './processes/secretoryPathway';

export interface NuclearPore {
  id: string;
  x: number;
  y: number;
  angle: number;
  state: 'closed' | 'transporting' | 'open';
  radius: number;
}

export interface CytoplasmicParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  phaseOffset: number;
}

export interface Mitochondrion {
  x: number;
  y: number;
  vx: number;
  vy: number;
  length: number;
  width: number;
  angle: number;
  pulsePhase: number;
}

export interface MRNAParticle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  stage: 'transcribing' | 'moving_to_pore' | 'exporting' | 'cytoplasm' | 'targeting_ribosome' | 'translating';
  targetPoreId?: string;
  targetRibosomeIndex?: number;
  progress: number;
  alpha: number;
  polypeptideLength?: number;
}

export interface Ribosome {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface CytoplasmicParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  phaseOffset: number;
}

export interface Vesicle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  cargoType?: 'protein' | 'lipid' | 'waste';
  stage?: 'er_exit' | 'transport_to_golgi' | 'docking' | 'cis' | 'medial' | 'trans' | 'tgn' | 'secretory_transport' | 'docking_membrane' | 'fusion' | 'exocytosis';
  progress?: number;
  targetGolgiIndex?: number;
  alpha?: number;
}

export interface GolgiCisternae {
  x: number;
  y: number;
  angle: number;
  width: number;
}

export interface Lysosome {
  x: number;
  y: number;
  radius: number;
}

export interface RoughERNode {
  x: number;
  y: number;
  angle: number;
  length: number;
}

export interface ProteinCargo {
  id: string;
  x: number;
  y: number;
  stage: 'unfolded' | 'folding' | 'quality_control' | 'folded' | 'er_exit';
  progress: number;
  assignedRoughERIndex: number;
  alpha: number;
}

export interface SmoothERNode {
  x: number;
  y: number;
  radius: number;
}

export class CellSimulation {
  private width: number = 800;
  private height: number = 600;
  
  public radius: number = 220;
  public x: number = 400;
  public y: number = 300;
  private time: number = 0;

  public nucleus = {
    x: 400,
    y: 300,
    radius: 80,
    nucleolusX: 385,
    nucleolusY: 290,
    nucleolusRadius: 25
  };

  public nuclearPores: NuclearPore[] = [];
  public mrnaParticles: MRNAParticle[] = [];

  public mitochondria: Mitochondrion[] = [];
  public ribosomes: Ribosome[] = [];
  public roughER: RoughERNode[] = [];
  public smoothER: SmoothERNode[] = [];
  public golgiApparatus: GolgiCisternae[] = [];
  public vesicles: Vesicle[] = [];
  public proteinCargo: ProteinCargo[] = [];
  public lysosomes: Lysosome[] = [];
  public cytoplasmicParticles: CytoplasmicParticle[] = [];

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.x = width / 2;
    this.y = height / 2;
    this.nucleus.x = this.x;
    this.nucleus.y = this.y;
    this.nucleus.nucleolusX = this.x - 15;
    this.nucleus.nucleolusY = this.y - 15;

    this.initOrganelles();
  }

  private initOrganelles() {
    // Initialize nuclear pores attached to nuclear envelope
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const px = this.nucleus.x + Math.cos(angle) * this.nucleus.radius;
      const py = this.nucleus.y + Math.sin(angle) * this.nucleus.radius;
      this.nuclearPores.push({
        id: `pore_${i}`,
        x: px,
        y: py,
        angle: angle,
        state: i % 3 === 0 ? 'transporting' : 'closed',
        radius: 4.5
      });
    }

    // Mitochondria
    for (let i = 0; i < 14; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 110 + Math.random() * 80;
      this.mitochondria.push({
        x: this.x + Math.cos(angle) * dist,
        y: this.y + Math.sin(angle) * dist,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        length: 26 + Math.random() * 10,
        width: 9 + Math.random() * 3,
        angle: Math.random() * Math.PI,
        pulsePhase: Math.random() * Math.PI * 2
      });
    }

    // Free ribosomes
    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 100 + Math.random() * 110;
      this.ribosomes.push({
        x: this.x + Math.cos(angle) * dist,
        y: this.y + Math.sin(angle) * dist,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15
      });
    }

    // Rough ER (cisternae near nucleus)
    for (let i = 0; i < 5; i++) {
      const angle = -0.5 + i * 0.35;
      const dist = 92;
      this.roughER.push({
        x: this.x + Math.cos(angle) * dist,
        y: this.y + Math.sin(angle) * dist,
        angle: angle + Math.PI / 2,
        length: 35
      });
    }

    // Smooth ER (tubular network on opposite side)
    for (let i = 0; i < 6; i++) {
      const angle = Math.PI + i * 0.3;
      const dist = 120 + (i % 2) * 15;
      this.smoothER.push({
        x: this.x + Math.cos(angle) * dist,
        y: this.y + Math.sin(angle) * dist,
        radius: 12
      });
    }

    // Golgi apparatus (stacked cisternae)
    for (let i = 0; i < 4; i++) {
      const gAngle = 2.2 + i * 0.08;
      const gDist = 135;
      this.golgiApparatus.push({
        x: this.x + Math.cos(gAngle) * (gDist + i * 6),
        y: this.y + Math.sin(gAngle) * (gDist + i * 6),
        angle: gAngle + Math.PI / 2,
        width: 45 - i * 4
      });
    }

    // Transport vesicles
    for (let i = 0; i < 6; i++) {
      const vAngle = Math.random() * Math.PI * 2;
      const vDist = 110 + Math.random() * 60;
      this.vesicles.push({
        x: this.x + Math.cos(vAngle) * vDist,
        y: this.y + Math.sin(vAngle) * vDist,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        radius: 4 + Math.random() * 2,
        cargoType: i % 2 === 0 ? 'protein' : 'lipid'
      });
    }

    // Lysosomes
    for (let i = 0; i < 4; i++) {
      const lAngle = Math.random() * Math.PI * 2;
      const lDist = 140 + Math.random() * 50;
      this.lysosomes.push({
        x: this.x + Math.cos(lAngle) * lDist,
        y: this.y + Math.sin(lAngle) * lDist,
        radius: 6 + Math.random() * 3
      });
    }

    // Cytoplasmic particles & micro-granules (diverse individual movement)
    for (let i = 0; i < 70; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 50 + Math.random() * 160;
      this.cytoplasmicParticles.push({
        x: this.x + Math.cos(angle) * dist,
        y: this.y + Math.sin(angle) * dist,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: 1.0 + Math.random() * 2.2,
        alpha: 0.15 + Math.random() * 0.35,
        phaseOffset: Math.random() * Math.PI * 2
      });
    }
  }

  public update(dt: number, secretoryProcess?: SecretoryPathwayProcess) {
    this.time += dt;

    // Update nuclear pore positions if nucleus moves
    for (const pore of this.nuclearPores) {
      pore.x = this.nucleus.x + Math.cos(pore.angle) * this.nucleus.radius;
      pore.y = this.nucleus.y + Math.sin(pore.angle) * this.nucleus.radius;
    }

    // Initial protein cargo inside RER lumen for continuous simulation
    if (this.proteinCargo.length < 3 && this.roughER.length > 0) {
      const rerIdx = Math.floor(Math.random() * this.roughER.length);
      const rer = this.roughER[rerIdx];
      this.proteinCargo.push({
        id: `cargo_${Date.now()}_${Math.random()}`,
        x: rer.x + (Math.random() - 0.5) * 10,
        y: rer.y + (Math.random() - 0.5) * 10,
        stage: 'unfolded',
        progress: 0,
        assignedRoughERIndex: rerIdx,
        alpha: 0.9
      });
    }

    // Update protein cargo lifecycle (folding -> quality control -> folded -> er_exit -> budding vesicle)
    for (let i = this.proteinCargo.length - 1; i >= 0; i--) {
      const cargo = this.proteinCargo[i];
      cargo.progress += dt * 0.4;

      if (cargo.stage === 'unfolded') {
        if (cargo.progress >= 2.0) {
          cargo.stage = 'folding';
          cargo.progress = 0;
        }
      } else if (cargo.stage === 'folding') {
        if (cargo.progress >= 2.5) {
          cargo.stage = 'quality_control';
          cargo.progress = 0;
        }
      } else if (cargo.stage === 'quality_control') {
        if (cargo.progress >= 2.0) {
          cargo.stage = 'folded';
          cargo.progress = 0;
        }
      } else if (cargo.stage === 'folded') {
        if (cargo.progress >= 2.0) {
          cargo.stage = 'er_exit';
          cargo.progress = 0;
        }
      } else if (cargo.stage === 'er_exit') {
        if (cargo.progress >= 2.5) {
          // Budding into transport vesicle with route stage 'er_exit'
          const rer = this.roughER[cargo.assignedRoughERIndex] || this.roughER[0];
          this.vesicles.push({
            x: rer.x + 15,
            y: rer.y - 10,
            vx: 0,
            vy: 0,
            radius: 6,
            cargoType: 'protein',
            stage: 'er_exit',
            progress: 0,
            targetGolgiIndex: 0
          });
          this.proteinCargo.splice(i, 1);
        }
      }
    }
    if (Math.random() < 0.05 && this.mrnaParticles.length < 15) {
      const dnaOriginX = this.nucleus.x - 15 + (Math.random() - 0.5) * 20;
      const dnaOriginY = this.nucleus.y - 15 + (Math.random() - 0.5) * 20;
      // Pick a random nuclear pore as target
      const targetPore = this.nuclearPores[Math.floor(Math.random() * this.nuclearPores.length)];
      this.mrnaParticles.push({
        id: `mrna_${Date.now()}_${Math.random()}`,
        x: dnaOriginX,
        y: dnaOriginY,
        vx: 0,
        vy: 0,
        stage: 'transcribing',
        targetPoreId: targetPore.id,
        progress: 0,
        alpha: 0.9
      });
    }

    // Update mRNA particles lifecycle
    for (let i = this.mrnaParticles.length - 1; i >= 0; i--) {
      const mrna = this.mrnaParticles[i];
      const targetPore = this.nuclearPores.find(p => p.id === mrna.targetPoreId) || this.nuclearPores[0];

      if (mrna.stage === 'transcribing') {
        mrna.progress += dt * 0.8;
        if (mrna.progress >= 1.0) {
          mrna.stage = 'moving_to_pore';
          mrna.progress = 0;
        }
      } else if (mrna.stage === 'moving_to_pore') {
        const dx = targetPore.x - mrna.x;
        const dy = targetPore.y - mrna.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 6) {
          mrna.x += (dx / dist) * 1.2;
          mrna.y += (dy / dist) * 1.2;
        } else {
          mrna.stage = 'exporting';
          mrna.progress = 0;
          targetPore.state = 'transporting';
        }
      } else if (mrna.stage === 'exporting') {
        mrna.progress += dt * 1.0;
        // Move slightly outward along pore angle into cytoplasm
        const outDist = mrna.progress * 25;
        mrna.x = targetPore.x + Math.cos(targetPore.angle) * outDist;
        mrna.y = targetPore.y + Math.sin(targetPore.angle) * outDist;
        if (mrna.progress >= 1.0) {
          mrna.stage = 'cytoplasm';
          mrna.vx = Math.cos(targetPore.angle) * (0.3 + Math.random() * 0.3);
          mrna.vy = Math.sin(targetPore.angle) * (0.3 + Math.random() * 0.3);
          targetPore.state = 'closed';
        }
      } else if (mrna.stage === 'cytoplasm') {
        // If roughER or ribosomes exist, target a specific ribosome
        if (this.ribosomes.length > 0 && mrna.targetRibosomeIndex === undefined) {
          mrna.targetRibosomeIndex = Math.floor(Math.random() * this.ribosomes.length);
          mrna.stage = 'targeting_ribosome';
        } else {
          mrna.x += mrna.vx;
          mrna.y += mrna.vy;
          mrna.alpha -= dt * 0.08;
          const cdx = mrna.x - this.x;
          const cdy = mrna.y - this.y;
          if (mrna.alpha <= 0 || Math.sqrt(cdx * cdx + cdy * cdy) > this.radius - 10) {
            this.mrnaParticles.splice(i, 1);
          }
        }
      } else if (mrna.stage === 'targeting_ribosome') {
        const targetRibo = mrna.targetRibosomeIndex !== undefined ? this.ribosomes[mrna.targetRibosomeIndex] : this.ribosomes[0];
        if (targetRibo) {
          const dx = targetRibo.x - mrna.x;
          const dy = targetRibo.y - mrna.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 5) {
            mrna.x += (dx / dist) * 1.5;
            mrna.y += (dy / dist) * 1.5;
          } else {
            mrna.stage = 'translating';
            mrna.progress = 0;
            mrna.polypeptideLength = 0;
          }
        } else {
          mrna.stage = 'cytoplasm';
        }
      } else if (mrna.stage === 'translating') {
        mrna.progress += dt * 0.5;
        mrna.polypeptideLength = Math.min(25, (mrna.polypeptideLength || 0) + dt * 8);
        const targetRibo = mrna.targetRibosomeIndex !== undefined ? this.ribosomes[mrna.targetRibosomeIndex] : this.ribosomes[0];
        if (targetRibo) {
          mrna.x = targetRibo.x - 8;
          mrna.y = targetRibo.y - 8;
        }
        if (mrna.progress >= 3.0) {
          // Translation completed, fade out or transition into vesicle/RER lumen
          mrna.alpha -= dt * 0.2;
          if (mrna.alpha <= 0) {
            this.mrnaParticles.splice(i, 1);
          }
        }
      }
    }

    if (secretoryProcess && secretoryProcess.state === 'playing') {
      secretoryProcess.elapsedInStep += dt * secretoryProcess.speed;
      const currentStep = secretoryProcess.steps[secretoryProcess.currentStepIndex];
      if (currentStep && secretoryProcess.elapsedInStep >= currentStep.durationSeconds) {
        if (secretoryProcess.currentStepIndex < secretoryProcess.steps.length - 1) {
          secretoryProcess.steps[secretoryProcess.currentStepIndex].completed = true;
          secretoryProcess.currentStepIndex++;
          secretoryProcess.elapsedInStep = 0;
          // Update active context inside manager if needed
        } else {
          secretoryProcess.steps[secretoryProcess.currentStepIndex].completed = true;
          secretoryProcess.state = 'completed';
        }
      }
    }

    for (const mito of this.mitochondria) {
      mito.x += mito.vx;
      mito.y += mito.vy;
      mito.pulsePhase += 0.05;

      const dx = mito.x - this.x;
      const dy = mito.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > this.radius - 25 || dist < this.nucleus.radius + 15) {
        mito.vx *= -1;
        mito.vy *= -1;
      }
    }

    for (const ribo of this.ribosomes) {
      ribo.x += ribo.vx;
      ribo.y += ribo.vy;
      const dx = ribo.x - this.x;
      const dy = ribo.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > this.radius - 15 || dist < this.nucleus.radius + 5) {
        ribo.vx *= -1;
        ribo.vy *= -1;
      }
    }

    for (let i = this.vesicles.length - 1; i >= 0; i--) {
      const ves = this.vesicles[i];
      if (!ves.stage) {
        ves.stage = 'transport_to_golgi';
        ves.progress = 0;
      }

      ves.progress = (ves.progress || 0) + dt * 0.4;
      const targetGolgi = this.golgiApparatus[0] || { x: this.x + 60, y: this.y - 40 };

      if (ves.stage === 'er_exit') {
        if (ves.progress >= 1.5) {
          ves.stage = 'transport_to_golgi';
          ves.progress = 0;
        }
      } else if (ves.stage === 'transport_to_golgi') {
        // Move along cytoskeleton microtubule track towards Golgi cis face
        const startX = this.roughER[0] ? this.roughER[0].x + 15 : this.x - 40;
        const startY = this.roughER[0] ? this.roughER[0].y - 10 : this.y - 45;
        const p = Math.min(1, ves.progress / 3.0);
        
        // Quadratic curve trajectory towards Golgi cis
        const ctrlX = this.x + 20;
        const ctrlY = this.y - 60;
        ves.x = (1 - p) * (1 - p) * startX + 2 * (1 - p) * p * ctrlX + p * p * targetGolgi.x;
        ves.y = (1 - p) * (1 - p) * startY + 2 * (1 - p) * p * ctrlY + p * p * targetGolgi.y;

        if (p >= 1.0) {
          ves.stage = 'cis';
          ves.progress = 0;
        }
      } else if (ves.stage === 'cis') {
        ves.x = targetGolgi.x + (Math.sin(this.time * 2) * 2);
        ves.y = targetGolgi.y + (Math.cos(this.time * 2) * 2);
        if (ves.progress >= 2.0) {
          ves.stage = 'medial';
          ves.progress = 0;
        }
      } else if (ves.stage === 'medial') {
        const medialGolgi = this.golgiApparatus[1] || targetGolgi;
        ves.x = medialGolgi.x;
        ves.y = medialGolgi.y;
        if (ves.progress >= 2.0) {
          ves.stage = 'trans';
          ves.progress = 0;
        }
      } else if (ves.stage === 'trans') {
        const transGolgi = this.golgiApparatus[2] || targetGolgi;
        ves.x = transGolgi.x;
        ves.y = transGolgi.y;
        if (ves.progress >= 2.0) {
          ves.stage = 'tgn';
          ves.progress = 0;
        }
      } else if (ves.stage === 'tgn') {
        const tgnGolgi = this.golgiApparatus[3] || targetGolgi;
        ves.x = tgnGolgi.x + 12;
        ves.y = tgnGolgi.y + 12;
        // Sorting in TGN complete -> bud off into secretory vesicle
        if (ves.progress >= 3.0) {
          ves.stage = 'secretory_transport';
          ves.progress = 0;
        }
      } else if (ves.stage === 'secretory_transport') {
        const tgnGolgi = this.golgiApparatus[3] || targetGolgi;
        const targetMembX = this.x + this.radius - 12;
        const targetMembY = this.y + 15;
        const p = Math.min(1, ves.progress / 3.0);

        ves.x = (1 - p) * tgnGolgi.x + p * targetMembX;
        ves.y = (1 - p) * tgnGolgi.y + p * targetMembY;

        if (p >= 1.0) {
          ves.stage = 'docking_membrane';
          ves.progress = 0;
        }
      } else if (ves.stage === 'docking_membrane') {
        const targetMembX = this.x + this.radius - 12;
        const targetMembY = this.y + 15;
        ves.x = targetMembX;
        ves.y = targetMembY;
        if (ves.progress >= 2.0) {
          ves.stage = 'fusion';
          ves.progress = 0;
        }
      } else if (ves.stage === 'fusion') {
        const targetMembX = this.x + this.radius - 5;
        const targetMembY = this.y + 15;
        ves.x = targetMembX;
        ves.y = targetMembY;
        if (ves.progress >= 2.0) {
          ves.stage = 'exocytosis';
          ves.progress = 0;
        }
      } else if (ves.stage === 'exocytosis') {
        ves.alpha = (ves.alpha ?? 1) - dt * 0.4;
        if ((ves.alpha ?? 1) <= 0) {
          this.vesicles.splice(i, 1);
        }
      }
    }

    for (const p of this.cytoplasmicParticles) {
      p.phaseOffset += 0.03;
      // Perlin-like pseudo-random organic drifting using multi-frequency sine offsets
      p.x += p.vx + Math.sin(p.phaseOffset * 0.7) * 0.15;
      p.y += p.vy + Math.cos(p.phaseOffset * 0.5) * 0.15;

      const dx = p.x - this.x;
      const dy = p.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > this.radius - 12 || dist < this.nucleus.radius + 8) {
        p.vx *= -1;
        p.vy *= -1;
      }
    }
  }

  public getOrganelleAt(px: number, py: number): OrganelleInfo | null {
    // Nucleolus check
    const nudx = px - this.nucleus.nucleolusX;
    const nudy = py - this.nucleus.nucleolusY;
    if (nudx * nudx + nudy * nudy <= this.nucleus.nucleolusRadius * this.nucleus.nucleolusRadius) {
      const bio = BIOLOGICAL_DATABASE['nucleolus'];
      return {
        id: 'nucleolus',
        type: 'nucleus',
        name: bio.name,
        description: bio.function,
        x: this.nucleus.nucleolusX,
        y: this.nucleus.nucleolusY,
        radius: this.nucleus.nucleolusRadius
      };
    }

    // Nuclear Pores check
    for (let i = 0; i < this.nuclearPores.length; i++) {
      const np = this.nuclearPores[i];
      const npdx = px - np.x;
      const npdy = py - np.y;
      if (npdx * npdx + npdy * npdy <= (np.radius + 6) * (np.radius + 6)) {
        const bio = BIOLOGICAL_DATABASE['nucleus'];
        return {
          id: `nuclearPore_${i}`,
          type: 'nucleus',
          name: 'Ядерная пора (Nuclear Pore Complex)',
          description: 'Сложный белковый комплекс в ядерной оболочке, регулирующий двунаправленный транспорт макромолекул (мРНК, белков) между ядром и цитоплазмой.',
          x: np.x,
          y: np.y,
          radius: np.radius + 2
        };
      }
    }
    // Nucleus check
    const ndx = px - this.nucleus.x;
    const ndy = py - this.nucleus.y;
    if (ndx * ndx + ndy * ndy <= this.nucleus.radius * this.nucleus.radius) {
      const bio = BIOLOGICAL_DATABASE['nucleus'];
      return {
        id: 'nucleus',
        type: 'nucleus',
        name: bio.name,
        description: bio.function,
        x: this.nucleus.x,
        y: this.nucleus.y,
        radius: this.nucleus.radius
      };
    }

    // Rough ER check
    for (let i = 0; i < this.roughER.length; i++) {
      const rer = this.roughER[i];
      const rdx = px - rer.x;
      const rdy = py - rer.y;
      if (rdx * rdx + rdy * rdy <= 22 * 22) {
        const bio = BIOLOGICAL_DATABASE['roughER'];
        return {
          id: 'roughER',
          type: 'cytoplasm',
          name: bio.name,
          description: bio.function,
          x: rer.x,
          y: rer.y,
          radius: 18
        };
      }
    }

    // Smooth ER check
    for (let i = 0; i < this.smoothER.length; i++) {
      const ser = this.smoothER[i];
      const sdx = px - ser.x;
      const sdy = py - ser.y;
      if (sdx * sdx + sdy * sdy <= (ser.radius + 4) * (ser.radius + 4)) {
        const bio = BIOLOGICAL_DATABASE['smoothER'];
        return {
          id: 'smoothER',
          type: 'cytoplasm',
          name: bio.name,
          description: bio.function,
          x: ser.x,
          y: ser.y,
          radius: ser.radius
        };
      }
    }

    // Golgi check
    for (let i = 0; i < this.golgiApparatus.length; i++) {
      const g = this.golgiApparatus[i];
      const gdx = px - g.x;
      const gdy = py - g.y;
      if (gdx * gdx + gdy * gdy <= 26 * 26) {
        const bio = BIOLOGICAL_DATABASE['golgi'];
        return {
          id: 'golgi',
          type: 'cytoplasm',
          name: bio.name,
          description: bio.function,
          x: g.x,
          y: g.y,
          radius: 22
        };
      }
    }

    // Mitochondria check
    for (let i = 0; i < this.mitochondria.length; i++) {
      const m = this.mitochondria[i];
      const mdx = px - m.x;
      const mdy = py - m.y;
      if (mdx * mdx + mdy * mdy <= (m.length / 2) * (m.length / 2)) {
        const bio = BIOLOGICAL_DATABASE['mitochondrion'];
        return {
          id: 'mitochondrion',
          type: 'mitochondrion',
          name: bio.name,
          description: bio.function,
          x: m.x,
          y: m.y,
          radius: m.length / 2
        };
      }
    }

    // Lysosomes check
    for (let i = 0; i < this.lysosomes.length; i++) {
      const l = this.lysosomes[i];
      const ldx = px - l.x;
      const ldy = py - l.y;
      if (ldx * ldx + ldy * ldy <= (l.radius + 4) * (l.radius + 4)) {
        const bio = BIOLOGICAL_DATABASE['lysosome'];
        return {
          id: 'lysosome',
          type: 'cytoplasm',
          name: bio.name,
          description: bio.function,
          x: l.x,
          y: l.y,
          radius: l.radius
        };
      }
    }

    // Membrane check
    const cdx = px - this.x;
    const cdy = py - this.y;
    const cDist = Math.sqrt(cdx * cdx + cdy * cdy);
    if (Math.abs(cDist - this.radius) < 20) {
      const bio = BIOLOGICAL_DATABASE['membrane'];
      return {
        id: 'membrane',
        type: 'membrane',
        name: bio.name,
        description: bio.function,
        x: this.x,
        y: this.y,
        radius: this.radius
      };
    }

    if (cDist <= this.radius) {
      const bio = BIOLOGICAL_DATABASE['cytoplasm'];
      return {
        id: 'cytoplasm',
        type: 'cytoplasm',
        name: bio.name,
        description: bio.function,
        x: this.x,
        y: this.y,
        radius: this.radius
      };
    }

    return null;
  }
}
