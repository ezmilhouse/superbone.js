var superbone = function (exports) {





	// Current version, keep in sync with `package.json`.
	var version = '0.0.1';

	// Save a reference to the global object (`window` in the browser,
	// `global` on the server).
	var root = this;

	// Save the previous value of the `superbone` variable, so that it can be,
	// restored later on, if `noConflict` is used.
	var prev = root.superbone;





	/**
	 * @function log()
	 * @helper
	 * Inject browser-safe logging function, makes use of `history` API
	 * if available, wraps `console.log`.
	 */
	function log() {
		root.log.history = root.log.history || [];
		root.log.history.push(arguments);
		if (this.console) {
			console.log(Array.prototype.slice.call(arguments));
		}
	}

	/**
	 * @function noConflict()
	 * @helper
	 * Runs superbone in *noConflict* mode, returning the `superbone` variable
	 * to its previous owner. Returns a reference to this superbone object.
	 */
	function noConflict() {
		root.superbone = prev;
		return this;
	}

	/**
	 * @function noop([callback])
	 * @helper
	 * @param callback
	 * This is the `no callback` function that you wish to pass around as a
	 * function that will do nothing. Useful if `callback` is optional.
	 */
	function noop(callback) {
		if (callback) return callback();
		return null;
	}


	// ---


	/**
	 * @function isFunction(mixed)
	 * @helper
	 * @param mixed
	 * Checks if incoming `mixed` is actually of type `function`.
	 */
	function isFunction(mixed) {
		return typeof(mixed) == 'function';
	}

	/**
	 * @function isObject(mixed)
	 * @helper
	 * @param mixed
	 * Checks if incoming `mixed` is actually of type `object`, if so return true
	 * if object is not empty.
	 */
	function isObject(mixed) {
		var res = mixed !== null && typeof mixed == 'object';
		if (res) res = !_.isEmpty(mixed);
		return res;
	}

	/**
	 * @function isArray(mixed)
	 * @helper
	 * @param mixed
	 * Checks if incoming `mixed` is actually of type `array`, if so return true
	 * if array is not empty.
	 */
	function isArray(mixed) {
		return mixed instanceof Array && mixed.length > 0;
	}

	/**
	 * @function inArray(value, array, [i])
	 * @helper
	 * @param value
	 * @param array
	 * @param i
	 * Borrowed from jQuery 1.7.x, checks if incoming `value` is in `array`, returns
	 * index if so , otherwise returns -1.
	 */
	function inArray(value, array, i) {
		var len;
		if (array) {
			if (array.indexOf) {
				return array.indexOf.call(array, value, i);
			}
			len = array.length;
			i = i ? i < 0 ? Math.max(0, len + i) : i : 0;
			for (; i < len; i++) {
				// Skip accessing in sparse arrays
				if (i in array && array[ i ] === value) {
					return i;
				}
			}
		}
		return -1;
	}





	var _controllers = {};

	// ---

	/**
	 * @function controllerCreate(namespace)
	 * @public
	 * @param namespace
	 * Creates new instance of internal `Controller` class.
	 */
	function controllerCreate(namespace) {
		return new Controller(namespace);
	}

	/**
	 * @function controllerGet(name, [debug])
	 * @public
	 * @param namespace
	 * @param debug
	 * Getter for `controller` instances, returns all controller instances of
	 * one namespace if `namespace` param is set other than null. Otherwise
	 * returns object of namespaces containing all of their controller instances
	 * 2nd param set to `true` returns internal representations of controller
	 * instances.
	 *
	 * Examples:
	 *
	 *      // all namespaces/controller instances
	 *      superbone.controllers.get();
	 *
	 *      // all namespaces/internal representations
	 *      // plus debug
	 *      superbone.controllers.get(null, true);
	 *
	 *      // namespaces 'user'/controller instances
	 *      superbone.controllers.get('user');
	 *
	 *      // namespaces 'user'/internal representations
	 *      // plus debug
	 *      superbone.controllers.get('user');
	 *
	 *      // array of namespaces
	 *      // 'user'/controller instances
	 *      // 'cars'/controller instances
	 *      superbone.controllers.get(['user', 'cars']);
	 *
	 *      // array of namespaces, plus debug
	 *      // 'user'/controller instances
	 *      // 'cars'/controller instances
	 *      // plus debug
	 *      superbone.controllers.get(['user', 'cars'], true);
	 */
	function controllerGet(namespace, debug) {

		function getIt(namespace, debug) {

			if (namespace) {
				if (debug) return _controllers[namespace];
				return _controllers[namespace].controller;
			} else {
				var obj = {};
				_.each(_controllers, function (value, key) {
					if (debug) {
						obj[key] = _controllers[key]
					} else {
						obj[key] = _controllers[key].controller
					}
				});
				return obj;
			}

		}

		if (isArray(namespace)) {

			// If namespace is of type array loop through array, call `getIt()`
			// with `debug` param and collects returns.
			var obj = {};
			_.each(namespace, function (value, key) {
				obj[value] = getIt(value, debug);
			});
			return obj;

		} else {
			return getIt(namespace, debug);
		}

	}

	// ---

	/**
	 * @constructor Controller(name)
	 * @param namespace
	 * Internal controller class object. API sets are saved here.
	 */
	function Controller(namespace) {

		// Internal controller name for internal reference, key that controller
		// will be stored in `controllers` cache object, defaults to namespace `all`
		this._namespace = namespace || 'all';

		// Controller functions, to be executed as callback of ex. native event,
		// grouped by name
		this._functions = {};

		// Save pre-build controller data in cache object for later reference.
		_controllers[this._namespace] = this;

		return this;

	}

	// ---

	/**
	 * @method .end()
	 * @public
	 * @prototype
	 * Method that puts it's all together, takes resulting attributes of API
	 * calls and returns fresh controller instance.
	 */
	Controller.prototype.end = function () {

		// save internal representation for internal reference
		_controllers[this._namespace] = this;

		// save callbacks for public reference via `controllers.get()`
		_.extend(_controllers[this._namespace], {
			controller : this._functions
		});

		// return fresh instance
		return _controllers[this._namespace].controller;

	};

	/**
	 * @method .is(mixed, [callback])
	 * @public
	 * @prototype
	 * @param mixed
	 * @param callback(err, evt, ctx)
	 * Callback subscription method, registers callbacks to controller instance.
	 * Callbacks can be controller functions themselves (registered via name
	 * string) or functions.
	 *
	 * Callback gets 3 params:
	 *
	 * err : error object
	 * evt : jqUery event name
	 * ctx : objectsof all contextes available:
	 *          el         : jQuery obj of DOM element that triggered the event
	 *                       (evt.currentTarget)
	 *          id         : jQuery obj of closest DOM element with id attribute
	 *          model      : instance of model instance event was triggered from
	 *          collection : instance of collection model is in
	 *
	 * Examples:
	 *
	 *      // name/function
	 *      .on('add', function() { ... });
	 *
	 *      // name/controller
	 *      .is('itemToggle', 'items:showItem');
	 *
	 *
	 *      // obj of name/function or name/controller
	 *      .on({
	 *          itemToggle : 'items:showItem',
	 *          itemHide   : function() { ... }
	 *      });
	 *
	 *      // arr of obj of name/function or name/controller
	 *      .on([
	 *          { itemToggle : 'items:showItem' },
	 *          { itemHide   : function() { ... } }
	 *      ])
	 */
	Controller.prototype.is = function (mixed, callback) {

		var that = this;

		if (isArray(mixed)) {

			// If first param `mixed` is array it might hold a lot of things:
			// objects, key/value, key/functions, key/strings. Best way to find
			// out is looping throgh array and calling `.is()` recursively.
			_.each(mixed, function (value, key) {
				that.is(value);
			});

		} else if (isObject(mixed)) {

			// If first param `mixed` is an object it could be a single key/
			// function pair or an object of key/function pairs or the same with
			// controller strings instead of functions. To find out loop through
			// object keys and call `.is()` recursively.
			_.each(mixed, function (value, key) {
				that.is(key, value);
			});

		} else {

			// If first param `mixed` is string, next steps depend on type of
			// 2nd param `callback`. This might be either a `function` or a
			// `string` (name) pointing internally to a controller function.
			if (isFunction(callback)) {

				this._functions[mixed] = callback;

			} else {

				// If 2nd param `callback` is a string it has to be the name of
				// an internal controller function.
				// Controller functions are grouped by name, therefore strings
				// that point to controller functions come in for `name:function`.
				// to extract controller function from globa `_controllers`
				// object we need to split string first.
				var arr = callback.split(':');
				if (arr.length === 2) {
					this._functions[mixed] = _controllers[arr[0]].controller[arr[1]];
				} else {
					log('[error] Could not find controller `' + arr[1] + '` in group `' + arr[0] + '`.' +
						'Please create controller first.');
					this._functions[mixed] = noop;
				}

			}

		}

		return this;

	};





	var _models = {};

	// ---

	/**
	 * @function modelCreate(name)
	 * @public
	 * @param name
	 * Creates new instance of internal `Model` class.
	 */
	function modelCreate(name) {
		return new Model(name);
	}

	/**
	 * @function modelGet(name, [debug])
	 * @public
	 * @param name
	 * @param debug
	 * Getter for `Model` instances, returns single model instance if `name` is
	 * set to other than null. Otherwise returns object of model instances.
	 * 2nd param set to `true` returns internal representations of model
	 * instances.
	 */
	function modelGet(name, debug) {

		function getIt(name, debug) {

			if (name) {
				if (debug) return _models[name];
				return _models[name].model;
			} else {
				var obj = {};
				_.each(_models, function (value, key) {
					if (debug) {
						obj[key] = _models[key]
					} else {
						obj[key] = _models[key].model
					}
				});
				return obj;
			}

		}

		if (isArray(name)) {

			// If namespace is of type array loop through array, call `getIt()`
			// with `debug` param and collects returns.
			var obj = {};
			_.each(name, function (value, key) {
				obj[value] = getIt(value, debug);
			});
			return obj;

		} else {
			return getIt(name, debug);
		}

	}

	// ---

	/**
	 * @constructor Model(name)
	 * @param name
	 * Internal model class object. API sets are saved here. Later creation
	 * of `Backbone.Model` instance is based on stuff stored here.
	 */
	function Model(name) {

		// Internal model name for internal reference, key that model will be
		// stored in `_models` object
		this._name = name;

		// Internal schema object of model, will end up as `validate` key in
		// `Backbone.Model` instance.
		this._schema = {};

		// Internal defaults object that holds default model attributes/values.
		this._defaults = {};

		// Internal mapping functions that came in via ´.is('foo', function)´,
		// those are executed as part of Backbone's `initialize` function and
		// bound to the `on('all')` event of model instances.
		this._maps = {};

		// Internal objects that hold data coming in from prototype functions,
		// stored for use in instatiation process of Backbone model.
		this._events = {};

		// The value of `_id` will be translated into Backbone's `attributeId`
		// later, it helps to sync Backbone's internal `id` with mongo's `_id`
		// notation.
		this._id = '_id';

		// List of native `Backbone` model events, taken in consideration if
		// user tries to register functions via `.on()` or `.event()`, function
		// registered for events that don'texist are ignored
		this._availableEvents = [
			'add'
			, 'all'
			, 'change'
			, 'destroy'
			, 'error'
			, 'remove'
			, 'sync'
		];

		// Save pre-build model data in cache object for later reference.
		_models[this._name] = this;

		return this;

	}

	// ---

	/**
	 * @method .end()
	 * @public
	 * @prototype
	 * Method that puts it's all together, takes resulting attributes of API
	 * calls, does some translation, move-it-here, move-it-there work and
	 * initiates native `Backbone.Model` instance.
	 * Saves instance in `_models` object (for internal reference) and
	 * returns fresh Backbone model instance.
	 */
	Model.prototype.end = function () {

		var that = this;

		var Model = Backbone.Model.extend({

			initialize : function () {

				// Context (`this`) of Backbone class object
				var context = this;

				function mapAttributes() {

					_.each(that._maps, function (value, key) {
						if (isFunction(value)) {
							context.set(key, value.apply(context), {
								silent : true
							});
						}
					});

				}

				// Set ID mapping for syncing with via REST
				this.attributeId = that._id;

				// Make sure that after all events, values of attributes
				// that have functions as values, compute their actual values
				// TODO: best solution?
				context.on('all', function () {
					mapAttributes();
				}, context);

				// Setup listeners for native Backbone events, callbacks are
				// set via API's `.on()` method and stored in `_.events` obj.
				_.each(that._events, function (value, key) {

					// Backbone is very inconsistent when it comes to passing
					// arguments to callback functions.
					// in Collections expect:
					// a: collection instance
					// b: changes
					// if event is `all` first param is internal event name
					context.on(key, function (a, b, c) {

						// Map map over attributes that may compute there values
						// from function results.
						if (key === 'all') mapAttributes();

						// For consistency reasons, add err obj as first param.
						var err = null;

						// Make events more consistent, always return 3 params:
						// 1. evt name (ex: reset, chnage:attribute)
						var evt = key;

						// 2. context object holding instances of objects event
						// is nested in: model, collection, view
						var ctx = {
							model : (_.isEmpty(a)) ? null : a
						};

						// 3. Backbone's delta obj, representing changes or
						// states
						var res = c || {};

						value.call(context, err, evt, ctx, res);

					}, context);

				});

				// Initally map all default values id attribute's value was
				// function.
				mapAttributes();

			},
			defaults   : function () {
				return that._defaults;
			}
		});

		// save internal representation for internal reference
		_models[this._name] = this;

		// save instance for public reference via `collections.get()`
		_.extend(_models[this._name], {
			model : new Model(),
			class : Model
		});

		// return fresh instance
		return _models[this._name].model;

	};

	/**
	 * @method .id(attributeName)
	 * @public
	 * @prototype
	 * @param attributeName
	 * This one is small but very important if models should be allowed to sync
	 * via REST with most no-sql databases who handle their document ids by the
	 * attribute name of `_id`.
	 * By using `.id()` with the attribute name you want to have mapped with
	 * your model's `id` attribute. For most no-sql case (ex: MongoDB) calling
	 * `.id('_id')` will do the magic. '_id' in this case will end up as
	 * `attributeId` in `Backbone.Model` instance.
	 *
	 * Examples:
	 *
	 *      // map MongoDB _id
	 *      .id('_id');
	 *
	 */
	Model.prototype.id = function (attributeName) {
		this._id = attributeName;
		return this;
	};

	/**
	 * @method .is(mixed, [value])
	 * @public
	 * @prototype
	 * @param mixed
	 * @param value
	 * Sets model's default values.
	 * TODO: make sure that function() as 2nd param is called at .all()
	 *
	 *      // name/value
	 *      .is('firstname', 'Mike');
	 *
	 *      // name/function
	 *      // context is model's `this`
	 *      .is('name', function() {
	 *          return this.firstname + ' ' + this.lastname;
	 *      });
	 *
	 *      // obj of name/value or name/function
	 *      .on({
	 *          'firstname' : 'Mike',
	 *          'name'      : function() {
	 *              return this.firstname + ' ' + this.lastname;
	 *          }
	 *      });
	 *
	 *      // arr of obj of name/function or name/controller
	 *      .on([
	 *          { firstname : 'Mike' },
	 *          { name      : function() {
	 *              return this.firstname + ' ' + this.lastname;
	 *          } }
	 *      ])
	 */
	Model.prototype.is = function (mixed, value) {

		var that = this;

		if (isArray(mixed)) {

			// If first param `mixed` is array it might hold a lot of things:
			// objects, key/value, key/functions, key/strings. Best way to find
			// out is looping throgh array and calling `.is()` recursively.
			_.each(mixed, function (value, key) {
				that.is(value);
			});

		} else if (isObject(mixed)) {

			// If first param `mixed` is an object it could be a single key/
			// function pair or an object of key/function pairs or the same with
			// controller strings instead of functions. To find out loop through
			// object keys and call `.is()` recursively.
			_.each(mixed, function (value, key) {
				that.is(key, value);
			});

		} else {

			// If first param `mixed` is string, next steps depend on type of
			// 2nd param `value`. This might be either a `function` or  something
			// else If it is of type `function`, functions result will be saved
			// ass attibute's value.
			if (isFunction(value)) {

				// TODO: apply model context
				// TODO: test it!
				// TODO: move it to .on('all') event or not?
				// TODO: save it in _maps object for .on('all') mapping?
				// this._defaults[mixed] = value.apply(this, arguments);
				this._maps[mixed] = value;

			} else {
				this._defaults[mixed] = value;
			}

		}

		return this;

	};

	/**
	 * @method .on(mixed, [callback])
	 * @public
	 * @prototype
	 * @param mixed
	 * @param callback(err, evt, ctx, res)
	 * Event subscription method, registers callbacks to native Backbone
	 * events. Callbacks can be controller functions (registered via name string)
	 * or functions. If subscriptions come in with events other than native,
	 * they're considered invalid and therefore will be ignored.
	 *
	 * Callback gets 4 params:
	 *
	 * err : error object
	 * evt : event name
	 * ctx : object of all contexes available (ex: model, collection, view)
	 * res : content varies, may be changes delta in most cases
	 *
	 * Examples:
	 *
	 *      // event/controller
	 *      .on('change', 'team:updateMember');
	 *
	 *      // event/function
	 *      .on('change', function() { ... });
	 *
	 *      // obj
	 *      .on({
	 *          change  : 'team:updateMember',
	 *          destroy : function() { ... }
	 *      });
	 *
	 *      // arr
	 *      .on([
	 *          { change  : 'team:updateMember' },
	 *          { destroy : function() { ... } }
	 *      ])
	 *
	 */
	Model.prototype.on = function (mixed, callback) {

		var that = this;

		if (isArray(mixed)) {

			// If first param `mixed` is array it might hold a lot of things:
			// objects, key/value, key/functions, key/strings. Best way to find
			// out is looping throgh array and calling `.on()` recursively.
			_.each(mixed, function (value, key) {
				that.on(value);
			});

		} else if (isObject(mixed)) {

			// If first param `mixed` is an object it could be a single key/
			// function pair or an object of key/function pairs or the same with
			// controller strings instead of functions. To find out loop through
			// object keys and call `.on()` recursively.
			_.each(mixed, function (value, key) {
				that.on(key, value);
			});

		} else {

			// The list of allowed events that can be triggered by models
			// is limited. Check list of allowed events before adding them,
			// keep in mind that event names can come in two flavours: string
			// or string:attribute.
			var evt = mixed.split(':')[0];
			if (inArray(evt, this._availableEvents) === -1) {
				log('[error] Event `' + evt + '` is no valid model event. ' +
					'Valid events are: ' + this._availableEvents.join(', ') + '.');
				return false;
			}

			// If first param `mixed` is string, next steps depend on type of
			// 2nd param `callback`. This might be either a `function` or a
			// `string` (name) pointing internally to a controller function.
			if (isFunction(callback)) {

				this._events[mixed] = callback;

			} else {

				// If 2nd param `callback` is a string it has to be the name of
				// a internal controller function.
				// Controller functions are grouped by name, therefore strings
				// that point to controller functions come in for `name:function`.
				// to extract controller function from globa `_controllers`
				// object we need to split string first.
				var arr = callback.split(':');
				if (arr.length === 2) {
					this._events[mixed] = _controllers[arr[0]].controller[arr[1]];
				} else {
					log('[error] Could not find controller `' + arr[1] + '` in group `' + arr[0] + '`.' +
						'Please create controller first.');
					this._events[mixed] = noop;
				}

			}

		}

		return this;

	};

	/**
	 * @method .schema(schema)
	 * @public
	 * @prototype
	 * @param schema
	 * Takes object `schema` and defines model's raw schema, means attribute
	 * keys. Attributes values can be functions or internal reference to
	 * validation instance.
	 * Schema definitions will end up to be the `validation` attribute of
	 * `Backbone.Model` instance.
	 * TODO: implement validation
	 *
	 * Examples:
	 *
	 *      // attribute/function or attribute/validation function
	 *      .schema({
	 *          firstname : function() { ... },
	 *          lastname  : 'text:lettersOnly'
	 *      });
	 */
	Model.prototype.schema = function (schema) {
		this._schema = schema;
		return this;
	};





	var _routers = {};

	// ---

	/**
	 * @function routerCreate(context)
	 * @public
	 * @param context
	 * Creates new instance of internal `Router` class.
	 */
	function routerCreate(context) {
		return new Router(context);
	}

	/**
	 * @function routerGet(context, [debug])
	 * @public
	 * @param context
	 * @param debug
	 * Getter for `Router` instances, returns single router instance if
	 * `context` is set to other than null. Otherwise returns object of
	 * router instances. 2nd param set to `true` returns internal
	 * representations of router instances.
	 */
	function routerGet(context, debug) {
		if (context) {
			if (debug) return _routers[context];
			return _routers[context].router;
		} else {
			var obj = {};
			_.each(_routers, function (value, key) {
				if (debug) {
					obj[key] = _routers[key]
				} else {
					obj[key] = _routers[key].router
				}
			});
			return obj;
		}
	}

	// ---

	/**
	 * @constructor Router(context)
	 * @param context
	 * Internal context class object. API sets are saved here. Later
	 * creation of `Backbone.Router` instance is based on stuff stored
	 * here.
	 */
	function Router(context) {

		this._context = context;

		// Internal default options, also working as whitelist for possible
		// options. Incoming options not pre-defined as key are ignored.
		this._options = {

			silent   : false,
			host     : window.location.host || null,
			protocol : window.location.protocol || null

		};

		// Internal representation of routes and callbacks. Will be converted
		// into Backbone `routes` and Backbone `routes callbacks`.
		this._routes = {};

		// Internal representation of router events.
		this._events = {};

		// Internal whitelist of polyfill router events. If user tries to
		// register functions via `.on()`, functions registered for events
		// that don't exist in this list, are ignored.
		this._availableEvents = [
			'away'
			, 'load'
			, 'init'
		];

		return this;

	}

	// ---

	/**
	 * @method .end()
	 * @public
	 * @prototype
	 * Method that puts it's all together, takes resulting attributes of API
	 * calls, does some translation, move-it-here, move-it-there work and
	 * initiates native `Backbone.Router` instance.
	 * Saves instance in `_routers` object (for internal reference) and
	 * returns fresh Backbone router instance.
	 */
	Router.prototype.end = function () {

		var that = this;

		// Routers should be valid in one context only, ex in a context of:
		//
		//      /user
		//
		// you would like to have the routes:
		//
		//      /user/#/login
		//      /user/#/logout
		//      /user/#/profile
		//
		// Therefore you want the `Backbone.Router` to work in /user context but
		// not ex: in /admin, so in case of /admin/#/login the router of
		// context /user will not be executed/initiated at all

		var context = this._context
			, pattern
			, uri;

		// URIs can come in two flavors: with or without hashbang
		uri = window.location.href;
		uri = uri.split(this._options.host)[1]; // remove host

		// check if you're in the right context, if skip routes
		if (context === '/') {
			pattern = window.location.host + context + '#';
		} else {
			pattern = window.location.host + context + '/#';
		}
		if (window.location.href.split(pattern).length < 2) {
			if (window.location.href.split(window.location.host + context).length < 2) {
				return this;
			}
		}

		// For Backkbone routes to work properly, they need to come in the form
		// of {home : 'home'}, attribute's name represents the hash uri (ex:
		// #/home), attribute's value represents the internal event to be
		// triggered if url comes in.
		// To bind callbacks to those events Backbone needs to get the `this.on`
		// form of the router instance.
		var routes = {}
			, callbacks = {}
			, name;

		_.each(this._routes, function (value, key) {

			// Ignore all routes that didn't have a `view` object attached to
			// them while passing `.at()` method.
			if (value) {

				name = key;
				if (key.split('#/').length > 1) {
					// Backbone wants routes to come without leading slashes
					// /#/test -> must be -> test
					name = key.split('#/')[1];
				}

				// special case context route
				if (name === '/') name = '';

				// Save all routes internally in Backbone form
				// trigger saved via `.at()`: #/connect
				// needs to be converted into: connect for Backbone
				routes[name] = value.trigger;

				// Save all callbacks for later binding via Backbone's `.on()`
				// method.
				callbacks[value.trigger] = value.view;

			}

		});

		// Initialize Backbone Router object, use `initialize` method to add
		// routes in Backbone friendly format and bind `view render()` methods
		// as callbacks.
		var Router = Backbone.Router.extend({
			initialize : function () {

				var context = this;

				_.each(callbacks, function (value, key) {

					// Backbone wants event names prefixed with `route:`
					context.on('route:' + key, function () {

						// Check if there is any `load` event registered on this
						// route.
						if (that._events[key] && that._events[key]['load']) {

							that._events[key]['load'](null, 'load', {

								route : that

							}, function (err) {
								if (err) {

									noop();

								} else {

									value.render();

									if (that._events[key] && that._events[key]['init']) {
										that._events[key]['init'](null, 'init', {
											route : that
										});
									}

								}
							})

						} else {

							// Callback of a route event is always a `.render()`
							// method of a view instance.
							value.render();

							if (that._events[key] && that._events[key]['init']) {
								that._events[key]['init'](null, 'init', {
									route : that
								});
							}

						}

					});

				});
			}
		});

		// Save internal representation for internal reference.
		_routers[this._context] = this;


		// Save instance for public reference via `routers.get()`
		// Backbone demands routes coming in via constructor option.
		_.extend(_routers[this._context], {
			router : new Router({
				routes : routes
			})
		});

		// ---

		Backbone.history.start({
			silent : this._options.silent
		});

		//---

		// return fresh instance
		return _routers[this._context].router;

	};

	/**
	 * @method .at(mixed, view)
	 * @public
	 * @prototype
	 * @param mixed
	 * @param view
	 * Binds views to URIs in context of router instance. URI's have to come
	 * in the form of:
	 *
	 *      '#/login'
	 *
	 *      or
	 *
	 *      '/' (for index of current context)
	 *
	 * 2nd param `view` is the name of the view you created via `superbone.View.
	 * create`.
	 *
	 * Examples:
	 * Given that the context this router is working in is '/user' the complete
	 * context URL would look like `http://example.com/user`.
	 * Adding routes via `.at()` means adding hashurls (ex: '/#/login') to the
	 * context URL:
	 *
	 *      // http://example.com/user
	 *      // -> index of context
	 *      .is('/', 'index');
	 *
	 *      // http://example.com/user/#/login
	 *      // -> route within context
	 *      .is('#/login', 'login');
	 *
	 *      // http://example.com/user/#/profile/settings
	 *      // -> route within context
	 *      .is('#/profile/settings', 'settings');
	 */
	Router.prototype.at = function (mixed, view) {

		var that = this;

		if (isArray(mixed)) {

			// If first param `mixed` is array it might hold a lot of things:
			// objects, key/value, key/functions, key/strings. Best way to find
			// out is looping throgh array and calling `.on()` recursively.
			_.each(mixed, function (value, key) {
				that.at(value);
			});

		} else if (isObject(mixed)) {

			// If first param `mixed` is an object it could be a single key/
			// function pair or an object of key/function pairs or the same with
			// controller strings instead of functions. To find out loop through
			// object keys and call `.on()` recursively.
			_.each(mixed, function (value, key) {
				that.at(key, value);
			});

		} else {

			// 2nd param `view` describes view instance. If view instance is
			// not found, route is ignored.
			if (_views[view].view) {

				this._routes[mixed] = {
					trigger : mixed,
					view    : _views[view].view || null
				};

			} else {

				this._routes[mixed] = null;

			}

		}

		return this;

	};

	/**
	 * @method .is(mixed, [value])
	 * @public
	 * @prototype
	 * @param mixed
	 * @param value
	 * Sets Routers init options.
	 *
	 * Examples:
	 *
	 *      // name/value
	 *      .is('host', 'somedomain.com');
	 *
	 *      // name/function
	 *      .is('host', function() {
	 *          return 'somedomain.com';
	 *      });
	 *
	 *      // obj of name/value or name/function
	 *      .is({
	 *          'host'     : 'somedomain.com',
	 *          'protocol' : function() {
	 *              return 'https';
	 *          }
	 *      });
	 *
	 *      // arr of obj of name/function
	 *      .is([
	 *          { host     : 'somedomain.com' },
	 *          { protocol : function() {
	 *              return 'https';
	 *          } }
	 *      ])
	 *
	 */
	Router.prototype.is = function (mixed, value) {

		var that = this;

		if (isArray(mixed)) {

			// If first param `mixed` is array it might hold a lot of things:
			// objects, key/value, key/functions, key/strings. Best way to find
			// out is looping throgh array and calling `.is()` recursively.
			_.each(mixed, function (value, key) {
				that.is(value);
			});

		} else if (isObject(mixed)) {

			// If first param `mixed` is an object it could be a single key/
			// function pair or an object of key/function pairs or the same with
			// controller strings instead of functions. To find out loop through
			// object keys and call `.is()` recursively.
			_.each(mixed, function (value, key) {
				that.is(key, value);
			});

		} else {

			// Check if incoming attribute name is allowed, just check if attribute
			// name is key in default `_options` object.
			if (!this._options.hasOwnProperty(mixed)) return this;

			// If first param `mixed` is string, next steps depend on type of
			// 2nd param `value`. This might be either a `function` or  something
			// else If it is of type `function`, functions result will be saved
			// as attibute's value.
			if (isFunction(value)) {
				this._options[mixed] = value();
			} else {
				this._options[mixed] = value;
			}

		}

		return this;

	};

	/**
	 * @method .on(mixed, [callback])
	 * @public
	 * @prototype
	 * @param mixed
	 * @param callback
	 * Binds superbone router events to callbacks. If incoming router event
	 * is not part of the `this._availableEvents` list of events, it's going
	 * to be ignored.
	 * 1st param mixed contains a string of route and event name separated by
	 * colon (ex: /settings:load), 2nd param can be function or pointer to
	 * superbone controller identified by controller name (ex: 'users:loadProfile').
	 *
	 * Examples:
	 *
	 *      // event/controller
	 *      .on('/profile', 'team:loadProfile');
	 *
	 *      // event/function
	 *      .on('/profile', function() { ... });
	 *
	 *      // obj
	 *      .on({
	 *          '/profile'  : 'team:loadProfile',
	 *          '/profile/settings' : function() { ... }
	 *      });
	 *
	 *      // arr
	 *      .on([
	 *          { '/profile'  : 'team:updateMember' },
	 *          { '/profile/settings' : function() { ... } }
	 *      ])
	 *
	 */
	Router.prototype.on = function (mixed, callback) {

		var that = this;

		if (isArray(mixed)) {

			// incoming array
			_.each(mixed, function (value, key) {
				_.each(value, function (value1, key) {
					that.on(key, value1);
				})
			});

		} else if (isObject(mixed)) {

			// incoming object
			_.each(mixed, function (value, key) {
				that.on(key, value);
			});

		} else {

			var arr
				, routeName
				, eventName;

			// Router events come in the form of `route:event`, so first check
			// if route to be bound to exists. If not ignore, if so check if
			// event is allowed.
			arr = mixed.split(':');
			routeName = arr[0];
			eventName = arr[1];

			// skip!
			if (!this._routes[routeName]) return this;

			// skip!
			if (!inArray(eventName, this._availableEvents)) return this;

			// skip!
			if (!callback) return this;

			// Check if `callback` param is actually a function or a string
			// pointing to a controller. If the latter first check if controller
			// exists.
			if (isFunction(callback)) {

				this._events[mixed] = callback;

			} else {

				// Controllers are namespaced (user:logInUser), separating name-
				// space and controller function name by colon. Try to split string
				// by colon to find controller. Fallback to noop function if no
				// controller could be found.
				if (!this._events[routeName]) this._events[routeName] = {};
				if (!this._events[routeName][eventName]) this._events[routeName][eventName] = {};

				arr = callback.split(':');
				if (arr.length === 2) {
					this._events[routeName][eventName] = _controllers[arr[0]].controller[arr[1]];
				} else {
					this._events[routeName][eventName] = noop;
				}

			}

		}

		return this;

	};





	var _collections = {};

	// ---

	/**
	 * @function isCollection(mixed)
	 * @param mixed
	 * Checks if incoming obj is Backbone `collection` or not, returns true
	 * if so, otherwise false.
	 * TODO: find a better way to check that?
	 */
	function isCollection(mixed) {
		return (mixed.toJSON)
			? true
			: false
	}

	/**
	 * @function getCollection(name, [debug])
	 * @param name
	 * @param debug
	 * Warpper of `collectionGet`, for consistency reasons.
	 * TODO: make this obsolet!
	 */
	function getCollection(name, debug) {
		return collectionGet(name, debug);
	}

	/**
	 * @function collectionCreate(name)
	 * @param name
	 * @public
	 * Creates new instance of internal `Collection` class.
	 */
	function collectionCreate(name) {
		return new Collection(name);
	}

	/**
	 * @function collectionGet(name, [debug])
	 * @public
	 * @param name
	 * @param debug
	 * Getter for `Collection` instances, returns single collection instance
	 * if `name` is set to other than null. Otherwise returns object of
	 * collection instances.
	 * 2nd param set to `true` returns internal representations of collection
	 * instances.
	 */
	function collectionGet(name, debug) {
		if (name) {
			if (debug) return _collections[name];
			return _collections[name].collection;
		} else {
			var obj = {};
			_.each(_collections, function (value, key) {
				if (debug) {
					obj[key] = _collections[key]
				} else {
					obj[key] = _collections[key].collection
				}
			});
			return obj;
		}
	}

	// ---

	/**
	 * @constructor Collection(name)
	 * @param name
	 * Internal collection class object. API sets are saved here. Later creation
	 * of `Backbone.Collection` instance is based on stuff stored here.
	 */
	function Collection(name) {

		// Internal collection name for internal reference, key that collection
		// will be stored under in `_collections` object
		// Todo: need getByName?
		this._name = name;

		// Internal collection binding to model class. All objects hold by
		// collection must be instances of this model class.
		this._model = {};

		// Internal collection events object
		this._events = {};

		// Internal whitelist of native Backbone collection events. If user
		// tries to register functions via `.on()`, functions registered for
		// events that don't exist in this list, are ignored.
		this._availableEvents = [

			'add'
			, 'all'
			, 'change'
			, 'destroy'
			, 'error'
			, 'remove'
			, 'reset'
			, 'sync'

		];

		return this;

	}

	// ---

	/**
	 * @method .end()
	 * @public
	 * @prototye
	 * Method that puts it's all together, takes resulting attributes of API
	 * calls, does some translation, move-it-here, move-it-there work and
	 * initiates native `Backbone.Collection` instance.
	 * Saves instance in `_collections` object (for internal reference) and
	 * returns fresh Backbone collection instance.
	 */
	Collection.prototype.end = function () {

		var that = this;

		var Collection = Backbone.Collection.extend({

			// Constructor function of model this collection is based on, do not
			// use instance of model!
			model : that._model,

			/**
			 * intitialize()
			 * Overwrites Backbone's native `initialize` function. Is called
			 * rigth before Backbone instance is created.
			 */

			initialize : function () {

				// Context (`this`) of Backbone class object
				var context = this;

				// Setup listeners for native Backbone events, callbacks are
				// set via API's `.on()` method and stored in `_.events` obj.
				_.each(that._events, function (value, key) {

					// Backbone is very inconsistent when it comes to passing
					// arguments to callback functions.
					// in Collections expect:
					// a: collection instance
					// b: changes
					// if event is `all` first param is internal event name
					context.on(key, function (a, b, c) {

						// Make events more consistent, always return 3 params:
						// 1. evt name (ex: reset, chnage:attribute)
						var evt = key;

						// 2. context object holding instances of objects event
						// is nested in: model, collection, view
						var ctx = {
							collection : (_.isEmpty(a)) ? null : a,
							model      : (_.isEmpty(b)) ? null : b
						};

						// 3. Backbone's delta obj, representing changes or
						// states
						var res = c || {};

						value.apply(context, evt, ctx, res);

					}, context);

				});

			}

		});

		// save internal representation for internal reference
		_collections[this._name] = this;

		// save instance for public reference via `collections.get()`
		_.extend(_collections[this._name], {
			collection : new Collection()
		});

		// return fresh instance
		return _collections[this._name].collection;

	};

	/**
	 * @method .on(mixed, [callback])
	 * @public
	 * @prototype
	 * Event subscription method, registers callbacks to native Backbone
	 * events. Callbacks can be controller functions (registered via name string)
	 * or functions. If subscriptions come in with events other than native,
	 * they're considered invalid and therefore will be ignored.
	 * TODO: context?
	 * TODO: callback params?
	 *
	 * Examples:
	 *
	 *      // event/controller
	 *      .on('add', 'team:addMember');
	 *
	 *      // event/function
	 *      .on('add', function() { ... });
	 *
	 *      // obj
	 *      .on({
	 *          add    : 'team:addMember',
	 *          change : function() { ... }
	 *      });
	 *
	 *      // arr
	 *      .on([
	 *          { add    : 'team:addMember' },
	 *          { change : function() { ... } }
	 *      ])
	 *
	 * @prototype
	 * @param mixed - native Backbone event or obj of event/callback pairs
	 * @param callback - string pointing to controller function or function
	 */
	Collection.prototype.on = function (mixed, callback) {

		var that = this;

		if (isArray(mixed)) {

			// If first param `mixed` is array it might hold a lot of things:
			// objects, key/value, key/functions, key/strings. Best way to find
			// out is looping throgh array and calling `.on()` recursively.
			_.each(mixed, function (value, key) {
				that.on(value);
			});

		} else if (isObject(mixed)) {

			// If first param `mixed` is an object it could be a single key/
			// function pair or an object of key/function pairs or the same with
			// controller strings instead of functions. To find out loop through
			// object keys and call `.on()` recursively.
			_.each(mixed, function (value, key) {
				that.on(key, value);
			});

		} else {

			// The list of allowed events that can be triggered by collections
			// is limited. Check list of allowed events before adding them,
			// keep in min that event names can come in two flavours: string
			// or string:attribute.
			var evt = mixed.split(':')[0];
			if (inArray(evt, this._availableEvents) === -1) {
				log('[error] Event `' + evt + '` is no valid collection event. ' +
					'Valid events are: ' + this._availableEvents.join(', ') + '.');
				return false;
			}

			// If first param `mixed` is string, next steps depend on type of
			// 2nd param `callback`. This might be either a `function` or a
			// `string` (name) pointing internally to a controller function.
			if (isFunction(callback)) {

				this._events[mixed] = callback;

			} else {

				// If 2nd param `callback` is a string it has to be the name of
				// a internal controller function.
				// Controller functions are grouped by name, therefore strings
				// that point to controller functions come in for `name:function`.
				// to extract controller function from globa `_controllers`
				// object we need to split string first.
				var arr = callback.split(':');
				if (arr.length === 2) {
					this._events[mixed] = _controllers[arr[0]].controller[arr[1]];
				} else {
					log('[error] Could not find controller `' + arr[1] + '` in group `' + arr[0] + '`.' +
						'Please create controller first.');
					this._events[mixed] = noop;
				}

			}

		}

		return this;

	};

	/**
	 * @method .of(mixed, [value])
	 * @prototype
	 * @param mixed
	 * @param value
	 * Adds model class that collection models inherited from to collection
	 * object. Becomes `model` attribute of `Backbone.Collection` instance.
	 * TODO: support only model name?
	 */
	Collection.prototype.of = function (mixed, value) {

		var that = this;

		if (isArray(mixed)) {

			// If incoming first param `mixed` is array it might hold everything
			// from model obejects to strings, so just loop throu it and run .on()
			// on its keys recursively.
			_.each(mixed, function (value, key) {
				that.of(value);
			});

		} else if (isObject(mixed)) {

			// If incoming 1st param `mixed` is object it could be a model object
			// or a object holding model objects with key names. First check if
			// which one of those cases is in front of us.
			// TODO: better way to check than existing .toJSON ?
			if (mixed.toJSON) {

				// If `mixed` obj has method `toJSON` we have a model object in
				// front of us. Get model class `_name` it inherited from to call
				// .of() recursively.
				that.of(mixed._name, mixed);

			} else {

				// If `mixed` is no model object, it can hold a lot of things,
				// just lopp through it and call `.of()` recursivley.
				_.each(mixed, function (value, key) {
					that.of(value);
				});

			}

		} else {

			// Check if 2nd param `value` does exist, if not incoming `mixed`
			// string has to be the name of an existing model. If not, `mixed`
			// will only be the key where model being hold by 2nd param `value`
			// is going to be saved.
			if (value) {

				// 2nd param `value` must be model object
				this._model = value;

			} else {

				// `mixed` should be existing model, check global models
				// object if we know it by name (`mixed`)
				if (_models[mixed]) {
					this._model = _models[mixed].class; // use class(!), not instance
				} else {
					log('[error] Model not `' + mixed + '` not found.');
				}

			}

		}

		return this;

	};





	var _views = {};
	var _views_config = {};

	// ---

	/**
	 * @function viewCreate(name)
	 * @param name
	 */
	function viewCreate(name) {
		return new View(name);
	}

	/**
	 * @function viewGet(name, [raw])
	 * @param name
	 * @param debug
	 */
	function viewGet(name, debug) {
		if (name) {
			if (debug) return _views[name];
			return _views[name].view;
		} else {
			var obj = {};
			_.each(_views, function (value, key) {
				if (debug) {
					obj[key] = _views[key]
				} else {
					obj[key] = _views[key].view
				}
			});
			return obj;
		}
	}

	// ---

	/**
	 * @constructor View(name)
	 * @param name
	 * TODO: ??? move all optional attributes to _attributes
	 * TODO: ??? add get/set for _attributes
	 */
	function View(name) {

		// View name for later reference, will also be the object key this view
		// will be stored in `_views` cache object
		this._name = name;

		// Default view settings, all settings can be overwritten using shortcut
		// methods `.as()`, `.in()` and `.is()`.
		this._config = {

			class     : 'view', // hide/show class, used to toggle views
			container : '#main', // views' container
			engine    : 'jade', // rendering engine
			ext       : '.jade', // template file extension
			folder    : '/views'    // views folder

		};

		// Holds all view events, `DOM` events later become Backbone's native
		// view `event` callbacks, `native` become native Backbone `collection`
		// events' callbacks.
		this._events = {};
		this._eventsNative = {};

		// List of native `Backbone` collection events, taken in consideration
		// if user tries to register functions via `.on()`,
		// function registered for events that don'texist are ignored. For
		// Backbone `collections` all native `collection` are available, for
		// data objects only `chnage` events is supported.
		this._availableEvents = [

			'add'
			, 'change'
			, 'destroy'
			, 'error'
			, 'remove'
			, 'reset'
			, 'sync'

		];

		// DOM element rendered template is injected into, defaults to `div`
		// element with `this._name` as `id` value. If not in DOM already it's
		// going to be created and appended to `this._config.container` element,
		// in that case `this._name` is added as `id` value and `this._config.
		// class` is added as `class` attribute.
		this._in = this._config.container;

		// DOM `class` attribute that is shared by all views (or group of views).
		// Used to toggle visibility of views. Defaults to `this._config.class`.
		this._as = this._config.class;

		// Template `file` and `id` of surrounding `<script>` tag, used to
		// load file and extract markup. One file can hold n `<script>`
		// blocks of markup, defaults to `index`. File names do not have to
		// include extension, it's set automatically based on view engine
		// selection.
		this._tpl = {

			file : name, // defaults to view name
			id   : name  // defaults to view name

		};

		// Objects that feed the view with data. Incoming Backone `collections`
		// will be bound to Backbone `collections` events, incoming plain data
		// (json) objects are bound to `change` event.
		this._data = {};
		this._collections = {};

		// Save pre-build model data in cache object for later reference.
		_views[this._name] = this;

		return this;

	}

	// ---

	/**
	 * @method .end()
	 * @public
	 * @prototype
	 * Method that puts it all together, takes resulting attributes of API
	 * calls, does some translation, move-it-here, move-it-there work and
	 * initiates native `Backbone.View` instance.
	 * Saves instance in `_views` object (for internal reference) and
	 * returns fresh Backbone view instance.
	 */
	View.prototype.end = function () {

		var that = this;

		// Check if `container` is already in the DOM, if not
		// create it.
		if ($(this._config.container).length === 0) {

			$(document
				.createElement('div'))
				.attr('id', that._config.container.substr(1))
				.appendTo('body');

		}

		// Check if `box` is already in the DOM, if not create
		// it within main container.
		if ($(this._config.box, $(that._config.container)).length === 0) {

			$(document
				.createElement('div'))
				.attr('id', that._tpl.id)
				.attr('class', that._config.class)
				.appendTo(that._config.container);

		}

		var View = Backbone.View.extend({

			// View's root element. Required by `Backbone` to set scope and
			// bind events to it. Must be part of the DOM(!) before
			// `.initialize()` is called. Comes as jQuery object.
			el : $('#' + that._tpl.id),

			/**
			 * intitialize()
			 * Overwrites Backbone's native initialize function. Is called
			 * before instance is created.
			 */
			initialize : function () {

				var context = this;

				// Add Backbone `collections` to view and bind collection
				// events to each one of them.
				this.collections = that._collections;
				_.each(that._availableEvents, function (value, key) {
					_.each(context.collections, function (value1, key1) {
						context.collections[key1].on(value, function (a, b, c) {
							if (that._eventsNative[value + ':' + key1]) {
								that._eventsNative[value + ':' + key1](a, b, c)
							}
						}, context);
					});
				});

				// Add plain data objects to view and bind data events to each
				// one of them.
				this.data = that._data;

				// DOM events obj
				this.events = {};
				_.each(that._events, function (value, key) {
					context.events[key] = function (evt) {

						// TODO: move to .event() method

						var model
							, ctx = {}
							, collection
							, err = null
							, id
							, el;

						// Prevent native browser event from firing.
						evt.preventDefault();

						// Get jQuery obj of the element that triggered the
						// DOM event.
						el = $(evt.currentTarget);

						// Get id of jQuery obj that triggered event, if it has
						// no id walk up the DOM via `.closest()` to get the
						// first parent one that has `id` attribute. If nothing
						// found fallback to `false`.
						id = (typeof el.attr('id') !== 'undefined' && el.attr('id') !== false)
							? el.attr('id')
							: el.closest('[id]').attr('id') || null;
						id = $('#' + id);


						// Get collection obj of collection that is bound to the
						// view the event was triggered from. If no collection
						// bound to the view, fallback to `false`.
						if (!_.isEmpty(context.collection)) {
							collection = context.collection || null;
						}

						// If collection is bound to the view the event was
						// triggered from, try to find model object that might
						// be involved in this event by using DOM `id`.
						if (!_.isEmpty(context.collection)) {
							model = context.collection.get(id) || null;
						}

						// Merge all context objects into one callback param
						ctx = {
							el         : el,
							id         : id,
							model      : model,
							collection : collection
						};

						value(err, evt, ctx);

					}
				});

				// Holds rendering configuration, depends on used engine, file
				// types, etc.
				this.config = that._config;

				// Holds everything needed to compile and render templates from
				// external template file by using json data object for contents.
				this.template = {

					// Global data object for use in templates
					data     : {},

					// Template cache objects, `template_rendered` holds cached
					// rendered template, `template_compiled` holds compiler
					// function or plain markup, based on template engine
					// selection.
					rendered : '',
					compiled : '',

					// Path to template file based on 'config.folder', `tpl_file`
					// and `config.ext`
					file     : this.config.folder + '/' + that._tpl.file + this.config.ext,

					// Specify where to inject rendered template. Comes as jQuery
					// object.
					target   : $('#' + that._tpl.id, $(that._in))

				};

				// Force leading '/', path must be relative to base path
				if (this.template.file.charAt(0) !== '/') {
					this.template.file = '/' + this.template.file;
				}

			},

			/**
			 * render()
			 * Loads markup from file (if markupo is not loaded yet - cached),
			 * compiles markup (if not compiled yet -> cached) using the render
			 * engine specified in `config.engine` and injects rendered template
			 * into DOM using jQuery's `.html()` on target specified in
			 * `template_target`.
			 */
			render : function () {

				var context = this;

				// hide all views
				$('.' + that._config.class).hide();

				// add data from collections and plain data objects to template's
				// global data object
				_.each(this.collections, function (value, key) {
					context.template.data[key] = value.toJSON();
				});
				_.each(this.data, function (value, key) {
					context.template.data[key] = value;
				});

				switch (context.config.engine) {

					case 'jqtpl' :

						// TODO: implemet jqtpl renderer

						break;

					default : // jade

						superflow
							.seq(function (cb) {

								/**
								 * Loads markup from template file if markup is not
								 * cached yet. once loaded it adds markup to view's
								 * cache.
								 * @skip
								 * Skipped if already in cache.
								 * @seq
								 */

								// skip!
								if (context.template.compiled) return cb();

								superagent
									.get(context.template.file)
									.end(function (res) {
										if (res.ok) {

											// If template file was found, compile markup using native
											// `jade` compiler  and cache compiled markup for later
											// rendering.
											context.template.compiled = jade.compile($(res.text).html());

											cb();

										} else {
											if (res.status === 404) {
												log('[error][' + res.status + '] Template file not found.');
											} else {
												log('[error][' + res.status + '] Unknown error.');
											}
										}
									});

							})
							.seq(function (cb) {

								/**
								 * Renders template using `collection` data.
								 * @seq
								 */

								context.template.rendered = context.template.compiled({
									data : context.template.data
								});

								// inject & show
								context.template.target
									.html(context.template.rendered)
									.show();

								cb();

							})
							.end();

						break;

				}

			}

		});

		_views[this._name] = this;

		_.extend(_views[this._name], {
			view : new View()
		});

		return _views[this._name].view;

	};

	/**
	 * @method .as(selector)
	 * @public
	 * @prototype
	 * @param selector
	 * Sets `class` attribute of aparent view element. Used to group views
	 * by CSS classes, defaults to `.view`.
	 */
	View.prototype.as = function (selector) {
		this._as = selector;
		return this;
	};

	/**
	 * @method .in(selector)
	 * @public
	 * @prototype
	 * @param selector
	 * Sets target container where view markup will be appended to. Defaults
	 * to `main`. If container does not exist it will be created during `.end()`
	 * wrap up.
	 */
	View.prototype.in = function (selector) {
		this._in = selector;
		return this;
	};

	/**
	 * @method .is(mixed, [value])
	 * @public
	 * @prototype
	 * @param mixed
	 * @param value
	 * Sets template configurations: file, id (of parent div), accepts
	 * key/value pairs, objects and arrays.
	 */
	View.prototype.is = function (mixed, value) {

		var that = this;

		if (isArray(mixed)) {

			// If first param `mixed` is array it might hold a lot of things:
			// objects, key/value, key/functions, key/strings. Best way to find
			// out is looping throgh array and calling `.is()` recursively.
			_.each(mixed, function (value, key) {
				that.is(value);
			});

		} else if (isObject(mixed)) {

			// If first param `mixed` is an object it could be a single key/
			// function pair or an object of key/function pairs or the same with
			// controller strings instead of functions. To find out loop through
			// object keys and call `.is()` recursively.
			_.each(mixed, function (value, key) {
				that.is(key, value);
			});

		} else {

			// Save key/value pairs, if incoming mixed attribute is allowed, means
			// if attribute is in `this._tpl` default object.
			// TODO: need function use case?
			if (this._tpl.hasOwnProperty(mixed)) {
				this._tpl[mixed] = value;
			}

		}

		return this;

	};

	/**
	 * @method .of(mixed, [value])
	 * @prototype
	 * @param mixed
	 * @param value
	 * Binds collections to views. Means that their native Backbone
	 * `_attributes` contents are available as global object in
	 * template. Incoming name will be used as global object key to
	 * be used in template.
	 * Collections ldata will extracted using `Backbone.Collection`s
	 * `toJSON()` method.
	 */
	View.prototype.of = function (mixed, value) {

		var that = this
			, json = this._data
			, collections = this._collections;

		function add(type, obj, name) {
			if (type === 'collection') {
				if (name) {
					collections[name] = obj;
				} else {
					collections[obj.get('name')] = obj;
				}
			} else {
				if (name) {
					json[name] = obj;
				} else {
					json['data'] = obj;
				}
			}
		}

		if (isArray(mixed)) { // incoming array

			_.each(mixed, function (value, key) {
				that.of(value);
			});

		} else if (isObject(mixed)) { // incoming object

			if (isCollection(mixed)) {
				add('collection', mixed);
			} else {
				_.each(mixed, function (value, key) {
					if (isCollection(value)) {
						add('collection', value, key);
					} else {
						add('json', value, key);
					}
				});
			}

		} else { // incoming key/value pair

			if (value) {

				// If Backbone `collection` add to collection obj, if not it's
				// plain json obj, add to data object, defaults to empty object
				// in this case
				if (isCollection(value)) {
					add('collection', value, mixed);
				} else {
					add('json', value, mixed);
				}

			} else {

				// No value param, incoming `mixed` might be a name pointing
				// to a collection instance
				var collection = getCollection(mixed);
				if (isCollection(collection)) {
					add('collection', collection, mixed);
				} else {
					log('[error] Collection `' + mixed + '` could not be found. ' +
						'Please create collection first.');
				}

			}

		}

		return this;

	};

	/**
	 * @method .on(mixed, [callback])
	 * @prototype
	 * @param mixed
	 * @param callback
	 * Binds callbacks to view events. It's a convenient wrapper for
	 * Backbone's `events` attribute. Callbacks can be functions and
	 * pointers to superbone controllers (ex: user:loginUser).
	 */
	View.prototype.on = function (mixed, callback) {

		var that = this;

		if (isArray(mixed)) {

			// incoming array
			_.each(mixed, function (value, key) {
				_.each(value, function (value1, key) {
					that.event(key, value1);
				})
			});

		} else if (isObject(mixed)) {

			// incoming object
			_.each(mixed, function (value, key) {
				that.event(key, value);
			});

		} else {

			// incoming key/value pair
			// Check if native or DOM event. Native events come in form of
			// `reset:foo` (triggered if collection `foo` fires events 'reset'),
			// DOM events do not contain colons (`click a.foo-bar`)
			var eventName = mixed.split(':');
			if (eventName.length === 2 && inArray(eventName[0], that._availableEvents) > -1) {

				// native!
				this._eventsNative[mixed] = callback;


			} else {

				// Check if incoming first param `mixed` is object, if so iterate on
				// hashes and call `.event()` recursively, therefore adding events to
				// `event` object
				if (isObject(mixed)) {
					_.each(mixed, function (value, key) {
						that.event(key, value);
					});
					return this;
				}

				// If param `callback` is string look up main `controller` object for
				// key, if found add controller function as event callback, if not add
				// `noop` as callback placeholder.
				if (_.isFunction(callback)) {
					this._events[mixed] = callback;
				} else {

					// Controllers are namespaced (user:logInUser), separating name-
					// space and controller function name by colon. Try to split string
					// by colon to find controller. Fallback to noop function if no
					// controller could be found.
					var arr = callback.split(':');
					if (arr.length === 2) {
						this._events[mixed] = _controllers[arr[0]].controller[arr[1]];
					} else {
						this._events[mixed] = noop;
					}

				}

			}

		}

		return this;

	};





	exports = {

		version    : version,
		noConflict : noConflict,

		// ---

		collections : {
			get : collectionGet
		},
		Collection  : {
			create : collectionCreate
		},
		models      : {
			get : modelGet
		},
		Model       : {
			create : modelCreate
		},
		controllers : {
			get : controllerGet
		},
		Controller  : {
			create : controllerCreate
		},
		routers     : {
			get : routerGet
		},
		Router      : {
			create : routerCreate
		},
		views       : {
			get : viewGet
		},
		View        : {
			create : viewCreate
		}

	};

	return exports;





}({});

