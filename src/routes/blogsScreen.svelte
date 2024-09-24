<script lang="ts">
import type { Post } from '$lib/types/blog.d.ts'

let posts : Post[] = [] 
fetch('/api/blogs').then(async res => {
  posts = await res.json()
})
</script>

<div class="p-4 w-full h-full flex flex-col justify-center items-center text-center gap-4">
  <h3 class="text-3xl font-bold"> ✒️ Blogs ✒️ </h3>

  <p>These also act as documentation of my process in making some of my projects</p>
  <ul class="flex flex-col gap-4">
    {#each posts as blog}
      <li>
        <a href="/blogs/{blog.slug}">
          <h4 class="text-xl font-semibold">{blog.title}</h4>
          <p>{blog.publishedDate}</p>
        </a>
        <p>{blog.description}</p>
      </li>
    {/each}

  </ul>
</div>
