<script lang="ts">
  // `+page.svelte` only contains sets up the Astar Search
  // The state of the grid is stored in `grid_state.svelte`
  // `grid.svelte` provides an abstraction for the html canvas


  // TODO: Change abortController to custom object to have pause and resume controls
  // TODO: Add API to use workers. See vite worker(new URL('', import.meta.url), {type: 'module'}) <== This would be better for npuzzle
  // TODO: write blog post on how this api changed from weird class => generators => Promise based wrapper + abort controller => web workers

  import Grid from "./grid_state.svelte";
  import { Astar, IDAstar, type SearchResult, type SearchProblem} from "$lib/search";
  import Toggle from "$components/toggle.svelte";
  import {debounce} from '$lib/util'

  type Vector2D =  {
    x: number,
    y: number
  }

  let grid : Grid

  // Astar Algorithm Stuff
  const search_settings = {
    distance_method : "Manhattan" as keyof typeof distance_methods,
    allow_diagonal_movement: false,
    heuristic_weight: 1,
    search_method: "A*" as keyof typeof search_methods,
    animation_delay: 10
  }

  const distance_methods = {
    "Manhattan": (a: Vector2D, b: Vector2D) => 
      Math.abs(a.x - b.x) + Math.abs(a.y - b.y),
    "Euclid": (a: Vector2D, b: Vector2D) =>
      Math.sqrt((a.x - b.x)**2 + (a.y - b.y)**2)
  }

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

  const search_methods = {
    "IDA*": IDAstar,
    "A*": Astar
  }

  function actionsAndCost(state: Vector2D) {
    let position = state
    let actionsAndCostArr = []
    let movements = search_settings.allow_diagonal_movement ? 8 : 4
    for (let i = 0; i < movements; i++) {
      let mov = possibleMovements[i]
      let action = {
        x: mov.x + position.x,
        y: mov.y + position.y
      }
      if (grid.is_valid_tile(action)) {
        actionsAndCostArr.push({
          next_state: action,
          // Could be gridtiles.get(action).cost for individual cost for each tile
          cost: mov.cost 
        })
      }
    }
    return actionsAndCostArr
  }

  let abort = new AbortController()
  let promise : Promise<SearchResult<Vector2D>> | undefined

  async function run() {
    abort = new AbortController()
    let end = grid.get_end()
    let search_problem : SearchProblem<Vector2D> = {
      start_state : grid.get_start(),
      is_end : (state) => state.x == end.x && state.y == end.y,
      succ_and_cost: actionsAndCost
    }
    grid.clean()
    let heuristic = (a: Vector2D) =>
      Math.trunc(distance_methods[search_settings.distance_method](a, end) * 10) * search_settings.heuristic_weight


    promise = search_methods[search_settings.search_method](search_problem, heuristic, {
      yields_per_interval: 1,
      interval: search_settings.animation_delay,
      on_progress: ([known, frontiers]) => {
        for (const frontier of frontiers)
          grid.draw_tile_animation(frontier, 'frontier')
        if (known)
          grid.draw_tile_animation(known, 'known')
        grid.draw_start_and_end()
      },
      on_iteration_done: () => {
        grid.clean()
      },
      signal: abort.signal
    })
      .then(x => {
        if (x.success) {
          for (const route of x.route.slice(1, -1)) 
            grid.draw_tile_animation(route, 'route')
        }
        return x
      })
  }

  let grid_size = 15
  $: resize = debounce(grid?.resize_grid, 300)
  $: grid_size && resize && resize(grid_size)
</script>

<h2 class=" p-2 text-2xl">Pathfinding with search algorithms</h2>

<main class="col-center md:flex-row p-4">
  <!-- Display -->
  <div class="h-[50vh] sm:h-[80vh] w-full grow">
    <Grid bind:this={grid}/>
  </div>

  <!-- Controls -->
  <div class="col-center p-2 gap-4 md:w-[500px]">
    <div class="flex gap-4 items-center">
      <p>Draw</p>
      <button class="btn btn-primary" on:click={() => grid.set_tile("wall")}>Draw Wall</button>
      <button class="btn btn-primary" on:click={() => grid.set_tile("empty")}>Remove Wall</button>
    </div>
    <div class="flex gap-4 items-center">
      <p>Actions</p>
      <button class="btn btn-primary" on:click={grid.clean}>Clean Grid</button>
      <button class="btn btn-primary" on:click={grid.clear}>Remove All Walls</button>
    </div>

    <hr class="border-b w-full border-primary">

    {#await promise}
      <button class="btn btn-primary" on:click={()=>abort.abort("Search stopped by user")}>Stop</button>
     
    {:then result} 
      <button class="btn btn-primary" on:click={run}>Start</button>
      {#if result?.success}
        <p>Total cost: {result.total_cost}</p>
      {:else if result?.success === false}
        <p>No Possible Route</p>
      {/if}

    {:catch error}
      <button class="btn btn-primary" on:click={run}>Start</button>
      <p>{error}</p>
    {/await}

    <p class="font-bold">Settings</p>
    <div class="form-entries">
      <p>Grid Tile Size: </p>
      <input type="number" bind:value={grid_size}>

      <p>Interval(ms): </p>
      <input type="number" bind:value={search_settings.animation_delay} >

      <p>Search function: </p>
      <select bind:value={search_settings.search_method}>
        {#each Object.keys(search_methods) as method}
          <option value="{method}">{method}</option>
        {/each}
      </select>

      <p>Enable 8 way movement: </p>
      <Toggle bind:checked={search_settings.allow_diagonal_movement}/>

      <p>Heuristic weight: </p>
      <div class="flex gap-2">
        0 <input type="range" max="5" min="0" bind:value={search_settings.heuristic_weight} step="0.5" /> 5 <small>({search_settings.heuristic_weight})</small>
      </div>

      <p>Heuristic Function: </p>
      <select bind:value={search_settings.distance_method} class="border">
        {#each Object.keys(distance_methods) as t}
          <option value={t}>{t}</option>
        {/each}
      </select>
    </div>
  </div>
</main>
