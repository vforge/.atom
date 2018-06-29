'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.WorkingSetsStore = undefined;

var _groupBy2;

function _load_groupBy() {
  return _groupBy2 = _interopRequireDefault(require('lodash/groupBy'));
}

var _atom = require('atom');

var _idx;

function _load_idx() {
  return _idx = _interopRequireDefault(require('idx'));
}

var _memoizeUntilChanged;

function _load_memoizeUntilChanged() {
  return _memoizeUntilChanged = _interopRequireDefault(require('../../../modules/nuclide-commons/memoizeUntilChanged'));
}

var _shallowequal;

function _load_shallowequal() {
  return _shallowequal = _interopRequireDefault(require('shallowequal'));
}

var _nuclideWorkingSetsCommon;

function _load_nuclideWorkingSetsCommon() {
  return _nuclideWorkingSetsCommon = require('../../nuclide-working-sets-common');
}

var _collection;

function _load_collection() {
  return _collection = require('../../../modules/nuclide-commons/collection');
}

var _nuclideAnalytics;

function _load_nuclideAnalytics() {
  return _nuclideAnalytics = require('../../nuclide-analytics');
}

var _log4js;

function _load_log4js() {
  return _log4js = require('log4js');
}

var _nuclideUri;

function _load_nuclideUri() {
  return _nuclideUri = _interopRequireDefault(require('../../../modules/nuclide-commons/nuclideUri'));
}

var _ProjectUtils;

function _load_ProjectUtils() {
  return _ProjectUtils = _interopRequireWildcard(require('../../../modules/nuclide-commons-atom/ProjectUtils'));
}

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 *
 * 
 * @format
 */

const NEW_WORKING_SET_EVENT = 'new-working-set';
const NEW_DEFINITIONS_EVENT = 'new-definitions';
const SAVE_DEFINITIONS_EVENT = 'save-definitions';

class WorkingSetsStore {

  constructor() {
    this._groupByApplicability = (0, (_memoizeUntilChanged || _load_memoizeUntilChanged()).default)(groupByApplicability, definitions => ({
      definitions,
      // Atom just keeps modifying the same array so we need to make a copy here if we want to
      // compare to a later value.
      projectRoots: atom.project.getDirectories().slice()
    }), (a, b) => (0, (_collection || _load_collection()).arrayEqual)(a.definitions, b.definitions) && (0, (_collection || _load_collection()).arrayEqual)(a.projectRoots, b.projectRoots));

    this._emitter = new _atom.Emitter();
    this._current = new (_nuclideWorkingSetsCommon || _load_nuclideWorkingSetsCommon()).WorkingSet();
    this._savedDefinitions = [];
    this._prevApplicability = {
      applicable: [],
      notApplicable: []
    };
    this._lastSelected = [];

    // Don't recompute definitions unless one of the properties it's derived from changes.
    this.getDefinitions = (0, (_memoizeUntilChanged || _load_memoizeUntilChanged()).default)(this.getDefinitions, () => [this._savedDefinitions, this._activeProjectDefinition]);
  }

  getCurrent() {
    return this._current;
  }

  getDefinitions() {
    const definitions = this._savedDefinitions.slice();
    if (this._activeProjectDefinition != null) {
      definitions.push(this._activeProjectDefinition);
    }
    return definitions;
  }

  getApplicableDefinitions() {
    return this._groupByApplicability(this.getDefinitions()).applicable;
  }

  getNotApplicableDefinitions() {
    return this._groupByApplicability(this.getDefinitions()).notApplicable;
  }

  subscribeToCurrent(callback) {
    return this._emitter.on(NEW_WORKING_SET_EVENT, callback);
  }

  subscribeToDefinitions(callback) {
    return this._emitter.on(NEW_DEFINITIONS_EVENT, callback);
  }

  onSaveDefinitions(callback) {
    return this._emitter.on(SAVE_DEFINITIONS_EVENT, callback);
  }

  updateSavedDefinitions(definitions) {
    if ((0, (_collection || _load_collection()).arrayEqual)(this._savedDefinitions, definitions)) {
      return;
    }
    const nextDefinitions = this.getDefinitions().filter(d => d.isActiveProject).concat(...definitions);
    this._updateDefinitions(nextDefinitions);
  }

