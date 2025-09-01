export type Tile = 'empty' | 'solid' | 'breakable';
export interface LevelData {
  width: number;
  height: number;
  tiles: string[];
}

export interface Level extends LevelData {
  entities: { x: number; y: number; type: string }[];
  playerStart: { x: number; y: number };
}

export async function loadLevel(path: string): Promise<Level> {
  const res = await fetch(path);
  const data: LevelData = await res.json();
  const level: Level = { ...data, entities: [], playerStart: { x: 1, y: 1 } };
  for (let y = 0; y < data.height; y++) {
    const row = data.tiles[y];
    for (let x = 0; x < data.width; x++) {
      const c = row[x];
      switch (c) {
        case 'P': level.playerStart = { x, y }; break;
        case 'A': level.entities.push({ x, y, type: 'A' }); break;
        case 'B': level.entities.push({ x, y, type: 'B' }); break;
      }
    }
  }
  return level;
}

export function charToTile(c: string): Tile {
  if (c === '#') return 'solid';
  if (c === '*') return 'breakable';
  return 'empty';
}
