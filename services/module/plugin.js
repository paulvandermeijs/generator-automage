'use strict';

// @ts-check

const validator = require('validator');
const { normalizeName } = require('generator-phab/services/php/interface');
const { xml2js, js2xml } = require('xml-js');

const namespaceRegexp = /^[a-zA-Z_\x80-\xff][a-zA-Z0-9_\x80-\xff]*(\\[a-zA-Z_\x80-\xff][a-zA-Z0-9_\x80-\xff]*)*$/;

/**
 * @param {string} name
 * @return {boolean}
 */
const validateNamespace = (name) => validator.matches(name, namespaceRegexp);

const functionNameRegexp = /^[a-zA-Z_\x80-\xff][a-zA-Z0-9_\x80-\xff]*$/;

/**
 * @param {string} name
 * @return {boolean}
 */
const validateFunctionName = (name) => validator.matches(name, functionNameRegexp);

const createFunctions = data => data.functions.map((funData) => {
    const fun = {
        visibility: 'public',
        name: `${funData.type}${funData.name.charAt(0).toUpperCase() + funData.name.slice(1)}`,
        parameters: [
            {
                type: `\\${data.type}`,
                name: '$subject'
            }
        ]
    }

    switch (funData.type) {
        case 'before':
            fun.parameters.push({
                name: '...$args'
            });

            fun.body = 'return $args;';
            break;

        case 'around':
            fun.parameters.push(
                {
                    type: 'callable',
                    name: '$proceed'
                },
                {
                    name: '...$args'
                }
            );

            fun.body = 'return $proceed(...$args);';
            break;

        case 'after':
            fun.parameters.push({
                name: '$result'
            });

            fun.body = 'return $result;';
            break;
    }

    return fun;
});

const defaultDiFilename = () => 'etc/di.xml';

/**
 * @param {string} area
 */
const diFilename = (area) => '' !== area
    ? `etc/${area}/di.xml`
    : defaultDiFilename();

/**
 * @param {{vender: Record<string, any>, module: Record<string, any>, plugin: string}}
 */
const pluginName = ({ vendor, module, plugin }) => `${vendor.name}_${module.name}_${normalizeName(plugin).replace(/\\/g, '_')}`;

/**
 * @param {{vender: Record<string, any>, module: Record<string, any>, plugin: string}}
 */
const pluginType = ({ vendor, module, plugin }) => `${vendor.name}\\${module.name}\\Plugin\\${normalizeName(plugin)}`;

/**
 * @param {Generator} generator
 * @param {string} area
 * @return {string}
 */
const getDi = (generator, area) => {
    try {
        return generator.fs.read(generator.destinationPath(diFilename(area)));
    } catch (e) { }

    return generator.fs.read(generator.templatePath('di.xml'));
};

/**
 * @param {string} xml 
 * @param {{type: string, name: string, plugin: string}}
 * @return {string}
 */
const addPlugin = (xml, { type, name, plugin }) => {
    const xmlData = xml2js(xml);

    xmlData.elements[0].elements = xmlData.elements[0].elements || [];

    xmlData.elements[0].elements.push({
        'type': 'element',
        'name': 'type',
        attributes: {
            'name': type
        },
        elements: [
            {
                type: 'element',
                name: 'plugin',
                attributes: {
                    name,
                    'type': plugin
                }
            }
        ]
    });

    return js2xml(xmlData, { spaces: 4 });
};

module.exports = {
    validateNamespace,
    validateFunctionName,
    createFunctions,
    defaultDiFilename,
    diFilename,
    pluginName,
    pluginType,
    getDi,
    addPlugin
};
