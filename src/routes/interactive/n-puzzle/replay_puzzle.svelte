<script lang="ts">
  export let puzzle : number[]
  
  export let solution : number[][]
  let solution_index = 0
  $: puzzle = solution[solution_index]
</script>

<div class="flex gap-2 ">
  <button class="btn btn-primary" 
    on:click={()=> {if (solution_index > 0) solution_index--}}>
    Prev
  </button>
  <input type="range" min={0} max={solution.length -1} bind:value={solution_index}/>
  <button class="btn btn-primary"
    on:click={() => {if (solution_index < solution.length -1) solution_index++}}
  >Next</button>
</div>

