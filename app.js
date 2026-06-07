const DB_NAME = "orcamento-do-casal";
const DB_VERSION = 1;
const STORE_NAME = "state";
const STATE_KEY = "main";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const palette = ["#29635a", "#7b4f2f", "#445e91", "#986b1f", "#7d4965", "#527144", "#b44a3c"];
const iconPaths = {
  check: ["M20 6 9 17l-5-5"],
  chevronLeft: ["M15 18l-6-6 6-6"],
  chevronRight: ["M9 18l6-6-6-6"],
  download: ["M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", "M7 10l5 5 5-5", "M12 15V3"],
  pencil: ["M12 20h9", "M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"],
  plus: ["M12 5v14", "M5 12h14"],
  receipt: ["M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2Z", "M8 7h8", "M8 11h8", "M8 15h5"],
  trash: ["M3 6h18", "M8 6V4h8v2", "M19 6l-1 14H6L5 6", "M10 11v6", "M14 11v6"],
  upload: ["M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", "M17 8l-5-5-5 5", "M12 3v12"],
  wallet: ["M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4", "M3 7h16a2 2 0 0 1 2 2v3h-5a2 2 0 0 0 0 4h5", "M16 12h.01"],
  x: ["M18 6 6 18", "M6 6l12 12"],
};
const CATEGORY_PAGE_SIZE = 5;
const EXPENSE_PAGE_SIZE = 8;

const elements = {
  periodSelect: document.querySelector("#periodSelect"),
  newPeriodButton: document.querySelector("#newPeriodButton"),
  editPeriodButton: document.querySelector("#editPeriodButton"),
  backupButton: document.querySelector("#backupButton"),
  importFile: document.querySelector("#importFile"),
  metricBudget: document.querySelector("#metricBudget"),
  metricIncome: document.querySelector("#metricIncome"),
  metricSpent: document.querySelector("#metricSpent"),
  metricRemaining: document.querySelector("#metricRemaining"),
  metricUsage: document.querySelector("#metricUsage"),
  metricNet: document.querySelector("#metricNet"),
  expenseForm: document.querySelector("#expenseForm"),
  expenseDate: document.querySelector("#expenseDate"),
  expensePerson: document.querySelector("#expensePerson"),
  expenseCategory: document.querySelector("#expenseCategory"),
  expenseAmount: document.querySelector("#expenseAmount"),
  expenseDescription: document.querySelector("#expenseDescription"),
  expenseFormTab: document.querySelector("#expenseFormTab"),
  incomeFormTab: document.querySelector("#incomeFormTab"),
  expenseFormPanel: document.querySelector("#expenseFormPanel"),
  incomeFormPanel: document.querySelector("#incomeFormPanel"),
  incomeForm: document.querySelector("#incomeForm"),
  incomeId: document.querySelector("#incomeId"),
  incomeDate: document.querySelector("#incomeDate"),
  incomePerson: document.querySelector("#incomePerson"),
  incomeFrequency: document.querySelector("#incomeFrequency"),
  incomeEndDate: document.querySelector("#incomeEndDate"),
  incomeAmount: document.querySelector("#incomeAmount"),
  incomeDescription: document.querySelector("#incomeDescription"),
  incomeSubmitButton: document.querySelector("#incomeSubmitButton"),
  incomeCancelEditButton: document.querySelector("#incomeCancelEditButton"),
  incomesList: document.querySelector("#incomesList"),
  categoryBoard: document.querySelector("#categoryBoard"),
  categorySort: document.querySelector("#categorySort"),
  categoryPagination: document.querySelector("#categoryPagination"),
  peopleList: document.querySelector("#peopleList"),
  expensesList: document.querySelector("#expensesList"),
  expensesPagination: document.querySelector("#expensesPagination"),
  expensesHistoryTab: document.querySelector("#expensesHistoryTab"),
  incomesHistoryTab: document.querySelector("#incomesHistoryTab"),
  expensesHistoryPanel: document.querySelector("#expensesHistoryPanel"),
  incomesHistoryPanel: document.querySelector("#incomesHistoryPanel"),
  allPeopleFilter: document.querySelector("#allPeopleFilter"),
  newCategoryButton: document.querySelector("#newCategoryButton"),
  newPersonButton: document.querySelector("#newPersonButton"),
  periodDialog: document.querySelector("#periodDialog"),
  periodForm: document.querySelector("#periodForm"),
  periodDialogTitle: document.querySelector("#periodDialogTitle"),
  periodId: document.querySelector("#periodId"),
  periodName: document.querySelector("#periodName"),
  periodStart: document.querySelector("#periodStart"),
  periodEnd: document.querySelector("#periodEnd"),
  categoryDialog: document.querySelector("#categoryDialog"),
  categoryForm: document.querySelector("#categoryForm"),
  categoryDialogTitle: document.querySelector("#categoryDialogTitle"),
  categoryId: document.querySelector("#categoryId"),
  categoryName: document.querySelector("#categoryName"),
  categoryBudget: document.querySelector("#categoryBudget"),
  categoryColor: document.querySelector("#categoryColor"),
  allocationFields: document.querySelector("#allocationFields"),
  splitEvenlyButton: document.querySelector("#splitEvenlyButton"),
  personDialog: document.querySelector("#personDialog"),
  personForm: document.querySelector("#personForm"),
  personId: document.querySelector("#personId"),
  personName: document.querySelector("#personName"),
  toast: document.querySelector("#toast"),
};

let db;
let appState = null;
let activePersonFilter = "all";
let activeEntryTab = "expense";
let activeHistoryTab = "expenses";
let categoryPage = 1;
let expensePage = 1;
let toastTimer;

function createId(prefix) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function toMoney(value) {
  return currencyFormatter.format(Number(value) || 0);
}

