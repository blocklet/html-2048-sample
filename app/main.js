/* eslint-disable */
document.addEventListener('DOMContentLoaded', () => {
  // Wait till the browser is ready to render the game (avoids glitches)
  window.requestAnimationFrame(() => {
    const manager = new GameManager(4, KeyboardInputManager, HTMLActuator);
  });
});

function GameManager(size, InputManager, Actuator) {
  this.size = size; // Size of the grid
  this.inputManager = new InputManager();
  this.actuator = new Actuator();

  this.startTiles = 2;

  this.inputManager.on('move', this.move.bind(this));
  this.inputManager.on('restart', this.restart.bind(this));

  this.setup();
}

// Restart the game
GameManager.prototype.restart = function () {
  this.actuator.restart();
  this.setup();
};

// Set up the game
GameManager.prototype.setup = function () {
  this.grid = new Grid(this.size);

  this.score = 0;
  this.over = false;
  this.won = false;

  // Add the initial tiles
  this.addStartTiles();

  // Update the actuator
  this.actuate();
};

// Set up the initial tiles to start the game with
GameManager.prototype.addStartTiles = function () {
  for (let i = 0; i < this.startTiles; i++) {
    this.addRandomTile();
  }
};

// Adds a tile in a random position
GameManager.prototype.addRandomTile = function () {
  if (this.grid.cellsAvailable()) {
    const value = Math.random() < 0.9 ? 2 : 4;
    const tile = new Tile(this.grid.randomAvailableCell(), value);

    this.grid.insertTile(tile);
  }
};

// Sends the updated grid to the actuator
GameManager.prototype.actuate = function () {
  this.actuator.actuate(this.grid, {
    score: this.score,
    over: this.over,
    won: this.won,
  });
};

// Save all tile positions and remove merger info
GameManager.prototype.prepareTiles = function () {
  this.grid.eachCell((x, y, tile) => {
    if (tile) {
      tile.mergedFrom = null;
      tile.savePosition();
    }
  });
};

// Move a tile and its representation
GameManager.prototype.moveTile = function (tile, cell) {
  this.grid.cells[tile.x][tile.y] = null;
  this.grid.cells[cell.x][cell.y] = tile;
  tile.updatePosition(cell);
};

// Move tiles on the grid in the specified direction
GameManager.prototype.move = function (direction) {
  // 0: up, 1: right, 2:down, 3: left
  const self = this;

  if (this.over || this.won) return; // Don't do anything if the game's over

  let cell;
  let tile;

  const vector = this.getVector(direction);
  const traversals = this.buildTraversals(vector);
  let moved = false;

  // Save the current tile positions and remove merger information
  this.prepareTiles();

  // Traverse the grid in the right direction and move tiles
  traversals.x.forEach((x) => {
    traversals.y.forEach((y) => {
      cell = { x, y };
      tile = self.grid.cellContent(cell);

      if (tile) {
        const positions = self.findFarthestPosition(cell, vector);
        const next = self.grid.cellContent(positions.next);

        // Only one merger per row traversal?
        if (next && next.value === tile.value && !next.mergedFrom) {
          const merged = new Tile(positions.next, tile.value * 2);
          merged.mergedFrom = [tile, next];

          self.grid.insertTile(merged);
          self.grid.removeTile(tile);

          // Converge the two tiles' positions
          tile.updatePosition(positions.next);

          // Update the score
          self.score += merged.value;

          // The mighty 2048 tile
          if (merged.value === 2048) self.won = true;
        } else {
          self.moveTile(tile, positions.farthest);
        }

        if (!self.positionsEqual(cell, tile)) {
          moved = true; // The tile moved from its original cell!
        }
      }
    });
  });

  if (moved) {
    this.addRandomTile();

    if (!this.movesAvailable()) {
      this.over = true; // Game over!
    }

    this.actuate();
  }
};

// Get the vector representing the chosen direction
GameManager.prototype.getVector = function (direction) {
  // Vectors representing tile movement
  const map = {
    0: { x: 0, y: -1 }, // up
    1: { x: 1, y: 0 }, // right
    2: { x: 0, y: 1 }, // down
    3: { x: -1, y: 0 }, // left
  };

  return map[direction];
};

// Build a list of positions to traverse in the right order
GameManager.prototype.buildTraversals = function (vector) {
  const traversals = { x: [], y: [] };

  for (let pos = 0; pos < this.size; pos++) {
    traversals.x.push(pos);
    traversals.y.push(pos);
  }

  // Always traverse from the farthest cell in the chosen direction
  if (vector.x === 1) traversals.x = traversals.x.reverse();
  if (vector.y === 1) traversals.y = traversals.y.reverse();

  return traversals;
};

