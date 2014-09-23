/*
 * Defines grunt config for task jsdoc
 */

(function(exports) {

  'use strict';

  exports.getConfig = function() {
    return {
      api : {
        src: [
          'README.md',
          'src/wire.js'
        ],

        options: {
          destination: 'doc'
        }
      }
    };
  };
}(typeof exports === 'object' && exports || this));