function parseMoneyInput(value) {
  const raw = String(value || "").trim();
  const normalized = raw.includes(",") ? raw.replace(/\./g, "").replace(",", ".") : raw;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatDateInput(date) {
  return date.toISOString().slice(0, 10);
}

function addMonths(date, months) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function addSeconds(date, seconds) {
  return new Date(date.getTime() + seconds * 1000);
}

function todayInput() {
  return formatDateInput(new Date());
}

function parseInputDate(value) {
  return new Date(`${value}T00:00:00`);
}

function getLastDayOfMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function getMonthlyDate(year, monthIndex, preferredDay) {
  const day = Math.min(preferredDay, getLastDayOfMonth(year, monthIndex));
  return new Date(year, monthIndex, day);
}

function isDateInRange(date, start, end) {
  return date >= start && date <= end;
}

function formatPeriodLabel(period) {
  const start = dateFormatter.format(new Date(`${period.startDate}T00:00:00`));
  const end = dateFormatter.format(new Date(`${period.endDate}T00:00:00`));
  return `${period.name} · ${start} a ${end}`;
}

function getCurrentPeriod() {
  return appState.periods.find((period) => period.id === appState.activePeriodId) || appState.periods[0];
}

function getPeriodCategories() {
  const period = getCurrentPeriod();
  return appState.categories.filter((category) => category.periodId === period?.id);
}

function getPeriodExpenses() {
  const period = getCurrentPeriod();
  return appState.expenses.filter((expense) => expense.periodId === period?.id);
}

function getPeriodIncomes() {
  const period = getCurrentPeriod();
  return appState.incomes.filter((income) => income.periodId === period?.id);
}

function getPersonName(personId) {
  return appState.people.find((person) => person.id === personId)?.name || "Pessoa removida";
}

function getCategory(categoryId) {
  return appState.categories.find((category) => category.id === categoryId);
}

function getCategoryName(categoryId) {
  return getCategory(categoryId)?.name || "Categoria removida";
}

function getIncome(incomeId) {
  return appState.incomes.find((income) => income.id === incomeId);
}

function sum(values) {
  return values.reduce((total, value) => total + (Number(value) || 0), 0);
}

function showToast(message) {
  window.clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.classList.add("visible");
  toastTimer = window.setTimeout(() => {
    elements.toast.classList.remove("visible");
  }, 2800);
}

function createIcon(name) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("aria-hidden", "true");
  svg.classList.add("button-icon");

  (iconPaths[name] || []).forEach((pathData) => {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", pathData);
    svg.append(path);
  });

  return svg;
}

function setButtonContent(button, label, iconName = button.dataset.icon, iconOnly = false) {
  button.replaceChildren();

  if (iconName) {
    button.append(createIcon(iconName));
  }

  const labelEl = document.createElement("span");
  labelEl.className = "button-label";
  labelEl.textContent = label;
  button.append(labelEl);

  button.title = label;
  if (iconOnly) {
    button.classList.add("icon-only");
    button.setAttribute("aria-label", label);
  }
}

function decorateStaticButtons() {
  document.querySelectorAll("[data-icon]").forEach((button) => {
    const label = button.textContent.trim();
    setButtonContent(button, label, button.dataset.icon);
  });
}

