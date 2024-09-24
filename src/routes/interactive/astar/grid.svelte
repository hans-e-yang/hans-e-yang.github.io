<!--
This component helps in drawing a grid in html.
Doesn't hold any state.
-->
<script lang="ts">
import { createEventDispatcher, onMount } from "svelte";

// Styling
let bg : HTMLCanvasElement
let fg : HTMLCanvasElement
let div : HTMLDivElement
let bgctx : CanvasRenderingContext2D | undefined
let fgctx : CanvasRenderingContext2D | undefined

type Vector2D = {
  x: number,
  y: number
}

let dimensions = {x: 0, y: 0}
let tileSize = 15

let _color = 'black'

export function get_dimensions() {return dimensions}


export function set_grid_color(color: string) {
  _color = color
  update_grid_lines()
}

export function change_tile_size(tile_size: number) {
  tileSize = tile_size
  update_grid_lines()
}

export function clear() {
  fgctx?.clearRect(0, 0, fg.clientWidth, fg.clientHeight)
}
function clear_all() {
  bgctx?.clearRect(0, 0, bg.clientWidth, bg.clientHeight)
  fgctx?.clearRect(0, 0, fg.clientWidth, fg.clientHeight)
}

export function resize_canvas() {
  bg.width = div.clientWidth
  fg.width = div.clientWidth
  bg.height = div.clientHeight
  fg.height = div.clientHeight
  update_grid_lines()
}

/** Clears the canvas and update the grid based on the current size of the canvas */
export function update_grid_lines() {
  clear_all()

  dimensions.x = Math.trunc(div.clientWidth / tileSize)
  dimensions.y = Math.trunc(div.clientHeight / tileSize)

  // Draw the Vertical lines
  if (bgctx) bgctx.strokeStyle = _color
  bgctx?.clearRect(0, 0, bg.clientWidth, bg.clientHeight)
  bgctx?.beginPath()
  for (let x = 0; x <= dimensions.x * tileSize; x += tileSize) {
    bgctx?.moveTo(x, 0)
    bgctx?.lineTo(x, dimensions.y*tileSize)
  }
  for (let y = 0; y <= dimensions.y * tileSize; y += tileSize) {
    bgctx?.moveTo(0, y)
    bgctx?.lineTo(dimensions.x*tileSize, y)
  }
  bgctx?.stroke()
}

/** Draws a tile in the x, y tile position.*/
export function draw_tile(tile: Vector2D, color: string) {
  if (!is_valid_tile(tile)) return
  if (!fgctx) return
  fgctx.fillStyle = color
  fgctx.fillRect(tile.x*tileSize, tile.y*tileSize, tileSize, tileSize)
}

/** Erases a tile in the x, y tile position.*/
export function erase_tile(tile: Vector2D) {
  if (!is_valid_tile(tile)) return
  fgctx?.clearRect(tile.x*tileSize, tile.y*tileSize, tileSize, tileSize)
}

/** Checks if tile coordinates is inside the grid.*/
export function is_valid_tile(tile: Vector2D) {
  return (
    (0 <= tile.x && tile.x < dimensions.x) &&
      (0 <= tile.y && tile.y < dimensions.y)
  )
}

/** Transforms canvas pixel coordinates into tile coordinates.*/
function canvas_to_tile_coordinates(canvasCoord: Vector2D) {
  return {
    x: Math.trunc(canvasCoord.x / tileSize),
    y: Math.trunc(canvasCoord.y / tileSize)
  }
}

// Drawing logic
const dispatch = createEventDispatcher()
let isPenDown = false
let oldTile = {x: -1, y: -1}

const get_coordinates_from_event = (ev: MouseEvent | TouchEvent) => {
  if ('touches' in ev) {
    let rect = fg?.getBoundingClientRect()
    if (!rect) return
    
    return {
      x: ev.touches[0].pageX - fg?.clientLeft,
      y: ev.touches[0].pageY - (rect.top + window.scrollY)
    }
  } else if ('offsetX' in ev) {
    return {
      x: ev.offsetX,
      y: ev.offsetY
    }
  }
}

const pen_down = (ev: MouseEvent | TouchEvent) => {
  if (isPenDown) return

  const coord = get_coordinates_from_event(ev)
  if (!coord) return

  isPenDown = true
  let newTile = canvas_to_tile_coordinates(coord)
  dispatch('pen_down', newTile)
  oldTile = newTile
}

const pen_move = (ev : MouseEvent | TouchEvent) => {
  ev.preventDefault()
  if (!isPenDown) return

  const coord = get_coordinates_from_event(ev)
  if (!coord) return 
  
  let newTile = canvas_to_tile_coordinates(coord)
  if (newTile.x !== oldTile.x || newTile.y !== oldTile.y) {
    dispatch('draw', newTile)
    oldTile = newTile
  }
}

const pen_up = () => {
  isPenDown = false
  dispatch('pen_up')
}

onMount(() => {
  bgctx = bg.getContext("2d") || undefined
  fgctx = fg.getContext("2d") || undefined
  resize_canvas()
  update_grid_lines()
})
</script>

<div bind:this={div} class="w-full h-full relative">
  <canvas  bind:this={bg}></canvas>
  <canvas 
    class="absolute top-0" 
    bind:this={fg}
    on:mousedown={pen_down}
    on:mouseup={pen_up}
    on:mousemove={pen_move}
    on:mouseleave={pen_up}

    on:touchstart={pen_down}
    on:touchend={pen_up}
    on:touchcancel={pen_up}
    on:touchmove={pen_move}
  />
</div>
