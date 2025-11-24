import leaflet from "leaflet";

import "leaflet/dist/leaflet.css";
import "./_leafletWorkaround.ts";
import luck from "./_luck.ts";
import "./style.css";

const WORLD_ORIGIN = leaflet.latLng(0, 0);

const TILE_DEGREES = 1e-4;
const NEIGHBORHOOD_SIZE = 8;
const INTERACTION_RANGE = 3;

const TOKEN_SPAWN_PROBABILITY = 0.25;
const MAX_TOKEN_EXPONENT = 3;
const GAMEPLAY_ZOOM_LEVEL = 19;

const TARGET_TOKEN_VALUE = 32;
const SAVE_KEY = "worldOfBitsSave";

type MovementMode = "buttons" | "geolocation";

type Cell = {
  i: number;
  j: number;
  rect: leaflet.Rectangle;
  value: number;
};

type CellMemory = {
  value: number;
};

type SaveData = {
  playerI: number;
  playerJ: number;
  heldTokenValue: number | null;
  cellMementos: [string, CellMemory][];
};

// Player grid-space location
let playerI = 0;
let playerJ = 0;

let heldTokenValue: number | null = null;

let currentMovementMode: MovementMode = "buttons";
let geoWatchId: number | null = null;

const cells = new Map<string, Cell>();
const savedCells = new Map<string, CellMemory>();

const controlPanelDiv = document.createElement("div");
controlPanelDiv.id = "controlPanel";
document.body.append(controlPanelDiv);

const mapDiv = document.createElement("div");
mapDiv.id = "map";
document.body.append(mapDiv);

const statusPanelDiv = document.createElement("div");
statusPanelDiv.id = "statusPanel";
document.body.append(statusPanelDiv);

function latLngForCell(i: number, j: number): leaflet.LatLng {
  return leaflet.latLng(
    WORLD_ORIGIN.lat + i * TILE_DEGREES,
    WORLD_ORIGIN.lng + j * TILE_DEGREES,
  );
}

function playerLatLng(): leaflet.LatLng {
  return latLngForCell(playerI, playerJ);
}

function tileBounds(i: number, j: number): leaflet.LatLngBoundsExpression {
  return [
    [
      WORLD_ORIGIN.lat + i * TILE_DEGREES,
      WORLD_ORIGIN.lng + j * TILE_DEGREES,
    ],
    [
      WORLD_ORIGIN.lat + (i + 1) * TILE_DEGREES,
      WORLD_ORIGIN.lng + (j + 1) * TILE_DEGREES,
    ],
  ];
}

function tileDistanceFromPlayer(i: number, j: number): number {
  return Math.max(
    Math.abs(i - playerI),
    Math.abs(j - playerJ),
  );
}

function cellKey(i: number, j: number): string {
  return `${i},${j}`;
}

function updateStatus(message?: string) {
  const heldText = heldTokenValue === null
    ? "Not holding a token."
    : `Holding a token of value ${heldTokenValue}.`;

  let extra = "";
  if (message) {
    extra = "<br>" + message;
  }

  statusPanelDiv.innerHTML = heldText + extra;
}

const map = leaflet.map(mapDiv, {
  center: playerLatLng(),
  zoom: GAMEPLAY_ZOOM_LEVEL,
  minZoom: GAMEPLAY_ZOOM_LEVEL,
  maxZoom: GAMEPLAY_ZOOM_LEVEL,
  zoomControl: false,
  scrollWheelZoom: false,
});

leaflet
  .tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  })
  .addTo(map);

const playerMarker = leaflet.marker(playerLatLng());
playerMarker.bindTooltip("You are here!");
playerMarker.addTo(map);

function movePlayer(di: number, dj: number) {
  playerI += di;
  playerJ += dj;

  const center = playerLatLng();
  map.setView(center);
  playerMarker.setLatLng(center);

  redrawGridAroundPlayer();
  updateStatus(`Moved to (${playerI}, ${playerJ})`);
  saveGame();
}

function movePlayerToLatLng(lat: number, lng: number) {
  const i = Math.round((lat - WORLD_ORIGIN.lat) / TILE_DEGREES);
  const j = Math.round((lng - WORLD_ORIGIN.lng) / TILE_DEGREES);

  playerI = i;
  playerJ = j;

  const center = playerLatLng();
  map.setView(center);
  playerMarker.setLatLng(center);
  redrawGridAroundPlayer();
}

const movementFacade = {
  useButtons() {
    currentMovementMode = "buttons";

    if (geoWatchId !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(geoWatchId);
      geoWatchId = null;
    }

    updateStatus("Movement mode: buttons.");
  },

  useGeolocation() {
    if (!navigator.geolocation) {
      updateStatus("Geolocation is not supported, staying in button mode.");
      return;
    }

    currentMovementMode = "geolocation";
    updateStatus("Movement mode: geolocation (move with your device).");

    if (geoWatchId !== null) {
      navigator.geolocation.clearWatch(geoWatchId);
    }

    geoWatchId = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        movePlayerToLatLng(lat, lng);
        saveGame();
      },
      (err) => {
        updateStatus("Geolocation error: " + err.message);
      },
    );
  },
};

function saveGame() {
  const data: SaveData = {
    playerI,
    playerJ,
    heldTokenValue,
    cellMementos: Array.from(savedCells.entries()),
  };

  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch {
    // ignore storage errors
  }
}

function loadGame() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return;

  try {
    const data = JSON.parse(raw) as SaveData;
    playerI = data.playerI;
    playerJ = data.playerJ;
    heldTokenValue = data.heldTokenValue;

    savedCells.clear();
    for (const [key, mem] of data.cellMementos) {
      savedCells.set(key, mem);
    }

    const center = playerLatLng();
    map.setView(center);
    playerMarker.setLatLng(center);
    updateStatus("Loaded saved game from localStorage.");
  } catch {
    updateStatus("Save data was broken, starting a new game.");
  }
}

