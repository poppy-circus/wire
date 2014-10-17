/*
 * Defines grunt config for task lodash
 */

(function(exports) {

  'use strict';

  exports.getConfig = function() {
    return {
      build: {
        dest: 'src/lodash.js',
        modifier: 'legacy',
        options: {
          exports: ['amd'],
          include: [
            'forEach',
            'indexOf',
            'merge',
            'clone'
          ],
          flags: [
            '--minify'
          ]
        }
      }
    };
  };
}(typeof exports === 'object' && exports || this));
