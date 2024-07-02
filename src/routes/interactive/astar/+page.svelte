<script lang="ts">
  // Seperate grid tiles into seperate svelte component. 
  // +page.svelte only to manage the search settings.
  // Use the new API
  import { Astar } from "$lib/astar";
  import Grid from "./grid.svelte";
  import { type SearchProblem, AstarSearch } from '$lib/astarv2'

  type Vector2D =  {
    x: number,
    y: number
  }

  type Tile = "start" | "end" | "wall" | "empty" | "frontier" | "route" | "known"
  // Astar grid animation options
  /** Grid Tile colors */
  let colors : {[k in Tile]: string} = {
    "start" : "blue",
    "end": "green",
    "wall": "black",
    "empty": "none",
    "known": "brown",
    "frontier": "red",
    "route": "yellow"
  }

  let grid : Grid

  // Data representation of grid
  function coordToKey(coord: Vector2D) {
    return coord.x * 10_000 + coord.y
  }
  function keyToCoord(key: number) {
    return {x: Math.trunc(key/10_000), y: key%10_000}
  }
  function GridTiles() {
    const tiles = new Map<number, Tile>()

    return {
      getWithKey: tiles.get,
      get: (coord: Vector2D) =>
        tiles.get(coordToKey(coord)) || "empty",

      set: (coord: Vector2D, val: Tile) => {
        if (val == "empty") {
          tiles.delete(coordToKey(coord))
          grid.eraseTile(coord)
        } else {
          tiles.set(coordToKey(coord), val)
          grid.drawTile(coord, colors[val])
        }
      },
      redraw: () => {
        grid.clear()
        for (const [key, state] of tiles.entries()) {
          grid.drawTile(keyToCoord(key), colors[state])
        }
      }
    }
  }
  let gridTiles = GridTiles()
  let start = {x: -1, y: -1}
  let end = {x: -1, y: -1}

  // Astar Algorithm Stuff

  /** Distance method use to determine heuristic for Astar Algorithm. Default is using the Manhattan distance. */
  let distanceMethod : "Manhattan" | "Euclid" = "Manhattan"
  const distanceMethods = {
    "Manhattan": (a: Vector2D, b: Vector2D) => 
      Math.abs(a.x - b.x) + Math.abs(a.y - b.y),
    "Euclid": (a: Vector2D, b: Vector2D) =>
      Math.sqrt((a.x - b.x)**2 + (a.y - b.y)**2)
  }

  /** Weight of heuristic compared to the cost. Default is 1, meaning the heuristic more or less estimates the exactly */
  let heuristicWeight = 1

  function heuristic(state: number, target_state: number) {
    let a = keyToCoord(state)
    let b = keyToCoord(target_state)
    // Manhattan distance
    let _heuristic = distanceMethods[distanceMethod](a, b)

    return Math.trunc(_heuristic * 10 * heuristicWeight)
  }

  /** If true, allows diagonal movement (8 way movement) for the pathfinding */
  let allowDiagonalMovement = false
  const possibleMovements = [
    {x: 1, y: 0, cost: 10},
    {x: -1, y: 0, cost: 10},
    {x: 0, y: 1, cost: 10},
    {x: 0, y: -1, cost: 10},
    {x: 1, y: 1, cost: 14},
    {x: -1, y: -1, cost: 14},
    {x: -1, y: 1, cost: 14},
    {x: 1, y: -1, cost: 14}
  ]
  function actionsAndCost(state: number) {
    let position = keyToCoord(state)
    let actionsAndCostArr = []
    let movements = allowDiagonalMovement ? 8 : 4
    for (let i = 0; i < movements; i++) {
      let mov = possibleMovements[i]
      let action = {
        x: mov.x + position.x,
        y: mov.y + position.y
      }
      if (grid.validTile(action) && gridTiles.get(action) != "wall") {
        actionsAndCostArr.push({
          state: coordToKey(action),
          cost: mov.cost
        })
      }
    }
    return actionsAndCostArr
  }

  let astar = Astar<number>(actionsAndCost, heuristic)

  // Grid drawing methods
  let tileToDraw : "start" | "end" | "wall" | "empty" =  "start"

  function drawHandler(ev: Event & {detail: Vector2D}) {
    switch (tileToDraw) {
      case "start":
        if (gridTiles.get(ev.detail) == "end") return
        gridTiles.set(start, "empty")
        start = ev.detail
        gridTiles.set(start, "start")
        astar.setStartState(coordToKey(start))
        break

      case "end":
        if (gridTiles.get(ev.detail) == "start") return
        gridTiles.set(end, "empty")
        end = ev.detail
        gridTiles.set(end, "end")
        astar.setEndState(coordToKey(end))
        break

      case "wall":
        if (gridTiles.get(ev.detail) == "empty") {
          gridTiles.set(ev.detail, "wall")
        }
        break

      case "empty":
        if (gridTiles.get(ev.detail) == "wall") {
          gridTiles.set(ev.detail, "empty")
        }
        break
    }
  }


  // Astar animation
  let interval: number
  let generator: Generator<[number | undefined, number[]], void, unknown>
  let animIsRunning = false
  let totalCost = 0
  /** Run the astar animation pathfinding */
  function run(
    animationDelay = 100, 
  ) 
    {
    animIsRunning = true
    gridTiles.redraw()
    clearInterval(interval)
    generator = astar.searchRouteGenerator()

    interval = setInterval(() => {
      let result = generator.next()

      if (result.done) {
        clearInterval(interval)
        for (const key of astar.getRoute().slice(1, -1)) {
          grid.drawTile(keyToCoord(key), colors.route)
        }
        animIsRunning = false
        totalCost = astar.getTotalCost()
      } else {
        let [known, frontier] = result.value
        grid.drawTile(keyToCoord(known || -1), colors.known)
        for (const key of frontier) {
          grid.drawTile(keyToCoord(key), colors.frontier)
        }
        grid.drawTile(start, colors.start)
        grid.drawTile(end, colors.end)
      }
    }, animationDelay)
  }
  function stopAnim() {
    clearInterval(interval)
    animIsRunning = false
  }
