/*! F - v0.2.0 - 2013-05-13
* https://lazd.github.com/Class/
* Copyright (c) 2013 Larry Davis <lazdnet@gmail.com>; Licensed BSD */
/*
	Class - JavaScript inheritance

	Construction:
		Setup and construction should happen in the construct() method.
		The construct() method is automatically chained, so all construct() methods defined by superclass methods will be called first.

	Initialization:
		Initialziation that needs to happen after all construct() methods have been called should be done in the init() method.
		The init() method is not automatically chained, so you must call _super() if you intend to call the superclass' init method.
		init() is not passed any arguments

	Destruction:
		Teardown and destruction should happen in the destruct() method. The destruct() method is also chained.

	Mixins:
		An array of mixins can be provided with the mixins[] property. An object or the prototype of a class should be provided, not a constructor.
		Mixins can be added at any time by calling this.mixin(properties)

	Usage:
		var MyClass = Class(properties);
		var MyClass = new Class(properties);
		var MyClass = Class.extend(properties);

	Credits:
		Inspired by Simple JavaScript Inheritance by John Resig http://ejohn.org/

	Usage differences:
		construct() is used to setup instances and is automatically chained so superclass construct() methods run automatically
		destruct() is used  to tear down instances. destruct() is also chained
		init(), if defined, is called after construction is complete and is not chained
		toString() can be defined as a string or a function
		mixin() is provided to mix properties into an instance
		properties.mixins as an array results in each of the provided objects being mixed in (last object wins)
		_super is passed as an argument (not as this._super) and can be used asynchronously
*/
(function(global) {
	// Used for default initialization methods
	var noop = function() {};

	// Given a function, the superTest RE will match if _super is the first argument to a function
	// The function will be serialized, then the serialized string will be searched for _super
	// If the environment isn't capable of function serialization, make it so superTest.test always returns true
	var superTest = /xyz/.test(function(){return 'xyz';}) ? /\(\s*_super\b/ : { test: function() { return true; } };

	// Remove the _super function from the passed arguments array
	var removeSuper = function(args, _super) {
		// For performance, first check if at least one argument was passed
		if (args && args.length && args[0] === _super)
			args = Array.prototype.slice.call(args, 1);
		return args;
	};

	// Bind an overriding method such that it gets the overridden method as its first argument
	var superify = function(name, func, superPrototype, isStatic) {
		var _super;

		// We redefine _super.apply so _super is stripped from the passed arguments array
		// This allows implementors to call _super.apply(this, arguments) without manually stripping off _super
		if (isStatic) {
			// Static binding: If the passed superPrototype is modified, the bound function will still call the ORIGINAL method
			// This comes into play when functions are mixed into an object that already has a function by that name (i.e. two mixins are used)
			var superFunc = superPrototype[name];
			_super = function _superStatic() {
				return superFunc.apply(this, arguments);
			};

			_super.apply = function _applier(context, args) {
				return Function.prototype.apply.call(superFunc, context, removeSuper(args, _super));
			};
		}
		else {
			// Dynamic binding: If the passed superPrototype is modified, the bound function will call the NEW method
			// This comes into play when functions are mixed into a class at declaration time
			_super = function _superDynamic() {
				return superPrototype[name].apply(this, arguments);
			};

			_super.apply = function _applier(context, args) {
				return Function.prototype.apply.call(superPrototype[name], context, removeSuper(args, _super));
			};
		}

		// Name the function for better stack traces
		return function _passSuper() {
			// Add the super function to the start of the arguments array
			var args = Array.prototype.slice.call(arguments);
			args.unshift(_super);

			// Call the function with the modified arguments
			return func.apply(this, args);
		};
	};

	// Mix the provided properties into the current context with the ability to call overridden methods with _super()
	var mixin = function(properties, superPrototype) {
		// Use this instance
		superPrototype = superPrototype || this.constructor && this.constructor.prototype;
		
		// Copy the properties onto the new prototype
		for (var name in properties) {
			// Never mix construct or destruct
			if (name === 'construct' || name === 'destruct')
				continue;

			// Check if the function uses _super
			// It should be a function, the super prototype should have a function by the same name
			// And finally, the function should take _super as its first argument
			var usesSuper = superPrototype && typeof properties[name] === 'function' && typeof superPrototype[name] === 'function' && superTest.test(properties[name]);

			if (usesSuper) {
				// Wrap the function such that _super will be passed accordingly
				if (this.hasOwnProperty(name))
					this[name] = superify(name, properties[name], this, true);
				else
					this[name] = superify(name, properties[name], superPrototype, false);
			}
			else {
				// Directly assign the property
				this[name] = properties[name];
			}
		}
	};

	// The base Class implementation acts as extend alias, with the exception that it can take properties.extend as the Class to extend
	var Class = function(properties) {
		// If a class-like object is passed as properties.extend, just call extend on it
		if (properties && properties.extend)
			return properties.extend.extend(properties);

		// Otherwise, just create a new class with the passed properties
		return Class.extend(properties);
	};
	
	// Add the mixin method to all classes created with Class
	Class.prototype.mixin = mixin;
	
	// Creates a new Class that inherits from this class
	// Give the function a name so it can refer to itself without arguments.callee
	Class.extend = function extend(properties) {
		var superPrototype = this.prototype;
		
		// Create an object with the prototype of the superclass
		var prototype = Object.create(superPrototype);
		
		if (properties) {
			// Mix the new properties into the class prototype
			// This does not copy construct and destruct
			mixin.call(prototype, properties, superPrototype);
			
			// Mix in all the mixins
			// This also does not copy construct and destruct
			if (Array.isArray(properties.mixins)) {
				for (var i = 0, ni = properties.mixins.length; i < ni; i++) {
					// Mixins should be _super enabled, with the methods defined in the prototype as the superclass methods
					mixin.call(prototype, properties.mixins[i], prototype);
				}
			}
			
			// Chain the construct() method (supermost executes first) if necessary
			if (properties.construct && superPrototype.construct) {
				prototype.construct = function() {
					superPrototype.construct.apply(this, arguments);
					properties.construct.apply(this, arguments);
				};
			}
			else if (properties.construct)
				prototype.construct = properties.construct;
			
			// Chain the destruct() method in reverse order (supermost executes last) if necessary
			if (properties.destruct && superPrototype.destruct) {
				prototype.destruct = function() {
					properties.destruct.apply(this, arguments);
					superPrototype.destruct.apply(this, arguments);
				};
			}
			else if (properties.destruct)
				prototype.destruct = properties.destruct;
			
			// Allow definition of toString as a string (turn it into a function)
			if (typeof properties.toString === 'string') {
				var className = properties.toString;
				prototype.toString = function() { return className; };
			}
		}

		// Define construct and init as noops if undefined
		// This serves to avoid conditionals inside of the constructor
		if (typeof prototype.construct !== 'function')
			prototype.construct = noop;
		if (typeof prototype.init !== 'function')
			prototype.init = noop;

		// The constructor handles creating an instance of the class, applying mixins, and calling construct() and init() methods
		function Class() {
			// Optimization: Requiring the new keyword and avoiding usage of Object.create() increases performance by 5x
			if (this instanceof Class === false) {
				throw new Error('Cannot create instance without new operator');
			}
			
			// Optimization: Avoiding conditionals in constructor increases performance of instantiation by 2x
			this.construct.apply(this, arguments);
			this.init();
		}
		
		// Store the extended class' prototype as the prototype of the constructor
		Class.prototype = prototype;
		
		// Assign prototype.constructor to the constructor itself
		// This allows instances to refer to this.constructor.prototype
		// This also allows creation of new instances using instance.constructor()
		Class.prototype.constructor = Class;

		// Store a reference to the superPrototype
		Class.prototype.superPrototype = superPrototype;
		
		// Add extend() as a static method on the constructor
		Class.extend = extend;
		
		return Class;
	};
	
	if (typeof module !== 'undefined' && module.exports) {
		// Node.js Support
		module.exports = Class;
	}
	else if (typeof global.define === 'function') {
		(function(define) {
			// AMD Support
			define(function() { return Class; });
		}(global.define));
	}
	else {
		// Browser support
		global.Class = Class;
	}
}(this));

/** 
 * The main F namespace.
 *	
 * @namespace
 *
 * @property {Object} options						Options for all F components.
 * @param {Boolean} options.debug					If true, show debug messages for all components.
 * @param {Boolean} options.precompiledTemplates	Set to false if you need Handlebars.template() called on your templates
*/
var F = F || {};

try {
	window['ƒ'] = F;
}
catch (err) {
	console.log("ƒ: could not set ƒ variable");
}

F.options = {
	debug: false,
	precompiledTemplates: true
};

// Let F be a global event hub
 _.extend(F, Backbone.Events);

/**
 * Extend the view of the provided component with a deep copy of the events property
 *
 * @param {Object} component	Component whose view should be extended
 * @param {String} properties	Properties to mix in to resulting view
 *
 * @todo add pushToArray option to always push to an array
 *
 * @returns {F.Component}	this, chainable
 */
F.extendView = function(component, properties) {
	var view = component.prototype.View || component.prototype.ListView;
	if (view) {
		properties.events = _.extend({}, view.prototype.events, properties.events);
		return view.extend(properties);
	}
};

/**
 * Add a value to a property that should become an array when and only when collisions occurr
 *
 * @param {Object} object	Object to set the property on
 * @param {String} prop		Proprety to set
 * @param {Mixed} Value		Value to set
 *
 * @todo add pushToArray option to always push to an array
 */
F.addToSet = function(obj, prop, value) {
	if (typeof obj[prop] !== 'undefined') {
		// Turn it into an array
		if (!_.isArray(obj[prop]))
			obj[prop] = [obj[prop]];
		
		// Push the new value
		obj[prop].push(value);
	}
	else {
		// Directly set the value if there is only one
		obj[prop] = value;
	}
};

/**
 * Set a property of an object using dot notiation
 *
 * @param {Object} object		Optional object to set the property on. A new object will be created if no object was passed.
 * @param {String} prop			Proprety to set
 * @param {Value} prop			The new value
 * @param {Boolean} makeArrays	Use F.addToSet on the property to 
 *
 * @todo add push option to always push to an array
 *
 * @returns {Object}	Object the property was set on or the created object
 */
F.set = function(obj, prop, value, makeArrays) {
	if (!obj) obj = {};
	
	var propParts = prop.split('.');
	
	if (propParts.length > 1) {
		var curObj = obj;
		propParts.forEach(function(part, index) {
			if (index === propParts.length-1) { // Set the value if we've reached the end of the chain
				if (makeArrays)
					F.addToSet(curObj, part, value);
				else 
					curObj[part] = value;
			}
			else {
				if (typeof curObj[part] === 'undefined') // Define the part if it's not defined
					curObj[part] = {};
				
				curObj = curObj[part]; // Drill inward
			}
		});
	}
	else {
		if (makeArrays)
			F.addToSet(obj, prop, value);
		else 
			obj[prop] = value;
	}
	
	return obj;
};

/**
 * Provides observer pattern for basic eventing. Directly uses Backbone.Events
 *
 * @class
 */
F.EventEmitter = new Class(
	Backbone.Events

	/**
		Bind one or more space separated events, or an events map,
		to a `callback` function. Passing `"all"` will bind the callback to
		all events fired.
	
		@name on
		@memberOf F.EventEmitter.prototype
		@function
	*/
	
	/**
		Bind events to only be triggered a single time. After the first time
		the callback is invoked, it will be removed.
		
		@name once
		@memberOf F.EventEmitter.prototype
		@function
	*/
	
	/**
		Remove one or many callbacks. If `context` is null, removes all
		callbacks with that function. If `callback` is null, removes all
		callbacks for the event. If `events` is null, removes all bound
		callbacks for all events.
		
		@name off
		@memberOf F.EventEmitter.prototype
		@function
	*/
	
	/**
		Trigger one or many events, firing all bound callbacks. Callbacks are
		passed the same arguments as `trigger` is, apart from the event name
		(unless you're listening on `"all"`, which will cause your callback to
		receive the true name of the event as the first argument).
		
		@name trigger
		@memberOf F.EventEmitter.prototype
		@function
	*/
	
	/**
		An inversion-of-control version of `on`. Tell *this* object to listen to
		an event in another object ... keeping track of what it's listening to.
		
		@name listenTo
		@memberOf F.EventEmitter.prototype
		@function
	*/

	/**
		Tell this object to stop listening to either specific events ... or
		to every object it's currently listening to.
	
		@name stopListening
		@memberOf F.EventEmitter.prototype
		@function
	*/
);
(function() {
	// A couple functions required to override delegateEvents
	var delegateEventSplitter = /^(\S+)\s*(.*)$/;
	var getValue = function(object, prop) {
		if (!(object && object[prop])) return null;
		return _.isFunction(object[prop]) ? object[prop]() : object[prop];
	};
	
	F.View = Backbone.View.extend(/** @lends F.View# */{
		/**
		 * Generic view class. Provides rendering and templating based on a model, eventing based on a component, and element management based on a container or existing element
		 *
		 * @constructs
		 *
		 * @param {Object} options	Options for this view
		 * @param {Template} options.template	The template to render this view with
		 * @param {Element} [options.el]		The element, jQuery selector, or jQuery object to render this view to. Should not be used with options.container
		 * @param {Element} [options.container]	The element, jQuery selector, or jQuery object to insert this components element into. Should not be used with options.el
		 * @param {Backbone.Model} [options.model]	Instance of a Backbone model to render this view from
		 * @param {Component} [options.component]	The component that events should be delegated to
		 * @param {Object} [options.events]		Backbone events object indicating events to listen for on this view
		 *
		 * @property {Template} template		The template to render this view with
		 *
		 */
		initialize: function() {
			if (this.options.container !== undefined && this.options.el !== undefined) {
				throw new Error('View: should provide either options.el or options.container, never both');
			}
			
			var template = this.options.template || this.template;
			if (template) {
				if (F.options.precompiledTemplates)
					this.template = template;
				else // For pre-compiled templates
					this.template = Handlebars.template(template);
			}
			
			// Always call in our scope so parents can remove change listeners on models by referencing view.render
			this.render = this.render.bind(this);
			
			if (this.options.el) {
				// Make sure the element is of the right tag
				var actualNodeName = this.$el[0].nodeName.toUpperCase();
				var requiredNodeName =  this.tagName.toUpperCase();
				
				// TBD: Revisit this check later; must be a better way to allow any node
				if (this.tagName !== 'div' && actualNodeName !== requiredNodeName) {
					throw new Error('View: cannot create view, incorrect tag provided. Expected '+requiredNodeName+', but got '+actualNodeName);
				}
			
				// Add the CSS class if it doesn't have it
				this.$el.addClass(this.className);
			}
			
			// Store container, if provided
			this.container = this.options.container;
			
			// Store the controlling component
			this.component = this.options.component;
			
			// Add events
			if (this.options.events)
				this.delegateEvents(this.options.events);

			// Store the model
			if (this.options.model)
				this.setModel(this.options.model);
			
			this.rendered = null;
		},
		
		setModel: function(model) {
			// Unsubscribe from old model's change and render event in case view.remove() was not called
			if (this.model && this.model.off)
				this.stopListening(this.model);
			
			this.model = model;
			
			// Either the view or the component can have noRerender
			var noRerender = this.options.noRerender || (this.options.component && this.options.component.options.noRerender);
			
			// Add change listeners to the model, but only if has an on method
			if (this.model && this.model.on && !noRerender)
				this.listenTo(this.model, 'change', this.render);
			
			this.rendered = null;
		},
		
		/**
		 * Get the number of milliseconds seconds since the view was last rendered
		 *
		 * @returns {number} Number of milliseconds since this view was rendered
		 */
		age: function() {
			return this.rendered !== null ? new Date().getTime() - this.rendered : -1;
		},
		
		/**
		 * Remove this view from the DOM and stop listening to model change events
		 */
		remove: function() {
			this.$el.remove();
		
			// Remove change listeners
			if (this.model && this.model.off)
				this.stopListening();
		},
		
		/**
		 * Show the view. The view will be rendered before it is shown if it hasn't already been rendered
		 *
		 * @returns {F.View}	this, chainable
		 */
		show: function() {
			// Ensure the view is rendered
			if (this.template) {
				this.renderOnce();
			}
			
			// Show the view
			this.$el.show();
			
			return this;
		},
	
		/**
		 * Hide the view
		 *
		 * @returns {F.View}	this, chainable
		 */
		hide: function() {
			// Hide the view
			this.$el.hide();
		
			return this;
		},
	
		/**
		 * Render the view only if it has not been rendered before (or has been reset)
		 *
		 * @returns {F.View}	this, chainable
		 */
		renderOnce: function() {
			// Only render the view if it has never been rendered
			if (this.rendered === null) {
				this.render();
			}
		
			return this;
		},

		inDebugMode: function() {
			// Check if the component or F itself is in debug mode
			return F.options.debug || (this.component && this.component.options.debug); 
		},

		/**
		 * Render the view
		 *
		 * @returns {F.View}	this, chainable
		 */
		render: function() {
			if (this.inDebugMode()) {
				console.log('%s: Rendering view...', this.component && this.component.toString() || 'Orphaned view');
			}
			
			// Render template
			if (this.template) {
				// Use this view's model, or the model of the component it's part of
				var model = this.model || (this.component && this.component.model);
				
				// First, see if the model exists. If so, see if it has toJSON. If so, use model.toJSON. Otherwise, if model exists, use model. Otherwise, use {}
				this.$el.html(this.template(model && model.toJSON && model.toJSON() || model || {}));
			}
			
			// Add to container, if not already there
			if (this.container && !$(this.el.parentNode).is(this.container)) {
				$(this.container).append(this.el);
			}
		
			// Store the last time this view was rendered
			this.rendered = new Date().getTime();
			
			// Notify render has completed
			this.trigger('renderComplete');
			
			return this;
		},
		
		/**
		 * Delegate events to this view. This overrides Backbone.View.delegateEvents and lets us specify an object to call methods on instead of the view
		 *
		 * @param {Object} events	Events hash to delegate
		 *
		 * @returns {F.View}	this, chainable
		 */
		delegateEvents: function(events) {
			if (!(events || (events = getValue(this, 'events')))) return;
			this.undelegateEvents();
			for (var key in events) {
				var method = events[key];
				
				var base = this.component;
						
				if (!_.isFunction(method)) {
					if (this.component) {
						var parts = events[key].split('.');
						
						if (parts.length > 1) {
							method = this.component;
						
							for (var i = 0; i < parts.length; i++) {
								var part = parts[i];
							
								// console.log('Looking for part ', part, 'in ', method);
								base = method;
								method = method[part];
							
								if (!method) {
									// console.warn('Could not find method %s', key);
									break;
								}
							}
						}
						else
							method = this.component[events[key]];
					}
					else {
						method = this[events[key]];
					}
				}
				
				if (!method) throw new Error('Method "' + events[key] + '" does not exist');
				
				var match = key.match(delegateEventSplitter);
				var eventName = match[1], selector = match[2];

				// Execute in the scope of the base
				// TBD: determine if we ought to execute in the scope of the view itself ever?
				//		or leave that up to implementors to pass a bound function
				method = this.component ? _.bind(method, base) : _.bind(method, this);
				
				eventName += '.delegateEvents' + this.cid;
				if (selector === '') {
					this.$el.bind(eventName, method);
				} else {
					this.$el.delegate(selector, eventName, method);
				}
			}
			
			return this;
		}
	});
}());

(function() {
	function decapitalize(str) {
		return str.slice(0, 1).toLowerCase()+str.slice(1);	
	}
	
	F.Component = new Class(/** @lends F.Component# */{
		toString: 'Component',
		extend: F.EventEmitter,
		
		options: {
			singly: false, // Show only one subcomponent at a time
			visible: false, // Visible immediately or not
			debug: false
		},
		
		/**
		 * Generic component class
		 *
		 * @extends F.EventEmitter
		 * @constructs
		 *
		 * @param {Object} options	Component options
		 * @param {Boolean} options.singly		Whether this component will allow multiple sub-components to be visible at once. If true, only one component will be visible at a time.
		 * @param {Boolean} options.visible		If true, this component will be visible immediately.
		 * @param {Boolean} options.debug		If true, show debug messages for this component.
		 *
		 * @property {Object} options			Default options for this component. These will be merged with options passed to the constructor.
		 */
		construct: function(options) {
			// Merge options up the prototype chain, with passed options overriding
			this.mergeOptions(options);

			// Sub components
			this.components = {};
			
			// Hold the bubbled event listeners
			this._bubbledEvts = {};
			
			// Make sure the following functions are always called in scope
			// They are used in event handlers, and we want to be able to remove them
			this.bind('_handleSubComponentShown');
			this.bind('render');
		},
		
		init: function() {
			// Hide view by default
			if (this.view) {
				if (this.view.el) {
					if (this.options.visible === true) {
						// Call show method so view is rendered
						this.show({ silent: true });
					}
					else {
						// Just hide the el
						this.view.$el.hide();
					}
				}
				else {
					console.warn('Component %s has a view without an element', this.toString, this, this.view, this.view.options);
				}
				
				var self = this;
				this.listenTo(this.view, 'renderComplete', function() {
					if (typeof this.handleRenderComplete === 'function')
						this.handleRenderComplete();
					
					self.trigger('view:rendered', {
						component: self,
						view: self.view
					});
				});
			}
		},
		
		/**
		 * Destroy this instance and free associated memory
		 */
		destruct: function() {
			// If this module has a view in this.view, destroy it automatically
			if (this.view)
				this.view.remove();
			
			// Destroy sub-components
			this.removeComponents();
			
			// Stop listening, we're done
			this.stopListening();
		
			// Clear references to components
			delete this.components;
		},
		
		/**
		 * Render the view associated with this component, if it has one
		 *
		 * @returns {F.Component}	this, chainable
		 */
		render: function() {
			if (this.view) {
				this.view.render();
			}
			
			return this;
		},

		/**
		 * Binds a method to the execution scope of this instance.
		 *
		 * @name bind
		 * @memberOf BaseClass.prototype
		 * @function
		 *
		 * @param {Function} func	The this.method you want to bind
		 */
		bind: function(name) {
			if (typeof this[name] === 'function')
				this[name] = this[name].bind(this);
		},

		/**
		 * Destoroy the unbind function
		 */
		unbind: undefined,
	
		/**
		 * Set an event to bubble up the component chain by re-triggering it when the given sub-component triggers it
		 * 
		 * @param {String} componentName	Name of the component whose event to bubble
		 * @param {String} evt				Name of event to bubble up
		 *
		 * @returns {F.Component}	this, chainable
		 */
		bubble: function(componentName, evt) {
			if (!this[componentName]) {
				console.error("%s: cannot set event '%s' for bubbling from component '%s', component does not exist", this.toString(), evt, componentName);
				return this;
			}
			
			if (!this._bubbledEvts[componentName])
				this._bubbledEvts[componentName] = {};
			
			// Create a handler
			var handler = this._bubbledEvts[componentName][evt] = function() {
				// Turn the event arguments into an array
				var args = Array.prototype.slice.call(arguments);
				
				// Add the name of the event to the arguments array
				args.unshift(evt);
				
				// Call to bubble the event up
				this.trigger.apply(this, args);
			}.bind(this);
			
			// Add the listener
			this[componentName].on(evt, handler);
			
			return this;
		},
	
		/**
		 * Discontinue bubbling of a given event
		 * 
		 * @param {String} componentName	Name of the component whose event to stop bubbling
		 * @param {String} evt				Name of event that was set to bubble
		 *
		 * @returns {F.Component}	this, chainable
		 */
		unbubble: function(componentName, evt) {
			if (!this._bubbledEvts[componentName] || !this._bubbledEvts[componentName][evt]) {
				console.warn("%s: cannot discontinue bubbling of event '%s' for component '%s', event was not set for bubbling", this.toString(), evt, componentName);
				return this;
			}

			// Remove the listener
			this[componentName].off(evt, this._bubbledEvts[componentName][evt]);

			return this;
		},

		/**
		 * Add an instance of another component as a sub-component.
		 *
		 * this[subComponent.toString()] is used to reference the sub-component:
		 * 
		 *   this.List.show();
		 * 
		 * You can give a component an optional custom name as the second argument, then reference as such:
		 * 
		 *  this.myCustomComponent.show();
		 * 
		 * @param {F.Component} component	Instance of component
		 * @param {Function} componentName	Optional custom name for this component
		 *
		 * @returns {F.Component}	The sub-component that was added
		 */
		addComponent: function(component, componentName) {
			// Get the name of the component
			if (componentName) {
				// Tell component its new name, if provided
				componentName = decapitalize(componentName);
			}
			else {
				// Use lowercase of toString
				componentName = decapitalize(component.toString());
			}
			
			// Give component its new name
			component.setName(componentName);
			
			// Store component
			this[componentName] = this.components[componentName] = component;
		
			// Store this component as the parent
			component.parent = this;
			
			// Show a sub-component when it shows one of it's sub-components
			this.listenTo(component, 'component:shown', this._handleSubComponentShown);
			
			return component;
		},
	
		/**
		 * Remove and destroy a sub-component
		 *
		 * @param {Function} componentName	Component name
		 *
		 * @returns {F.Component}	this, chainable
		 */
		removeComponent: function(componentName) {
			var component = this[componentName];
		
			if (component !== undefined) {
				this.stopListening(component);
		
				delete this[componentName];
				delete this.components[componentName];
				
				if (typeof component.destruct === 'function')
					component.destruct();
			}
		
			return this;
		},
		
		/**
		 * Remove and destroy all sub-components
		 *
		 * @returns {F.Component}	this, chainable
		 */
		removeComponents: function() {
			for (var component in this.components) {
				this.components[component].destruct();
				delete this[component];
			}
			
			return this;
		},
	
		/**
		 * Handles showing/hiding components in singly mode, triggering of events
		 *
		 * @param {Function} evt	Event object from component:shown
		 */
		_handleSubComponentShown: function(evt) {
			var newComponent = this.components[evt.name];

			if (newComponent !== undefined) {
				// hide current component(s) for non-overlays
				if (this.options.singly && !newComponent.options.overlay) {
					this.hideAllSubComponents([evt.name]);
					
					// Store currently visible subComponent
					this.currentSubComponent = newComponent;
				}
			}
		},
	
		/**
		 * Show this component and emit an event so parent components can show themselves. Use options.silent to prevent component:shown event from firing
		 *
		 * @param {Object} options	Options object
		 *
		 * @returns {F.Component}	this, chainable
		 */
		show: function(options) {
			options = options || {};
			
			// Debug output
			if (this.inDebugMode()) {
				// Don't show if already shown
				if (this.isVisible())
					console.log('%s: not showing self; already visible', this.toString());
				else
					console.log('%s: showing self', this.toString());
			}
		
			if (!options.silent && !this.options.independent) {
				// Always trigger event before we show ourself so others can hide/show
				this.trigger('component:shown', {
					name: this.toString(),
					component: this
				});
			}
		
			// Always call show on the view so it has a chance to re-render
			if (this.view) {
				this.view.show();
			}
			
			// Call setup if we're not setup
			if (!this.options.isSetup && typeof this.setup === 'function') {
				this.setup(options);
				this.options.isSetup = true;
			}
			
			this.options.visible = true;
	
			return this;
		},
	
		/**
		 * Hide this component
		 *
		 * @returns {F.Component}	this, chainable
		 */
		hide: function(options) {
			options = options || {};
			
			if (!this.isVisible())
				return false;
			
			if (this.inDebugMode()) {
				console.log('%s: hiding self', this.toString());
			}
			
			// Hide the view
			if (this.view)
				this.view.hide();
			
			if (!options.silent) {
				// Trigger event after we hide ourself so we're out of the way before the next action
				this.trigger('component:hidden', {
					name: this.toString(),
					component: this
				});
			}
			
			// Call teardown if we're setup
			if (this.options.isSetup && typeof this.teardown === 'function') {
				this.teardown(options);
				this.options.isSetup = false;
			}
		
			// Hide children
			if (this.options.hideChildren !== false)
				this.hideAllSubComponents();
		
			this.options.visible = false;
	
			return this;
		},
	
		/**
		 * Check if this component, or F as a whole, is in debug mode and should output debug messages
		 *
		 * @returns {Boolean} Component or F is in debug mode
		 */
		inDebugMode: function() {
			return this.options.debug || F.options.debug;
		},
		
		/**
		 * Check if this component is currently visible
		 *
		 * @returns {Boolean} Component is visible
		 */
		isVisible: function() {
			return this.options.visible;
		},

		/**
		 * Show all sub-components
		 *
		 * @param {String[]} [except]	List of component names not to show. These components will not be hidden if they are already shown
		 *
		 * @returns {F.Component}	this, chainable
		 */
		showAllSubComponents: function(except) {
			except = !_.isArray(except) ? [] : except;
			for (var componentName in this.components) {
				if (~except.indexOf(componentName))
					continue;
				this.components[componentName].show();
			}

			return this;
		},
		
		/**
		 * Hide all sub-components
		 *
		 * @param {String[]} [except]	List of component names not to hide. These components will not be shown if they are already hidden
		 *
		 * @returns {F.Component}	this, chainable
		 */
		hideAllSubComponents: function(except) {
			except = _.isArray(except) ? except : false;
			for (var componentName in this.components) {
				if (except && ~except.indexOf(componentName))
					continue;
				this.components[componentName].hide();
			}
		
			return this;
		},
		
		/**
		 * Set a custom name for this component. Only useful before passing to {@link F.Component.addComponent}
		 *
		 * @param {Function} componentName	Component name
		 *
		 * @returns {F.Component}	this, chainable
		 */
		setName: function(customName) {
			/**
			 * Get this component's name
			 *
			 * @returns {String}	Component's name; either a custom name given when added with {@link F.Component.addComponent}, or toString method or string from prototype
			 */
			this.toString = function() {
				return customName;
			};
			
			return this;
		},
		
		/**
		 * Set properties of this instance from an options object, then remove the properties from the options object
		 *
		 * @param {Object} options		Options object with many properties
		 * @param {String[]} props		Properties to copy from options object
		 *
		 * @returns {F.Component}	this, chainable
		 */
		setPropsFromOptions: function(options, props) {
			_.each(props, function(prop) {
				// Add the property to this instance, or use existing property if it's already there
				this[prop] = options[prop] || this[prop];
				// Delete the property from the options object
				delete options[prop];
			}.bind(this));
			
			return this;
		},
		
		/**
		 * Merge options up the prototype chain. Options defined in the child class take precedence over those defined in the parent class.
		 */
		mergeOptions: function(options) {
			// Create a set of all options in the correct order
			var optionSets = [];
			var proto = this.constructor.prototype;
			while (proto) {
				if (proto.hasOwnProperty('options')) {
					optionSets.unshift(proto.options);
				}
				
				proto = proto.superPrototype;
			}
			
			// All options should end up merged into a new object to avoid overwriting prototype.options
			optionSets.unshift({});
			
			// Add in instance options
			if (options) {
				optionSets.push(options);
			}

			// Perform the merge and store the new options object on the instance
			this.options = _.extend.apply(_, optionSets);
		}

		/**
		 * Called when view rendering is complete
		 *
		 * @name handleRenderComplete
		 * @memberOf F.Component.prototype
		 * @function
		 */
		
		/**
		 * Triggered when this component is shown
		 *
		 * @name F.Component#component:shown
		 * @event
		 *
		 * @param {Object}	evt					Event object
		 * @param {String}	evt.name			This component's name
		 * @param {F.Component}	evt.component	This component
		 */

		/**
		 * Triggered when this component is hidden
		 *
		 * @name F.Component#component:hidden
		 * @event
		 *
		 * @param {Object}	evt					Event object
		 * @param {String}	evt.name			This component's name
		 * @param {F.Component}	evt.component	This component
		 */
	});
}());

F.ModelComponent = new Class(/** @lends F.ModelComponent# */{
	toString: 'ModelComponent',
	extend: F.Component,
	/**
	 * A component that can load and render a model
	 *
	 * @constructs
	 * @extends F.Component
	 *
	 * @param {Object} options	Options for this component
	 * @param {Object} options.Model	Model class this component will be operating on. Sets this.Model
	 *
	 * @property {Backbone.Model} Model		The model class to operate on. Not an instance of a model, but the model class itself.
	 */
	construct: function(options) {
		this.Model = this.Model || options.Model;
	},
	
	Model: Backbone.Model,
	
	/***
	 * Refresh the model
	 *
	 * @param {Function} callback	Callback to call after successful refresh
	 *
	 * @returns {F.ModelComponent}	this, chainable
	 */
	refresh: function(callback) {
		this.trigger('model:loading', {
			model: this.model
		});

		this.model.fetch({
			success: function(model, response) {
				// Allow handleLoadSuccess to cancel triggers
				var trigger = true;
				if (typeof this.handleLoadSuccess === 'function')
					trigger = (this.handleLoadSuccess(this.model, response) === false) ? false : true;
					
				if (trigger) {
					// Trigger model event
					this.model.trigger('loaded');
				
					// Trigger component event
					this.trigger('model:loaded', {
						model: this.model
					});
				
					// Call callback
					if (typeof callback === 'function')
						callback.call(this, this.model);
				}
			}.bind(this),
			error: function(model, response) {
				console.warn('%s: Error loading model', this.toString());
				
				this.trigger('model:loadFailed', {
					model: this.model,
					response: response
				});
				
				if (typeof this.handleLoadError === 'function')
					this.handleLoadError(this.model, response);
			}.bind(this)
		});
		
		return this;
	},
	
	/**
	 * Use a different item model
	 *
	 * @param {Backbone.Model} model
	 *
	 * @returns {F.ModelComponent}	this, chainable
	 */
	_setModel: function(model) {
		this.model = model;
	
		if (this.model && this.model.off && this.view) {
			this.view.setModel(model);
		}
		
		return this;
	},
		
	/**
	 * Fetch a model with the given ID
	 *
	 * @param {String} itemId		ID of the item to fetch
	 * @param {Function} [callback]	Callback to execute on successful fetch
	 *
	 * @returns {F.ModelComponent}	this, chainable
	 */
	fetch: function(itemId, callback) {
		var data = {};
		if (itemId !== undefined) { // add the ID passed to the model data
			data[this.Model.prototype.idAttribute] = itemId;
		}

		this.trigger('model:loading', {
			model: this.model
		});

		// Create a blank model
		var model = new this.Model(data);
	
		// Fetch model contents
		model.fetch({
			// TBD: add fetch options?
			success: function(model, response) {
				// Assign the model to the view
				this._setModel(model);
				
				// Allow handleLoadSuccess to cancel triggers
				var trigger = true;
				if (typeof this.handleLoadSuccess === 'function')
					trigger = (this.handleLoadSuccess(this.model, response) === false) ? false : true;
					
				if (trigger) {
					// Notify
					this.trigger('model:loaded', {
						model: this.model
					});
				
					// Call callback
					if (typeof callback === 'function')
						callback.call(this, this.model);
				}
			}.bind(this),
			error: function(model, response) {
				console.warn('%s: Error loading model', this.toString());
				
				this.trigger('model:loadFailed', {
					model: this.model,
					response: response
				});
				
				if (typeof this.handleLoadError === 'function')
					this.handleLoadError(this.model, response);
			}.bind(this)
		});
		
		return this;
	},
	
	/**
	 * Load a Backbone.Model directly or create a model from data
	 *
	 * @param {mixed} modelOrData	Backbone.Model to load or Object with data to create model from
	 *
	 * @returns {F.ModelComponent}	this, chainable
	 */
	load: function(modelOrData) {
		if (modelOrData instanceof Backbone.Model)
			this._setModel(modelOrData);
		else
			this._setModel(new this.Model(modelOrData));
		
		// Notify
		this.trigger('model:loaded', {
			model: this.model
		});
		
		return this;
	},
	
	/**
	 * Save a model to the server
	 *
	 * @param {Object} data			Data to apply to model before performing save
	 * @param {Function} callback	Callback to execute on success/failure. Passed an error, the model, and the response from the server
	 * @param {Object} options		Options to pass when calling model.save
	 *
	 * @returns {F.ModelComponent}	this, chainable
	 */
	save: function(data, callback, options) {
		if (this.model) {
			if (this.inDebugMode())
				console.log('%s: Saving...', this.toString());
			
			this.trigger('model:saving', {
				model: this.model
			});
			
			this.model.save(data || {}, _.extend({
				success: function(model, response) {
					if (this.inDebugMode())
						console.log('%s: Save successful', this.toString());
					
					if (typeof callback === 'function')
						callback.call(this, null, this.model, response);
					
					if (typeof this.handleSaveSuccess === 'function')
						this.handleSaveSuccess(this.model, response);
					
					this.trigger('model:saved', {
						model: this.model,
						response: response
					});
				}.bind(this),
				error: function(model, response) {
					console.warn('%s: Error saving model', this.toString());
					
					if (typeof callback === 'function')
						callback.call(this, new Error('Error saving model'), this.model, response);
					
					if (typeof this.handleSaveError === 'function')
						this.handleSaveError(this.model, response);
						
					this.trigger('model:saveFailed', {
						model: this.model,
						response: response
					});
				}.bind(this)
			}, options));
		}
		else {
			console.warn('%s: Cannot save, model is not truthy', this.toString());
		}
		return this;
	},
	
	/**
	 * Show this component, optionally fetching an item by ID or assigning a new model before render
	 *
	 * @param {Object} options			Show options
	 * @param {String} options.id		ID of model to fetch from the server before showing
	 * @param {Backbone.Model} options.model	Model to use directly (don't fetch)
	 *
	 * @returns {F.ModelComponent}	this, chainable
	 */
	show: function(_super, options) {
		options = options || {};
		
		if (options.id) {
			if (this.inDebugMode()) {
				console.log('%s: fetching item with ID %s', this.toString(), options.id);
			}
			
			// Load the model by itemId, then show
			this.fetch(options.id, function(model) {
				if (this.inDebugMode()) {
					console.log('%s: fetch complete!', this.toString());
				}
				this.show({
					silent: options.silent
				}); // pass nothing to show and the view will re-render
			});
		}
		else if (options.model) {
			if (this.inDebugMode()) {
				console.log('%s: showing with new model', this.toString(), options.model);
			}
			
			this.load(options.model);
			this.show({
				silent: options.silent
			});
		}
		else {
			_super.apply(this, arguments);
		}
			
		return this;
	}

	/**
	 * Called when a model has been loaded successfully
	 *
	 * @name handleLoadSuccess
	 * @memberOf F.ModelComponent.prototype
	 * @function
	 */

	/**
	 * Called when a model fails to load
	 *
	 * @param {Backbone.Model} model	The model that failed to load
	 * @param {Object} response			The response from Backbone
	 *
	 * @name handleLoadError
	 * @memberOf F.ModelComponent.prototype
	 * @function
	 */
	
	/**
	 * Called when a model has been saved successfully
	 *
	 * @name handleSaveSuccess
	 * @memberOf F.ModelComponent.prototype
	 * @function
	 */
	
	/**
	 * Called when a model fails to save
	 *
	 * @name handleSaveError
	 * @memberOf F.ModelComponent.prototype
	 * @function
	 */
	
	/**
	 * Triggered when a model is saving
	 *
	 * @name F.ModelComponent#model:saving
	 * @event
	 *
	 * @param {Object} evt					Event object
	 * @param {Backbone.Model} evt.model	The model that was saved
	 */
	
	/**
	 * Triggered when save is unsuccessful
	 *
	 * @name F.ModelComponent#model:saveFailed
	 * @event
	 *
	 * @param {Object} evt					Event object
	 * @param {Backbone.Model} evt.model	The model that failed to save
	 * @param {Object} evt.response			Response from the server
	 */
	
	/**
	 * Triggered after a successful save
	 *
	 * @name F.ModelComponent#model:saved
	 * @event
	 *
	 * @param {Object} evt					Event object
	 * @param {Backbone.Model} evt.model	The model that was saved
	 * @param {Object} evt.response			Response from the server
	 */
	
	/**
	 * Triggered when the model is being loaded from the server
	 *
	 * @name F.ModelComponent#model:loading
	 * @event
	 *	
	 * @param {Object} evt					Event object
	 * @param {Backbone.Model} evt.model	The model that was loaded
	 */
	 
	/**
	 * Triggered when load is unsuccessful
	 *
	 * @name F.ModelComponent#model:loadFailed
	 * @event
	 *
	 * @param {Object} evt					Event object
	 * @param {Backbone.Model} evt.model	The model that failed to load
	 * @param {Object} evt.response			Response from the server
	 */
	
	/**
	 * Triggered when the model is loaded from the server or passed to load()
	 *
	 * @name F.ModelComponent#model:loaded
	 * @event
	 *	
	 * @param {Object} evt					Event object
	 * @param {Backbone.Model} evt.model	The model that was loaded
	 */
});

F.CollectionComponent = new Class(/** @lends F.CollectionComponent# */{
	toString: 'CollectionComponent',
	extend: F.Component,
	options: {
		defaultParams: {}
	},
	
	/**
	 * A component that can load and render a collection
	 *
	 * @constructs
	 * @extends F.Component
	 *
	 * @param {Object} options							Options for this component
	 *
	 * @property {Object} defaultParams				Default parameters to send with fetches for this collection. Can be overridden at instantiation. Calls to load(fetchParams) will merge fetchParams with defaultParams.
	 * @property {Backbone.Collection} Collection	The collection class to operate on. Not an instance of a collection, but the collection class itself.
	 */
	construct: function(options) {
		// Bind for use as listeners
		this.bind('addModel');
		this.bind('removeModel');
		this.bind('render');
		
		this._useCollection(new this.Collection());
		
		// Store if this collection has ever been loaded
		this.collectionLoaded = false;
	},
	
	destruct: function() {
		this._releaseCollection();
	},
	
	Collection: Backbone.Collection,
	
	_useCollection: function(collection) {
		// Store collection
		this.collection = collection;
		
		// Re-render when the collection is fetched, items are added or removed
		this.listenTo(this.collection, 'add', this.addModel);
		this.listenTo(this.collection, 'remove', this.removeModel);
		this.listenTo(this.collection, 'loaded', this.render); // custom event we call after fetches
		// this.listenTo(this.collection, 'change', this.render); // Don't re-render on change! let the sub-views do that
	},
	
	_releaseCollection: function() {
		// Unbind events
		this.stopListening(this.collection);
		
		// Remove reference to collection
		this.collection = null;
	},
	
	/**
	 * Refresh this collection with the last parameters used
	 *
	 * @param {Function} callback	Optional callback to execute on successful fetch
	 *
	 * @returns {F.CollectionComponent}	this, chainable
	 */
	refresh: function(callback) {
		// Just fetch the collection with the current params
		this.fetch(this.params, callback);
		
		return this;
	},
	
	/**
	 * Callback called when model is added to collection
	 */
	addModel: function(model) {},
	
	/**
	 * Callback called when model is removed from collection
	 */
	removeModel: function(model) {},
	
	/**
	 * Clear the parameters from the last fetch. Useful when using refresh() on a filtered list.
	 *
	 * @returns {F.CollectionComponent}	this, chainable
	 */
	clearParams: function() {
		this.params = {};
		
		return this;
	},
	
	/**
	 * Fetch the collection by fetching it from the server
	 *
	 * @param {Object} [fetchParams]	Parameters to pass when fetching
	 * @param {Function} [callback]		Callback to execute on successful fetch
	 *
	 * @returns {F.CollectionComponent}	this, chainable
	 */
	fetch: function(fetchParams, callback) {
		// Combine new params, if any, with defaults and store, overwriting previous params
		if (fetchParams)
			this.params = _.extend({}, this.options.defaultParams, fetchParams);
		else // Overwrite old params with defaults and send a request with only default params
			this.params = _.extend({}, this.options.defaultParams);
		
		this.trigger('collection:loading', this.collection);
		
		// Fetch collection contents
		this.collection.fetch({
			data: this.params,
			success: function() {
				// Collection event
				this.collection.trigger('loaded');

				// Component event
				this.trigger('collection:loaded', this.collection);
				this.collectionLoaded = true;
				
				if (typeof callback === 'function')
					callback.call(this, this.collection);
			}.bind(this)
		});
		
		return this;
	},
	
	
	/**
	 * Load a Backbone.Collection directly or create a collection from an array of data
	 *
	 * @param {mixed} collectionOrData	Backbone.Collection to load or Array of Objects with data to create the collection from
	 *
	 * @returns {F.CollectionComponent}	this, chainable
	 */
	load: function(collectionOrData) {
		this._releaseCollection();

		if (collectionOrData instanceof Backbone.Collection)
			this._useCollection(collectionOrData);
		else
			this._useCollection(new this.Collection(collectionOrData));
		
		return this;
	},
	
	
	/**
	 * Show this component. Provide options.params to fetch with new parameters. The collection will be fetched before showing if it hasn't already
	 *
	 * @param {Object} options	Pass fetch parameters with options.params
	 *
	 * @returns {F.CollectionComponent}	this, chainable
	 */
	show: function(_super, options) {
		options = options || {};
		if (options.params) {
			// Fetch the collection from the server
			this.fetch(options.params, function() {
				this.show({
					silent: options.silent
				});
			});
		}
		else if (!this.collectionLoaded) {
			// Perform initial load
			this.refresh(function() {
				this.show({
					silent: options.silent
				}); // show when we're fully loaded
			});
		}
		else {
			_super.apply(this, arguments);
		}
		
		return this;
	}
	
	
	/**
	 * Triggered when the collection is being loaded from the server
	 *
	 * @name F.CollectionComponent#collection:loading
	 * @event
	 *
	 * @param {Backbone.Collection}	collection	The collection that is being loaded
	 */
	
	/**
	 * Triggered when the collection is loaded from the server
	 *
	 * @name F.CollectionComponent#collection:loaded
	 * @event
	 *
	 * @param {Backbone.Collection}	collection	The collection that was loaded
	 */
});

(function() {
	
	/* Views
	*******************/
	// Available as F.FormComponent.prototype.View
	var FormView = F.View.extend(/** @lends F.FormComponent.prototype.View# */{
		tagName: 'form',
		events: {
			'submit': 'handleSubmit'
		}
	});
	
	
	/* Component
	*******************/
	F.FormComponent = new Class(/** @lends F.FormComponent# */{
		toString: 'FormComponent',
		extend: F.ModelComponent,
	
		/**
		 * A component that can display an add/edit form for a model and handle form submission and save events
		 *
		 * @constructs
		 * @extends F.ModelComponent
		 *
		 * @param {Object} options			Options for this component and its view. Options not listed below will be passed to the view.
		 *
		 * @property {Backbone.Model} Model	The model class that the form will manipulate. Not an instance of the model, but the model class itself
		 * @property {Backbone.View} View	The view class that the form will be rendered to
		 * @property {Template} Template	The template that the form will be rendered with
		 */
		construct: function(options) {
			// Create a new edit view that responds to submit events
			this.view = new this.View(_.extend({
				component: this,
				template: this.Template
			}, options));
		
			// Create a blank model
			this.model = new this.Model();
			
			this.bind('handleSubmit');
		},

		View: FormView,
	
		Template: null,

		/**
		 * Clears the form by rendering it with a new, empty model
		 *
		 * @returns {F.Component}	this, chainable
		 */
		clear: function() {
			// Create a new model instead of resetting the old one
			this._setModel(new this.Model());

			// Call the load success function
			var trigger = true;
			if (typeof this.handleLoadSuccess === 'function')
				this.handleLoadSuccess(this.model);
			
			// Render the view so it will be blank again
			this.render();
		
			return this;
		},
		
		/**
		 * Blurs focus from the form, mostly for iOS
		 */
		doBlur: function() {
			// Blur focus to the submit button in order to hide keyboard on iOS
			// This won't work for every situation, such as forms that don't have submit buttons
			var $button = this.view.$('[type="submit"], button').filter(':visible').last().focus();
			setTimeout(function() {
				$button.blur();
			}, 10);
		},
	
		/**
		 * Handles form submit events
		 *
		 * @param {Event} evt	The jQuery event object
		 */
		handleSubmit: function(evt) {
			this.doBlur();
			
			// Since this is a DOM event handler, prevent form submission
			if (evt && evt.preventDefault)
				evt.preventDefault();
			
			this.saveForm();
		},
		
		/**
		 * Read data from the form. Override this function customization of extracting your form data
		 *
		 * @returns {Object}	Data read from form
		 */
		extractValuesFromForm: function() {
			// Get the data from the form fields
			var $form = this.view.$el;
			if (this.view.el.tagName !== 'FORM')
				$form = this.view.$('form');
				
			var fields = $form.filter(':not([data-serialize="false"])').serializeArray();
			
			// Build a data object from fields
			var data = {};
			_.each(fields, function(field) {
				F.set(data, field.name, field.value, true);
			});
			
			return data;
		},
		
		/**
		 * Read the data from the form and store it in the model
		 */
		setValuesFromForm: function() {
			this.model.set(this.extractValuesFromForm());
		},
		
		/**
		 * Read the data from the form and perform the save
		 *
		 * @param {Function} callback	A callback to execute when the save is complete
		 */
		saveForm: function(callback) {
			// Perform the save, passing our new, modified data
			this.save(this.extractValuesFromForm(), callback);
		}
		
	});
}());

(function() {
	
	/* Views
	*******************/
	
	// Available as F.ListComponent.prototype.ListView
	var ListView = F.View.extend({
		tagName: 'ul',

		initialize: function(options) {
			options = options || {};

			// Clumsy standard way of calling parent class' initialize method
			F.View.prototype.initialize.apply(this, arguments);

			this.collection = options.collection;
			this.ItemView = options.ItemView || this.ItemView;
			this.ItemTemplate = options.ItemTemplate || this.ItemTemplate;
			
			// Views array for subviews
			this.subViews = [];
			
			// Bind addSuView permanently
			this.addSubView = this.addSubView.bind(this);
		},

		addSubView: function(model) {
			// Create view
			var view = new this.ItemView({
				model: model,
				template: this.ItemTemplate,
				component: this.component
			});
			view.render();
			
			// Add the list item to the List
			if (this.options.ListContainer)
				this.$(this.options.ListContainer).append(view.el);
			else
				this.$el.append(view.el);
			
			// Store the position in the views array
			// Don't store the actual view to prevent circular references
			view.$el.data('viewIndex', this.subViews.length);
			
			// Store in views array for removal later
			this.subViews.push(view);
		},
		
		remove: function() {
			this.removeSubViews();
			
			F.View.prototype.remove.call(this, arguments);
		},

		removeSubView: function(modelOrViewIndex) {
			var view = null;
			var viewIndex = -1;
			if (typeof viewIndex !== 'Number') {
				_.some(this.subViews, function(tmpView, index) {
					if (tmpView && tmpView.model === modelOrViewIndex) {
						view = tmpView;
						viewIndex = index;
					}
				}.bind(this));
			}
			else // get from view index
				view = this.subViews[viewIndex];
				
			if (view) {
				view.remove();
				this.subViews[viewIndex] = undefined;
			}
		},
		
		removeSubViews: function() {
			if (this.subViews.length) {
				_.each(this.subViews, function(view) {
					if (view)
						view.remove();
				});
				
				this.subViews = [];
			}
		},

		render: function() {
			if (this.inDebugMode()) {
				console.log('%s: rendering list view...', this.component && this.component.toString() || 'List view');
			}
			
			if (this.container && !$(this.el.parentNode).is(this.container))
				$(this.container).append(this.el);
			

			if (this.rendered === null) {
				// Render template
				if (this.template) {
					// First, see if the model exists. If so, see if it has toJSON. If so, use model.toJSON. Otherwise, if model exists, use model. Otherwise, use {}
					this.$el.html(this.template({}));
				}
				// Store the last time this view was rendered
				this.rendered = new Date().getTime();
			}

			// Remove previous views from the DOM
			this.removeSubViews();
			
			// Add and render each list item
			this.collection.each(this.addSubView);
			
			if (this.collection.isEmpty()) {
				var EmptyView = this.ItemView;
				var emptyTemplate;
				
				// Determine if we have searched
				if (_.isEqual(this.component.params, this.component.options.defaultParams) && this.component.ListEmptyTemplate) {
					emptyTemplate = this.component.ListEmptyTemplate;
					if (this.component.ListEmptyView)
						EmptyView = this.component.ListEmptyView;
				}
				else if (this.component.NoResultsTemplate) {
					emptyTemplate = this.component.NoResultsTemplate;
					if (this.component.NoResultsView)
						EmptyView = this.component.NoResultsView;
				}
				
				// Proceed if we have the appropritate template
				if (emptyTemplate) {
					var view = new EmptyView({
						template: emptyTemplate,
						component: this.component,
						model: this.component.params
					}).render();
				
					// Add the empty template item to the list or specified list container
					if (this.options.ListContainer)
						this.$(this.options.ListContainer).append(view.el);
					else
						this.$el.append(view.el);
				
					// Store in views array for removal later
					this.subViews.push(view);
				}
			}
			
			// Store the last time this view was rendered
			this.rendered = new Date().getTime();

			this.trigger('renderComplete');
			
			return this;
		}
	});

	// Available as F.ListComponent.prototype.ItemView
	var ItemView = F.View.extend({
		tagName: 'li',
		className: 'listItem'
	});

	/* Component
	*******************/
	F.ListComponent = new Class(/** @lends F.ListComponent# */{
		toString: 'ListComponent',
		extend: F.CollectionComponent,
	
		/**
		 * A component that can load and render a collection as a list
		 *
		 * @constructs
		 * @extends F.CollectionComponent
		 *
		 * @param {Object} options						Options for this component and its view. Options not listed below will be passed to the view.
		 *
		 * @property {Backbone.Collection} Collection		The collection class this list will be rendered from
		 * @property {Mixed} ListContainer					The DOM element or jQuery object list items should be appended to
		 * @property {Backbone.View} ListView				The view class this list will be rendered with
		 * @property {Template} ListTemplate				The template this list will be rendered with. Renders to a UL tag by default
		 * @property {Backbone.View} ItemView				The view that individual items will be rendered with
		 * @property {Template} ItemTemplate				The template that individual items will be rendered with
		 */
		construct: function(options) {
			this.view = new this.ListView(_.extend({
				component: this, // pass this as component so ItemView can trigger handleSelect if it likes
				collection: this.collection,
				template: this.ListTemplate,
				ItemView: this.ItemView,
				ItemTemplate: this.ItemTemplate,
				ListContainer: this.ListContainer,
				events: _.extend({}, {
					'click li': 'handleSelect'
				}, this.ListView.prototype.events)
			}, options));
			
			this.selectedItem = null;
		},
	
		Collection: Backbone.Collection, // Collection component expects to have prototype.Collection or options.Collection
	
		/** The template render when there are no results **/
		NoResultsTemplate: null,

		/** The view to render when there are no results. Defaults to using ListView. **/
		NoResultsView: null,

		/**
		 * The view to render when the list is empty
		 * @todo give a default here
		**/
		ListEmptyView: null,

		/**
		 * The template to render when a list is empty. Rendered with ListEmptyView if defined, or ItemView otherwise.
		 * @todo give a default here
		**/
		ListEmptyTemplate: null,

		ListTemplate: null,
		ListView: ListView,
	
		ItemTemplate: null,
		ItemView: ItemView,
	
		addModel: function(model) {
			// Add a subview for this model
			this.view.addSubView(model);
		},
		
		removeModel: function(model) {
			// Add a subview for this model
			this.view.removeSubView(model);
		},
	
		/**
		 * Get the model associated with a list item
		 *
		 * @param {Node}	Node or jQuery Object to get model from
		 *
		 * @returns {Backbone.Model}	The model associated with the passed DOM element
		 */
		getModelFromLi: function(listItem) {
			var viewIndex = $(listItem).data('viewIndex');
			return (viewIndex !== undefined && this.view.subViews[viewIndex] && this.view.subViews[viewIndex].model) || null;
		},
	
		/**
		 * Get the view associated with a list item
		 *
		 * @param {Node}	Node or jQuery Object to get model from
		 *
		 * @returns {Backbone.View}	The view associated with the passed DOM element
		 */
		getViewFromLi: function(listItem) {
			return this.view.subViews[$(listItem).data('viewIndex')];
		},
		
		/**
		 * Handles item selection events
		 *
		 * @param {Event} evt	The jQuery event object
		 */
		handleSelect: function(evt) {
			// Get model from DOM el's data
			var model = this.getModelFromLi(evt.currentTarget);
			
			// Only trigger if the target had a model
			// The empty views do not have a model
			if (model) {
				// Store ID of selected item
				this.selectedItem = model.id;
		
				this.trigger('list:itemSelected', {
					listItem: $(evt.currentTarget),
					model: model
				});
			}
		}
		
		
		/**
		 * Triggered when and item in the list is selected by tapping or clicking
		 *
		 * @name F.ListComponent#list:itemSelected
		 * @event
		 *
		 * @param {Object}	evt					Event object
		 * @param {jQuery}	evt.listItem		The list item that was touched
		 * @param {Backbone.Model}	evt.model	The model representing the item in the list
		 */
	});
}());
