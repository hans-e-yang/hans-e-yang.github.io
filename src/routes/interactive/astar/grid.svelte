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

export function clear() {
  fgctx?.clearRect(0, 0, fg.clientWidth, fg.clientHeight)
}
function clearAll() {
  bgctx?.clearRect(0, 0, bg.clientWidth, bg.clientHeight)
  fgctx?.clearRect(0, 0, fg.clientWidth, fg.clientHeight)
}

export function resizeCanvas() {
  bg.width = div.clientWidth
  fg.width = div.clientWidth
  bg.height = div.clientHeight
  fg.height = div.clientHeight
}

/** Clears the canvas and update the grid based on the current size of the canvas */
export function updateGridLines() {
  clearAll()

  dimensions.x = Math.trunc(div.clientWidth / tileSize)
  dimensions.y = Math.trunc(div.clientHeight / tileSize)

  // Draw the Vertical lines
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
export function drawTile(tile: Vector2D, color: string) {
  if (!validTile(tile)) return
  if (!fgctx) return
  fgctx.fillStyle = color
  fgctx.fillRect(tile.x*tileSize, tile.y*tileSize, tileSize, tileSize)
}

/** Erases a tile in the x, y tile position.*/
export function eraseTile(tile: Vector2D) {
  if (!validTile(tile)) return
  fgctx?.clearRect(tile.x*tileSize, tile.y*tileSize, tileSize, tileSize)
}

/** Checks if tile coordinates is inside the grid.*/
export function validTile(tile: Vector2D) {
  return (
    (0 <= tile.x && tile.x < dimensions.x) &&
      (0 <= tile.y && tile.y < dimensions.y)
  )
}

/** Transforms canvas pixel coordinates into tile coordinates.*/
function canvasToTileCoordinates(canvasCoord: Vector2D) {
  return {
    x: Math.trunc(canvasCoord.x / tileSize),
    y: Math.trunc(canvasCoord.y / tileSize)
  }
}

// Drawing logic
const dispatch = createEventDispatcher()
let isPenDown = false
let oldTile = {x: -1, y: -1}

const getCoordinatesFromEvent = (ev: MouseEvent | TouchEvent) => {
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

const penDown = (ev: MouseEvent | TouchEvent) => {
  if (isPenDown) return

  const coord = getCoordinatesFromEvent(ev)
  if (!coord) return

  isPenDown = true
  let newTile = canvasToTileCoordinates(coord)
  dispatch('draw', newTile)
  oldTile = newTile
}

const penMove = (ev : MouseEvent | TouchEvent) => {
  ev.preventDefault()
  if (!isPenDown) return

  const coord = getCoordinatesFromEvent(ev)
  if (!coord) return 
  
  let newTile = canvasToTileCoordinates(coord)
  if (newTile.x !== oldTile.x || newTile.y !== oldTile.y) {
    dispatch('draw', newTile)
    oldTile = newTile
  }
}

onMount(() => {
  bgctx = bg.getContext("2d") || undefined
  fgctx = fg.getContext("2d") || undefined
  resizeCanvas()
  updateGridLines()
})
</script>

<div bind:this={div} class="w-full h-full relative">
  <canvas  bind:this={bg}></canvas>
  <canvas 
    class="absolute top-0" 
    bind:this={fg}
    on:mousedown={penDown}
    on:mouseup={() => isPenDown = false}
    on:mousemove={penMove}
    on:mouseleave={() => isPenDown = false}

    on:touchstart={penDown}
    on:touchend={() => isPenDown = false}
    on:touchcancel={() => isPenDown = false}
    on:touchmove={penMove}
  />
</div>
