<script>
import { tweened } from "svelte/motion";
import { cubicOut, quadInOut } from "svelte/easing";
import { onMount } from "svelte";

const hellos = [
  "Hello",
  "Hola",
  "Bonjour",
  "Guten Tag",
  "Ciao",
  "Olá",
  "Привет",
  "こんにちは",
  "你好",
  "안녕하세요",
  "مرحبا",
  "नमस्ते",
  "Hujambo",
  "Merhaba",
  "Sawubona",
  "Selamat pagi",
  "Salam",
  "Hej",
  "Dia duit",
  "Salut",
  "Tere",
  "Ahoj",
  "Dobrý den",
  "Zdravo",
  "Hallå",
  "Marhaba",
  "Xin chào",
  "Szia",
  "Góðan dag",
  "Sveiki",
  "Buna ziua",
  "Dzień dobry",
  "Habari",
  "Shalom",
  "Privyet",
  "Namaste",
  "Kamusta",
  "Sain baina uu",
  "Sawatdee",
  "Hallo",
  "Nǐ hǎo",
  "γειά σου",
  "God dag",
  "Gamarjoba",
  "Aloha",
  "Shwmae",
  "Salve",
  "Saluton",
  "Kumusta",
  "Labas",
  "Goddag",
  "Privet",
  "Namaskar",
  "Chào",
  "Hei",
  "Dobrý deň",
  "Kia ora",
  "Hoi",
  "Moïen",
];

let previous_hello_text = "Hello"
let hello_text = hellos[Math.floor(Math.random() * hellos.length)]  

let progress = tweened(0, {easing: quadInOut, duration: 1000})

$: offset = $progress % 1

// Detect when spring has stop interpolating
let checkpoint = 0
$: if (checkpoint + 1 <= $progress) {
  checkpoint++
  previous_hello_text = hello_text
  hello_text = hellos[Math.floor(Math.random() * hellos.length)]
}

// Start the changing text
onMount(()=> {
  setInterval(()=> {
    if (document && !document.hidden) {
      $progress++
    }
  }, 2500)
})
</script>

<div class="w-full h-20 overflow-hidden text-center relative text-nowrap">
  <div class="absolute w-full h-full" style="transform: translate(0, {100 * offset}%)">
    <strong class="select-none top-[-100%]" aria-hidden="true">{hello_text}</strong>
    <strong>{previous_hello_text}</strong>
  </div>
</div>


<style>
strong {
  @apply absolute w-full h-full flex items-center justify-center text-5xl font-medium;
}
</style>
