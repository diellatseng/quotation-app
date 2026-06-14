#!/usr/bin/env node
/**
 * Interactive deploy: choose version bump, build, publish to gh-pages.
 * Run: npm run deploy
 */
const { execSync } = require('child_process')
const readline = require('readline')
const { readFileSync } = require('fs')
const { join } = require('path')

const root = join(__dirname, '..')
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const current = pkg.version

function nextVersion(type) {
  const [major, minor, patch] = current.split('.').map(Number)
  if (type === 'major') return `${major + 1}.0.0`
  if (type === 'minor') return `${major}.${minor + 1}.0`
  if (type === 'patch') return `${major}.${minor}.${patch + 1}`
  return current
}

function run(cmd) {
  execSync(cmd, { cwd: root, stdio: 'inherit' })
}

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close()
      resolve(answer.trim())
    })
  })
}

async function main() {
  console.log(`\nCurrent version: ${current}\n`)
  console.log('How should the version be bumped?')
  console.log(`  1) patch  → ${nextVersion('patch')}`)
  console.log(`  2) minor  → ${nextVersion('minor')}`)
  console.log(`  3) major  → ${nextVersion('major')}`)
  console.log(`  4) skip   (keep ${current})`)
  console.log('')

  const choice = await ask('Enter choice [1-4] (default 1): ')
  const map = { '1': 'patch', '2': 'minor', '3': 'major', '4': 'skip', '': 'patch' }
  const bump = map[choice]

  if (!bump) {
    console.error('Invalid choice. Aborting.')
    process.exit(1)
  }

  if (bump !== 'skip') {
    console.log(`\nBumping ${bump}…`)
    run(`npm version ${bump}`)
  } else {
    console.log('\nSkipping version bump.')
  }

  console.log('\nBuilding…')
  run('npm run build')

  console.log('\nPublishing to gh-pages…')
  run('npx gh-pages -d build')

  const version = bump === 'skip' ? current : nextVersion(bump)
  console.log(`\nDone. Deployed v${version}.`)
  if (bump !== 'skip') {
    console.log('Remember to push commit and tag:')
    console.log('  git push && git push --tags')
  }
  console.log('')
}

main().catch(err => {
  console.error(err.message || err)
  process.exit(1)
})
