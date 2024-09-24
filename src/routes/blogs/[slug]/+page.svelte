<script>
  import './blog.scss'

  export let data
  const { title, description, projectLinks, publishedDate, lastUpdate, content } = data

  // console.log(content.matchAll(/[<h2.*>].*[</h2>]/g))

</script>

<nav class="p-4">
  <a href="/#blogs" class="btn btn-primary text-text no-underline">Back</a>
  <a href="#title" class="fixed bottom-2 right-2 bg-bg btn btn-primary">Back to top</a>
</nav>

<header class="text-center p-8">
  <h1 id="title" class="font-bold text-3xl">{title}</h1>
  <p>{publishedDate}</p>
  {#if lastUpdate}
    <p>Last updated at: {lastUpdate}</p>
  {/if}
  <hr class="my-8">

  {#if projectLinks}
    <h3 class="font-semibold text-xl">Access this through</h3>
    <div class="flex flex-col items-center gap-2">
      {#each projectLinks as link}
        {#if link.url}
          <a class="link link-primary" href="{link.url}">{link.name}</a>
        {:else if link.tag}
          {@html link.tag}
        {/if}

      {/each}
    </div>
  {/if}
</header>

<main id="blog" class="flex flex-col items-center text-justify p-8 blog max-w-5xl w-full mx-auto">
  <svelte:component this={content} />
</main>



