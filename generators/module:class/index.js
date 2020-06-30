'use strict';

// @ts-check

const Generator = require('../module');

module.exports = class extends Generator {
    constructor(args, opts) {
        super(args, opts);

        this.argument('name', {
            type: String,
            description: 'The name for your class',
            required: false
        });
    }

    async prompting() {
        this.options = {
            ...this.options,
            ...await this._promptBasics(),
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

    async writing() {
        try {
            this.composeWith(
                require.resolve('generator-phab/generators/class'),
                {
                    ...this.options,
                    document: {
                        package: `${this.options.vendor.name}_${this.options.module.name}`,
                    }
                }
            );
        } catch (e) {
            this.log.error('Something went wrong.');
        }
    }
};
