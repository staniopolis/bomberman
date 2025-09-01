import { World, Entity } from './core/ecs';
import { Position, Velocity, Player, Bomb, Explosion, Enemy, PowerUp, PowerUpType, Render, Breakable, Solid } from './components';
import { createInput, InputState } from './input';
import { loadLevel, charToTile, Level } from './map';
import { loadSpriteSheet } from './assets/sprites';
import { playTone } from './sound';
import { loadProgress, saveProgress, Progress } from './storage';

export const TILE = 16;
export const BOMB_TIME = 2.5;

export class Game {
  private world = new World();
  private ctx: CanvasRenderingContext2D;
  private input: InputState;
  private spriteSheet!: HTMLCanvasElement;
  private level!: Level;
  private running = false;
  private last = 0;
  private timer = 0;
  private score = 0;
  private ui = document.getElementById('ui')!;
  private progress: Progress = loadProgress();
  private shake = 0;

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!;
    this.input = createInput(canvas);
    window.addEventListener('blur', ()=>{ if (this.running) { this.input.pause=true; } });
  }

  async start() {
    this.spriteSheet = await loadSpriteSheet();
    this.showTitle();
  }

  private clearUI() { this.ui.innerHTML = ''; }

  private button(label: string, onclick: () => void) {
    const btn = document.createElement('button');
    btn.textContent = label; btn.onclick = onclick; btn.style.display='block';
    btn.style.margin='8px';
    this.ui.appendChild(btn);
  }

  private showTitle() {
    this.clearUI();
    const title = document.createElement('h1'); title.textContent='Bomberman'; this.ui.appendChild(title);
    this.button('Play', () => this.showLevelSelect());
    this.button('Levels', () => this.showLevelSelect());
    this.button('Settings', () => this.showSettings());
    this.button('Controls', () => alert('Use arrows/WASD to move, space to bomb.'));
  }

  private showSettings() {
    this.clearUI();
    const back = document.createElement('button'); back.textContent='Back'; back.onclick=()=>this.showTitle();
    const volLabel = document.createElement('label'); volLabel.textContent='Volume';
    const vol = document.createElement('input'); vol.type='range'; vol.min='0'; vol.max='1'; vol.step='0.1'; vol.value='1';
    vol.oninput = () => this.volume = parseFloat(vol.value);
    const cbLabel=document.createElement('label'); cbLabel.textContent='Colorblind';
    const cb=document.createElement('input'); cb.type='checkbox'; cb.onchange=async()=>{ this.colorblind=cb.checked; this.spriteSheet=await loadSpriteSheet(this.colorblind); };
    const rmLabel=document.createElement('label'); rmLabel.textContent='Reduced motion';
    const rm=document.createElement('input'); rm.type='checkbox'; rm.onchange=()=>{ this.reduced=rm.checked; };
    this.ui.append(back, volLabel, vol, cbLabel, cb, rmLabel, rm);
  }

  private volume = 1;
  private colorblind = false;
  private reduced = false;

  private showLevelSelect() {
    this.clearUI();
    const diff=document.createElement('select');
    ['Easy','Normal','Hard'].forEach((d,i)=>{ const o=document.createElement('option'); o.value=String(i); o.textContent=d; if(i===this.difficultyIndex) o.selected=true; diff.appendChild(o); });
    diff.onchange=()=>{ this.difficultyIndex=parseInt(diff.value); };
    this.ui.appendChild(diff);
    for (let i=1;i<=10;i++) {
      const btn=document.createElement('button');
      btn.textContent='Level '+i;
      if (i>this.progress.unlocked) btn.disabled=true;
      btn.onclick=()=>this.loadAndStart(`/assets/levels/level${i}.json`);
      this.ui.appendChild(btn);
    }
    const back = document.createElement('button'); back.textContent='Back'; back.onclick=()=>this.showTitle(); this.ui.appendChild(back);
  }

  private difficultyIndex=1; // 0 easy,1 normal,2 hard
  private get difficultyMultiplier() { return [0.8,1,1.2][this.difficultyIndex]; }

  private async loadAndStart(path: string) {
    this.level = await loadLevel(path);
    this.initWorld();
    this.clearUI();
    this.running = true; this.last = performance.now();
    requestAnimationFrame(t => this.loop(t));
  }

  private initWorld() {
    this.world = new World();
    this.score = 0; this.timer = 0;
    // build tiles (breakables and solids)
    for (let y=0;y<this.level.height;y++) {
      for (let x=0;x<this.level.width;x++) {
        const c = this.level.tiles[y][x];
        const tile = charToTile(c);
        if (tile === 'solid') {
          const e = this.world.createEntity();
          this.world.addComponent<Position>(e,'pos',{x,y});
          this.world.addComponent<Solid>(e,'solid',{});
          this.world.addComponent<Render>(e,'render',{sprite:-1});
        } else if (tile === 'breakable') {
          const e = this.world.createEntity();
          this.world.addComponent<Position>(e,'pos',{x,y});
          this.world.addComponent<Breakable>(e,'breakable',{});
          this.world.addComponent<Render>(e,'render',{sprite:-2});
        }
      }
    }
    // player
    const player = this.world.createEntity();
    this.world.addComponent<Position>(player,'pos',{...this.level.playerStart});
    this.world.addComponent<Player>(player,'player',{speed:4,bombs:0,maxBombs:1,radius:1});
    this.world.addComponent<Velocity>(player,'vel',{x:0,y:0});
    this.world.addComponent<Render>(player,'render',{sprite:0});
    // enemies
    for (const ent of this.level.entities) {
      const e = this.world.createEntity();
      this.world.addComponent<Position>(e,'pos',{x:ent.x,y:ent.y});
      this.world.addComponent<Enemy>(e,'enemy',{type: ent.type as any, speed:2*this.difficultyMultiplier});
      this.world.addComponent<Velocity>(e,'vel',{x:0,y:0});
      this.world.addComponent<Render>(e,'render',{sprite: ent.type==='A'?1:2});
    }
  }

  private loop(t: number) {
    if (!this.running) return;
    const dt = (t - this.last) / 1000; this.last = t;
    this.update(dt); this.render();
    requestAnimationFrame(tt => this.loop(tt));
  }

  private update(dt: number) {
    if (this.input.pause) { this.running=false; this.showPause(); this.input.pause=false; return; }
    this.timer += dt;
    if (this.shake>0) this.shake = Math.max(0,this.shake-dt*8);
    // handle player input
    const players = this.world.query('player','pos','vel');
    for (const id of players) {
      const vel = this.world.get<Velocity>('vel')[id];
      const player = this.world.get<Player>('player')[id];
      vel.x = (this.input.right?1:0) - (this.input.left?1:0);
      vel.y = (this.input.down?1:0) - (this.input.up?1:0);
      if (vel.x || vel.y) {
        const pos = this.world.get<Position>('pos')[id];
        const nx = pos.x + vel.x*player.speed*dt;
        const ny = pos.y + vel.y*player.speed*dt;
        if (this.isPassable(nx, ny)) { pos.x = nx; pos.y = ny; }
      }
      if (this.input.bomb) { this.placeBomb(id); this.input.bomb=false; }
    }
    // bombs
    const bombs = this.world.query('bomb','pos');
    for (const id of bombs) {
      const bomb = this.world.get<Bomb>('bomb')[id];
      bomb.timer -= dt;
      if (bomb.timer <= 0) this.explodeBomb(id);
    }
    // explosions
    const exps = this.world.query('explosion');
    for (const id of exps) {
      const exp = this.world.get<Explosion>('explosion')[id];
      exp.timer -= dt; if (exp.timer<=0) this.world.removeEntity(id);
    }
    // enemies simple AI
    const enemies = this.world.query('enemy','pos','vel');
    for (const id of enemies) {
      const enemy = this.world.get<Enemy>('enemy')[id];
      const vel = this.world.get<Velocity>('vel')[id];
      const pos = this.world.get<Position>('pos')[id];
      const target = this.world.get<Position>('pos')[players[0]]; // chase first player
      const dx = target.x - pos.x, dy = target.y - pos.y;
      const d = Math.hypot(dx,dy);
      if (enemy.type==='A') { vel.x = Math.sign(dx); vel.y = Math.sign(dy); }
      else { if (Math.random()<0.02) { vel.x = [-1,0,1][Math.floor(Math.random()*3)]; vel.y = [-1,0,1][Math.floor(Math.random()*3)]; } }
      const nx = pos.x + vel.x*enemy.speed*dt;
      const ny = pos.y + vel.y*enemy.speed*dt;
      if (this.isPassable(nx, ny)) pos.x = nx, pos.y = ny;
      // check collision with player
      const ppos = this.world.get<Position>('pos')[players[0]];
      if (Math.abs(ppos.x-pos.x)<0.5 && Math.abs(ppos.y-pos.y)<0.5) this.lose();
    }
    // powerups pickup
    const powers = this.world.query('power','pos');
    for (const pid of powers) {
      const ppos = this.world.get<Position>('pos')[pid];
      const ptype = this.world.get<PowerUp>('power')[pid];
      for (const id of players) {
        const pos = this.world.get<Position>('pos')[id];
        if (Math.abs(pos.x-ppos.x)<0.5 && Math.abs(pos.y-ppos.y)<0.5) {
          const pl = this.world.get<Player>('player')[id];
          if (ptype.type==='bomb') pl.maxBombs++;
          if (ptype.type==='fire') pl.radius++;
          if (ptype.type==='speed') pl.speed+=1;
          this.world.removeEntity(pid); this.score+=100; playTone(500,0.1,this.volume);
        }
      }
    }
    // win condition: no enemies
    if (enemies.length===0) this.win();
  }

  private showPause() {
    this.clearUI();
    const msg=document.createElement('div'); msg.textContent='Paused';
    this.ui.appendChild(msg);
    this.button('Resume',()=>{ this.running=true; this.last=performance.now(); requestAnimationFrame(t=>this.loop(t)); this.clearUI(); });
    this.button('Title',()=>this.showTitle());
  }

  private isPassable(x: number, y: number): boolean {
    const tx=Math.floor(x), ty=Math.floor(y);
    const char = this.level.tiles[ty][tx];
    if (charToTile(char)==='solid') return false;
    const breakables = this.world.query('breakable','pos');
    for (const id of breakables) {
      const p = this.world.get<Position>('pos')[id];
      if (p.x===tx && p.y===ty) return false;
    }
    const bombs = this.world.query('bomb','pos');
    for (const id of bombs) {
      const p=this.world.get<Position>('pos')[id];
      if (Math.round(x)===p.x && Math.round(y)===p.y) return false;
    }
    return true;
  }

  private placeBomb(playerId: Entity) {
    const pl = this.world.get<Player>('player')[playerId];
    if (pl.bombs >= pl.maxBombs) return;
    const pos = this.world.get<Position>('pos')[playerId];
    const tileX=Math.round(pos.x), tileY=Math.round(pos.y);
    // check existing bomb
    for (const id of this.world.query('bomb','pos')) {
      const p=this.world.get<Position>('pos')[id];
      if (p.x===tileX && p.y===tileY) return;
    }
    const b = this.world.createEntity();
    this.world.addComponent<Position>(b,'pos',{x:tileX,y:tileY});
    this.world.addComponent<Bomb>(b,'bomb',{timer:BOMB_TIME,radius:pl.radius,owner:playerId});
    this.world.addComponent<Render>(b,'render',{sprite:3});
    pl.bombs++;
    playTone(200,0.1,this.volume);
  }

  private explodeBomb(id: Entity) {
    const bomb = this.world.get<Bomb>('bomb')[id];
    const pos = this.world.get<Position>('pos')[id];
    this.world.removeEntity(id);
    const owner = this.world.get<Player>('player')[bomb.owner];
    owner.bombs--; this.score+=10;
    this.createExplosion(pos.x,pos.y,bomb.radius);
    playTone(100,0.2,this.volume);
    if (!this.reduced) this.shake = 4;
  }

  private createExplosion(x:number,y:number,r:number) {
    const center = this.world.createEntity();
    this.world.addComponent<Position>(center,'pos',{x,y});
    this.world.addComponent<Explosion>(center,'explosion',{timer:0.3});
    this.world.addComponent<Render>(center,'render',{sprite:-3});
    const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
    for (const [dx,dy] of dirs) {
      for (let i=1;i<=r;i++) {
        const tx=x+dx*i, ty=y+dy*i;
        if (!this.isPassable(tx,ty)) {
          // breakable?
          const breakables = this.world.query('breakable','pos');
          for (const id of breakables) {
            const p=this.world.get<Position>('pos')[id];
            if (p.x===tx && p.y===ty) {
              this.world.removeEntity(id); this.score+=20;
              if (Math.random()<0.3) this.spawnPowerUp(tx,ty);
            }
          }
          break;
        }
        const e=this.world.createEntity();
        this.world.addComponent<Position>(e,'pos',{x:tx,y:ty});
        this.world.addComponent<Explosion>(e,'explosion',{timer:0.3});
        this.world.addComponent<Render>(e,'render',{sprite:-3});
        // chain reaction
        const bombs=this.world.query('bomb','pos');
        for (const bid of bombs) {
          const bp=this.world.get<Position>('pos')[bid];
          if (bp.x===tx && bp.y===ty) this.explodeBomb(bid);
        }
      }
    }
    // check damage to enemies or player
    const victims=this.world.query('pos');
    for (const vid of victims) {
      if (this.world.get<Explosion>('explosion')[vid]) continue; // skip explosion entities
      const p=this.world.get<Position>('pos')[vid];
      if (Math.round(p.x)===x && Math.round(p.y)===y) { this.hitEntity(vid); }
    }
  }

  private hitEntity(id: Entity) {
    if (this.world.get<Player>('player')[id]) { this.lose(); }
    if (this.world.get<Enemy>('enemy')[id]) { this.world.removeEntity(id); this.score+=200; playTone(300,0.1,this.volume); }
  }

  private spawnPowerUp(x:number,y:number) {
    const p = this.world.createEntity();
    const types: PowerUpType[] = ['bomb','fire','speed'];
    const type = types[Math.floor(Math.random()*types.length)];
    this.world.addComponent<Position>(p,'pos',{x,y});
    this.world.addComponent<PowerUp>(p,'power',{type});
    this.world.addComponent<Render>(p,'render',{sprite:-4});
  }

  private win() {
    this.running=false;
    this.clearUI();
    const msg=document.createElement('div'); msg.textContent='You win! Score '+this.score.toString();
    this.ui.appendChild(msg); this.button('Back to title',()=>this.showTitle());
    playTone(800,0.3,this.volume);
    if (this.score>this.progress.bestScore) { this.progress.bestScore=this.score; this.progress.unlocked++; saveProgress(this.progress); }
  }

  private lose() {
    this.running=false;
    this.clearUI();
    const msg=document.createElement('div'); msg.textContent='Game Over';
    this.ui.appendChild(msg); this.button('Retry',()=>this.loadAndStart('/assets/levels/level1.json'));
    this.button('Title',()=>this.showTitle());
    playTone(50,0.5,this.volume);
  }

  private render() {
    this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
    this.ctx.save();
    if (this.shake>0 && !this.reduced) {
      this.ctx.translate((Math.random()-0.5)*this.shake,(Math.random()-0.5)*this.shake);
    }
    // draw tiles
    for (let y=0;y<this.level.height;y++) {
      for (let x=0;x<this.level.width;x++) {
        const c = this.level.tiles[y][x];
        if (charToTile(c)==='solid') { this.ctx.fillStyle='#444'; this.ctx.fillRect(x*TILE,y*TILE,TILE,TILE); }
      }
    }
    // breakables
    for (const id of this.world.query('breakable','pos')) {
      const p=this.world.get<Position>('pos')[id];
      this.ctx.fillStyle='#a52a2a'; this.ctx.fillRect(p.x*TILE,p.y*TILE,TILE,TILE);
    }
    // generic render
    for (const id of this.world.query('render','pos')) {
      const r=this.world.get<Render>('render')[id];
      const p=this.world.get<Position>('pos')[id];
      if (r.sprite>=0) {
        this.ctx.drawImage(this.spriteSheet,r.sprite*16,0,16,16,p.x*TILE,p.y*TILE,16,16);
      } else if (r.sprite===-3) {
        this.ctx.fillStyle='#ff0'; this.ctx.fillRect(p.x*TILE,p.y*TILE,TILE,TILE);
      } else if (r.sprite===-4) {
        this.ctx.fillStyle='#0f0'; this.ctx.fillRect(p.x*TILE+4,p.y*TILE+4,8,8);
      }
    }
    this.ctx.restore();
    // HUD
    this.ctx.fillStyle='#fff';
    this.ctx.fillText('Score: '+this.score,4,10);
    this.ctx.fillText('Time: '+this.timer.toFixed(1),80,10);
  }
}
