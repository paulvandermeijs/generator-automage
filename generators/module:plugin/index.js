'use strict';

// @ts-check

const Generator = require('../module');
const validator = require('validator');
const { normalizeName } = require('generator-phab/services/php/interface');
const {
    validateNamespace,
    validateFunctionName,
    createFunctions,
    diFilename,
    getDi,
    addPlugin,
    pluginName,
    pluginType
} = require('../../services/module/plugin');

module.exports = class extends Generator {
    async prompting() {
        this.options = {
            ...this.options,
            ...await this._prompBasics(),
            ...await this._promptPlugin(),
            functions: await this._promptFunctions()
        };
    }

    async _prompBasics() {
        return {
            vendor: {
                name: await this._getVendorName(),
            },
            module: {
                name: await this._getModuleName(),
            },
            area: await this._getArea()
        };
    }

    async _promptPlugin() {
        return await this.prompt([
            {
                type: 'input',
                name: 'type',
                message: 'What is the type you would like to add a plugin for?',
                validate: (input) => {
                    switch (true) {
                        case validator.isEmpty(input, { ignore_whitespace: true }):
                            return 'Type can\'t be empty';

                        case !validateNamespace(input):
                            return 'Type must be a valid PHP class';
                    }

                    return true;
                }
            },
            {
                type: 'input',
                name: 'plugin',
                message: 'What is the name of your plugin?',
                validate: (input) => {
                    switch (true) {
                        case validator.isEmpty(input, { ignore_whitespace: true }):
                            return 'Plugin name can\'t be empty';
                    }

                    return true;
                }
            }
        ])
    }

    async _promptFunctions() {
        let functions = [];

        while (true) {
            const addAnswers = await this.prompt([
                {
                    type: 'confirm',
                    name: 'addFunction',
                    message: functions.length > 0
                        ? 'Would you like to add another function?'
                        : 'Would you like to add a function?',
                    default: functions.length < 1
                }
            ]);

            if (!addAnswers.addFunction) {
                break;
            }

            const functionAnswers = await this.prompt([
                {
                    type: 'list',
                    name: 'type',
                    message: 'Select an type',
                    choices: [
                        {
                            name: 'Before',
                            value: 'before'
                        },
                        {
                            name: 'Around',
                            value: 'around'
                        },
                        {
                            name: 'After',
                            value: 'after'
                        },
                    ]
                },
                {
                    type: 'input',
                    name: 'name',
                    message: 'What is the name of the function you would like to apply the plugin to?',
                    validate: (input) => {
                        switch (true) {
                            case validator.isEmpty(input, { ignore_whitespace: true }):
                                return 'Function name can\'t be empty';

                            case !validateFunctionName(input):
                                return 'Name must be a valid PHP function name';
                        }

                        return true;
                    }
                }
            ]);

            functions.push(functionAnswers);
        }

        return functions;
    }

    async writing() {
        try {
            this.composeWith(
                require.resolve('generator-phab/generators/class'),
                {
                    contextRoot: this.moduleRoot() || this.options.contextRoot || this.contextRoot,
                    name: `Plugin\\${normalizeName(this.options.plugin)}`,
                    class: {
                        functions: createFunctions(this.options),
                    },
                    document: {
                        package: `${this.options.vendor.name}_${this.options.module.name}`
                    }
                }
            );

            const di = addPlugin(
                getDi(this, this.options.area),
                {
                    type: this.options.type,
                    name: pluginName(this.options),
                    plugin: pluginType(this.options)
                }
            );

            this.fs.write(
                this.destinationPath(diFilename(this.options.area)),
                di
            );
        } catch (e) {
            this.log.error('Something went wrong.');
        }
    }
};