function makeIconAction(label, iconName, variant = "") {
  const button = document.createElement("button");
  button.className = `link-button icon-only ${variant}`.trim();
  button.type = "button";
  setButtonContent(button, label, iconName, true);
  return button;
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function readState() {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(STATE_KEY);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

function writeState() {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(appState, STATE_KEY);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

function createInitialState() {
  const now = new Date();
  const startDate = formatDateInput(now);
  const endDate = formatDateInput(addMonths(now, 7));
  const periodId = createId("period");
  const personOne = createId("person");
  const personTwo = createId("person");

  const people = [
    { id: personOne, name: "Pessoa 1" },
    { id: personTwo, name: "Pessoa 2" },
  ];

  const createdAt = new Date().toISOString();
  const createCategory = (name, budget, color, allocationOne, allocationTwo, order) => ({
    id: createId("category"),
    periodId,
    name,
    budget,
    color,
    createdAt: addSeconds(new Date(createdAt), order).toISOString(),
    allocations: {
      [personOne]: allocationOne,
      [personTwo]: allocationTwo,
    },
  });

  return {
    version: 2,
    activePeriodId: periodId,
    people,
    periods: [
      {
        id: periodId,
        name: "Orçamento de 7 meses",
        startDate,
        endDate,
        createdAt,
      },
    ],
    categories: [
      createCategory("Mercado", 0, palette[0], 0, 0, 0),
      createCategory("Vestimenta", 0, palette[2], 0, 0, 1),
      createCategory("Calçado", 900, palette[3], 450, 450, 2),
      createCategory("Reforma da casa", 0, palette[4], 0, 0, 3),
    ],
    expenses: [],
    incomes: [],
    createdAt,
    updatedAt: createdAt,
  };
}

function normalizeState(state) {
  const fallback = createInitialState();
  const normalized = {
    ...fallback,
    ...state,
    people: Array.isArray(state?.people) ? state.people : fallback.people,
    periods: Array.isArray(state?.periods) ? state.periods : fallback.periods,
    categories: Array.isArray(state?.categories) ? state.categories : fallback.categories,
    expenses: Array.isArray(state?.expenses) ? state.expenses : fallback.expenses,
    incomes: Array.isArray(state?.incomes) ? state.incomes : [],
  };

  const baseDate = new Date(normalized.createdAt || new Date().toISOString());

  normalized.periods = normalized.periods.map((period, index) => ({
    createdAt: addSeconds(baseDate, index).toISOString(),
    ...period,
  }));

  normalized.categories = normalized.categories.map((category, index) => ({
    createdAt: addSeconds(baseDate, index).toISOString(),
    allocations: {},
    ...category,
    allocations: category.allocations || {},
  }));

  normalized.expenses = normalized.expenses.map((expense, index) => ({
    createdAt: addSeconds(baseDate, index).toISOString(),
    ...expense,
  }));

  normalized.incomes = normalized.incomes.map((income, index) => ({
    id: income.id || createId("income"),
    periodId: income.periodId || normalized.activePeriodId,
    personId: income.personId || normalized.people[0]?.id || "",
    description: income.description || "Entrada",
    amount: Number(income.amount) || 0,
    frequency: income.frequency === "once" ? "once" : "monthly",
    date: income.date || normalized.periods[0]?.startDate || todayInput(),
    endDate: income.endDate || "",
    createdAt: income.createdAt || addSeconds(baseDate, index).toISOString(),
  }));

  normalized.version = 2;
  normalized.activePeriodId = normalized.activePeriodId || normalized.periods[0]?.id;
  normalized.updatedAt = normalized.updatedAt || new Date().toISOString();

  return normalized;
}

async function persistAndRender(message) {
  appState.updatedAt = new Date().toISOString();
  await writeState();
  render();
  if (message) {
    showToast(message);
  }
}

function ensureActivePeriod() {
  if (!appState.periods.length) {
    const fallback = createInitialState();
    appState.periods = fallback.periods;
    appState.activePeriodId = fallback.activePeriodId;
  }

  if (!appState.periods.some((period) => period.id === appState.activePeriodId)) {
    appState.activePeriodId = appState.periods[0].id;
  }
}

function getCategorySpent(categoryId, personId = null) {
  return getPeriodExpenses()
    .filter((expense) => expense.categoryId === categoryId)
    .filter((expense) => !personId || expense.personId === personId)
    .reduce((total, expense) => total + Number(expense.amount), 0);
}

function getAllocatedBudget(category, personId = null) {
  if (!personId) {
    return Number(category.budget) || 0;
  }

  return Number(category.allocations?.[personId]) || 0;
}

function getIncomeOccurrences(income, period = getCurrentPeriod()) {
  if (!period || !income.date) {
    return [];
  }

  const periodStart = parseInputDate(period.startDate);
  const periodEnd = parseInputDate(period.endDate);
  const incomeStart = parseInputDate(income.date);
  const incomeEnd = income.endDate ? parseInputDate(income.endDate) : periodEnd;
  const firstDate = incomeStart > periodStart ? incomeStart : periodStart;
  const lastDate = incomeEnd < periodEnd ? incomeEnd : periodEnd;

  if (lastDate < firstDate) {
    return [];
  }

  if (income.frequency === "once") {
    return isDateInRange(incomeStart, periodStart, periodEnd)
      ? [{ ...income, occurrenceDate: income.date, occurrenceAmount: Number(income.amount) || 0 }]
      : [];
  }

  const occurrences = [];
  const preferredDay = incomeStart.getDate();
  let cursor = new Date(firstDate.getFullYear(), firstDate.getMonth(), 1);

  while (cursor <= lastDate) {
    const occurrenceDate = getMonthlyDate(cursor.getFullYear(), cursor.getMonth(), preferredDay);
    if (occurrenceDate >= incomeStart && occurrenceDate >= periodStart && occurrenceDate <= lastDate) {
      occurrences.push({
        ...income,
        occurrenceDate: formatDateInput(occurrenceDate),
        occurrenceAmount: Number(income.amount) || 0,
      });
    }
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
  }

  return occurrences;
}

function getPeriodIncomeOccurrences() {
  const period = getCurrentPeriod();
  return getPeriodIncomes().flatMap((income) => getIncomeOccurrences(income, period));
}

function getPeriodIncomeTotal(personId = null) {
  return getPeriodIncomeOccurrences()
    .filter((income) => !personId || income.personId === personId)
    .reduce((total, income) => total + income.occurrenceAmount, 0);
}

function getPeriodTotals() {
  const categories = getPeriodCategories();
  const expenses = getPeriodExpenses();
  const budget = sum(categories.map((category) => category.budget));
  const spent = sum(expenses.map((expense) => expense.amount));
  const income = getPeriodIncomeTotal();
  const remaining = budget - spent;
  const net = income - spent;
  const usage = budget > 0 ? Math.round((spent / budget) * 100) : 0;

  return { budget, income, spent, remaining, net, usage };
}

function clearElement(element) {
  element.replaceChildren();
}

function makeOption(value, label) {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = label;
  return option;
}

function paginate(items, page, pageSize) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const start = (currentPage - 1) * pageSize;

  return {
    page: currentPage,
    totalPages,
    items: items.slice(start, start + pageSize),
  };
}

function renderPagination(container, totalItems, page, totalPages, onChange) {
  clearElement(container);

  if (totalItems <= 0 || totalPages <= 1) {
    return;
  }

  const previous = document.createElement("button");
  previous.className = "button ghost small";
  previous.type = "button";
  setButtonContent(previous, "Anterior", "chevronLeft", true);
  previous.disabled = page <= 1;
  previous.addEventListener("click", () => onChange(page - 1));

  const label = document.createElement("span");
  label.textContent = `${page} de ${totalPages}`;

  const next = document.createElement("button");
  next.className = "button ghost small";
  next.type = "button";
  setButtonContent(next, "Próxima", "chevronRight", true);
  next.disabled = page >= totalPages;
  next.addEventListener("click", () => onChange(page + 1));

  container.append(previous, label, next);
}

function renderPeriodSelect() {
  clearElement(elements.periodSelect);

  appState.periods.forEach((period) => {
    elements.periodSelect.append(makeOption(period.id, formatPeriodLabel(period)));
  });

  elements.periodSelect.value = getCurrentPeriod().id;
}

function renderSummary() {
  const totals = getPeriodTotals();

  elements.metricBudget.textContent = toMoney(totals.budget);
  elements.metricIncome.textContent = toMoney(totals.income);
  elements.metricSpent.textContent = toMoney(totals.spent);
  elements.metricRemaining.textContent = toMoney(totals.remaining);
  elements.metricUsage.textContent = `${totals.usage}%`;
  elements.metricNet.textContent = toMoney(totals.net);

  elements.metricRemaining.classList.toggle("status-danger", totals.remaining < 0);
  elements.metricNet.classList.toggle("status-danger", totals.net < 0);
  elements.metricNet.classList.toggle("status-ok", totals.net >= 0);
  elements.metricUsage.classList.toggle("status-warning", totals.usage >= 80 && totals.usage <= 100);
  elements.metricUsage.classList.toggle("status-danger", totals.usage > 100);
  elements.metricUsage.classList.toggle("status-ok", totals.usage < 80);
}

function renderExpenseFormOptions() {
  const selectedPerson = elements.expensePerson.value;
  const selectedCategory = elements.expenseCategory.value;

  clearElement(elements.expensePerson);
  clearElement(elements.expenseCategory);

  appState.people.forEach((person) => {
    elements.expensePerson.append(makeOption(person.id, person.name));
  });

  getPeriodCategories().forEach((category) => {
    elements.expenseCategory.append(makeOption(category.id, category.name));
  });

  if (appState.people.some((person) => person.id === selectedPerson)) {
    elements.expensePerson.value = selectedPerson;
  }

  if (getPeriodCategories().some((category) => category.id === selectedCategory)) {
    elements.expenseCategory.value = selectedCategory;
  }

  elements.expenseDate.value ||= todayInput();
  elements.expenseForm.querySelector("button[type='submit']").disabled = !appState.people.length || !getPeriodCategories().length;
}

function renderIncomeFormOptions() {
  const selectedPerson = elements.incomePerson.value;

  clearElement(elements.incomePerson);

  appState.people.forEach((person) => {
    elements.incomePerson.append(makeOption(person.id, person.name));
  });

  if (appState.people.some((person) => person.id === selectedPerson)) {
    elements.incomePerson.value = selectedPerson;
  }

  elements.incomeDate.value ||= getCurrentPeriod()?.startDate || todayInput();
  elements.incomeEndDate.disabled = elements.incomeFrequency.value === "once";
  elements.incomeForm.querySelector("button[type='submit']").disabled = !appState.people.length;
}

function createEmptyState(text) {
  const empty = document.createElement("div");
  empty.className = "empty-state";
  empty.textContent = text;
  return empty;
}

function getCategoryUsage(category) {
  const spent = getCategorySpent(category.id);
  return Number(category.budget) > 0 ? (spent / Number(category.budget)) * 100 : 0;
}

function getSortedCategories() {
  const sortBy = elements.categorySort.value;
  const categories = [...getPeriodCategories()];

  return categories.sort((a, b) => {
    if (sortBy === "usage") {
      return getCategoryUsage(b) - getCategoryUsage(a) || a.name.localeCompare(b.name, "pt-BR");
    }

    if (sortBy === "createdAt") {
      return b.createdAt.localeCompare(a.createdAt) || a.name.localeCompare(b.name, "pt-BR");
    }

    return a.name.localeCompare(b.name, "pt-BR");
  });
}

function renderCategoryBoard() {
  clearElement(elements.categoryBoard);
  const categories = getSortedCategories();
  const pagination = paginate(categories, categoryPage, CATEGORY_PAGE_SIZE);
  categoryPage = pagination.page;

  if (!categories.length) {
    elements.categoryBoard.append(createEmptyState("Nenhuma categoria neste período."));
    clearElement(elements.categoryPagination);
    return;
  }

  pagination.items.forEach((category) => {
    const spent = getCategorySpent(category.id);
    const remaining = Number(category.budget) - spent;
    const usage = Math.round(getCategoryUsage(category));
    const barColor = usage > 100 ? "var(--danger)" : usage >= 80 ? "var(--warning)" : category.color;

    const card = document.createElement("article");
    card.className = "category-card";

    const main = document.createElement("div");
    main.className = "category-main";

    const title = document.createElement("div");
    title.className = "category-title";

    const swatch = document.createElement("span");
    swatch.className = "swatch";
    swatch.style.background = category.color;

    const heading = document.createElement("h3");
    heading.textContent = category.name;

    const meta = document.createElement("span");
    meta.className = "category-meta";
    meta.textContent = `${usage}% usado · criada ${dateFormatter.format(new Date(category.createdAt))}`;

    title.append(swatch, heading, meta);

    const progress = document.createElement("div");
    progress.className = "progress";
    progress.style.setProperty("--progress", `${Math.max(0, usage)}%`);
    progress.style.setProperty("--bar-color", barColor);
    progress.append(document.createElement("span"));

    const numbers = document.createElement("div");
    numbers.className = "category-numbers";

    [
      ["Planejado", toMoney(category.budget)],
      ["Gasto", toMoney(spent)],
      ["Saldo", toMoney(remaining)],
    ].forEach(([label, value]) => {
      const cell = document.createElement("div");
      cell.className = "number-cell";
      const labelEl = document.createElement("span");
      labelEl.textContent = label;
      const valueEl = document.createElement("strong");
      valueEl.textContent = value;
      if (label === "Saldo" && remaining < 0) {
        valueEl.classList.add("status-danger");
      }
      cell.append(labelEl, valueEl);
      numbers.append(cell);
    });

    const allocations = document.createElement("div");
    allocations.className = "allocation-list";
    appState.people.forEach((person) => {
      const budget = getAllocatedBudget(category, person.id);
      const personSpent = getCategorySpent(category.id, person.id);
      const pill = document.createElement("span");
      pill.className = "pill";
      pill.textContent = `${person.name}: ${toMoney(personSpent)} / ${toMoney(budget)}`;
      allocations.append(pill);
    });

    main.append(title, progress, numbers, allocations);

    const actions = document.createElement("div");
    actions.className = "category-actions";

    const edit = makeIconAction(`Editar ${category.name}`, "pencil");
    edit.addEventListener("click", () => openCategoryDialog(category.id));

    const remove = makeIconAction(`Excluir ${category.name}`, "trash", "danger");
    remove.addEventListener("click", () => deleteCategory(category.id));

    actions.append(edit, remove);
    card.append(main, actions);
    elements.categoryBoard.append(card);
  });

  renderPagination(elements.categoryPagination, categories.length, pagination.page, pagination.totalPages, (page) => {
    categoryPage = page;
    renderCategoryBoard();
  });
}

function renderPeople() {
  clearElement(elements.peopleList);

  if (!appState.people.length) {
    elements.peopleList.append(createEmptyState("Adicione uma pessoa para lançar gastos."));
    return;
  }

  appState.people.forEach((person) => {
    const row = document.createElement("div");
    row.className = "person-row";

    const info = document.createElement("div");
    const name = document.createElement("strong");
    name.textContent = person.name;
    const spent = sum(getPeriodExpenses().filter((expense) => expense.personId === person.id).map((expense) => expense.amount));
    const income = getPeriodIncomeTotal(person.id);
    const stats = document.createElement("div");
    stats.className = "person-stats";

    [
      ["Entradas", toMoney(income)],
      ["Gastos", toMoney(spent)],
    ].forEach(([label, value]) => {
      const line = document.createElement("div");
      line.className = "person-stat";
      const labelEl = document.createElement("span");
      labelEl.textContent = label;
      const valueEl = document.createElement("strong");
      valueEl.textContent = value;
      line.append(labelEl, valueEl);
      stats.append(line);
    });

    info.append(name, stats);

    const actions = document.createElement("div");
    actions.className = "person-actions";

    const edit = makeIconAction(`Editar ${person.name}`, "pencil");
    edit.addEventListener("click", () => openPersonDialog(person.id));

    const remove = makeIconAction(`Excluir ${person.name}`, "trash", "danger");
    remove.disabled = appState.people.length <= 1;
    remove.addEventListener("click", () => deletePerson(person.id));

    actions.append(edit, remove);
    row.append(info, actions);
    elements.peopleList.append(row);
  });
}

function renderPersonFilter() {
  const segmented = elements.allPeopleFilter.parentElement;
  Array.from(segmented.querySelectorAll("button:not(#allPeopleFilter)")).forEach((button) => button.remove());

  elements.allPeopleFilter.classList.toggle("active", activePersonFilter === "all");

  appState.people.forEach((person) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = person.name;
    button.classList.toggle("active", activePersonFilter === person.id);
    button.addEventListener("click", () => {
      activePersonFilter = person.id;
      expensePage = 1;
      renderExpenses();
      renderPersonFilter();
    });
    segmented.append(button);
  });
}

function renderTabs() {
  const isIncomeEntry = activeEntryTab === "income";
  elements.expenseFormTab.classList.toggle("active", !isIncomeEntry);
  elements.incomeFormTab.classList.toggle("active", isIncomeEntry);
  elements.expenseFormTab.setAttribute("aria-selected", String(!isIncomeEntry));
  elements.incomeFormTab.setAttribute("aria-selected", String(isIncomeEntry));
  elements.expenseFormPanel.classList.toggle("hidden", isIncomeEntry);
  elements.incomeFormPanel.classList.toggle("hidden", !isIncomeEntry);

  const isIncomeHistory = activeHistoryTab === "incomes";
  elements.expensesHistoryTab.classList.toggle("active", !isIncomeHistory);
  elements.incomesHistoryTab.classList.toggle("active", isIncomeHistory);
  elements.expensesHistoryTab.setAttribute("aria-selected", String(!isIncomeHistory));
  elements.incomesHistoryTab.setAttribute("aria-selected", String(isIncomeHistory));
  elements.expensesHistoryPanel.classList.toggle("hidden", isIncomeHistory);
  elements.incomesHistoryPanel.classList.toggle("hidden", !isIncomeHistory);
}

function renderExpenses() {
  clearElement(elements.expensesList);

  let expenses = getPeriodExpenses().sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  if (activePersonFilter !== "all") {
    expenses = expenses.filter((expense) => expense.personId === activePersonFilter);
  }

  const pagination = paginate(expenses, expensePage, EXPENSE_PAGE_SIZE);
  expensePage = pagination.page;

  if (!expenses.length) {
    elements.expensesList.append(createEmptyState("Nenhum gasto lançado."));
    clearElement(elements.expensesPagination);
    return;
  }

  pagination.items.forEach((expense) => {
    const row = document.createElement("article");
    row.className = "expense-row";

    const info = document.createElement("div");
    info.className = "expense-info";

    const title = document.createElement("div");
    title.className = "expense-title";
    const category = document.createElement("strong");
    category.textContent = getCategoryName(expense.categoryId);
    const description = document.createElement("span");
    description.className = "expense-meta";
    description.textContent = expense.description ? expense.description : "";
    title.append(category);
    if (expense.description) {
      title.append(description);
    }

    const meta = document.createElement("div");
    meta.className = "expense-meta";
    meta.textContent = `${getPersonName(expense.personId)} · ${dateFormatter.format(new Date(`${expense.date}T00:00:00`))}`;

    info.append(title, meta);

    const actions = document.createElement("div");
    actions.className = "expense-actions";

    const value = document.createElement("span");
    value.className = "expense-value";
    value.textContent = toMoney(expense.amount);

    const remove = makeIconAction("Excluir gasto", "trash", "danger");
    remove.addEventListener("click", () => deleteExpense(expense.id));

    actions.append(value, remove);
    row.append(info, actions);
    elements.expensesList.append(row);
  });

  renderPagination(elements.expensesPagination, expenses.length, pagination.page, pagination.totalPages, (page) => {
    expensePage = page;
    renderExpenses();
  });
}

function renderIncomes() {
  clearElement(elements.incomesList);
  const incomes = getPeriodIncomes().sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));

  if (!incomes.length) {
    elements.incomesList.append(createEmptyState("Nenhuma entrada cadastrada."));
    return;
  }

  incomes.forEach((income) => {
    const occurrences = getIncomeOccurrences(income);
    const total = sum(occurrences.map((occurrence) => occurrence.occurrenceAmount));
    const firstOccurrence = occurrences[0]?.occurrenceDate || income.date;
    const lastOccurrence = occurrences.at(-1)?.occurrenceDate || income.endDate || income.date;
    const isMonthly = income.frequency === "monthly";

    const row = document.createElement("article");
    row.className = "income-row";

    const info = document.createElement("div");
    info.className = "income-info";

    const title = document.createElement("div");
    title.className = "income-title";
    const description = document.createElement("strong");
    description.textContent = income.description;
    const badge = document.createElement("span");
    badge.className = "pill";
    badge.textContent = isMonthly ? "Mensal" : "Única";
    title.append(description, badge);

    const meta = document.createElement("div");
    meta.className = "expense-meta";
    const dateText = isMonthly
      ? `${dateFormatter.format(parseInputDate(firstOccurrence))} a ${dateFormatter.format(parseInputDate(lastOccurrence))}`
      : dateFormatter.format(parseInputDate(income.date));
    meta.textContent = `${getPersonName(income.personId)} · ${dateText} · ${occurrences.length} ocorrência(s)`;

    info.append(title, meta);

    const actions = document.createElement("div");
    actions.className = "income-actions";

    const value = document.createElement("span");
    value.className = "income-value";
    value.textContent = toMoney(total);

    const edit = makeIconAction(`Editar ${income.description}`, "pencil");
    edit.addEventListener("click", () => editIncome(income.id));

    const remove = makeIconAction(`Excluir ${income.description}`, "trash", "danger");
    remove.addEventListener("click", () => deleteIncome(income.id));

    actions.append(value, edit, remove);
    row.append(info, actions);
    elements.incomesList.append(row);
  });
}

