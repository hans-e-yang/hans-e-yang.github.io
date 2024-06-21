<script>
  const blogs = [
    {
      title: "Course Commenting Fullstack Web App Tutorial",
      date: "19 April 2024",
      description: `
        A Fullstack JS Web App tutorial using ReactJS, ExpressJS, and SQLite,
        whose purpose is to demonstrate the relationship between the backend, frontend, and database.
      `,
      url: "/blogs/course-commenting-app" 
    },
    {
      title: "Genetic Algorithm on Flappy Birds",
      date: "4 March 2024",
      description: `Implementing genetic algorithm to a Flappy Birds game made in godot.`,
      url: "/blogs/genetic-flappy-bird" 
    }
  ]
</script>

<div class="p-4 w-full h-full bg-secondary flex flex-col justify-center items-center text-center gap-4">
  <h3 class="text-3xl font-bold"> ✒️ Blogs ✒️ </h3>

  <p>These also act as documentation of my process in making some of my projects</p>
  <ul class="flex flex-col gap-4">
    {#each blogs as blog}
      <li>
        <a href="{blog.url}">
          <h4 class="text-xl font-semibold">{blog.title}</h4>
          <p>{blog.date}</p>
        </a>
        <p>{blog.description}</p>
      </li>
    {/each}

  </ul>
</div>
