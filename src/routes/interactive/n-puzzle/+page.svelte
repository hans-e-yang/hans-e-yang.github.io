<script lang="ts">
  // Puzzle is represented as a number[] with index 0 as top left and last index as the most bottom right
  // puzzle.svelte = representation of the n-puzzle
  // replay_puzzle.svelte = When given a solution array of puzzle states, allows for replaying
  // edit_puzzle.svelte = Allows user to input their own puzzle
  // +page.svelte = Hooks up all the components and connects it to search alg

  import Puzzle from "./puzzle.svelte";
  import { type SearchProblem, Astar, IDAstar, type SearchResult } from "$lib/search";
  import { manhattan, misplaced_tiles, linear_conflict } from './heuristics'
  import ReplayPuzzle from "./replay_puzzle.svelte";
  import EditPuzzle from "./edit_puzzle.svelte";
  let puzzle : Puzzle
  
  // Assumes that the target_state is 0 at the end.
  let puzzle_state : number[]
  let grid_size : number = 3

  let abort : AbortController

  let search_options = {
    heuristic: "Manhattan + Linear Conflicts" as keyof typeof heuristic_methods,
    heuristic_weight: 1,
    search_algorithm: "IDA*" as keyof typeof search_methods
  }

  // heuristic methods
  const heuristic_methods = {
    "Misplaced Tiles": misplaced_tiles,
    "Manhattan": manhattan,
    "Manhattan + Linear Conflicts": linear_conflict,
  }

  const search_methods = {
    "A*": Astar,
    "IDA*": IDAstar
  }

  function get_successors_and_cost(state: number[]) {
    let i = state.indexOf(0)
    return puzzle.possible_actions(i)
      .map(x => {
        // Make array copy and swap the elements to get the next state
        let p = state.map(x => x)
        ;[p[i], p[x]] = [p[x], p[i]]
        return {
          next_state: p,
          cost: 1
        }
      })
  }

  let search_start_time : number
  let search_time : number
  let promise : Promise<SearchResult<number[]>> | undefined

  $: if (grid_size) promise = undefined

  /** Defines the search problem and runs the search */
  async function run_search() {
    search_start_time = Date.now()

    let target_state = puzzle.get_solved_puzzle()
    // Define the search problem
    let searchProblem : SearchProblem<number[]> = {
      start_state: puzzle_state,
      is_end: state => state.every((x, i) => x == target_state[i]),
      // Returns the next states possible and the cost
      succ_and_cost: get_successors_and_cost
    }
    
    // Set the heuristic method and artificially scale the heuristic to see greedy or ucs behaviour
    let func = heuristic_methods[search_options.heuristic](target_state)
    let heuristic = (state: number[]) => func(state) * search_options.heuristic_weight

    // For aborting
    abort = new AbortController()

    return search_methods[search_options.search_algorithm](searchProblem, heuristic, {
      signal: abort.signal,
      yields_per_interval: 100_000,
      interval: 10,
      hash: x => x.join(','),
    }).then(x => {
        search_time = Date.now() - search_start_time
        return x
      })
  }

  // May be moved into another component
  // Edit puzzle schematics
  let is_editting = false
</script>

<div class="col-center md:flex-row md:justify-center p-2 md:mt-12">
  <!-- Content -->
  <Puzzle class="w-full max-w-sm" bind:this={puzzle} bind:puzzle={puzzle_state} bind:grid_size={grid_size}/>

    <div class="col-center">
    <!-- Controls -->
    {#if !is_editting}
      <!-- Puzzle controls -->
      <div class="form-entries">
        <p>Manage Puzzle State</p>
        <div class="flex gap-2">
          <button class="btn btn-primary" on:click={puzzle.reset}>Reset</button>
          <button class="btn btn-primary" on:click={puzzle.shuffle_positions}>Shuffle</button>
          <button on:click={()=>is_editting = true} class="btn btn-primary">Edit Puzzle</button>
        </div>
      </div>



      {#await promise} <!-- When Searching -->
        <button class="btn btn-primary" on:click={()=>abort.abort("Search Stopped by User")}>Stop</button>

      {:then result} <!-- Default -->
        <button class="btn btn-primary" on:click={()=>promise=run_search()}>Solve</button>
        <!-- After Search -->
        {#if result}
          {#if result.success}
            {@const {route} = result}

            <div class="flex flex-col items-center gap-1">
              <p class="font-semibold text-center">Results</p>
              <p>Moves needed : {route.length - 1}</p>
              <p>Solved in {search_time} ms</p>
              <ReplayPuzzle 
                bind:puzzle={puzzle_state} 
                solution={route} />
            </div>
          {:else}
            <p>No solution</p>
          {/if}
        {/if}

      {:catch error} <!-- When Searching encounters errors, like stopped by user -->
        <button class="btn btn-primary" on:click={()=>promise=run_search()}>Solve</button>
        <p>{error}</p>
      {/await}

      <!-- Options -->
      <p class="font-bold text-center">Options</p>
      <div class="form-entries">
        <p>Puzzle Size</p>
        <select bind:value={grid_size}>
          <option value={3}>3</option>
          <option value={4}>4</option>
          <option value={5}>5</option>
        </select>

        <p>Search Algorithm</p>
        <select bind:value={search_options.search_algorithm}>
          {#each Object.keys(search_methods) as h}
            <option value={h}>{h}</option>
          {/each}
        </select>


        <p>Heuristic Method</p>
        <select bind:value={search_options.heuristic}>
          {#each Object.keys(heuristic_methods) as h}
            <option value={h}>{h}</option>
          {/each}
        </select>

        <p>Heuristic Weight</p>
        <div class="flex gap-2">
          0
          <input type="range" min={0} max={5} bind:value={search_options.heuristic_weight} />
          5
          <p class="border-l pl-2">Value: {search_options.heuristic_weight}</p>
        </div>
      </div>


      <p class="pt-3 border-t">
        Setting a higher heuristic weight will return a suboptimal result faster. <br>
        It is recommended to set heuristic weight &gt; 1 for puzzle size 4 and 5. <br>
        IDA* is a memory efficient version of A*. A* can usually only work for <br>
        8-puzzle, since larger n-puzzles would require too much memory. <br>
      </p>
    {:else}
      <EditPuzzle bind:puzzle={puzzle_state} bind:is_editting={is_editting} />
    {/if}
    </div>
</div>
