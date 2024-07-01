<script lang="ts">
  import Puzzle from "./puzzle.svelte";
  import { type SearchProblem, Astar, IDAstar } from "$lib/search";
  import { manhattan, misplaced_tiles, manhattan_cached, linear_conflict } from './heuristics'
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

  $: target_state = puzzle?.getSolvedPuzzle()

  let searchOptions = {
    heuristic: "Misplaced Tiles" as keyof typeof heuristicMethods,
    heuristic_weight: 1,
    search_algorithm: "A*" as keyof typeof searchMethods
  }
  // heuristic methods
  const heuristicMethods = {
    "Manhattan": manhattan,
    "Manhattan + Linear Conflicts": linear_conflict,
    "Misplaced Tiles": misplaced_tiles
  }

  const searchMethods = {
    "A*": Astar,
    "IDA*": IDAstar
  }

  function getSuccessorsAndCost(state: number[]) {
    let i = state.indexOf(0)
    return puzzle.possibleActions(i)
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
  function runSearch() {
    solution_steps = []
    solution_index = 0
    target_state = puzzle.getSolvedPuzzle()
    // Define the search problem
    let searchProblem : SearchProblem<number[]> = {
      start_state: puzzle_state,
      is_end: state => state.every((x, i) => x == target_state[i]),
      // Returns the next states possible and the cost
      succ_and_cost: getSuccessorsAndCost
    }
    
    // Set the heuristic method and artificially scale the heuristic to see greedy or ucs behaviour
    let func = heuristicMethods[searchOptions.heuristic](target_state, grid_size)
    let heuristic = (state: number[]) => func(state) * searchOptions.heuristic_weight

    // For aborting
    abort = new AbortController()

    return searchMethods[searchOptions.search_algorithm](searchProblem, heuristic, {
      signal: abort.signal,
      yields_per_interval: 100_000,
      interval: 10,
      hash: x => x.join(',')
    })
  }

  /** Wrapper around runSearch which also manipulates the ui */
  let msg = ''
  function solve8Puzzle() {
    solution_steps = []
    solution_index = 0
    msg = 'solving...'
    is_solving = true
    let time = Date.now()

    runSearch()
      .then(result => {
        if (result.success) {
          msg = `Solved in ${Date.now() - time}ms`
          solution_steps = result.route

          if (result.iterations)
            msg += ` | States searched: ${result.iterations}`
        } else {
          msg = "No solution found."
        }
      })
      .catch(x => msg = x)
      .finally(() => is_solving = false)

  }

  let str : string
  function strToPuzzle() {
    let arr = str.split(',').map(x => parseInt(x))
    if (arr.length != grid_size**2) {
      console.error("Invalid array size for puzzle")  
    }
    let checks : {[k: number]: boolean | undefined}= {}
    for (const num of arr) {
      if (num < 0 || num >= grid_size**2) {
        console.error("Value of the puzzle tiles should be between 0 and " + grid_size**2 )  
        return
      }
      if (checks[num]) {
        console.error("Duplicate tile value : " + num)
        return
      }
      checks[num] = true
    }
    if (!puzzle.puzzleIsSolvable(arr)) {
      console.error("Unsolvable puzzle")
      return
    }
    puzzle_state = arr
  }
</script>

<button class="btn btn-primary" on:click={puzzle.reset}>reset</button>
<button class="btn btn-primary" on:click={puzzle.shufflePositions}>Shuffle</button>
<Puzzle bind:this={puzzle} bind:puzzle={puzzle_state} bind:grid_size={grid_size}/>

<!-- Replay solution -->
{#if solution_steps.length > 0}
  <!-- 8Puzzle animation player -->
  <p>Moves needed : {solution_steps.length - 1}</p>
  <div class="flex p-4">
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

{#if !is_solving}
  <button class="btn btn-primary" on:click={solve8Puzzle}>Solve</button>
{:else}
  <button class="btn btn-primary" on:click={()=>abort.abort("Search Stopped by User")}>Stop</button>
{/if}
<p>{msg}</p>

<!-- Search options-->
<select bind:value={grid_size}>
  <option value={3}>3</option>
  <option value={4}>4</option>
</select>
<select bind:value={searchOptions.heuristic}>
  {#each Object.keys(heuristicMethods) as h}
    <option value={h}>{h}</option>
  {/each}
</select>

<select bind:value={searchOptions.search_algorithm}>
  {#each Object.keys(searchMethods) as h}
    <option value={h}>{h}</option>
  {/each}
</select>
<input type="range" min={0} max={5} bind:value={searchOptions.heuristic_weight} />

<br>
<label>
  Set puzzle:
  <input type="text" bind:value="{str}" on:focusout={strToPuzzle}/>
</label>
