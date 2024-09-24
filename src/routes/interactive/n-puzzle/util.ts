/** Determines if the n-puzzle is solvable. arr.length should be a square number, otherwise undefined behaviour */
export function puzzle_is_solvable(arr: number[]) {
  let grid_size = Math.sqrt(arr.length)
  // Count the inversions
  let inversions = 0
  let new_arr = arr.filter(x => x)
  for (let i = 0; i < grid_size**2-1; i++) {
    for (let j = i+1; j < grid_size**2; j++) {
      if (new_arr[i] > new_arr[j]) inversions++
    }
  }
  // Different formulas for odd and even n puzzles
  if (grid_size % 2 == 1) {
    return inversions % 2 == 0
  } else {
    let blank_row = Math.floor(arr.indexOf(0) / grid_size)
    return (inversions + blank_row) % 2 == 1
  }
}
