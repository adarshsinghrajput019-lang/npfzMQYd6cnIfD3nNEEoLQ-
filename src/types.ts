/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum AnimalType {
  EMPTY = -1,
  BUNNY_UP = 0,
  BUNNY_RIGHT = 1,
  BUNNY_DOWN = 2,
  BUNNY_LEFT = 3,
  TREE = 4,
}

export interface ForestCell {
  x: number;
  y: number;
  type: AnimalType;
  id: string;
}

export type ForestGrid = AnimalType[][];
