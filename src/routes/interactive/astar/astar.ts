// Not the best use case for closures, i guess?


/**
 * A priority queue implementation that uses min/max heap.
 * Accepts a function to determine prioritization, where pop min will return the optimal lhs.
 */
export function PriorityQueue<T>(lhsIsPrioritizedIf = (lhs: T, rhs: T) => lhs<rhs) {
  var arr : T[] = [];
  function parent(i: number) { return Math.floor((i - 1) / 2); }
  function left(i: number) { return 2 * i + 1; }
  function right(i: number) { return 2 * i + 2; }
  function minHeapify(i: number) {
    var _a;
    var n = arr.length;
    if (n === 1) {
      return;
    }
    var l = left(i);
    var r = right(i);
    var smallest = i;
    if (l < n && lhsIsPrioritizedIf(arr[l], arr[i])) {
      smallest = l;
    }
    if (r < n && lhsIsPrioritizedIf(arr[r], arr[smallest])) {
      smallest = r;
    }
    if (smallest !== i) {
      _a = [arr[smallest], arr[i]], arr[i] = _a[0], arr[smallest] = _a[1];
      minHeapify(smallest);
    }
  }
  return {
    /** Returns the length of the queue
         */
    length: () => arr.length,
    /** Empties the queue
         */
    clear: () => {arr = []},
    /** Looks at the most prioritized item in the queue
         */
    getMin: function () { return arr[0]; },
    /** Removes and returns the most prioritized item in the queue
         */
    popMin: function () {
      if (arr.length <= 1) {
        return arr.pop();
      }

      // Store the minimum value and remove from heap
      // Move the last item forwards
      ;[arr[0], arr[arr.length - 1]] = [arr[arr.length - 1], arr[0]]
      var res = arr.pop();
      // Heapify
      minHeapify(0);
      return res;
    },
    /** Inserts an item into the queue
         */
    insert: function (item: T) {
      var _a;
      arr.push(item);
      // Fix min heap if property is violated
      var i = arr.length - 1;
      while (i > 0 && lhsIsPrioritizedIf(arr[i], arr[parent(i)])) {
        var p = parent(i);
        _a = [arr[p], arr[i]], arr[i] = _a[0], arr[p] = _a[1];
        i = p;
      }
    }
  };
}


/** Searches through a series of possible states 
 * 
 * Configure the states by setting the start and end states, and providing the
 * proper actions that a state can take.
 * 
 * Is similar to Uniform Cost Search, however has heuristics, meaning that it has a goal
 * in sight while searching, focusing its search scope to those that has a positive impact towards
 * its goals.
 */
