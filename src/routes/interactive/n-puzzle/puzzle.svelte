<script lang="ts">
// https://michael.kim/blog/puzzle
// https://www.cs.princeton.edu/courses/archive/fall12/cos226/assignments/8puzzle.html : Puzzle is solvable
// https://cse.sc.edu/~mgv/csce580sp15/gradPres/HanssonMayerYung1992.pdf : Linear Conflict heuristic
// https://www.cs.cmu.edu/~motionplanning/lecture/Asearch_v8.pdf: Weighted A* algorithm

  /** Component implementation of 8 puzzle.
   *  Manages the state and display of the puzzle.
   */
	import { flip } from "svelte/animate";
  import { shuffle } from "$lib/util"
  import { puzzle_is_solvable } from './util'

  /** Size of n-puzzle */
  export let grid_size = 3
  /** Data representation of the puzzle state */
  export let puzzle = get_solved_puzzle()

  /** Set the puzzle to the solution */
  export function reset() {
    puzzle = get_solved_puzzle()
  }

  /** Returns the array that represents the solved puzzle */
  export function get_solved_puzzle() {
    let arr = []
    for (let i = 1; i < grid_size**2; i++) arr.push(i)
    arr.push(0)
    return arr
  }

  /** Shuffles the puzzle while making sure the result is solvable */
  export function shuffle_positions() {
    do {shuffle(puzzle)} while (!puzzle_is_solvable(puzzle))
    puzzle = puzzle
  }


  /** Given the index in the array, returns the indexes of adjacent tiles
  */
  export function possible_actions(index: number) {
    let [x, y] = [index % grid_size, Math.floor(index / grid_size)]
    return [[x+1, y], [x-1, y], [x, y+1], [x, y-1]]
      .filter(([x, y]) => (x >= 0 && x < grid_size) && (y >= 0 && y < grid_size))
      .map(([x, y]) => y*grid_size + x)
  }

  /** Swipe the tile specified in the index to the empty tile, if is adjacent to it. Otherwise does nothing. */
  export function swap(index: number) {
    for (const target of possible_actions(index)) {
      if (puzzle[target] == 0){
        ;[puzzle[index], puzzle[target]] = [puzzle[target], puzzle[index]]
        puzzle = puzzle
        break
      }
    }
  }


  let grid: HTMLDivElement
  $: if (grid) {
    grid.style.gridTemplateRows = `repeat(${grid_size}, minmax(0, 1fr))` 
    grid.style.gridTemplateColumns = `repeat(${grid_size}, minmax(0, 1fr))` 
    reset()
  }
</script>

<!-- UI -->
<div bind:this={grid} class="{$$props.class} grid grid-cols-3 grid-rows-3 m-4 max-w-sm border border-primary">
  {#each puzzle as value, idx (value)}
    <div on:click={() => swap(idx)} animate:flip={{duration: 500}} 
      class="aspect-square grid place-items-center text-3xl
      {value? 'border border-primary bg-primary/25': ''}"
    >
      {value == 0? '' : value}
    </div>
  {/each}
</div>

