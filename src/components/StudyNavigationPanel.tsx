import React from 'react';

interface StudyNavigationPanelProps {
  onFocusOrganelle: (orgId: string) => void;
  selectedCellType: 'animal' | 'plant' | 'bacterial';
  onSelectCellType: (type: 'animal' | 'plant' | 'bacterial') => void;
  selectedPlantStructure: string | null;
  onSelectPlantStructure: (structId: string | null) => void;
  isOpen: boolean;
  onClose: () => void;
  activeTab: 'cytology' | 'histology';
  setActiveTab: (tab: 'cytology' | 'histology') => void;
  selectedCategory: 'eukaryotes' | 'prokaryotes' | null;
  setSelectedCategory: (cat: 'eukaryotes' | 'prokaryotes' | null) => void;
}

export const StudyNavigationPanel: React.FC<StudyNavigationPanelProps> = ({
  onFocusOrganelle,
  selectedCellType,
  onSelectCellType,
  selectedPlantStructure,
  onSelectPlantStructure,
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
  selectedCategory,
  setSelectedCategory
}) => {
  const plantStructures = [
    { id: 'cellWall', name: 'Клеточная стенка' },
    { id: 'membrane', name: 'Плазматическая мембрана' },
    { id: 'cytoplasm', name: 'Цитоплазма' },
    { id: 'nucleus', name: 'Ядро' },
    { id: 'vacuole', name: 'Центральная вакуоль' },
    { id: 'chloroplast', name: 'Хлоропласты' }
  ];

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop overlay for outside click */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0, 0, 0, 0.25)',
          zIndex: 100,
          backdropFilter: 'blur(2px)'
        }}
      />

      {/* Sliding panel from left */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '340px',
        height: '100vh',
        background: '#FAF8F3',
        color: '#1e293b',
        borderRight: '1px solid #e2e8f0',
        boxShadow: '4px 0 25px rgba(0, 0, 0, 0.15)',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        boxSizing: 'border-box',
        overflowY: 'auto',
        zIndex: 101,
        animation: 'slideInLeft 0.25s ease-out'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
          <h2 style={{ margin: 0, fontSize: '18px', color: '#0f172a', fontWeight: '600' }}>
            🔬 Меню атласа
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(0,0,0,0.05)',
              border: 'none',
              borderRadius: '50%',
              width: '28px',
              height: '28px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#475569',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ✕
          </button>
        </div>

        {/* Main Tabs: Cytology & Histology */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => { setActiveTab('cytology'); setSelectedCategory(null); }}
            style={{
              flex: 1,
              background: activeTab === 'cytology' ? '#0284c7' : '#f1f5f9',
              color: activeTab === 'cytology' ? '#ffffff' : '#475569',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              padding: '8px 12px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Цитология
          </button>
          <button
            onClick={() => { setActiveTab('histology'); setSelectedCategory(null); }}
            style={{
              flex: 1,
              background: activeTab === 'histology' ? '#0284c7' : '#f1f5f9',
              color: activeTab === 'histology' ? '#ffffff' : '#475569',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              padding: '8px 12px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Гистология
          </button>
        </div>

        {/* Sub-content based on selected main section */}
        {activeTab === 'cytology' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              onClick={() => setSelectedCategory('eukaryotes')}
              style={{
                background: selectedCategory === 'eukaryotes' ? '#0284c7' : '#ffffff',
                color: selectedCategory === 'eukaryotes' ? '#ffffff' : '#0f172a',
                border: selectedCategory === 'eukaryotes' ? '1px solid #0284c7' : '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '12px 14px',
                fontSize: '14px',
                textAlign: 'left',
                cursor: 'pointer',
                fontWeight: '600',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}
            >
              <span>Эукариоты</span>
              <span style={{ fontSize: '14px', color: selectedCategory === 'eukaryotes' ? '#ffffff' : '#0284c7' }}>{selectedCategory === 'eukaryotes' ? '▼' : '➔'}</span>
            </button>

            {selectedCategory === 'eukaryotes' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '8px' }}>
                <button
                  onClick={() => { onSelectCellType('animal'); onSelectPlantStructure(null); onClose(); }}
                  style={{
                    background: selectedCellType === 'animal' ? '#e0f2fe' : '#ffffff',
                    color: '#0f172a',
                    border: selectedCellType === 'animal' ? '2px solid #0284c7' : '1px solid #cbd5e1',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    fontSize: '13px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontWeight: selectedCellType === 'animal' ? '600' : 'normal',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                  }}
                >
                  <div style={{ fontWeight: '600' }}>Животная клетка (Эукариот)</div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Симуляция секреторного пути и органелл.</div>
                </button>

                <button
                  onClick={() => { onSelectCellType('plant'); onClose(); }}
                  style={{
                    background: selectedCellType === 'plant' ? '#dcfce7' : '#ffffff',
                    color: '#0f172a',
                    border: selectedCellType === 'plant' ? '2px solid #16a34a' : '1px solid #cbd5e1',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    fontSize: '13px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontWeight: selectedCellType === 'plant' ? '600' : 'normal',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                  }}
                >
                  <div style={{ fontWeight: '600' }}>Растительная клетка</div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Клеточная стенка, вакуоль, хлоропласты.</div>
                </button>

                {selectedCellType === 'plant' && (
                  <div style={{ background: '#f0fdf4', padding: '10px', borderRadius: '8px', border: '1px solid #bbf7d0', display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                    <div style={{ fontSize: '11px', color: '#15803d', fontWeight: '600' }}>Структуры растительной клетки:</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {plantStructures.map(st => (
                        <button
                          key={st.id}
                          onClick={() => { onSelectPlantStructure(st.id); onClose(); }}
                          style={{
                            background: selectedPlantStructure === st.id ? '#16a34a' : '#ffffff',
                            color: selectedPlantStructure === st.id ? '#ffffff' : '#334155',
                            border: '1px solid #cbd5e1',
                            borderRadius: '6px',
                            padding: '6px 10px',
                            fontSize: '11px',
                            cursor: 'pointer',
                            textAlign: 'left',
                            fontWeight: selectedPlantStructure === st.id ? '600' : 'normal'
                          }}
                        >
                          {st.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => setSelectedCategory('prokaryotes')}
              style={{
                background: selectedCategory === 'prokaryotes' ? '#0284c7' : '#ffffff',
                color: selectedCategory === 'prokaryotes' ? '#ffffff' : '#0f172a',
                border: selectedCategory === 'prokaryotes' ? '1px solid #0284c7' : '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '12px 14px',
                fontSize: '14px',
                textAlign: 'left',
                cursor: 'pointer',
                fontWeight: '600',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}
            >
              <span>Прокариоты</span>
              <span style={{ fontSize: '14px', color: selectedCategory === 'prokaryotes' ? '#ffffff' : '#0284c7' }}>{selectedCategory === 'prokaryotes' ? '▼' : '➔'}</span>
            </button>

            {selectedCategory === 'prokaryotes' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '8px' }}>
                <button
                  onClick={() => { onSelectCellType('bacterial'); onSelectPlantStructure(null); onClose(); }}
                  style={{
                    background: selectedCellType === 'bacterial' ? '#fef3c7' : '#ffffff',
                    color: '#0f172a',
                    border: selectedCellType === 'bacterial' ? '2px solid #d97706' : '1px solid #cbd5e1',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    fontSize: '13px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontWeight: selectedCellType === 'bacterial' ? '600' : 'normal',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                  }}
                >
                  <div style={{ fontWeight: '600' }}>Бактериальная клетка (Прокариот)</div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Безъядерная клетка с нуклеоидом и плазмидами.</div>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: '13px', color: '#0f172a', fontWeight: '600' }}>Гистологические препараты тканей:</div>
            
            <div style={{ background: '#ffffff', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxShadow: '0 1px 2px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ fontWeight: '600', fontSize: '13px', color: '#0284c7' }}>Эпителиальная ткань (Кожа / Слизистая)</div>
              <div style={{ fontSize: '11px', color: '#475569', lineHeight: '1.4' }}>
                Покровная ткань, плотно прилегающие клетки с минимальным количеством межклеточного вещества. Защитная функция.
              </div>
            </div>

            <div style={{ background: '#ffffff', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxShadow: '0 1px 2px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ fontWeight: '600', fontSize: '13px', color: '#0284c7' }}>Соединительная ткань (Кровь / Рыхлая волокнистая)</div>
              <div style={{ fontSize: '11px', color: '#475569', lineHeight: '1.4' }}>
                Характеризуется развитым межклеточным веществом. Обеспечивает опорную, трофическую и защитную функции.
              </div>
            </div>

            <div style={{ background: '#ffffff', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxShadow: '0 1px 2px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ fontWeight: '600', fontSize: '13px', color: '#0284c7' }}>Мышечная ткань (Поперечно-полосатая)</div>
              <div style={{ fontSize: '11px', color: '#475569', lineHeight: '1.4' }}>
                Состоит из миоцитов (мышечных волокон), содержащих сократительные белки актин и миозин для движения.
              </div>
            </div>

            <div style={{ background: '#ffffff', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxShadow: '0 1px 2px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ fontWeight: '600', fontSize: '13px', color: '#0284c7' }}>Нервная ткань (Нейроны и глия)</div>
              <div style={{ fontSize: '11px', color: '#475569', lineHeight: '1.4' }}>
                Специализированные возбудимые клетки для генерации и проведения электрических импульсов и нервной регуляции.
              </div>
            </div>
          </div>
        )}

        <div style={{ marginTop: 'auto', fontSize: '11px', color: '#64748b', background: '#f1f5f9', padding: '10px', borderRadius: '8px' }}>
          💡 Подсказка: нажимайте на любые органеллы под микроскопом для просмотра подробных биологических данных.
        </div>
      </div>
    </>
  );
};

