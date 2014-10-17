define([
  './lodash'
], function(
  lodash
) {

  'use strict';

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

  // creates a delegate function for a reaction

  var createRouteDelegate = function(name) {

    return function() {
      var routes = this._socket.getRoutes();
      var args = Array.prototype.slice.call(arguments);
      args.push(this);

      try {

        // asure that the reaction is called in the knot scope
        // a client may use lodash.bind, therefore the knot reference
        // is attached to the end of the argument list

        return routes[name].apply(this, args);
      } catch(e){}
    };
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
   *                    and allow data access
   * - **binding**, allow the wire to access dynamic data
   * - **state**, allow the wire to manage states besides data structures
   * - **command**, allow the wire to delegate the data to
   *                data handler functions
   *
   * ### It is not responsible for:
   *
   * - **mapping**, there is no generic solution for mapping. It is always
   *                bounded to specific project requirements and therefore not
   *                included. Mapping must be designed as a pre- or post job.
   *                The only mapping helper that is available, is the mapping
   *                of data namespaces by a knot index.
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
   * allows also the definition of callback functions (`routes`) to operate
   * on data structures. There isn`t just a single socket - each knot can became
   * a socket by using the _insulate_ method.
   *
   * A knot - as said - is constructed to transport data. The data input stream
   * is manifold and the wire cares about it. The simplest case is static data.
   * It became imported when calling _branch_. To access static data values a
   * knot ofters two getter methods, `getKnotData` and `getWireData`. The method
   * getKnotData delivers just the assigned static data and allows modification
   * of it. The getWireData method returns a data group that includes all data
   * sets up to the next socket, which are seperated by the particular
   * knot namespace.
   *
   * Another case is dynamic data. There are multiple ways to handle them. One
   * option is to update the knot data and calling _sync_. This will refresh the
   * wire data of a knot and its childs. Second option is to use `routes`.
   * Routes are defined as a collection of functions that are applied to a
   * socket knot. Each subordinated knot of a socket will include a delegate
   * function to the reaction, where dynamic data can be assigned to as an
   * argument. In this case the wire doesn`t care about the data at all, it just
   * delegates it. (A reaction will know about the invoker knot, because the
   * reference is attached to the argument list as its last argument).
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
   * Besides data handling the wire ofters _getKnotInfo_ through a knot
   * reference. A knot info provides informations about the namespace, the
   * label, the state and the index. Where namespace is the full qualified path
   * from a socket to the affected knot, the `label` represents just the name,
   * eg with a namespace="socket/parent/knot", the label would be knot.
   *
   * The `state` is a simple slot to store any details by key-value pairs.
   * It doesn't affect the carried data at all, but it can be used to control
   * the internal behaviour of routes. To set a new state simply use
   * _applyState_.
   * The `index` is more or less a helper to improve navigation in the wire
   * data and shared runtime. In those objects the data is grouped by the
   * affected namespace. Sometimes this fact can became problematic because the
   * namespace needs to be known. The index maps those namespaces by the label,
   * eg knot:'socket/parent/knot'. If a label is used multiple the indexer will
   * convert the namespace value to an array of namespace. The wire ofters the
   * method _updateIndex_ to define own namespace mapping.
   *
   * @param {String} namespace - the knot identifier
   * @param {Object=} data - Any data to store in the wire
   *        If not defined an empty object became created
   * @param {Object=} state - the initial state object
   *        If not defined an empty object became created
   *
   * @constructor Wire
   */

  // socket and parent are for internal use and left undocumented
  // they are not available for external usage

  function Wire(namespace, data, state, socket, parent) {

    // namespace and label are for orientation purpose in the wire

    this._namespace = namespace; // the path from a socket (full knot identifier)
    namespace = namespace.split('/');
    this._label = namespace[namespace.length - 1]; // the knot identifier

    // state aspect of the knot info object
    // simple state context of key value pairs that can be shared in the wire

    this._state = clone(state, true) || {};
    this._index = undefined; // simplify access of wired data

    // data fields are submitted by instructions
    // they became delegated to a socket and then processed by routes

    this._knotData = data || {}; // includes the initial data after construction
    this._wireData = undefined;  // includes the full data set

    // array of functions that are applied to the wire to receive dynamic data
    // during runtime - the functions arent called with any argument

    this._sharedRuntime = []; // dynamic value callbacks from client references

    // a collection of subordinated Wire references

    this._knots = {}; // subordinated knots in the wire

    // By default a Wire instance became create by Wire.branch. An initial Wire
    // became created without socket argument and the instance became the socket
    // itself

    this._socket = socket || this; // the root knot of the wire
    this._parent = parent || this; // the parent knot in the wire

    // routes are available by a socket
    // knot references will only delegate the instruction to the socket

    this._routes = undefined; // collection of methods to process instructions

    this._recall();
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
   * The difference to `knotData` is, that the wire data
   * is merged with data from upper hierarchy in the wire.
   * It is also possible to use a label from the index as namespace shortcut.
   *
   * Wire data can not be changed anymore unless client objects request
   * a `sync`.
   *
   * @param {String=} namespace - Choose a specific data set from the wire
   *        data by a namespace
   *
   * @returns {Object} the merged data or a section of it if namespace
   *          is defined
   *
   * @see Wire#getKnotData
   * @see Wire#recall
   *
   * @example
   * var wire = new Wire('knot', {knot: 0});
   * var knot = wire
   *  .branch({knot: 1}, 'direct')
   *  .branch({knot: 2}, 'transitve');
   *
   * console.log(knot.getWireData());
   * console.log(knot.getWireData('knot/direct'));
   *
   * @function Wire#getWireData
   */
  proto.getWireData = function(namespace) {

    if (!this._wireData)
      this._recall();

    namespace = this._index[namespace] || namespace;

    return namespace ?
      this._wireData[namespace] || {} :
      this._wireData;
  };

  /**
   * Get the applied data from a knot.
   * The difference to `detail` is, that the local data
   * is not merged with data from upper hierarchy in the wire.
   *
   * @returns {Object} the applied knot data
   * @see Wire#getDetail
   *
   * @function Wire#getKnotData
   */
  proto.getKnotData = function() {
    return this._knotData;
  };

  /**
   * Get the local setup from a knot in the wire.
   *
   * @returns {KnotInfo} the setup of a wired knot.
   *          It is not possible to alter the values of a KnotInfo
   *          except the state informations.
   *
   * @function Wire#getKnotInfo
   */
  proto.getKnotInfo = function() {

    // create a new knotInfo reference each time to assure that
    // namespace and label can not be modified

    return {
      label: this._label,
      namespace:  this._namespace,
      index: this._index,
      state: this._state
    };
  };

  /**
   * Get the applied routes from the next socket.
   *
   * @returns {Array|undefined} the defined routes
   *          When no socket can be found, the result is undefined.
   *
   * @function Wire#getRoutes
   */
  proto.getRoutes = function() {
    if (this._socket === this)
      return this._routes;

    return this._socket.getRoutes();
  };

  /**
   * A convenient way to attach any kind of information to the
   * state data store of a knot. Alternatively it is possible to
   * apply data by `_.getKnoteInfo().state.foo = 'bar'`.
   *
   * @param {String} name - The state name.
   * @param {Object} value - The state value.
   *
   * @function Wire#applyState
   */
  proto.applyState = function(name, value) {
    this._state[name] = value;
  };

  /**
   * A convenient way to modify the relationship between label and
   * namespace in the index section. Alternatively it is possible to
   * update index by `_.getKnoteInfo().index.label = 'namespace'`.
   *
   * @param {String} label - The index name.
   * @param {String=} namespace - The index value.
   *                            If not defined the own namespace is used.
   *
   * @function Wire#updateIndex
   */
  proto.updateIndex = function(label, namespace) {
    if (!namespace)
      namespace = this._namespace;

    this._index[label] = namespace;
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
   * socket.getSharedRuntimeValues();
   * // {socket:
   * //   mediaId: 'my-id',
   * //   started: false,
   * //   type: 'premium-content'
   * // }
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

    if (!namespace || this._namespace === namespace) {
      result[this._namespace] = target;

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
   * Recalls to the parent and socket knot to rebuild knots
   * and advises the childs of a knot reference to sync.
   * It affects the wired data and the routes.
   *
   * @example
   * var root = new Wire('root');
   * var knot = root.branch({}, 'knot');
   * knot.getWireData(); // {root: {}, 'wire/knot': {}}
   *
   * root.getKnotData().foo = 'bar';
   * root.sync();
   * knot.getWireData(); // {root: {foo: 'bar'}, 'wire/knot': {}}
   *
   * @function Wire#sync
   */
  proto.sync = function() {
    this._recall();

    forEach(this._knots, function(knot) {
      knot.sync();
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
   * var knot = socket.branch();
   *
   * //assign data and a label to a knot
   * socket.branch({foo: 'bar'}, 'myKnot');
   * socket.fetch('myKnot');
   *
   * //transitive knotes
   * var deepKnot = knot.branch().branch().branch();
   *
   * //share knot state
   * var otherKnot = socket.branch({}, 'foo', knot.getKnotInfo().state);
   *
   * @see KnotInfo#state
   * @see Wire#fetch
   * @function Wire#branch
   */
  proto.branch = function(data, label, state) {
    var knot, knots = this._knots;

    // normalize label

    if (!label) {
      autoLabelIndex++;
      label = 'knot' + autoLabelIndex;
    }

    // do nothing if label already exist

    if (knots[label])
      return;

    knot = new Wire(
      this._namespace + '/' + label,
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
      case (!path.length && namespace === this._label):
        return this;

      // return knot, label matches
      case (knot && !path.length && knot.getKnotInfo().label === namespace):
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

  proto.truncate = function(namespace, unlink) {

    // unlink is a hidden argument that advises a wire
    // parent knot to remove a knot by the given namespace

    if (unlink) {
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

    this._parent.truncate(this._label, true);

    forEach(this._knots, function(knot) {
      knot.truncate();
    });

    // clean internal data and destroy dependencies

    this._namespace = this._label;
    this._wireData  = undefined;
    this._index     = undefined;
    this._knots     = {};

    // dispose routes

    forEach(this.getRoutes(), function(reaction, name) {
      delete this[name];
    }, this);

    this._routes = undefined;

    // unlink parent and socket

    this._socket = this;
    this._parent = this;
  };

  /**
   * Converts a knot in the wire to a new socket.
   *
   * Routes are delegated to the next socket of a knot to process further
   * actions. The reaction is called within the scope of the affected knot.
   * All arguments are delegated and appended by the knot itself as the last
   * argument. Errors in a reaction function are swollowed!
   *
   * @param {Object=} routes - a collections of functions that
   *        can be used in the wire as command instructions.
   *
   * @example
   * var reaction = function() { return this; }
   *
   * var wire = new Wire('wire');
   * wire.insulate({myRoute: reaction});
   *
   * var knot = wire.branch();
   * knot.myRoute(); //knot
   *
   * @see Wire#translate
   * @function Wire#insulate
   */
  proto.insulate = function(routes) {
    this.truncate();
    this._routes = routes || {};
    this.sync();
  };

  //--------------------------------------------------------------------------
  //
  //  internal method
  //
  //--------------------------------------------------------------------------

  // helper to sync this property set
  // with values from upper hierarchy

  proto._recall = function() {
    var parent = this._parent,
        routes   = this.getRoutes(),
        knotInfo = this.getKnotInfo(),
        index = this._index = {},
        knotData = {},
        label, wireData;

    // construct wire data object

    knotData[this._namespace] = this._knotData;
    var parentData = parent === this ? // avoid cycles
      undefined :
      parent.getWireData();

    wireData = this._wireData = merge({},
      parentData,
      knotData
    );

    // build index

    forEach(wireData, function(data, namespace) {
      label = namespace.split('/');
      label = label[label.length - 1];

      if (!index[label])
        index[label] = namespace;

      else if (typeof index[label].push === 'function')
        index[label].push(namespace);

      else
        index[label] = [index[label], namespace];
    });

    // apply routes

    forEach(routes, function(reaction, name) {
      this[name] = createRouteDelegate(name);
    }, this);
  };

  return Wire;
});

//--------------------------------------------------------------------------
//
//  KnotInfo
//
//--------------------------------------------------------------------------

/**
 * Structure of an info object that represents the local setup of a knot
 * in the Wire.
 *
 * @property {String} label - The name of a knot.
 *           The label is always unique on the same level in the wire.
 *           It is used to located knotes.
 *
 * @property {String} namespace - Includes the full qualified location of a knot.
 *           In the wire each knot is connected to knotes in upper hierarchy.
 *           The namespace property represents the hierarchy as a string value
 *           joined by a '/'.
 *
 * @property {Object} state - A simple data store
 *           where any kind of informations can be aligned to.
 *
 * @property {Object} index - A simple data store
 *           where a label maps on a namespace to simplify wired data access.
 *
 * @see Wire
 * @namespace KnotInfo
 */
