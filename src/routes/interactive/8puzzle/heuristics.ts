// Functions here assume:
// - target_state is number[]
// - Values are between 0 and n**2-1
// - All values are unique

/** target_state:
  * - [position] => tile_value
  *
  * Returned array:
  * - [tile_value] => position
  */
function target_to_indexes(target_state: number[]) {
  return target_state.map((_, i) => target_state.indexOf(i))
}

export function manhattan(target_state: number[]) {
  let grid_size = Math.sqrt(target_state.length)
  function distance_between_idx(a: number, b: number) {
    let x1 = a % grid_size
    let y1 = Math.floor(a / grid_size)
    let x2 = b % grid_size
    let y2 = Math.floor(b / grid_size)
    return Math.abs(x1-x2) + Math.abs(y1-y2)
  }
  const target_positions = target_to_indexes(target_state)
  return (state: number[]) => 
    state.reduce((totalVal, num, pos) => {
      if (num == 0) return totalVal
      return totalVal + distance_between_idx(pos, target_positions[num])
    }, 0)
}

export function manhattan_cached(target_state: number[]) {
  let grid_size = Math.sqrt(target_state.length)
  function d(a: number, b: number) {
    let x1 = a % grid_size
    let y1 = Math.floor(a / grid_size)
    let x2 = b % grid_size
    let y2 = Math.floor(b / grid_size)
    return Math.abs(x1-x2) + Math.abs(y1-y2)
  }

  const target_positions = target_to_indexes(target_state)
  // Distances[tile_value-1][pos] = manhattan distance to target
  const distances = [] as number[][]

  for (let tile_value = 1; tile_value < grid_size**2; tile_value++) {
    let _distances = [] as number[]
    let index = target_positions[tile_value]

    for (let pos = 0; pos < grid_size **2 ; pos++) {
      _distances.push(d(pos, index))
    }
    distances.push(_distances)
  }

  return (state: number[]) =>
      state.reduce((totalVal, num, pos) => {
      if (num == 0) return totalVal
      return totalVal + distances[num-1][pos]
    }, 0)
}

// grid_size is unused here, but added so function signatures match
export function misplaced_tiles(target_state: number[]) {
  return (state: number[]) => 
      state.filter((x, i) => x != target_state[i]).length
}

/** Unlike the other heuristics, the implementation for this only supports target_state where tile_values are in order from 1 to N, ending with 0.
 * Example: 8puzzle = [1,2,3,4,5,6,7,8,0]
 * 15puzzle = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,0]
 * Therefore it takes target state only to determine grid_size.
 * This implementation also stores an internal cache so it speeds up for subsequent searches.
 */
export function linear_conflict(target_state: number[]) {
  let grid_size = Math.sqrt(target_state.length)

  let cache = new Map<string, number>()
  
  function get_rows_cols(state: number[]) {
    let arr = []
    // Get rows
    for (let y = 0; y < grid_size; y++){
      let row = [] as number[]
      for (let x = 0; x < grid_size; x++) {
        // Only get the ones that should be in the row
        let i = y * grid_size + x
        if (y*grid_size < state[i] && state[i] <= (y+1)*grid_size)
          row.push(state[i])
      }
      arr.push(row)
    }
    // Get cols
    for (let x = 0; x < grid_size; x++) {
      let col = [] as number[]
      for (let y = 0; y < grid_size; y++) {
        let i = y * grid_size + x
        if ((state[i]-1)%grid_size === x)
          col.push(state[i])
      }
      arr.push(col)
    }
    return arr
  }

  function lc(line: number[]) {
    if (line.length <= 1) return 0

    let str = line.join(',')
    if (cache.has(str)) return cache.get(str) as number

    function C(val: number, idx: number) {
      let c = 0
      for (let i = 0; i < line.length; i++)
        // Conflicts if value is larger but index is smaller or vice versa
        if (val > line[i] !== idx > i)
          c++
      return c
    }
    let max_id = -1
    let max = 0
    for (let i = 0; i < line.length; i++) {
      let c = C(line[i], i)
      if (c > max) {
        max = c
        max_id = i
      }
    }
    if (max == 0) return 0
    line.splice(max_id, 1)
    let val : number = lc(line) + 1
    cache.set(str, val)
    return val
  }
  let m = manhattan(target_state)


  return (state: number[]) => 
    get_rows_cols(state).reduce((tot, cur) => tot + lc(cur), 0)*2
    + m(state)
}
