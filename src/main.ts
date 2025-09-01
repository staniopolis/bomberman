import { Game } from './game/game';

const canvas = document.getElementById('game') as HTMLCanvasElement;
canvas.width = 16*13; canvas.height = 16*11;
const game = new Game(canvas);
void game.start();
