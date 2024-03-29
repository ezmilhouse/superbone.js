/*!
 * Jade
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var Parser = require('parser.js')
  , Lexer = require('lexer.js')
  , Compiler = require('compiler.js')
  , runtime = require('runtime.js')
// if node
  , fs = require('fs');
// end

/**
 * Library version.
 */

exports.version = '0.22.0';

/**
 * Expose self closing tags.
 */

exports.selfClosing = require('self-closing.js');

/**
 * Default supported doctypes.
 */

exports.doctypes = require('doctypes.js');

/**
 * Text filters.
 */

exports.filters = require('filters.js');

/**
 * Utilities.
 */

exports.utils = require('utils.js');

/**
 * Expose `Compiler`.
 */

exports.Compiler = Compiler;

/**
 * Expose `Parser`.
 */

exports.Parser = Parser;

/**
 * Expose `Lexer`.
 */

exports.Lexer = Lexer;

/**
 * Nodes.
 */

exports.nodes = require('nodes');

/**
 * Jade runtime helpers.
 */

exports.runtime = runtime;

/**
 * Template function cache.
 */

exports.cache = {};

/**
 * Parse the given `str` of jade and return a function body.
 *
 * @param {String} str
 * @param {Object} options
 * @return {String}
 * @api private
 */

function parse(str, options){
  try {
    // Parse
    var parser = new Parser(str, options.filename, options);

    // Compile
    var compiler = new (options.compiler || Compiler)(parser.parse(), options)
      , js = compiler.compile();

    // Debug compiler
    if (options.debug) {
      console.error('\nCompiled Function:\n\n\033[90m%s\033[0m', js.replace(/^/gm, '  '));
    }

    return ''
      + 'var buf = [];\n'
      + (options.self
        ? 'var self = locals || {};\n' + js
        : 'with (locals || {}) {\n' + js + '\n}\n')
      + 'return buf.join("");';
  } catch (err) {
    parser = parser.context();
    runtime.rethrow(err, parser.filename, parser.lexer.lineno);
  }
}

/**
 * Compile a `Function` representation of the given jade `str`.
 *
 * Options:
 * 
 *   - `compileDebug` when `false` debugging code is stripped from the compiled template
 *   - `client` when `true` the helper functions `escape()` etc will reference `jade.escape()`
 *      for use with the Jade client-side runtime.js
 *
 * @param {String} str
 * @param {Options} options
 * @return {Function}
 * @api public
 */

exports.compile = function(str, options){
  var options = options || {}
    , client = options.client
    , filename = options.filename
      ? JSON.stringify(options.filename)
      : 'undefined'
    , fn;

  if (options.compileDebug !== false) {
    fn = [
        'var __jade = [{ lineno: 1, filename: ' + filename + ' }];'
      , 'try {'
      , parse(String(str), options)
      , '} catch (err) {'
      , '  rethrow(err, __jade[0].filename, __jade[0].lineno);'
      , '}'
    ].join('\n');
  } else {
    fn = parse(String(str), options);
  }

  if (client) {
    fn = 'var attrs = jade.attrs, escape = jade.escape, rethrow = jade.rethrow;\n' + fn;
  }

  fn = new Function('locals, attrs, escape, rethrow', fn);

  if (client) return fn;

  return function(locals){
    return fn(locals, runtime.attrs, runtime.escape, runtime.rethrow);
  };
};

/**
 * Render the given `str` of jade and invoke
 * the callback `fn(err, str)`.
 *
 * Options:
 *
 *   - `cache` enable template caching
 *   - `filename` filename required for `include` / `extends` and caching
 *
 * @param {String} str
 * @param {Object|Function} options or fn
 * @param {Function} fn
 * @api public
 */

exports.render = function(str, options, fn){
  // swap args
  if ('function' == typeof options) {
    fn = options, options = {};
  }

  // cache requires .filename
  if (options.cache && !options.filename) {
    return fn(new Error('the "filename" option is required for caching'));
  }

  try {
    var path = options.filename;
    var tmpl = options.cache
      ? exports.cache[path] || (exports.cache[path] = exports.compile(str, options))
      : exports.compile(str, options);
    fn(null, tmpl(options));
  } catch (err) {
    fn(err);
  }
};

/**
 * Render a Jade file at the given `path` and callback `fn(err, str)`.
 *
 * @param {String} path
 * @param {Object|Function} options or callback
 * @param {Function} fn
 * @api public
 */

exports.renderFile = function(path, options, fn){
  var key = path + ':string';

  if ('function' == typeof options) {
    fn = options, options = {};
  }

  try {
    options.filename = path;
    var str = options.cache
      ? exports.cache[key] || (exports.cache[key] = fs.readFileSync(path, 'utf8'))
      : fs.readFileSync(path, 'utf8');
    exports.render(str, options, fn);
  } catch (err) {
    fn(err);
  }
};

/**
 * Express support.
 */

exports.__express = exports.renderFile;
