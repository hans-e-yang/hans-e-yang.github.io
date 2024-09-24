<script>
  import { fade } from "svelte/transition";
	import { tweened } from "svelte/motion";
	import { cubicInOut } from "svelte/easing";

  import HelloScreen from "./HelloScreen.svelte";
  import AboutMeScreen from "./aboutMeScreen.svelte";
  import BlogsScreen from "./blogsScreen.svelte";
  import InteractiveScreen from "./interactiveScreen.svelte";
	import { onMount } from "svelte";

  const screens = [
    {component: HelloScreen, name: "Greetings"},
    {component: AboutMeScreen, name: "About Me"},
    {component: BlogsScreen, name: "Blogs"},
    {component: InteractiveScreen, name: "Interactive"}
  ]

  let active_screen_id = 0
  $: screen = screens[active_screen_id]

  let progress_bar_value = tweened(0, {easing: cubicInOut})
  const progress_bar_value_scale = 100
  $: $progress_bar_value = active_screen_id * progress_bar_value_scale
  

  // Automatically traverse to proper screen
  onMount(() => {
    const id = window.location.href.split('#')[1].toLowerCase()
    for (let i = 0; i < screens.length; i++) {
      if (screens[i].name.replace(/\s+/g, '').toLowerCase() == id) {
        active_screen_id = i
        break
      }
    }
  })
</script>

<div class="h-screen w-screen flex flex-col">
  <!-- Navigation -->
  <nav class="h-[10vh] w-full px-4 pb-8 absolute bottom-0 z-10">
    <!-- No mobile -->
    <input type="range" 
      on:change={(e) => {
        //@ts-ignore
        progress_bar_value.set(Number(e.target.value || 0), {duration: 0})
        // A bit of duplicated logic here but okay..
        active_screen_id = Math.round(e.target.value / progress_bar_value_scale)
        $progress_bar_value = active_screen_id * progress_bar_value_scale
      }}
      value={$progress_bar_value} 
      min="0" 
      max="{(screens.length - 1) * progress_bar_value_scale}" 
      step="1" 
      class="w-full accent-primary h-2 rounded-full hidden sm:block"/>

    <!-- buttons -->
    <!-- No mobile -->
    <div class="items-start justify-between sm:flex hidden pt-4">
      {#each screens as {name}, id }
        <button class="btn btn-primary " on:click={() => {active_screen_id = id}}>
          {name}
        </button>
      {/each}
    </div>

    <!-- Mobile nav -->
    <div class="flex justify-between sm:hidden">
      <button class="btn btn-primary" 
        disabled={active_screen_id == 0}
        on:click={() => active_screen_id--}>
        Previous
      </button>

      <p>{screen.name}</p>

      <button class="btn btn-primary" 
        disabled={active_screen_id == screens.length - 1}
        on:click={()=> active_screen_id++}>
        Next
      </button>
    </div>
  </nav>


  <!-- Screens -->
  {#key active_screen_id}
    <div class="h-full w-full grow absolute" transition:fade>
      <svelte:component this={screen.component} />
    </div>
  {/key}


</div>