function renderAllocationFields(category = null) {
  clearElement(elements.allocationFields);
  appState.people.forEach((person) => {
    const row = document.createElement("label");
    row.className = "allocation-row";
    const name = document.createElement("span");
    name.textContent = person.name;
    const input = document.createElement("input");
    input.type = "number";
    input.min = "0";
    input.step = "0.01";
    input.inputMode = "decimal";
    input.dataset.personId = person.id;
    input.value = category?.allocations?.[person.id] ?? 0;
    row.append(name, input);
    elements.allocationFields.append(row);
  });
}

function render() {
  ensureActivePeriod();
  renderPeriodSelect();
  renderSummary();
  renderExpenseFormOptions();
  renderIncomeFormOptions();
  renderCategoryBoard();
  renderPeople();
  renderPersonFilter();
  renderTabs();
  renderExpenses();
  renderIncomes();
}

function openPeriodDialog(periodId = null) {
  const period = periodId ? appState.periods.find((item) => item.id === periodId) : null;
  const start = new Date();
  const end = addMonths(start, 7);
  elements.periodForm.reset();
  elements.periodDialogTitle.textContent = period ? "Editar período" : "Novo período";
  elements.periodId.value = period?.id || "";
  elements.periodName.value = period?.name || "Novo orçamento";
  elements.periodStart.value = period?.startDate || formatDateInput(start);
  elements.periodEnd.value = period?.endDate || formatDateInput(end);
  elements.periodDialog.showModal();
  elements.periodName.select();
}