GameManager.prototype.findFarthestPosition = function (cell, vector) {
  let previous;

  // Progress towards the vector direction until an obstacle is found
  do {
    previous = cell;
    cell = { x: previous.x + vector.x, y: previous.y + vector.y };
  } while (this.grid.withinBounds(cell) && this.grid.cellAvailable(cell));

  return {
    farthest: previous,
    next: cell, // Used to check if a merge is required
  };
};

GameManager.prototype.movesAvailable = function () {
  return this.grid.cellsAvailable() || this.tileMatchesAvailable();
};

// Check for available matches between tiles (more expensive check)
GameManager.prototype.tileMatchesAvailable = function () {
  const self = this;

  let tile;

  for (let x = 0; x < this.size; x++) {
    for (let y = 0; y < this.size; y++) {
      tile = this.grid.cellContent({ x, y });

      if (tile) {
        for (let direction = 0; direction < 4; direction++) {
          const vector = self.getVector(direction);
          const cell = { x: x + vector.x, y: y + vector.y };

          const other = self.grid.cellContent(cell);
          if (other) {
          }

          if (other && other.value === tile.value) {
            return true; // These two tiles can be merged
          }
        }
      }
    }
  }

  return false;
};

GameManager.prototype.positionsEqual = function (first, second) {
  return first.x === second.x && first.y === second.y;
};

function Grid(size) {
  this.size = size;

  this.cells = [];

  this.build();
}

// Build a grid of the specified size
Grid.prototype.build = function () {
  for (let x = 0; x < this.size; x++) {
    const row = (this.cells[x] = []);

    for (let y = 0; y < this.size; y++) {
      row.push(null);
    }
  }
};

// Find the first available random position
Grid.prototype.randomAvailableCell = function () {
  const cells = this.availableCells();

  if (cells.length) {
    return cells[Math.floor(Math.random() * cells.length)];
  }
};

Grid.prototype.availableCells = function () {
  const cells = [];

  this.eachCell((x, y, tile) => {
    if (!tile) {
      cells.push({ x, y });
    }
  });

  return cells;
};

// Call callback for every cell
Grid.prototype.eachCell = function (callback) {
  for (let x = 0; x < this.size; x++) {
    for (let y = 0; y < this.size; y++) {
      callback(x, y, this.cells[x][y]);
    }
  }
};

// Check if there are any cells available
Grid.prototype.cellsAvailable = function () {
  return !!this.availableCells().length;
};

// Check if the specified cell is taken
Grid.prototype.cellAvailable = function (cell) {
  return !this.cellOccupied(cell);
};

Grid.prototype.cellOccupied = function (cell) {
  return !!this.cellContent(cell);
};

Grid.prototype.cellContent = function (cell) {
  if (this.withinBounds(cell)) {
    return this.cells[cell.x][cell.y];
  }
  return null;
};

// Inserts a tile at its position
Grid.prototype.insertTile = function (tile) {
  this.cells[tile.x][tile.y] = tile;
};

Grid.prototype.removeTile = function (tile) {
  this.cells[tile.x][tile.y] = null;
};

Grid.prototype.withinBounds = function (position) {
  return position.x >= 0 && position.x < this.size && position.y >= 0 && position.y < this.size;
};

function HTMLActuator() {
  this.tileContainer = document.getElementsByClassName('tile-container')[0];
  this.scoreContainer = document.getElementsByClassName('score-container')[0];
  this.messageContainer = document.getElementsByClassName('game-message')[0];

  this.score = 0;
}

HTMLActuator.prototype.actuate = function (grid, metadata) {
  const self = this;

  window.requestAnimationFrame(() => {
    self.clearContainer(self.tileContainer);

    grid.cells.forEach((column) => {
      column.forEach((cell) => {
        if (cell) {
          self.addTile(cell);
        }
      });
    });

    self.updateScore(metadata.score);

    if (metadata.over) self.message(false); // You lose
    if (metadata.won) self.message(true); // You win!
  });
};

HTMLActuator.prototype.restart = function () {
  this.clearMessage();
};

HTMLActuator.prototype.clearContainer = function (container) {
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
};

