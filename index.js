const xs = require('xstream').default
const run = require('@cycle/xstream-run').run
const makeHTTPDriver = require('@cycle/http').makeHTTPDriver
const makeFunctionsDriver = require('./functionsDriver.js')

function main(sources) {
  const log = sources.FaaS.log

  const input$ = sources.FaaS
    .map((s) => `context.req.originalUrl: ${s.context.req.originalUrl} /
                inArgs[0]: ${JSON.stringify(s.inArgs[0])}`)

  const ticks$ = xs.periodic(1000)
    .map(t => (t + 1) * 100)

  const log$ = xs.merge(input$, ticks$)

  const trigger$ = ticks$
    .drop(2)
    .debug((i) => log(`trigger tick: ${i}`))

  const request$ = trigger$
    .map(() => ({
                  url: 'http://jsonplaceholder.typicode.com/users/1',
                  method: 'GET'
                }))

  const response$ = sources.HTTP
    .select()
    .flatten()
  const user1Data$ = response$.map(response => response.body)
  const exit$ = user1Data$
    .map(u => ({ status: 200, body: u}))

  return {
    FaaS: exit$,
    log: log$,
    HTTP: request$
  }
}

module.exports = function (context, ...inArgs) {
  const dispwrap = {}             // because JS doesn't do pass-by-ref
  const functionsDriver = makeFunctionsDriver(context, inArgs, dispwrap)

  const drivers = {
    FaaS: functionsDriver,
    HTTP: makeHTTPDriver(),
    log: msg$ => { msg$.addListener({next: msg => logger(`${msg}`) }) }
  }

  dispwrap.disposer = run(main, drivers)

}
