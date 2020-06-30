'use strict';

// @ts-check

const Generator = require('../module');
const validator = require('validator');
const { eventsFilename, observerName, observerInstance, getEvents, addObserver, validateEventName } = require('../../services/module/observer');
const { normalizeName } = require('generator-phab/services/php/interface');

module.exports = class extends Generator {
    async prompting() {
        this.options = {
            ...this.options,
            ...await this._prompBasics(),
            ...await this._promptObserver()
        }
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

    async _promptObserver() {
        return await this.prompt([
            {
                type: 'input',
                name: 'event',
                message: 'For which event would you like to add an observer?',
                validate: (input) => {
                    switch (true) {
                        case validator.isEmpty(input, { ignore_whitespace: true }):
                            return 'Event can\'t be empty';

                        case !validateEventName(input):
                            return 'Name must be a valid event name';
                    }

                    return true;
                }
            },
            {
                type: 'input',
                name: 'observer',
                message: 'What is the name of your observer?',
                validate: (input) => {
                    switch (true) {
                        case validator.isEmpty(input, { ignore_whitespace: true }):
                            return 'Observer name can\'t be empty';
                    }

                    return true;
                }
            }
        ])
    }

    async writing() {
        try {
            this.composeWith(
                require.resolve('generator-phab/generators/class'),
                {
                    contextRoot: this.moduleRoot() || this.options.contextRoot || this.contextRoot,
                    name: `Observer\\${normalizeName(this.options.observer)}`,
                    class: {
                        implements: [
                            'ObserverInterface'
                        ],
                        functions: [
                            {
                                visibility: 'public',
                                name: 'execute',
                                parameters: [
                                    {
                                        type: 'Observer',
                                        name: '$observer'
                                    }
                                ]
                            }
                        ],
                    },
                    document: {
                        package: `${this.options.vendor.name}_${this.options.module.name}`,
                        imports: [
                            { name: 'Magento\\Framework\\Event\\Observer' },
                            { name: 'Magento\\Framework\\Event\\ObserverInterface' }
                        ]
                    }
                }
            );

            const events = addObserver(
                getEvents(this, this.options.area),
                {
                    event: this.options.event,
                    name: observerName(this.options),
                    observer: observerInstance(this.options)
                }
            );

            this.fs.write(
                this.destinationPath(eventsFilename(this.options.area)),
                events
            );
        } catch (e) {
            this.log.error('Something went wrong.');
        }
    }
};
