export async function loadSpriteSheet(colorblind=false): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  canvas.width = 64; canvas.height = 16;
  const ctx = canvas.getContext('2d')!;
  if (colorblind) {
    ctx.fillStyle = '#fff'; ctx.fillRect(0,0,16,16);
    ctx.fillStyle = '#ff0'; ctx.fillRect(16,0,16,16);
    ctx.fillStyle = '#0ff'; ctx.fillRect(32,0,16,16);
  } else {
    ctx.fillStyle = '#0af'; ctx.fillRect(0,0,16,16); // player
    ctx.fillStyle = '#f44'; ctx.fillRect(16,0,16,16); // enemy A
    ctx.fillStyle = '#4f4'; ctx.fillRect(32,0,16,16); // enemy B
  }
  ctx.fillStyle = '#888';
  ctx.beginPath(); ctx.arc(48+8,8,7,0,Math.PI*2); ctx.fill(); // bomb
  return canvas;
}
