'use strict';

var _utils;

function _load_utils() {
  return _utils = require('../lib/utils');
}

describe('utils', () => {
  describe('parseFileNameQuery()', () => {
    const tests = [{
      query: 'pkg/nuclide-fuzzy-filename-provider/lib/FuzzyFileNameProvider.js',
      result: {
        fileName: 'pkg/nuclide-fuzzy-filename-provider/lib/FuzzyFileNameProvider.js',
        line: undefined,
        column: undefined
      }
    }, {
      query: 'pkg/nuclide-fuzzy-filename-provider/lib/FuzzyFileNameProvider.js:123',
      result: {
        fileName: 'pkg/nuclide-fuzzy-filename-provider/lib/FuzzyFileNameProvider.js',
        line: 122,
        column: undefined
      }
    }, {
      query: 'pkg/nuclide-fuzzy-filename-provider/lib/FuzzyFileNameProvider.js:123:45',
      result: {
        fileName: 'pkg/nuclide-fuzzy-filename-provider/lib/FuzzyFileNameProvider.js',
        line: 122,
        column: 44
      }
    }, {
      query: 'pkg/nuclide-fuzzy-filename-provider/lib/FuzzyFileNameProvider.js:invalid:3',
      result: {
        fileName: 'pkg/nuclide-fuzzy-filename-provider/lib/FuzzyFileNameProvider.js',
        line: undefined,
        column: 2
      }
    }, {
      query: 'pkg/nuclide-fuzzy-filename-provider/lib/FuzzyFileNameProvider.js:',
      result: {
        fileName: 'pkg/nuclide-fuzzy-filename-provider/lib/FuzzyFileNameProvider.js',
        line: undefined,
        column: undefined
      }
    }];

    for (const test of tests) {
      it(`should parse "${test.query}"`, () => {
        expect((0, (_utils || _load_utils()).parseFileNameQuery)(test.query)).toEqual(test.result);
      });
    }
  });
}); /**
     * Copyright (c) 2015-present, Facebook, Inc.
     * All rights reserved.
     *
     * This source code is licensed under the license found in the LICENSE file in
     * the root directory of this source tree.
     *
     *  strict
     * @format
     */