function openCategoryDialog(categoryId = null) {
  const category = categoryId ? getCategory(categoryId) : null;
  elements.categoryForm.reset();
  elements.categoryId.value = category?.id || "";
  elements.categoryDialogTitle.textContent = category ? "Editar categoria" : "Nova categoria";
  elements.categoryName.value = category?.name || "";
  elements.categoryBudget.value = category?.budget ?? 0;
  elements.categoryColor.value = category?.color || palette[getPeriodCategories().length % palette.length];
  renderAllocationFields(category);
  elements.categoryDialog.showModal();
  elements.categoryName.focus();
}

function openPersonDialog(personId = null) {
  const person = appState.people.find((item) => item.id === personId);
  elements.personForm.reset();
  elements.personId.value = person?.id || "";
  elements.personName.value = person?.name || "";
  elements.personDialog.showModal();
  elements.personName.focus();
}

function closeDialogFromSubmit(event, dialog) {
  if (event.submitter?.value === "cancel") {
    dialog.close();
    return true;
  }
  return false;
}

async function savePeriod(event) {
  event.preventDefault();
  if (closeDialogFromSubmit(event, elements.periodDialog)) {
    return;
  }

  const name = elements.periodName.value.trim();
  const startDate = elements.periodStart.value;
  const endDate = elements.periodEnd.value;

  if (!name || !startDate || !endDate) {
    showToast("Preencha o período.");
    return;
  }

  if (startDate > endDate) {
    showToast("A data final precisa vir depois do início.");
    return;
  }

  const existingId = elements.periodId.value;
  if (existingId) {
    const period = appState.periods.find((item) => item.id === existingId);
    period.name = name;
    period.startDate = startDate;
    period.endDate = endDate;
  } else {
    const periodId = createId("period");
    appState.periods.push({ id: periodId, name, startDate, endDate, createdAt: new Date().toISOString() });
    appState.activePeriodId = periodId;
    categoryPage = 1;
    expensePage = 1;
  }

  elements.periodDialog.close();
  await persistAndRender(existingId ? "Período atualizado." : "Período criado.");
}

