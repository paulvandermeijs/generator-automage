'use strict';

// @ts-check

const _ = require('lodash');
const { camelCase, constantCase, pascalCase, snakeCase } = require('change-case');

/**
 * @param {string} interfaceName 
 * @param {Record<string, any>[]} properties 
 */
const createAccessors = (interfaceName, properties) => properties.reduce(
    (acc, property) => acc.concat([
        {
            visibility: 'public',
            name: `get${pascalCase(property.name)}`,
            type: property.type,
            body: `return $this->getData(self::${constName(property.name)});`
        },
        {
            visibility: 'public',
            name: `set${pascalCase(property.name)}`,
            type: interfaceName,
            parameters: [
                {
                    type: property.type,
                    name: `\$${camelCase(property.name)}`
                }
            ],
            body: `return $this->setData(self::${constName(property.name)}, \$${camelCase(property.name)});`
        }
    ]),
    []
);

const createConsts = properties => properties.map((property) => ({
    name: constName(property.name),
    value: `'${snakeCase(property.name)}'`
}));

const convert = data => {
    switch (typeof data) {
        case 'string':
            return { name: data };

        case 'object':
            return data;
    }

    throw `Unsupported property data type ${typeof data}`
};

const validate = property => {
    switch (true) {
        case _.isUndefined(property.name) || _.isEmpty(property.name):
            throw 'Missing property name';

        case !_.isString(property.name):
            throw 'Property name should be a string';

        case !_.isUndefined(property.type) && !_.isString(property.type):
            throw 'Property type should be a string';
    }
    
    return property;
}

/**
 * @param {array} properties
 */
const validateProperties = properties => {
    if (!_.isArray(properties)) {
        throw { messages: [ 'Properties should be an array' ]}
    }

     const { validated, messages } = properties.reduce(
        ({ offset, validated, messages }, property) => {
            try {
                validated.push(validate(convert(property)));
            } catch (e) {
                messages.push(`${e} at offset #${offset}`);
            }

            return { offset: offset + 1, validated, messages };
        },
        { offset: 0, validated: [], messages: [] }
    );

    if (messages.length > 0) {
        throw { messages };
    }

    return validated;
};

const constName = name => `DATA_${constantCase(name)}`;

module.exports = {
    createAccessors,
    createConsts,
    validateProperties,
    constName
};
