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

