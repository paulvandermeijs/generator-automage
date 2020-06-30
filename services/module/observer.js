'use strict';

// @ts-check

const validator = require('validator');
const { normalizeName } = require('generator-phab/services/php/interface');
const { xml2js, js2xml } = require('xml-js');

const eventNameRegexp = /^[a-zA-Z0-9_]+$/;

/**
 * @param {string} name
 * @return {boolean}
 */
const validateEventName = (name) => validator.matches(name, eventNameRegexp);

const defaultEventsFilename = () => 'etc/events.xml';

/**
 * @param {string} area
 */
const eventsFilename = (area) => '' !== area
    ? `etc/${area}/events.xml`
    : defaultEventsFilename();

/**
 * @param {{vendor: Record<string, any>, module: Record<string, any>, observer: string}}
 */
const observerName = ({ vendor, module, observer }) => `${vendor.name}_${module.name}_${normalizeName(observer).replace(/\\/g, '_')}`;

/**
 * @param {{vendor: Record<string, any>, module: Record<string, any>, observer: string}}
 */
const observerInstance = ({ vendor, module, observer }) => `${vendor.name}\\${module.name}\\Observer\\${normalizeName(observer)}`;

/**
 * @param {Generator} generator
 * @param {string} area
 * @return {string}
 */
const getEvents = (generator, area) => {
    try {
        return generator.fs.read(generator.destinationPath(eventsFilename(area)));
    } catch (e) { }

    return generator.fs.read(generator.templatePath('events.xml'));
};

/**
 * @param {string} xml 
 * @param {{event: string, name: string, observer: string}}
 * @return {string}
 */
const addObserver = (xml, { event, name, observer }) => {
    const xmlData = xml2js(xml);

    xmlData.elements[0].elements = xmlData.elements[0].elements || [];

    xmlData.elements[0].elements.push({
        type: 'element',
        'name': 'event',
        attributes: {
            'name': event
        },
        elements: [
            {
                type: 'element',
                'name': 'observer',
                attributes: {
                    name,
                    instance: observer
                }
            }
        ]
    });

    return js2xml(xmlData, { spaces: 4 });
};

module.exports = {
    validateEventName,
    eventsFilename,
    observerName,
    observerInstance,
    getEvents,
    addObserver
};
