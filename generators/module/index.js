'use strict';

// @ts-check

const Generator = require('../base');
const os = require('os');
const _ = require('lodash');
const { vendorNameValidator, moduleNameValidator, moduleVersionValidator } = require('../../services/module');

module.exports = class extends Generator {
    async prompting() {
        const answers = await this.prompt([
            {
                type: 'input',
                name: 'vendorName',
                message: 'What is your vendor name?',
                default: os.userInfo().username,
                validate: vendorNameValidator,
                store: true
            },
            {
                type: 'input',
                name: 'moduleName',
                message: 'What is the name of your module?',
                validate: moduleNameValidator,
            },
            {
                type: 'input',
                name: 'moduleVersion',
                message: 'What is the version of your module?',
                default: '100.0.0',
                validate: moduleVersionValidator
            }
        ]);

        Object.assign(this.options, {
            vendor: {
                name: answers.vendorName,
            },
            module: {
                name: answers.moduleName,
                version: answers.moduleVersion,
            }
        });
    }

    writing() {
        for (const file of ['registration.php', 'etc/module.xml']) {
            this.fs.copyTpl(
                this.templatePath(file),
                this.destinationPath(file),
                this.options
            );
        }
    }

    destinationRoot() {
        return _.isUndefined(this.options.vendor)
            ? super.destinationRoot()
            : `${super.destinationRoot()}/app/code/${this.options.vendor.name}/${this.options.module.name}`;
    }
};
