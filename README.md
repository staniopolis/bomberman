# Bomberman

A Bomberman-style browser game built with TypeScript, Vite and HTML5 Canvas.

## Scripts

- `npm run dev` – start development server.
- `npm run build` – production build.
- `npm run preview` – preview production build.
- `npm test` – run unit tests.

## How to run

```bash
npm install
npm run dev
```
Open the printed URL in your browser.

## How it works

The game uses a simple **Entity-Component-System (ECS)** architecture.
- **Entities** are identified by numeric IDs.
- **Components** are plain TypeScript interfaces stored in maps keyed by entity.
- **Systems** iterate over entities with the needed components to update game logic.

A fixed timestep loop updates gameplay separately from rendering for smooth 60 FPS play. Levels are JSON tilemaps loaded at runtime. Assets are tiny programmatically generated sprites and WebAudio tones for SFX.

Progress such as unlocked levels and best score is saved to `localStorage`.

## Testing

Vitest unit tests cover bomb timing, explosion propagation and collision logic.

## License

This project includes placeholder art and sounds generated at runtime and released into the public domain.
