const xs = require('xstream').default

module.exports = function makeFunctionsDriver(context, inArgs, dispwrap) {
  const log = (...a) => context.log(...a)

  function driver(s$) {
    s$.addListener({ next: (i) => { setTimeout(() => {  // next tick to allow other listenerns to be iterated
                                        context.res = i
                                        if (dispwrap &&
                                          typeof dispwrap.disposer === 'function') {
                                          dispwrap.disposer()
                                        }
                                        context.done()
                                      }, 1)
                      },
                      error: () => {},
                      complete: () => {}
    })

    const stream = xs.createWithMemory({
      start: listener => {
        setTimeout(() => {listener.next({context, inArgs})}, 1)
      },
      stop: () => {},
    })
    stream.log = log
    return stream
  }

  driver.log = log
  return driver
}
