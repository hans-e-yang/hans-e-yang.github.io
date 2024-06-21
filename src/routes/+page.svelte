<script>
  import { fade } from "svelte/transition";
	import { tweened } from "svelte/motion";
	import { cubicInOut } from "svelte/easing";
  import HelloScreen from "./HelloScreen.svelte";
  import AboutMeScreen from "./aboutMeScreen.svelte"
  import Blogs from "./blogs.svelte";

  const screens = [
    {component: HelloScreen, name: "Greetings"},
    {component: AboutMeScreen, name: "About Me"},
    {component: Blogs, name: "Blogs"},
  ]

  let active_screen_id = 0

  let progress_bar_value = tweened(0, {easing: cubicInOut})
  const progress_bar_value_scale = 100
  $: $progress_bar_value = active_screen_id * progress_bar_value_scale
</script>

<div class="h-screen w-screen flex flex-col">
  <!-- Screens -->
  {#key active_screen_id}
    <div class="h-full w-full grow absolute" transition:fade>
      <svelte:component this={screens[active_screen_id].component} />
    </div>
  {/key}

  <!-- Navigation -->
  <nav class="h-[10vh] w-full px-4 pb-8 absolute bottom-0 z-10">

    <input type="range" 
      on:change={(e) => {
        //@ts-ignore
        progress_bar_value.set(Number(e.target.value || 0), {duration: 0})
        // A bit of duplicated logic here but okay..
        $progress_bar_value = active_screen_id * progress_bar_value_scale
      }}
      value={$progress_bar_value} 
      min="0" 
      max="{(screens.length - 1) * progress_bar_value_scale}" 
      step="1" 
      class="w-full accent-primary h-2 rounded-full "  />

    <!-- buttons -->
    <div class="flex justify-between">
      {#each screens as {name}, id }
        <button on:click={() => {active_screen_id = id}}>
          {name}
        </button>
      {/each}
    </div>
  </nav>

</div>

