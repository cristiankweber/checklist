const STORAGE_KEYS = {
  theme: 'ht-theme',
  patients: 'ht-patients-v1'
};

const storage = (() => {
  try {
    if (typeof window === 'undefined' || !('localStorage' in window)) {
      return null;
    }
    const testKey = '__ht-storage-test__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    return window.localStorage;
  } catch (error) {
    console.warn('Armazenamento local indisponível. Persistência será desativada.', error);
    return null;
  }
})();

const DEFAULT_PATIENTS = [
  {
    id: 'TCTH-201',
    name: 'Mariana Lopes',
    diagnosis: 'Leucemia mieloide aguda',
    transplantType: 'Alogênico aparentado',
    daysPost: 12,
    risk: 'alto',
    status: 'Pós-imediato',
    notes: 'Sinais leves de GVHD cutânea. Tacrolimo em ajuste fino.'
  },
  {
    id: 'TCTH-208',
    name: 'Rafael Marques',
    diagnosis: 'Linfoma não-Hodgkin',
    transplantType: 'Autólogo',
    daysPost: 4,
    risk: 'moderado',
    status: 'Pós-imediato',
    notes: 'Neutropenia febril. Culturas colhidas, antibiótico empírico iniciado.'
  },
  {
    id: 'TCTH-215',
    name: 'Juliana Santos',
    diagnosis: 'Anemia aplástica severa',
    transplantType: 'Alogênico não aparentado',
    daysPost: -2,
    risk: 'alto',
    status: 'Condicionamento',
    notes: 'QTc prolongado. Monitorização cardíaca contínua.'
  },
  {
    id: 'TCTH-223',
    name: 'Carlos Vieira',
    diagnosis: 'Mieloma múltiplo',
    transplantType: 'Autólogo',
    daysPost: -5,
    risk: 'moderado',
    status: 'Condicionamento',
    notes: 'BEAM intensificado. Avaliar mucosite diariamente.'
  },
  {
    id: 'TCTH-198',
    name: 'Fernanda Costa',
    diagnosis: 'Leucemia linfoblástica aguda',
    transplantType: 'Haploidêntico',
    daysPost: 84,
    risk: 'baixo',
    status: 'Follow-up',
    notes: 'Sem intercorrências. Ajuste de imunossupressores em andamento.'
  },
  {
    id: 'TCTH-190',
    name: 'André Lima',
    diagnosis: 'Síndrome mielodisplásica',
    transplantType: 'Alogênico aparentado',
    daysPost: 45,
    risk: 'moderado',
    status: 'Follow-up',
    notes: 'Engraftment estável. Monitorar função hepática.'
  }
];

const ALLOWED_RISKS = new Set(['alto', 'moderado', 'baixo']);
const ALLOWED_STATUSES = new Set(['Pré-transplante', 'Condicionamento', 'Pós-imediato', 'Follow-up']);

let patientNoticeTimeout;

const escapeHTML = (value) => {
  const stringValue = String(value ?? '');
  const replacements = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };
  return stringValue.replace(/[&<>"']/g, (char) => replacements[char]);
};

function loadPatients() {
  try {
    const stored = storage?.getItem(STORAGE_KEYS.patients);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        const sanitized = parsed
          .filter((patient) => patient && typeof patient.id === 'string' && typeof patient.name === 'string')
          .map((patient) => {
            const normalizedRisk = String(patient.risk || '').toLowerCase();
            const normalizedStatus = String(patient.status || '').trim();

            return {
              id: String(patient.id).trim(),
              name: String(patient.name).trim(),
              diagnosis: String(patient.diagnosis || '').trim(),
              transplantType: String(patient.transplantType || '').trim(),
              daysPost: Number(patient.daysPost) || 0,
              risk: ALLOWED_RISKS.has(normalizedRisk) ? normalizedRisk : 'moderado',
              status: ALLOWED_STATUSES.has(normalizedStatus) ? normalizedStatus : 'Follow-up',
              notes: String(patient.notes || '').trim()
            };
          });

        if (sanitized.length) {
          return sanitized;
        }
      }
    }
  } catch (error) {
    console.warn('Não foi possível carregar pacientes do armazenamento local.', error);
  }

  return DEFAULT_PATIENTS.map((patient) => ({ ...patient }));
}

