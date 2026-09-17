// אין build step, אין מודולים — סקריפט אחד פשוט שמדבר ישירות מול Supabase.

const WHOAMI_KEY = 'dogmeds-whoami';
const EMOJIS = ['🐶', '🐕', '🐩', '🦮', '🐈', '🐇'];

const ICONS = {
  check:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 12.5 9.5 18 20 5"/></svg>',
  trash:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16"/><path d="M9.5 7V5.2A1.2 1.2 0 0 1 10.7 4h2.6a1.2 1.2 0 0 1 1.2 1.2V7"/><path d="M6.5 7l.8 12.2A1.5 1.5 0 0 0 8.8 20.6h6.4a1.5 1.5 0 0 0 1.5-1.4L17.5 7"/></svg>',
  x:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12"/><path d="M18 6L6 18"/></svg>',
  plus:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>',
};

const db = window.supabase.createClient(window.APP_CONFIG.SUPABASE_URL, window.APP_CONFIG.SUPABASE_ANON_KEY);

let pets = [];
let medications = [];
let selectedEmoji = EMOJIS[0];
let toastTimer = null;
const openAddMedForms = new Set(); // pet ids whose "add medication" form is expanded — survives re-renders

const els = {
  whoamiBar: document.getElementById('whoami-bar'),
  whoamiName: document.getElementById('whoami-name'),
  changeNameBtn: document.getElementById('change-name-btn'),
  loginView: document.getElementById('login-view'),
  loginForm: document.getElementById('login-form'),
  loginNameInput: document.getElementById('login-name-input'),
  appView: document.getElementById('app-view'),
  tabMedsBtn: document.getElementById('tab-meds-btn'),
  tabHistoryBtn: document.getElementById('tab-history-btn'),
  medsView: document.getElementById('meds-view'),
  historyView: document.getElementById('history-view'),
  petsList: document.getElementById('pets-list'),
  addPetTrigger: document.getElementById('add-pet-trigger'),
  addPetForm: document.getElementById('add-pet-form'),
  cancelAddPetBtn: document.getElementById('cancel-add-pet-btn'),
  petNameInput: document.getElementById('pet-name-input'),
  emojiPicker: document.getElementById('emoji-picker'),
  historyList: document.getElementById('history-list'),
  toast: document.getElementById('toast'),
};

function getWhoAmI() {
  return window.localStorage.getItem(WHOAMI_KEY);
}

function setWhoAmI(name) {
  window.localStorage.setItem(WHOAMI_KEY, name);
}

function getTodayStr() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jerusalem' }).format(new Date());
}

function effectiveGivenCount(med) {
  return med.given_today_date === getTodayStr() ? med.given_today_count : 0;
}

function formatTime(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  const datePart = d.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit' });
  const timePart = d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
  return `${datePart} ${timePart}`;
}

function showToast(message, isError) {
  clearTimeout(toastTimer);
  els.toast.textContent = message;
  els.toast.className = 'toast' + (isError ? ' toast-error' : '');
  els.toast.hidden = false;
  requestAnimationFrame(() => els.toast.classList.add('visible'));
  toastTimer = setTimeout(() => {
    els.toast.classList.remove('visible');
    setTimeout(() => {
      els.toast.hidden = true;
    }, 200);
  }, 2600);
}

async function withBusy(button, task) {
  button.disabled = true;
  button.classList.add('is-busy');
  try {
    return await task();
  } finally {
    button.disabled = false;
    button.classList.remove('is-busy');
  }
}

function renderEmojiPicker() {
  els.emojiPicker.innerHTML = '';
  for (const emoji of EMOJIS) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'emoji-option' + (emoji === selectedEmoji ? ' selected' : '');
    btn.textContent = emoji;
    btn.setAttribute('aria-pressed', String(emoji === selectedEmoji));
    btn.addEventListener('click', () => {
      selectedEmoji = emoji;
      renderEmojiPicker();
    });
    els.emojiPicker.appendChild(btn);
  }
}

