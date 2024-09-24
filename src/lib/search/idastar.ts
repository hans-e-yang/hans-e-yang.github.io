import type { SearchProblem, SearchResult, SearchFailure, SearchSuccess} from "./types"
import { runGenerator, type RunGeneratorOptions} from "./util"

type IDAstarOptions<State> = RunGeneratorOptions & {
  on_progress?: (_: DAstarYield<State>) => void,
  on_iteration_done?: (threshold: number) => void,
  hash?: (_: State) => number | string
}

export async function IDAstar<State>(
  search_problem: SearchProblem<State>,
  heuristic: (state: State) => number,
  options?: IDAstarOptions<State>
) : Promise<SearchResult<State>> {

  let threshold = heuristic(search_problem.start_state)

  // Iterative deepening
  while (true) {
    let p : Promise<DAstarReturn<State>> = new Promise((res, rej) => {
      if (options?.signal?.aborted) 
        rej(options.signal.reason)

      let generator = DAstarSearch(search_problem, heuristic, threshold, options?.hash || JSON.stringify)
      runGenerator(generator, options?.on_progress, x => res(x),options)
      
      if (options?.signal)
        options.signal.addEventListener("abort", 
          () => rej(options.signal?.reason), {once: true}
        )
    })
    // If aborted, p will throw the error resulting in this function ending
    let result = await p
    if (result.success) return result
    if (result.min == Infinity) return {success: false}
    if (options?.on_iteration_done)
      options.on_iteration_done(threshold)
    threshold = result.min
  }
}

// If min == Infinity, no possible solution
type DAstarReturn<State> = SearchSuccess<State> | (SearchFailure & {min: number})
type DAstarYield<State> = [path_added: State, path_removed: State[]]

// Does one iteration of IDAstar
// Search all states while cost + heuristic <= threshold
// Returns the minimal next f value
function* DAstarSearch<State>(
  search_problem: SearchProblem<State>,
  heuristic: (state: State) => number,
  threshold: number,
  hash: (state: State) => number | string = JSON.stringify
) : Generator<DAstarYield<State>, DAstarReturn<State>, unknown>
{
  let path = [{
    state: search_problem.start_state,
    succ: search_problem.succ_and_cost(search_problem.start_state),
    total_cost: 0
  }]

  let path_check = [hash(search_problem.start_state)]

  let min = Infinity
  yield [path[0].state, []]

  let removed_path = []
  while (path.length > 0) {
    let current = path.at(-1)!

    // Check if Fscore has passed threshold
    let f = current.total_cost + heuristic(current.state)
    if (f > threshold) {
      min = (f < min) ? f : min
      // Guranteed to return, since the loop only runs while path has a node
      // Add popped state to yield
      removed_path.push(path.pop()!.state)
      path_check.pop()
      continue
    }

    // Found the target state
    if (search_problem.is_end(current.state)) {
      return {
        success: true as true,
        route: path.map(x => x.state),
        total_cost: current.total_cost
      }
    }

    // This mimics recursion, I suppose.
    // Traverse the successors in the current state
    let successor = current.succ.pop()
    // If no more successors, remove the current state
    if (!successor) {
      path_check.pop()
      removed_path.push(path.pop()!.state)
      continue
    }

    // Pop the successor to the path
    path.push({
      state: successor.next_state,
      total_cost: current.total_cost + successor.cost,
      succ: search_problem.succ_and_cost(successor.next_state)
        // Only include successors not in current path
        .filter(({next_state}) => 
          path_check.indexOf(hash(next_state)) == -1 )
    })
    path_check.push(hash(successor.next_state))
    yield [successor.next_state, removed_path]
    removed_path = []
  }

  return {
    success: false,
    min
  }
}
