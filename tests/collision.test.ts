import { describe, it, expect } from 'vitest';
import { Game } from '../src/game/game';

function setup() {
  const canvas = document.createElement('canvas');
  const game = new Game(canvas) as any;
  game.spriteSheet = document.createElement('canvas');
  game.level = { width:5,height:5,tiles:[
    '#####',
    '#P*.#',
    '#...#',
    '#...#',
    '#####'
  ],entities:[],playerStart:{x:1,y:1}};
  game.initWorld();
  return game;
}

describe('Collision', () => {
  it('detects solid and bombs', () => {
    const game = setup();
    const pass = (x:number,y:number)=>(game as any).isPassable(x,y);
    expect(pass(0,0)).toBe(false); // solid
    expect(pass(2,1)).toBe(false); // breakable
    expect(pass(1,1)).toBe(true); // player tile empty initially
    expect(pass(-1,1)).toBe(false); // out of bounds left
    expect(pass(5,1)).toBe(false); // out of bounds right
    const player = game.world.query('player')[0];
    game.placeBomb(player);
    expect(pass(1,1)).toBe(false); // bomb blocks
  });
});
