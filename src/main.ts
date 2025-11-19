import leaflet from "leaflet";

import "leaflet/dist/leaflet.css";
import "./style.css";
import "./_leafletWorkaround.ts";
import luck from "./_luck.ts";

const controlPanelDiv = document.createElement("div");
controlPanelDiv.id = "controlPanel";
document.body.append(controlPanelDiv);

function makeMoveButton(label: string, di: number, dj: number) {
  const btn = document.createElement("button");
  btn.textContent = label;
  btn.addEventListener("click", () => movePlayer(di, dj));
  controlPanelDiv.append(btn);
}

makeMoveButton("North", 1, 0);
makeMoveButton("South", -1, 0);
makeMoveButton("West", 0, -1);
makeMoveButton("East", 0, 1);

const mapDiv = document.createElement("div");
mapDiv.id = "map";
document.body.append(mapDiv);

const statusPanelDiv = document.createElement("div");
statusPanelDiv.id = "statusPanel";
document.body.append(statusPanelDiv);

const WORLD_ORIGIN = leaflet.latLng(0, 0);

const TILE_DEGREES = 1e-4;
const NEIGHBORHOOD_SIZE = 8;
const INTERACTION_RANGE = 3;

const TOKEN_SPAWN_PROBABILITY = 0.25;
const MAX_TOKEN_EXPONENT = 3;

// Player grid-space location
let playerI = 0;
let playerJ = 0;

function latLngForCell(i: number, j: number): leaflet.LatLng {
  return leaflet.latLng(
    WORLD_ORIGIN.lat + i * TILE_DEGREES,
    WORLD_ORIGIN.lng + j * TILE_DEGREES,
  );
}

function movePlayer(di: number, dj: number) {
  playerI += di;
  playerJ += dj;

  const center = playerLatLng();
  map.setView(center);
  playerMarker.setLatLng(center);

  redrawGridAroundPlayer();
  updateStatus(`Moved to (${playerI}, ${playerJ})`);
}

function playerLatLng(): leaflet.LatLng {
  return latLngForCell(playerI, playerJ);
}

let heldTokenValue: number | null = null;

const TARGET_TOKEN_VALUE = 32;

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

// Classroom location

const GAMEPLAY_ZOOM_LEVEL = 19;

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

type Cell = {
  i: number;
  j: number;
  rect: leaflet.Rectangle;
  value: number;
};

const cells = new Map<string, Cell>();

function cellKey(i: number, j: number): string {
  return `${i},${j}`;
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

// handles the players click event
function handleCellClick(cell: Cell) {
  const distance = tileDistanceFromPlayer(cell.i, cell.j);

  if (distance > INTERACTION_RANGE) {
    updateStatus("That cell is too far away to interact with.");
    return;
  }

  if (heldTokenValue == null) {
    if (cell.value == 0) {
      updateStatus("This cell has no token to pick up");
      return;
    }

    heldTokenValue = cell.value;
    cell.value = 0;
    updateCellTooltip(cell);
    updateStatus("You picked up a token!");
    return;
  }

  if (cell.value == 0) {
    updateStatus(
      "You can only craft a new token with a cell that alreaddy has a token",
    );
    return;
  }

  if (cell.value !== heldTokenValue) {
    updateStatus(
      "Too craft the token has to be equal value as the token you currently have: ${heldTokenValue}.",
    );
    return;
  }

  const newValue = cell.value * 2;
  heldTokenValue = null;
  cell.value = newValue;
  updateCellTooltip(cell);

  let message = `Crafted a token of value ${newValue}!`;
  if (newValue >= TARGET_TOKEN_VALUE) {
    message += " Goal reached: high-value token created!";
  }

  updateStatus(message);
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

// Creats a grid of cell with specifc token value
function createCell(i: number, j: number): Cell {
  const rect = leaflet.rectangle(tileBounds(i, j), { weight: 1 });
  rect.addTo(map);

  const spawnRoll = luck([i, j, "spawn"].toString());
  let value = 0;

  if (spawnRoll < TOKEN_SPAWN_PROBABILITY) {
    const exponent = 1 +
      Math.floor(luck([i, j, "value"].toString()) * MAX_TOKEN_EXPONENT);
    value = 2 ** exponent;
  }

  const cell: Cell = { i, j, rect, value };
  updateCellTooltip(cell);

  rect.on("click", () => {
    handleCellClick(cell);
  });

  cells.set(cellKey(i, j), cell);
  return cell;
}

redrawGridAroundPlayer();

updateStatus("Click nearby cells to pick up and craft tokens.");