async function saveCategory(event) {
  event.preventDefault();
  if (closeDialogFromSubmit(event, elements.categoryDialog)) {
    return;
  }

  const name = elements.categoryName.value.trim();
  const budget = parseMoneyInput(elements.categoryBudget.value);
  const color = elements.categoryColor.value;
  const allocations = {};

  elements.allocationFields.querySelectorAll("input").forEach((input) => {
    allocations[input.dataset.personId] = parseMoneyInput(input.value);
  });

  if (!name) {
    showToast("Dê um nome para a categoria.");
    return;
  }

  const existingId = elements.categoryId.value;
  if (existingId) {
    const category = getCategory(existingId);
    category.name = name;
    category.budget = budget;
    category.color = color;
    category.allocations = allocations;
  } else {
    appState.categories.push({
      id: createId("category"),
      periodId: getCurrentPeriod().id,
      name,
      budget,
      color,
      createdAt: new Date().toISOString(),
      allocations,
    });
    categoryPage = 1;
  }

  elements.categoryDialog.close();
  await persistAndRender("Categoria salva.");
}

async function savePerson(event) {
  event.preventDefault();
  if (closeDialogFromSubmit(event, elements.personDialog)) {
    return;
  }

  const name = elements.personName.value.trim();
  if (!name) {
    showToast("Informe o nome.");
    return;
  }

  const existingId = elements.personId.value;
  if (existingId) {
    const person = appState.people.find((item) => item.id === existingId);
    person.name = name;
  } else {
    const personId = createId("person");
    appState.people.push({ id: personId, name });
    appState.categories.forEach((category) => {
      category.allocations = category.allocations || {};
      category.allocations[personId] = 0;
    });
  }

  elements.personDialog.close();
  await persistAndRender("Pessoa salva.");
}