  updateActiveProject(spec) {
    const definition = getProjectWorkingSetDefinition(spec);
    if ((0, (_shallowequal || _load_shallowequal()).default)(definition, this._activeProjectDefinition)) {
      return;
    }
    const nextDefinitions = this.getDefinitions().filter(d => !d.isActiveProject);
    if (definition != null) {
      nextDefinitions.push(definition);
    }
    this._updateDefinitions(nextDefinitions);
  }

  updateApplicability() {
    const {
      applicable: prevApplicableDefinitions,
      notApplicable: prevNotApplicableDefinitions
    } = this._prevApplicability;
    const { applicable, notApplicable } = this._groupByApplicability(this.getDefinitions());

    if ((0, (_collection || _load_collection()).arrayEqual)(prevApplicableDefinitions, applicable) && (0, (_collection || _load_collection()).arrayEqual)(prevNotApplicableDefinitions, notApplicable)) {
      return;
    }

    this._prevApplicability = { applicable, notApplicable };
    const activeApplicable = applicable.filter(d => d.active);
    if (activeApplicable.length > 0) {
      this._lastSelected = activeApplicable.map(d => d.name);
    }
    this._emitter.emit(NEW_DEFINITIONS_EVENT, { applicable, notApplicable });

    // Create a working set to reflect the combination of the active definitions.
    const combinedUris = [].concat(...activeApplicable.map(d => d.uris));
    const newWorkingSet = new (_nuclideWorkingSetsCommon || _load_nuclideWorkingSetsCommon()).WorkingSet(combinedUris);
    if (!this._current.equals(newWorkingSet)) {
      this._current = newWorkingSet;
      this._emitter.emit(NEW_WORKING_SET_EVENT, newWorkingSet);
    }
  }

  saveWorkingSet(name, workingSet) {
    this._updateDefinition(name, name, workingSet);
  }

  update(name, newName, workingSet) {
    this._updateDefinition(name, newName, workingSet);
  }

  activate(name) {
    this._activateDefinition(name, /* active */true);
  }

  deactivate(name) {
    this._activateDefinition(name, /* active */false);
  }

  deleteWorkingSet(name) {
    (0, (_nuclideAnalytics || _load_nuclideAnalytics()).track)('working-sets-delete', { name });

    const definitions = this.getDefinitions().filter(d => d.name !== name || d.isActiveProject);
    this._updateDefinitions(definitions);
  }

  _updateDefinition(name, newName, workingSet) {
    const definitions = this.getDefinitions();

    let nameIndex = -1;
    definitions.forEach((d, i) => {
      if (d.name === name) {
        nameIndex = i;
      }
    });

    const repos = atom.project.getRepositories().filter(Boolean);
    const originURLs = repos.map(repo => {
      const originURL = repo.getOriginURL();
      if (originURL == null) {
        return null;
      }
      const dir = repo.getProjectDirectory();
      return workingSet.containsDir(dir) ? originURL : null;
    }).filter(Boolean);

    let newDefinitions;
    if (nameIndex < 0) {
      (0, (_nuclideAnalytics || _load_nuclideAnalytics()).track)('working-sets-create', {
        name,
        uris: workingSet.getUris().join(','),
        originURLs: originURLs.join(',')
      });

      newDefinitions = definitions.concat({
        name,
        uris: workingSet.getUris(),
        active: false,
        originURLs
      });
    } else {
      (0, (_nuclideAnalytics || _load_nuclideAnalytics()).track)('working-sets-update', {
        oldName: name,
        name: newName,
        uris: workingSet.getUris().join(','),
        originURLs: originURLs.join(',')
      });

      const active = definitions[nameIndex].active;
      newDefinitions = [].concat(definitions.slice(0, nameIndex), { name: newName, uris: workingSet.getUris(), active, originURLs }, definitions.slice(nameIndex + 1));
    }

    this._updateDefinitions(newDefinitions);
  }

