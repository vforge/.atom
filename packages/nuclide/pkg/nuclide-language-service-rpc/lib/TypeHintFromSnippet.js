"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.typeHintFromSnippet = typeHintFromSnippet;

/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 *
 *  strict
 * @format
 */
function typeHintFromSnippet(snippet, range) {
  return {
    hint: [{
      type: 'snippet',
      value: snippet
    }],
    range
  };
}