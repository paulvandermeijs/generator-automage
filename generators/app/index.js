'use strict';

// @ts-check

const Generator = require('yeoman-generator');
const chalk = require('chalk');
const prettier = require('gulp-prettier');

module.exports = class extends Generator {
    constructor(args, opts) {
        super(args, opts);

        this.registerTransformStream(prettier({ tabWidth: 4 }));
    }

    async prompting() {
        this.log('');
        this.log(chalk.bold(chalk.redBright(this._title())));
        this.log('');
        this.log(chalk.bold(`Automage version ${this.rootGeneratorVersion()}, copyright (c) 2018 – ${new Date().getFullYear().toString()}, Paul van der Meijs`));
        this.log('');

        const answers = await this.prompt([
            {
                type: 'list',
                name: 'generator',
                message: 'What would you like to do?',
                choices: [
                    {
                        name: 'Create a module',
                        value: 'module',
                    },
                    {
                        name: 'Add an observer to a module',
                        value: 'module:observer',
                    },
                    {
                        name: 'Add a plugin to a module',
                        value: 'module:plugin',
                    },
                    {
                        name: 'Add a single model to a module',
                        value: 'module:model',
                    },
                    {
                        name: 'Add multiple models from a file to a module',
                        value: 'module:models',
                    },
                ]
            }
        ]);

        this.composeWith(
            require.resolve(`../${answers.generator}/`),
            {
                contextRoot: this.options.contextRoot || this.contextRoot,
            }
        );
    }

    /**
     * @return {string}
     */
    _title() {
        return this.fs.read(this.templatePath('title.txt'));
    }
};