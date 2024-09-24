---
title: Genetic Algorithm on Flappy Birds
publishedDate: 4 March 2024
lastUpdate: 9 August 2024
published: true
description: Implementing genetic algorithm to a Flappy Birds game made in Godot.
projectLinks:
  - name: Github
    url: https://github.com/hans-e-yang/Flappy-Bird-with-Genetic-Algorithm
  - tag: <iframe frameborder="0" src="https://itch.io/embed/2556808?linkback=true" width="208" height="167"><a href="https://hanseyang.itch.io/ml-flappy-birds">ML Flappy Birds by Hanseyang</a></iframe>

---

## Contents

## Introduction

I became interested in the concepts of AI when 
[a series of lectures from Stanford's CS 221 programme][Lecture Series]
popped up in my Youtube recommendations. It covers a lot of concepts
in artificial intelligence and provides many examples and live or semi-live coding 
in their lectures. Their [Github website][Lecture Github]
has many theory and coding exercises in Python, which is very useful to
understand the material further.

After watching several videos and being inspired by [CodeBullet][],
I became interested in making a flappy bird clone that plays itself. 

I made the whole project in [Godot][], a free, opensouce, and 
extremely lightweight game engine. Python would perhaps be a better alternative
as the language is often used for AI projects, thanks to the many libraries it
has, including: numpy, pandas, and PyTorch. I chose Godot just for the sake of
learning Godot.

I will model the decision making of the birds with a linear classifier
and use a [genetic algorithm][]
to train the model, with the amount of pipes
each bird survives as the fitness score.

Just to quickly summarize how the genetic algorithm works, 
we first randomly initialize the first generation. Then we 
will test each of the individuals to get a score/fitness value. 
We will then randomly select individuals to breed and generate the 
individuals for the next generation. We can then add some mutations 
to further add variation. This process roughly simulates biological 
evolution and natural selection.

First of all, for the game, you could find godot tutorials on the web. Many of them will teach how to code flappy bird since it is a simple yet popular game. This is what my game looks like.


## Modifying the birds

Instead of having the player control the bird when to jump, it will
calculate when to jump based on some weights, which will be a list of floats.

```gdscript
# bird.gd
func _physics_process(_delta: float) -> void:
    if (Input.is_action_just_pressed("jump")):
        linear_velocity.y = jumpPower
```

```gdscript
# bird.gd
...
var weights = [0, 0]

func should_jump() -> bool:
    var value := signf(
        weights[0] * (Data.nextPipePosition.x - global_position.x) +
        weights[1] * (Data.nextPipePosition.y - global_position.y)
    )
    return (value == 1)

func _physics_process(_delta: float) -> void:
    if (should_jump()):
        linear_velocity.y = jumpPower
```
bird.gd before and after


In the `should_jump` function, I used a simple linear classifier for the decision making.
However, the bird needs information about its environment before it can make decisions.
In the code example, I provide it through a [Singleton][]
in *data.gd*.

```gdscript
# data.gd
extends Node2D

var pipeQueue : Array[Pipe] = []

var nextPipePosition := Vector2(1200, 300)

func _physics_process(delta: float) -> void:
  if (pipeQueue.size() > 0):
    # I assumes bird is at x = 100
    # Ignore the pipe when it passes the birds 
    # as it is no longer relevant
    if (pipeQueue[0].global_position.x < 100):
      pipeQueue.pop_front()
      nextPipePosition = pipeQueue[0].global_position

func queuePipe(pipe: Pipe):
  pipeQueue.push_back(pipe)
```
data.gd

```gdscript
# pipeSpawner.gd
func spawn_pipe() -> void:
  var pipe = Pipe.instantiate()
  add_child(pipe)

  # Queue the pipes into Data
  Data.queuePipe(pipe)    

  # Setup the pipes
  pipe.speed = pipeSpeed
  pipe.position.y += randf_range(-200, 200)
```
pipeSpawner.gd

Personally, I feel this is not as authentic as each bird having a raycast
so they can individually perceive the environment. However, since 
each bird is facing the same pipes and they are located in the same x-axis,
it feels rather unnecessary wasting resources doing so 
compared to using a singleton. 


## Generating the population

Now I start working on the Trainer class, which runs the genetic algorithm.
The class will do the following things:
1. Initialize the birds
2. Test the birds in the game
3. Select the ones with the best result
4. *Breed* them to create the next generation
5. Introduce random mutations

I begin by initializing the birds.


```gdscript
class_name Trainer
extends Node2D

# Emit when all birds have died
signal generation_ended

# Emit when the next generation has been created
signal next_generation_ready

@onready var bird := preload("res://Player/Bird.tscn")

# Length of the each weight in the weights array
var length := 2

# Amount of birds to spawn
var generation_size := 500

# Array containing the weights of each bird
var weights_arr := []


# Stores a weight and its score
class Result:
  var score: int
  var weights: Array[float]

  func _init(_score: int, _weights: Array[float]):
    score = _score
    weights = _weights

# Results from each bird
var results : Array[Result] = []
```
trainer.gd

The trainer will act as the parent of the birds. It will spawn every bird
and give it weights from the weights_arr. 


```gdscript
# trainer.gd
func initialize_weights() -> void:
  # For each bird, initialize the weights
  for i in range(generation_size):
    # Initialize weights between -10 and 10
    var weights : Array[float] = []
    for j in range(length):
      weights.push_back(rand_range(-10, 10))

  weights_arr.push_back(weights)


# Instantiate all the birds
func prepare_next_generation() -> void:
  # Prepare the weights
  if weights.size() == 0:
    initialize_weights()
  else:
    # We will define this method later
    calculate_next_generation_weights()

  # Reset the results
  results = []

  # Spawn each bird and assign them the weights
  for weights in weights_arr: 
    var child : Bird = bird.instantiate()
    child.weights = weights
    add_child.call_deferred(child)

  next_generation_ready.emit()
```
trainer.gd

Here, i used `call_deferred` to defer the execution of `add_child`. I 
encountered some errors when directly calling `add_child`, possibly because
too much children are added at once. So this should help alleviate the problem.

Also, here I didn't change anything about the position of the bird in the script
when instantiated, relying instead on the default positions of the Trainer and Bird
scene. You may want to change it according to your needs.

One possible optimization here is to do [object pooling][Object Pooling] where
instead of instantiating new birds every generation, we could store all birds
in one array and just reset its state every generation, thereby removing the
cost of repeatedly instantiating and removing the bird.


## Testing the population

The `prepare_next_generation` function in trainer.gd will be called by 
`main.gd`, which will control the whole game.

```gdscript
# main.gd
@onready var trainer := $Trainer
@onready var pipeSpawner := $PipeSpawner


func _ready() -> void:
  # Start the trainer directly
  # Alternatively, we may also trigger this on a button click
  trainer.prepare_next_generation()

  # Connect the signals
  trainer.next_generation_ready.connect(start_training)
  trainer.generation_ended.connect(generation_ended)


func start_training() -> void:
  Events.start_generation.emit()
  UiEvents.next_generation.emit()

  pipeSpawner.start()


func generation_ended() -> void: 
  Events.end_generation.emit()
  pipeSpawner.end()

  # Directly continue to the next generation
  # Alternatively, we may also wait until further user input before continuing
  trainer.prepare_next_generation()
```
main.gd

We connect the signals in `trainer` to functions that trigger the 
environment, like starting or stopping the `pipeSpawner`. 
Here, `Events` and `UiEvents` are simply autoloaded
scripts / singleton classes that act as signal hubs, allowing 
every node to listen to it.

Below, I make the bird listen to the `Events.start_generation` 
signal to start moving to ensure every bird starts at the same moment.
I also made the pipes remove itself when `Events.start_generation` 
is emitted.

```gdscript
# bird.gd
func _ready() -> void:
  set_deferred("freeze", true)

  # Add CONNECT_ONE_SHOT flag to automatically disconnect signal
  Events.start_generation.connect(
    func():
      set_deferred("freeze", false),
    CONNECT_ONE_SHOT
  )
```
bird.gd


## Gathering the results

The birds will attempt to survive with the weights (genetic code) 
given to them by the `trainer`, passing through pipes and earning
their scores/fitness value along the way. 

When the birds die, it needs to pass the data back into the 
`trainer` so that it may generate the next generation. 
I achieve this by following a common rule of thumb, 
[Call down, signal up][signal up].

```gdscript
# bird.gd
...
signal died(score: int, weights: Array[float])
...
func _on_body_entered(body: Node) -> void:
  if body is Pipe:
    # Emit the score and weights
    # Your Flappy Bird game should have its mechanism of
    # earning points when passing through pipes.
    died.emit(score, weights)
    queue_free()
```
bird.gd

```gdscript
# trainer.gd
func prepare_next_generation() -> void:
  # Reset the results
  results = []

  # Spawn the generation
  for weight in weights:
    var child : Bird = bird.instantiate()
    child.weights = weight

    # New line
    # Listen when the bird dies
    child.died.connect(record_bird, CONNECT_ONE_SHOT) 

    add_child.call_deferred(child)

  next_generation_ready.emit()
```

```gdscript
# trainer.gd
# Save results from the birds
func record_bird(score: int, weights: Array[float]):
  var result := Result.new(score, weights)
  results.push_back(result)

  if results.size() >= generation_size:
    generation_ended.emit()
```
trainer.gd

The bird emits a `died` signal while passing the score and 
its weights, which its parent, the `trainer` listens to. When
all birds are dead, the `trainer` will emit `generation_ended`.

An unintended but nice consequence of this approach is that
the results array will be sorted by their time alive, which corresponds
to their score. 


## The Genetic Algorithm

Now we use the genetic algorithm to create the next generation, learning from
the results of the previous generation. The general code will be placed in the
`calculate_next_generation_weights` function.

```gdscript
# trainer.gd
func calculate_next_generation_weights() -> void:
  weights = []

  # Elitism. Keeps the top 5% best achiever, at least keeps 1 of the best.
  # Prevents good genes from dissapearing due to bad luck.
  # Improves exploitation in exchange to exploration.
  for i in range(1, generation_size * 5/100 + 2):
    # Results are already sorted by their score
    weights.push_back(results[-i].weights)

  # Regenerate the rest of the population
  while weights.size() < generation_size:
    # The bulk of the genetic algorithm pretty much runs in this one line
    var child = mutate(breed(select(), select()))
    weights.push_back(child)
```
trainer.gd

First, I introduce *elitism*, which in genetic algorithm refers to the
practice of keeping some of the best performing individuals to prevent
good genes from dissapearing due to bad luck. After that, the rest of the 
population will be generated with genetic algorithm, which consists of
selection, breeding, and mutation.

### Selection

```gdscript
# trainer.gd
# Tournament selection
func select() -> Array[float]:
  var tournament_size : int = generation_size * 0.05
  const selection_p = .8
  var parent : Result

  for i in range(tournament_size):
    var potential_parent = results[randi_range(0, results.size()-1)]
    if (not parent or (potential_parent.score > parent.score and randf() < selection_p)):
      parent = potential_parent

    return parent.weights
```
trainer.gd - Select suitable parents for the next generation

There are various methods to select a suitable parent. The one I chose is tournament
selection. It works by randomly choosing `tournament_size` amount of individuals,
then choosing the fittest among them all. To add more exploration into the algorithm,
we add a `selection_p` probability that the individual with the higher score will be chosen.
Hence, the lesser fit ones still has a chance to pass on their *genes*.

`tournament_size` and `selection_p` are parameters that can and should be 
adapted based on individual cases. Most of these parameters are adjusted to 
balance between exploration and exploitation, to maintain a diverse population 
while also keeping the best individuals.


### Crossover
```gdscript
# trainer.gd
func breed(parentA: Array[float], parentB: Array[float]) -> Array[float]:
	var length = min(parentA.size(), parentB.size())
	var child : Array[float] = []
	for i in range(parentA.size()):
		var scaling_factor = randf_range(-0.25, 1.25)
		var new_gene = parentA[i]*scaling_factor + parentB[i]*(1-scaling_factor)
		child.push_back(new_gene)

	return child
```
trainer.gd - Intermediate recombination

In this step, we mix the *genes* (weights) from the 2 parents. Since our 
gene representation is real and continuous variables, I used [intermediate recombination][]
for the crossover method which generates the child's values by doing a linear
interpolation between the values from both parents.

### Mutation
Lastly, we add mutation to introduce more randomness into our program.
For now, I will just implement a simple uniform mutation.
```gdscript
# trainer.gd
# Mutation algorithm, modifies the weights in place
func mutate(weights: Array) -> Array:
    # Chance of mutation occuring
    var mutation_chance := 1/length
    # How much change the mutation will bring
    const mutation_limit := 0.1

    var new_weights = []

    for i in range(length):
        if randf() > mutation_chance:
            new_weights.push_back(
              weights[i] + randf_range(-mutation_limit, mutation_limit)
            )
    return new_weights
```
trainer.gd - mutation

It would be better if the mutation can be more flexible, perhaps
changing the mutation chance or amount as time goes on, or maybe mutate it relative
to the value of the weight, but this will suffice for now.


## The End Result

<video src="/blogs/flappy-birds-godot/Gameplay 1.mp4" controls />

Flappy Birds with Machine Learning

Great! It seems to work, maybe.. 👍

Although, after looking at it and running it multiple times, 
I find the bird's behaviour to be weird. It always jumps before 
encountering the pipe hole, which makes sense, but when it is between the pipes, 
it almost always seems to jump again, nearly hitting the top pipe. 
Why does it behave like so?

It turns out to be the bird's decision making.

```gdscript
# bird.gd
...
var weights = [0, 0]

func should_jump() -> bool:
    var value := signf(
        weights[0] * (Data.nextPipePosition.x - global_position.x) +
        weights[1] * (Data.nextPipePosition.y - global_position.y)
    )
    return (value == 1)
```

Bird.gd - linear classification decision making

Because the birds can only make decisions based on the x and y distance to the 
next pipe, it basically only jumps based on a line with slope -weights[0]/weights[1] passing through
the center of the pipes.

![Decision line passing through the middle of the pipes.](/blogs/flappy-birds-godot/bird-decision-making.png)

Illustration of the bird's decision making

The line always has to pass through the middle of the pipes because that 
is the origin (we determine x and y based on the center of the pipes). 
The linear equation is missing a constant value that enables 
it to not have to always pass the origin.

So all the training we have been doing is spinning the line around the origin
to determine the best slope. Also, because the line always has to pass through the 
middle of the pipes, the birds in the previous video always tries to jump while being 
in the middle of the pipes.

I'll slightly fix this part like so.

```gdscript
# bird.gd
...
var weights = [0, 0, 0]

func should_jump() -> bool:
    var value := signf(
        weights[0] * (Data.nextPipePosition.x - global_position.x) +
        weights[1] * (Data.nextPipePosition.y - global_position.y) + 
        weights[2]
    )
    return (value == 1)
```

Slightly improved decision making

After this change, this is what the game looks like.

<video src="/blogs/flappy-birds-godot/Gameplay 2.mp4" controls/>

<br /> 

Now, the bird's movements should look better compared to the last. 
However, we can still vaguely observe the decision line of the birds. 
That should tell you that the machine learning algorithm here is very very very basic.
Most of the best birds are due to better decision lines and a lot of luck, since if 
the bird lands on the decision line too late, they will hit the pipe regardless.
We can improve the model by increasing the amount of features, 
for example the linear velocity of the bird.

I have added more features and a basic customization screen on the game, 
which you can try on itch.io.

Anyways, this would be the end of this post.

Thanks for reading till the end. 👍



[Lecture Series]: https://www.youtube.com/watch?v=UuEqUN98uZo
[Lecture Github]: https://www.youtube.com/watch?v=UuEqUN98uZo
[CodeBullet]: https://www.youtube.com/@CodeBullet
[Godot]: https://www.youtube.com/watch?v=UuEqUN98uZo
[Genetic Algorithm]: https://www.youtube.com/watch?v=UuEqUN98uZo
[Object Pooling]: https://www.youtube.com/watch?v=UuEqUN98uZo
[Singleton]: https://www.youtube.com/watch?v=UuEqUN98uZo
[Signal up]: https://kidscancode.org/godot_recipes/4.x/basics/node_communication/index.html
[Tournament Selection]: https://en.wikipedia.org/wiki/Tournament_selection
[Intermediate Recombination]: http://www.geatbx.com/docu/algindex-03.html#P568_30685