function persistPatients(patients) {
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEYS.patients, JSON.stringify(patients));
  } catch (error) {
    console.warn('Não foi possível salvar os pacientes no armazenamento local.', error);
  }
}

function showPatientNotice(message, tone = 'info') {
  const notice = document.getElementById('patientNotice');
  if (!notice) return;

  notice.textContent = message;
  notice.dataset.tone = tone;
  notice.hidden = false;

  clearTimeout(patientNoticeTimeout);
  patientNoticeTimeout = window.setTimeout(() => {
    notice.hidden = true;
  }, 5000);
}

const state = {
  theme: storage?.getItem(STORAGE_KEYS.theme) || 'light',
  helpDrawer: null,
  patients: loadPatients(),
  filters: {
    query: '',
    risk: 'todos',
    status: 'todos'
  }
};

function applyTheme(theme) {
  document.body.dataset.theme = theme === 'dark' ? 'dark' : 'light';
  if (storage) {
    storage.setItem(STORAGE_KEYS.theme, document.body.dataset.theme);
  }
  const themeToggle = document.getElementById('toggleTheme');
  if (themeToggle) {
    const isDark = document.body.dataset.theme === 'dark';
    themeToggle.setAttribute('aria-pressed', String(isDark));
    themeToggle.querySelector('.btn-label').textContent = isDark ? 'Modo claro' : 'Modo escuro';
    themeToggle.querySelector('.icon').textContent = isDark ? '☀️' : '🌙';
  }
}

function updateMetrics() {
  const activePatients = state.patients.filter((patient) => patient.status !== 'Follow-up').length;
  const engraftmentEligible = state.patients.filter((patient) => patient.daysPost >= 0).length;
  const engrafted = state.patients.filter((patient) => patient.status === 'Follow-up' && patient.daysPost >= 0).length;
  const engraftmentRate = engraftmentEligible
    ? `${Math.min(99, Math.max(65, Math.round((engrafted / engraftmentEligible) * 100)))}%`
    : '—';
  const criticalAlerts = state.patients.filter((patient) => patient.risk === 'alto').length;
  const complianceScore = `${Math.max(85, 100 - criticalAlerts * 2)}%`;

  const metrics = {
    activePatients: activePatients.toString(),
    engraftmentRate,
    criticalAlerts: criticalAlerts.toString(),
    complianceScore
  };

  Object.entries(metrics).forEach(([metric, value]) => {
    const el = document.querySelector(`[data-metric="${metric}"]`);
    if (el) {
      el.textContent = value;
    }
  });
}

function createStatusPill(status) {
  const span = document.createElement('span');
  span.className = 'status-pill';
  span.dataset.status = status;
  span.textContent = status;
  return span.outerHTML;
}

function createRiskBadge(risk) {
  const span = document.createElement('span');
  span.className = 'risk-badge';
  const level = String(risk || '').toLowerCase();
  const label = level.charAt(0).toUpperCase() + level.slice(1);
  span.dataset.level = level;
  span.textContent = `Risco ${label}`;
  return span.outerHTML;
}

