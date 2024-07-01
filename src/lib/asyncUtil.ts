type PromiseCallback<T> = (resolve: (value: T) => void, reject: (reason?: any) => void) => void

/** A promise that allows for cancellation */
class CancellablePromise<T> extends Promise<T> {
  constructor(executor: 
    (res: (value: T) => void, 
      reject: (reason?: any) => void, 
      onCancel: () => void) 
    => void) 
  {
    super((res, rej) => {
      executor(res, rej, )
    })
  }
}

export 
