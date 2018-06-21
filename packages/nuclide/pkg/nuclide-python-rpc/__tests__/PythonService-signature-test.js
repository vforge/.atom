'use strict';

var _fsPromise;

function _load_fsPromise() {
  return _fsPromise = _interopRequireDefault(require('../../../modules/nuclide-commons/fsPromise'));
}

var _nuclideUri;

function _load_nuclideUri() {
  return _nuclideUri = _interopRequireDefault(require('../../../modules/nuclide-commons/nuclideUri'));
}

var _JediServerManager;

function _load_JediServerManager() {
  return _JediServerManager = _interopRequireDefault(require('../lib/JediServerManager'));
}

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

jest.setTimeout(20000); /**
                         * Copyright (c) 2015-present, Facebook, Inc.
                         * All rights reserved.
                         *
                         * This source code is licensed under the license found in the LICENSE file in
                         * the root directory of this source tree.
                         *
                         * 
                         * @format
                         */

const FIXTURE = (_nuclideUri || _load_nuclideUri()).default.join(__dirname, '../__mocks__/fixtures/signature_help.py');

describe('PythonService', () => {
  let serverManager = null;

  beforeEach(() => {
    serverManager = new (_JediServerManager || _load_JediServerManager()).default();
    // Don't try to retrieve additional paths from Buck/etc.
    jest.spyOn(serverManager, 'getSysPath').mockReturnValue([]);
  });

  afterEach(() => {
    serverManager.reset();
  });

  it('Returns signatures', async () => {
    await (async () => {
      const contents = await (_fsPromise || _load_fsPromise()).default.readFile(FIXTURE, 'utf8');
      const jediService = await serverManager.getJediService();

      expect((await jediService.get_signature_help(FIXTURE, contents, [], 13, 0))).toBe(null);

      // main()
      expect((await jediService.get_signature_help(FIXTURE, contents, [], 13, 5))).toEqual({
        signatures: [{
          label: 'main(param1, param2)',
          documentation: 'Main docstring',
          parameters: [{ label: 'param1', documentation: '' }, { label: 'param2', documentation: '' }]
        }],
        activeSignature: 0,
        activeParameter: 0
      });

      // isinstance(obj)
      expect((await jediService.get_signature_help(FIXTURE, contents, [], 12, 11))).toEqual({
        signatures: [{
          label: 'isinstance(obj, class_or_tuple)',
          documentation: jasmine.any(String),
          parameters: [{ label: 'obj', documentation: '' }, { label: 'class_or_tuple', documentation: '' }]
        }],
        activeSignature: 0,
        activeParameter: 0
      });

      // isinstance(obj, class)
      expect((await jediService.get_signature_help(FIXTURE, contents, [], 12, 18))).toEqual({
        signatures: [{
          label: 'isinstance(obj, class_or_tuple)',
          documentation: jasmine.any(String),
          parameters: [{ label: 'obj', documentation: '' }, { label: 'class_or_tuple', documentation: '' }]
        }],
        activeSignature: 0,
        activeParameter: 1
      });

      // Don't return anything if we're inside the string.
      expect((await jediService.get_signature_help(FIXTURE, contents, [], 12, 13))).toEqual(null);

      // len()
      expect((await jediService.get_signature_help(FIXTURE, contents, [], 11, 4))).toEqual({
        signatures: [{
          label: 'len(obj)',
          documentation: 'Return the number of items in a container.',
          parameters: [{ label: 'obj', documentation: '' }]
        }],
        activeSignature: 0,
        activeParameter: 0
      });
    })();
  });
});