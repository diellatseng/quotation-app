const { join } = require('path')

/** @type {import("puppeteer").Configuration} */
module.exports = {
  // Store Chrome inside the project directory so it persists
  // from build phase to runtime on Render (and other cloud envs).
  cacheDirectory: join(__dirname, '.puppeteer-cache'),
}
