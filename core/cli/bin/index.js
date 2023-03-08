#! /usr/bin/env node

const importLocal = require('import-local');
const log = require('@wson-koa2-cli/log');

// 如果本地存在相同的包，则加载本地的包，并返回true，如果不存在则返回false
if (importLocal(__filename)) {
  log.info('cli', 'use local package version');
} else {
  log.info("cli", "start run");
  require('../lib')(process.argv.slice(2));
}