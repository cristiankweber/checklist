const STORAGE_KEY = "tcth-registry-v1";
const charts = {};

const selectors = {
  patientTableBody: document.querySelector("#patientTableBody"),
  transplantTableBody: document.querySelector("#transplantTableBody"),
  followupList: document.querySelector("#followupList"),
  auditLog: document.querySelector("#auditLog"),
  timeline: document.querySelector("#timeline"),
  dashboardCards: document.querySelectorAll("[data-dashboard-card]")
};

const modals = {
  patient: document.querySelector("#patientModal"),
  transplant: document.querySelector("#transplantModal"),
  followup: document.querySelector("#followupModal"),
  compliance: document.querySelector("#complianceModal")
};

const forms = {
  patient: document.querySelector("#patientForm"),
  transplant: document.querySelector("#transplantForm"),
  followup: document.querySelector("#followupForm")
};

const buttons = {
  openPatient: document.querySelectorAll('[data-open-modal="patient"]'),
  openTransplant: document.querySelectorAll('[data-open-modal="transplant"]'),
  openFollowup: document.querySelectorAll('[data-open-modal="followup"]'),
  openCompliance: document.querySelectorAll('[data-open-modal="compliance"]'),
  exportJson: document.querySelector("#exportJson"),
  exportCsv: document.querySelector("#exportCsv"),
  resetDemo: document.querySelector("#resetDemoData"),
  toggleSidebar: document.querySelector("#toggleSidebar"),
  searchPatient: document.querySelector("#searchPatient")
};

const data = loadData();
render();

function loadData() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("Erro ao carregar dados locais", error);
  }
  return createDemoData();
}

function createDemoData() {
  const today = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  const formatDate = (date) => {
    const d = new Date(date);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };

  const patients = [
    {
      id: "P001",
      name: "Ana Beatriz Carvalho",
      gender: "Feminino",
      birthDate: "1992-04-18",
      diagnosis: "Leucemia Mieloide Aguda",
      riskClass: "Alta",
      center: "Instituto Hemato Brasil",
      admissionDate: formatDate(new Date(today.getFullYear(), today.getMonth() - 2, 8)),
      notes: "Paciente com mutação FLT3, protocolo FLAG-IDA.",
      status: "Em acompanhamento"
    },
    {
      id: "P002",
      name: "Lucas Ribeiro Machado",
      gender: "Masculino",
      birthDate: "1987-11-03",
      diagnosis: "Linfoma de Hodgkin",
      riskClass: "Intermediária",
      center: "Hospital Vida Onco",
      admissionDate: formatDate(new Date(today.getFullYear(), today.getMonth() - 4, 15)),
      notes: "Autólogo, quimioterapia de resgate concluída.",
      status: "Em remissão"
    },
    {
      id: "P003",
      name: "Marina Costa Figueiredo",
      gender: "Feminino",
      birthDate: "1978-07-25",
      diagnosis: "Mieloma Múltiplo",
      riskClass: "Baixa",
      center: "Centro Transplante Avançado",
      admissionDate: formatDate(new Date(today.getFullYear(), today.getMonth() - 1, 2)),
      notes: "Mobilização com G-CSF e Plerixafor.",
      status: "Pré-TCTH"
    }
  ];

  const transplants = [
    {
      id: "TCTH-2024-001",
      patientId: "P001",
      donorType: "Alogênico aparentado",
      graftSource: "Medula Óssea",
      conditioning: "FLAG-IDA + BuCy",
      infusionDate: formatDate(new Date(today.getFullYear(), today.getMonth() - 1, 12)),
      engraftmentDate: formatDate(new Date(today.getFullYear(), today.getMonth(), 1)),
      cmvStatus: "Negativo",
      aboi: "Compatível",
      status: "Pós-engraftment"
    },
    {
      id: "TCTH-2024-002",
      patientId: "P002",
      donorType: "Autólogo",
      graftSource: "Células periféricas",
      conditioning: "BEAM",
      infusionDate: formatDate(new Date(today.getFullYear(), today.getMonth() - 2, 24)),
      engraftmentDate: formatDate(new Date(today.getFullYear(), today.getMonth() - 1, 5)),
      cmvStatus: "Negativo",
      aboi: "Compatível",
      status: "Alta hospitalar"
    }
  ];

  const followups = [
    {
      id: crypto.randomUUID(),
      patientId: "P001",
      type: "Consulta",
      date: formatDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5)),
      professional: "Dr. João Martins",
      summary: "Avaliação pós-engraftment, coletar sorologias e ajustar tacrolimo.",
      status: "Programado"
    },
    {
      id: crypto.randomUUID(),
      patientId: "P002",
      type: "Exame",
      date: formatDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 12)),
      professional: "Enf. Paula Lima",
      summary: "Coleta de PCR-CMV e painel viral.",
      status: "Programado"
    }
  ];

  const compliance = {
    lgpd: true,
    hipaa: false,
    anvisa: true,
    riskNotes: [
      "Plano de resposta a incidentes precisa ser revisado.",
      "Auditoria de acesso em andamento (prazo 30 dias)."
    ]
  };

  const auditTrail = [
    {
      date: new Date().toISOString(),
      author: "Sistema",
      description: "Base demonstrativa inicial criada."
    }
  ];

  const settings = {
    theme: "light",
    version: "1.0.0",
    lastSync: new Date().toISOString(),
    dataOwner: "Coordenador TCTH",
    contact: "suporte@tcth.digital"
  };

  return { patients, transplants, followups, compliance, auditTrail, settings };
}

