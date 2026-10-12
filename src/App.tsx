import React, { useRef, useState } from 'react';
import { MicroscopeState, OrganelleInfo } from './state/microscopeState';
import { useMultiCellLoop } from './rendering/useMultiCellLoop';
import { CellProcessManager } from './core/processes/secretoryPathway';
import { BIOLOGICAL_DATABASE, BiologicalMetadataDetailed } from './core/biology/biologicalData';
import { StudyNavigationPanel } from './components/StudyNavigationPanel';

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
  const [selectedCellType, setSelectedCellType] = useState<'animal' | 'plant' | 'bacterial'>('animal');
  const [selectedPlantStructure, setSelectedPlantStructure] = useState<string | null>(null);
  const [processManager] = useState(() => new CellProcessManager());
  const [processStateVersion, setProcessStateVersion] = useState(0);

  // Menu sliding panel state
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuActiveTab, setMenuActiveTab] = useState<'cytology' | 'histology'>('cytology');
  const [menuSelectedCategory, setMenuSelectedCategory] = useState<'eukaryotes' | 'prokaryotes' | null>(null);

  // Real speed mode (🔬) state
  const [isRealSpeedMode, setIsRealSpeedMode] = useState(false);

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

  const { simulationRef, plantRendererRef } = useMultiCellLoop(
    canvasRef,
    microscopeState,
    processRef,
    selectedCellType,
    selectedPlantStructure
  );

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDragging.current = true;
    lastMousePos.current = { x: e.clientX, y: e.clientY };

    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const width = canvasRef.current.width;
    const height = canvasRef.current.height;
    
    const worldX = (clickX - width / 2 - microscopeState.panX) / microscopeState.zoom + width / 2;
    const worldY = (clickY - height / 2 - microscopeState.panY) / microscopeState.zoom + height / 2;

    if (selectedCellType === 'plant' && plantRendererRef.current) {
      const clickedStructId = plantRendererRef.current.getStructureAt(worldX, worldY, width, height);
      if (clickedStructId) {
        setSelectedPlantStructure(clickedStructId);
        if (BIOLOGICAL_DATABASE[clickedStructId]) {
          setOrganelleBio(BIOLOGICAL_DATABASE[clickedStructId]);
          setSelectedOrganelle({
            id: clickedStructId,
            type: 'cytoplasm',
            name: BIOLOGICAL_DATABASE[clickedStructId].name,
            description: BIOLOGICAL_DATABASE[clickedStructId].function,
            x: worldX,
            y: worldY,
            radius: 30
          });
        }
        return;
      }
    }

    if (!simulationRef.current) return;
    const organelle = simulationRef.current.getOrganelleAt(worldX, worldY);
    setSelectedOrganelle(organelle);

    if (organelle && BIOLOGICAL_DATABASE[organelle.id]) {
      setOrganelleBio(BIOLOGICAL_DATABASE[organelle.id]);
    } else if (organelle && organelle.id.startsWith('nuclearPore')) {
      setOrganelleBio(BIOLOGICAL_DATABASE['nucleus']);
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
    <div style={{ display: 'flex', height: '100vh', width: '100vw', background: '#FAF8F3', fontFamily: 'sans-serif', overflow: 'hidden' }}>
      {/* Top-Right Menu Button */}
      <button
        onClick={() => setIsMenuOpen(true)}
        style={{
          position: 'fixed',
          top: 16,
          right: 380,
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(8px)',
          border: '1px solid #cbd5e1',
          borderRadius: '8px',
          padding: '8px 16px',
          fontSize: '13px',
          fontWeight: '600',
          color: '#0f172a',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
          zIndex: 20
        }}
      >
        ☰ Меню
      </button>

      {/* Sliding Menu Panel */}
      <StudyNavigationPanel
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onFocusOrganelle={handleFocusOrganelle}
        selectedCellType={selectedCellType}
        onSelectCellType={setSelectedCellType}
        selectedPlantStructure={selectedPlantStructure}
        onSelectPlantStructure={(structId) => {
          setSelectedPlantStructure(structId);
          if (structId && BIOLOGICAL_DATABASE[structId]) {
            setOrganelleBio(BIOLOGICAL_DATABASE[structId]);
          } else if (!structId) {
            setOrganelleBio(null);
          }
        }}
        activeTab={menuActiveTab}
        setActiveTab={setMenuActiveTab}
        selectedCategory={menuSelectedCategory}
        setSelectedCategory={setMenuSelectedCategory}
      />

      {/* Main Microscope Viewport */}
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
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(12px)',
          border: '1px solid #cbd5e1',
          padding: '8px 16px',
          borderRadius: '24px',
          display: 'flex',
          gap: '16px',
          alignItems: 'center',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
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
              style={{ width: '90px', cursor: 'pointer', accentColor: '#0284c7' }}
            />
          </div>

          <div style={{ width: '1px', height: '20px', background: '#cbd5e1' }} />

          {/* Real Speed Mode Toggle 🔬 */}
          <button
            onClick={() => setIsRealSpeedMode(!isRealSpeedMode)}
            style={{
              background: isRealSpeedMode ? '#d97706' : 'rgba(0,0,0,0.05)',
              color: isRealSpeedMode ? '#ffffff' : '#334155',
              border: '1px solid #cbd5e1',
              borderRadius: '12px',
              padding: '4px 12px',
              fontSize: '11px',
              cursor: 'pointer',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
            title="Переключение между учебной анимацией и реальными временными масштабами"
          >
            🔬 Реальная скорость: {isRealSpeedMode ? 'ВКЛ (дни/часы)' : 'Учебная (секунды)'}
          </button>

          <div style={{ width: '1px', height: '20px', background: '#cbd5e1' }} />

          <div style={{ display: 'flex', gap: '4px' }}>
            {(['normal', 'fluorescence', 'membrane'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setMicroscopeState(prev => ({ ...prev, stainMode: mode }))}
                style={{
                  background: microscopeState.stainMode === mode ? '#0284c7' : 'rgba(0,0,0,0.05)',
                  color: microscopeState.stainMode === mode ? '#ffffff' : '#475569',
                  border: '1px solid #cbd5e1',
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

      {/* Right Panel: Organelles, Names, Information & Process */}
      <div style={{
        width: '360px',
        background: '#ffffff',
        borderLeft: '1px solid #e2e8f0',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        boxSizing: 'border-box',
        overflowY: 'auto',
        zIndex: 10,
        boxShadow: '-4px 0 20px rgba(0,0,0,0.04)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
          <h2 style={{ margin: 0, fontSize: '15px', color: '#0f172a', fontWeight: '600', letterSpacing: '0.02em' }}>
            Органоиды и процессы
          </h2>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button onClick={() => handleFocusOrganelle('nucleus')} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#0284c7', padding: '3px 8px', borderRadius: '4px', fontSize: '10px', cursor: 'pointer', fontWeight: '600' }}>Ядро</button>
            <button onClick={() => handleFocusOrganelle('mitochondrion')} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#0284c7', padding: '3px 8px', borderRadius: '4px', fontSize: '10px', cursor: 'pointer', fontWeight: '600' }}>Митох</button>
            <button onClick={() => handleFocusOrganelle('golgi')} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#0284c7', padding: '3px 8px', borderRadius: '4px', fontSize: '10px', cursor: 'pointer', fontWeight: '600' }}>Гольджи</button>
          </div>
        </div>

        {organelleBio ? (
          <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #cbd5e1', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '9px', textTransform: 'uppercase', color: '#0284c7', fontWeight: '700', letterSpacing: '0.05em' }}>
                  {organelleBio.latinName}
                </span>
                <h3 style={{ margin: '2px 0 0 0', fontSize: '15px', color: '#0f172a', fontWeight: '600' }}>
                  {organelleBio.name}
                </h3>
              </div>
              <button
                onClick={() => handleFocusOrganelle(organelleBio.id)}
                style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '3px 8px', borderRadius: '4px', fontSize: '10px', cursor: 'pointer', fontWeight: '600' }}
              >
                Фокус
              </button>
            </div>

            <div style={{ fontSize: '11px', color: '#334155', lineHeight: '1.4' }}>
              <strong style={{ color: '#0284c7' }}>Строение:</strong> {organelleBio.structure}
            </div>

            <div style={{ fontSize: '11px', color: '#334155', lineHeight: '1.4' }}>
              <strong style={{ color: '#0284c7' }}>Функция:</strong> {organelleBio.function}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '10px', background: '#ffffff', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              <div>
                <span style={{ color: '#0284c7', fontWeight: '700' }}>Вход:</span>
                <ul style={{ margin: '2px 0 0 12px', padding: 0, color: '#475569' }}>
                  {organelleBio.incomingSubstances.map((sub, i) => <li key={i}>{sub}</li>)}
                </ul>
              </div>
              <div>
                <span style={{ color: '#0284c7', fontWeight: '700' }}>Выход:</span>
                <ul style={{ margin: '2px 0 0 12px', padding: 0, color: '#475569' }}>
                  {organelleBio.outgoingSubstances.map((sub, i) => <li key={i}>{sub}</li>)}
                </ul>
              </div>
            </div>

            {organelleBio.protectiveMechanism ? (
              <div style={{ fontSize: '10px', color: '#b91c1c', background: '#fef2f2', padding: '6px', borderRadius: '6px', border: '1px solid #fecaca' }}>
                <strong style={{ display: 'block', marginBottom: '1px' }}>Защита:</strong>
                {organelleBio.protectiveMechanism}
              </div>
            ) : null}
          </div>
        ) : (
          <div style={{ color: '#64748b', fontSize: '12px', fontStyle: 'italic', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
            💡 Нажмите на клетку или органоид (ядро, митохондрии, аппарат Гольджи и др.) под микроскопом, чтобы узнать детальную биологическую информацию и происходящий процесс.
          </div>
        )}

        {/* Process Simulation Panel: Play / Pause */}
        <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #cbd5e1', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '13px', color: '#0284c7', fontWeight: '600' }}>Режим «Что происходит?»</h3>
            <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '600' }}>Шаг {Math.min(pathway.currentStepIndex + 1, pathway.steps.length)} / {pathway.steps.length}</span>
          </div>

          {isRealSpeedMode ? (
            <div style={{ fontSize: '11px', color: '#9a3412', background: '#ffedd5', padding: '8px', borderRadius: '6px', border: '1px solid #fed7aa', lineHeight: '1.4' }}>
              ⏳ <strong>Режим «Реальная скорость» (🔬):</strong> Биологические процессы в живой клетке протекают в естественных временных масштабах (транскрипция ДНК занимает минуты, синтез белка — часы, клеточный деления — сутки). Ускоренная учебная анимация выше приведена для наглядности и не выдается за реальное время.
            </div>
          ) : null}

          {pathway.currentStepIndex < pathway.steps.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <h4 style={{ margin: 0, fontSize: '12px', color: '#0f172a', fontWeight: '700' }}>
                {pathway.steps[pathway.currentStepIndex].title}
              </h4>
              <p style={{ fontSize: '11px', color: '#334155', margin: 0, lineHeight: '1.4' }}>
                {pathway.steps[pathway.currentStepIndex].description}
              </p>
              
              <div style={{ fontSize: '11px', color: '#0369a1', background: '#e0f2fe', padding: '8px', borderRadius: '6px', borderLeft: '3px solid #0284c7', lineHeight: '1.4' }}>
                {pathway.steps[pathway.currentStepIndex].whatHappensText}
              </div>
            </div>
          ) : (
            <div style={{ fontSize: '11px', color: '#15803d', fontWeight: 'bold', padding: '8px', background: '#dcfce7', borderRadius: '6px', border: '1px solid #bbf7d0' }}>
              ✓ Экзоцитоз завершен. Процесс успешно выполнен внутри сцены.
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
            <button
              onClick={handlePlay}
              style={{
                background: pathway.state === 'playing' ? '#d97706' : '#0284c7',
                color: '#ffffff',
                border: 'none',
                padding: '8px 14px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 'bold',
                cursor: 'pointer',
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              {pathway.state === 'playing' ? '⏸ Пауза' : '▶️ Запустить'}
            </button>

            <button
              onClick={handleNextStep}
              style={{
                background: '#e2e8f0',
                color: '#0f172a',
                border: '1px solid #cbd5e1',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Шаг ⏭
            </button>

            <button
              onClick={handleResetProcess}
              style={{
                background: '#f1f5f9',
                color: '#475569',
                border: '1px solid #cbd5e1',
                padding: '8px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              Сброс
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
            <span>Скорость: {pathway.speed}x</span>
            <div style={{ display: 'flex', gap: '4px' }}>
              {[0.25, 0.5, 1.0, 2.0].map(sp => (
                <button
                  key={sp}
                  onClick={() => { processManager.setSpeed(sp); setProcessStateVersion(v => v + 1); }}
                  style={{
                    background: pathway.speed === sp ? '#0284c7' : '#ffffff',
                    color: pathway.speed === sp ? '#ffffff' : '#334155',
                    border: '1px solid #cbd5e1',
                    borderRadius: '4px',
                    padding: '3px 8px',
                    fontSize: '10px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  {sp}×
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 'auto', background: '#f8fafc', padding: '10px', borderRadius: '8px', fontSize: '10px', color: '#64748b', lineHeight: '1.4', border: '1px solid #e2e8f0' }}>
          • Навигация: ЛКМ тянуть, Колесико зум<br/>
          • Клетка живая: наблюдайте синтез мРНК, везикулы и органеллы.
        </div>
      </div>
    </div>
  );
}
export default App;

