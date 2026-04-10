/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Rabbit, 
  Trees, 
  Cookie, 
  Star, 
  RotateCcw, 
  ChevronRight,
  Sparkles,
  Heart,
  HelpCircle
} from 'lucide-react';
import { AnimalType, ForestGrid } from './types';
import { 
  configureDifficulty, 
  generateForestGrid, 
  validateForestGrid, 
  checkAnimalPathClear 
} from './gameLogic';

export default function App() {
  const [currentLevel, setCurrentLevel] = useState(1);
  const [grid, setGrid] = useState<ForestGrid>([]);
  const [gridSize, setGridSize] = useState({ width: 0, height: 0 });
  const [isAnimating, setIsAnimating] = useState(false);
  const [cookies, setCookies] = useState(5);
  const [isWin, setIsWin] = useState(false);
  const [blockedCell, setBlockedCell] = useState<{x: number, y: number} | null>(null);
  
  // Audio Hooks (Simulated with console logs and visual feedback)
  const playSound = (type: 'pop' | 'uhoh' | 'win') => {
    console.log(`[AUDIO] Playing sound: ${type}`);
  };

  const initLevel = useCallback((level: number) => {
    const { width, height } = configureDifficulty(level);
    setGridSize({ width, height });
    
    let isValid = false;
    let attempts = 0;
    let newGrid: ForestGrid = [];

    while (!isValid && attempts < 100) {
      attempts++;
      newGrid = generateForestGrid(level, width, height);
      if (validateForestGrid(newGrid)) {
        isValid = true;
      }
    }

    if (isValid) {
      setGrid(newGrid);
      setIsWin(false);
      setBlockedCell(null);
    }
  }, []);

  useEffect(() => {
    initLevel(currentLevel);
  }, [currentLevel, initLevel]);

  const handleCellClick = async (x: number, y: number) => {
    if (isAnimating || isWin) return;

    const animalType = grid[x][y];
    if (animalType === AnimalType.EMPTY || animalType === AnimalType.TREE) return;

    if (checkAnimalPathClear(grid, x, y, animalType)) {
      setIsAnimating(true);
      playSound('pop');
      
      const newGrid = grid.map(row => [...row]);
      newGrid[x][y] = AnimalType.EMPTY;
      
      setGrid(newGrid);
      
      const remaining = newGrid.flat().filter(c => c >= 0 && c <= 3).length;
      if (remaining === 0) {
        setIsWin(true);
        playSound('win');
      }
      
      setIsAnimating(false);
    } else {
      // Blocked feedback: Head shake and "Uh-oh!"
      setBlockedCell({ x, y });
      playSound('uhoh');
      setCookies(prev => Math.max(0, prev - 1));
      
      setTimeout(() => setBlockedCell(null), 500);
    }
  };

  const getAnimalRotation = (type: AnimalType) => {
    switch (type) {
      case AnimalType.BUNNY_UP: return 0;
      case AnimalType.BUNNY_RIGHT: return 90;
      case AnimalType.BUNNY_DOWN: return 180;
      case AnimalType.BUNNY_LEFT: return 270;
      default: return 0;
    }
  };

  const getExitTransition = (type: AnimalType) => {
    const distance = 1000;
    switch (type) {
      case AnimalType.BUNNY_UP: return { y: -distance, opacity: 0, scale: 1.2 };
      case AnimalType.BUNNY_RIGHT: return { x: distance, opacity: 0, scale: 1.2 };
      case AnimalType.BUNNY_DOWN: return { y: distance, opacity: 0, scale: 1.2 };
      case AnimalType.BUNNY_LEFT: return { x: -distance, opacity: 0, scale: 1.2 };
      default: return {};
    }
  };

  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col p-4 md:p-8 overflow-hidden font-playful">
      {/* Header */}
      <header className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center shadow-lg border-4 border-white">
            <Rabbit className="w-10 h-10 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-ink">Animal Rescue</h1>
            <div className="flex gap-2 items-center text-sm font-medium opacity-70">
              <Star className="w-4 h-4 fill-warning text-warning" />
              <span>Level {currentLevel}</span>
            </div>
          </div>
        </div>
        
        <div className="flex gap-4">
          <div className="bg-white px-6 py-3 rounded-full shadow-md border-2 border-primary/20 flex items-center gap-2">
            <Cookie className="w-6 h-6 text-warning fill-warning" />
            <span className="text-2xl font-bold">{cookies}</span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row gap-8 items-center justify-center">
        {/* Forest Grid */}
        <div className="forest-grid relative">
          <div 
            className="grid gap-3"
            style={{ 
              gridTemplateColumns: `repeat(${gridSize.width}, minmax(0, 1fr))`,
              width: `${gridSize.width * 70}px`
            }}
          >
            {grid.map((row, x) => 
              row.map((cell, y) => (
                <div 
                  key={`${x}-${y}`}
                  className="w-14 h-14 bg-white/40 rounded-2xl flex items-center justify-center relative"
                >
                  <AnimatePresence mode="popLayout">
                    {cell !== AnimalType.EMPTY && (
                      <motion.button
                        key={`${x}-${y}-${cell}`}
                        initial={{ scale: 0, rotate: -20 }}
                        animate={{ 
                          scale: 1, 
                          rotate: getAnimalRotation(cell),
                          x: blockedCell?.x === x && blockedCell?.y === y ? [0, -5, 5, -5, 5, 0] : 0
                        }}
                        exit={getExitTransition(cell)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.8, rotate: getAnimalRotation(cell) + 10 }}
                        transition={{ 
                          type: 'spring', 
                          damping: 12, 
                          stiffness: 200,
                          x: { duration: 0.4 }
                        }}
                        onClick={() => handleCellClick(x, y)}
                        className={`w-12 h-12 flex items-center justify-center rounded-xl
                          ${cell === AnimalType.TREE ? 'bg-accent/40 cursor-default' : 'bg-secondary/30 hover:bg-secondary/50 cursor-pointer'}
                        `}
                      >
                        {cell === AnimalType.TREE ? (
                          <Trees className="w-8 h-8 text-accent" />
                        ) : (
                          <div className="relative">
                            <Rabbit className="w-8 h-8 text-primary" />
                            {/* Visual feedback for blocked */}
                            {blockedCell?.x === x && blockedCell?.y === y && (
                              <motion.div 
                                initial={{ opacity: 0, y: 0 }}
                                animate={{ opacity: 1, y: -20 }}
                                exit={{ opacity: 0 }}
                                className="absolute -top-4 -right-2"
                              >
                                <HelpCircle className="w-6 h-6 text-warning fill-white" />
                              </motion.div>
                            )}
                          </div>
                        )}
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
              ))
            )}
          </div>

          {isWin && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 bg-white/90 rounded-[40px] flex flex-col items-center justify-center p-8 text-center z-10"
            >
              <div className="w-24 h-24 bg-warning rounded-full flex items-center justify-center mb-6 shadow-xl">
                <Sparkles className="w-16 h-16 text-white" />
              </div>
              <h2 className="text-4xl font-bold mb-2 text-ink">Yay! All Safe!</h2>
              <p className="text-ink/60 mb-8 font-medium">You helped all the bunnies find their way!</p>
              <button 
                onClick={() => {
                  setCurrentLevel(prev => prev + 1);
                  setCookies(prev => prev + 2); // Reward with cookies
                }}
                className="flex items-center gap-3 bg-primary text-white px-10 py-4 rounded-full font-bold text-xl shadow-[0_8px_0_0_#e5a5a1] hover:translate-y-1 hover:shadow-[0_4px_0_0_#e5a5a1] transition-all"
              >
                Next Forest <ChevronRight className="w-6 h-6" />
              </button>
            </motion.div>
          )}

          {cookies === 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-white/95 rounded-[40px] flex flex-col items-center justify-center p-8 text-center z-10"
            >
              <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mb-6">
                <Cookie className="w-12 h-12 text-primary opacity-50" />
              </div>
              <h2 className="text-3xl font-bold mb-2">Out of Cookies!</h2>
              <p className="text-ink/60 mb-8 font-medium">Don't worry! Let's try again!</p>
              <button 
                onClick={() => {
                  setCookies(5);
                  initLevel(currentLevel);
                }}
                className="flex items-center gap-3 bg-secondary text-white px-10 py-4 rounded-full font-bold text-xl shadow-[0_8px_0_0_#9ecad8] hover:translate-y-1 hover:shadow-[0_4px_0_0_#9ecad8] transition-all"
              >
                <RotateCcw className="w-6 h-6" /> Try Again
              </button>
            </motion.div>
          )}
        </div>

        {/* Mascot / Guide */}
        <div className="w-full lg:w-64 flex flex-col gap-6">
          <div className="bubbly-card p-6 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mb-4 shadow-inner">
              <Heart className="w-10 h-10 text-white fill-white" />
            </div>
            <h3 className="text-lg font-bold mb-2">Forest Guide</h3>
            <p className="text-xs font-medium text-ink/70 leading-relaxed">
              "Tap the bunnies to help them hop home! Make sure their path is clear of trees and friends!"
            </p>
          </div>

          <div className="flex justify-center gap-4">
            <button 
              onClick={() => initLevel(currentLevel)}
              className="bubbly-button bg-white p-4 shadow-md border-2 border-primary/10 hover:bg-primary/5"
            >
              <RotateCcw className="w-6 h-6 text-primary" />
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-8 flex justify-center items-center gap-8 opacity-40 text-[10px] font-bold uppercase tracking-widest">
        <span>Forest Rescue v2.0</span>
        <span>•</span>
        <span>Made with Love</span>
      </footer>
    </div>
  );
}
