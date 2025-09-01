import { describe, it, expect } from 'vitest';
import { Game, BOMB_TIME } from '../src/game/game';

function setup() {
  const canvas = document.createElement('canvas');
  const game = new Game(canvas) as any;
  game.spriteSheet = document.createElement('canvas');
  game.level = { width:5,height:5,tiles:[
    '#####',
    '#P#.#',
    '#.#.#',
    '#...#',
    '#####'
  ],entities:[],playerStart:{x:1,y:1}};
  game.initWorld();
  return game;
}

describe('Blast', () => {
  it('stops at solid tiles', () => {
    const game = setup();
    const player = game.world.query('player')[0];
    game.world.get('player')[player].radius = 3;
    game.placeBomb(player);
    game.update(BOMB_TIME + 0.1);
    const exps = game.world.query('explosion','pos').map((id:number)=>game.world.get('pos')[id]);
    expect(exps.some((p:any)=>p.x===2 && p.y===1)).toBe(false); // blocked by solid
    expect(exps.some((p:any)=>p.x===1 && p.y===2)).toBe(true); // downwards
  });
});
