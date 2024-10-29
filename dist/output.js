; (function (modules) { 
  const installedModules = {}
  function __webale_require(moduleId) {
    if (installedModules[moduleId]) {
      return installedModules[moduleId].exports
    }
    const func = modules[moduleId]
    const module = (installedModules[moduleId] = {
      i: moduleId,
      l: false,
      exports: {},
    })
    func.call(module.exports, module, module.exports, __webale_require)
    const result = module.exports
    installedModules[moduleId].l = true
    return result
  }

	return  __webale_require("/Users/anker/Documents/knowledge/build-my-own-x/micro-webpack/src/index.js")})({"/Users/anker/Documents/knowledge/build-my-own-x/micro-webpack/src/index.js":function(module,exports,_webale_require){
 eval(`const datas = _webale_require("/Users/anker/Documents/knowledge/build-my-own-x/micro-webpack/src/data.js")

const maths = _webale_require("/Users/anker/Documents/knowledge/build-my-own-x/micro-webpack/src/math.js")

console.log(maths.add(...datas.addData))

console.log(maths.subtract(...datas.subtractData))

console.log(maths.pow(...datas.powData))
`)},"/Users/anker/Documents/knowledge/build-my-own-x/micro-webpack/src/data.js":function(module,exports,_webale_require){
 eval(`const addData = [2, 2]

const subtractData = [5, 3]

const powData = [2, 3]

module.exports = {
  addData,
  subtractData,
  powData,
}
`)},"/Users/anker/Documents/knowledge/build-my-own-x/micro-webpack/src/math.js":function(module,exports,_webale_require){
 eval(`const add = (a, b) => a + b

const subtract = (a, b) => a - b

const pow = (num, cover) => Math.pow(num, cover)

module.exports = {
  add,
  subtract,
  pow,
}
`)},})