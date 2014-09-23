# Wire

The Wire represents a data store to organize and process data.

### It is focused on the following aspects:

- **composition**, expanding the wire by building data trees and allow data access
- **binding**, allow the wire to access dynamic data
- **state**, allow the wire to manage states besides data structures
- **command**, allow the wire to delegate the data to data handler functions

### It is not responsible for:

- **mapping**, there is no generic solution for mapping. It is always bounded 
  to specific project requirements and therefore not included. Mapping must be 
  designed as a pre- or post job. The only mapping helper that is available, is 
  the mapping of data namespaces by a knot index.

### grunt tasks

~~~bash
# api docs
grunt jsdoc
~~~

~~~bash
# code coverage
grunt coverage-report
~~~