export function Astar<State>(
  actionsAndCost: (state: State) => {state: State, cost: number}[],
  heuristic: (state: State, target_state: State) => number
) {
  type Action = {
    totalCost: number,
    prevState: State | undefined,
    state: State,
    heuristic: number
  }
  let startingState : State | undefined = undefined
  let targetState : State | undefined = undefined

  let known = new Map<State, Omit<Action, "state">>()
  let route : State[] = []

  let totalCost = 0
  let frontier = PriorityQueue<Action>(
    // The heuristic is an estimate of the future cost
    // Total cost is the adjusted total cost by the heuristic
    // (lhs, rhs) => lhs.totalCost + lhs.heuristic < rhs.totalCost + rhs.heuristic
    (lhs, rhs) => lhs.totalCost < rhs.totalCost 
    )
  function searchRoute() {
    if (startingState == undefined || targetState == undefined) return
    // Reset all known info
    known.clear()
    frontier.clear()
    route = []

    let searches = 0
    // Add startingState
    frontier.insert({
      state: startingState, 
      prevState: undefined, 
      totalCost: 0, 
      heuristic: heuristic(startingState, targetState)
    })

    let nearest;
    // While there is something to explore
    while (frontier.length() != 0) {
      // Get the nearest unknown
      do {
        nearest = frontier.popMin()
      } while (nearest && known.has(nearest.state))
      if (!nearest) break

      // Append nearest into the known
      known.set(nearest.state, {
        totalCost: nearest.totalCost,
        prevState: nearest.prevState,
        heuristic: nearest.heuristic
      })
      // Stop if the nearest state is found
      if (nearest.state == targetState) break

      // Append all actions into the frontier
      for (const action of actionsAndCost(nearest.state)) {
        if (known.has(action.state)) continue
        let h = heuristic(action.state, targetState)
        frontier.insert({
          // total cost, adjusted for the heuristic
          totalCost: nearest.totalCost + action.cost + h - nearest.heuristic,
          prevState: nearest.state,
          state: action.state,
          heuristic: h 
        })
        searches++
      }
    }

    // Traverse the 'linked list' and get the whole into a stack
    if (!nearest) return
    let routeNode = nearest.state
    while (routeNode) {
      // Route.at(0) = end. Route.at(-1) = start.
      route.push(routeNode)
      // @ts-ignore
      routeNode = known.get(routeNode)?.prevState
    }

    totalCost = nearest.totalCost + 
      (known.get(startingState)?.heuristic || 0)

  }

  function* searchRouteGenerator() {
    if (!(startingState && targetState)) return
    // Reset all known info
    known.clear()
    frontier.clear()
    route = []

    // Add startingState
    frontier.insert({state: startingState, prevState: undefined, totalCost: 0, heuristic: heuristic(startingState, targetState)})

    let nearest
    let yieldVal : [State | undefined, State[]]
    // While there is something to explore
    while (frontier.length() != 0) {
      yieldVal = [undefined, []]

      // Get the nearest unknown
      do {
        nearest = frontier.popMin()
      } while (nearest && known.has(nearest.state))
      if (!nearest) break

      // Append nearest into the known
      known.set(nearest.state, {
        totalCost: nearest.totalCost,
        prevState: nearest.prevState,
        heuristic: nearest.heuristic
      })
      yieldVal[0] = nearest.state


      // Stop if the nearest state is found
      if (nearest.state == targetState) break

      // Append all actions into the frontier
      for (const action of actionsAndCost(nearest.state)) {
        if (known.has(action.state)) continue
        let h = heuristic(action.state, targetState)
        frontier.insert({
          totalCost: nearest.totalCost + action.cost + h - nearest.heuristic,
          prevState: nearest.state,
          state: action.state,
          heuristic: h
        })
        yieldVal[1].push(action.state)
      }

      yield yieldVal
    }

    // Traverse the 'linked list' and get the whole into a stack
    if (!nearest) return
    let routeNode = nearest.state
    while (known.has(routeNode)) {
      route.push(routeNode)
      // @ts-ignore
      routeNode = known.get(routeNode).prevState
    }
    totalCost = nearest.totalCost + 
      (known.get(startingState)?.heuristic || 0)
  }

  return {
    setStartState: (state: State) => startingState = state,
    setEndState: (state: State) => targetState = state,

    /** Does the searching and saves the results.
         * 
         * 
         * If valid start and end states, searches the possible states and returns 
         * returns the optimal state path from the end to the start
         */
    searchRoute,
    /** Does the searching, saves the results, while also returning the found knowns and frontiers everytime 'next()' is called.
         * 
         * Allows for animation
         * 
         * If valid start and end states, searches the possible states and returns 
         * returns the optimal state path from the end to the start
         */
    searchRouteGenerator,
    /** Doesn't search the states, only returns saved data from previous search
         * 
         * Gets all the known states whose optimal path is known.
         * Represented as a map. Provides the totalCost needed to reach the state
         * as well as the optimal previous state
         */
    getKnown: () => known,
    /** Doesn't search the states, only returns saved data from previous search
         * 
         * Gets all the states discovered, but not yet figured the optimal path.
         * Represented as a PriorityQueue.
         */
    getFrontier: () => frontier,
    /** Doesn't search the states, only returns saved data from previous search
         * 
         * Returns the route from the end to the start state as an array of states.
         */
    getRoute: () => route,
    getTotalCost: () => totalCost
  }
} 