function persist() {
  try {
    data.settings.lastSync = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Erro ao salvar dados locais", error);
  }
}

function render() {
  renderDashboard();
  renderPatients();
  renderTransplants();
  renderFollowups();
  renderTimeline();
  renderAudit();
  renderComplianceStatus();
  updatePatientSelects();
  updateCharts();
}

function renderDashboard() {
  const totalPatients = data.patients.length;
  const activeTransplants = data.transplants.filter((item) => item.status !== "Alta hospitalar").length;
  const upcomingFollowups = data.followups.filter((item) => new Date(item.date) >= startOfDay(new Date())).length;
  const engraftmentRate = calculateEngraftmentRate();

  updateDashboardCard("patients", totalPatients);
  updateDashboardCard("transplants", activeTransplants);
  updateDashboardCard("followups", upcomingFollowups);
  updateDashboardCard("engraftment", `${engraftmentRate}%`);

  document.querySelector("#lastSyncValue").textContent = formatDateTime(data.settings.lastSync);
}

function updateDashboardCard(type, value) {
  const element = document.querySelector(`[data-dashboard-card="${type}"]`);
  if (element) {
    element.querySelector(".card__value").textContent = value;
  }
}

function calculateEngraftmentRate() {
  if (!data.transplants.length) return 0;
  const engrafted = data.transplants.filter((item) => item.engraftmentDate).length;
  return Math.round((engrafted / data.transplants.length) * 100);
}

function renderPatients(filterText = "") {
  const fragment = document.createDocumentFragment();
  const normalized = filterText.trim().toLowerCase();

  window.tcthPatients = data.patients.map((patient) => ({
    id: patient.id,
    name: patient.name
  }));

  data.patients
    .filter((patient) => {
      if (!normalized) return true;
      return (
        patient.id.toLowerCase().includes(normalized) ||
        patient.name.toLowerCase().includes(normalized) ||
        patient.diagnosis.toLowerCase().includes(normalized)
      );
    })
    .forEach((patient) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>
          <strong>${patient.name}</strong>
          <div class="form__hint">${patient.id}</div>
        </td>
        <td>${patient.diagnosis}</td>
        <td>
          <span class="tag ${tagByRisk(patient.riskClass)}">${patient.riskClass}</span>
        </td>
        <td>${patient.status}</td>
        <td>${formatDate(patient.admissionDate)}</td>
      `;
      fragment.appendChild(tr);
    });

  selectors.patientTableBody.innerHTML = "";
  selectors.patientTableBody.appendChild(fragment);
}

function updatePatientSelects() {
  const selects = document.querySelectorAll("[data-patient-select]");
  if (!selects.length) return;

  const options = data.patients
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((patient) => ({
      value: patient.id,
      label: `${patient.name} (${patient.id})`
    }));

  selects.forEach((select) => {
    const current = select.value;
    select.innerHTML = '<option value="">Selecione</option>';
    options.forEach((option) => {
      const element = document.createElement("option");
      element.value = option.value;
      element.textContent = option.label;
      select.appendChild(element);
    });
    if (options.some((option) => option.value === current)) {
      select.value = current;
    }
  });
}

function tagByRisk(risk) {
  switch (risk) {
    case "Alta":
      return "tag--danger";
    case "Intermediária":
      return "tag--info";
    default:
      return "tag--neutral";
  }
}

function renderTransplants() {
  const fragment = document.createDocumentFragment();
  data.transplants.forEach((transplant) => {
    const patient = data.patients.find((item) => item.id === transplant.patientId);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${transplant.id}</td>
      <td>${patient ? patient.name : "Paciente não localizado"}</td>
      <td>${transplant.donorType}</td>
      <td>${transplant.graftSource}</td>
      <td>${formatDate(transplant.infusionDate)}</td>
      <td>${transplant.status}</td>
    `;
    fragment.appendChild(tr);
  });
  selectors.transplantTableBody.innerHTML = "";
  selectors.transplantTableBody.appendChild(fragment);
}

