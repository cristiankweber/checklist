const state = {
  theme: localStorage.getItem('ht-theme') || 'light',
  helpDrawer: null,
  patients: [
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
  ]
};

function applyTheme(theme) {
  document.body.dataset.theme = theme === 'dark' ? 'dark' : 'light';
  localStorage.setItem('ht-theme', document.body.dataset.theme);
  const themeToggle = document.getElementById('toggleTheme');
  if (themeToggle) {
    const isDark = document.body.dataset.theme === 'dark';
    themeToggle.setAttribute('aria-pressed', String(isDark));
    themeToggle.querySelector('.btn-label').textContent = isDark ? 'Modo claro' : 'Modo escuro';
    themeToggle.querySelector('.icon').textContent = isDark ? '☀️' : '🌙';
  }
}

function updateMetrics() {
  const metrics = {
    activePatients: state.patients.length,
    engraftmentRate: '92%',
    criticalAlerts: 3,
    complianceScore: '98%'
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
  span.dataset.level = risk;
  span.textContent = `Risco ${risk}`;
  return span.outerHTML;
}

function renderPatients({ query = '', risk = 'todos' } = {}) {
  const tbody = document.getElementById('patientTableBody');
  if (!tbody) return;

  const normalizedQuery = query.trim().toLowerCase();
  const filtered = state.patients.filter((patient) => {
    const matchesQuery = !normalizedQuery ||
      patient.id.toLowerCase().includes(normalizedQuery) ||
      patient.name.toLowerCase().includes(normalizedQuery) ||
      patient.diagnosis.toLowerCase().includes(normalizedQuery);

    const matchesRisk = risk === 'todos' || patient.risk === risk;
    return matchesQuery && matchesRisk;
  });

  tbody.innerHTML = '';
  filtered.forEach((patient) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${patient.id}</td>
      <td>${patient.name}</td>
      <td>${patient.diagnosis}</td>
      <td>${patient.transplantType}</td>
      <td>D${patient.daysPost >= 0 ? '+' : ''}${patient.daysPost}</td>
      <td>${createRiskBadge(patient.risk)}</td>
      <td>${createStatusPill(patient.status)}</td>
      <td><button class="btn ghost" type="button" data-patient-id="${patient.id}">Detalhes</button></td>
    `;
    tbody.appendChild(tr);
  });

  if (!filtered.length) {
    const tr = document.createElement('tr');
    tr.innerHTML = '<td colspan="8">Nenhum paciente encontrado com os filtros atuais.</td>';
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
  if (!form) return;

  const filterAndRender = () => {
    const query = patientFilter?.value || '';
    const risk = riskFilter?.value || 'todos';
    renderPatients({ query, risk });
  };

  patientFilter?.addEventListener('input', filterAndRender);
  riskFilter?.addEventListener('change', filterAndRender);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const newPatient = {
      id: String(formData.get('patientId')).trim(),
      name: String(formData.get('patientName')).trim(),
      diagnosis: String(formData.get('diagnosis')).trim(),
      transplantType: String(formData.get('transplantType')),
      daysPost: Number(formData.get('daysPost')),
      risk: String(formData.get('riskLevel')),
      status: String(formData.get('status')),
      notes: String(formData.get('notes')).trim()
    };

    if (!newPatient.id || !newPatient.name || !newPatient.diagnosis) {
      alert('Preencha os campos obrigatórios.');
      return;
    }

    const exists = state.patients.some((patient) => patient.id.toLowerCase() === newPatient.id.toLowerCase());
    if (exists) {
      alert('Já existe um paciente com este ID.');
      return;
    }

    state.patients.unshift(newPatient);
    form.reset();
    updateMetrics();
    filterAndRender();
  });

  document.getElementById('patientTableBody')?.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const patientId = target.dataset.patientId;
    if (!patientId) return;

    const patient = state.patients.find((item) => item.id === patientId);
    if (!patient) return;

    const modal = document.getElementById('modal-patientDetails');
    const container = document.getElementById('patientDetailsBody');
    if (!modal || !container) return;

    container.innerHTML = `
      <dl class="detail-list">
        <div><dt>ID</dt><dd>${patient.id}</dd></div>
        <div><dt>Paciente</dt><dd>${patient.name}</dd></div>
        <div><dt>Diagnóstico</dt><dd>${patient.diagnosis}</dd></div>
        <div><dt>Tipo de TCTH</dt><dd>${patient.transplantType}</dd></div>
        <div><dt>Dias pós-transplante</dt><dd>D${patient.daysPost >= 0 ? '+' : ''}${patient.daysPost}</dd></div>
        <div><dt>Estratificação</dt><dd>${patient.risk}</dd></div>
        <div><dt>Status</dt><dd>${patient.status}</dd></div>
        <div><dt>Observações</dt><dd>${patient.notes || 'Nenhuma observação registrada.'}</dd></div>
      </dl>
    `;
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
  if (!searchForm || !quickSearchInput) return;

  searchForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const query = quickSearchInput.value;
    const patientsLink = document.querySelector('.nav-link[data-target="patients"]');
    patientsLink?.click();
    if (patientFilter) {
      patientFilter.value = query;
      patientFilter.dispatchEvent(new Event('input'));
    }
  });
}

function initialize() {
  applyTheme(state.theme);
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