/** Abstraction to provide easier grid drawings.
 * Uses discrete tile coordinates, with (0, 0) being the top left
 * 
 * Accepts a div Element. The div Element should contain nothing. 
 * Canvases will be appended into the div as child and will be as large as the div.
 * @param {HTMLDivElement} div - Parent Container of the grid 
 */
export function gridView(div: HTMLElement) {
  div.style.position = "relative"
  const bg = document.createElement("canvas")
  bg.style.position = "absolute"
  const fg = document.createElement("canvas")
  fg.style.position = "absolute"
  const bgctx = bg.getContext("2d")
  const ctx = fg.getContext("2d")

  if (!ctx || !bgctx) {
    console.error("Unable to access canvas context!")
  }
  div.appendChild(bg)
  div.appendChild(fg)

  let tileSize = 30
  let dimensions = {x: 0, y: 0}

  /** Clears all the tiles in the grid. 
     * 
     * Doesn't remove the grid lines.
     */
  function clear() {
    ctx?.clearRect(0, 0, fg.clientWidth, fg.clientHeight)
  }

  /** Resize the canvas to the size of the parent div element.
     * 
     * Updates the grid lines and clears the canvas.
     */
  function resizeCanvas() {
    bg.width = div.clientWidth
    fg.width = div.clientWidth
    bg.height = div.clientHeight
    fg.height = div.clientHeight
    updateGridLines()
  }

  /** Updates the tileSize.
     * 
     * Updates the grid lines and clears the canvas.
     */
  function setTileSize(newTileSize: number) {
    tileSize = newTileSize
    updateGridLines()
  }

  function updateGridLines() {
    clear()

    dimensions.x = Math.trunc(div.clientWidth / tileSize)
    dimensions.y = Math.trunc(div.clientHeight / tileSize)

    // Draw the Vertical lines
    bgctx?.clearRect(0, 0, bg.clientWidth, bg.clientHeight)
    bgctx?.beginPath()
    for (let x = 0; x <= dimensions.x * tileSize; x += tileSize) {
      bgctx?.moveTo(x, 0)
      bgctx?.lineTo(x, dimensions.y*tileSize)
    }
    for (let y = 0; y <= dimensions.y * tileSize; y += tileSize) {
      bgctx?.moveTo(0, y)
      bgctx?.lineTo(dimensions.x*tileSize, y)
    }
    bgctx?.stroke()
  }

  /** Draws a tile in the x, y tile position.
     */
  function drawTile(x: number, y: number, color: string) {
    if (!validTile(x, y)) return
    if (!ctx) return
    ctx.fillStyle = color
    ctx.fillRect(x*tileSize, y*tileSize, tileSize, tileSize)
  }

  /** Erases a tile in the x, y tile position.
     */
  function eraseTile(x: number, y: number) {
    if (!validTile(x, y)) return
    if (!ctx) return
    ctx.clearRect(x*tileSize, y*tileSize, tileSize, tileSize)
  }

  /** Checks if tile coordinates is inside the grid.
     */
  function validTile(x: number, y: number) {
    return (
      (0 <= x && x < dimensions.x) &&
        (0 <= y && y < dimensions.y)
    )
  }

  /** Transforms canvas pixel coordinates into tile coordinates, returned as [tileX, tileY].
     */
  function canvasToTileCoordinates(x: number, y: number): [number, number] {
    return [
      Math.trunc(x / tileSize),
      Math.trunc(y / tileSize)
    ]
  }

  resizeCanvas()

  return {
    clear,
    resizeCanvas,
    setTileSize,
    dimensions,
    drawTile,
    eraseTile,
    validTile,
    bgCanvas: bg,
    fgCanvas: fg,
    canvasToTileCoordinates
  }	
}

/** Extension to gridView that allows user interaction.
 * 
 * Everytime the mouse is down and passes through another tile, calls the onDraw()
 * function.
 */
