export interface InputState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  bomb: boolean;
  pause: boolean;
}

export function createInput(canvas: HTMLCanvasElement): InputState {
  const state: InputState = { up: false, down: false, left: false, right: false, bomb: false, pause: false };
  const map: Record<string, keyof InputState> = {
    ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
    w: 'up', s: 'down', a: 'left', d: 'right', ' ': 'bomb', Escape: 'pause'
  };
  window.addEventListener('keydown', e => { const k = map[e.key]; if (k) { state[k] = true; e.preventDefault(); } });
  window.addEventListener('keyup', e => { const k = map[e.key]; if (k) { state[k] = false; e.preventDefault(); } });
  // Touch controls simplistic
  const ui = document.getElementById('ui')!;
  if ('ontouchstart' in window) {
    const makeBtn = (label: string, x: number, y: number, w: number, h: number, key: keyof InputState) => {
      const btn = document.createElement('button');
      btn.textContent = label; btn.style.position = 'absolute';
      btn.style.left = x+'px'; btn.style.top = y+'px';
      btn.style.width = w+'px'; btn.style.height = h+'px';
      btn.style.opacity = '0.5';
      btn.onpointerdown = () => state[key]=true;
      btn.onpointerup = () => state[key]=false;
      btn.onpointerleave = () => state[key]=false;
      ui.appendChild(btn);
    };
    makeBtn('⬆',20,window.innerHeight-140,60,60,'up');
    makeBtn('⬇',20,window.innerHeight-60,60,60,'down');
    makeBtn('⬅',-40+20,window.innerHeight-100,60,60,'left');
    makeBtn('➡',100,window.innerHeight-100,60,60,'right');
    makeBtn('💣',window.innerWidth-80,window.innerHeight-100,60,60,'bomb');
  }
  return state;
}
