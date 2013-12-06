/* global toString: false */
'use strict';

var UTIL = require('util'),
    JSPATH = require('jspath'),

    //bem tools modules
    BEM = require('bem'),
    LOGGER = BEM.require('./logger'),
    _ = BEM.require('underscore');

var execute = function(data) {
    data = {data: data};

    var db = {
        languages: [],
        tags: [],
        types: [],
        authors: [],
        categories: [],
        posts: [],
        libs: [],
        versions: [],
        levels: [],
        blocks: []
    };

    extrudeLanguages(data, db);
    extrudeTypes(data, db);
    extrudeTags(data, db);
    extrudeAuthors(data, db);
    extrudeCategories(data, db);

    return db;
};

/**
 * Makes db quasi table with languages as array of objects with fields:
 * - id {Number} unique id of entity
 * - name {String} language name
 * @param data - {Object} with field data, which holds plane array of all collected data
 * @param db - {Object} target database object
 */
var extrudeLanguages = function(data, db) {
    LOGGER.debug('normalize: extrude languages');

    var idMap = {};
    db.languages = _.uniq(JSPATH.apply('.data.language', data)).map(
        function(item, index) {
            idMap[item] = index;
            return {
                id: index,
                name: item
            };
        }
    );

    //replace languages values by language ids
    data.data = data.data.map(
        function(item) {
            item.language = idMap[item.language];
            return item;
        }
    );
};

/**
 * Makes db quasi table with types as array of objects with fields:
 * - id {Number} unique id of entity
 * - name {String} type name
 * @param data - {Object} with field data, which holds plane array of all collected data
 * @param db - {Object} target database object
 */
var extrudeTypes = function(data, db) {
    LOGGER.debug('normalize: extrude types');

    var idMap = {};
    db.types = _.uniq(JSPATH.apply('.data.type', data)).map(
        function(item, index) {
            idMap[item] = index;
            return {
                id: index,
                name: item
            };
        }
    );

    //replace type values by type ids
    data.data = data.data.map(
        function(item) {
            if(_.isArray(item.type)) {
                item.type = item.type.map(
                    function(type) {
                        return idMap[type];
                    }
                );
            }else if(_.isString(item.type)) {
                item.type = idMap[item.type];
            }
            return item;
        }
    );
};

/**
 * Makes db quasi table with tags as array of objects with fields:
 * - id {Number} unique id of entity
 * - name {String} tag name
 * @param data - {Object} with field data, which holds plane array of all collected data
 * @param db - {Object} target database object
 */
var extrudeTags = function(data, db) {
    LOGGER.debug('normalize: extrude tags');

    var idMap = {};
    db.tags = _.uniq(JSPATH.apply('.data.tags', data)).map(
        function(item, index) {
            idMap[item] = index;
            return {
                id: index,
                name: item
            };
        }
    );

    //replace tag values by tag ids
    data.data = data.data.map(
        function(item) {
            if(item.tags && _.isArray(item.tags)) {
                item.tags = item.tags.map(
                    function(tag) {
                        return idMap[tag];
                    }
                );
            }
            return item;
        }
    );
};

/**
 * Makes db quasi table with authors and translators as array of objects with fields:
 * - id {Number} unique id of entity
 * - type {Number} type id of entity
 * - avatar {String} link to avatar file for author or translator
 * - email {Array} array of author emails
 * - firstName - {String} first name of author or translator
 * - lastName - {String} last name of author or translator
 * - twitter - {String} twitter account name
 * - github - {String} github account name
 * - skype - {String} skype account name
 * - language - {Number} language id of entity
 * - url - {String} human style of author id
 * - info - {String} brief summary about author or translator
 * @param data - {Object} with field data, which holds plane array of all collected data
 * @param db - {Object} target database object
 */
var extrudeAuthors = function(data, db) {
    LOGGER.debug('normalize: extrude authors');

    var typeIds = ['authors', 'translators'].map(
        function(typeName) {
            var ids = db.types.filter(
                function(type) {
                    return type.name === typeName;
                }
            );

            return ids.length > 0 ? ids[0].id : null;
        }
    );

    var idMap = {};
    db.authors = _.uniq(JSPATH.apply('.data{.type === $type}', data, { type: typeIds })).map(
        function(item, index) {
            idMap[item.url.replace(/\//g, '') + '_' + item.language] = index;
            item.id = index;
            return item;
        }
    );

    data.data = data.data.map(
        function(item) {

            //replace authors by author ids
            //replace translators by translator ids
            ['authors', 'translators'].forEach(function(key) {
                if(item[key] && _.isArray(item[key])) {
                    item[key] = item[key].map(
                        function(at) {
                            return idMap[at + '_' + item.language];
                        }
                    );
                }
            });

            return item;
        }
    );
};

var extrudeCategories = function(data, db) {
    LOGGER.debug('normalize: extrude categories');
};

module.exports = execute;