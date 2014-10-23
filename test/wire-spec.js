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

        describe('-namspace', function() {

          it('stores the namespace', function() {
            expect(new Wire('wire/knot').getKnotInfo().namespace).toBe('wire/knot');
          });
        });

        describe('-label', function() {

          it('extracts the label from the namespace argument', function() {
            expect(new Wire('wire/knot').getKnotInfo().label).toBe('knot');
          });
        });

        describe('-localData', function() {

          it('create a data object if not defined', function() {
            expect(new Wire('knot').getKnotData()).toEqual({});
          });

          it('reuses the `data` argument if defined', function() {
            var data = {foo: 'bar'};
            expect(new Wire('knot', data).getKnotData()).toBe(data);
          });
        });

        describe('-state', function() {

          it('create a state object if not defined', function() {
            expect(new Wire('knot').getStates().knot).toEqual({});
          });

          it('shares the state values from the state argument', function() {
            var state = {foo: 'bar'};

            expect(new Wire('knot', undefined, state).getStates().knot)
              .toEqual(state);
          });

          it('clones the state values from the state argument', function() {
            var state = {foo: 'bar'};

            expect(new Wire('knot', undefined, state).getStates().knot)
              .not.toBe(state);
          });
        });
      });
    });

    describe('method', function() {

      describe('::getKnotInfo', function() {

        var wire, info;

        beforeEach(function() {
          wire = new Wire('wire/knot', undefined, {foo: 'bar'});
          info = wire.getKnotInfo();
        });

        it('returns the actual setup', function() {
          expect(info).toEqual({
            label: 'knot',
            namespace: 'wire/knot'
          });
        });

        it('prevents manipulation of `label`, `namespace` and `index`', function() {
          info.label = 'manipulated';
          info.namespace = 'manipulated';
          info.index = 'manipulated';

          expect(wire.getKnotInfo()).toEqual({
            label: 'knot',
            namespace: 'wire/knot'
          });
        });
      });

      describe('::applyState', function() {

        it('adds a state to the knot', function() {
          var wire = new Wire('knot');
          wire.applyState('foo', 'bar');
          expect(wire.getStates('knot').foo).toBe('bar');
        });
      });

      describe('::getKnotData', function() {

        it('returns the unmerged and unmapped data value', function() {
          var data = {foo: 'bar'};
          expect(new Wire('knot', data).getKnotData()).toBe(data);
        });
      });

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

          wire.getKnotData().bar = 'foo';
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
              "knot/direct": { child: 1 },
              "knot/direct/transitve": { child: 2 }
            });
        });

        it('can return data by a specific namespace', function() {
          var wire = new Wire('knot', {knot: 0});
          var knot = wire
            .branch({child: 1}, 'direct')
            .branch({child: 2}, 'transitve');

          expect(knot.getWireData('knot/direct'))
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

          knot.index.shortcut = 'knot/direct';
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

      describe('getRoutes', function() {

        it('returns undefined by default', function() {
          expect(new Wire('wire').getRoutes()).toBeUndefined();
        });

        it('returns an empty array when knot is a socket but has no routes defined', function() {
          var wire = new Wire('wire');
          wire.insulate();
          expect(wire.getRoutes()).toEqual([]);
        });

        it('returns the routes when knot is a socket and routes are defined', function() {
          var wire = new Wire('wire');
          var routes = {};
          wire.insulate(routes);
          expect(wire.getRoutes()).toBe(routes);
        });

        it('returns the routes from the next socket', function() {
          var wire = new Wire('wire');
          var routes = {};
          wire.insulate(routes);
          expect(wire.branch().getRoutes()).toBe(routes);
        });
      });

      describe('::sync', function() {

        xit('rebuilds the wire data', function() {
          var wire = new Wire('knot', {knot: 0});
          var knot = wire
            .branch({knot: 1}, 'direct')
            .branch({knot: 2}, 'transitve');

          wire.getKnotData().root = true;
          wire.sync();

          expect(knot.getWireData())
            .toEqual({
              "knot": { knot: 0, root: true },
              "knot/direct": { knot: 1 },
              "knot/direct/transitve": { knot: 2 }
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
                direct: 'knot/direct',
                transitve: 'knot/direct/transitve'
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
                direct: 'knot/direct',
                transitve: 'knot/direct/transitve'
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
                  'knot/direct/transitve/direct/direct',
                  'knot/direct',
                  'knot/direct/transitve/direct'
                ],
                transitve: 'knot/direct/transitve'
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
                  'knot/direct/transitve/direct/direct',
                  'knot/direct',
                  'knot/direct/transitve/direct'
                ],
                transitve: 'knot/direct/transitve'
              });
          });
        });

        describe('knot route', function() {

          var route, wire, knot;

          beforeEach(function() {
            route = jasmine.createSpy('route');

            wire = new Wire('wire');
            wire.insulate({
              myRoute: route
            });

            knot = wire.branch();
          });

          it('defines a delegate function with the name of the route', function() {
            expect(typeof knot.myRoute).toBe('function');
          });

          it('delegates to the defined route', function() {
            knot.myRoute();
            expect(route).toHaveBeenCalled();
          });

          it('swollows exceptions', function() {
            route.andCallFake(function() {
              throw new Error();
            });

            knot.myRoute();
            expect(route).toHaveBeenCalled();
          });

          it('calls the route with the scope of the knot', function() {
            var scope;

            route.andCallFake(function() {
              scope = this;
            });

            knot.myRoute();
            expect(scope).toBe(knot);
          });

          it('sends arguments and the knot reference to the route', function() {
            knot.myRoute('value');
            expect(route).toHaveBeenCalledWith('value', knot);
          });

          it('returns possible values from the route target', function() {
            route.andReturn('myValue');
            expect(knot.myRoute('value')).toBe('myValue');
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
          expect(branch.getKnotInfo().namespace).toBe('wire/to/my/knot');
        });

        describe('normalisation', function() {

          describe('-data', function() {

            it('delegates the value to the new Wire instance if defined', function() {
              var data = {foo: 'bar'};
              expect(wire.branch(data).getKnotData())
                .toBe(data);
            });
          });

          describe('-label', function() {

            it('create a default value if not defined', function() {
              expect(wire.branch().getKnotInfo().label)
                .toMatch(/knot\d*/);
            });

            it('create a unique value if not defined', function() {
              expect(wire.branch().getKnotInfo().label !== wire.branch().getKnotInfo().label)
                .toBe(true);
            });

            it('creates the new Wire instance with a given value', function() {
              expect(wire.branch(undefined, 'knot').getKnotInfo().label)
                .toBe('knot');
            });
          });

          describe('-state', function() {

            it('delegates the value to the new Wire instance if defined', function() {
              expect(wire.branch(undefined, 'knot', {foo: 'bar'}).getStates('wire/knot'))
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

        var root, childLevel1, childLevel2, routes;

        beforeEach(function() {

          routes = {
            myRoute: function(){}
          };

          root = new Wire('wire', {foo: 'bar'});
          root.insulate(routes);

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

            childLevel3.applyState('foo', 'bar');
            infoLevel3 = childLevel3.getKnotInfo();

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
            expect(childLevel3.getKnotInfo().namespace)
              .toBe(childLevel3.getKnotInfo().label);
          });

          it('looses qualifiedData from upper hierarchy', function() {
            expect(childLevel3.getWireData()).toEqual({
              childLevel3: dataLevel3
            });
          });

          it('looses the index', function() {
            expect(childLevel3.getKnotInfo().index).toBeUndefined();
          });

          it('looses the knot childs', function() {
            expect(childLevel3.fetch('childLevel4')).toBeUndefined();
          });

          it('looses routes', function() {
            expect(childLevel3.myRoute).toBeUndefined();
          });

          it('owns a clone of the localData dependency', function() {
            expect(childLevel3.getKnotData()).toEqual(dataLevel3);
          });

          it('keeps the shared runtime of the knot but not of the wire', function() {
            expect(childLevel3.getSharedRuntimeValues()).toEqual({
              childLevel3: { duration: 2 }
            });
          });

          it('keeps the state value', function() {
            expect(childLevel3.getStates('childLevel3')).toEqual({foo: 'bar'});
          });

          it('keeps the localData dependency', function() {
            expect(childLevel3.getKnotData()).toBe(dataLevel3);
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
          knot.getKnotData().foo = 'bar';
          knot.insulate();

          var child = knot
            .branch({}, 'direct')
            .branch({}, 'transitive');

          expect(child.getWireData()).toEqual({
            knot: {foo: 'bar'},
            'knot/direct': {},
            'knot/direct/transitive': {}
          });
        });
      });

      describe('::getStates', function() {

        var wire;

        beforeEach(function() {
          wire = new Wire('root');
        });

        it('returns an empty object with the knot namespace by default', function() {
          expect(wire.getStates()).toEqual({
            root: {}
          });
        });

        it('appends a state to the namespace', function() {
          wire.applyState('foo', 'bar');
          expect(wire.getStates()).toEqual({
            root: { foo: 'bar' }
          });
        });

        it('overrides exsisting values', function() {
          wire.applyState('state', 'foo');
          wire.applyState('state', 'bar');
          expect(wire.getStates()).toEqual({
            root: { state: 'bar' }
          });
        });

        it('includes the states from knots in upper hierarchy', function() {
          var knot = wire.branch(undefined, 'knot');
          wire.applyState('state', 'foo');
          knot.applyState('state', 'bar');

          expect(knot.getStates()).toEqual({
            'root'      : { state: 'foo' },
            'root/knot' : { state: 'bar' }
          });
        });

        it('can include values from a specific shared runtime object', function() {
          var knot = wire.branch(undefined, 'knot');
          wire.applyState('state', 'foo');
          knot.applyState('state', 'bar');

          expect(knot.getStates('root')).toEqual({
            state: 'foo'
          });
        });

        it('returns an empty object when no shared runtime object exists for the given namespace', function() {
          var knot = wire.branch(undefined, 'knot');
          wire.applyState('state', 'foo');
          knot.applyState('state', 'bar');

          expect(knot.getStates('invalid')).toEqual({});
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
            'root'      : { duration: 2 },
            'root/knot' : { duration: 1 }
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
