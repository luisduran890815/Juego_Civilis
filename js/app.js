import {
  ASPIRATIONS, ASPIRATION_CATEGORIES, BOT_TOWNS, BUILDINGS, CATEGORIES, GAME_VERSION, HELP_SECTIONS, MAP_SIZE,
  RESOURCE_META, SEASONS, HOURS_PER_REAL_SECOND
} from './config.js';
import { createInitialState, createVillager, makeId, normalizeState } from './state.js';
import {
  clearLocal, createCloudSave, exportSaveFile, getCloudRef, importSaveFile,
  loadCloudSave, loadLocal, saveLocal, syncCloudSave
} from './storage.js';
import { Renderer } from './renderer.js';

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const fmt = number => Math.floor(number).toLocaleString('es-CO');
const esc = value => String(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));

class Civilis {
  constructor() {
    this.state = loadLocal() || createInitialState();
    this.activeCategory = 'vivienda';
    this.buildMode = null;
    this.lastFrame = performance.now();
    this.simAccumulator = 0;
    this.uiAccumulator = 0;
    this.autosaveAccumulator = 0;
    this.cloudBusy = false;
    this.renderer = new Renderer($('#gameCanvas'), () => this.state);
    this.renderer.onTileClick = tile => this.handleTileClick(tile);
    this.renderer.onCanPlace = (type, x, y) => this.canPlace(type, x, y);
    this.bindUI();
    this.renderStaticUI();
    this.refreshUI(true);
    this.renderer.focusBuilding(this.state.buildings.find(b => b.type === 'townhall'));
    window.addEventListener('resize', () => this.renderer.resize());
    requestAnimationFrame(time => this.loop(time));
    setTimeout(() => this.toast('Bienvenido a Civilis. Construye a tu propio ritmo.', 'good'), 500);
  }

  setState(nextState) {
    this.state = normalizeState(nextState);
    this.buildMode = null;
    this.renderer.buildType = null;
    this.renderer.selectedId = null;
    this.renderBuildList();
    this.refreshUI(true);
    const hall = this.state.buildings.find(b => b.type === 'townhall') || this.state.buildings[0];
    if (hall) this.renderer.focusBuilding(hall);
    saveLocal(this.state);
  }