function renderPatients({ query = '', risk = 'todos', status = 'todos' } = {}) {
  const tbody = document.getElementById('patientTableBody');
  if (!tbody) return;

  state.filters = { query, risk, status };

  const patientFilterInput = document.getElementById('patientFilter');
  const riskFilterSelect = document.getElementById('riskFilter');
  const statusFilterSelect = document.getElementById('statusFilter');

  if (patientFilterInput && patientFilterInput.value !== query) {
    patientFilterInput.value = query;
  }

  if (riskFilterSelect && riskFilterSelect.value !== risk) {
    riskFilterSelect.value = risk;
  }

  if (statusFilterSelect && statusFilterSelect.value !== status) {
    statusFilterSelect.value = status;
  }

  const normalizedQuery = query.trim().toLowerCase();
  const filtered = state.patients.filter((patient) => {
    const matchesQuery = !normalizedQuery ||
      patient.id.toLowerCase().includes(normalizedQuery) ||
      patient.name.toLowerCase().includes(normalizedQuery) ||
      patient.diagnosis.toLowerCase().includes(normalizedQuery);

    const matchesRisk = risk === 'todos' || patient.risk === risk;
    const matchesStatus = status === 'todos' || patient.status === status;
    return matchesQuery && matchesRisk && matchesStatus;
  });

  tbody.innerHTML = '';
  filtered.forEach((patient) => {
    const tr = document.createElement('tr');

    const idCell = document.createElement('td');
    idCell.textContent = patient.id;
    tr.appendChild(idCell);

    const nameCell = document.createElement('td');
    nameCell.textContent = patient.name;
    tr.appendChild(nameCell);

    const diagnosisCell = document.createElement('td');
    diagnosisCell.textContent = patient.diagnosis;
    tr.appendChild(diagnosisCell);

    const transplantCell = document.createElement('td');
    transplantCell.textContent = patient.transplantType;
    tr.appendChild(transplantCell);

    const daysCell = document.createElement('td');
    daysCell.textContent = `D${patient.daysPost >= 0 ? '+' : ''}${patient.daysPost}`;
    tr.appendChild(daysCell);

    const riskCell = document.createElement('td');
    riskCell.innerHTML = createRiskBadge(patient.risk);
    tr.appendChild(riskCell);

    const statusCell = document.createElement('td');
    statusCell.innerHTML = createStatusPill(patient.status);
    tr.appendChild(statusCell);

    const actionsCell = document.createElement('td');
    actionsCell.className = 'actions-cell';

    const detailsButton = document.createElement('button');
    detailsButton.className = 'btn ghost small';
    detailsButton.type = 'button';
    detailsButton.dataset.action = 'details';
    detailsButton.dataset.patientId = patient.id;
    detailsButton.textContent = 'Detalhes';

    const removeButton = document.createElement('button');
    removeButton.className = 'btn ghost danger small';
    removeButton.type = 'button';
    removeButton.dataset.action = 'remove';
    removeButton.dataset.patientId = patient.id;
    removeButton.textContent = 'Remover';

    actionsCell.append(detailsButton, removeButton);
    tr.appendChild(actionsCell);

    tbody.appendChild(tr);
  });

  if (!filtered.length) {
    const tr = document.createElement('tr');
    tr.innerHTML = '<td colspan="8">Nenhum paciente encontrado com os filtros aplicados.</td>';
    tbody.appendChild(tr);
  }
}

function setupNavigation() {
  const navLinks = document.querySelectorAll('.nav-link');
  const workspaces = document.querySelectorAll('.workspace');

  navLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      const target = link.dataset.target;

      navLinks.forEach((item) => item.classList.toggle('is-active', item === link));
      workspaces.forEach((panel) => {
        panel.classList.toggle('is-hidden', panel.dataset.panel !== target);
      });

      if (target === 'patients') {
        document.getElementById('patientFilter')?.focus({ preventScroll: true });
      }
    });
  });
}

function setupHelpDrawer() {
  const toggleButton = document.getElementById('toggleHelp');
  const closeButton = document.getElementById('closeHelp');
  const drawer = document.getElementById('helpDrawer');
  if (!toggleButton || !drawer) return;

  const toggleDrawer = (open) => {
    const isOpen = open ?? !drawer.classList.contains('is-open');
    drawer.classList.toggle('is-open', isOpen);
    drawer.setAttribute('aria-hidden', String(!isOpen));
    toggleButton.setAttribute('aria-expanded', String(isOpen));
  };

  toggleButton.addEventListener('click', () => toggleDrawer());
  closeButton?.addEventListener('click', () => toggleDrawer(false));
  drawer.addEventListener('click', (event) => {
    if (event.target === drawer) toggleDrawer(false);
  });

  state.helpDrawer = { toggleDrawer, element: drawer };
}

