import type { SearchProblem, SearchResult } from "./types"
import { runGenerator, type RunGeneratorOptions, PriorityQueue} from "./util"

type AstarYield<State> = [known_added: State|undefined, frontier_added: State[]]

/** Customized Astar implementation that yields state added to known and frontier on every iteration. onDone callback passes the results of the search. */
export function* AstarSearchGenerator<State>(
  search_problem: SearchProblem<State>,
  heuristic: (state: State) => number,
  hash: (state: State) => number | string = JSON.stringify
) {
  type Node = {
    prev_state: State | undefined,
    total_cost: number,
    heuristic: number,
    state: State
  }
  // Initializing the required data structures
  let known: Map<string|number, Omit<Node, "state">> = new Map()
  let frontier = PriorityQueue((a: Node, b: Node) =>
    a.total_cost + a.heuristic < b.total_cost + b.heuristic)

  // Insert starting state to frontier
  frontier.insert({
    prev_state: undefined, 
    state: search_problem.start_state,
    total_cost: 0, 
    heuristic: heuristic(search_problem.start_state)
  })

  /** Count amount of states searched */
  let iterations = 0
  /** The current state investigated */
  let nearest
  /** Value to yield */
  let yieldVal: AstarTYield<State>

  while (frontier.length() > 0) {
    yieldVal = [undefined, []]
    iterations++

    // Get the nearest reachable and unique state
    do {
      nearest = frontier.popMin()
    } while (nearest && known.has(hash(nearest.state)))
    // If no more routes to explore, end.
    if (!nearest) break

    // Add the nearest state to known
    known.set(hash(nearest.state), {
      total_cost: nearest.total_cost,
      prev_state: nearest.prev_state,
      heuristic: nearest.heuristic
    })
    // End state reached
    if (search_problem.is_end(nearest.state)) break

    yieldVal[0] = nearest.state

    // Get possible next states from the current nearest state and add it to the frontier
    for (const { next_state, cost } of search_problem.succ_and_cost(nearest.state)) {
      if (known.has(hash(next_state))) continue
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
  // No solution
  if (!nearest) {
    return { success: false } as SearchResult<State>
  }

  // Traverse the 'linked list' of states and get the whole route into an array
  let route = []
  let routeNode: State | undefined = nearest.state
  while (routeNode) {
    route.push(routeNode)
    routeNode = known.get(hash(routeNode))?.prev_state
  }
  route.reverse()

  return {
    success: true,
    route,
    total_cost: nearest.total_cost,
    iterations
  } as SearchResult<State>
}


type AstarOptions<State> = RunGeneratorOptions & {
  on_progress?: (_: AstarYield<State>) => void,
  hash?: (state: State) => number | string
}
/** Solves the given search problem using the Astar Algorithm.
 *
 * on_progress is called everytime Astar searches a new state.
 * on_progress is passed the following parameter
 * - arr:
 * - - [0]: The current state searched | The new known
 * - - [1]: The unique successors from current state | The frontiers added
 */
export function Astar<State>(
  search_problem: SearchProblem<State>,
  heuristic: (state: State) => number,
  options?: AstarOptions<State>
) {
  const promise : Promise<SearchResult<State>> = new Promise((resolve, reject) => {
    if (options?.signal?.aborted)
      reject(options.signal.reason)
    const generator = AstarSearchGenerator(search_problem, heuristic, options?.hash || JSON.stringify)

    runGenerator(generator, options?.on_progress, x=>resolve(x), options)

    if (options?.signal) {
      options.signal.addEventListener("abort", () => {
        reject(options.signal?.reason)
      }, {once: true})
    }
  })
  return promise
}
