'use strict';

// @ts-check

const validator = require('validator');

/**
 * @param {string} input 
 * @return {string|boolean}
 */
const vendorNameValidator = (input) => {
    switch (true) {
        case validator.isEmpty(input, { ignore_whitespace: true }):
            return 'Vendor name can\'t be empty';
    }

    return true;
};

/**
 * @param {string} input 
 * @return {string|boolean}
 */
const moduleNameValidator = (input) => {
    switch (true) {
        case validator.isEmpty(input, { ignore_whitespace: true }):
            return 'Module name can\'t be empty';
    }

    return true;
};

const versionRegexp = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(-(0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(\.(0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*)?(\+[0-9a-zA-Z-]+(\.[0-9a-zA-Z-]+)*)?$/;

/**
 * @param {string} input
 * @return {string|boolean} 
 */
const moduleVersionValidator = (input) => validator.matches(input, versionRegexp) || 'Version number should comply with the semantic versioning specification';

module.exports = {
    vendorNameValidator,
    moduleNameValidator,
    moduleVersionValidator
};
