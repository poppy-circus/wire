define([
  './lodash'
], function(
  lodash
) {

  'use strict';

  //--------------------------------------------------------------------------
  //
  //  helper
  //
  //--------------------------------------------------------------------------

  var clone = lodash.clone;
  var merge = lodash.merge;
  var forEach = lodash.forEach;
  var indexOf = lodash.indexOf;

  // used to give knots a label when not defined in branch method

  var autoLabelIndex = 0;

  // matchers to resolve function names from runtime shared objects

  var sroFnPatterns = [
    /^get(.*)/,
    /^is(.*)/,
    /^has(.*)/
  ];

  // converts function name to property name
  // eg. getDuration -> duration

  var resolveSroFnName = function(name) {
    var result;

    forEach(sroFnPatterns, function(pattern) {
      result = name.match(pattern);
      if (result) {
        result = result[1];
        result = result.charAt(0).toLowerCase() + result.substr(1);
        return false;
      }
    });
    return result;
  };

  // converts a mixed object of functions and properties
  // to an object with properties only

  var resolveSro = function(sharedRuntimeObject) {
    var result = {};
    var SRO_ERROR = Wire.SRO_ERROR;

    forEach(sharedRuntimeObject, function(value, name) {

      if (typeof value === 'function'){
        name = resolveSroFnName(name);

        if(name) {

          try {
            result[name] = value();
          }
          catch(e){

            if(!result[SRO_ERROR])
              result[SRO_ERROR] = {};

            result[name] = SRO_ERROR;
            result[SRO_ERROR][name] = e;
          }
        }
      }

      else
        result[name] = value;
    });

    return result;
  };

  //--------------------------------------------------------------------------
  //
  //  construct
  //
  //--------------------------------------------------------------------------

  /**
   * The Wire represents a data store to organize and process data.
   *
   * ### It is focused on the following aspects:
   *
   * - **composition**, expanding the wire by building data trees
   *   and allow data access
   * - **binding**, allow the wire to access dynamic data
   * - **state**, allow the wire to manage states besides data structures
   * - **command**, allow the wire to delegate data to
   *   data handlers
   *
   * ### It is not responsible for:
   *
   * - **mapping**, there is no generic solution for mapping. It is always
   *   bounded to specific project requirements and therefore not
   *   included. Mapping must be aligned as a pre- or post job.
   *   The only mapping helper that is available, is the mapping
   *   of data namespaces by a knot index.
   *
   * ### Working with the wire
   *
   * The wire starts by creating a wire instance and by default this is done
   * only once. Building up the wire, is done by the _branch_ method which
   * creates `knots`. Each knot is a vehicle that can carry data. By creating
   * knots the wire expands and with _truncate_ the wire shrinks.
   *
   * Knots can by accessed by other knots using _fetch_ from everywhere because
   * they are all linked in the wire by a `namespace`. A namespace declares the
   * full path to a knot from the root knot, eg. the created wire instances.
   * A root knot is called `socket` and is just another knot in the wire with
   * advanced capabilities. A socket has the complete feature set of a knot but
   * represents an endpoint when working with _fetch_. There isn`t just a single
   * socket - each knot can became a socket by using the _insulate_ method.
   *
   * A knot - as said - is constructed to transport data. The data input stream
   * is manifold and the wire cares about it. The simplest case is static data.
   * It became imported when calling _branch_. To access static data values a
   * knot ofters a property `data` and a method `getWireData`. The property data
   * delivers just the assigned static data and allows modification of it. The
   * getWireData method returns a data group that includes all data sets up to
   * the next socket, which are seperated by the particular knot namespace. To
   * provide the data manipulation in the wire, _syncData_ is used.
   *
   * Another case is dynamic data. There are multiple ways to handle them. One
   * option is to update the knot data and calling _sync_. This will refresh the
   * wire data, index and routes of a knot and its childs. 
   * Another option are `routes`. Routes are dynamicly added functions to a knot 
   * and became inherited. Each subordinated knot can access the routes up to the 
   * next socket. The wire doesn`t care about the function arguments of a route
   * at all, it just delegates them.
   *
   * A last option is possible by using the `shared runtime`. Each knot allows
   * to apply multiple shared runtime objects by _joinSharedRuntime_. A shared
   * runtime object is known as a collection of functions and properties and
   * maintained outside the wire. Properties are simply copied and functions
   * starting with _get, has and is_ are called without any arguments. The
   * return value became the dynamic value, eg a function getDuration with a
   * return value of 2 became `duration=2`. Shared runtimes behave like wire
   * data. By calling _getSharedRuntimeValues_ all shared runtime objects up to
   * the next socket are resolved and grouped by the particular knot namespace.
   * (Method invokation may swallow exceptions. All occured errors are listed
   * beneath the key _Wire.SRO_ERROR_ in the shared runtime result with the
   * error object value.)
   *
   * Besides data handling the wire ofters informations through a knot
   * reference. A knot info provides informations about the namespace, the
   * label, the state and the index. Where namespace is the full qualified path
   * from a socket to the affected knot, the `label` represents just the name,
   * eg with a namespace="socket/parent/knot", the label would be "knot".
   *
   * The `state` is a simple slot to store any details by key-value pairs.
   * It doesn't affect the carried data at all, but it can be used to control
   * the internal behaviour of routes. To receive all states in the wire from
   * the socket to the affected knot, _getWireStates_ can be used.
   *
   * The `index` is a helper to improve navigation in the wire data, states and
   * shared runtime structures. In those objects the data is grouped by the
   * affected namespace. Sometimes this fact can became problematic because the
   * namespace needs to be known. The index maps those namespaces by the label,
   * eg knot:'/parent/knot'. If a label is used multiple the indexer will
   * convert the namespace value to an array of namespace. The wire ofters the
   * _index_ property to define own namespace mapping. To inherit the index 
   * after createing a branch use _syncIndex_.
   *
   * @param {String} namespace - the knot identifier
   * @param {Object=} knotData - Any data to store in the wire
   *        If not defined an empty object became created
   * @param {Object=} state - the initial state object
   *        If not defined an empty object became created
   *
   * @constructor Wire
   */

  // socket and parent are for internal use and left undocumented
  // they are not available for external usage

  function Wire(namespace, knotData, state, socket_, parent_) {

    /**
     * Includes the full qualified location of a knot.
     * In the wire each knot is connected to knotes in upper hierarchy.
     * The namespace property represents the hierarchy as a string value
     *joined by a '/'.
     *
     * @name namespace
     * @type {String}
     * @memberOf Wire#
     */
    this.namespace = namespace;

    /**
     * The name of a knot.
     * The label is always unique on the same level in the wire.
     * It is used to located knotes.
     *
     * @name label
     * @type {String}
     * @memberOf Wire#
     */
    this.label = namespace.split('/').pop();

    /**
     * A simple data store where a label maps on a namespace
     * to simplify wired data access.
     *
     * @name index
     * @type {Object}
     * @memberOf Wire#
     */
    this.index = undefined;

    /**
     * The applied data of a knot.
     * The difference to `wired data` is, that the local data
     * is not merged with data from upper hierarchy in the wire.
     *
     * @see Wire#getWireData
     *
     * @name data
     * @type {Object}
     * @default {}
     * @memberOf Wire#
     */
    this.data = knotData || {};

    // state aspect of the knot info object
    // simple state context of key value pairs that can be shared in the wire

    /**
     * The state object of a knot.
     * If the state parameter is defined a copy of the state object became stored,
     * otherwise it is an empty object.
     *
     * @name state
     * @type {Object}
     * @memberOf Wire#
     */
    this.state = clone(state, true) || {};

    // includes the full data set to the next socket in upper hierarchy
    // data fields are submitted by instructions
    // they became delegated to a socket and then processed by routes

    this._wireData = undefined;

    // array of functions that are applied to the wire to receive dynamic data
    // during runtime - the functions arent called with any argument

    this._sharedRuntime = []; // dynamic value callbacks from client references

    // a collection of subordinated Wire references

    this._knots = {}; // subordinated knots in the wire

    // By default a Wire instance became create by Wire.branch. An initial Wire
    // became created without socket argument and the instance became the socket
    // itself

    this._socket = socket_ || this; // the root knot of the wire
    this._parent = parent_ || this; // the parent knot in the wire

    // routes are available by a socket
    // knot references will only delegate the instruction to the socket

    this._routes = {}; // collection of methods to process instructions

    this.sync();
  }

  //--------------------------------------------------------------------------
  //
  //  static
  //
  //--------------------------------------------------------------------------

  /**
   * SRO_ERROR defines the value for a property and the namespace
   * of an object in the shared runtime result. When receiving an
   * error while resolving the shared runtime this name is used as
   * an identifier.
   *
   * @see Wire#getSharedRuntimeValues
   *
   * @constant {String} SRO_ERROR
   * @memberOf Wire
   */
  Wire.SRO_ERROR = 'sroError';

  //--------------------------------------------------------------------------
  //
  //  public method
  //
  //--------------------------------------------------------------------------

  var proto = Wire.prototype;

  /**
   * Get the full data set from a knot.
   * The difference to `data` is, that the wire data
   * is merged with data from upper hierarchy in the wire.
   * It is also possible to use a label from the index as namespace shortcut.
   *
   * Wire data can not be changed anymore unless 
   * client objects request `syncData`.
   *
   * @param {String=} namespace - Choose a specific data set from the wire
   *        data by a namespace
   *
   * @returns {Object} the merged data or a section of it if namespace
   *          is defined
   *
   * @see Wire#data
   * @see Wire#syncData
   *
   * @example
   * var wire = new Wire('knot', {knot: 0});
   * var knot = wire
   *  .branch({knot: 1}, 'direct')
   *  .branch({knot: 2}, 'transitve');
   *
   * console.log(knot.getWireData());
   * console.log(knot.getWireData('/direct'));
   *
   * @function Wire#getWireData
   */
  proto.getWireData = function(namespace) {

    if (!this._wireData)
      this.sync();

    namespace = this.index[namespace] || namespace;
    return namespace ?
      this._wireData[namespace] || {} :
      this._wireData;
  };

  /**
   * Get the applied routes up to the next socket.
   *
   * @returns {Array} the defined routes
   *          When no routes can be found, 
   *          the result array is empty.
   *
   * @function Wire#getRoutes
   */
  proto.getRoutes = function() {
    var parent = this._parent;
    var i, len, route, routes = [];
    var ownRoutes = this._routes;
    var parentRoutes = (parent !== this) ?
      parent.getRoutes():
      [];

    forEach(ownRoutes, function(route, name) {
      routes.push({
        name: name,
        fn: route.fn,
        scope: route.scope
      });
    });

    for(i=0, len=parentRoutes.length; i<len; i++) {
      route = parentRoutes[i];
      if (!ownRoutes[route.name])
        routes.push({
          name: route.name,
          fn: route.fn,
          scope: route.scope
        });
    }

    return routes;
  };

  /**
   * Add a route to a knot.
   * All subordinated brnches will inherite the routes. Whenever
   * a new route became added the childs are syncronized.
   *
   * @param {String} name - The route name
   * @param {Function} fn - A function to execute
   * @param {Object=} scope - The scope within fn is called
   *                          If not defined, the scope is the
   *                          knot reference.
   *
   * @function Wire#defineRoute
   */
  proto.defineRoute = function(name, fn, scope) {
    if (!name || !fn)
      return;

    var routes = this._routes;
    routes[name] = {
      fn: fn,
      scope: scope
    };

    this.syncRoutes();
  };

  /**
   * Returns the states from the knot and from the knots in upper hierarchy
   * up to the next socket.
   *
   * @param {String=} namespace - Choose a specific state object
   *        from all states by a namespace
   *
   * @returns {Object} the requested states.
   *
   * @see Wire#applyState
   * @function Wire#getWireStates
   */
  proto.getWireStates = function(namespace) {
    var parent = this._parent,
        result = {};

    if (!namespace || this.namespace === namespace)
      result[this.namespace] = clone(this.state, true);

    if (parent !== this)
      merge(result, parent.getWireStates());

    return namespace ?
      result[namespace] || {} :
      result;
  };

  /**
   * Returns the values of the shared runtime from the knot
   * and from the knots in upper hierarchy up to the next socket.
   *
   * @param {String=} namespace - Choose a specific shared runtime object
   *        from the shared runtime environment by a namespace
   *
   * @returns {Object} the resolved shared runtime.
   *
   * @example
   * var socket = new Wire('root');
   * var knot = socket.branch({}, 'knot');
   *
   * socket.joinSharedRuntime({
   *  getMediaId: function() { return 'my-id'; },
   *  hasStarted: function() { return false; },
   *  type: 'premium-content'
   * });
   *
   * knot.joinSharedRuntime({
   *  getDuration: function() { return 2; },
   *  isPlaying: function() { throw new Error(); },
   *  time: 1
   * });
   *
   * knot.getSharedRuntimeValues();
   * // {socket: {
   * //   mediaId: 'my-id',
   * //   started: false,
   * //   type: 'premium-content' },
   * // {'socket/knot': {
   * //   duration: 2,
   * //   playing: 'sroError',
   * //   time: '1',
   * //   sroError: { playing: [Error] }
   * // }
   *
   * @see Wire#joinSharedRuntime
   * @function Wire#getSharedRuntimeValues
   */
  proto.getSharedRuntimeValues = function(namespace) {
    var parent = this._parent,
        result = {},
        target = {};

    // perf opt to prevent each sro to resolve when namespace
    // doesn`t match.

    if (!namespace || this.namespace === namespace) {
      result[this.namespace] = target;

      forEach(this._sharedRuntime, function(sro) {
        merge(target, resolveSro(sro));
      });
    }

    if (parent !== this)
      merge(result, parent.getSharedRuntimeValues());

    return namespace ?
      result[namespace] || {} :
      result;
  };

  /**
   * Add an object to the shared runtime.
   *
   * The shared runtime object became attached to the knot.
   * When receiving the values by `getSharedRuntime` all applied
   * objects to the knot and to the knots in upper hierarchy became
   * returned ordered by their namespaces.
   *
   * @param {Object} sharedRuntimeObject - The object to apply.
   *        It can include properties and functions. Properties
   *        are taken as is and functions which starts with `get, is or has`
   *        are invoked and the return value is stored. If a method throws
   *        an error, the error became captured.
   *
   * @see Wire#getSharedRuntimeValues
   * @function Wire#joinSharedRuntime
   */
  proto.joinSharedRuntime = function(sharedRuntimeObject) {
    this._sharedRuntime.push(sharedRuntimeObject);
  };

  /**
   * Rebuilds wire data, index and routes and
   * advises the knot childs to sync.
   *
   * @function Wire#sync
   */
  proto.sync = function() {
    this.syncIndex();
    this.syncData();    
    this.syncRoutes();
  };

  /**
   * Recalls to the parent and socket knot 
   * to rebuild wire data.
   *
   * @function Wire#syncData
   */
  proto.syncData = function() {
    var parent = this._parent,
        knotData = {};

    knotData[this.namespace] = this.data;
    this._wireData = this._wireData = merge({},
      (parent === this ? undefined : parent.getWireData()), // avoid cycles
      knotData
    );

    forEach(this._knots, function(knot) {
      knot.syncData();
    });
  };

  /**
   * Rebulds wire routes of a knot.
   *
   * @function Wire#syncRoutes
   */
  proto.syncRoutes = function() {
    var routes = this.getRoutes();

    forEach(routes, function(route) {
      this[route.name] = function() {
        return route.fn.apply(
          route.scope || this,
          arguments
        );
      };
    }, this);

    forEach(this._knots, function(knot) {
      knot.syncRoutes();
    });
  };

  /**
   * Recalls to the parent and socket knot 
   * to rebuild wire index.
   *
   * @function Wire#syncIndex
   */
  proto.syncIndex = function() {
    var parent = this._parent,
        label  = this.label,
        index  = this.index,
        namespace  = this.namespace,
        parentIndex;

    if (!index) {
      index = {};
      index[label] = namespace;
    }

    parentIndex = (parent !== this) ?
      clone(parent.index, true) :
      {};

    forEach(parentIndex, function(namespace, label) {
      this._updateIndex(index, label, namespace);
    }, this);

    this.index = index;

    forEach(this._knots, function(knot) {
      knot.syncIndex();
    });
  };

  /**
   * Creates a new knot in the wire.
   *
   * @param {Object=} data - the local data that a knot transports.
   *        If not defined an empty Object became created.
   * @param {String=} label - The name of the knot.
   *        The label is used to locate a knot in the wire. If not
   *        defined al default label is created with the schema `knot++`.
   * @param {Object=} state - a reference to share certain properties
   *        from other knotes in the wire. If not defined a new
   *        state object is created.
   *
   * @example
   * var socket = new Wire('root');
   *
   * //expands the wire with a knot
   * var knot = socket.branch();
   *
   * //expands the wire with a knot that has a concrete name 
   * //and applied
   * socket.branch({foo: 'bar'}, 'myKnot');
   * socket.fetch('myKnot');
   *
   * //expand the wire by chaining
   * var deepKnot = knot.branch().branch().branch();
   *
   * @see Wire#fetch
   * @function Wire#branch
   */
  proto.branch = function(data, label, state) {
    var knot, knots = this._knots;
    var namespace = this._socket === this ?
      '' :
      this.namespace;

    // normalize label

    if (!label) {
      autoLabelIndex++;
      label = 'knot' + autoLabelIndex;
    }

    // do nothing if label already exist

    if (knots[label])
      return;

    knot = new Wire(
      namespace + '/' + label,
      data,
      state,
      this._socket,
      this
    );

    this._knots[label] = knot;
    return knot;
  };

  /**
   * Find a knot by its namespace in the wire.
   *
   * @param {String} nampspace - an identifier to locate knotes
   *        in the wire.
   *
   * @returns {Wire} a knot reference or undefined if not found
   *
   * @example
   * var knot, wire = new Wire('wire');
   * wire
   *  .branch({}, 'directKnot')
   *  .branch({}, 'transitiveKnot');
   *
   * //target a knot
   * wire.fetch('directKnot');
   *
   * //target a nested knot
   * knot = wire.fetch('directKnot/transitiveKnot');
   *
   * //target root knot
   * knot.fetch('/');
   *
   * //target relative to root knot
   * knot.fetch('/directKnot');
   *
   * //target parent knot
   * knot.fetch('..');
   *
   * //target relative to parent knot
   * knot.fetch('../transitiveKnot');
   *
   * @function Wire#fetch
   */
  proto.fetch = function(namespace) {
    if (!namespace)
      return;

    // early return, simple socket request
    if (namespace === '/')
      return this._socket;

    // early return, simple parent request
    else if (namespace === '..')
      return this._parent;

    var path = namespace.split('/');
    namespace = path.shift();
    var knot = this._knots[namespace];

    switch(true) {

      // delegate to socket, namespace starts with '/'
      case !namespace:
        return this._socket.fetch(path.join('/'));

      // delegate to parent, namespace starts with '..'
      case (namespace === '..'):
        return this._parent.fetch(path.join('/'));

      // no further names in namespace and label matches
      case (!path.length && namespace === this.label):
        return this;

      // return knot, label matches
      case (knot && !path.length && knot.label === namespace):
        return knot;

      // delegate to knot, resolve further names in namespace
      case !!knot:
        return knot.fetch(path.join('/'));
    }
  };

  /**
   * Remove branches at a knot from the wire by its namespace.
   *
   * @param {String=} namespace - an identifier to locate knots in the wire
   *        If not defined the current knot became truncated. Possible namespace
   *        values are documented at `Wire.fetch`.
   *
   * @see Wire#fetch
   * @function Wire#truncate
   */

  // unlink is for internal use and left undocumented
  // they are not available for external usage

  proto.truncate = function(namespace, unlink_) {

    // unlink is a hidden argument that advises a wire
    // parent knot to remove a knot by the given namespace

    if (unlink_) {
      delete this._knots[namespace];
      return;
    }

    // charge the wire to truncate, by resolving the namespace

    var knot = namespace ?
      this.fetch(namespace) :
      this;

    if (!knot)
      return;

    // delegate truncate request to the affected knot
    // when namespace is defined

    if (knot !== this){
      knot.truncate();
      return;
    }

    // advise the parent to dispose the knot
    // clear and clone own references, remove childs
    // and unlink socket and parent

    this._parent.truncate(this.label, true);

    forEach(this._knots, function(knot) {
      knot.truncate();
    });

    // clean internal data and destroy dependencies

    this.index  = undefined;
    this._knots = {};
    this.namespace = this.label;
    this._wireData = undefined;

    // dispose routes

    var routes = this.getRoutes();
    for (var i=0, len = routes.length; i<len; i++) {
      delete this[routes[i].name];
    }

    // unlink parent and socket

    this._socket = this;
    this._parent = this;
  };

  /**
   * Converts a knot in the wire to a new socket.
   * All routes and childs gets lost.
   * 
   * @function Wire#insulate
   */
  proto.insulate = function(routes) {
    this.truncate();
    this.sync();
  };

  //--------------------------------------------------------------------------
  //
  //  internal method
  //
  //--------------------------------------------------------------------------

  // helper to update the index
  // reduces syncIndex method complexity

  proto._updateIndex = function(index, label, namespace) {

    var labelIndex = index[label];

    if (typeof namespace.push !== 'function')
      namespace = [namespace];

    forEach(namespace, function(namespace) {
      switch (true) {

        // creates a simple index
        case !labelIndex:
          index[label] = namespace;
          break;

        // append to a complex index
        case typeof labelIndex.push === 'function':
          if(indexOf(labelIndex, namespace) === -1)
            labelIndex.push(namespace);
          break;

        // coverts a simple to a complex index
        case labelIndex !== namespace:
          index[label] = [labelIndex, namespace];
          break;
      }
    });
  };

  return Wire;
});
