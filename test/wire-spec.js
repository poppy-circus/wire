require([
  'src/wire'
], function(
  Wire
) {

  describe('Wire', function() {

    it('is a class', function() {
      expect(new Wire('knot') instanceof Wire).toBe(true);
    });

    describe('static', function() {

      describe('SRO_ERROR', function() {

        it('hast the value `sroError`', function() {
          expect(Wire.SRO_ERROR).toBe('sroError');
        });
      });
    });

    describe('constructor', function() {

      it('has a mandory parameter `namespace`', function() {
        expect(function(){ new Wire(); }).toThrow();
      });

      it('`data`, `state` and `socket` are not mandatory', function() {
        expect(function(){ new Wire('knot'); }).not.toThrow();
      });

      describe('normalisation', function() {

        describe('-namespace', function() {

          it('stores the namespace', function() {
            expect(new Wire('wire/knot').namespace).toBe('wire/knot');
          });
        });

        describe('-label', function() {

          it('extracts the label from the namespace argument', function() {
            expect(new Wire('wire/knot').label).toBe('knot');
          });
        });

        describe('-data', function() {

          it('create a data object if not defined', function() {
            expect(new Wire('knot').data).toEqual({});
          });

          it('reuses the `data` argument if defined', function() {
            var data = {foo: 'bar'};
            expect(new Wire('knot', data).data).toBe(data);
          });
        });

        describe('-state', function() {

          it('create a state object if not defined', function() {
            expect(new Wire('knot').getWireStates().knot).toEqual({});
          });

          it('shares the state values from the state argument', function() {
            var state = {foo: 'bar'};

            expect(new Wire('knot', undefined, state).getWireStates().knot)
              .toEqual(state);
          });

          it('clones the state values from the state argument', function() {
            var state = {foo: 'bar'};

            expect(new Wire('knot', undefined, state).getWireStates().knot)
              .not.toBe(state);
          });
        });
      });
    });

    describe('method', function() {

      describe('::getWireData', function() {

        it('returns the local data in relation to the namespace by default', function() {
          expect(new Wire('knot', {foo: 'bar'}).getWireData())
            .toEqual({
              knot: {foo: 'bar'}
            });
        });

        it('assures that qualified data can not become modified', function() {
          var wire = new Wire('knot', {foo: 'bar'});
          var data = wire.getWireData();

          wire.data.bar = 'foo';
          expect(wire.getWireData())
            .toEqual({
              knot: {foo: 'bar'}
            });
        });

        it('merges qualified data from upper hierarchy', function() {
          var wire = new Wire('knot', {knot: 0});
          var knot = wire
            .branch({child: 1}, 'direct')
            .branch({child: 2}, 'transitve');

          expect(knot.getWireData())
            .toEqual({
              "knot": { knot: 0 },
              "/direct": { child: 1 },
              "/direct/transitve": { child: 2 }
            });
        });

        it('can return data by a specific namespace', function() {
          var wire = new Wire('knot', {knot: 0});
          var knot = wire
            .branch({child: 1}, 'direct')
            .branch({child: 2}, 'transitve');

          expect(knot.getWireData('/direct'))
            .toEqual({ child: 1 });
        });

        it('can return data by a specific namespace shortcut from the default index', function() {
          var wire = new Wire('knot', {knot: 0});
          var knot = wire
            .branch({child: 1}, 'direct')
            .branch({child: 2}, 'transitve');

          expect(knot.getWireData('direct'))
            .toEqual({ child: 1 });
        });

        it('can return data by a specific self-defined namespace shortcut from the index', function() {
          var wire = new Wire('knot', {knot: 0});
          var knot = wire
            .branch({child: 1}, 'direct')
            .branch({child: 2}, 'transitve');

          knot.index.shortcut = '/direct';
          expect(knot.getWireData('shortcut'))
            .toEqual({ child: 1 });
        });

        it('returns empty object if no such namespace is presented', function() {
          var wire = new Wire('knot', {knot: 0});
          var knot = wire
            .branch({child: 1}, 'direct')
            .branch({child: 2}, 'transitve');

          expect(knot.getWireData('knot/invalid'))
            .toEqual({});
        });
      });

      describe('::defineRoute', function() {

        it('stores the route setup in the knot', function() {
          var wire = new Wire('knot');
          var route = function(){};
          wire.defineRoute('foo', route);

          expect(wire.getRoutes('knot')).toEqual([{
            name: 'foo',
            fn: route,
            scope: undefined
          }]);
        });

        it('stores the route setup only once per name by overriding', function() {
          var wire = new Wire('knot');
          var route = function(){};
          var route2 = function(){};

          wire.defineRoute('foo', route);
          wire.defineRoute('foo', route2);

          expect(wire.getRoutes('knot')).toEqual([{
            name: 'foo',
            fn: route2,
            scope: undefined
          }]);
        });

        it('starts syncronisation', function() {
          var wire = new Wire('knot');
          spyOn(wire, 'sync');
          wire.defineRoute('foo', function(){});
          expect(wire.sync).toHaveBeenCalledWith();
        });

        it('wont fail when name is missing', function() {
          expect(function() {
            new Wire('knot').defineRoute();
          }).not.toThrow();
        });

        it('wont fail when fn is missing', function() {
          expect(function() {
            new Wire('knot').defineRoute('foo');
          }).not.toThrow();
        });

        describe('route behavior', function() {

          var wire, fn;

          beforeEach(function() {
            fn = jasmine.createSpy('route');
            wire = new Wire('knot');
            wire.defineRoute('myRoute', fn);
            wire.defineRoute('anotherRoute', function(){});
          });

          it('applies a function by the given name to the knot', function() {
            expect(typeof wire.myRoute === 'function').toBe(true);
          });

          it('calls the route function with all arguments', function() {
            wire.myRoute('foo', 'bar');
            expect(fn).toHaveBeenCalledWith(
              'foo',
              'bar'
            );
          });

          it('returns the return value of the route function', function() {
            fn.andReturn('foo');
            expect(wire.myRoute()).toBe('foo');
          });

          it('overrides the previous route while having the same route name', function() {
            fn2 = jasmine.createSpy('route2');
            wire.defineRoute('myRoute', fn2);
            wire.myRoute();
            expect(
              fn2.callCount === 1 &&
              fn.callCount  === 0
            ).toBe(true);
          });

          it('calls the route function within the knot scope by default', function() {
            var scope;
            fn = function(){ scope=this; };
            wire.defineRoute('myRoute', fn);
            wire.myRoute();
            expect(scope).toBe(wire);
          });

          it('can call the route function within the specified scope argument', function() {
            var scope, scopeValue = {};
            fn = function(){ scope=this; };
            wire.defineRoute('myRoute', fn, scopeValue);
            wire.myRoute();
            expect(scope).toBe(scopeValue);
          });

          describe('inherited route behaviour', function() {

            var knot;

            beforeEach(function() {
              knot = wire.branch();
            });

            it('inherits the routes from knots in upper hierarchy', function() {
              expect(typeof knot.myRoute === 'function').toBe(true);
            });

            it('priorizes own routes over inherited routes', function() {
              fn2 = jasmine.createSpy('route2');
              knot.defineRoute('myRoute', fn2);
              knot.myRoute();

              expect(
                fn2.callCount === 1 &&
                fn.callCount  === 0
              ).toBe(true);
            });
          });
        });
      });

      describe('::getRoutes', function() {

        var wire;

        beforeEach(function() {
          wire = new Wire('root');
        });

        it('returns an empty array by default', function() {
          expect(wire.getRoutes()).toEqual({});
        });

        it('returns applied routes from the knot reference', function() {
          var route = function(){};
          wire.defineRoute('foo', route);
          wire.defineRoute('bar', route);

          expect(wire.getRoutes()).toEqual([{
            name: 'foo',
            fn: route,
            scope: undefined
          }, {
            name: 'bar',
            fn: route,
            scope: undefined
          }]);
        });

        it('includes the route names from knots in upper hierarchy', function() {
          var route = function(){};
          var knot = wire.branch(undefined, 'knot');
          wire.defineRoute('foo', route);
          knot.defineRoute('bar', route);

          expect(knot.getRoutes()).toEqual([{
            name: 'bar',
            fn: route,
            scope: undefined
          }, {
            name: 'foo',
            fn: route,
            scope: undefined
          }]);
        });

        it('includes only unique routes priorized by the caller knot', function() {
          var route = function(){};
          var route2 = function(){};
          var knot = wire.branch(undefined, 'knot');
          wire.defineRoute('foo', route);
          knot.defineRoute('foo', route2);

          expect(knot.getRoutes()).toEqual([{
            name: 'foo',
            fn: route2,
            scope: undefined
          }]);
        });
      });

      describe('::sync', function() {

        it('rebuilds the wire data', function() {
          var wire = new Wire('knot', {knot: 0});
          var knot = wire
            .branch({knot: 1}, 'direct')
            .branch({knot: 2}, 'transitve');

          wire.data.root = true;
          wire.sync();

          expect(knot.getWireData())
            .toEqual({
              "knot": { knot: 0, root: true },
              "/direct": { knot: 1 },
              "/direct/transitve": { knot: 2 }
            });
        });

        describe('index creation', function() {

          var wire, knot;

          beforeEach(function() {
            wire = new Wire('knot');
            knot = wire
              .branch(undefined, 'direct')
              .branch(undefined, 'transitve');
          });

          it('rebuilds the index', function() {
            wire.sync();

            expect(knot.index)
              .toEqual({
                knot: 'knot',
                direct: '/direct',
                transitve: '/direct/transitve'
              });
          });

          it('inherites self defined namespace shortcuts', function() {
            wire.index.foo = 'bar';
            knot.index.abc = 'xyz';
            wire.sync();

            expect(knot.index)
              .toEqual({
                knot: 'knot',
                foo: 'bar',
                abc: 'xyz',
                direct: '/direct',
                transitve: '/direct/transitve'
              });
          });

          it('creates an array of namespace on same labels', function() {
            knot = knot
              .branch(undefined, 'direct')
              .branch(undefined, 'direct');
            wire.sync();

            expect(knot.index)
              .toEqual({
                knot: 'knot',
                direct: [
                  '/direct/transitve/direct/direct',
                  '/direct',
                  '/direct/transitve/direct'
                ],
                transitve: '/direct/transitve'
              });
          });

          it('creates an array of inherited namespace shortcuts', function() {
            knot = knot
              .branch(undefined, 'direct')
              .branch(undefined, 'direct');

            wire.index.foo = 'abc';
            knot.index.foo = 'xyz';
            wire.sync();

            expect(knot.index)
              .toEqual({
                knot: 'knot',
                foo: [
                  'xyz',
                  'abc'
                ],
                direct: [
                  '/direct/transitve/direct/direct',
                  '/direct',
                  '/direct/transitve/direct'
                ],
                transitve: '/direct/transitve'
              });
          });
        });
      });

      describe('::branch', function() {

        var wire;

        beforeEach(function() {
          wire = new Wire('wire');
        });

        it('returns a new Wire instance', function() {
          var branch = wire.branch();
          expect(branch instanceof Wire && branch !== wire)
            .toBe(true);
        });

        it('returns `undefined` when the label already exist', function() {
          var branch = wire.branch(undefined, 'knot');
          expect(wire.branch(undefined, 'knot'))
            .toBe(undefined);
        });

        it('constructs the full namespace and applies it to the new Wire instance', function() {
          var branch = wire.branch({}, 'to').branch({}, 'my').branch({}, 'knot');
          expect(branch.namespace).toBe('/to/my/knot');
        });

        describe('normalisation', function() {

          describe('-data', function() {

            it('delegates the value to the new Wire instance if defined', function() {
              var data = {foo: 'bar'};
              expect(wire.branch(data).data)
                .toBe(data);
            });
          });

          describe('-label', function() {

            it('create a default value if not defined', function() {
              expect(wire.branch().label)
                .toMatch(/knot\d*/);
            });

            it('create a unique value if not defined', function() {
              expect(wire.branch().label !== wire.branch().label)
                .toBe(true);
            });

            it('creates the new Wire instance with a given value', function() {
              expect(wire.branch(undefined, 'knot').label)
                .toBe('knot');
            });
          });

          describe('-state', function() {

            it('delegates the value to the new Wire instance if defined', function() {
              expect(wire.branch(undefined, 'knot', {foo: 'bar'}).getWireStates('/knot'))
                .toEqual({
                  foo: 'bar'
                });
            });
          });
        });
      });

      describe('::fetch', function() {

        var root, childLevel1, childLevel2;

        beforeEach(function() {
          root = new Wire('wire');
          childLevel1 = root.branch({}, 'childLevel1');
          childLevel2 = childLevel1.branch({}, 'childLevel2');
        });

        it('returns `undefined` when mandatory `namespace` argument is missing', function() {
          expect(root.fetch()).toBe(undefined);
        });

        it('returns `undefined` when the label is unknown', function() {
          expect(root.fetch('childLevel2')).toBe(undefined);
        });

        it('returns Wire reference when namespace matches the label itself', function() {
          expect(root.fetch('wire')).toBe(root);
        });

        it('returns Wire reference when namespace matches a direct child label', function() {
          expect(root.fetch('childLevel1')).toBe(childLevel1);
        });

        it('returns Wire reference when namespace matches a transitve child label', function() {
          expect(root.fetch('childLevel1/childLevel2')).toBe(childLevel2);
        });

        it('performs lookup from the root knot when namespace starts with `/`', function() {
          expect(childLevel2.fetch('/childLevel1')).toBe(childLevel1);
        });

        it('performs lookup from the parent knot when namespace starts with `..`', function() {
          expect(childLevel2.fetch('../childLevel2')).toBe(childLevel2);
        });

        it('can return the socket by `/`', function() {
          expect(childLevel2.fetch('/')).toBe(root);
        });

        it('can return the parent by `..`', function() {
          expect(childLevel2.fetch('..')).toBe(childLevel1);
        });
      });

      describe('::truncate', function() {

        var root, childLevel1, childLevel2;

        beforeEach(function() {

          root = new Wire('wire', {foo: 'bar'});
          childLevel1 = root.branch({}, 'childLevel1');
          childLevel2 = childLevel1.branch({}, 'childLevel2');
        });

        it('removes the truncated reference from the parent', function() {
          childLevel2.truncate();
          expect(childLevel1.fetch('childLevel2')).toBe(undefined);
        });

        it('removes the transitve references', function() {
          childLevel1.truncate();
          expect(root.fetch('childLevel2')).toBe(undefined);
        });

        it('delegates the truncate request if `namespace` is defined', function() {
          childLevel1.truncate('childLevel2');
          expect(
            root.fetch('childLevel1/childLevel2') === undefined &&
            root.fetch('childLevel1') === childLevel1
          ).toBe(true);
        });

        it('won`t truncate if no Knot for the `namespace` exist', function() {
          root.truncate('childLevel3');
          expect(
            root.fetch('childLevel1/childLevel2') === childLevel2 &&
            root.fetch('childLevel1') === childLevel1
          ).toBe(true);
        });

        describe('after truncate', function() {

          var sro, childLevel3, infoLevel3, dataLevel3, childLevel4;

          beforeEach(function() {
            sro = {
              duration: 2
            };

            dataLevel3 = {foo: 'bar'};
            childLevel3 = childLevel2.branch(dataLevel3, 'childLevel3');

            childLevel3.state.foo = 'bar';
            childLevel3.defineRoute('myRoute', function(){});
            infoLevel3 = childLevel3;

            childLevel2.joinSharedRuntime(sro);
            childLevel3.joinSharedRuntime(sro);

            childLevel4 = childLevel1.branch({}, 'childLevel4');
            childLevel3.truncate();
          });

          it('looses dependency to the original socket', function() {
            expect(childLevel3.fetch('/')).toBe(childLevel3);
          });

          it('looses dependency to the original parent', function() {
            expect(childLevel3.fetch('..')).toBe(childLevel3);
          });

          it('looses the full qualified namespace', function() {
            expect(childLevel3.namespace)
              .toBe(childLevel3.label);
          });

          it('looses qualifiedData from upper hierarchy', function() {
            expect(childLevel3.getWireData()).toEqual({
              childLevel3: dataLevel3
            });
          });

          it('looses the index', function() {
            expect(childLevel3.index).toBeUndefined();
          });

          it('looses the knot childs', function() {
            expect(childLevel3.fetch('childLevel4')).toBeUndefined();
          });

          it('looses routes', function() {
            expect(childLevel3.myRoute).toBeUndefined();
          });

          it('owns a clone of the localData dependency', function() {
            expect(childLevel3.data).toEqual(dataLevel3);
          });

          it('keeps the shared runtime of the knot but not of the wire', function() {
            expect(childLevel3.getSharedRuntimeValues()).toEqual({
              childLevel3: { duration: 2 }
            });
          });

          it('keeps the state value', function() {
            expect(childLevel3.getWireStates('childLevel3')).toEqual({foo: 'bar'});
          });

          it('keeps the localData dependency', function() {
            expect(childLevel3.data).toBe(dataLevel3);
          });
        });
      });

      describe('insulate', function() {

        var wire, parent, knot;

        beforeEach(function() {
          wire = new Wire('root');
          parent = wire.branch({}, 'parent');
          knot = parent.branch({}, 'knot');
        });

        it('truncates', function() {
          spyOn(knot, 'truncate');
          knot.insulate();
          expect(knot.truncate).toHaveBeenCalled();
        });

        it('syncs', function() {
          spyOn(knot, 'sync');
          knot.insulate();
          expect(knot.sync).toHaveBeenCalled();
        });

        it('became converted to a new socket', function() {
          knot.data.foo = 'bar';
          knot.insulate();

          var child = knot
            .branch({}, 'direct')
            .branch({}, 'transitive');

          expect(child.getWireData()).toEqual({
            knot: {foo: 'bar'},
            '/direct': {},
            '/direct/transitive': {}
          });
        });
      });

      describe('::getWireStates', function() {

        var wire;

        beforeEach(function() {
          wire = new Wire('root');
        });

        it('returns an empty object with the knot namespace by default', function() {
          expect(wire.getWireStates()).toEqual({
            root: {}
          });
        });

        it('appends a state to the namespace', function() {
          wire.state.foo = 'bar';
          expect(wire.getWireStates()).toEqual({
            root: { foo: 'bar' }
          });
        });

        it('overrides exsisting values', function() {
          wire.state.value = 'foo';
          wire.state.value = 'bar';
          expect(wire.getWireStates()).toEqual({
            root: { value: 'bar' }
          });
        });

        it('includes the states from knots in upper hierarchy', function() {
          var knot = wire.branch(undefined, 'knot');
          wire.state.value = 'foo';
          knot.state.value = 'bar';

          expect(knot.getWireStates()).toEqual({
            'root'  : { value: 'foo' },
            '/knot' : { value: 'bar' }
          });
        });

        it('can include values from a specific shared runtime object', function() {
          var knot = wire.branch(undefined, 'knot');
          wire.state.value = 'foo';
          knot.state.value = 'bar';

          expect(knot.getWireStates('root')).toEqual({
            value: 'foo'
          });
        });

        it('returns an empty object when no shared runtime object exists for the given namespace', function() {
          var knot = wire.branch(undefined, 'knot');
          wire.state.value = 'foo';
          knot.state.value = 'bar';

          expect(knot.getWireStates('invalid')).toEqual({});
        });
      });

      describe('::getSharedRuntimeValues', function() {

        var wire;

        beforeEach(function() {
          wire = new Wire('root');
        });

        it('returns an empty object with the knot namespace by default', function() {
          expect(wire.getSharedRuntimeValues()).toEqual({
            root: {}
          });
        });

        it('appends values of an shared runtime object to the namespace', function() {
          wire.joinSharedRuntime({ duration: 2 });
          expect(wire.getSharedRuntimeValues()).toEqual({
            root: { duration: 2 }
          });
        });

        it('appends values of multiple shared runtime object to the namespace', function() {
          wire.joinSharedRuntime({ duration: 2 });
          wire.joinSharedRuntime({ time: 1 });
          expect(wire.getSharedRuntimeValues()).toEqual({
            root: {
              duration: 2,
              time: 1
            }
          });
        });

        it('overrides exsisting values', function() {
          wire.joinSharedRuntime({ duration: 2 });
          wire.joinSharedRuntime({ duration: 1 });
          expect(wire.getSharedRuntimeValues()).toEqual({
            root: { duration: 1 }
          });
        });

        it('includes the shared runtimes from knots in upper hierarchy', function() {
          var knot = wire.branch(undefined, 'knot');
          wire.joinSharedRuntime({ duration: 2 });
          knot.joinSharedRuntime({ duration: 1 });

          expect(knot.getSharedRuntimeValues()).toEqual({
            'root'  : { duration: 2 },
            '/knot' : { duration: 1 }
          });
        });

        it('can include values from a specific shared runtime object', function() {
          var knot = wire.branch(undefined, 'knot');
          wire.joinSharedRuntime({ duration: 2 });
          knot.joinSharedRuntime({ duration: 1 });

          expect(knot.getSharedRuntimeValues('root')).toEqual({
            duration: 2
          });
        });

        it('returns an empty object when no shared runtime object exists for the given namespace', function() {
          var knot = wire.branch(undefined, 'knot');
          wire.joinSharedRuntime({ duration: 2 });
          knot.joinSharedRuntime({ duration: 1 });

          expect(knot.getSharedRuntimeValues('invalid')).toEqual({});
        });

        describe('sro functions', function() {

          it ('converts `get[FunctionName]` to `[functionName]` and shares the return value', function() {
            wire.joinSharedRuntime({
              getDuration: function() { return 2; }
            });

            expect(wire.getSharedRuntimeValues()).toEqual({
              root: { duration: 2 }
            });
          });

          it ('converts `is[FunctionName]` to `[functionName]` and shares the return value', function() {
            wire.joinSharedRuntime({
              isPlaying: function() { return true; }
            });

            expect(wire.getSharedRuntimeValues()).toEqual({
              root: { playing: true }
            });
          });

          it ('converts `has[FunctionName]` to `[functionName]` and shares the return value', function() {
            wire.joinSharedRuntime({
              hasError: function() { return false; }
            });

            expect(wire.getSharedRuntimeValues()).toEqual({
              root: { error: false }
            });
          });

          it ('won`t invoke functions that doesn`t start with `get, is or has`', function() {
            var spy = jasmine.createSpy('play');
            wire.joinSharedRuntime({ play: spy });
            wire.getSharedRuntimeValues();

            expect(spy).not.toHaveBeenCalled();
          });

          it ('sets `sroError` as value when method throws an exception', function() {
            wire.joinSharedRuntime({
              isPlaying: function() { throw new Error(); }
            });

            expect(wire.getSharedRuntimeValues().root.playing)
              .toBe('sroError');
          });

          it ('captures the thrown exception', function() {
            var e = new Error();

            wire.joinSharedRuntime({
              isPlaying: function() { throw e; },
              getDuration: function() { throw e; }
            });

            expect(
              wire.getSharedRuntimeValues().root.sroError.playing === e &&
              wire.getSharedRuntimeValues().root.sroError.duration === e
            ).toBe(true);
          });
        });
      });

      describe('::joinSharedRuntime', function() {

        it('applies a shared runtime object to the wire', function() {
          var wire = new Wire('knot');
          wire.joinSharedRuntime({ duration: 2 });

          expect(wire.getSharedRuntimeValues()).toEqual({
            knot: { duration: 2 }
          });
        });

        it('allows to apply multiple shared runtime objects', function() {
          var wire = new Wire('knot');
          wire.joinSharedRuntime({ duration: 2 });
          wire.joinSharedRuntime({ time: 1 });

          expect(wire.getSharedRuntimeValues()).toEqual({
            knot: {
              duration: 2,
              time: 1
            }
          });
        });
      });
    });
  });
});