</script>

<h2 class=" p-2 text-2xl">Astar Pathfinding</h2>
<div class="p-2 flex flex-col sm:flex-row gap-3">
  <div class="h-[50vh] sm:h-[80vh] grow">
    <Grid on:draw={drawHandler} bind:this={grid}/>
  </div>

  <div>
    <div>
      <p>Drawing tile: {tileToDraw}</p>
      <button class="btn btn-secondary" on:click={() => tileToDraw = "start"}>start</button>
      <button class="btn btn-secondary" on:click={() => tileToDraw = "end"}>end</button>
      <button class="btn btn-secondary" on:click={() => tileToDraw = "wall"}>wall</button>
      <button class="btn btn-secondary" on:click={() => tileToDraw = "empty"}>remove wall</button>
      <br>
      <button class="btn btn-secondary mt-1" on:click={gridTiles.redraw}>Clean Grid</button>
    </div>

    <div>
      <p>Animation</p>
      {#if animIsRunning}
        <button class="btn btn-secondary" on:click={stopAnim}>stop</button>
      {:else}
        <button class="btn btn-secondary" on:click={()=> run(10)}>start anim</button>
      {/if}
      {#if totalCost}
        <p>Total Cost : {totalCost}</p>
      {/if}
    </div>

    <div>
      <p>Settings</p>
      <details>
        <summary>Enable 8 way movement &nbsp;
          <input type="checkbox" bind:value={allowDiagonalMovement}/>
        </summary>
        <p>Allow diagonal movement</p>
      </details>

      <details>
        <summary>Heuristic Weight Compared to Cost</summary>

        <p> Artificially scale the heuristic.
          (<a href="https://en.wikipedia.org/wiki/A*_search_algorithm#:~:text=The%20heuristic%20function%20is%20problem,path%20from%20start%20to%20goal.">see more</a>)</p>
      </details>
      0 <input type="range" max="2" min="0" bind:value={heuristicWeight} /> 2

      <details>
        <summary>Distance Method for heuristic</summary>
      </details>
      <select bind:value={distanceMethod} class="border">
        {#each Object.keys(distanceMethods) as t}
          <option value={t}>{t}</option>
        {/each}
      </select>
    </div>
  </div>

</div>
