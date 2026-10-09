export interface CellProcessStep {
  id: string;
  title: string;
  description: string;
  source: string;
  initialState: string;
  finalState: string;
  durationSeconds: number;
  completed: boolean;
  activeOrganelleId: string;
  incomingText: string;
  outgoingText: string;
  whatHappensText: string;
}

export interface SecretoryPathwayProcess {
  state: 'idle' | 'playing' | 'paused' | 'completed';
  currentStepIndex: number;
  speed: number;
  steps: CellProcessStep[];
  activeOrganelleId?: string;
  activeObject?: {
    x: number;
    y: number;
    label: string;
  };
  targetDestination?: {
    x: number;
    y: number;
  };
  elapsedInStep: number;
}

export class CellProcessManager {
  public secretoryPathway: SecretoryPathwayProcess = {
    state: 'idle',
    currentStepIndex: 0,
    speed: 1.0,
    elapsedInStep: 0,
    steps: [
      {
        id: 'transcription',
        title: 'Ядро: Транскрипция и выход через пору',
        description: 'В ядре на ДНК синтезируется мРНК, которая движется изнутри ядра через ядерную пору наружу в цитоплазму.',
        source: 'ДНК в ядре',
        initialState: 'Генетический код в ядре',
        finalState: 'Молекула мРНК вышла в цитозоль',
        durationSeconds: 4.5,
        completed: false,
        activeOrganelleId: 'nucleus',
        incomingText: 'Нуклеотиды, РНК-полимераза',
        outgoingText: 'мРНК в цитоплазме',
        whatHappensText: 'мРНК беспрерывно движется от ДНК к ядерной поре и проходит сквозь нее в цитоплазму.'
      },
      {
        id: 'ribosome-translation',
        title: 'Рибосома: Трансляция и поступление в ШЭПС',
        description: 'Рибосома синтезирует полипептид, который непрерывно через мембранный канал поступает внутрь просвета шероховатой ЭПС.',
        source: 'Рибосома на мембране ШЭПС',
        initialState: 'Растущий полипептид на рибосоме',
        finalState: 'Полипептид внутри цистерны ШЭПС',
        durationSeconds: 3.5,
        completed: false,
        activeOrganelleId: 'roughER',
        incomingText: 'мРНК, аминокислоты',
        outgoingText: 'Насцентный полипептид в люмене ШЭПС',
        whatHappensText: 'Постепенное вхождение растущей полипептидной цепи через мембрану внутрь шероховатой ЭПС.'
      },
      {
        id: 'er-folding',
        title: 'ШЭПС: Фолдинг и контроль качества (ERAD)',
        description: 'В цистерне ШЭПС линейный полипептид сворачивается в третичную структуру (фолдинг). Шапероны проверяют правильность сборки.',
        source: 'Просвет шероховатой ЭПС',
        initialState: 'Развернутая полипептидная цепь',
        finalState: 'Правильно свернутый белок (или ERAD при дефекте)',
        durationSeconds: 4.0,
        completed: false,
        activeOrganelleId: 'roughER',
        incomingText: 'Полипептид, шапероны, АТФ',
        outgoingText: 'Свернутый белок / деградация ERAD',
        whatHappensText: 'Визуализация фолдинга (разворот → пространственная трехмерная структура) и проверка шаперонами.'
      },
      {
        id: 'vesicle-budding',
        title: 'ШЭПС → Везикула: Упаковка груза',
        description: 'Свернутые специфические секреторные белки концентрируются на участке мембраны ЭПС и отпочковываются в транспортную везикулу (COPII).',
        source: 'Мембрана ШЭПС',
        initialState: 'Свернутый белок в цистерне ЭПС',
        finalState: 'Закрытая транспортная везикула с белковым грузом в цитоплазме',
        durationSeconds: 2.5,
        completed: false,
        activeOrganelleId: 'roughER',
        incomingText: 'Секреторный белок, белки оболочки (COPII)',
        outgoingText: 'Транспортная везикула в цитозоль',
        whatHappensText: 'Участок мембраны выпячивается и отрывается, изолируя груз от цитозоля.'
      },
      {
        id: 'vesicle-transport',
        title: 'Цитозоль: Направленный транспорт везикулы',
        description: 'Транспортная везикула движется по микротрубочкам цитоскелета с помощью моторных белков (кинезин) от ЭПС к цис-лицу аппарата Гольджи.',
        source: 'Цитоскелет / цитозоль',
        initialState: 'Везикула у внешней границы ШЭПС',
        finalState: 'Везикула достигает цис-компартмента аппарата Гольджи',
        durationSeconds: 3.0,
        completed: false,
        activeOrganelleId: 'golgi',
        incomingText: 'Везикула с грузом, АТФ',
        outgoingText: 'Везикула у цис-мембраны Гольджи',
        whatHappensText: 'Моторные белки переносят везикулу по белковым рельсам к цели.'
      },
      {
        id: 'golgi-processing',
        title: 'Аппарат Гольджи: Модификация и сортировка в TGN',
        description: 'Везикула сливается с цис-цистерной Гольджи. В транс-сети Гольджи (TGN) происходит сортировка белков по их адресам назначения (секреция, лизосомы, мембрана).',
        source: 'Цис- и медиальные цистерны Гольджи, TGN',
        initialState: 'Незрелый белковый груз в Гольджи',
        finalState: 'Сортированные по маршрутам везикулы в TGN',
        durationSeconds: 3.5,
        completed: false,
        activeOrganelleId: 'golgi',
        incomingText: 'Везикула из ЭПС, УДФ-сахара',
        outgoingText: 'Сортированные везикулы (секреторная, лизосомальная, мембранная)',
        whatHappensText: 'В TGN различные белки распределяются по разным везикулам в зависимости от их сигнальных меток (не все идут на экзоцитоз!).'
      },
      {
        id: 'secretion-exocytosis',
        title: 'Маршрут 1: Плазмолемма — Экзоцитоз (Секреция)',
        description: 'Секреторная везикула доставляется к плазматической мембране, сливается с ней (экзоцитоз) и выбрасывает содержимое во внешнюю среду.',
        source: 'Транс-сеть Гольджи → Плазмолемма',
        initialState: 'Секреторная везикула у внутренней поверхности плазмолеммы',
        finalState: 'Выброшенный во внешнюю среду белок',
        durationSeconds: 3.0,
        completed: false,
        activeOrganelleId: 'membrane',
        incomingText: 'Секреторная везикула, ионы Ca²⁺, SNARE',
        outgoingText: 'Конечный секретируемый белок вовне',
        whatHappensText: 'Мембраны сливаются, открывая канал наружу и высвобождая секреторный белок (один из возможных путей).'
      }
    ]
  };

