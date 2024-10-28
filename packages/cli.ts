import cac from "cac"
import * as fs from "fs"
import path from "path"

interface webaleOptions {
  entry: string
  output: string
  mode: "production" | "development"
  watch: boolean
}

let curPath = __dirname
let realPath = __dirname + "/../"

let configFile
try {
  configFile = require(path.resolve(curPath, "webale.config.js"))
} catch {
  curPath += "/../"
  configFile = require(path.resolve(curPath, "webale.config.js"))
}

const defaultConfig: webaleOptions = {
  entry: path.resolve(realPath, "src/index.js"),
  mode: "development",
  output: path.resolve(realPath, "dist/output.js"),
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
        configFile[key] = path.resolve(realPath, configFile[key])
      }
    }
  }
}

const config = {
  ...defaultConfig,
  ...(configFile ? configFile : {}),
  ...option,
}