export function drawableGrid(div: HTMLElement) {
  const grid = gridView(div)

  let oldTile : [number, number] = [-1, -1]
  let isPenDown = false
  let c = grid.fgCanvas
  type onDrawFunc = (_: [number, number], _2: [number, number]) => void
  let _onDraw : onDrawFunc = (_, _2) => {}

  function getCoords(ev: Event) : [number, number] {
    if (ev.type.startsWith('touch')) {
      return [
        //@ts-ignore
        ev.touches[0].pageX - c.clientLeft,
        //@ts-ignore
        ev.touches[0].pageY - (c.getBoundingClientRect().top + window.scrollY)
      ]
    }
    if (ev.type.startsWith('mouse')) {
      return [
        (ev as MouseEvent).offsetX,
        (ev as MouseEvent).offsetY
      ]
    }

    return [-1, -1]
  }
  const penDown = (ev: Event) => {
    if (isPenDown) return
    isPenDown = true
    let newTile = grid.canvasToTileCoordinates(...getCoords(ev))
    _onDraw(oldTile, newTile)
    oldTile = newTile
  }
  const penMove = (ev: Event) => {
    ev.preventDefault()
    if (!isPenDown) return
    let newTile = grid.canvasToTileCoordinates(...getCoords(ev))
    if (newTile[0] !== oldTile[0] || 
      newTile[1] !== oldTile[1]) {
      _onDraw(oldTile, newTile)
      oldTile = newTile
    }
  }
  c.addEventListener("mousedown", penDown) 
  c.addEventListener("mouseup", () => isPenDown = false)
  c.addEventListener("mouseleave", () => isPenDown = false)
  c.addEventListener("mousemove", penMove)


  c.addEventListener("touchstart", penDown) 
  c.addEventListener("touchend", () => isPenDown = false)
  c.addEventListener("touchcancel", () => isPenDown = false)
  c.addEventListener("touchmove", penMove)

  return {
    ...grid,
    onDraw: (func: onDrawFunc) => _onDraw = func
  }

}


