<script lang="ts">
  import { puzzle_is_solvable } from "./util";
  /** Set to true to start editting */
  export let is_editting = false
  /** Bind to puzzle_state */
  export let puzzle : number[]

  let tmp : number[] | undefined
  let state_str = ""
  let edit_error = ""

  $: if (is_editting && !tmp) tmp = puzzle
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

    if (arr.some(x => x < 0 || x >= tmp.length)) {
      edit_error = "Integers beyond puzzle bounds. Please change puzzle size in options."
    }
    puzzle = arr
  }
  function save_changes() {
    if (puzzle.length != tmp.length) {
      edit_error = "Please enter integers from 0 to " + (tmp.length-1)
      return
    }
    if (!puzzle_is_solvable(puzzle)) {
      edit_error = "Puzzle is not solvable"
      return
    }
    tmp = undefined
    is_editting = false
  }
  function remove_changes() {
    puzzle = tmp
    tmp = undefined
    is_editting = false
  }
</script>

<button on:click={save_changes} class="btn btn-primary">Save</button>
<button on:click={remove_changes} class="btn btn-primary">Cancel</button>
<p>Input the puzzle as integers seperated by space. Use 0 as the empty tile.</p>
<input type="text" bind:value={state_str}/>
<p>{edit_error}</p>
