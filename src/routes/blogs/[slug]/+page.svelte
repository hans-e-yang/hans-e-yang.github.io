<script>
  export let data
  const { title, date, content } = data
</script>

<article class="flex flex-col items-center gap-4 p-4">
  <h1 class="text-3xl">{title}</h1>
  <p>Published on: {date}</p>
  <svelte:component this={content} />
</article>
