# D3: The world of the Token Crafter

# Game Design Vision

Game about the world being divided into grid cells drawn on a leaflet map and some cells contain tokens with different values. The player can only interact with nearby cells, they can pick up one single cell at a time and then try to craft by combining it with a cell of equal value to make a token worth double now. The goal is similar to the games 4096 and pokemon go where we essentially make a token of high value but also have to walk around to get these tokens and combine them.

# Technologies

- TypeScript for most game code, little to no explicit HTML, and all CSS collected in common `style.css` file
- Deno and Vite for building
- GitHub Actions + GitHub Pages for deployment automation

# Assignments

## D3.a: Core mechanics (token collection and crafting)

Key technical challenge: Can you assemble a map-based user interface using the Leaflet mapping framework?
Key gameplay challenge: Can players collect and craft tokens from nearby locations to finally make one of sufficiently high value?

### Steps

### Starting implementation

- [x] copy main.ts to reference.ts for future reference
- [x] delete everything in main.ts
- [x] put a basic leaflet map on the screen
- [x] draw the player's location on the map
- [x] draw a rectangle representing one cell on the map
- [x] use loops to draw a whole grid of cells on the map
- .

### Map + grid

- [ ] put a basic Leaflet map on the screen centered on the classroom
- [ ] lock the zoom level so the player can see out to the edges of the map
- [ ] draw the player's location on the map
- [ ] compute a fixed grid (using TILE_DEGREES) around the classroom
- [ ] use nested loops to draw a rectangle representing one cell on the map
- [ ] extend the loops to draw a whole grid of cells on the map
