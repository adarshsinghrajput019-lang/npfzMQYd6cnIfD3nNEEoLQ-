/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AnimalType, ForestGrid } from './types';

export function configureDifficulty(level: number): { width: number; height: number } {
  if (level <= 10) return { width: 4, height: 4 };
  if (level <= 30) return { width: 5, height: 5 };
  if (level <= 50) return { width: 6, height: 6 };
  if (level <= 75) return { width: 7, height: 7 };
  return { width: 8, height: 8 }; // Slightly smaller for kids
}

export function generateForestGrid(level: number, width: number, height: number): ForestGrid {
  const grid: ForestGrid = Array.from({ length: width }, () =>
    Array.from({ length: height }, () => AnimalType.EMPTY)
  );

  // Add Forest Obstacles (Trees)
  if (level % 5 === 0) { // More frequent but fewer trees for kids
    const obstacleCount = level >= 30 ? 3 : 1;
    for (let i = 0; i < obstacleCount; i++) {
      const rx = Math.floor(Math.random() * (width - 2)) + 1;
      const ry = Math.floor(Math.random() * (height - 2)) + 1;
      grid[rx][ry] = AnimalType.TREE;
    }
  }

  // Fill with Animals based on density (gentler for kids)
  const density = Math.min(Math.max(0.3 + level * 0.004, 0.3), 0.7);
  const targetAnimals = Math.floor(width * height * density);
  let placed = 0;

  while (placed < targetAnimals) {
    const rx = Math.floor(Math.random() * width);
    const ry = Math.floor(Math.random() * height);

    if (grid[rx][ry] === AnimalType.EMPTY) {
      grid[rx][ry] = Math.floor(Math.random() * 4) as AnimalType;
      placed++;
    }
  }

  return grid;
}

export function checkAnimalPathClear(grid: ForestGrid, startX: number, startY: number, dir: number): boolean {
  const dirs = [
    { x: 0, y: -1 }, // UP
    { x: 1, y: 0 },  // RIGHT
    { x: 0, y: 1 },  // DOWN
    { x: -1, y: 0 }, // LEFT
  ];

  const width = grid.length;
  const height = grid[0].length;
  let cx = startX + dirs[dir].x;
  let cy = startY + dirs[dir].y;

  while (cx >= 0 && cx < width && cy >= 0 && cy < height) {
    if (grid[cx][cy] !== AnimalType.EMPTY) return false;
    cx += dirs[dir].x;
    cy += dirs[dir].y;
  }
  return true;
}

export function validateForestGrid(grid: ForestGrid): boolean {
  const simGrid: ForestGrid = grid.map(row => [...row]);
  const width = simGrid.length;
  const height = simGrid[0].length;

  let animalsRemaining = 0;
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      if (simGrid[x][y] >= 0 && simGrid[x][y] <= 3) animalsRemaining++;
    }
  }

  let progressMade = true;
  let failsafe = 0;

  while (progressMade && animalsRemaining > 0) {
    progressMade = false;

    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        const dir = simGrid[x][y];
        if (dir >= 0 && dir <= 3) {
          if (checkAnimalPathClear(simGrid, x, y, dir)) {
            simGrid[x][y] = AnimalType.EMPTY;
            animalsRemaining--;
            progressMade = true;
          }
        }
      }
    }

    failsafe++;
    if (failsafe > 1000) return false;
  }

  return animalsRemaining === 0;
}