async function addExpense(event) {
  event.preventDefault();

  const date = elements.expenseDate.value;
  const personId = elements.expensePerson.value;
  const categoryId = elements.expenseCategory.value;
  const amount = parseMoneyInput(elements.expenseAmount.value);
  const description = elements.expenseDescription.value.trim();

  if (!date || !personId || !categoryId || amount <= 0) {
    showToast("Revise o gasto antes de salvar.");
    return;
  }

  appState.expenses.push({
    id: createId("expense"),
    periodId: getCurrentPeriod().id,
    date,
    personId,
    categoryId,
    amount,
    description,
    createdAt: new Date().toISOString(),
  });

  elements.expenseAmount.value = "";
  elements.expenseDescription.value = "";
  elements.expenseAmount.focus();
  expensePage = 1;
  activeHistoryTab = "expenses";
  await persistAndRender("Gasto lançado.");
}

async function saveIncome(event) {
  event.preventDefault();

  const id = elements.incomeId.value;
  const date = elements.incomeDate.value;
  const personId = elements.incomePerson.value;
  const frequency = elements.incomeFrequency.value;
  const endDate = elements.incomeEndDate.value;
  const amount = parseMoneyInput(elements.incomeAmount.value);
  const description = elements.incomeDescription.value.trim();

  if (!date || !personId || !frequency || amount <= 0 || !description) {
    showToast("Revise a entrada antes de salvar.");
    return;
  }

  if (endDate && endDate < date) {
    showToast("A data final precisa vir depois da data inicial.");
    return;
  }

  if (id) {
    const income = getIncome(id);
    income.date = date;
    income.personId = personId;
    income.frequency = frequency;
    income.endDate = frequency === "monthly" ? endDate : "";
    income.amount = amount;
    income.description = description;
  } else {
    appState.incomes.push({
      id: createId("income"),
      periodId: getCurrentPeriod().id,
      date,
      personId,
      frequency,
      endDate: frequency === "monthly" ? endDate : "",
      amount,
      description,
      createdAt: new Date().toISOString(),
    });
  }

  resetIncomeForm({ keepOptions: true });
  activeHistoryTab = "incomes";
  await persistAndRender(id ? "Entrada atualizada." : "Entrada adicionada.");
}

function editIncome(incomeId) {
  const income = getIncome(incomeId);
  if (!income) {
    return;
  }

  elements.incomeId.value = income.id;
  elements.incomeDate.value = income.date;
  elements.incomePerson.value = income.personId;
  elements.incomeFrequency.value = income.frequency;
  elements.incomeEndDate.value = income.endDate || "";
  elements.incomeAmount.value = income.amount;
  elements.incomeDescription.value = income.description;
  setButtonContent(elements.incomeSubmitButton, "Salvar entrada", "check");
  elements.incomeCancelEditButton.classList.remove("hidden");
  elements.incomeEndDate.disabled = income.frequency === "once";
  activeEntryTab = "income";
  activeHistoryTab = "incomes";
  renderTabs();
  elements.incomeDescription.focus();
}

function resetIncomeForm({ keepOptions = false } = {}) {
  const personId = elements.incomePerson.value;
  const frequency = elements.incomeFrequency.value;
  const date = elements.incomeDate.value;

  elements.incomeId.value = "";
  elements.incomeAmount.value = "";
  elements.incomeDescription.value = "";
  elements.incomeEndDate.value = "";
  setButtonContent(elements.incomeSubmitButton, "Adicionar entrada", "plus");
  elements.incomeCancelEditButton.classList.add("hidden");
  elements.incomeEndDate.disabled = elements.incomeFrequency.value === "once";

  if (keepOptions) {
    elements.incomePerson.value = personId;
    elements.incomeFrequency.value = frequency;
    elements.incomeDate.value = date;
  }
}

async function deleteIncome(incomeId) {
  const income = getIncome(incomeId);
  if (!income) {
    return;
  }

  const confirmed = window.confirm(`Excluir a entrada ${income.description}?`);
  if (!confirmed) {
    return;
  }

  appState.incomes = appState.incomes.filter((item) => item.id !== incomeId);
  if (elements.incomeId.value === incomeId) {
    resetIncomeForm({ keepOptions: true });
  }
  await persistAndRender("Entrada excluída.");
}

async function deleteExpense(expenseId) {
  const expense = appState.expenses.find((item) => item.id === expenseId);
  if (!expense) {
    return;
  }

  const confirmed = window.confirm(`Excluir ${toMoney(expense.amount)} de ${getCategoryName(expense.categoryId)}?`);
  if (!confirmed) {
    return;
  }

  appState.expenses = appState.expenses.filter((item) => item.id !== expenseId);
  await persistAndRender("Gasto excluído.");
}

