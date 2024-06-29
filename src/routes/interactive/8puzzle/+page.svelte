<script lang="ts">
  import Puzzle from "./puzzle.svelte";
	import { AstarSearch, AstarSearchAsync, type SearchProblem, type AstarReturnType, IDAstarAsync } from "$lib/astarv2";
  let puzzle : Puzzle
  
  // Assumes that the target_state is 0 at the end.

  let puzzle_state : number[]
  let target_state : number[]
  let grid_size : number = 3
  /** Array containing the states of the n-puzzle to the solution */
  let solution_steps : number[][] = []  
  let solution_index = -1

  // Updates puzzle when seeking solution
  $: if (solution_index >= 0 && solution_index < solution_steps.length) {
    puzzle_state = solution_steps[solution_index]
  }

  $: target_state = puzzle?.getSolvedPuzzle()

  let searchOptions = {
    heuristic: "Misplaced Tiles" as keyof typeof heuristicMethods,
    heuristic_weight: 1,
    search_algorithm: "A*" as keyof typeof searchMethods
  }
  // heuristic methods
  const heuristicMethods = {
    "Manhattan": (state: number[]) => {
      function distanceBetweenIdx(a: number, b: number) {
        let x1 = a % grid_size
        let y1 = Math.floor(a / grid_size)
        let x2 = b % grid_size
        let y2 = Math.floor(b / grid_size)
        return Math.abs(x1-x2) + Math.abs(y1-y2)
      }
      return state.reduce((totalVal, num, pos) => {
        if (num == 0) return totalVal
        return totalVal + distanceBetweenIdx(pos, num-1)
      }, 0)
    },
    "Misplaced Tiles": (state: number[]) => state
      .filter((x, i) => x != target_state[i])
      .length,
    }

  const searchMethods = {
    "A*": AstarSearchAsync,
    "IDA*": IDAstarAsync
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
    solution_index = -1
    target_state = puzzle.getSolvedPuzzle()
    // Define the search problem
    let searchProblem : SearchProblem<number[]> = {
      start_state: puzzle_state,
      is_end: state => state.every((x, i) => x == target_state[i]),
      // Returns the next states possible and the cost
      succAndCost: getSuccessorsAndCost
    }
    
    // Set the heuristic method and artificially scale the heuristic to see greedy or ucs behaviour
    let func = heuristicMethods[searchOptions.heuristic]
    let heuristic = (state: number[]) => func(state) * searchOptions.heuristic_weight

    return searchMethods[searchOptions.search_algorithm](searchProblem, heuristic, 10_000)
  }

  /** Wrapper around runSearch which also manipulates the ui */
  let msg = ''
  async function solve8Puzzle() {
    solution_index = 0
    msg = 'solving...'
    let time = Date.now()
    let result = await runSearch()
    if (result.success) {
      msg = `Solved in ${Date.now() - time}ms`
      solution_steps = result.route
      if (result.iterations) 
        msg += ` | States searched: ${result.iterations}`
    } else {
      msg = "No solution found."
    }
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
    if (!puzzleIsSolvable(arr)) {
      console.error("Unsolvable puzzle")
      return
    }
    puzzle = arr
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

<button class="btn btn-primary" on:click={solve8Puzzle}>solve</button>
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
<input type="range" min={0} max={2} bind:value={searchOptions.heuristic_weight} />

<br>
<label>
  Set puzzle:
  <input type="text" bind:value="{str}" on:focusout={strToPuzzle}/>
</label>
