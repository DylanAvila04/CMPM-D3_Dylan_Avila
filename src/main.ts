import leaflet from "leaflet";

import "leaflet/dist/leaflet.css";
import "./style.css";
import "./_leafletWorkaround.ts";
import luck from "./_luck.ts";

// Create page layout
const controlPanelDiv = document.createElement("div");
controlPanelDiv.id = "controlPanel";
document.body.append(controlPanelDiv);

const mapDiv = document.createElement("div");
mapDiv.id = "map";
document.body.append(mapDiv);

const statusPanelDiv = document.createElement("div");
statusPanelDiv.id = "statusPanel";
document.body.append(statusPanelDiv);

// Classroom location
const CLASSROOM_LATLNG = leaflet.latLng(
  36.997936938057016,
  -122.05703507501151,
);

// Create the map
const GAMEPLAY_ZOOM_LEVEL = 19;

const map = leaflet.map(mapDiv, {
  center: CLASSROOM_LATLNG,
  zoom: GAMEPLAY_ZOOM_LEVEL,
  minZoom: GAMEPLAY_ZOOM_LEVEL,
  maxZoom: GAMEPLAY_ZOOM_LEVEL,
  zoomControl: false,
  scrollWheelZoom: false,
});

// Add the tile layer
leaflet
  .tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  })
  .addTo(map);

const playerMarker = leaflet.marker(CLASSROOM_LATLNG);
playerMarker.bindTooltip("You are here!");
playerMarker.addTo(map);

const TILE_DEGREES = 1e-4;
const NEIGHBORHOOD_SIZE = 8;

const TOKEN_SPAWN_PROBABILITY = 0.25; // 25% chance a cell has a token
const MAX_TOKEN_EXPONENT = 3;

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
      CLASSROOM_LATLNG.lat + i * TILE_DEGREES,
      CLASSROOM_LATLNG.lng + j * TILE_DEGREES,
    ],
    [
      CLASSROOM_LATLNG.lat + (i + 1) * TILE_DEGREES,
      CLASSROOM_LATLNG.lng + (j + 1) * TILE_DEGREES,
    ],
  ];
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

function createCell(i: number, j: number): Cell {
  const rect = leaflet.rectangle(tileBounds(i, j), { weight: 1 });
  rect.addTo(map);

  // deterministic roll for whether this cell has a token
  const spawnRoll = luck([i, j, "spawn"].toString());
  let value = 0;

  if (spawnRoll < TOKEN_SPAWN_PROBABILITY) {
    // choose exponent 1..MAX_TOKEN_EXPONENT → 2,4,8,...
    const exponent = 1 +
      Math.floor(luck([i, j, "value"].toString()) * MAX_TOKEN_EXPONENT);
    value = 2 ** exponent;
  }

  const cell: Cell = { i, j, rect, value };
  updateCellTooltip(cell);

  cells.set(cellKey(i, j), cell);
  return cell;
}

for (let i = -NEIGHBORHOOD_SIZE; i <= NEIGHBORHOOD_SIZE; i++) {
  for (let j = -NEIGHBORHOOD_SIZE; j <= NEIGHBORHOOD_SIZE; j++) {
    createCell(i, j);
  }
}
