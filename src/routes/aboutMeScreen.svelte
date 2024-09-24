<script>
  const contacts = [
    {link: "mailto:Hanseyang@outlook.com", text: "Hanseyang@outlook.com"},
    {link: "https://wa.me/85251083889", text: "+852 5108 3889"},
    {link: "https://github.com/hans-e-yang", text: "hans-e-yang"}
  ]

</script>
<div class="h-full w-full p-12 flex flex-col gap-6">
  <h1 class="text-3xl font-bold">About Me</h1>  
  <p>
    My name is Hans Yang. I am a second-year undergraduate student in CityU 
    majoring in Computer Science. 
  </p>

  <h2 class="text-2xl font-semibold"> Contacts: </h2>
  <ul class="pl-4 list-disc">
    {#each contacts as {link, text}}
      <li><a href={link} class="link link-primary">{text}</a></li>
    {/each}
  </ul>

</div>
