<script>
const things = [
  {name: "A* Pathfinding", description: "A* Pathfinding animation on a grid. ", slug: "astar", date: "24 June 2024"}
]
</script>

<div class="p-4 w-full h-full flex flex-col justify-center items-center text-center gap-4">
  <h3 class="text-3xl font-bold">👇 Interactive Stuff 👇</h3>

  <ul class="flex flex-col gap-4">
    {#each things as thing}
      <li>
        <a href="/interactive/{thing.slug}">
          <h4 class="text-xl font-semibold">{thing.name}</h4>
          <p>{thing.date}</p>
        </a>
        <p>{thing.description}</p>
      </li>
    {/each}

  </ul>
</div>
