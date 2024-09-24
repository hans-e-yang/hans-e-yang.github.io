<!--
This component holds the state of a grid.
It holds the tiles and colors




-->
<script lang="ts">

import { onMount } from "svelte";
import Grid from "./grid.svelte";
import tw_colors from "tailwindcss/colors";
import { debounce } from '$lib/util'

import resolveConfig from "tailwindcss/resolveConfig";
import tailwindConfig from "../../../../tailwind.config.js"
const full_config = resolveConfig(tailwindConfig)

let grid : Grid

type Vector2D =  {
  x: number,
  y: number
}

type DrawableTile = "wall"
type EphemeralTile = "frontier" | "route" | "known"
type Tile = "start" | "end" | "empty" | EphemeralTile | DrawableTile

// Astar grid animation options
// Should be changed when color theme is changed in tw

// Data representation of grid
function coordToKey(coord: Vector2D) {
  return coord.x * 10_000 + coord.y
}
function keyToCoord(key: number) {
  return {x: Math.trunc(key/10_000), y: key%10_000}
}

/** Draws tile that will disappear when cleared */
export function draw_tile_animation(position: Vector2D, tile: EphemeralTile) {
  grid.draw_tile(position, colors[tile])
}

/** Clears the grid of tiles from animation*/
export function clean() {
  grid_tiles.redraw()
}

/** Clears the grid of tiles from animation tiles and wall tiles */
export function clear() {
  grid_tiles.clear()
}

/** See if tile in position is a valid tile position to move to */
export function is_valid_tile(position: Vector2D) {
  return grid.is_valid_tile(position) && grid_tiles.get(position) != "wall"
}

export function draw_start_and_end() {
  grid.draw_tile(start, colors['start'])
  grid.draw_tile(end, colors['end'])
}

export function resize_grid(tile_size: number) {
  grid.change_tile_size(tile_size)  

  let {x, y} = grid.get_dimensions()
  if (start.x >= x) start.x = x-1
  if (start.y >= y) start.y = y-1
  if (end.x >= x) end.x = x-1
  if (end.y >= y) end.y = y-1
  grid_tiles.set(start, 'start')
  grid_tiles.set(end, 'end')
  grid_tiles.redraw()
}

// Stores the state of the grid
// Wrapper around the Map object to translate coordinates to number for Map key
function GridTiles() {
  // Actual Map between number to tile
  const tiles = new Map<number, Tile>()

  return {
    getWithKey: tiles.get,
    // We act as if 'empty' means no tile
    get: (coord: Vector2D) =>
      tiles.get(coordToKey(coord)) || "empty",

    set: (coord: Vector2D, val: Tile) => {
      if (val == "empty") {
        tiles.delete(coordToKey(coord))
        grid.erase_tile(coord)
      } else {
        tiles.set(coordToKey(coord), val)
        grid.draw_tile(coord, colors[val])
      }
    },
    redraw: () => {
      grid.clear()
      for (const [key, state] of tiles.entries()) {
        grid.draw_tile(keyToCoord(key), colors[state])
      }
    },
    clear: () => {
      tiles.clear()
      tiles.set(coordToKey(start), "start")
      tiles.set(coordToKey(end), "end")
      grid.clear()
      for (const [key, state] of tiles.entries()) {
        grid.draw_tile(keyToCoord(key), colors[state])
      }
    }
  }
}


let grid_tiles = GridTiles()
export const get_grid_tiles = () => grid_tiles
// Since 'start' and 'end' has one to one relationship with its position
// Meaning that it is unique, we also store them seperately
let start = {x: 1, y: 1}
let end = {x: 5, y: 5}
export const get_start = () => start
export const get_end = () => end

/** Grid Tile colors */
let colors : {[k in Tile]: string} = {
  "start" : full_config.theme.colors.primary.DEFAULT,
  "end": full_config.theme.colors.secondary.DEFAULT,
  "wall": full_config.theme.colors.text.DEFAULT,
  "empty": "none",
  "known": full_config.theme.colors.primary[500],
  "frontier": full_config.theme.colors.primary[700],
  "route": full_config.theme.colors.green[600]
}

onMount(() => {
  // Set the grid colors
  grid.set_grid_color(colors.wall)

  // Draw the start and end tiles in the grid
  grid_tiles.set(start, "start")
  grid_tiles.set(end, "end")

  // Auto resize
  // let resize = debounce(() => {
  //   grid.resize_canvas()
  //   grid_tiles.redraw()
  // }, 300)
  // window.addEventListener('resize', () => {
  //   resize()
  // })

})

// Selected tile to draw
let tile_to_draw : DrawableTile | "empty" =  "wall"
export function set_tile(tile: DrawableTile | "empty") { tile_to_draw = tile }

// Start and end state is set seperately, being dragged around.
let tile_clicked : "start" | "end" | "" = ""

type DrawEvent = Event & {detail: Vector2D}
function on_pen_down(ev: DrawEvent) {
  switch (grid_tiles.get(ev.detail)) {
    case "start":
      tile_clicked = "start"
      break
    case "end":
      tile_clicked = "end"
      break
    default:
      drawHandler(ev)
      break
  }
}

function drawHandler(ev: DrawEvent) {
  let current_tile = grid_tiles.get(ev.detail)  

  // Cannot draw over start or end
  if (current_tile == "end" || current_tile == "start") return
  if (!grid.is_valid_tile(ev.detail)) return

  // Draw start or end 
  if (tile_clicked == "start") {
    grid_tiles.set(start, "empty")
    start = ev.detail
    grid_tiles.set(start, "start")
    return

  } else if (tile_clicked == "end") {
    grid_tiles.set(end, "empty")
    end = ev.detail
    grid_tiles.set(end, "end")
    return
  }

  // Draw the other possible tiles (environment)
  switch (tile_to_draw) {
    case "wall":
      if (current_tile == "empty") {
        grid_tiles.set(ev.detail, "wall")
      }
      break

    case "empty":
      grid_tiles.set(ev.detail, "empty")
      break
  }
}

const on_pen_up = () => tile_clicked = ""

</script>

<Grid bind:this={grid} 
  on:draw={drawHandler} 
  on:pen_down={on_pen_down}
  on:pen_up={on_pen_up}
  />