function setupModals() {
  const openButtons = document.querySelectorAll('[data-open-modal]');
  const closeButtons = document.querySelectorAll('[data-close-modal]');
  const handleBackdropClick = (event) => {
    if (event.target.classList.contains('modal')) {
      closeModal(event.target.id);
    }
  };

  openButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const modalId = button.dataset.openModal;
      const modal = document.getElementById(`modal-${modalId}`);
      if (!modal) return;
      if (!modal.dataset.boundBackdrop) {
        modal.addEventListener('click', handleBackdropClick);
        modal.dataset.boundBackdrop = 'true';
      }
      modal.hidden = false;
    });
  });

  closeButtons.forEach((button) => {
    button.addEventListener('click', (event) => {
      const modal = event.target.closest('.modal');
      if (modal) closeModal(modal.id);
    });
  });
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  modal.hidden = true;
}

function setupPatientForm() {
  const form = document.getElementById('patientForm');
  const patientFilter = document.getElementById('patientFilter');
  const riskFilter = document.getElementById('riskFilter');
  const statusFilter = document.getElementById('statusFilter');
  const clearFiltersButton = document.getElementById('clearFilters');
  if (!form) return;

  const filterAndRender = () => {
    const query = patientFilter?.value || '';
    const risk = riskFilter?.value || 'todos';
    const status = statusFilter?.value || 'todos';
    renderPatients({ query, risk, status });
  };

  patientFilter?.addEventListener('input', filterAndRender);
  riskFilter?.addEventListener('change', filterAndRender);
  statusFilter?.addEventListener('change', filterAndRender);

  clearFiltersButton?.addEventListener('click', () => {
    if (patientFilter) patientFilter.value = '';
    if (riskFilter) riskFilter.value = 'todos';
    if (statusFilter) statusFilter.value = 'todos';
    renderPatients({ query: '', risk: 'todos', status: 'todos' });
    showPatientNotice('Filtros limpos. Exibindo todos os pacientes.', 'info');
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const daysPostValue = Number.parseInt(String(formData.get('daysPost')), 10);
    const newPatient = {
      id: String(formData.get('patientId')).trim(),
      name: String(formData.get('patientName')).trim(),
      diagnosis: String(formData.get('diagnosis')).trim(),
      transplantType: String(formData.get('transplantType')).trim(),
      daysPost: daysPostValue,
      risk: String(formData.get('riskLevel')).toLowerCase(),
      status: String(formData.get('status')).trim(),
      notes: String(formData.get('notes')).trim()
    };

    if (!newPatient.id || !newPatient.name || !newPatient.diagnosis) {
      showPatientNotice('Preencha os campos obrigatórios para cadastrar o paciente.', 'warning');
      return;
    }

    if (!newPatient.transplantType) {
      showPatientNotice('Selecione o tipo de TCTH para continuar.', 'warning');
      return;
    }

    if (Number.isNaN(daysPostValue)) {
      showPatientNotice('Informe um valor válido para o dia pós-transplante.', 'warning');
      return;
    }

    const exists = state.patients.some((patient) => patient.id.toLowerCase() === newPatient.id.toLowerCase());
    if (exists) {
      showPatientNotice('Já existe um paciente com este ID em acompanhamento.', 'warning');
      return;
    }

    state.patients.unshift(newPatient);
    persistPatients(state.patients);
    form.reset();
    form.querySelector('input, select, textarea')?.focus();
    updateMetrics();
    filterAndRender();
    showPatientNotice('Paciente cadastrado com sucesso no prontuário de TCTH.', 'success');
  });

  const tableBody = document.getElementById('patientTableBody');
  tableBody?.addEventListener('click', (event) => {
    const actionButton = event.target instanceof HTMLElement ? event.target.closest('button[data-action]') : null;
    if (!actionButton) return;

    const { action, patientId } = actionButton.dataset;
    if (!patientId) return;

    const patient = state.patients.find((item) => item.id === patientId);
    if (!patient) return;

    if (action === 'remove') {
      const confirmation = window.confirm(`Remover o paciente ${patient.name} da base clínica?`);
      if (!confirmation) return;

      state.patients = state.patients.filter((item) => item.id !== patientId);
      persistPatients(state.patients);
      updateMetrics();
      filterAndRender();
      closeModal('modal-patientDetails');
      showPatientNotice(`Paciente ${patient.name} removido do prontuário.`, 'warning');
      return;
    }

    const modal = document.getElementById('modal-patientDetails');
    const container = document.getElementById('patientDetailsBody');
    if (!modal || !container) return;

    container.textContent = '';
    const detailList = document.createElement('dl');
    detailList.className = 'detail-list';

    const entries = [
      ['ID', patient.id],
      ['Paciente', patient.name],
      ['Diagnóstico', patient.diagnosis],
      ['Tipo de TCTH', patient.transplantType],
      ['Dias pós-transplante', `D${patient.daysPost >= 0 ? '+' : ''}${patient.daysPost}`],
      ['Estratificação', patient.risk],
      ['Status', patient.status],
      ['Observações', patient.notes || 'Nenhuma observação registrada.']
    ];

    entries.forEach(([label, value]) => {
      const wrapper = document.createElement('div');
      const term = document.createElement('dt');
      term.textContent = label;
      const description = document.createElement('dd');
      description.textContent = value;
      wrapper.append(term, description);
      detailList.appendChild(wrapper);
    });

    container.appendChild(detailList);
    modal.hidden = false;
    modal.addEventListener('click', (evt) => {
      if (evt.target === modal) closeModal(modal.id);
    }, { once: true });
  });
}

