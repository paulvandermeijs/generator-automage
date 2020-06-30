'use strict';

// @ts-check

const YAML = require('yaml');

/**
 * @param {string} fileContents
 */
const parse = (fileContents) => YAML.parseAllDocuments(fileContents).map(doc => doc.toJSON());

module.exports = parse;
