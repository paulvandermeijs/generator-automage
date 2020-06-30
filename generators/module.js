'use strict';

// @ts-check

const Generator = require('./base');
const xml = require('xml-js');
const {vendorNameValidator, moduleNameValidator} = require('../services/module');
const findUp = require('find-up');
const { realpathSync } = require('fs');

module.exports = class extends Generator {
    /**
     * Get the root for a Magento module.
     * 
     * @return {string}
     */
    moduleRoot() {
        const registrationFile = findUp.sync('registration.php', {
            cwd: this.options.contextRoot || this.contextRoot
        });

        return registrationFile
            ? realpathSync(`${registrationFile}/..`)
            : null;
    }

    /** @inheritdoc */
    destinationRoot() {
        return this.moduleRoot() || super.destinationRoot();
    }

    /**
     * Get the module configuration from `etc/module.xml`.
     * 
     * @return {Record<string, any>}
     */
    _getModuleConfig() {
        /** @type {Record<string, any>} */
        const moduleConfig = {
            vendor: null,
            module: null,
            setupVersion: null
        };

        try {
            const fileContents = this.fs.read(this.destinationPath('etc/module.xml'));

            /** @type {Record<string, any>} */
            const data = xml.xml2js(fileContents, {compact: true});

            /** @type {string} */
            const name = data.config.module._attributes.name;

            [moduleConfig.vendor, moduleConfig.module] = name.split('_', 2);

            moduleConfig.setupVersion = data.config.module._attributes.setup_version;
        } catch (e) {}

        return moduleConfig;
    }

    /**
     * Get the vendor name from the config or prompt the user to provide a name.
     * 
     * @return {Promise<string>}
     */
    async _getVendorName() {
        const vendorName = this._getModuleConfig().vendor;

        return vendorName 
            ? (() => {
                this.log.ok(`Using vendor name \`${vendorName}\`.`);

                return vendorName;
            })()
            : (async () => {
                this.log.error(`Vendor name not found.`);

                const answers = await this.prompt([
                    {
                        type: 'input',
                        name: 'vendor',
                        message: 'What is your vendor name?',
                        validate: vendorNameValidator
                    }
                ]);

                return answers.vendor
            })();
    }

    /**
     * Get the module name from the config or prompt the user to provide a name.
     * 
     * @return {Promise<string>}
     */
    async _getModuleName() {
        const moduleName = this._getModuleConfig().module;

        return moduleName
            ? (() => {
                this.log.ok(`Using module name \`${moduleName}\`.`);

                return moduleName;
            })()
            : (async () => {
                this.log.error(`Module name not found.`);

                const answers = await this.prompt([
                    {
                        type: 'input',
                        name: 'module',
                        message: 'What is your module name?',
                        validate: moduleNameValidator
                    }
                ]);

                return answers.module;
            })();
    }

    async _getArea() {
        const answers = await this.prompt([
            {
                type: 'list',
                name: 'area',
                message: 'Select an area',
                choices: require('../config/area.json'),
                default: '',
            }
        ]);

        return answers.area;
    }
}