async function deleteCategory(categoryId) {
  const category = getCategory(categoryId);
  if (!category) {
    return;
  }

  const expensesCount = appState.expenses.filter((expense) => expense.categoryId === categoryId).length;
  const confirmed = window.confirm(
    expensesCount
      ? `Excluir ${category.name} e ${expensesCount} gasto(s) vinculados?`
      : `Excluir a categoria ${category.name}?`,
  );

  if (!confirmed) {
    return;
  }

  appState.categories = appState.categories.filter((item) => item.id !== categoryId);
  appState.expenses = appState.expenses.filter((expense) => expense.categoryId !== categoryId);
  await persistAndRender("Categoria excluída.");
}

async function deletePerson(personId) {
  if (appState.people.length <= 1) {
    showToast("Mantenha pelo menos uma pessoa.");
    return;
  }

  const person = appState.people.find((item) => item.id === personId);
  const expensesCount = appState.expenses.filter((expense) => expense.personId === personId).length;
  const confirmed = window.confirm(
    expensesCount ? `Excluir ${person.name} e ${expensesCount} gasto(s) vinculados?` : `Excluir ${person.name}?`,
  );

  if (!confirmed) {
    return;
  }

  appState.people = appState.people.filter((item) => item.id !== personId);
  appState.expenses = appState.expenses.filter((expense) => expense.personId !== personId);
  appState.incomes = appState.incomes.filter((income) => income.personId !== personId);
  appState.categories.forEach((category) => {
    delete category.allocations?.[personId];
  });

  if (activePersonFilter === personId) {
    activePersonFilter = "all";
  }

  await persistAndRender("Pessoa excluída.");
}

function splitEvenly() {
  const budget = parseMoneyInput(elements.categoryBudget.value);
  const peopleCount = appState.people.length || 1;
  const base = Math.floor((budget / peopleCount) * 100) / 100;
  let remainder = Math.round((budget - base * peopleCount) * 100);

  elements.allocationFields.querySelectorAll("input").forEach((input) => {
    let value = base;
    if (remainder > 0) {
      value += 0.01;
      remainder -= 1;
    }
    input.value = value.toFixed(2);
  });
}

function exportBackup() {
  const data = JSON.stringify(appState, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `orcamento-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
  showToast("Arquivo de orçamento exportado.");
}

function validateImportedState(imported) {
  return (
    imported &&
    Array.isArray(imported.periods) &&
    Array.isArray(imported.people) &&
    Array.isArray(imported.categories) &&
    Array.isArray(imported.expenses)
  );
}

async function importBackup(event) {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }

  try {
    const text = await file.text();
    const imported = JSON.parse(text);
    if (!validateImportedState(imported)) {
      throw new Error("Arquivo inválido");
    }

    appState = {
      ...imported,
      version: 1,
      activePeriodId: imported.activePeriodId || imported.periods[0]?.id,
      updatedAt: new Date().toISOString(),
    };
    appState = normalizeState(appState);
    activePersonFilter = "all";
    categoryPage = 1;
    expensePage = 1;
    await persistAndRender("Orçamento importado.");
  } catch (error) {
    showToast("Não foi possível importar esse arquivo.");
  } finally {
    event.target.value = "";
  }
}

function registerEvents() {
  elements.periodSelect.addEventListener("change", async (event) => {
    appState.activePeriodId = event.target.value;
    activePersonFilter = "all";
    categoryPage = 1;
    expensePage = 1;
    await persistAndRender();
  });

  elements.newPeriodButton.addEventListener("click", openPeriodDialog);
  elements.editPeriodButton.addEventListener("click", () => openPeriodDialog(getCurrentPeriod().id));
  elements.newCategoryButton.addEventListener("click", () => openCategoryDialog());
  elements.newPersonButton.addEventListener("click", () => openPersonDialog());
  elements.expenseFormTab.addEventListener("click", () => {
    activeEntryTab = "expense";
    renderTabs();
  });
  elements.incomeFormTab.addEventListener("click", () => {
    activeEntryTab = "income";
    renderTabs();
  });
  elements.expensesHistoryTab.addEventListener("click", () => {
    activeHistoryTab = "expenses";
    renderTabs();
  });
  elements.incomesHistoryTab.addEventListener("click", () => {
    activeHistoryTab = "incomes";
    renderTabs();
  });
  elements.periodForm.addEventListener("submit", savePeriod);
  elements.categoryForm.addEventListener("submit", saveCategory);
  elements.personForm.addEventListener("submit", savePerson);
  elements.expenseForm.addEventListener("submit", addExpense);
  elements.incomeForm.addEventListener("submit", saveIncome);
  elements.incomeCancelEditButton.addEventListener("click", () => resetIncomeForm({ keepOptions: true }));
  elements.incomeFrequency.addEventListener("change", () => {
    elements.incomeEndDate.disabled = elements.incomeFrequency.value === "once";
    if (elements.incomeFrequency.value === "once") {
      elements.incomeEndDate.value = "";
    }
  });
  elements.categorySort.addEventListener("change", () => {
    categoryPage = 1;
    renderCategoryBoard();
  });
  elements.splitEvenlyButton.addEventListener("click", splitEvenly);
  elements.backupButton.addEventListener("click", exportBackup);
  elements.importFile.addEventListener("change", importBackup);
  elements.allPeopleFilter.addEventListener("click", () => {
    activePersonFilter = "all";
    expensePage = 1;
    renderExpenses();
    renderPersonFilter();
  });

  document.querySelectorAll("dialog").forEach((dialog) => {
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) {
        dialog.close();
      }
    });
  });
}

async function init() {
  db = await openDatabase();
  appState = await readState();

  if (!appState) {
    appState = createInitialState();
    await writeState();
  } else {
    appState = normalizeState(appState);
  }

  ensureActivePeriod();
  decorateStaticButtons();
  registerEvents();
  render();

  if ("serviceWorker" in navigator && window.location.protocol !== "file:") {
    navigator.serviceWorker.register("sw.js");
  }
}

init().catch((error) => {
  console.error(error);
  document.body.innerHTML = "<main class=\"app-shell\"><h1>Não foi possível abrir o orçamento.</h1></main>";
});