  _activateDefinition(name, active) {
    (0, (_nuclideAnalytics || _load_nuclideAnalytics()).track)('working-sets-activate', { name, active: active.toString() });

    const definitions = this.getDefinitions();
    const newDefinitions = definitions.map(d => Object.assign({}, d, {
      active: d.name === name ? active : d.active
    }));
    this._updateDefinitions(newDefinitions);
  }

  deactivateAll() {
    const definitions = this.getDefinitions().map(d => {
      if (!isApplicable(d)) {
        return d;
      }

      return Object.assign({}, d, { active: false });
    });
    this._updateDefinitions(definitions);
  }

  toggleLastSelected() {
    (0, (_nuclideAnalytics || _load_nuclideAnalytics()).track)('working-sets-toggle-last-selected');

    if (this.getApplicableDefinitions().some(d => d.active)) {
      this.deactivateAll();
    } else {
      const newDefinitions = this.getDefinitions().map(d => {
        return Object.assign({}, d, {
          active: d.active || this._lastSelected.indexOf(d.name) > -1
        });
      });
      this._updateDefinitions(newDefinitions);
    }
  }

  // Update the working set definitions. All updates should go through this method! In other words,
  // this should be the only place where `_savedDefinitions` and `_activeProjectDefinition` are
  // changed.
  _updateDefinitions(definitions) {
    var _ref;

    const { saved, activeProject } = (0, (_groupBy2 || _load_groupBy()).default)(definitions, d => d.isActiveProject ? 'activeProject' : 'saved');
    this._activeProjectDefinition = (_ref = activeProject) != null ? _ref[0] : _ref;
    this._savedDefinitions = saved || [];
    this._emitter.emit(SAVE_DEFINITIONS_EVENT, this.getDefinitions());
    this.updateApplicability();
  }
}

exports.WorkingSetsStore = WorkingSetsStore;
function groupByApplicability(definitions) {
  const applicable = [];
  const notApplicable = [];

  definitions.forEach(def => {
    if (isApplicable(def)) {
      applicable.push(def);
    } else {
      notApplicable.push(def);
    }
  });

  return { applicable, notApplicable };
}

function isApplicable(definition) {
  const originURLs = definition.originURLs;
  if (originURLs != null) {
    const mountedOriginURLs = atom.project.getRepositories().filter(Boolean).map(repo => repo.getOriginURL());
    originURLs.forEach(originURL => {
      if (mountedOriginURLs.some(url => url === originURL)) {
        return true;
      }
    });
  }

  const workingSet = new (_nuclideWorkingSetsCommon || _load_nuclideWorkingSetsCommon()).WorkingSet(definition.uris);
  const dirs = atom.project.getDirectories().filter(dir => {
    // Apparently sometimes Atom supplies an invalid directory, or a directory with an
    // invalid paths. See https://github.com/facebook/nuclide/issues/416
    if (dir == null) {
      const logger = (0, (_log4js || _load_log4js()).getLogger)('nuclide-working-sets');

      logger.warn('Received a null directory from Atom');
      return false;
    }
    try {
      (_nuclideUri || _load_nuclideUri()).default.parse(dir.getPath());
      return true;
    } catch (e) {
      const logger = (0, (_log4js || _load_log4js()).getLogger)('nuclide-working-sets');

      logger.warn('Failed to parse path supplied by Atom', dir.getPath());
      return false;
    }
  });

  return dirs.some(dir => workingSet.containsDir(dir.getPath()));
}

// Given a project specification, create a corresponding working set definition.
function getProjectWorkingSetDefinition(spec) {
  if (spec == null) {
    return null;
  }

  // `_paths` is a special key. Normally, `paths` contains an Array of paths but, because we
  // want to mount the repository root instead and just filter to the paths using working sets,
  // we preprocess the spec, set `paths` to the vcs root and put the previous values in
  // `_paths`.
  const paths = spec._paths;

  if (!Array.isArray(paths)) {
    return null;
  }

  return {
    name: (_ProjectUtils || _load_ProjectUtils()).getLabelFromPath(spec.originPath),
    active: true,
    isActiveProject: true,
    uris: paths
  };
}