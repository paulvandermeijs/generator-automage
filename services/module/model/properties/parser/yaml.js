'use strict';

// @ts-check

const YAML = require('yaml');

/**
 * @param {string} fileContents
 */
const parse = (fileContents) => YAML.parse(fileContents);

module.exports = parse;