function renderPets() {
  els.petsList.innerHTML = '';

  if (pets.length === 0) {
    const note = document.createElement('p');
    note.className = 'empty-note';
    note.textContent = 'עדיין לא נוספו חיות. הוסיפו את הראשונה למטה.';
    els.petsList.appendChild(note);
    return;
  }

  for (const pet of pets) {
    const card = document.createElement('div');
    card.className = 'pet-card';

    const header = document.createElement('div');
    header.className = 'pet-card-header';
    const title = document.createElement('h2');
    const emojiBadge = document.createElement('span');
    emojiBadge.className = 'pet-emoji-badge';
    emojiBadge.textContent = pet.emoji;
    title.appendChild(emojiBadge);
    title.appendChild(document.createTextNode(pet.name));
    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'icon-btn-ghost';
    deleteBtn.innerHTML = ICONS.x;
    deleteBtn.setAttribute('aria-label', `מחק את ${pet.name}`);
    deleteBtn.addEventListener('click', () => deletePet(pet.id, deleteBtn));
    header.appendChild(title);
    header.appendChild(deleteBtn);
    card.appendChild(header);

    const petMeds = medications.filter((m) => m.pet_id === pet.id);
    if (petMeds.length === 0) {
      const note = document.createElement('p');
      note.className = 'empty-note empty-note-inline';
      note.textContent = 'אין עדיין תרופות לחיה הזו.';
      card.appendChild(note);
    } else {
      for (const med of petMeds) {
        card.appendChild(renderMedRow(med));
      }
    }

    card.appendChild(renderAddMedSection(pet.id));
    els.petsList.appendChild(card);
  }
}

function renderMedRow(med) {
  const row = document.createElement('div');
  row.className = 'med-row';

  const info = document.createElement('div');
  info.className = 'med-info';

  const name = document.createElement('div');
  name.className = 'med-name';
  name.textContent = med.name;
  info.appendChild(name);

  const metaParts = [med.dosage_text, med.instructions_text].filter(Boolean);
  if (metaParts.length > 0) {
    const meta = document.createElement('div');
    meta.className = 'med-meta';
    meta.textContent = metaParts.join(' · ');
    info.appendChild(meta);
  }

  const times = med.times_per_day || 1;
  const count = effectiveGivenCount(med);

  if (count > 0) {
    const status = document.createElement('span');
    status.className = 'badge badge-success';
    status.textContent =
      times <= 1
        ? `ניתן ב-${formatTime(med.last_given_at)} ע"י ${med.last_given_by}`
        : count >= times
          ? `כל המנות ניתנו היום · אחרונה ב-${formatTime(med.last_given_at)} ע"י ${med.last_given_by}`
          : `${count} מתוך ${times} היום · אחרונה ב-${formatTime(med.last_given_at)} ע"י ${med.last_given_by}`;
    info.appendChild(status);
  }

  row.appendChild(info);

  const actions = document.createElement('div');
  actions.className = 'med-actions';

  for (let i = 1; i <= times; i++) {
    const given = i <= count;
    const checkBtn = document.createElement('button');
    checkBtn.type = 'button';
    checkBtn.className = 'check-btn' + (times > 1 ? ' check-btn-sm' : '') + (given ? ' given' : '');
    checkBtn.innerHTML = ICONS.check;
    checkBtn.setAttribute(
      'aria-label',
      given
        ? times <= 1
          ? `${med.name} סומנה כניתנה — לחצו לביטול`
          : `בטלו את מנה ${i} מתוך ${times} של ${med.name}`
        : times <= 1
          ? `סמנו ש-${med.name} ניתנה`
          : `סמנו מנה ${i} מתוך ${times} של ${med.name}`,
    );
    checkBtn.addEventListener('click', () => setGivenCount(med.id, given ? i - 1 : i, checkBtn));
    actions.appendChild(checkBtn);
  }

  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.className = 'icon-btn-ghost';
  deleteBtn.innerHTML = ICONS.trash;
  deleteBtn.setAttribute('aria-label', `מחק את ${med.name}`);
  deleteBtn.addEventListener('click', () => deleteMedication(med.id, deleteBtn));
  actions.appendChild(deleteBtn);

  row.appendChild(actions);

  return row;
}

