import { describe, it, expect } from 'vitest';
import { Game, BOMB_TIME } from '../src/game/game';

function setup() {
  const canvas = document.createElement('canvas');
  const game = new Game(canvas) as any;
  game.spriteSheet = document.createElement('canvas');
  game.level = { width:3,height:3,tiles:['###','#P#','###'],entities:[],playerStart:{x:1,y:1}};
  game.initWorld();
  return game;
}

describe('Bomb', () => {
  it('explodes after timer', () => {
    const game = setup();
    const player = game.world.query('player')[0];
    game.placeBomb(player);
    const id = game.world.query('bomb')[0];
    game.update(BOMB_TIME + 0.1);
    expect(game.world.get('bomb')[id]).toBeUndefined();
  });
});
