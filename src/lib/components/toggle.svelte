<script lang="ts">
  export let checked = false

  export let color : "primary" | "secondary" = "primary"

  let theme = {
    "primary": "after:bg-primary after:border-primary before:bg-primary border-primary",
    "secondary": "after:bg-secondary after:border-secondary before:bg-secondary border-secondary"
  }

</script>

<label class="w-12 inline-block h-6 rounded-full border-2 relative transition-all overflow-hidden

  after:aspect-square after:border after:scale-110 before:scale-110
  after:left-0 after:top-0 after:h-full
  
  before:inset-0 

  {theme[color]}

  {checked ? 
  'after:left-full after:!bg-bg after:-translate-x-full '
  : 'before:-translate-x-full'}">
  <input class="w-0 h-0 absolute" type="checkbox" bind:checked={checked}/>
</label>

<style>
label::after, label::before {
  content: "";
  position: absolute;
  transition: all 200ms ease-in-out;
  border-radius: 9999px;
}
</style>
