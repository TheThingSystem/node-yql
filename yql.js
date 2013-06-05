/*

Software Copyright License Agreement (BSD License)

Copyright (c) 2010, Yahoo! Inc.
All rights reserved.

*/

var request = require('request'),
    url     = require('url'),
    baseUrls = {
        http: 'http://query.yahooapis.com/v1/public/yql',
        https: 'https://query.yahooapis.com/v1/public/yql'
    };

/**
 * YQL constructor
 *
 * @class YQL
 * @param {String} yqlString
 * @param {Object} options
 * @public
 */
function YQL(yqlString, options) {

    var env, headers, href, secure;

    if (!(this instanceof YQL)) {
        return new YQL(yqlString, options);
    }

    // yqlString is a required string
    if (typeof yqlString !== 'string') {
        throw new Error('query must be a string');
    }

    // Options is a optional object
    if (!isObject(options) && options !== undefined) {
        throw new Error('options must be a object');
    }

    // Extract options and use there default if not defined
    options = options || {};

    secure = (options.hasOwnProperty('ssl') ? options.ssl : false);
    headers = (options.hasOwnProperty('headers') ? options.headers : {});
    env = (options.hasOwnProperty('env') ? options.env : 'http://datatables.org/alltables.env');

    // Store some options for later reference
    this._headers = headers;

    // Create base url object
    href = url.parse(baseUrls[secure ? 'https' : 'http'], true);

    delete href.search;

    extend(href.query, {
        format: 'json',
        env: env,
        q: yqlString
    });

    this._href = href;
}

/**
 * Executes the query
 *
 * @method exec
 * @param {Object} params
 * @param {Function} callback
 * @public
 */
YQL.prototype.exec = function (params, callback) {

    var href;

    // Params is a required object
    if (!isObject(params)) {
        throw new Error('params must be a object');
    }

    // Callback is a required function
    if (typeof callback !== 'function') {
        throw new Error('callback must be a function');
    }

    // Copy url object
    href = extend({}, this._href);
    href.query = extend({}, this._href.query);

    // Expend query with params object
    href.query = extend(href.query, params);

    // Execute the YQL request
    request({
        headers: this._headers,
        method: 'GET',
        url: url.format(href)
    }, function handleResponse (error, response, body) {
        if (error) {
            return callback(error, null);
        }

        parseJSON(body, function (error, body) {
            if (error) {
                return callback(error, null);
            }

            // Request returned an error, create an error object
            if (body.error) {
                return callback(new Error(body.error.description), null);
            }

            // No error return query result
            callback(null, body.query.results);
        });
    });
};

/**
 * @method extend
 * @param {Object} origin
 * @param {Object} add
 * @private
 */
function extend(origin, add) {
    var keys = Object.keys(add),
        i = keys.length;

    while (i--) {
        origin[keys[i]] = add[keys[i]];
    }

    return origin;
}

/**
 * @method extend
 * @param {Mixed} variable
 * @private
 */
function isObject(variable) {
    return (typeof variable === 'object' && variable !== null);
}

/**
 * @method parseJSON
 * @param {String} string
 * @param {Function} callback
 * @private
 */
function parseJSON(string, callback) {
    var result = null,
        error = null;

    try {
        result = JSON.parse(string);
    } catch (e) {
        error = e;
    }

    callback(error, result);
}

module.exports = YQL;
