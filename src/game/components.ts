export interface Position { x: number; y: number; }
export interface Velocity { x: number; y: number; }
export interface Player {
  speed: number;
  bombs: number;
  maxBombs: number;
  radius: number;
}
export interface Bomb { timer: number; radius: number; owner: number; }
export interface Solid {}
export interface Breakable {}
export interface Enemy { type: 'A' | 'B'; speed: number; }
export interface Explosion { timer: number; }
export type PowerUpType = 'bomb' | 'fire' | 'speed';
export interface PowerUp { type: PowerUpType; }
export interface Render { sprite: number; }