function renderFollowups() {
  selectors.followupList.innerHTML = "";
  if (!data.followups.length) {
    selectors.followupList.innerHTML = `<div class="empty-state">Sem acompanhamentos programados.</div>`;
    return;
  }

  const sorted = [...data.followups].sort((a, b) => new Date(a.date) - new Date(b.date));

  sorted.forEach((followup) => {
    const patient = data.patients.find((item) => item.id === followup.patientId);
    const element = document.createElement("article");
    element.className = "list__item";
    element.innerHTML = `
      <div class="list__item-content">
        <h4>${followup.type} — ${formatDate(followup.date)}</h4>
        <p>${patient ? patient.name : "Paciente não localizado"} · Responsável: ${followup.professional}</p>
        <p>${followup.summary}</p>
      </div>
      <span class="tag ${followup.status === "Programado" ? "tag--info" : "tag--success"}">${followup.status}</span>
    `;
    selectors.followupList.appendChild(element);
  });
}

function renderTimeline() {
  selectors.timeline.innerHTML = "";

  const timelineEvents = data.transplants
    .flatMap((transplant) => {
      const patient = data.patients.find((item) => item.id === transplant.patientId);
      const events = [
        {
          date: transplant.infusionDate,
          title: `Infusão de células (${transplant.id})`,
          description: `${patient ? patient.name : transplant.patientId} · ${transplant.conditioning}`
        }
      ];
      if (transplant.engraftmentDate) {
        events.push({
          date: transplant.engraftmentDate,
          title: "Engraftment",
          description: `CD34+ monitorado · Status atual: ${transplant.status}`
        });
      }
      return events;
    })
    .concat(
      data.followups.map((followup) => ({
        date: followup.date,
        title: `Acompanhamento (${followup.type})`,
        description: followup.summary
      }))
    )
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  timelineEvents.forEach((event) => {
    const article = document.createElement("article");
    article.className = "timeline__item";
    article.innerHTML = `
      <div class="timeline__item-date">${formatDate(event.date)}</div>
      <div class="timeline__item-card">
        <h4>${event.title}</h4>
        <p>${event.description}</p>
      </div>
    `;
    selectors.timeline.appendChild(article);
  });
}

function renderAudit() {
  selectors.auditLog.innerHTML = "";
  const sorted = [...data.auditTrail].sort((a, b) => new Date(b.date) - new Date(a.date));
  sorted.slice(0, 6).forEach((log) => {
    const entry = document.createElement("div");
    entry.className = "log__item";
    entry.innerHTML = `
      <strong>${formatDateTime(log.date)}</strong>
      <div>${log.author}</div>
      <p>${log.description}</p>
    `;
    selectors.auditLog.appendChild(entry);
  });
}

function renderComplianceStatus() {
  const complianceCards = document.querySelectorAll("[data-compliance-card]");
  complianceCards.forEach((card) => {
    const type = card.dataset.complianceCard;
    const status = data.compliance[type];
    const badge = card.querySelector(".badge");
    if (!badge) return;
    if (status) {
      badge.textContent = "Conforme";
      badge.classList.remove("badge--warning");
      badge.classList.add("badge--accent");
    } else {
      badge.textContent = "Pendência";
      badge.classList.remove("badge--accent");
      badge.classList.add("badge--warning");
    }
  });

  const riskList = document.querySelector("#riskNotes");
  riskList.innerHTML = "";
  if (!data.compliance.riskNotes.length) {
    riskList.innerHTML = "<li>Sem riscos registrados.</li>";
  } else {
    data.compliance.riskNotes.forEach((note) => {
      const li = document.createElement("li");
      li.textContent = note;
      riskList.appendChild(li);
    });
  }
}

