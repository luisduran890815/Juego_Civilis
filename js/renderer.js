import { BUILDINGS, MAP_SIZE, SEASONS, TILE_H, TILE_W } from './config.js';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const shade = (hex, amount) => {
  const n = parseInt(hex.slice(1), 16);
  const r = clamp((n >> 16) + amount, 0, 255);
  const g = clamp(((n >> 8) & 255) + amount, 0, 255);
  const b = clamp((n & 255) + amount, 0, 255);
  return `rgb(${r},${g},${b})`;
};

export class Renderer {
  constructor(canvas, getState) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.ctx.imageSmoothingEnabled = false;
    this.getState = getState;
    this.zoom = 0.82;
    this.camera = { x: 0, y: -10 };
    this.hoverTile = null;
    this.buildType = null;
    this.selectedId = null;
    this.dragging = false;
    this.dragStart = null;
    this.cameraStart = null;
    this.hasCentered = false;
    this.cssWidth = 800;
    this.cssHeight = 600;
    this.pixelRatio = 1;
    this.particles = [];
    this.bindInput();
    this.resize();
  }

  bindInput() {
    const canvas = this.canvas;
    canvas.addEventListener('pointerdown', event => {
      canvas.setPointerCapture(event.pointerId);
      this.dragging = true;
      this.dragMoved = false;
      this.dragStart = { x: event.clientX, y: event.clientY };
      this.cameraStart = { ...this.camera };
    });
    canvas.addEventListener('pointermove', event => {
      const rect = canvas.getBoundingClientRect();
      const local = { x: event.clientX - rect.left, y: event.clientY - rect.top };
      this.hoverTile = this.screenToTile(local.x, local.y);
      if (this.dragging) {
        const dx = event.clientX - this.dragStart.x;
        const dy = event.clientY - this.dragStart.y;
        if (Math.abs(dx) + Math.abs(dy) > 5) this.dragMoved = true;
        this.camera.x = this.cameraStart.x + dx;
        this.camera.y = this.cameraStart.y + dy;
      }
    });
    canvas.addEventListener('pointerup', event => {
      this.dragging = false;
      if (!this.dragMoved && this.onTileClick && this.hoverTile) this.onTileClick(this.hoverTile, event);
    });
    canvas.addEventListener('pointerleave', () => { this.hoverTile = null; this.dragging = false; });
    canvas.addEventListener('wheel', event => {
      event.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const px = event.clientX - rect.left;
      const py = event.clientY - rect.top;
      const before = this.screenToWorld(px, py);
      this.zoom = clamp(this.zoom * (event.deltaY > 0 ? 0.9 : 1.1), 0.48, 1.45);
      const afterScreen = this.worldToScreen(before.x, before.y);
      this.camera.x += px - afterScreen.x;
      this.camera.y += py - afterScreen.y;
    }, { passive: false });
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    this.cssWidth = Math.max(1, rect.width);
    this.cssHeight = Math.max(1, rect.height);
    this.pixelRatio = Math.min(2, window.devicePixelRatio || 1);
    this.canvas.width = Math.round(this.cssWidth * this.pixelRatio);
    this.canvas.height = Math.round(this.cssHeight * this.pixelRatio);
    if (!this.hasCentered && this.cssWidth > 10) {
      this.camera.x = 0;
      this.camera.y = -MAP_SIZE * TILE_H * this.zoom * 0.19;
      this.hasCentered = true;
    }
  }

  worldToScreen(x, y) {
    return {
      x: this.cssWidth / 2 + (x - y) * (TILE_W / 2) * this.zoom + this.camera.x,
      y: this.cssHeight * 0.18 + (x + y) * (TILE_H / 2) * this.zoom + this.camera.y
    };
  }

  screenToWorld(screenX, screenY) {
    const x = (screenX - this.cssWidth / 2 - this.camera.x) / this.zoom;
    const y = (screenY - this.cssHeight * 0.18 - this.camera.y) / this.zoom;
    return {
      x: (y / (TILE_H / 2) + x / (TILE_W / 2)) / 2,
      y: (y / (TILE_H / 2) - x / (TILE_W / 2)) / 2
    };
  }

  screenToTile(x, y) {
    const world = this.screenToWorld(x, y);
    return { x: Math.floor(world.x), y: Math.floor(world.y) };
  }

  terrainAt(x, y, seed = this.getState().seed) {
    if (x < 0 || y < 0 || x >= MAP_SIZE || y >= MAP_SIZE) return 'void';
    if (x < 2 || y < 2 || x >= MAP_SIZE - 2 || y >= MAP_SIZE - 2) return 'water';
    if (x >= 10 && x <= 23 && y >= 10 && y <= 22) return 'grass';
    const n = this.noise(x, y, seed);
    if (n < 0.026) return 'water';
    if (n > 0.81) return 'flowers';
    if (n > 0.69) return 'tallgrass';
    return 'grass';
  }

  noise(x, y, seed) {
    let n = Math.imul(x + 17, 374761393) + Math.imul(y + 31, 668265263) + Math.imul(seed | 0, 1447);
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
  }

  tilePolygon(x, y, width = 1, height = 1) {
    return [
      this.worldToScreen(x, y),
      this.worldToScreen(x + width, y),
      this.worldToScreen(x + width, y + height),
      this.worldToScreen(x, y + height)
    ];
  }

  polygon(points, fill, stroke = null, lineWidth = 1) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lineWidth; ctx.stroke(); }
  }

  drawTile(x, y, terrain, season, timeLight) {
    const points = this.tilePolygon(x, y);
    const variant = this.noise(x, y, this.getState().seed + 99);
    let color = variant > .5 ? season.ground : season.accent;
    if (terrain === 'water') color = variant > .5 ? '#5f9ba0' : '#69a7aa';
    if (terrain === 'void') color = '#294b48';
    this.polygon(points, color, shade(color, -12), Math.max(.45, this.zoom * .65));

    const ctx = this.ctx;
    const center = this.worldToScreen(x + .5, y + .5);
    if (terrain === 'water' && variant > .38) {
      ctx.strokeStyle = 'rgba(225,247,235,.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(center.x - 6 * this.zoom, center.y);
      ctx.lineTo(center.x + 6 * this.zoom, center.y);
      ctx.stroke();
    } else if (terrain === 'flowers' && this.zoom > .58) {
      ctx.fillStyle = variant > .9 ? '#f0d274' : '#f4e4da';
      ctx.fillRect(center.x - 1, center.y - 3 * this.zoom, 2, 2);
      ctx.fillStyle = '#3f7450';
      ctx.fillRect(center.x, center.y - 1, 1, 4 * this.zoom);
    } else if (terrain === 'tallgrass' && this.zoom > .72) {
      ctx.strokeStyle = 'rgba(48,98,58,.35)';
      ctx.beginPath();
      ctx.moveTo(center.x - 3, center.y + 2);
      ctx.lineTo(center.x - 1, center.y - 4 * this.zoom);
      ctx.moveTo(center.x + 2, center.y + 1);
      ctx.lineTo(center.x + 4, center.y - 3 * this.zoom);
      ctx.stroke();
    }

    if (timeLight < .92) {
      this.polygon(points, `rgba(25,43,56,${1 - timeLight})`);
    }
  }

  drawIsoBlock(building, meta) {
    const ctx = this.ctx;
    const [w, h] = meta.size;
    const footprint = this.tilePolygon(building.x, building.y, w, h);
    const lift = (meta.wonder ? 31 : meta.initial ? 28 : 20) * this.zoom;
    const top = footprint.map(point => ({ x: point.x, y: point.y - lift }));
    const leftWall = [footprint[3], footprint[2], top[2], top[3]];
    const rightWall = [footprint[1], footprint[2], top[2], top[1]];
    this.polygon(footprint, 'rgba(50,54,43,.18)');
    this.polygon(leftWall, shade(meta.color, -26), shade(meta.color, -45));
    this.polygon(rightWall, shade(meta.color, -10), shade(meta.color, -42));
    this.polygon(top, meta.roof || shade(meta.color, 12), shade(meta.roof || meta.color, -30));

    const center = this.worldToScreen(building.x + w / 2, building.y + h / 2);
    const progress = building.progress ?? 100;

    if (building.type === 'farm') {
      this.polygon(footprint, '#76562f', '#533f27');
      const stage = clamp(building.cycle / (meta.production?.hours || 10), 0, 1);
      for (let row = 0; row < 4; row++) {
        const a = this.worldToScreen(building.x + .18 + row * .42, building.y + .14);
        const b = this.worldToScreen(building.x + .18 + row * .42, building.y + .85);
        ctx.strokeStyle = stage > .65 ? '#e2bf4e' : '#5d913f';
        ctx.lineWidth = Math.max(1, 2.2 * this.zoom);
        ctx.beginPath(); ctx.moveTo(a.x, a.y - 2); ctx.lineTo(b.x, b.y - 2); ctx.stroke();
      }
    } else if (building.type === 'plaza' || building.type === 'grandGarden') {
      this.polygon(footprint, building.type === 'plaza' ? '#9e9a78' : '#70a76c', '#506b50');
      const count = building.type === 'grandGarden' ? 7 : 4;
      for (let i = 0; i < count; i++) {
        const px = building.x + .35 + (i % 3) * .75;
        const py = building.y + .35 + Math.floor(i / 3) * .75;
        const p = this.worldToScreen(px, py);
        ctx.fillStyle = i % 2 ? '#e8c858' : '#e59577';
        ctx.beginPath(); ctx.arc(p.x, p.y - 5 * this.zoom, 3 * this.zoom, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#527f4e'; ctx.fillRect(p.x - 1, p.y - 3 * this.zoom, 2, 5 * this.zoom);
      }
    } else {
      ctx.save();
      ctx.font = `${Math.round((meta.wonder ? 24 : 17) * this.zoom)}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.globalAlpha = progress < 100 ? .45 : .92;
      ctx.fillText(meta.icon, center.x, center.y - lift - 3 * this.zoom);
      ctx.restore();
    }

    if (building.type === 'mill' && progress >= 100) {
      const cx = center.x + 9 * this.zoom;
      const cy = center.y - lift - 1;
      ctx.save(); ctx.translate(cx, cy); ctx.rotate((performance.now() / 1500) % (Math.PI * 2));
      ctx.strokeStyle = '#725947'; ctx.lineWidth = 2 * this.zoom;
      for (let i = 0; i < 4; i++) { ctx.rotate(Math.PI / 2); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 15 * this.zoom); ctx.stroke(); }
      ctx.restore();
    }

    if (building.type === 'observatory' && progress >= 100) {
      ctx.fillStyle = '#d7dce6';
      ctx.beginPath(); ctx.arc(center.x, center.y - lift - 4 * this.zoom, 12 * this.zoom, Math.PI, 0); ctx.fill();
      ctx.strokeStyle = '#536485'; ctx.lineWidth = 2 * this.zoom; ctx.stroke();
    }

    if (progress < 100) {
      ctx.save();
      ctx.globalAlpha = .85;
      ctx.strokeStyle = '#e3c37a';
      ctx.lineWidth = 3 * this.zoom;
      for (let i = 0; i < 3; i++) {
        const p = this.worldToScreen(building.x + .2 + i * .35, building.y + .2 + i * .1);
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x, p.y - 24 * this.zoom); ctx.stroke();
      }
      ctx.restore();
    }

    if (building.id === this.selectedId) {
      ctx.save(); ctx.setLineDash([6, 4]);
      this.polygon(footprint, null, '#fff4a8', 2.5);
      ctx.restore();
    }
  }

  drawVillager(villager, state) {
    const ctx = this.ctx;
    const p = this.worldToScreen(villager.x, villager.y);
    const bob = Math.sin(performance.now() / 240 + villager.hue) * 1.2 * this.zoom;
    const s = this.zoom;
    ctx.fillStyle = 'rgba(38,52,43,.2)';
    ctx.beginPath(); ctx.ellipse(p.x, p.y + 2 * s, 5 * s, 2.5 * s, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = `hsl(${villager.hue} 43% 47%)`;
    ctx.fillRect(p.x - 3 * s, p.y - 9 * s + bob, 6 * s, 9 * s);
    ctx.fillStyle = '#e7bd91';
    ctx.fillRect(p.x - 2.5 * s, p.y - 14 * s + bob, 5 * s, 5 * s);
    ctx.fillStyle = `hsl(${(villager.hue + 165) % 360} 34% 25%)`;
    ctx.fillRect(p.x - 3 * s, p.y - 15 * s + bob, 6 * s, 2.5 * s);

    if (villager.thought && villager.thoughtUntil > performance.now()) {
      ctx.fillStyle = 'rgba(255,250,238,.94)';
      ctx.beginPath(); ctx.roundRect(p.x + 5 * s, p.y - 28 * s, 19 * s, 15 * s, 6 * s); ctx.fill();
      ctx.font = `${Math.round(9 * s)}px serif`; ctx.textAlign = 'center'; ctx.fillStyle = '#273a34';
      ctx.fillText(villager.thought, p.x + 14.5 * s, p.y - 20 * s);
    }
  }

  drawAnimals(building) {
    const ctx = this.ctx;
    const count = Math.min(building.animals || 0, 6);
    for (let i = 0; i < count; i++) {
      const offsetX = .25 + (i % 3) * .45;
      const offsetY = .62 + Math.floor(i / 3) * .28;
      const p = this.worldToScreen(building.x + offsetX, building.y + offsetY);
      ctx.fillStyle = i % 3 === 0 ? '#6f5545' : '#eee9dc';
      ctx.fillRect(p.x - 3 * this.zoom, p.y - 5 * this.zoom, 7 * this.zoom, 4 * this.zoom);
      ctx.fillStyle = '#493e35';
      ctx.fillRect(p.x + 3 * this.zoom, p.y - 5 * this.zoom, 2 * this.zoom, 2 * this.zoom);
    }
  }

  drawBuildPreview(state) {
    if (!this.buildType || !this.hoverTile) return;
    const meta = BUILDINGS[this.buildType];
    const valid = this.onCanPlace?.(this.buildType, this.hoverTile.x, this.hoverTile.y) ?? false;
    const points = this.tilePolygon(this.hoverTile.x, this.hoverTile.y, meta.size[0], meta.size[1]);
    this.ctx.save();
    this.ctx.setLineDash([6, 4]);
    this.polygon(points, valid ? 'rgba(95,177,104,.35)' : 'rgba(190,77,61,.38)', valid ? '#d9f4a5' : '#ffb0a3', 2.5);
    this.ctx.restore();
  }

  render() {
    const state = this.getState();
    const ctx = this.ctx;
    ctx.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);
    const season = SEASONS[state.clock.seasonIndex % SEASONS.length];
    const hour = state.clock.hour + state.clock.minute / 60;
    const daylight = hour < 6 || hour > 20 ? .72 : hour < 8 || hour > 18 ? .86 : 1;
    ctx.fillStyle = hour < 6 || hour > 20 ? '#536c70' : '#91ae79';
    ctx.fillRect(0, 0, this.cssWidth, this.cssHeight);

    for (let sum = 0; sum < MAP_SIZE * 2 - 1; sum++) {
      for (let x = 0; x < MAP_SIZE; x++) {
        const y = sum - x;
        if (y < 0 || y >= MAP_SIZE) continue;
        this.drawTile(x, y, this.terrainAt(x, y, state.seed), season, daylight);
      }
    }

    const sorted = [...state.buildings].sort((a, b) => (a.x + a.y) - (b.x + b.y));
    for (const building of sorted) {
      const meta = BUILDINGS[building.type];
      if (!meta) continue;
      this.drawIsoBlock(building, meta);
      if (building.type === 'barn' && building.progress >= 100) this.drawAnimals(building);
    }
    for (const villager of [...state.villagers].sort((a, b) => (a.x + a.y) - (b.x + b.y))) this.drawVillager(villager, state);
    this.drawBuildPreview(state);

    if (daylight < 1) {
      const alpha = (1 - daylight) * .36;
      const gradient = ctx.createLinearGradient(0, 0, 0, this.cssHeight);
      gradient.addColorStop(0, `rgba(36,49,78,${alpha})`);
      gradient.addColorStop(1, `rgba(25,43,66,${alpha * .8})`);
      ctx.fillStyle = gradient; ctx.fillRect(0, 0, this.cssWidth, this.cssHeight);
    }
  }

  moveCamera(dx, dy) {
    this.camera.x += dx;
    this.camera.y += dy;
  }

  focusBuilding(building) {
    const meta = BUILDINGS[building.type];
    const p = this.worldToScreen(building.x + meta.size[0] / 2, building.y + meta.size[1] / 2);
    this.camera.x += this.cssWidth / 2 - p.x;
    this.camera.y += this.cssHeight / 2 - p.y + 40;
  }
}
