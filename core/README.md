# /core（R2）
平台无关的 2048 引擎，可被小程序与 /web-sim 共用。

## 使用示例
```js
import { createGame, DIRECTIONS } from "./game.js";

const game = createGame({
  gridSize: 2,
  startTiles: 2,
  spawnValues: [2],
  target: 16,
  seed: "demo-seed"
});

console.log(game.getSnapshot());
game.move(DIRECTIONS.LEFT);
```

## API

- `createGame(config): Game`
- `DIRECTIONS: { UP, DOWN, LEFT, RIGHT }`

### Game 实例
- `state`: `{ grid, score, moved, won, over, moves }`
- `reset()`
- `move(dir)`
- `spawn(n)`
- `canMove()`
- `getSnapshot()`
- `setSeed(seed)`
- `loadFromGrid(grid)`