function updateCharts() {
  const ctxVolume = document.querySelector("#volumeChart");
  const ctxEngraft = document.querySelector("#engraftmentChart");

  if (!ctxVolume || !ctxEngraft) return;

  const monthly = aggregateByMonth(data.transplants, "infusionDate");
  const labels = monthly.map((item) => item.label);
  const values = monthly.map((item) => item.count);

  if (charts.volume) {
    charts.volume.data.labels = labels;
    charts.volume.data.datasets[0].data = values;
    charts.volume.update();
  } else {
    charts.volume = new Chart(ctxVolume, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "TCTH realizados",
            data: values,
            backgroundColor: "rgba(37, 99, 235, 0.7)",
            borderRadius: 8
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0
            }
          }
        }
      }
    });
  }

  const engraftmentSeries = aggregateByMonth(data.transplants.filter((item) => item.engraftmentDate), "engraftmentDate");
  const engraftLabels = engraftmentSeries.map((item) => item.label);
  const engraftValues = engraftmentSeries.map((item) => item.count);

  if (charts.engraftment) {
    charts.engraftment.data.labels = engraftLabels;
    charts.engraftment.data.datasets[0].data = engraftValues;
    charts.engraftment.update();
  } else {
    charts.engraftment = new Chart(ctxEngraft, {
      type: "line",
      data: {
        labels: engraftLabels,
        datasets: [
          {
            label: "Engraftments",
            data: engraftValues,
            borderColor: "#10b981",
            backgroundColor: "rgba(16, 185, 129, 0.2)",
            tension: 0.4,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false }
        }
      }
    });
  }
}

function aggregateByMonth(collection, key) {
  const map = new Map();
  collection.forEach((item) => {
    const date = new Date(item[key]);
    const label = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    map.set(label, (map.get(label) || 0) + 1);
  });

  return Array.from(map.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

function openModal(modal) {
  modal?.classList.add("is-open");
}

function closeModal(modal) {
  modal?.classList.remove("is-open");
}

function registerModalEvents() {
  document.querySelectorAll("[data-modal-close]").forEach((button) => {
    button.addEventListener("click", () => {
      const modalId = button.dataset.modalClose;
      closeModal(modals[modalId]);
    });
  });

  document.querySelectorAll(".modal").forEach((modal) => {
    modal.addEventListener("click", (event) => {
      if (event.target === modal) {
        modal.classList.remove("is-open");
      }
    });
  });
}

function registerButtonEvents() {
  buttons.openPatient.forEach((btn) => btn.addEventListener("click", () => openModal(modals.patient)));
  buttons.openTransplant.forEach((btn) => btn.addEventListener("click", () => openModal(modals.transplant)));
  buttons.openFollowup.forEach((btn) => btn.addEventListener("click", () => openModal(modals.followup)));
  buttons.openCompliance.forEach((btn) => btn.addEventListener("click", () => openModal(modals.compliance)));

  buttons.exportJson?.addEventListener("click", exportJson);
  buttons.exportCsv?.addEventListener("click", exportCsv);
  buttons.resetDemo?.addEventListener("click", resetDemoData);
  buttons.searchPatient?.addEventListener("input", (event) => renderPatients(event.target.value));
}

function registerFormEvents() {
  forms.patient?.addEventListener("submit", handlePatientSubmit);
  forms.transplant?.addEventListener("submit", handleTransplantSubmit);
  forms.followup?.addEventListener("submit", handleFollowupSubmit);
}

function handlePatientSubmit(event) {
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());

  const newPatient = {
    id: payload.id.trim(),
    name: payload.name.trim(),
    gender: payload.gender,
    birthDate: payload.birthDate,
    diagnosis: payload.diagnosis.trim(),
    riskClass: payload.riskClass,
    center: payload.center.trim(),
    admissionDate: payload.admissionDate,
    notes: payload.notes.trim(),
    status: payload.status
  };

  data.patients.push(newPatient);
  data.auditTrail.push(createAudit(`Paciente ${newPatient.name} (${newPatient.id}) cadastrado.`));
  persist();
  render();
  form.reset();
  closeModal(modals.patient);
}

function handleTransplantSubmit(event) {
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());

  const newTransplant = {
    id: payload.id.trim(),
    patientId: payload.patientId,
    donorType: payload.donorType,
    graftSource: payload.graftSource,
    conditioning: payload.conditioning.trim(),
    infusionDate: payload.infusionDate,
    engraftmentDate: payload.engraftmentDate,
    cmvStatus: payload.cmvStatus,
    aboi: payload.aboi,
    status: payload.status
  };

  data.transplants.push(newTransplant);
  data.auditTrail.push(createAudit(`TCTH ${newTransplant.id} registrado para o paciente ${newTransplant.patientId}.`));
  persist();
  render();
  form.reset();
  closeModal(modals.transplant);
}