/** Extension to drawableGrid that also connects to the search algorithm
 * allows set options to draw.
*/
export function visualizeSearch(div: HTMLElement) {
  type Coord = [number, number]
  let start : Coord = [0, 0]
  let end : Coord = [5, 5]
  const walls = new Map()
  let heuristicWeight = 1

  type GridDrawOptions = "Start" | "End" | "Wall" | "RemoveWall" 
  let option : GridDrawOptions = "Start"
  let colors = {
    start: "black",
    end: "green",
    wall: "purple",
    frontier: "blue",
    known: "brown",
    route: "red"
  }

  // Coordinates to string and vice versa
  function encode(coordinates: Coord) {
    return coordinates.join('/')
  }

  function decode(coordStr: String): Coord {
    // @ts-ignore
    return coordStr.split('/').map(x=>parseInt(x))
  }


  // Possible movement options for each tile
  let movements : [Coord, number][] = [
    [[1, 0], 10],
    [[0, 1], 10],
    [[-1, 0], 10], 
    [[0, -1], 10],
    [[1, 1], 14],
    [[-1, -1], 14],
    [[1, -1], 14],
    [[-1, 1], 14]
  ]
  let movementLimit = 4

  // Configuring the AStar Algorithm
  function getActionsAndCost(state: string) {
    let currentPos = decode(state)
    

    const actions = []
    for (let i = 0; i < movementLimit; i++) {
      const [thing, cost] = movements[i]
      const nextCoords : Coord = [currentPos[0]+thing[0], currentPos[1]+thing[1]]
      if (grid.validTile(...nextCoords) && !walls.has(encode(nextCoords))) {
        actions.push({
          state: encode(nextCoords),
          cost
        })
      }
    }
    return actions
  }
  function heuristic(state: string, target: string) {
    let _state = decode(state)
    let _target = decode(target)
    return Math.trunc(distanceMethod(_state, _target) * 10 * heuristicWeight)
  }

  type DistanceMethod = (from: Coord, to: Coord) => number
  const manhattanDistance : DistanceMethod = (from, to) => (Math.abs(from[0]-to[0]) + Math.abs(from[1]-to[1]))
  const euclideanDistance : DistanceMethod = (from, to) => (Math.sqrt((from[0]-to[0])**2 + (from[1]-to[1])**2))
  let distanceMethod = manhattanDistance

  const astar = Astar(getActionsAndCost, heuristic)

  // Initializing grid and allow drawing of the different tile types
  const grid = drawableGrid(div)
  grid.onDraw((oldTile, newTile) => {
    switch (option) {
      case "Start":
        grid.eraseTile(...start)
        start = newTile
        grid.drawTile(...start, colors.start)
        break
      case "End":
        grid.eraseTile(...end)
        end = newTile
        grid.drawTile(...end, colors.end)
        break
      case "Wall":
        if (newTile[0] == start[0] && newTile[1] == start[1]) return
        if (newTile[0] == end[0] && newTile[1] == end[1]) return
        walls.set(encode(newTile), true)
        grid.drawTile(...newTile, colors.wall)
        break
      case "RemoveWall":
        if (walls.delete(encode(newTile))){
          grid.eraseTile(...newTile)
        }
    }
  })

  // Overloading grid setTileSize. Changes grid coordinates
  function setTileSize(tileSize: number) {
    grid.clear()
    grid.setTileSize(tileSize)
    if (!grid.validTile(...start)) start = [0, 0]
    if (!grid.validTile(...end)) end = [grid.dimensions.x, grid.dimensions.y]
    draw()
  }

  /** Starts the path finding algorithm. Redraws the whole canvas grid. */
  function startPathFinding() {
    astar.setStartState(encode(start))
    astar.setEndState(encode(end))
    astar.searchRoute()
    let route = astar.getRoute().slice(1, -1)

    draw()
    for (const test of route) {
      const [x, y] = decode(test)
      grid.drawTile(x, y, colors.route)
    }
  }

  // Animated version of the previous function
  let intervalId = 0
  function animatePathFinding(delay = 200, onAnimateFinished = (totalCost: number) => {}) {
    // Stop Animation only works when called during animation run
    astar.setStartState(encode(start))
    astar.setEndState(encode(end))

    draw()
    const generator = astar.searchRouteGenerator()

    intervalId = setInterval(() => {
      const {value} = generator.next()
      if (value) {
        const [known, frontiers] = value
        grid.drawTile(...decode(known || "-1/-1"), colors.known)
        for (const frontier of frontiers) {
          grid.drawTile(...decode(frontier), colors.frontier)
        }
        grid.drawTile(...start, colors.start)
        grid.drawTile(...end, colors.end)

      } else {

        clearInterval(intervalId)
        onAnimateFinished(astar.getTotalCost())
        
        for (const route of astar.getRoute().slice(1, -1)) {
          grid.drawTile(...decode(route), colors.route)
        }
        return
      }

    }, delay)
  }

  function draw() {
    grid.clear()
    grid.drawTile(...start, colors.start)
    grid.drawTile(...end, colors.end)
    for (const wall of walls.keys()) {
      grid.drawTile(...decode(wall), colors.wall)
    }
  }

  draw()

  return {
    ...grid,
    startPathFinding,
    animatePathFinding,
    draw,
    /** Set Drawing mode of the grid */
    setOption: (mode: GridDrawOptions) => option = mode,
    setColors: (newColors: Object) =>{
      colors = {
        ...colors,
        ...newColors
      }
    },
    setTileSize,
    setHeuristicWeight: (weight: number) => {
      heuristicWeight = weight
    },
    setMovementType: (type: "4way" | "8way") => {
      switch (type) {
        case "4way":
          movementLimit = 4
          break
        case "8way":
          movementLimit = 8
      }
    },
    setDistanceMethod: (type: "manhattan" | "euclid") => {
      switch (type) {
        case "manhattan":
          distanceMethod = manhattanDistance
          break
        case "euclid":
          distanceMethod = euclideanDistance
          break
      }
    },
    stopAnimation: () => {clearInterval(intervalId)}
  }
}

