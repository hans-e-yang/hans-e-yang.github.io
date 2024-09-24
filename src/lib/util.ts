/** Shuffles the array in place */
export function shuffle<T>(arr: Array<T>) {
  // fisher yates shuffle
  for (let i = arr.length-1; i >= 1; i--) {
    let r = Math.floor((i+1) * Math.random())
    ;[arr[i], arr[r]] = [arr[r], arr[i]]
  }
}

/** Returns a string copy with the characters at index a and b swapped */
export function stringSwap(str: string, a: number, b: number) {
  let arr = str.split('')
  ;[arr[a], arr[b]] = [arr[b], arr[a]]
  return arr.join('')
}

export function debounce(func: CallableFunction, interval: number) {
  if (!func) return 
  let timer : number

  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(()=> func(...args), interval)
  }
}
