export type RunGeneratorOptions = {
  yields_per_interval?: number,
  interval?: number,
  signal?: AbortSignal
}

/**
 * Runs a generator with setInterval. 
 * Calls on_yield when generator yields and on_return when generator returns.
 *
 * Manage behaviour with options.
 * The setInterval can be cancelled by passing an AbortSignal in 
 * options.signal.
 */
export function runGenerator<T, TReturn, TNext>(
  generator: Generator<T, TReturn, TNext>,
  on_yield?: (_: T) => void,
  on_return?: (_: TReturn) => void,
  options: RunGeneratorOptions =  {}
) {
  let yields = options.yields_per_interval || 1000

  let id = setInterval(() =>{
    for (let i = 0; i < yields; i++) {
      let {value, done} = generator.next()
      if (done) { 
        // Value is guranteed to be TReturn, perhaps unless generator.return() is called
        if (on_return) on_return(value as TReturn)
        clearInterval(id)
        break
      }
      if (on_yield) on_yield(value as T)
    }
  }, options.interval || 10)

  // Enable cancelling
  if (options.signal) {
    function onabort() {clearInterval(id)}
    options.signal.addEventListener("abort", onabort, {once: true})
  }

}

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