HTMLActuator.prototype.addTile = function (tile) {
  const self = this;

  const element = document.createElement('div');
  const position = tile.previousPosition || { x: tile.x, y: tile.y };
  positionClass = this.positionClass(position);

  // We can't use classlist because it somehow glitches when replacing classes
  const classes = ['tile', `tile-${tile.value}`, positionClass];
  this.applyClasses(element, classes);

  element.textContent = tile.value;

  if (tile.previousPosition) {
    // Make sure that the tile gets rendered in the previous position first
    window.requestAnimationFrame(() => {
      classes[2] = self.positionClass({ x: tile.x, y: tile.y });
      self.applyClasses(element, classes); // Update the position
    });
  } else if (tile.mergedFrom) {
    classes.push('tile-merged');
    this.applyClasses(element, classes);

    // Render the tiles that merged
    tile.mergedFrom.forEach((merged) => {
      self.addTile(merged);
    });
  } else {
    classes.push('tile-new');
    this.applyClasses(element, classes);
  }

  // Put the tile on the board
  this.tileContainer.appendChild(element);
};

HTMLActuator.prototype.applyClasses = function (element, classes) {
  element.setAttribute('class', classes.join(' '));
};

HTMLActuator.prototype.normalizePosition = function (position) {
  return { x: position.x + 1, y: position.y + 1 };
};

HTMLActuator.prototype.positionClass = function (position) {
  position = this.normalizePosition(position);
  return `tile-position-${position.x}-${position.y}`;
};

HTMLActuator.prototype.updateScore = function (score) {
  this.clearContainer(this.scoreContainer);

  const difference = score - this.score;
  this.score = score;

  this.scoreContainer.textContent = this.score;

  if (difference > 0) {
    const addition = document.createElement('div');
    addition.classList.add('score-addition');
    addition.textContent = `+${difference}`;

    this.scoreContainer.appendChild(addition);
  }
};

HTMLActuator.prototype.message = function (won) {
  const type = won ? 'game-won' : 'game-over';
  const message = won ? 'You win!' : 'Game over!';

  // if (ga) ga("send", "event", "game", "end", type, this.score);

  this.messageContainer.classList.add(type);
  this.messageContainer.getElementsByTagName('p')[0].textContent = message;
};

HTMLActuator.prototype.clearMessage = function () {
  this.messageContainer.classList.remove('game-won', 'game-over');
};

function KeyboardInputManager() {
  this.events = {};

  this.listen();
}

KeyboardInputManager.prototype.on = function (event, callback) {
  if (!this.events[event]) {
    this.events[event] = [];
  }
  this.events[event].push(callback);
};

KeyboardInputManager.prototype.emit = function (event, data) {
  const callbacks = this.events[event];
  if (callbacks) {
    callbacks.forEach((callback) => {
      callback(data);
    });
  }
};

KeyboardInputManager.prototype.listen = function () {
  const self = this;

  const map = {
    38: 0, // Up
    39: 1, // Right
    40: 2, // Down
    37: 3, // Left
    75: 0, // vim keybindings
    76: 1,
    74: 2,
    72: 3,
  };

  document.addEventListener('keydown', (event) => {
    const modifiers = event.altKey || event.ctrlKey || event.metaKey || event.shiftKey;
    const mapped = map[event.which];

    if (!modifiers) {
      if (mapped !== undefined) {
        event.preventDefault();
        self.emit('move', mapped);
      }

      if (event.which === 32) self.restart.bind(self)(event);
    }
  });

  const retry = document.getElementsByClassName('retry-button')[0];
  retry.addEventListener('click', this.restart.bind(this));

  // Listen to swipe events
  const gestures = [Hammer.DIRECTION_UP, Hammer.DIRECTION_RIGHT, Hammer.DIRECTION_DOWN, Hammer.DIRECTION_LEFT];

  const gameContainer = document.getElementsByClassName('game-container')[0];
  const handler = Hammer(gameContainer, {
    drag_block_horizontal: true,
    drag_block_vertical: true,
  });

  handler.on('swipe', (event) => {
    event.gesture.preventDefault();
    mapped = gestures.indexOf(event.gesture.direction);

    if (mapped !== -1) self.emit('move', mapped);
  });
};

KeyboardInputManager.prototype.restart = function (event) {
  event.preventDefault();
  this.emit('restart');
};

function Tile(position, value) {
  this.x = position.x;
  this.y = position.y;
  this.value = value || 2;

  this.previousPosition = null;
  this.mergedFrom = null; // Tracks tiles that merged together
}

Tile.prototype.savePosition = function () {
  this.previousPosition = { x: this.x, y: this.y };
};

Tile.prototype.updatePosition = function (position) {
  this.x = position.x;
  this.y = position.y;
};
