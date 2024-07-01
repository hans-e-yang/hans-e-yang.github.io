/** Defines the type of a search problem. T represents the type of the state */
export type SearchProblem<T> = {
  start_state: T,
  is_end: (state: T) => boolean,
  succ_and_cost: (state: T) => 
    {next_state: T, cost: number}[]
}

export type SearchSuccess<State> = {
  success: true
  route: State[],
  total_cost: number
}

export type SearchFailure = {
  success: false
}

/** Type that should be returned by search algorithms */
export type SearchResult<T> = SearchSuccess<T> | SearchFailure
