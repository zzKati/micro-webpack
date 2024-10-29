import cac from "cac"
import fs, { write } from "fs"
import path from "path"
import acorn from "acorn"

interface webaleOptions {
  entry: string
  output: string
  mode: "production" | "development"
  watch: boolean
}

let curPath = __dirname
let rootDir = path.dirname(curPath)

let configFile
try {
  configFile = require(path.resolve(curPath, "webale.config.js"))
} catch {
  try {
    curPath += "/../"
    configFile = require(path.resolve(curPath, "webale.config.js"))
  } catch {}
}

const defaultConfig: webaleOptions = {
  entry: path.resolve(rootDir, "src/index.js"),
  mode: "development",
  output: path.resolve(rootDir, "dist/output.js"),
  watch: false,
}

const cli = cac("webale")

// cli.option("--mode <mode>", "Choose a mode", {
//   default: "development",
// })
// cli.option("--watch", "Choose is watching the file", {
//   default: false,
// })

cli.option("--mode <mode>", "Choose a mode")
cli.option("--watch", "Choose is watching the file")
cli.option("--entry <path>", "config the entry file")
cli.option("--output <path>", "config the output dir")

const option = cli.parse().options

delete option["--"]

if (configFile) {
  for (const key in configFile) {
    if (configFile.hasOwnProperty(key)) {
      if (key === "entry" || key === "output") {
        configFile[key] = path.resolve(rootDir, configFile[key])
      }
    }
  }
}

const config = {
  ...defaultConfig,
  ...(configFile ? configFile : {}),
  ...option,
}

// watch--false development
async function main() {
  const moduleMap: Record<string, string> = {}

  // 构建依赖关系
  async function analyseDepend(curPath: string) {
    if (moduleMap[curPath]) return

    // 读取文件内容
    const sourceCode = await fs.readFileSync(curPath, { encoding: "utf-8" })

    // 通过正则匹配 loaders ->  交给 loader 处理

    // 进行 ast 语法分析
    const astTree = acorn.parse(sourceCode, { ecmaVersion: "latest" })

    // 找到当前模块的依赖
    const findAllRequire = (currentPath: string, node: acorn.AnyNode) => {
      if (
        node.type === "CallExpression" &&
        node.callee.type === "Identifier" &&
        node.callee.name === "require" &&
        node.arguments.length === 1 &&
        node.arguments[0].type === "Literal"
      ) {
        let value = node.arguments[0].value?.toString()
        let realPath

        if (value?.startsWith(".")) {
          const length = node.arguments[0].value?.toString().split(".").length
          if (length && length > 2) {
            realPath = node.arguments[0].value?.toString()
          } else {
            realPath = node.arguments[0].value?.toString() + ".js"
          }
          dependences.push(path.resolve(path.dirname(currentPath), realPath!))
        } else {
          realPath = value
          dependences.push(path.resolve(rootDir, `node_modules/${realPath}`))
        }
      }

      for (const key in node) {
        if (node.hasOwnProperty(key)) {
          const child = (node as any)[key]
          if (child && typeof child === "object") {
            if (Array.isArray(child)) {
              child.forEach((subNode: acorn.AnyNode) =>
                findAllRequire(currentPath, subNode)
              )
            } else {
              findAllRequire(currentPath, child)
            }
          }
        }
      }
    }
    const dependences: string[] = []
    findAllRequire(curPath, astTree)

    // 替换 源代码的require
    const processedCode = sourceCode.replaceAll(
      /require\(['"](\S+)['"]\)/g,
      (_, p1) => {
        if (p1.split(".").length > 2) {
          return `_webale_require("${path.resolve(path.dirname(curPath), p1)}")`
        }
        return `_webale_require("${path.resolve(
          path.dirname(curPath),
          p1
        )}.js")`
      }
    )

    moduleMap[curPath] = processedCode

    dependences.forEach(path => {
      analyseDepend(path)
    })
  }
  await analyseDepend(config.entry)

  // 分析完依赖 开始构建

  if (!(await fs.existsSync(path.dirname(config.output)))) {
    await fs.mkdirSync(path.dirname(config.output), { recursive: true })
  }

  // 所有的内容应该包裹在 一个立即执行函数中
  await fs.writeFileSync(config.output, `; (function (modules) {`, {
    flag: "a",
  })

  await fs.writeFileSync(
    config.output,
    ` 
  const installedModules = {}
  function __webpack_require(moduleId) {
    if (installedModules[moduleId]) {
      return installedModules[moduleId].exports
    }
    const func = modules[moduleId]
    const module = (installedModules[moduleId] = {
      i: moduleId,
      l: false,
      exports: {},
    })
    func.call(module.exports, module, module.exports, __webpack_require)
    const result = module.exports
    installedModules[moduleId].l = true
    return result
  }

	return  __webpack_require("${config.entry}")`,
    { flag: "a" }
  )

  await fs.writeFileSync(config.output, `})({`, { flag: "a" })
  // 提供 module
  for (const key in moduleMap) {
    if (moduleMap.hasOwnProperty(key)) {
      await fs.writeFileSync(
        config.output,
        `"${key}":function(module,exports,_webale_require){\n eval(\`${moduleMap[key]}\`)},`,
        { flag: "a" }
      )
    }
  }
  await fs.writeFileSync(config.output, `})`, { flag: "a" })
}

main()