  public play() {
    this.secretoryPathway.state = 'playing';
  }

  public pause() {
    this.secretoryPathway.state = 'paused';
  }

  public reset() {
    this.secretoryPathway.state = 'idle';
    this.secretoryPathway.currentStepIndex = 0;
    this.secretoryPathway.elapsedInStep = 0;
    this.secretoryPathway.steps.forEach(s => s.completed = false);
    this.secretoryPathway.activeOrganelleId = undefined;
    this.secretoryPathway.activeObject = undefined;
    this.secretoryPathway.targetDestination = undefined;
  }

  public stepForward() {
    const p = this.secretoryPathway;
    if (p.currentStepIndex < p.steps.length) {
      p.steps[p.currentStepIndex].completed = true;
      p.currentStepIndex++;
      p.elapsedInStep = 0;
      this.updateActiveContext();
      if (p.currentStepIndex >= p.steps.length) {
        p.state = 'completed';
        p.activeOrganelleId = 'membrane';
        p.activeObject = undefined;
        p.targetDestination = undefined;
      }
    }
  }

  public setSpeed(speed: number) {
    this.secretoryPathway.speed = speed;
  }

  private updateActiveContext() {
    const p = this.secretoryPathway;
    const idx = p.currentStepIndex;
    if (idx === 0) {
      p.activeOrganelleId = 'nucleus';
      p.activeObject = { x: 400, y: 300, label: 'Синтез мРНК в ядре' };
      p.targetDestination = { x: 360, y: 260 };
    } else if (idx === 1) {
      p.activeOrganelleId = 'roughER';
      p.activeObject = { x: 340, y: 240, label: 'Трансляция на рибосоме ШЭПС' };
      p.targetDestination = { x: 340, y: 240 };
    } else if (idx === 2) {
      p.activeOrganelleId = 'roughER';
      p.activeObject = { x: 330, y: 230, label: 'Фолдинг полипептида в ЭПС' };
      p.targetDestination = { x: 320, y: 215 };
    } else if (idx === 3) {
      p.activeOrganelleId = 'roughER';
      p.activeObject = { x: 320, y: 215, label: 'Отпочковывание везикулы (COPII)' };
      p.targetDestination = { x: 400, y: 200 };
    } else if (idx === 4) {
      p.activeOrganelleId = 'golgi';
      p.activeObject = { x: 420, y: 195, label: 'Транспорт везикулы к Гольджи' };
      p.targetDestination = { x: 460, y: 200 };
    } else if (idx === 5) {
      p.activeOrganelleId = 'golgi';
      p.activeObject = { x: 485, y: 205, label: 'Модификация в цистернах Гольджи' };
      p.targetDestination = { x: 520, y: 280 };
    } else if (idx === 6) {
      p.activeOrganelleId = 'membrane';
      p.activeObject = { x: 570, y: 340, label: 'Экзоцитоз везикулы' };
      p.targetDestination = { x: 610, y: 380 };
    }
  }

  public update(dt: number) {
    const p = this.secretoryPathway;
    if (p.state === 'playing') {
      p.elapsedInStep += dt * p.speed;
      const currentStep = p.steps[p.currentStepIndex];
      if (currentStep && p.elapsedInStep >= currentStep.durationSeconds) {
        this.stepForward();
        if (p.currentStepIndex >= p.steps.length) {
          p.state = 'idle';
        }
      }
    }
  }
}
