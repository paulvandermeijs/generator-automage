'use strict';

// @ts-check

const _ = require('lodash');

const validate = model => {
    switch (true) {
        case _.isUndefined(model.name) || _.isEmpty(model.name):
            throw 'Missing model name';

        case !_.isString(model.name):
            throw 'Model name should be a string';
    }
    
    return model;
};

const validateModels = models => {
    if (!_.isArray(models)) {
        throw { messages: [ 'Models should be an array' ]}
    }

    const { validated, messages } = models.reduce(
        ({ offset, validated, messages }, model) => {
            try {
                validated.push(validate(model));
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

module.exports = {
    validateModels
};
