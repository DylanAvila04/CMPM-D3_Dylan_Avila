# D3: The world of the Token Crafter

## Game Design Vision

Game about the world being divided into grid cells drawn on a leaflet map and some cells contain tokens with different values. The player can only interact with nearby cells, they can pick up one single cell at a time and then try to craft by combining it with a cell of equal value to make a token worth double now. The goal is similar to the games 4096 and pokemon go where we essentially make a token of high value but also have to walk around to get these tokens and combine them.

## Technologies

- TypeScript for most game code, little to no explicit HTML, and all CSS collected in common `style.css` file
- Deno and Vite for building
- GitHub Actions + GitHub Pages for deployment automation

## Assignments

## D3.a: Core mechanics (token collection and crafting)

Key technical challenge: Can you assemble a map-based user interface using the Leaflet mapping framework?
Key gameplay challenge: Can players collect and craft tokens from nearby locations to finally make one of sufficiently high value?

### Steps

### D3.a world of bits, Core mechanics

### Starting implementation - Finished 11/12/25

- [x] copy main.ts to reference.ts for future reference
- [x] delete everything in main.ts
- [x] put a basic leaflet map on the screen
- [x] draw the player's location on the map
- [x] draw a rectangle representing one cell on the map
- [x] use loops to draw a whole grid of cells on the map
-

## Tokens - Finished 11/16/25

[x] use the luck function with (i,j) to decide whether each cell spawns a token
[x] use luck again to choose the token’s value (e.g. 2, 4, 8) in a random way
[x] store each cell’s data in a Cell type like coordinates, rectangle, current token value
[x] show each cell’s current token value with a permanent label so players can see it without clicking

## Player interaction - finished 11/17/25

- [x] define an interaction radius of about three cells away from the player
- [x] only allow clicks on cells that are within this interaction radius
      - helpful to also add a distance helper.

## Inventory and crafting - finished 11/17/25

- [x] add a heldTokenValue variable that can be either null or the value of the token in hand
- [x] implement picking up a token from a cell when I’m not holding anything
- [x] prevent picking up from empty cells and show a helpful status message
- [x] implement crafting: if I’m holding a token and click a cell with the same value,
      remove both and leave a new token with double the value in that cell
- [x] block crafting if the values don’t match and update the status with a message
- [x] detect when I create a token of “high enough” value (e.g. 16) and show a special success message
- [x} use the status panel to always display what token (if any) I’m holding

## UI polish - finished 11/17/25

-[x] Change the font and background to my own design and unique

- [x] use the status panel to show interaction messages like too far away, empty cell, mismatch, crafted new token, etc.
- [x] clean up variable names and comments to avoid code smells and leftover debug logging
- [x] test edge cases (clicking far cells, empty cells, many crafts in a row) to make sure state

### D3.b world of bits, Globe spanning gameplay

## player movement

- [x] add UI buttons in the control panel to move north, south, east, and west by one grid cell
- [x] store the player’s position as grid coordinates like playerI, playerJ instead of a fixed point at the classroom
- [x] recenter the map and player marker whenever the player moves
- [x] update the status panel to mention the player’s current grid coordinates

## no memory cells

-[ ] change the grid-drawing code to draw cells around the current player position instead of always around (0,0)

- [ ] clear old cell rectangles from the map before drawing a new grid
- [ ] when recreating cells, use the same luck-based rules to assign token values so cells “reset” when they come back into view
- [ ] test that moving away and back to the same screen region lets me re-collect tokens there

## crafting

- [ ] update the target crafted token value (e.g. from 16 up to 32)
- [ ] update the victory message and any text that mentions the goal value
- [ ] test that the game only declares victory once the new higher target value is crafted
