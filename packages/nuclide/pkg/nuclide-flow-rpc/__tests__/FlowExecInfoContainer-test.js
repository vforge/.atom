'use strict';

var _FlowExecInfoContainer;

function _load_FlowExecInfoContainer() {
  return _FlowExecInfoContainer = require('../lib/FlowExecInfoContainer');
}

var _nuclideUri;

function _load_nuclideUri() {
  return _nuclideUri = _interopRequireDefault(require('../../../modules/nuclide-commons/nuclideUri'));
}

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

describe('FlowExecInfoContainer', () => {
  const dummyFlowPath = (_nuclideUri || _load_nuclideUri()).default.join(__dirname, '../__mocks__/fixtures/dummyflow');
  const withFlowBinProjectPath = (_nuclideUri || _load_nuclideUri()).default.join(__dirname, '../__mocks__/fixtures/with-flow-bin');
  const withoutFlowBinProjectPath = (_nuclideUri || _load_nuclideUri()).default.join(__dirname, '../__mocks__/fixtures/without-flow-bin');

  let infoContainer = null;

  beforeEach(() => {
    infoContainer = new (_FlowExecInfoContainer || _load_FlowExecInfoContainer()).FlowExecInfoContainer();
    infoContainer._pathToFlow = dummyFlowPath;

    // These tests are run in stock Node, and rely on that fact. The code under test checks for the
    // existence of `global.atom` and gets config values from Atom if it exists. Otherwise it falls
    // back on defaults (meant for use on the nuclide-server). These tests manipulate the stored
    // values directly to test the effect of different config values. So, we do not want config
    // values from Atom interfering.
    expect(global.atom).toBeUndefined();
  });

  // Test this directly so caching doesn't get in the way
  describe('_computeFlowExecInfo', () => {
    describe('with flow-bin disallowed (default)', () => {
      describe('in a directory without flow-bin', () => {
        it('should return the system Flow binary', async () => {
          await (async () => {
            const execInfo = await infoContainer._computeFlowExecInfo(withoutFlowBinProjectPath);

            if (!(execInfo != null)) {
              throw new Error('Invariant violation: "execInfo != null"');
            }

            expect(execInfo.pathToFlow).toBe(dummyFlowPath);
          })();
        });
      });
      describe('in a directory with flow-bin', () => {
        it('should return the system Flow binary', async () => {
          await (async () => {
            const execInfo = await infoContainer._computeFlowExecInfo(withFlowBinProjectPath);

            if (!(execInfo != null)) {
              throw new Error('Invariant violation: "execInfo != null"');
            }

            expect(execInfo.pathToFlow).toBe(dummyFlowPath);
          })();
        });
        it('should return null if Flow cannot be found', async () => {
          await (async () => {
            // If somebody has this on their PATH I'm going to be upset
            infoContainer._pathToFlow = 'notAValidExecutable';
            const execInfo = await infoContainer._computeFlowExecInfo(withFlowBinProjectPath);
            expect(execInfo).toBeNull();
          })();
        });
      });
      describe('outside of a Flow root', () => {
        it('should return the system Flow binary', async () => {
          await (async () => {
            const execInfo = await infoContainer._computeFlowExecInfo(null);

            if (!(execInfo != null)) {
              throw new Error('Invariant violation: "execInfo != null"');
            }

            expect(execInfo.pathToFlow).toBe(dummyFlowPath);
          })();
        });
      });
    });

    describe('with flow-bin allowed', () => {
      beforeEach(() => {
        infoContainer._canUseFlowBin = true;
      });
      describe('in a directory without flow-bin', () => {
        it('should return the system Flow binary', async () => {
          await (async () => {
            const execInfo = await infoContainer._computeFlowExecInfo(withoutFlowBinProjectPath);

            if (!(execInfo != null)) {
              throw new Error('Invariant violation: "execInfo != null"');
            }

            expect(execInfo.pathToFlow).toBe(dummyFlowPath);
          })();
        });
      });
      describe('in a directory with flow-bin', () => {
        it('should return the local flow-bin binary', async () => {
          const execInfo = await infoContainer._computeFlowExecInfo(withFlowBinProjectPath);

          if (!(execInfo != null)) {
            throw new Error('Invariant violation: "execInfo != null"');
          }

          const flowBinPath = (_nuclideUri || _load_nuclideUri()).default.join(withFlowBinProjectPath, 'node_modules/.bin/flow');
          expect(execInfo.pathToFlow).toBe(flowBinPath);
        });
      });
      describe('outside of a Flow root', () => {
        it('should return the system Flow binary', async () => {
          await (async () => {
            const execInfo = await infoContainer._computeFlowExecInfo(null);

            if (!(execInfo != null)) {
              throw new Error('Invariant violation: "execInfo != null"');
            }

            expect(execInfo.pathToFlow).toBe(dummyFlowPath);
          })();
        });
      });
    });
  });
}); /**
     * Copyright (c) 2015-present, Facebook, Inc.
     * All rights reserved.
     *
     * This source code is licensed under the license found in the LICENSE file in
     * the root directory of this source tree.
     *
     * 
     * @format
     */