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

