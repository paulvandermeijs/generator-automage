'use strict';

// @ts-check

const Generator = require('../module');
const path = require('path');
const { validateModels } = require('../../services/module/model');

module.exports = class extends Generator {
    constructor(args, opts) {
        super(args, opts);

        this.argument('file', {
            type: String,
            description: 'Location of your models file',
            required: false
        });
    }

    async prompting() {
        this.options = {
            ...this.options,
            ...await this._promptBasics(),
            models: await this._promptModels()
        }
    }

    async _promptBasics() {
        return {
            vendor: {
                name: await this._getVendorName(),
            },
            module: {
                name: await this._getModuleName(),
            }
        };
    }

    async _promptModels() {
        const parser = file => `../../services/module/model/parser/${path.extname(file).slice(1)}`;

        const file = this.options.file 
            ? (() => {
                this.log.ok(`Using file \`${this.options.file}\`.`);

                return this.options.file;
            })()
            : await (async () => {
                const answers = await this.prompt([
                    {
                        type: 'input',
                        name: 'file',
                        message: 'What is the location of your models file?',
                        validate: (input) => {
                            if (!this.fs.exists(input)) {
                                return 'The file at the supplied location can\'t be found';
                            }
        
                            try {
                                require.resolve(parser(input))
                            } catch (e) {
                                return 'Unknown file type';
                            }
        
                            return true;
                        }
                    }
                ]);

                return answers.file;
            })();

        const fileContents = this.fs.read(file);

        return require(parser(file))(fileContents);
    }

    async writing() {
        try {
            const models = validateModels(this.options.models);

            try {
                models.forEach(model => {
                    this.composeWith(
                        require.resolve('../module:model'),
                        {        
                            ...this.options,
                            name: model.name,
                            properties: model.properties || []
                        }
                    );
                });
            } catch (e) {
                this.log.error('Something went wrong.');
            }
        } catch ({ messages }) {
            this.log.error('Models are invalid:');

            messages.forEach(message => this.log.writeln(`  - ${message}`));
        }
    }
}
