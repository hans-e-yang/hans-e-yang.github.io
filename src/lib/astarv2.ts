import { PriorityQueue } from './astar'

export type SearchProblem<T> = {
  start_state: T,
  is_end: (state: T) => boolean,
  succAndCost: (state: T) => 
    {next_state: T, cost: number}[]
}

type SearchSuccess<State> = {
  success: true
  route: State[],
  total_cost: number
}

type SearchFailure = {
  success: false
}

export type SearchResult<State> = SearchSuccess<State> | SearchFailure

/** Used when yielded values from AstarSearchGenerator is not needed and search wants to be done synchronously. Personally, I would suggest using the async version as it wouldn't hang the whole tab if the search requires a lot of time. */
export function AstarSearch<State>(search_problem: SearchProblem<State>, heuristic: (_: State) => number) {
  let result : SearchResult<State>
  let generator = AstarSearchGenerator(search_problem, heuristic, x => result = x)
  for (const _ of generator) continue;
  //@ts-ignore
  return result
}

/** Customized Astar implementation that yields state added to known and frontier on every iteration. onDone callback passes the results of the search. */
export function* AstarSearchGenerator<State>(
  search_problem: SearchProblem<State>,
  heuristic: (state: State) => number,
  onDone = (_: SearchResult<State>) => {}
) {
  type Node = {
    prev_state: State | undefined,
    total_cost: number,
    heuristic: number,
    state: State
  }
  let known: Map<string, Omit<Node, "state">> = new Map()
  let frontier = PriorityQueue((a: Node, b: Node) => 
    a.total_cost + a.heuristic < b.total_cost + b.heuristic)

  // Insert starting state to frontier
  frontier.insert({
    prev_state: undefined, state: search_problem.start_state,
    total_cost: 0, heuristic: heuristic(search_problem.start_state)
  })

  /** Count amount of states searched */
  let iterations = 0
  /** The current state investigated */
  let nearest
  /** Value to yield */
  let yieldVal : [knownAdded: State | undefined, FrontierAdded: State[]]

  while (frontier.length() > 0) {
    yieldVal = [undefined, []]
    iterations++
    // Get the nearest unknown
    do {
      nearest = frontier.popMin()
    } while (nearest && known.has(JSON.stringify(nearest.state)))
    // If no more routes to explore, end.
    if (!nearest) break

    // Nearest route found, add to known map
    known.set(JSON.stringify(nearest.state), {
      total_cost: nearest.total_cost,
      prev_state: nearest.prev_state,
      heuristic: nearest.heuristic
    })
    if (search_problem.is_end(nearest.state)) break
    yieldVal[0] = nearest.state

    // Get possible next states from the current nearest state and add to the frontier
    for (const {next_state, cost} of search_problem.succAndCost(nearest.state)) {
        if (known.has(JSON.stringify(next_state))) continue
        let h = heuristic(next_state)
        frontier.insert({
          total_cost: nearest.total_cost + cost,
          prev_state: nearest.state,
          state: next_state,
          heuristic: h
        })
        yieldVal[1].push(next_state)
    }

    yield yieldVal
  }

  if (nearest) {
    // Traverse the 'linked list' of states and get the whole route into an array
    let route = []
    let routeNode : State | undefined = nearest.state
    while (routeNode) {
      route.push(routeNode)
      routeNode = known.get(JSON.stringify(routeNode))?.prev_state
    }
    route.reverse()
    onDone({
      success: true,
      route,
      total_cost: nearest.total_cost,
      iterations
    })
  } else {
    onDone({success: false})
  }
}

/** Used when yielded values from AstarSearchGenerator is not needed but wants to execute the algorithm asynchronously */
export function AstarSearchAsync<State>(
  search_problem: SearchProblem<State>,
  heuristic: (state: State) => number,
  iterations_per_cycle = 1000,
  ms_per_cycle = 10
) {
  const promise : Promise<SearchResult<State>> = new Promise((resolve, reject) => {
    const generator = AstarSearchGenerator(search_problem, heuristic, x => resolve(x))
    let i = setInterval(() => {
      for (let i = 0; i < iterations_per_cycle-1; i++) generator.next();
      const {done} = generator.next()
      if (done) {
        clearInterval(i)
      }
    }, ms_per_cycle)
  })
  return promise
}

export async function IDAstarAsync<State>(
  search_problem: SearchProblem<State>,
  heuristic: (state: State) => number,
  iterations_per_cycle = 1000,
  ms_per_cycle = 10
) : Promise<SearchResult<State>> {
  let threshold = heuristic(search_problem.start_state)

  while (true) {
    let p : Promise<IDAType<State>> = new Promise((res, rej) => {
      let result: any
      let generator = DAstarSearch(search_problem, heuristic, threshold, res => result = res)

      let i = setInterval(()=>{
        for (let i = 0; i < iterations_per_cycle; i++) generator.next()
        if (generator.next().done) {
          res(result)
          clearInterval(i)
        }
      }, ms_per_cycle)
    })
    let result = await p
    if (result.success) return result
    if (result.min == Infinity) return {success: false}
    console.log(threshold)
    threshold = result.min
  }
}

// If min == Infinity, no possible solution
type IDAType<State> = SearchResult<State> | (SearchFailure & {min: number})

// Search all states while cost + heuristic <= threshold
// Returns the minimal next f value
function* DAstarSearch<State>(
  search_problem: SearchProblem<State>,
  heuristic: (state: State) => number,
  threshold: number,
  onDone = (_: IDAType<State>) => {}
) {
  let path = [{
    state: search_problem.start_state,
    succ: search_problem.succAndCost(search_problem.start_state),
    total_cost: 0
  }]

  let path_check = [JSON.stringify(search_problem.start_state)]

  let min = Infinity
  yield path

  let result

  while (path.length > 0) {
    yield
    let current = path.at(-1)!
    // Found the target state
    if (search_problem.is_end(current.state)) {
      result =  {
        success: true as true,
        route: path.map(x => x.state),
        total_cost: current.total_cost
      }
      break
    }

    let f = current.total_cost + heuristic(current.state)
    if (f > threshold) {
      min = (f < min) ? f : min
      path.pop()
      path_check.pop()
      continue
    }

    // Traverse the successors in the current state
    let successor = current.succ.pop()
    // If no more successors, remove the current state
    if (!successor) {
      path.pop()
      path_check.pop()
      continue
    }

    // Pop the successor to the path
    path.push({
      state: successor.next_state,
      total_cost: current.total_cost + successor.cost,
      succ: search_problem.succAndCost(successor.next_state)
        // Only include successors not in current path
        .filter(({next_state}) => 
          path_check.indexOf(JSON.stringify(next_state)) == -1 )
    })
    path_check.push(JSON.stringify(successor.next_state))
  }

  if (result)
    onDone(result)
  else 
    onDone({
      success: false,
      min
    })
}
