
/*!
 * Jade - nodes - Filter
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var Node = require('node.js')
  , Block = require('block.js');

/**
 * Initialize a `Filter` node with the given 
 * filter `name` and `block`.
 *
 * @param {String} name
 * @param {Block|Node} block
 * @api public
 */

var Filter = module.exports = function Filter(name, block, attrs) {
  this.name = name;
  this.block = block;
  this.attrs = attrs;
  this.isASTFilter = block instanceof Block;
};

/**
 * Inherit from `Node`.
 */

Filter.prototype.__proto__ = Node.prototype;