'use strict';

const view = require('..');
const assert = require('assert').strict;

assert.strictEqual(view(), 'Hello from view');
console.info('view tests passed');
