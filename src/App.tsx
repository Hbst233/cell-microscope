import React, { useRef, useState } from 'react';
import { MicroscopeState, OrganelleInfo } from './state/microscopeState';
import { useMicroscopeLoop } from './rendering/useMicroscopeLoop';
import { CellProcessManager } from './core/processes/secretoryPathway';
import { BIOLOGICAL_DATABASE, BiologicalMetadataDetailed } from './core/biology/biologicalData';

export function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [microscopeState, setMicroscopeState] = useState<MicroscopeState>({
    zoom: 1.5,
    focusZ: 0.0,
    panX: 0,
    panY: 0,
    stainMode: 'normal'
  });

  const [selectedOrganelle, setSelectedOrganelle] = useState<OrganelleInfo | null>(null);
  const [organelleBio, setOrganelleBio] = useState<BiologicalMetadataDetailed | null>(null);
  const [processManager] = useState(() => new CellProcessManager());
  const [processStateVersion, setProcessStateVersion] = useState(0);

  const processRef = useRef(processManager.secretoryPathway);
  processRef.current = processManager.secretoryPathway;

  // Dragging state for pan & touch
  const isDragging = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  // Touch interaction refs for pinch zoom and drag pan
  const touchStartDist = useRef<number | null>(null);
  const initialZoom = useRef(1.5);
  const lastTouchPos = useRef({ x: 0, y: 0 });

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1) {
      isDragging.current = true;
      lastTouchPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2) {
      isDragging.current = false;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchStartDist.current = Math.sqrt(dx * dx + dy * dy);
      initialZoom.current = microscopeState.zoom;
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (e.touches.length === 1 && isDragging.current) {
      const dx = e.touches[0].clientX - lastTouchPos.current.x;
      const dy = e.touches[0].clientY - lastTouchPos.current.y;
      lastTouchPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };

      setMicroscopeState(prev => ({
        ...prev,
        panX: prev.panX + dx,
        panY: prev.panY + dy
      }));
    } else if (e.touches.length === 2 && touchStartDist.current !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const currentDist = Math.sqrt(dx * dx + dy * dy);
      const scale = currentDist / touchStartDist.current;
      const newZoom = Math.min(Math.max(initialZoom.current * scale, 1.0), 4.5);

      setMicroscopeState(prev => ({
        ...prev,
        zoom: newZoom
      }));
    }
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
    touchStartDist.current = null;
  };

  const { simulationRef } = useMicroscopeLoop(canvasRef, microscopeState, processRef);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDragging.current = true;
    lastMousePos.current = { x: e.clientX, y: e.clientY };

    if (!canvasRef.current || !simulationRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const width = canvasRef.current.width;
    const height = canvasRef.current.height;
    
    const worldX = (clickX - width / 2 - microscopeState.panX) / microscopeState.zoom + width / 2;
    const worldY = (clickY - height / 2 - microscopeState.panY) / microscopeState.zoom + height / 2;

    const organelle = simulationRef.current.getOrganelleAt(worldX, worldY);
    setSelectedOrganelle(organelle);

    if (organelle && BIOLOGICAL_DATABASE[organelle.id]) {
      setOrganelleBio(BIOLOGICAL_DATABASE[organelle.id]);
    } else {
      setOrganelleBio(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastMousePos.current.x;
    const dy = e.clientY - lastMousePos.current.y;
    lastMousePos.current = { x: e.clientX, y: e.clientY };

    setMicroscopeState(prev => ({
      ...prev,
      panX: prev.panX + dx,
      panY: prev.panY + dy
    }));
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
    setMicroscopeState(prev => ({
      ...prev,
      zoom: Math.min(Math.max(prev.zoom * zoomFactor, 1.0), 4.5)
    }));
  };

  const handleFocusOrganelle = (orgId: string) => {
    if (!simulationRef.current) return;
    let targetX = 400;
    let targetY = 300;
    let targetZoom = 3.0;

    if (orgId === 'nucleus' || orgId === 'nucleolus') {
      targetX = simulationRef.current.nucleus.x;
      targetY = simulationRef.current.nucleus.y;
      targetZoom = 3.2;
    } else if (orgId === 'roughER') {
      targetX = simulationRef.current.x - 60;
      targetY = simulationRef.current.y - 60;
      targetZoom = 3.2;
    } else if (orgId === 'golgi') {
      targetX = simulationRef.current.x + 60;
      targetY = simulationRef.current.y - 40;
      targetZoom = 3.2;
    } else if (orgId === 'mitochondrion') {
      targetX = simulationRef.current.x - 100;
      targetY = simulationRef.current.y + 80;
      targetZoom = 3.5;
    } else if (orgId === 'membrane') {
      targetX = simulationRef.current.x + 150;
      targetY = simulationRef.current.y;
      targetZoom = 3.5;
    }

    const w = canvasRef.current?.width || 800;
    const h = canvasRef.current?.height || 600;

    setMicroscopeState(prev => ({
      ...prev,
      zoom: targetZoom,
      panX: -(targetX - w / 2) * targetZoom + (w / 2 - targetX),
      panY: -(targetY - h / 2) * targetZoom + (h / 2 - targetY)
    }));

    if (BIOLOGICAL_DATABASE[orgId]) {
      setOrganelleBio(BIOLOGICAL_DATABASE[orgId]);
      setSelectedOrganelle({
        id: orgId,
        type: 'cytoplasm',
        name: BIOLOGICAL_DATABASE[orgId].name,
        description: BIOLOGICAL_DATABASE[orgId].function,
        x: targetX,
        y: targetY,
        radius: 30
      });
    }
  };

  const handleNextStep = () => {
    processManager.stepForward();
    setProcessStateVersion(v => v + 1);
    const p = processManager.secretoryPathway;
    const currentStep = p.steps[p.currentStepIndex - 1];
    if (currentStep && currentStep.activeOrganelleId) {
      handleFocusOrganelle(currentStep.activeOrganelleId);
    }
  };

  const handlePlay = () => {
    if (processManager.secretoryPathway.state === 'playing') {
      processManager.pause();
    } else {
      if (processManager.secretoryPathway.state === 'completed') {
        processManager.reset();
      }
      processManager.play();
    }
    setProcessStateVersion(v => v + 1);
  };

  const handleResetProcess = () => {
    processManager.reset();
    setProcessStateVersion(v => v + 1);
  };

  const pathway = processManager.secretoryPathway;

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', background: '#050811', fontFamily: 'sans-serif', overflow: 'hidden' }}>
      {/* Main Microscope Viewport - Massive Area */}
      <div style={{ flex: 1, position: 'relative', height: '100%' }}>
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ width: '100%', height: '100%', display: 'block', cursor: 'grab', touchAction: 'none' }}
        />

        {/* Minimal Floating Lens Controls Top/Bottom */}
        <div style={{
          position: 'absolute',
          bottom: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(10, 15, 30, 0.75)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '8px 16px',
          borderRadius: '24px',
          display: 'flex',
          gap: '16px',
          alignItems: 'center',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.6)',
          zIndex: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>Фокус</span>
            <input
              type="range"
              min="-1"
              max="1"
              step="0.05"
              value={microscopeState.focusZ}
              onChange={e => setMicroscopeState(prev => ({ ...prev, focusZ: parseFloat(e.target.value) }))}
              style={{ width: '90px', cursor: 'pointer', accentColor: '#38bdf8' }}
            />
          </div>

          <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.1)' }} />

          <div style={{ display: 'flex', gap: '4px' }}>
            {[1, 2, 3, 4].map(zLevel => (
              <button
                key={zLevel}
                onClick={() => setMicroscopeState(prev => ({ ...prev, zoom: zLevel * 0.8 }))}
                style={{
                  background: microscopeState.zoom === zLevel * 0.8 ? '#38bdf8' : 'rgba(255,255,255,0.05)',
                  color: microscopeState.zoom === zLevel * 0.8 ? '#0f172a' : '#94a3b8',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  padding: '3px 10px',
                  fontSize: '10px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                {zLevel === 1 ? 'Обзор' : zLevel === 2 ? 'Органелла' : zLevel === 3 ? 'Процесс' : 'Деталь'}
              </button>
            ))}
          </div>

          <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.1)' }} />

          <div style={{ display: 'flex', gap: '4px' }}>
            {(['normal', 'fluorescence', 'membrane'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setMicroscopeState(prev => ({ ...prev, stainMode: mode }))}
                style={{
                  background: microscopeState.stainMode === mode ? '#38bdf8' : 'rgba(255,255,255,0.05)',
                  color: microscopeState.stainMode === mode ? '#0f172a' : '#94a3b8',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  padding: '3px 10px',
                  fontSize: '10px',
                  cursor: 'pointer',
                  textTransform: 'capitalize'
                }}
              >
                {mode === 'normal' ? 'Свет' : mode === 'fluorescence' ? 'Флуо' : 'Мембр'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Floating Semi-Transparent Collapsible Overlay Sidebar (Not Cards+Cards Grid) */}
      <div style={{
        width: '360px',
        background: 'rgba(11, 17, 32, 0.85)',
        backdropFilter: 'blur(16px)',
        borderLeft: '1px solid rgba(255, 255, 255, 0.06)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        boxSizing: 'border-box',
        overflowY: 'auto',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '10px' }}>
          <h2 style={{ margin: 0, fontSize: '15px', color: '#f8fafc', fontWeight: '500', letterSpacing: '0.02em' }}>
            Микроскоп • Клетка
          </h2>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button onClick={() => handleFocusOrganelle('nucleus')} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#38bdf8', padding: '3px 8px', borderRadius: '4px', fontSize: '10px', cursor: 'pointer' }}>Ядро</button>
            <button onClick={() => handleFocusOrganelle('mitochondrion')} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#38bdf8', padding: '3px 8px', borderRadius: '4px', fontSize: '10px', cursor: 'pointer' }}>Митох</button>
            <button onClick={() => handleFocusOrganelle('golgi')} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#38bdf8', padding: '3px 8px', borderRadius: '4px', fontSize: '10px', cursor: 'pointer' }}>Гольджи</button>
          </div>
        </div>

        {organelleBio ? (
          <div style={{ background: 'rgba(20, 30, 50, 0.6)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(56, 189, 248, 0.2)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '9px', textTransform: 'uppercase', color: '#38bdf8', fontWeight: '600', letterSpacing: '0.05em' }}>
                  {organelleBio.latinName}
                </span>
                <h3 style={{ margin: '2px 0 0 0', fontSize: '15px', color: '#f8fafc' }}>
                  {organelleBio.name}
                </h3>
              </div>
              <button
                onClick={() => handleFocusOrganelle(organelleBio.id)}
                style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '3px 6px', borderRadius: '4px', fontSize: '9px', cursor: 'pointer' }}
              >
                Фокус
              </button>
            </div>

            <div style={{ fontSize: '11px', color: '#cbd5e1', lineHeight: '1.3' }}>
              <strong style={{ color: '#38bdf8' }}>Строение:</strong> {organelleBio.structure}
            </div>

            <div style={{ fontSize: '11px', color: '#cbd5e1', lineHeight: '1.3' }}>
              <strong style={{ color: '#38bdf8' }}>Функция:</strong> {organelleBio.function}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '10px', background: 'rgba(10, 15, 30, 0.5)', padding: '6px', borderRadius: '4px' }}>
              <div>
                <span style={{ color: '#38bdf8', fontWeight: '600' }}>Вход:</span>
                <ul style={{ margin: '1px 0 0 12px', padding: 0, color: '#94a3b8' }}>
                  {organelleBio.incomingSubstances.map((sub, i) => <li key={i}>{sub}</li>)}
                </ul>
              </div>
              <div>
                <span style={{ color: '#38bdf8', fontWeight: '600' }}>Выход:</span>
                <ul style={{ margin: '1px 0 0 12px', padding: 0, color: '#94a3b8' }}>
                  {organelleBio.outgoingSubstances.map((sub, i) => <li key={i}>{sub}</li>)}
                </ul>
              </div>
            </div>

            {organelleBio.protectiveMechanism ? (
              <div style={{ fontSize: '10px', color: '#fca5a5', background: 'rgba(239, 68, 68, 0.08)', padding: '5px', borderRadius: '4px' }}>
                <strong style={{ display: 'block', marginBottom: '1px' }}>Защита:</strong>
                {organelleBio.protectiveMechanism}
              </div>
            ) : null}
          </div>
        ) : (
          <div style={{ color: '#64748b', fontSize: '12px', fontStyle: 'italic', background: 'rgba(15, 23, 42, 0.4)', padding: '12px', borderRadius: '6px', border: '1px dashed rgba(255,255,255,0.05)' }}>
            Нажмите на любую органеллу прямо внутри клетки под микроскопом для детального изучения.
          </div>
        )}

        {/* Secretory Pathway Process Simulation Panel */}
        <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '13px', color: '#38bdf8', fontWeight: '500' }}>Режим «Что происходит?»</h3>
            <span style={{ fontSize: '10px', color: '#64748b' }}>Шаг {Math.min(pathway.currentStepIndex + 1, pathway.steps.length)} / {pathway.steps.length}</span>
          </div>

          {pathway.currentStepIndex < pathway.steps.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <h4 style={{ margin: 0, fontSize: '12px', color: '#f8fafc', fontWeight: '600' }}>
                {pathway.steps[pathway.currentStepIndex].title}
              </h4>
              <p style={{ fontSize: '10px', color: '#cbd5e1', margin: 0, lineHeight: '1.3' }}>
                {pathway.steps[pathway.currentStepIndex].description}
              </p>
              
              <div style={{ fontSize: '10px', color: '#38bdf8', background: 'rgba(10, 15, 30, 0.6)', padding: '6px', borderRadius: '4px', borderLeft: '2px solid #38bdf8' }}>
                {pathway.steps[pathway.currentStepIndex].whatHappensText}
              </div>
            </div>
          ) : (
            <div style={{ fontSize: '11px', color: '#4ade80', fontWeight: 'bold', padding: '6px', background: 'rgba(74, 222, 128, 0.08)', borderRadius: '4px' }}>
              ✓ Экзоцитоз завершен. Процесс выполнен внутри сцены.
            </div>
          )}

          <div style={{ display: 'flex', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
            <button
              onClick={handlePlay}
              style={{
                background: pathway.state === 'playing' ? '#f59e0b' : '#38bdf8',
                color: '#0f172a',
                border: 'none',
                padding: '5px 12px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: 'pointer',
                flex: 1
              }}
            >
              {pathway.state === 'playing' ? 'Pause' : 'Play'}
            </button>

            <button
              onClick={handleNextStep}
              style={{
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                padding: '5px 10px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Step
            </button>

            <button
              onClick={handleResetProcess}
              style={{
                background: 'rgba(255,255,255,0.06)',
                color: '#94a3b8',
                border: 'none',
                padding: '5px 10px',
                borderRadius: '4px',
                fontSize: '11px',
                cursor: 'pointer'
              }}
            >
              Replay
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
            <span>Скорость: {pathway.speed}x</span>
            <div style={{ display: 'flex', gap: '4px' }}>
              {[0.25, 0.5, 1.0, 2.0].map(sp => (
                <button
                  key={sp}
                  onClick={() => { processManager.setSpeed(sp); setProcessStateVersion(v => v + 1); }}
                  style={{
                    background: pathway.speed === sp ? '#38bdf8' : 'rgba(255,255,255,0.05)',
                    color: pathway.speed === sp ? '#0f172a' : '#94a3b8',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '3px',
                    padding: '2px 6px',
                    fontSize: '9px',
                    cursor: 'pointer'
                  }}
                >
                  {sp}×
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 'auto', background: 'rgba(10, 15, 30, 0.3)', padding: '10px', borderRadius: '6px', fontSize: '10px', color: '#64748b', lineHeight: '1.4' }}>
          • Навигация: ЛКМ тянуть, Колесико зум<br/>
          • Клетка живая: наблюдайте движение везикул и цитоплазмы.
        </div>
      </div>
    </div>
  );
}
export default App;