function makeMoveButton(
  label: string,
  di: number,
  dj: number,
): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.textContent = label;
  btn.addEventListener("click", () => {
    movePlayer(di, dj);
  });
  return btn;
}

// New Game button
const newGameButton = document.createElement("button");
newGameButton.textContent = "New Game";
newGameButton.addEventListener("click", () => {
  localStorage.removeItem(SAVE_KEY);

  playerI = 0;
  playerJ = 0;
  heldTokenValue = null;
  savedCells.clear();

  const center = playerLatLng();
  map.setView(center);
  playerMarker.setLatLng(center);
  redrawGridAroundPlayer();
  updateStatus("Started a new game.");
  saveGame();
});
controlPanelDiv.append(newGameButton);

// NESW movement layout
const moveControls = document.createElement("div");
moveControls.id = "moveControls";
controlPanelDiv.append(moveControls);

const northButton = makeMoveButton("North", 1, 0);
const middleRow = document.createElement("div");
const westButton = makeMoveButton("West", 0, -1);
const eastButton = makeMoveButton("East", 0, 1);
const southButton = makeMoveButton("South", -1, 0);

middleRow.append(westButton, eastButton);
moveControls.append(northButton, middleRow, southButton);

// Mode switch buttons (Facade)
const modeControls = document.createElement("div");
modeControls.id = "modeControls";
controlPanelDiv.append(modeControls);

const buttonModeBtn = document.createElement("button");
buttonModeBtn.textContent = "Use button movement";
buttonModeBtn.addEventListener("click", () => {
  movementFacade.useButtons();
  saveGame();
});

const geoModeBtn = document.createElement("button");
geoModeBtn.textContent = "Use GPS movement";
geoModeBtn.addEventListener("click", () => {
  movementFacade.useGeolocation();
  saveGame();
});

modeControls.append(buttonModeBtn, geoModeBtn);

function handleCellClick(cell: Cell) {
  const distance = tileDistanceFromPlayer(cell.i, cell.j);

  if (distance > INTERACTION_RANGE) {
    updateStatus("That cell is too far away to interact with.");
    return;
  }

  const key = cellKey(cell.i, cell.j);

  if (heldTokenValue == null) {
    if (cell.value === 0) {
      updateStatus("This cell has no token to pick up");
      return;
    }

    heldTokenValue = cell.value;
    cell.value = 0;

    const memory = savedCells.get(key);
    if (memory) {
      memory.value = 0;
    }

    updateCellTooltip(cell);
    updateStatus("You picked up a token!");
    saveGame();
    return;
  }

  if (cell.value === 0) {
    updateStatus(
      "You can only craft a new token with a cell that already has a token.",
    );
    return;
  }

  if (cell.value !== heldTokenValue) {
    updateStatus(
      `To craft, the cell token must match the one you are holding: ${heldTokenValue}.`,
    );
    return;
  }

  const newValue = cell.value * 2;
  heldTokenValue = null;
  cell.value = newValue;

  const craftedMemory = savedCells.get(key);
  if (craftedMemory) {
    craftedMemory.value = newValue;
  }

  updateCellTooltip(cell);

  let message = `Crafted a token of value ${newValue}!`;
  if (newValue >= TARGET_TOKEN_VALUE) {
    message += " Goal reached: high-value token created!";
  }

  updateStatus(message);
  saveGame();
}

function updateCellTooltip(cell: Cell) {
  const label = cell.value === 0 ? "" : cell.value.toString();

  if (!cell.rect.getTooltip()) {
    cell.rect
      .bindTooltip(label, {
        permanent: true,
        direction: "center",
        opacity: 0.9,
      })
      .openTooltip();
  } else {
    cell.rect.getTooltip()!.setContent(label);
  }
}

function clearCells() {
  cells.forEach((cell) => cell.rect.remove());
  cells.clear();
}

function createCell(i: number, j: number): Cell {
  const key = cellKey(i, j);

  // 1. Try to find a saved memory for this cell.
  let memory = savedCells.get(key);

  // 2. If we have no memory yet, generate a starting value and remember it.
  if (!memory) {
    const spawnRoll = luck([i, j, "spawn"].toString());
    let value = 0;

    if (spawnRoll < TOKEN_SPAWN_PROBABILITY) {
      const exponent = 1 +
        Math.floor(luck([i, j, "value"].toString()) * MAX_TOKEN_EXPONENT);
      value = 2 ** exponent;
    }

    memory = { value };
    savedCells.set(key, memory);
  }

  // 3. Draw the picture (rectangle) for this cell using the remembered value.
  const rect = leaflet.rectangle(tileBounds(i, j), { weight: 1 });
  rect.addTo(map);

  const cell: Cell = { i, j, rect, value: memory.value };
  updateCellTooltip(cell);

  rect.on("click", () => {
    handleCellClick(cell);
  });

  cells.set(key, cell);
  return cell;
}

function redrawGridAroundPlayer() {
  clearCells();
  for (
    let i = playerI - NEIGHBORHOOD_SIZE;
    i <= playerI + NEIGHBORHOOD_SIZE;
    i++
  ) {
    for (
      let j = playerJ - NEIGHBORHOOD_SIZE;
      j <= playerJ + NEIGHBORHOOD_SIZE;
      j++
    ) {
      createCell(i, j);
    }
  }
}

loadGame();
redrawGridAroundPlayer();
movementFacade.useButtons();

if (!heldTokenValue) {
  updateStatus("Not holding a token. Crafted goal: 32.");
}
