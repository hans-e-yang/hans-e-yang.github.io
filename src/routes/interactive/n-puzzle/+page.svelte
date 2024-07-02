<script lang="ts">
  import Puzzle from "./puzzle.svelte";
  import { type SearchProblem, Astar, IDAstar } from "$lib/search";
  import { manhattan, misplaced_tiles, linear_conflict } from './heuristics'
  let puzzle : Puzzle
  
  // Assumes that the target_state is 0 at the end.
  let puzzle_state : number[]
  let target_state : number[]
  let grid_size : number = 3
  /** Array containing the states of the n-puzzle to the solution */
  let solution_steps : number[][] = []  
  let solution_index = -1


  let abort : AbortController
  let is_solving = false

  // Updates puzzle when seeking solution
  $: if (solution_index >= 0 && solution_index < solution_steps.length) {
    puzzle_state = solution_steps[solution_index]
  }

  $: if (grid_size) {
    solution_steps = []
    solution_index = 0
    msg = ""
  }

  $: target_state = puzzle?.get_solved_puzzle()

  let search_options = {
    heuristic: "Misplaced Tiles" as keyof typeof heuristic_methods,
    heuristic_weight: 1,
    search_algorithm: "A*" as keyof typeof search_methods
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

  /** Defines the search problem and runs the search */
  function run_search() {
    solution_steps = []
    solution_index = 0
    target_state = puzzle.get_solved_puzzle()
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
      hash: x => x.join(',')
    })
  }

  /** Wrapper around runSearch which also manipulates the ui */
  let msg = ''
  function solve_8_puzzle() {
    solution_steps = []
    solution_index = 0
    msg = 'solving...'
    is_solving = true
    let time = Date.now()

    run_search()
      .then(result => {
        if (result.success) {
          msg = `Solved in ${Date.now() - time}ms`
          solution_steps = result.route

          // For Astar
          if (result.iterations)
            msg += ` | States searched: ${result.iterations}`
        } else {
          msg = "No solution found."
        }
      })
      .catch(x => msg = x)
      .finally(() => is_solving = false)

  }

  // Edit puzzle schematics
  let is_editting = false
  let tmp : number[]
  let state_str = ""
  let edit_error = ""
  function start_edit() {
    is_editting = true
    tmp = puzzle_state
  }
  $: if (state_str) on_edit_puzzle_state()
  function on_edit_puzzle_state() {
    edit_error = ""
    if (!state_str.match(/^[\d ]+$/)) {
      edit_error = "Only Integers Allowed"
      return
    }
    let check : {[k: string]: boolean}= {}
    let arr = [] 
    for (const x of state_str.split(" ")) {
      if (!x) continue
      if (check[x]){
        edit_error = "Duplicate Integers"
        return
      }
      check[x] = true
      arr.push(parseInt(x))
    }

    if (arr.some(x => x < 0 || x >= grid_size**2)) {
      edit_error = "Integers beyond puzzle bounds. Please change puzzle size in options."
    }
    puzzle_state = arr
  }
  function save_changes() {
    if (puzzle_state.length != grid_size**2) {
      edit_error = "Please enter integers from 0 to " + (grid_size**2-1)
      return
    }
    if (!puzzle.puzzle_is_solvable(puzzle_state)) {
      edit_error = "Puzzle is not solvable"
      return
    }
    is_editting = false
  }
  function remove_changes() {
    puzzle_state = tmp
    is_editting = false
  }
</script>

<div class="flex flex-col md:flex-row items-center md:justify-center p-2 gap-2">

  <Puzzle class="w-full max-w-sm" bind:this={puzzle} bind:puzzle={puzzle_state} bind:grid_size={grid_size}/>

  {#if !is_editting}
    <div class="flex flex-col items-center p-2 gap-2">
      <!-- Puzzle controls -->
      <div class="grid grid-cols-2 gap-2 text-right">
        <p>Manage Puzzle State</p>
        <div>
          <button class="btn btn-primary mr-4" on:click={puzzle.reset}>Reset</button>
          <button class="btn btn-primary" on:click={puzzle.shuffle_positions}>Shuffle</button>
        </div>

        <p>Solve Puzzle</p>
        {#if !is_solving}
          <button class="btn btn-primary" on:click={solve_8_puzzle}>Solve</button>
        {:else}
          <button class="btn btn-primary" on:click={()=>abort.abort("Search Stopped by User")}>Stop</button>
        {/if}
      </div>

      <!-- Search results -->
      <div class="flex flex-col items-center gap-1">
        <p class="font-semibold text-center">Results</p>
        <p>{msg || "Search has not run"}</p>

        <!-- Replay solution -->
        {#if solution_steps.length > 0}
          <!-- 8Puzzle animation player -->
          <p>Moves needed : {solution_steps.length - 1}</p>
          <div class="flex gap-2 p-4">
            <button class="btn btn-primary" 
              on:click={()=> {if (solution_index > 0) solution_index--}}>
              Prev
            </button>
            <input type="range" min={0} max={solution_steps.length-1} bind:value={solution_index}/>
            <button class="btn btn-primary"
              on:click={() => {if (solution_index < solution_steps.length-1) solution_index++}}
            >Next</button>
          </div>
        {/if}
      </div>


      <!-- Options -->
      <details class="flex flex-col items-center gap-2">
        <summary class="font-bold text-center">Options</summary>
        <div class="grid grid-cols-[1fr,2fr] gap-2 text-right">
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
      </details>

      <button on:click={start_edit} class="btn btn-primary">Edit Puzzle</button>
    </div>
  {:else}
    <button on:click={save_changes} class="btn btn-primary">Save</button>
    <button on:click={remove_changes} class="btn btn-primary">Cancel</button>
    <p>Input the puzzle as integers seperated by space. Use 0 as the empty tile.</p>
    <input type="text" bind:value={state_str}/>
    <p>{edit_error}</p>
  {/if}

</div>
