#!/usr/bin/env node

const meow = require('meow')
const self = require('../package.json')

const main = require('..')
const path = require('path')

const cli = meow(`
Usage
  $ ${Object.keys(self.bin)[0]} <action>

Possible actions
  init              Adds a config file in your project directory
  create <name>     Creates a new file in your migrations dir
  run               Runs all remaining migrations
  rollback <file>   Rolls back all migrations to and including <file>

Options
  --help

For more information, see:
${self.homepage}
`, {
  description: false,
  flags: {},
})

const action = cli.input[0]

;(async () => {
  if (action === 'init') {
    const targetFile = `${Object.keys(self.bin)[0]}.config.js`
    const targetPath = path.join(process.cwd(), targetFile)
    await main.init(targetPath)
    console.log(`Created configuration in "${targetPath}"`)
  } else if (action === 'create') {
    const name = cli.input[1]
    if (!name) throw new Error('No name supplied for "create" command.')
    const targetPath = await main.create(name)
    console.log(`Created migration in "${targetPath}`)
  } else {
    cli.showHelp(1)
  }
})().catch(err => {
  console.error(err)
  cli.showHelp(1)
})
