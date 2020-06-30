'use strict';

// @ts-check

const Generator = require('../module');
const path = require('path');
const { createAccessors, createConsts, validateProperties } = require('../../services/module/model/properties');
const validator = require('validator');
const { extractName, normalizeName } = require('generator-phab/services/php/interface');

module.exports = class extends Generator {
    constructor(args, opts) {
        super(args, opts);

        this.argument('name', {
            type: String,
            description: 'The name for your model',
            required: false
        });
    }

    async prompting() {
        this.options = {
            ...this.options,
            ...await this._promptBasics(),
            ...await this._promptModel()
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

    async _promptModel() {
        return {
            name: await this._getName(),
            properties: await this._getProperties()
        }
    }

    async _getName() {
        const name = this.options.name;

        return name 
            ? (() => {
                this.log.ok(`Using model name \`${name}\`.`);

                return name;
            })()
            : (async () => {
                this.log.error(`Model name not found.`);

                const answers = await this.prompt([
                    {
                        type: 'input',
                        name: 'name',
                        message: 'What is the name for your model?',
                        validate: (input) => {
                            switch (true) {
                                case validator.isEmpty(input, { ignore_whitespace: true }):
                                    return 'Model name can\'t be empty';
                            }
        
                            return true;
                        }
                    }
                ]);

                return answers.name
            })();
    }

    async _getProperties() {
        return this.options.properties 
            ? (() => {
                this.log.ok(`Using predefined properties.`);

                return this.options.properties;
            })()
            : (async () => {
                const methodAnswers = await this.prompt([
                    {
                        type: 'list',
                        name: 'method',
                        message: 'How would you like to add properties?',
                        choices: [
                            {
                                name: 'Add properties from a file',
                                value: 'file',
                            },
                            {
                                name: 'Add properties manually',
                                value: 'manual',
                            },
                            {
                                name: 'Don\'t add any properties',
                                value: '',
                            }
                        ]
                    }
                ]);
        
                switch (methodAnswers.method) {
                    case 'file':
                        return await this._getPropertiesFromFile();
        
                    case 'manual':
                        return await this._promptProperties();
                }
        
                return [];
            })();
    }

    async _getPropertiesFromFile() {
        const parser = file => `../../services/module/model/properties/parser/${path.extname(file).slice(1)}`;

        const fileAnswers = await this.prompt([
            {
                type: 'input',
                name: 'file',
                message: 'What is the location of your properties file?',
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

        const fileContents = this.fs.read(fileAnswers.file);

        return require(parser(fileAnswers.file))(fileContents);
    }

    async _promptProperties() {
        const properties = [];

        while (true) {
            const propertyAnswers = await this.prompt([
                {
                    type: 'input',
                    name: 'property.name',
                    message: 'What is the name of your property?',
                    validate: (input) => {
                        switch (true) {
                            case validator.isEmpty(input, { ignore_whitespace: true }):
                                return 'Property name can\'t be empty';
                        }
    
                        return true;
                    }
                },
                {
                    type: 'input',
                    name: 'property.type',
                    message: 'What is the type of your property?',
                    validate: (input) => {
                        switch (true) {
                            case validator.isEmpty(input, { ignore_whitespace: true }):
                                return 'Property type can\'t be empty';
                        }
    
                        return true;
                    }
                },
                {
                    type: 'confirm',
                    name: 'addProperty',
                    message: 'Would you like to add another property?',
                    default: false
                }
            ]);

            properties.push(propertyAnswers.property);

            if (!propertyAnswers.addProperty) {
                break;
            }
        }

        return properties;
    }

    async writing() {
        try {
            const properties = validateProperties(this.options.properties);

            this._write({
                ...this.options,
                properties
            });
        } catch ({ messages }) {
            this.log.error('Properties are invalid:');

            messages.forEach(message => this.log.writeln(`  - ${message}`));
        }
    }

    async _write(model) {
        try {
            this.composeWith(
                require.resolve('generator-phab/generators/interface'),
                {
                    contextRoot: this.moduleRoot() || this.options.contextRoot || this.contextRoot,
                    name: `Api\\Data\\${normalizeName(model.name)}Interface`,
                    interface: {
                        consts: createConsts(model.properties),
                        functions: createAccessors('self', model.properties)
                    },
                    document: {
                        package: `${this.options.vendor.name}_${this.options.module.name}`,
                    }
                }
            );

            const interfaceFullName = `${this.options.vendor.name}\\${this.options.module.name}\\Api\\Data\\${normalizeName(model.name)}Interface`;

            const { name: interfaceClassName } = extractName(interfaceFullName);

            this.composeWith(
                require.resolve('generator-phab/generators/class'),
                {
                    contextRoot: this.moduleRoot() || this.options.contextRoot || this.contextRoot,
                    name: `Model\\${normalizeName(model.name)}`,
                    class: {
                        extends: '\\Magento\\Framework\\DataObject',
                        implements: [
                            interfaceClassName
                        ],
                        functions: createAccessors(interfaceClassName, model.properties),
                    },
                    document: {
                        package: `${this.options.vendor.name}_${this.options.module.name}`,
                        imports: [
                            { name: interfaceFullName }
                        ]
                    }
                }
            );
        } catch (e) {
            this.log.error('Something went wrong.');
        }
    }
};
