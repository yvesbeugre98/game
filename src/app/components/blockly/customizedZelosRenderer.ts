/*
 * Software Name : SuperCodingBall
 * Version: 1.0.0
 * SPDX-FileCopyrightText: Copyright (c) 2021 Orange
 * SPDX-License-Identifier: BSD-3-Clause
 *
 * This software is distributed under the BSD 3-Clause "New" or "Revised" License,
 * the text of which is available at https://spdx.org/licenses/BSD-3-Clause.html
 * or see the "LICENSE.txt" file for more details.
 */

import * as Blockly from 'blockly';
import * as BlocklyJs from 'blockly/blockly_compressed.js';

export class CustomizedZelosRenderer extends BlocklyJs.zelos.Renderer {
  constructor(name: string) {
    super(name);
  }

  static register(): void {
    BlocklyJs.blockRendering.register('customized_zelos', CustomizedZelosRenderer);
  }

  makeConstants_(): Blockly.blockRendering.ConstantProvider {
    const constantsProvider = new BlocklyJs.zelos.ConstantProvider();
    constantsProvider.BOTTOM_ROW_AFTER_STATEMENT_MIN_HEIGHT = 2 * constantsProvider.GRID_UNIT;
    constantsProvider.DUMMY_INPUT_MIN_HEIGHT =  0;
    return constantsProvider;
  }
}