function setupQuickSearch() {
  const searchForm = document.querySelector('.hero-search');
  const quickSearchInput = document.getElementById('quickSearch');
  const patientFilter = document.getElementById('patientFilter');
  const riskFilter = document.getElementById('riskFilter');
  const statusFilter = document.getElementById('statusFilter');
  if (!searchForm || !quickSearchInput) return;

  searchForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const query = quickSearchInput.value;
    const patientsLink = document.querySelector('.nav-link[data-target="patients"]');
    patientsLink?.click();
    if (patientFilter) patientFilter.value = query;
    if (riskFilter) riskFilter.value = 'todos';
    if (statusFilter) statusFilter.value = 'todos';
    renderPatients({ query, risk: 'todos', status: 'todos' });
  });
}

function initialize() {
  applyTheme(state.theme);
  if (!storage) {
    console.info('Dados clínicos serão mantidos somente durante a sessão atual.');
  } else {
    try {
      const storedPatients = storage.getItem(STORAGE_KEYS.patients);
      if (!storedPatients) {
        persistPatients(state.patients);
      }
    } catch (error) {
      console.warn('Não foi possível inicializar o armazenamento de pacientes.', error);
    }
  }
  updateMetrics();
  renderPatients();
  setupNavigation();
  setupHelpDrawer();
  setupModals();
  setupPatientForm();
  setupQuickSearch();

  const themeToggle = document.getElementById('toggleTheme');
  themeToggle?.addEventListener('click', () => {
    state.theme = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(state.theme);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;

    const openModal = Array.from(document.querySelectorAll('.modal')).find((modal) => modal.hidden === false);
    if (openModal) {
      closeModal(openModal.id);
      return;
    }

    if (state.helpDrawer?.element?.classList.contains('is-open')) {
      state.helpDrawer.toggleDrawer(false);
    }
  });
}

document.addEventListener('DOMContentLoaded', initialize);