function handleFollowupSubmit(event) {
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());

  const newFollowup = {
    id: crypto.randomUUID(),
    patientId: payload.patientId,
    type: payload.type,
    date: payload.date,
    professional: payload.professional.trim(),
    summary: payload.summary.trim(),
    status: payload.status
  };

  data.followups.push(newFollowup);
  data.auditTrail.push(createAudit(`Seguimento ${newFollowup.type} agendado para ${newFollowup.patientId}.`));
  persist();
  render();
  form.reset();
  closeModal(modals.followup);
}

function exportJson() {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  downloadBlob(blob, `tcth-registro-${Date.now()}.json`);
  data.auditTrail.push(createAudit("Exportação JSON realizada."));
  persist();
  renderAudit();
}

function exportCsv() {
  const headers = ["Paciente", "Diagnóstico", "Risco", "Status", "Infusão", "Engraftment"];
  const rows = data.transplants.map((transplant) => {
    const patient = data.patients.find((item) => item.id === transplant.patientId);
    return [
      patient ? patient.name : transplant.patientId,
      patient ? patient.diagnosis : "-",
      patient ? patient.riskClass : "-",
      transplant.status,
      formatDate(transplant.infusionDate),
      transplant.engraftmentDate ? formatDate(transplant.engraftmentDate) : "—"
    ].join(",");
  });

  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  downloadBlob(blob, `tcth-transplantes-${Date.now()}.csv`);
  data.auditTrail.push(createAudit("Exportação CSV realizada."));
  persist();
  renderAudit();
}

function downloadBlob(blob, filename) {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

function resetDemoData() {
  if (!confirm("Deseja realmente restaurar a base demonstrativa?")) return;
  const demo = createDemoData();
  Object.assign(data, demo);
  persist();
  render();
}

function createAudit(description) {
  return {
    date: new Date().toISOString(),
    author: "Usuário logado",
    description
  };
}

function startOfDay(date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(date);
}

function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function initAccessibility() {
  document.querySelectorAll("[data-tooltip]").forEach((element) => {
    const title = element.getAttribute("data-tooltip");
    element.setAttribute("aria-label", title);
  });
}

function initSecurityChecklist() {
  const checklist = document.querySelector("#securityChecklist");
  if (!checklist) return;
  const items = [
    "Autenticação multifator para equipe clínica",
    "Criptografia AES-256 em repouso e TLS 1.3 em trânsito",
    "Controle de acesso baseado em papéis (RBAC)",
    "Backups diários com retenção de 5 anos",
    "Monitoramento contínuo com alertas de comportamento anômalo"
  ];

  checklist.innerHTML = "";
  items.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    checklist.appendChild(li);
  });
}

function initRegulatoryLinks() {
  const links = document.querySelector("#regulatoryLinks");
  if (!links) return;
  const resources = [
    {
      label: "RDC 508/2021 – Boas práticas em células humanas",
      url: "https://www.gov.br/anvisa"
    },
    {
      label: "LGPD – Lei Geral de Proteção de Dados",
      url: "https://www.gov.br/governodigital/pt-br/seguranca-e-privacidade"
    },
    {
      label: "Diretrizes internacionais FACT-JACIE",
      url: "https://accreditation.factwebsite.org/"
    }
  ];

  links.innerHTML = "";
  resources.forEach((resource) => {
    const li = document.createElement("li");
    const anchor = document.createElement("a");
    anchor.href = resource.url;
    anchor.target = "_blank";
    anchor.rel = "noopener";
    anchor.textContent = resource.label;
    li.appendChild(anchor);
    links.appendChild(li);
  });
}

function init() {
  registerModalEvents();
  registerButtonEvents();
  registerFormEvents();
  initAccessibility();
  initSecurityChecklist();
  initRegulatoryLinks();
}

init();