function renderAddMedSection(petId) {
  const wrap = document.createElement('div');
  wrap.className = 'add-section';

  const isOpen = openAddMedForms.has(petId);

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'add-trigger-btn';
  trigger.innerHTML = `${ICONS.plus} <span>הוסף תרופה</span>`;
  trigger.hidden = isOpen;

  const form = document.createElement('form');
  form.className = 'add-med-form';
  form.hidden = !isOpen;

  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.placeholder = 'שם תרופה';
  nameInput.required = true;

  const dosageInput = document.createElement('input');
  dosageInput.type = 'text';
  dosageInput.placeholder = 'מינון (למשל: חצי כדור)';

  const instructionsInput = document.createElement('input');
  instructionsInput.type = 'text';
  instructionsInput.placeholder = 'הנחיות (למשל: עם אוכל)';

  const timesId = `times-per-day-${petId}`;
  const timesLabel = document.createElement('label');
  timesLabel.className = 'field-label';
  timesLabel.htmlFor = timesId;
  timesLabel.textContent = 'כמה פעמים ביום';

  const timesInput = document.createElement('input');
  timesInput.type = 'number';
  timesInput.id = timesId;
  timesInput.min = '1';
  timesInput.max = '12';
  timesInput.value = '1';
  timesInput.inputMode = 'numeric';

  const formActions = document.createElement('div');
  formActions.className = 'form-actions';

  const submitBtn = document.createElement('button');
  submitBtn.type = 'submit';
  submitBtn.className = 'btn-secondary';
  submitBtn.textContent = 'הוסף';

  const cancelBtn = document.createElement('button');
  cancelBtn.type = 'button';
  cancelBtn.className = 'btn-text';
  cancelBtn.textContent = 'ביטול';
  cancelBtn.addEventListener('click', () => {
    form.reset();
    form.hidden = true;
    trigger.hidden = false;
    openAddMedForms.delete(petId);
  });

  formActions.appendChild(submitBtn);
  formActions.appendChild(cancelBtn);

  const timesField = document.createElement('div');
  timesField.className = 'times-field';
  timesField.appendChild(timesLabel);
  timesField.appendChild(timesInput);

  form.appendChild(nameInput);
  form.appendChild(dosageInput);
  form.appendChild(instructionsInput);
  form.appendChild(timesField);
  form.appendChild(formActions);

  trigger.addEventListener('click', () => {
    trigger.hidden = true;
    form.hidden = false;
    openAddMedForms.add(petId);
    nameInput.focus();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = nameInput.value.trim();
    if (!name) return;
    const timesPerDay = Math.max(1, parseInt(timesInput.value, 10) || 1);
    const ok = await withBusy(submitBtn, () =>
      addMedication(petId, name, dosageInput.value.trim(), instructionsInput.value.trim(), timesPerDay),
    );
    if (ok) {
      form.reset();
      form.hidden = true;
      trigger.hidden = false;
      openAddMedForms.delete(petId);
    }
  });

  wrap.appendChild(trigger);
  wrap.appendChild(form);
  return wrap;
}

function renderHistory() {
  els.historyList.innerHTML = '';

  const given = medications
    .filter((m) => m.last_given_at)
    .slice()
    .sort((a, b) => new Date(b.last_given_at) - new Date(a.last_given_at));

  if (given.length === 0) {
    const note = document.createElement('li');
    note.className = 'empty-note';
    note.textContent = 'עדיין לא סומנה שום תרופה כניתנה.';
    els.historyList.appendChild(note);
    return;
  }

  for (const med of given) {
    const pet = pets.find((p) => p.id === med.pet_id);
    const li = document.createElement('li');

    const title = document.createElement('div');
    title.className = 'history-title';
    if (pet) {
      const emojiBadge = document.createElement('span');
      emojiBadge.className = 'pet-emoji-badge pet-emoji-badge-sm';
      emojiBadge.textContent = pet.emoji;
      title.appendChild(emojiBadge);
    }
    title.appendChild(document.createTextNode(`${pet ? pet.name : ''} — ${med.name}`));

    const times = med.times_per_day || 1;
    const count = effectiveGivenCount(med);
    const meta = document.createElement('div');
    meta.className = 'history-meta';
    meta.textContent =
      times <= 1
        ? `ניתן ב-${formatTime(med.last_given_at)} ע"י ${med.last_given_by}`
        : `${count} מתוך ${times} היום · אחרונה ב-${formatTime(med.last_given_at)} ע"י ${med.last_given_by}`;

    li.appendChild(title);
    li.appendChild(meta);
    els.historyList.appendChild(li);
  }
}

function renderAll() {
  renderPets();
  renderHistory();
}

async function loadData() {
  const [{ data: petsData, error: petsError }, { data: medsData, error: medsError }] = await Promise.all([
    db.from('pets').select('*').order('created_at', { ascending: true }),
    db.from('medications').select('*').order('created_at', { ascending: true }),
  ]);

  if (petsError) console.error(petsError);
  if (medsError) console.error(medsError);

  if (!petsError) pets = petsData;
  if (!medsError) medications = medsData;
  renderAll();
}

