/* global toString: false */
'use strict';

var UTIL = require('util'),
    JSPATH = require('jspath'),

    //bem tools modules
    BEM = require('bem'),
    LOGGER = BEM.require('./logger'),
    _ = BEM.require('underscore'),

    HUMAN_TYPES = ['authors', 'translators'];

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
    extrudePosts(data, db);

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

    var typeIds = HUMAN_TYPES.map(
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
            return _.extend({ id: index }, item);
        }
    );

    data.data = data.data.map(
        function(item) {

            //replace authors by author ids
            //replace translators by translator ids
            HUMAN_TYPES.forEach(function(key) {
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

/**
 * Makes db quasi table with categories as array of objects with fields:
 * - id {Number} - generate unique id of category
 * - name {String} - name of category
 * - url {String} - url of category
 * - order {Number} - order of category
 * - type {Number} - id of type of category
 * - parent {Number} - id of parent category
 * - language {Number} - id of language
 * @param data - {Object} with field data, which holds plane array of all collected data
 * @param db - {Object} target database object
 */
var extrudeCategories = function(data, db) {
    LOGGER.debug('normalize: extrude categories');

    var count = 0,
        idMap = {};

    db.languages.forEach(
        function(lang) {
            var language = lang.name,
                localizationHash = {},
                categoriesHash = {},
                orderHash = {},
                categories = null;

            //retrieve categories for language
            categories = _.uniq(
                JSPATH.apply('.data{.language === $lang}.categories', data, { lang: lang.id }), false,
                    function(item) { return item.url; }
            );

            //build localization and order hashes for categories
            categories.forEach(
                function(category) {
                    var urlArr = category.url.split('/'),
                        nameArr = category.name ? category.name.split('/') : [],
                        orderArr = category.order ? category.order.split('/') : [];

                    urlArr.forEach(
                        function(url, index) {
                            localizationHash[url] = nameArr[index] || url;
                            orderHash[url] = orderArr[index] || 0;
                        }
                    );
                }
            );

            //build categories hash with parent links
            //also type and language ids should be added
            //unique key is concatenation of url and name of category
            categories.forEach(
                function(category) {
                    var type = db.types.filter(
                         function(type) {
                             return type.name === category.type;
                         }
                    )[0];
                    type = type ? type.id : null;

                    category.url.split('/').reduce(
                        function(parent, url) {
                            categoriesHash[url] = categoriesHash[url] ||
                            {
                                name: localizationHash[url],
                                url: url,
                                order: orderHash[url],
                                type: type,
                                parent: parent,
                                language: lang.id,
                                key: category.url + '_' + category.name
                            };
                            return url;
                        }, null
                    );
                }
            );

            //merge categories hash into array
            //generate unique ids and parent ids for categories
            //create id map for data integration
            //push into db categories aray
            categories = _.values(categoriesHash)
                .map(
                    function(category) {
                        return _.extend({ id: count++ }, category);
                    }
                )
                .map(
                    function(category, index, arr) {
                        var parent = arr.filter(
                            function(cat) {
                                return category.parent === cat.url;
                            }
                        )[0];

                        category.parent = parent ? parent.id : null;
                        idMap[category.key] = category.id;
                        delete category.key;

                        db.categories.push(category);
                        return category;
                    }
                );
        }
    );

    //replace post categories object by generated links to them
    data.data = data.data.map(
        function(item) {
            if(item.categories && _.isArray(item.categories)) {
                item.categories = item.categories.map(
                    function(category) {
                        return idMap[category.url + '_' + category.name];
                    }
                );
            }

            return item;
        }
    );
};

var extrudePosts = function(data, db) {
    LOGGER.debug('normalize: extrude posts');
};

module.exports = execute;