  bindUI() {
    $('#saveButton').addEventListener('click', () => {
      const at = saveLocal(this.state);
      this.toast(`Partida guardada · ${new Date(at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`, 'good');
    });
    $('#cloudButton').addEventListener('click', () => { this.renderCloudStatus(); $('#cloudDialog').showModal(); });
    $('#helpButton').addEventListener('click', () => $('#helpDialog').showModal());
    $('#tradeButton').addEventListener('click', () => this.openTrade());
    $('#cancelBuild').addEventListener('click', () => this.setBuildMode(null));
    $('#pauseButton').addEventListener('click', () => this.togglePause());
    $$('[data-speed]').forEach(button => button.addEventListener('click', () => this.setSpeed(Number(button.dataset.speed))));
    $$('.close-dialog').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));

    $('#renameTown').addEventListener('click', () => {
      $('#townNameInput').value = this.state.townName;
      $('#renameDialog').showModal();
      setTimeout(() => $('#townNameInput').select(), 0);
    });
    $('#renameForm').addEventListener('submit', event => {
      event.preventDefault();
      const name = $('#townNameInput').value.trim();
      if (!name) return;
      this.state.townName = name.slice(0, 28);
      $('#renameDialog').close();
      this.refreshUI(true);
      saveLocal(this.state);
    });

    $('#createCloudSave').addEventListener('click', () => this.createCloud());
    $('#syncCloudSave').addEventListener('click', () => this.syncCloud());
    $('#loadCloudSave').addEventListener('click', () => this.loadCloud());
    $('#exportSave').addEventListener('click', () => exportSaveFile(this.state));
    $('#importSave').addEventListener('change', async event => {
      try {
        const next = await importSaveFile(event.target.files[0]);
        this.setState(next);
        $('#helpDialog').close();
        this.toast('Partida importada correctamente.', 'good');
      } catch (error) {
        this.toast(`No se pudo importar: ${error.message}`, 'warn');
      }
      event.target.value = '';
    });
    $('#newGame').addEventListener('click', () => {
      if (!confirm('¿Crear una nueva partida? El guardado local actual se reemplazará.')) return;
      clearLocal();
      this.setState(createInitialState());
      $('#helpDialog').close();
      this.toast('Nueva comunidad fundada.', 'good');
    });

    $('#buildList').addEventListener('click', event => {
      const card = event.target.closest('[data-building]');
      if (!card || card.disabled) return;
      this.setBuildMode(card.dataset.building);
    });
    $('#categoryTabs').addEventListener('click', event => {
      const tab = event.target.closest('[data-category]');
      if (!tab) return;
      this.activeCategory = tab.dataset.category;
      this.renderBuildList();
      this.renderCategoryTabs();
    });
    $('#inspector').addEventListener('click', event => this.handleInspectorAction(event));
    $('#tradeTowns').addEventListener('click', event => {
      const button = event.target.closest('[data-trade]');
      if (!button) return;
      this.executeTrade(button.dataset.town, Number(button.dataset.offer), button.dataset.qty);
    });

    window.addEventListener('keydown', event => {
      if (event.target.matches('input, textarea') || document.querySelector('dialog[open]')) return;
      const step = 32;
      if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') this.renderer.moveCamera(step, 0);
      if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') this.renderer.moveCamera(-step, 0);
      if (event.key === 'ArrowUp' || event.key.toLowerCase() === 'w') this.renderer.moveCamera(0, step);
      if (event.key === 'ArrowDown' || event.key.toLowerCase() === 's') this.renderer.moveCamera(0, -step);
      if (event.code === 'Space') { event.preventDefault(); this.togglePause(); }
      if (['1', '2', '3'].includes(event.key)) this.setSpeed([1, 2, 4][Number(event.key) - 1]);
      if (event.key === 'Escape') this.setBuildMode(null);
    });
    window.addEventListener('beforeunload', () => saveLocal(this.state));
  }

  renderStaticUI() {
    $('#resourceBar').innerHTML = Object.entries(RESOURCE_META).map(([key, meta]) => `
      <div class="resource-pill" data-resource="${key}" title="${meta.label}">
        <span>${meta.icon}</span><strong>0</strong>
      </div>`).join('');
    this.renderCategoryTabs();
    this.renderBuildList();
    $('#helpContent').innerHTML = HELP_SECTIONS.map(([title, text]) => `
      <div class="help-item"><strong>${title}</strong><p>${text}</p></div>`).join('');
  }

  renderCategoryTabs() {
    $('#categoryTabs').innerHTML = CATEGORIES.map(category => `
      <button role="tab" aria-selected="${this.activeCategory === category.id}" data-category="${category.id}" class="${this.activeCategory === category.id ? 'active' : ''}">${category.label}</button>`).join('');
  }

  renderBuildList() {
    const options = Object.entries(BUILDINGS).filter(([, meta]) => meta.category === this.activeCategory && !meta.initial);
    $('#buildList').innerHTML = options.map(([type, meta]) => {
      const affordable = this.canAfford(meta.cost);
      const costs = Object.entries(meta.cost).map(([resource, amount]) => {
        const missing = this.state.resources[resource] < amount;
        return `<span class="${missing ? 'missing' : ''}">${RESOURCE_META[resource].icon} ${amount}</span>`;
      }).join('');
      return `<button class="build-card ${this.buildMode === type ? 'selected' : ''}" data-building="${type}" ${affordable ? '' : 'disabled'} title="${esc(meta.description)}">
        <span class="build-icon">${meta.icon}</span>
        <span class="build-copy"><strong>${meta.name}</strong><small>${meta.size[0]}×${meta.size[1]} casillas</small></span>
        <span class="cost">${costs}</span>
      </button>`;
    }).join('') || '<p class="modal-lead">No hay edificios en esta categoría.</p>';
  }

  setBuildMode(type) {
    this.buildMode = type;
    this.renderer.buildType = type;
    $('#gameCanvas').classList.toggle('building', Boolean(type));
    $('#cancelBuild').classList.toggle('hidden', !type);
    $('#buildHint').classList.toggle('hidden', !type);
    $('#buildHint').textContent = type ? `Coloca: ${BUILDINGS[type].name} · Esc para cancelar` : '';
    this.renderBuildList();
  }

  canAfford(cost) {
    return Object.entries(cost).every(([key, amount]) => (this.state.resources[key] || 0) >= amount);
  }

  canPlace(type, x, y) {
    const meta = BUILDINGS[type];
    if (!meta || x < 0 || y < 0 || x + meta.size[0] > MAP_SIZE || y + meta.size[1] > MAP_SIZE) return false;
    for (let dx = 0; dx < meta.size[0]; dx++) {
      for (let dy = 0; dy < meta.size[1]; dy++) {
        if (this.renderer.terrainAt(x + dx, y + dy, this.state.seed) === 'water') return false;
      }
    }
    return !this.state.buildings.some(building => {
      const other = BUILDINGS[building.type];
      return x < building.x + other.size[0] && x + meta.size[0] > building.x && y < building.y + other.size[1] && y + meta.size[1] > building.y;
    });
  }

  handleTileClick(tile) {
    if (this.buildMode) {
      const meta = BUILDINGS[this.buildMode];
      if (!this.canAfford(meta.cost)) {
        this.toast('Aún no tienes todos los recursos necesarios.', 'warn');
        this.renderBuildList();
        return;
      }
      if (!this.canPlace(this.buildMode, tile.x, tile.y)) {
        this.toast('Busca una zona de tierra libre para construir.', 'warn');
        return;
      }
      for (const [resource, amount] of Object.entries(meta.cost)) this.state.resources[resource] -= amount;
      const building = {
        id: makeId('b'), type: this.buildMode, x: tile.x, y: tile.y, workers: 0,
        progress: 0, cycle: 0, createdDay: this.state.clock.day,
        animals: this.buildMode === 'barn' ? 2 : 0, breedingClock: 0
      };
      this.state.buildings.push(building);
      this.selectBuilding(building.id);
      this.addLog(`Comenzó la construcción de ${meta.name}.`);
      this.toast(`${meta.name}: obra iniciada.`, 'good');
      this.setBuildMode(null);
      this.refreshUI(true);
      return;
    }

    const selected = [...this.state.buildings].reverse().find(building => {
      const size = BUILDINGS[building.type].size;
      return tile.x >= building.x && tile.x < building.x + size[0] && tile.y >= building.y && tile.y < building.y + size[1];
    });
    this.selectBuilding(selected?.id || null);
  }

  selectBuilding(id) {
    this.state.ui.selectedBuildingId = id;
    this.renderer.selectedId = id;
    this.renderInspector();
  }

  selectedBuilding() {
    return this.state.buildings.find(building => building.id === this.state.ui.selectedBuildingId);
  }

  handleInspectorAction(event) {
    const action = event.target.closest('[data-action]')?.dataset.action;
    const building = this.selectedBuilding();
    if (!action || !building) return;
    const meta = BUILDINGS[building.type];
    if (action === 'add-worker') {
      if (building.progress < 100) return this.toast('Termina la obra antes de asignar personal.', 'warn');
      if (building.workers >= meta.maxWorkers) return;
      if (this.idleWorkers() <= 0) return this.toast('No hay aldeanos disponibles. Construye casas y mantén buenas reservas.', 'warn');
      building.workers++;
      this.addLog(`${this.workerWord(building.workers)} en ${meta.name}.`);
    }
    if (action === 'remove-worker' && building.workers > 0) building.workers--;
    if (action === 'buy-animal') {
      if (building.type !== 'barn' || building.animals >= meta.animalHousing) return;
      if (this.state.resources.coins < 12 || this.state.resources.grain < 3) return this.toast('Necesitas 12 monedas y 3 de grano.', 'warn');
      this.state.resources.coins -= 12; this.state.resources.grain -= 3; building.animals++;
      this.addLog(`Llegó un nuevo animal al ${meta.name}.`);
      this.toast('El establo tiene un nuevo habitante.', 'good');
    }
    if (action === 'demolish') {
      if (meta.initial) return;
      if (!confirm(`¿Demoler ${meta.name}? Recuperarás el 35 % de sus materiales.`)) return;
      for (const [resource, amount] of Object.entries(meta.cost)) this.state.resources[resource] += Math.floor(amount * .35);
      this.state.buildings = this.state.buildings.filter(item => item.id !== building.id);
      this.selectBuilding(null);
      this.addLog(`${meta.name} fue desmontado; se recuperaron algunos materiales.`);
    }
    this.refreshUI(true);
  }

  workerWord(count) {
    return count === 1 ? 'Trabaja 1 aldeano' : `Trabajan ${count} aldeanos`;
  }

  idleWorkers() {
    const assigned = this.state.buildings.reduce((sum, building) => sum + (building.workers || 0), 0);
    return Math.max(0, this.state.villagers.length - assigned);
  }

  housingCapacity() {
    return 6 + this.state.buildings.reduce((sum, building) => sum + (building.progress >= 100 ? (BUILDINGS[building.type].housing || 0) : 0), 0);
  }

  totalFood() {
    const r = this.state.resources;
    return r.bread * 2 + r.vegetables + r.grain + r.eggs + r.milk;
  }

  productionBonus() {
    return 1 + this.state.buildings.reduce((sum, building) => {
      const meta = BUILDINGS[building.type];
      return sum + (building.progress >= 100 && (building.workers > 0 || meta.wonder) ? (meta.productionBonus || 0) : 0);
    }, 0);
  }

  loop(now) {
    const delta = Math.min(.1, (now - this.lastFrame) / 1000);
    this.lastFrame = now;
    this.updateVillagers(delta);
    if (!this.state.clock.paused) {
      this.simAccumulator += delta * HOURS_PER_REAL_SECOND * this.state.clock.speed;
      while (this.simAccumulator >= 1 / 60) {
        this.advanceMinutes(1);
        this.simAccumulator -= 1 / 60;
      }
    }
    this.uiAccumulator += delta;
    this.autosaveAccumulator += delta;
    if (this.uiAccumulator > .45) { this.refreshUI(); this.uiAccumulator = 0; }
    if (this.autosaveAccumulator > 18) { saveLocal(this.state); this.autosaveAccumulator = 0; }
    this.renderer.render();
    requestAnimationFrame(time => this.loop(time));
  }

  advanceMinutes(minutes) {
    const clock = this.state.clock;
    const previousHour = clock.hour;
    clock.minute += minutes;
    if (clock.minute >= 60) { clock.minute -= 60; clock.hour++; }
    if (clock.hour >= 24) {
      clock.hour = 0; clock.day++;
      clock.seasonIndex = Math.floor((clock.day - 1) / 14) % SEASONS.length;
      this.processNewDay();
    }
    if (clock.hour !== previousHour) this.processHour();
  }

  processHour() {
    const incomplete = this.state.buildings.filter(building => building.progress < 100);
    let availableBuilders = this.idleWorkers();
    for (const building of incomplete) {
      const builders = availableBuilders > 0 ? 1 : 0;
      if (builders) availableBuilders--;
      building.progress = Math.min(100, building.progress + (builders ? 7 : 1.4));
      if (building.progress >= 100 && !building.completedNotified) {
        building.completedNotified = true;
        const meta = BUILDINGS[building.type];
        this.addLog(`${meta.name} quedó terminado.`);
        this.toast(`${meta.name} está listo.`, 'good');
        if (meta.wonder && !this.state.completedWonders.includes(building.type)) {
          this.state.completedWonders.push(building.type);
          this.celebrateWonder(meta);
        }
      }
    }

    const bonus = this.productionBonus();
    for (const building of this.state.buildings) {
      const meta = BUILDINGS[building.type];
      if (building.progress < 100 || !meta.production || building.workers <= 0) continue;
      building.cycle += building.workers;
      if (building.cycle + 0.0001 < meta.production.hours) continue;
      if (!this.hasInputs(meta.production.inputs)) {
        building.cycle = meta.production.hours;
        continue;
      }
      building.cycle -= meta.production.hours;
      for (const [resource, amount] of Object.entries(meta.production.inputs)) this.state.resources[resource] -= amount;
      let multiplier = bonus;
      if (building.type === 'farm') multiplier *= SEASONS[this.state.clock.seasonIndex].farm;
      if (building.type === 'barn') multiplier *= clamp((building.animals || 2) / 3, .66, 2.5);
      for (const [resource, amount] of Object.entries(meta.production.outputs)) {
        const produced = Math.max(1, Math.round(amount * multiplier));
        this.state.resources[resource] += produced;
        this.state.totalProduced += produced;
      }
      this.setWorkerThought(building, building.type === 'farm' ? '🌾' : '✨');
    }

    for (const building of this.state.buildings.filter(item => item.type === 'barn' && item.progress >= 100 && item.workers > 0)) {
      building.breedingClock = (building.breedingClock || 0) + 1;
      if (building.breedingClock >= 48 && building.animals < BUILDINGS.barn.animalHousing && this.state.resources.grain >= 5) {
        building.breedingClock = 0;
        building.animals++;
        this.state.resources.grain -= 5;
        this.addLog('Nació un animal en el establo. La comunidad lo recibió con alegría.');
        this.toast('¡La familia del establo ha crecido!', 'good');
      }
    }
  }

  hasInputs(inputs) {
    return Object.entries(inputs).every(([resource, amount]) => this.state.resources[resource] >= amount);
  }

  processNewDay() {
    const need = Math.ceil(this.state.villagers.length * .65);
    let remaining = need;
    for (const [resource, value] of [['bread', 2], ['vegetables', 1], ['eggs', 1], ['milk', 1], ['grain', 1]]) {
      if (remaining <= 0) break;
      const units = Math.min(this.state.resources[resource], Math.ceil(remaining / value));
      this.state.resources[resource] -= units;
      remaining -= units * value;
    }

    const civicBonus = this.state.buildings.reduce((sum, building) => sum + (building.progress >= 100 ? (BUILDINGS[building.type].happiness || 0) : 0), 0);
    const target = clamp((remaining <= 0 ? 68 : 42) + civicBonus, 20, 98);
    this.state.happiness = clamp(this.state.happiness + (target - this.state.happiness) * .12, 5, 100);
    if (remaining > 0) this.addLog('Las despensas quedaron cortas. El pueblo se organiza para la próxima cosecha.');

    const capacity = this.housingCapacity();
    if (this.state.clock.day - this.state.lastMigrationDay >= 2 && capacity > this.state.villagers.length && this.totalFood() > this.state.villagers.length * 2 && this.state.happiness >= 58) {
      const newVillager = createVillager(this.state.villagers.length);
      this.state.villagers.push(newVillager);
      this.state.lastMigrationDay = this.state.clock.day;
      this.addLog(`${newVillager.name} se unió a la comunidad atraído por su bienestar.`);
      this.toast(`¡${newVillager.name} se ha mudado a ${this.state.townName}!`, 'good');
    }

    if (this.state.clock.day % 4 === 0) this.addLog('Las caravanas vecinas actualizaron sus precios.');
    saveLocal(this.state);
  }

  updateVillagers(delta) {
    const assignedTargets = [];
    for (const building of this.state.buildings.filter(item => item.workers > 0 && item.progress >= 100)) {
      for (let i = 0; i < building.workers; i++) assignedTargets.push({ x: building.x + .5 + i * .16, y: building.y + .6, building });
    }
    const constructionTargets = this.state.buildings.filter(item => item.progress < 100).map(building => ({ x: building.x + .5, y: building.y + .5, building }));

    this.state.villagers.forEach((villager, index) => {
      const job = assignedTargets[index] || constructionTargets[index - assignedTargets.length];
      if (job) {
        villager.targetX = job.x;
        villager.targetY = job.y;
      } else if (!Number.isFinite(villager.targetX) || Math.hypot(villager.x - villager.targetX, villager.y - villager.targetY) < .12) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 1.5 + Math.random() * 4;
        villager.targetX = clamp(17 + Math.cos(angle) * radius, 3, MAP_SIZE - 3);
        villager.targetY = clamp(17 + Math.sin(angle) * radius, 3, MAP_SIZE - 3);
      }
      const dx = villager.targetX - villager.x;
      const dy = villager.targetY - villager.y;
      const distance = Math.hypot(dx, dy);
      if (distance > .02) {
        const speed = Math.min(distance, delta * .42 * (this.state.clock.paused ? .35 : this.state.clock.speed ** .25));
        villager.x += dx / distance * speed;
        villager.y += dy / distance * speed;
      }
    });
  }

  setWorkerThought(building, thought) {
    const nearby = this.state.villagers.reduce((best, villager) => {
      const distance = Math.hypot(villager.x - building.x, villager.y - building.y);
      return !best || distance < best.distance ? { villager, distance } : best;
    }, null);
    if (nearby) {
      nearby.villager.thought = thought;
      nearby.villager.thoughtUntil = performance.now() + 2200;
    }
  }

  togglePause() {
    this.state.clock.paused = !this.state.clock.paused;
    this.refreshClock();
  }

  setSpeed(speed) {
    this.state.clock.speed = speed;
    this.state.clock.paused = false;
    this.refreshClock();
  }

  refreshUI(force = false) {
    this.refreshResources();
    this.refreshClock();
    $('#townName').textContent = this.state.townName;
    $('#populationStat').textContent = `${this.state.villagers.length}/${this.housingCapacity()}`;
    $('#happinessStat').textContent = `${Math.round(this.state.happiness)}%`;
    this.renderInspector();
    this.renderLog();
    this.renderAspirations();
    const hasMarket = this.state.buildings.some(b => b.type === 'market' && b.progress >= 100);
    $('#tradeButton').disabled = !hasMarket;
    $('#tradeButton').title = hasMarket ? 'Abrir comercio' : 'Construye un mercado para comerciar';
    if (force) this.renderBuildList();
  }

  refreshResources() {
    for (const [key, amount] of Object.entries(this.state.resources)) {
      const pill = document.querySelector(`[data-resource="${key}"]`);
      if (!pill) continue;
      pill.querySelector('strong').textContent = fmt(amount);
      pill.classList.toggle('low', amount < 3 && ['wood', 'stone', 'grain', 'coins'].includes(key));
      pill.title = `${RESOURCE_META[key].label}: ${fmt(amount)}`;
    }
  }

  refreshClock() {
    const clock = this.state.clock;
    $('#dayLabel').textContent = `Día ${clock.day}`;
    $('#seasonLabel').textContent = `${SEASONS[clock.seasonIndex].icon} ${SEASONS[clock.seasonIndex].name}`;
    $('#timeLabel').textContent = `${String(clock.hour).padStart(2, '0')}:${String(clock.minute).padStart(2, '0')}`;
    $('#pauseButton').textContent = clock.paused ? '▶' : 'Ⅱ';
    $$('[data-speed]').forEach(button => button.classList.toggle('active', !clock.paused && Number(button.dataset.speed) === clock.speed));
  }

  renderInspector() {
    const building = this.selectedBuilding();
    $('#selectionEmpty').classList.toggle('hidden', Boolean(building));
    $('#inspector').classList.toggle('hidden', !building);
    if (!building) return;
    const meta = BUILDINGS[building.type];
    const complete = building.progress >= 100;
    let content = `
      <div class="inspector-title"><span class="build-icon">${meta.icon}</span><div><h2>${meta.name}</h2><small>${complete ? 'En funcionamiento' : 'En construcción'}</small></div></div>
      <p>${meta.description}</p>`;

    if (!complete) {
      content += `<div class="progress-label"><span>Avance de obra</span><strong>${Math.floor(building.progress)}%</strong></div>
        <div class="progress"><i style="width:${building.progress}%"></i></div>
        <p>Las obras avanzan más rápido cuando hay aldeanos sin asignar.</p>`;
    } else if (meta.maxWorkers > 0) {
      content += `<div class="worker-control">
        <button data-action="remove-worker" aria-label="Quitar trabajador" ${building.workers <= 0 ? 'disabled' : ''}>−</button>
        <div class="worker-count"><strong>${building.workers} / ${meta.maxWorkers}</strong><small>Trabajadores · ${this.idleWorkers()} libres</small></div>
        <button data-action="add-worker" aria-label="Añadir trabajador" ${building.workers >= meta.maxWorkers || this.idleWorkers() <= 0 ? 'disabled' : ''}>+</button>
      </div>`;
    }

    if (complete && meta.production) {
      const percent = clamp((building.cycle / meta.production.hours) * 100, 0, 100);
      const inputs = Object.entries(meta.production.inputs).map(([r, a]) => `${RESOURCE_META[r].icon}${a}`).join(' + ') || 'Tiempo';
      const outputs = Object.entries(meta.production.outputs).map(([r, a]) => `${RESOURCE_META[r].icon}${a}`).join(' + ');
      content += `<div class="production-line"><strong>${meta.production.label}</strong>
        <div class="production-flow">${inputs} → ${outputs}</div>
        <div class="progress-label"><span>Próximo ciclo</span><span>${Math.floor(percent)}%</span></div><div class="progress"><i style="width:${percent}%"></i></div></div>`;
    }

    if (building.type === 'barn' && complete) {
      content += `<div class="production-line"><strong>🐾 Animales: ${building.animals}/${meta.animalHousing}</strong><div class="production-flow">La cría ocurre de forma natural con alimento y cuidados.</div>
        <button data-action="buy-animal" class="small-button" ${building.animals >= meta.animalHousing ? 'disabled' : ''}>Acoger animal · 🪙12 + 🌾3</button></div>`;
    }

    content += `<div class="inspector-actions"><button data-action="focus" onclick="return false">Ubicar</button>${meta.initial ? '' : '<button data-action="demolish" class="danger">Desmontar</button>'}</div>`;
    $('#inspector').innerHTML = content;
    const focus = $('#inspector [data-action="focus"]');
    if (focus) focus.onclick = () => this.renderer.focusBuilding(building);
  }

  renderLog() {
    $('#eventLog').innerHTML = this.state.log.slice(0, 8).map(entry => `
      <div class="log-item"><i class="log-dot"></i><div>${esc(entry.text)}<time>Día ${entry.day} · ${String(entry.hour).padStart(2, '0')}:00</time></div></div>`).join('');
  }

  addLog(text) {
    this.state.log.unshift({ id: makeId('log'), day: this.state.clock.day, hour: this.state.clock.hour, text });
    this.state.log = this.state.log.slice(0, 40);
  }

  aspirationMetrics() {
    return {
      population: this.state.villagers.length,
      production: Math.floor(this.state.totalProduced || 0),
      trade: Math.floor(this.state.totalTraded || 0),
      wealth: Math.floor(this.state.resources.coins || 0),
      housing: this.housingCapacity(),
      days: this.state.clock.day,
      buildings: this.state.buildings.filter(b => b.progress >= 100).length,
      food: Math.floor(this.totalFood())
    };
  }
  renderAspirations() {
    const metrics = this.aspirationMetrics();
    const groups = ASPIRATION_CATEGORIES.map(category => {
      const items = ASPIRATIONS.filter(item => item.category === category.id);
      const completed = items.filter(item => metrics[item.metric] >= item.target).length;
      const visible = items.filter(item => metrics[item.metric] < item.target).slice(0, 3);
      const rows = visible.map(item => `
        <div class="aspiration">
          <span>${item.icon}</span>
          <div><strong>${item.title}</strong><small>${item.detail}</small></div>
          <em>${Math.min(metrics[item.metric], item.target).toLocaleString('es-CO')}/${item.target.toLocaleString('es-CO')}</em>
        </div>`).join('');
      return `<section class="aspiration-group">
        <header><strong>${category.icon} ${category.label}</strong><small>${completed}/125 completadas</small></header>
        ${rows || '<div class="aspiration done"><span>✓</span><div><strong>Categoría completada</strong><small>Alcanzaste las 125 metas.</small></div><em>Hecho</em></div>'}
      </section>`;
    }).join('');
    const totalDone = ASPIRATIONS.filter(item => metrics[item.metric] >= item.target).length;
    $('#aspirationList').innerHTML = `<div class="aspiration-summary"><strong>${totalDone}/1000 aspiraciones completadas</strong><small>Se muestran las próximas 3 metas de cada categoría.</small></div>${groups}`;
  }
  offerPrice(town, offer) {
    const wave = Math.sin((this.state.clock.day + town.id.length + offer.resource.length) * 1.73) * .12;
    return Math.max(1, Math.round(offer.price * (1 + wave)));
  }

  openTrade() {
    const hasMarket = this.state.buildings.some(b => b.type === 'market' && b.progress >= 100);
    if (!hasMarket) return this.toast('Construye un mercado para abrir rutas comerciales.', 'warn');
    this.renderTrade();
    $('#tradeDialog').showModal();
  }

  renderTrade() {
    $('#tradeIntro').textContent = `Día ${this.state.clock.day}: los pueblos comercian de forma autónoma y sus precios varían a diario. Tus monedas: ${fmt(this.state.resources.coins)}.`;
    const tradeQuantities = [1, 10, 50, 100];
    $('#tradeTowns').innerHTML = BOT_TOWNS.map(town => `
      <article class="trade-town">
        <header style="background:${town.color}"><h3>${town.name}</h3><small>${town.specialty}</small></header>
        <div class="offer-list">${town.offers.map((offer, index) => {
          const price = this.offerPrice(town, offer);
          const isTownBuying = offer.mode === 'buy';
          const stock = Math.floor(this.state.resources[offer.resource] || 0);
          const affordable = Math.floor((this.state.resources.coins || 0) / price);
          const maxQty = Math.max(0, isTownBuying ? stock : affordable);
          const buttons = tradeQuantities.map(quantity => {
            const canTrade = maxQty >= quantity;
            return `<button data-trade="1" data-town="${town.id}" data-offer="${index}" data-qty="${quantity}" ${canTrade ? '' : 'disabled'}>×${quantity}</button>`;
          }).join(' ');
          return `<div class="offer"><div><strong>${RESOURCE_META[offer.resource].icon} ${RESOURCE_META[offer.resource].label}</strong><small>${isTownBuying ? 'Te compra' : 'Te vende'} · 🪙${price} c/u</small></div>
            <div>${buttons} <button data-trade="1" data-town="${town.id}" data-offer="${index}" data-qty="max" ${maxQty > 0 ? '' : 'disabled'}>MAX</button></div></div>`;
        }).join('')}</div>
      </article>`).join('');
  }

  executeTrade(townId, offerIndex, quantityValue) {
    const town = BOT_TOWNS.find(item => item.id === townId);
    const offer = town?.offers[offerIndex];
    if (!town || !offer) return;

    const unitPrice = this.offerPrice(town, offer);
    const stock = Math.floor(this.state.resources[offer.resource] || 0);
    const affordable = Math.floor((this.state.resources.coins || 0) / unitPrice);
    const maxQty = Math.max(0, offer.mode === 'buy' ? stock : affordable);
    const quantity = quantityValue === 'max' ? maxQty : Math.floor(Number(quantityValue));

    if (![1, 10, 50, 100].includes(quantity) && quantityValue !== 'max') return;
    if (!Number.isFinite(quantity) || quantity <= 0) return this.toast('No hay unidades disponibles para comerciar.', 'warn');

    const totalPrice = unitPrice * quantity;
    if (offer.mode === 'buy') {
      if (stock < quantity) return this.toast('No tienes suficientes existencias.', 'warn');
      this.state.resources[offer.resource] -= quantity;
      this.state.resources.coins += totalPrice;
      this.addLog(`Vendiste ${quantity.toLocaleString('es-CO')} de ${RESOURCE_META[offer.resource].label.toLowerCase()} a ${town.name} por ${totalPrice.toLocaleString('es-CO')} monedas.`);
    } else {
      if (this.state.resources.coins < totalPrice) return this.toast('No tienes suficientes monedas.', 'warn');
      this.state.resources.coins -= totalPrice;
      this.state.resources[offer.resource] += quantity;
      this.addLog(`Compraste ${quantity.toLocaleString('es-CO')} de ${RESOURCE_META[offer.resource].label.toLowerCase()} a ${town.name} por ${totalPrice.toLocaleString('es-CO')} monedas.`);
    }

    this.state.totalTraded += quantity;
    this.state.tradeHistory.push({
      day: this.state.clock.day,
      townId,
      resource: offer.resource,
      mode: offer.mode,
      quantity,
      unitPrice,
      totalPrice
    });
    this.state.tradeHistory = this.state.tradeHistory.slice(-100);
    this.toast(`Intercambio de ${quantity.toLocaleString('es-CO')} unidades con ${town.name}.`, 'good');
    this.renderTrade();
    this.refreshUI(true);
    saveLocal(this.state);
  }

  celebrateWonder(meta) {
    $('#wonderTitle').textContent = meta.name;
    $('#wonderText').textContent = `Tu comunidad ha terminado ${meta.name}. Es un hito memorable, no un final: la partida continúa y puedes seguir expandiendo ${this.state.townName} libremente.`;
    $('#wonderDialog').showModal();
  }

  toast(message, kind = '') {
    const toast = document.createElement('div');
    toast.className = `toast ${kind}`;
    toast.textContent = message;
    $('#toastStack').appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateY(-6px)'; }, 3200);
    setTimeout(() => toast.remove(), 3600);
  }

  renderCloudStatus() {
    const ref = getCloudRef();
    const status = $('#cloudStatus');
    if (!ref) {
      status.className = 'cloud-status';
      status.innerHTML = '<strong>Solo guardado local.</strong><br>Crea una partida en la nube después de configurar Supabase en Netlify.';
      $('#syncCloudSave').disabled = true;
      return;
    }
    status.className = 'cloud-status connected';
    status.innerHTML = `<strong>Partida vinculada</strong><br>ID: ${esc(ref.id)}<br>Clave: ${esc(ref.token)}<br><small>Guarda ambos datos en un lugar seguro. Última sincronización: ${ref.updatedAt ? new Date(ref.updatedAt).toLocaleString('es-CO') : 'pendiente'}.</small>`;
    $('#syncCloudSave').disabled = false;
    $('#cloudIdInput').value = ref.id;
    $('#cloudTokenInput').value = ref.token;
  }

  async createCloud() {
    if (this.cloudBusy) return;
    this.cloudBusy = true;
    $('#createCloudSave').disabled = true;
    try {
      await createCloudSave(this.state);
      this.renderCloudStatus();
      this.toast('Partida en la nube creada.', 'good');
    } catch (error) {
      this.toast(error.message, 'warn');
    } finally {
      this.cloudBusy = false;
      $('#createCloudSave').disabled = false;
    }
  }

  async syncCloud() {
    if (this.cloudBusy) return;
    this.cloudBusy = true;
    $('#syncCloudSave').disabled = true;
    try {
      await syncCloudSave(this.state);
      this.renderCloudStatus();
      this.toast('Partida sincronizada con Supabase.', 'good');
    } catch (error) {
      this.toast(error.message, 'warn');
    } finally {
      this.cloudBusy = false;
      $('#syncCloudSave').disabled = !getCloudRef();
    }
  }

  async loadCloud() {
    const id = $('#cloudIdInput').value;
    const token = $('#cloudTokenInput').value;
    if (!id.trim() || !token.trim()) return this.toast('Escribe el ID y la clave privada.', 'warn');
    if (this.cloudBusy) return;
    this.cloudBusy = true;
    $('#loadCloudSave').disabled = true;
    try {
      const result = await loadCloudSave(id, token);
      this.setState(result.state);
      $('#cloudDialog').close();
      this.toast('Partida restaurada desde Supabase.', 'good');
    } catch (error) {
      this.toast(error.message, 'warn');
    } finally {
      this.cloudBusy = false;
      $('#loadCloudSave').disabled = false;
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.civilis = new Civilis();
  console.info(`Civilis ${GAME_VERSION} iniciado.`);
});