async function addPet(name, emoji) {
  const { error } = await db.from('pets').insert({ name, emoji });
  if (error) {
    console.error(error);
    showToast('משהו השתבש בשמירה. נסו שוב.', true);
    return false;
  }
  return true;
}

async function deletePet(petId, button) {
  if (!window.confirm('למחוק את החיה וכל התרופות שלה?')) return;
  const { error } = await withBusy(button, () => db.from('pets').delete().eq('id', petId));
  if (error) {
    console.error(error);
    showToast('משהו השתבש במחיקה. נסו שוב.', true);
  }
}

async function addMedication(petId, name, dosageText, instructionsText, timesPerDay) {
  if (!name) return false;
  const { error } = await db.from('medications').insert({
    pet_id: petId,
    name,
    dosage_text: dosageText || null,
    instructions_text: instructionsText || null,
    times_per_day: timesPerDay || 1,
  });
  if (error) {
    console.error(error);
    showToast('משהו השתבש בשמירה. נסו שוב.', true);
    return false;
  }
  return true;
}

async function deleteMedication(medId, button) {
  if (!window.confirm('למחוק את התרופה?')) return;
  const { error } = await withBusy(button, () => db.from('medications').delete().eq('id', medId));
  if (error) {
    console.error(error);
    showToast('משהו השתבש במחיקה. נסו שוב.', true);
  }
}

async function setGivenCount(medId, newCount, button) {
  const payload = {
    given_today_count: newCount,
    given_today_date: getTodayStr(),
  };
  if (newCount > 0) {
    payload.last_given_at = new Date().toISOString();
    payload.last_given_by = getWhoAmI();
  } else {
    payload.last_given_at = null;
    payload.last_given_by = null;
  }
  const { error } = await withBusy(button, () => db.from('medications').update(payload).eq('id', medId));
  if (error) {
    console.error(error);
    showToast('משהו השתבש בסימון. נסו שוב.', true);
  }
}

function showAppView() {
  const name = getWhoAmI();
  els.loginView.hidden = true;
  els.appView.hidden = false;
  els.whoamiBar.hidden = false;
  els.whoamiName.textContent = `שלום, ${name}`;
  renderAll();
}

function showLoginView() {
  els.loginView.hidden = false;
  els.appView.hidden = true;
  els.whoamiBar.hidden = true;
  els.loginNameInput.value = '';
}

function switchTab(tab) {
  const isMeds = tab === 'meds';
  els.medsView.hidden = !isMeds;
  els.historyView.hidden = isMeds;
  els.tabMedsBtn.classList.toggle('active', isMeds);
  els.tabHistoryBtn.classList.toggle('active', !isMeds);
  els.tabMedsBtn.setAttribute('aria-selected', String(isMeds));
  els.tabHistoryBtn.setAttribute('aria-selected', String(!isMeds));
}

function subscribeRealtime() {
  db.channel('dogmeds-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'pets' }, loadData)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'medications' }, loadData)
    .subscribe();
}

function init() {
  renderEmojiPicker();

  els.loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = els.loginNameInput.value.trim();
    if (!name) return;
    setWhoAmI(name);
    showAppView();
    loadData();
  });

  els.changeNameBtn.addEventListener('click', () => {
    showLoginView();
  });

  els.addPetTrigger.addEventListener('click', () => {
    els.addPetTrigger.hidden = true;
    els.addPetForm.hidden = false;
    els.petNameInput.focus();
  });

  els.cancelAddPetBtn.addEventListener('click', () => {
    els.addPetForm.reset();
    selectedEmoji = EMOJIS[0];
    renderEmojiPicker();
    els.addPetForm.hidden = true;
    els.addPetTrigger.hidden = false;
  });

  const addPetSubmitBtn = els.addPetForm.querySelector('button[type="submit"]');
  els.addPetForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = els.petNameInput.value.trim();
    if (!name) return;
    const ok = await withBusy(addPetSubmitBtn, () => addPet(name, selectedEmoji));
    if (ok) {
      els.addPetForm.reset();
      selectedEmoji = EMOJIS[0];
      renderEmojiPicker();
      els.addPetForm.hidden = true;
      els.addPetTrigger.hidden = false;
    }
  });

  els.tabMedsBtn.addEventListener('click', () => switchTab('meds'));
  els.tabHistoryBtn.addEventListener('click', () => switchTab('history'));

  const existingName = getWhoAmI();
  if (existingName) {
    showAppView();
    loadData();
  } else {
    showLoginView();
  }

  subscribeRealtime();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js').catch((err) => console.error(err));
  }
}

init();
