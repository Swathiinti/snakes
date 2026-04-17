import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Gamepad2, Music } from 'lucide-react';

// --- Constants & Data ---
const GRID_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const INITIAL_SPEED = 120; // ms

const PLAYLIST = [
  {
    id: 1,
    title: "Neon City Drive (AI)",
    artist: "Synth Mind",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
  },
  {
    id: 2,
    title: "Digital Horizon",
    artist: "Neural Beats",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3"
  },
  {
    id: 3,
    title: "Cybernetic Pulse",
    artist: "Algorithm X",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3"
  }
];

type Point = { x: number; y: number };

// --- Hooks ---

const useSnakeGame = () => {
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
  const [dir, setDir] = useState<Point>({ x: 0, y: -1 });
  const [food, setFood] = useState<Point>({ x: 15, y: 5 });
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  const dirRef = useRef(dir);
  const nextDirRef = useRef(dir);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
        e.preventDefault();
      }
      
      if (!hasStarted) {
         if (e.key === ' ' || e.key === 'Enter') {
            setHasStarted(true);
            setIsPaused(false);
         }
         return;
      }

      if (gameOver) return;
      
      const currentDir = nextDirRef.current;
      
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
          if (currentDir.y !== 1 && dirRef.current.y !== 1) nextDirRef.current = { x: 0, y: -1 };
          break;
        case 'ArrowDown':
        case 's':
          if (currentDir.y !== -1 && dirRef.current.y !== -1) nextDirRef.current = { x: 0, y: 1 };
          break;
        case 'ArrowLeft':
        case 'a':
          if (currentDir.x !== 1 && dirRef.current.x !== 1) nextDirRef.current = { x: -1, y: 0 };
          break;
        case 'ArrowRight':
        case 'd':
          if (currentDir.x !== -1 && dirRef.current.x !== -1) nextDirRef.current = { x: 1, y: 0 };
          break;
        case ' ':
          setIsPaused(p => !p);
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown, { passive: false });
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameOver, hasStarted]);

  const moveSnake = useCallback(() => {
    if (!hasStarted || gameOver || isPaused) return;

    setSnake((prevSnake) => {
      const head = prevSnake[0];
      const currentDir = nextDirRef.current;
      dirRef.current = currentDir;
      const newHead = { x: head.x + currentDir.x, y: head.y + currentDir.y };

      if (
        newHead.x < 0 || newHead.x >= GRID_SIZE ||
        newHead.y < 0 || newHead.y >= GRID_SIZE
      ) {
        setGameOver(true);
        return prevSnake;
      }

      if (prevSnake.some((segment) => segment.x === newHead.x && segment.y === newHead.y)) {
        setGameOver(true);
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      if (newHead.x === food.x && newHead.y === food.y) {
        setScore((s) => s + 10);
        let newFood = { x: Math.floor(Math.random() * GRID_SIZE), y: Math.floor(Math.random() * GRID_SIZE) };
        while (newSnake.some(s => s.x === newFood.x && s.y === newFood.y)) {
          newFood = { x: Math.floor(Math.random() * GRID_SIZE), y: Math.floor(Math.random() * GRID_SIZE) };
        }
        setFood(newFood);
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [hasStarted, gameOver, isPaused, food]);

  useEffect(() => {
    const interval = setInterval(moveSnake, INITIAL_SPEED);
    return () => clearInterval(interval);
  }, [moveSnake]);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    const initialDir = { x: 0, y: -1 };
    setDir(initialDir);
    nextDirRef.current = initialDir;
    dirRef.current = initialDir;
    setScore(0);
    setGameOver(false);
    setIsPaused(false);
    setHasStarted(true);
    setFood({ x: 15, y: 5 }); 
  };

  return { snake, food, gameOver, score, isPaused, hasStarted, setHasStarted, resetGame };
};


const useAudioPlayer = () => {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const updateProgress = () => {
      setProgress((audio.currentTime / (audio.duration || 1)) * 100);
    };
    audio.addEventListener('timeupdate', updateProgress);
    return () => audio.removeEventListener('timeupdate', updateProgress);
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      if (isPlaying) {
        audioRef.current.play().catch(e => console.log('Autoplay blocked:', e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [currentTrackIndex, isPlaying]);

  useEffect(() => {
    if(audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const handleNext = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % PLAYLIST.length);
  };

  const handlePrev = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + PLAYLIST.length) % PLAYLIST.length);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const newTime = (x / rect.width) * audioRef.current.duration;
    if (!isNaN(newTime)) {
      audioRef.current.currentTime = newTime;
    }
  };

  return {
    currentTrackIndex,
    setCurrentTrackIndex,
    isPlaying,
    setIsPlaying,
    handleNext,
    handlePrev,
    handleSeek,
    audioRef,
    volume,
    setVolume,
    progress
  };
};

// --- App Component ---

export default function App() {
  const { snake, food, gameOver, score, isPaused, hasStarted, setHasStarted, resetGame } = useSnakeGame();
  const [highScore, setHighScore] = useState(0);
  const audioContext = useAudioPlayer();

  useEffect(() => {
    if (score > highScore) setHighScore(score);
  }, [score, highScore]);

  const currentTrack = PLAYLIST[audioContext.currentTrackIndex];

  return (
    <div className="h-screen w-full bg-[#050505] text-[#e0e0e0] font-sans overflow-hidden flex flex-col border-[4px] border-[#1a1a1a]">
      
      {/* Header */}
      <header className="h-[80px] px-10 flex flex-shrink-0 items-center justify-between bg-gradient-to-b from-[#111] to-[#050505] border-b border-[#222]">
        <div className="text-[24px] font-black tracking-[4px] uppercase text-[#00ffd1] drop-shadow-[0_0_10px_rgba(0,255,209,0.2)]">
          SYNTH_SNAKE v1.0
        </div>
        <div className="flex gap-[32px]">
          <div className="text-right">
            <div className="text-[10px] uppercase text-[#666] tracking-[2px]">Hi-Score</div>
            <div className="text-[24px] font-light text-[#a2ff00] font-mono leading-none mt-1">
              {highScore.toString().padStart(6, '0')}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase text-[#666] tracking-[2px]">Score</div>
            <div className="text-[24px] font-light text-[#ff00ff] font-mono leading-none mt-1">
              {score.toString().padStart(6, '0')}
            </div>
          </div>
        </div>
      </header>

      {/* Main Viewport */}
      <main className="flex-1 flex px-[30px] gap-[30px] items-center justify-center min-h-0">
        
        {/* Left Sidebar: Playlist */}
        <div className="w-[240px] h-[480px] bg-[#111] rounded-[8px] border border-[#222] p-[20px] flex flex-col flex-shrink-0">
          <div className="text-[12px] text-[#666] uppercase mb-[20px] tracking-[1px]">Queue</div>
          <div className="flex-1 overflow-y-auto space-y-2 pr-2">
            {PLAYLIST.map((track, i) => (
              <div 
                key={track.id}
                onClick={() => audioContext.setCurrentTrackIndex(i)}
                className={`p-[12px] rounded-[4px] cursor-pointer transition-all border ${
                  i === audioContext.currentTrackIndex 
                  ? 'bg-[rgba(0,255,209,0.05)] border-[rgba(0,255,209,0.2)]'
                  : 'border-transparent hover:border-[#222]'
                }`}
              >
                <div className={`text-[14px] mb-[4px] ${i === audioContext.currentTrackIndex ? 'text-[#00ffd1]' : 'text-[#e0e0e0]'}`}>
                  {track.title}
                </div>
                <div className="text-[11px] text-[#666]">{track.artist}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Center: Game Window */}
        <div className="w-[480px] h-[480px] bg-[#000] border-2 border-[#222] relative shadow-[0_0_40px_rgba(0,0,0,0.5)] flex-shrink-0 flex items-center justify-center">
           <div 
             className="grid w-full h-full"
             style={{
               gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
               gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`
             }}
           >
             {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
                  const x = i % GRID_SIZE;
                  const y = Math.floor(i / GRID_SIZE);
                  const isSnake = snake.some(s => s.x === x && s.y === y);
                  const isHead = snake[0].x === x && snake[0].y === y;
                  const isFood = food.x === x && food.y === y;

                  if (isHead) {
                    return <div key={i} className="bg-[#00ffd1] shadow-[0_0_8px_#00ffd1] border border-[#000] z-10" />
                  } else if (isSnake) {
                    return <div key={i} className="bg-[#00ffd1] shadow-[0_0_8px_#00ffd1] border border-[#000]" />
                  } else if (isFood) {
                    return (
                      <div key={i} className="flex items-center justify-center">
                        <div className="w-[80%] h-[80%] bg-[#ff00ff] shadow-[0_0_12px_#ff00ff] rounded-full" />
                      </div>
                    );
                  } else {
                    return <div key={i} />
                  }
             })}
           </div>

           {/* Overlays */}
           {!hasStarted && !gameOver && (
             <div className="absolute inset-0 bg-[#050505]/80 flex flex-col items-center justify-center z-20">
               <button 
                 onClick={() => setHasStarted(true)}
                 className="px-[24px] py-[12px] border border-[#00ffd1] text-[#00ffd1] bg-transparent hover:bg-[rgba(0,255,209,0.1)] font-sans text-sm tracking-[2px] transition-all cursor-pointer"
               >
                 INITIALIZE SYSTEM
               </button>
             </div>
           )}

           {isPaused && hasStarted && !gameOver && (
             <div className="absolute inset-0 bg-[#050505]/80 flex flex-col items-center justify-center z-20">
               <h2 className="text-[20px] font-light tracking-[4px] text-[#e0e0e0]">SYSTEM PAUSED</h2>
             </div>
           )}

           {gameOver && (
             <div className="absolute inset-0 bg-[#050505]/90 flex flex-col items-center justify-center z-20">
               <h2 className="text-[32px] font-black text-[#ff00ff] mb-[20px] drop-shadow-[0_0_15px_rgba(255,0,255,0.4)] tracking-[4px]">
                 CRITICAL FAILURE
               </h2>
               <button 
                 onClick={resetGame}
                 className="px-[24px] py-[12px] border border-[#ff00ff] text-[#ff00ff] bg-transparent hover:bg-[rgba(255,0,255,0.1)] font-sans text-sm tracking-[2px] transition-all cursor-pointer"
               >
                 REBOOT SYSTEM
               </button>
             </div>
           )}
        </div>

        {/* Right Sidebar: Controls */}
        <div className="w-[180px] h-[480px] bg-[#111] rounded-[8px] border border-[#222] p-[20px] flex flex-col flex-shrink-0">
           <div className="text-[12px] text-[#666] uppercase mb-[20px] tracking-[1px]">Controls</div>
           <div className="text-[11px] leading-[1.8] text-[#666] font-sans">
             [W] UP<br/>
             [A] LEFT<br/>
             [S] DOWN<br/>
             [D] RIGHT<br/>
             <br/>
             [SPACE] PAUSE GAME<br/>
           </div>
        </div>
      </main>

      {/* Player Bar */}
      <footer className="h-[120px] bg-[#111] border-t border-[#222] flex flex-shrink-0 items-center px-[40px] gap-[40px]">
        <audio
          ref={audioContext.audioRef}
          src={currentTrack.url}
          onEnded={audioContext.handleNext}
        />
        
        <div className="w-[250px] flex-shrink-0">
          <div className="text-[10px] uppercase text-[#666] tracking-[2px] mb-[4px]">Now Playing</div>
          <div className="text-[14px] text-[#e0e0e0] mb-[4px] truncate">{currentTrack.title}</div>
          <div className="text-[11px] text-[#666] truncate">{currentTrack.artist}</div>
        </div>

        <div className="flex-1 flex flex-col items-center gap-[12px]">
          <div className="flex items-center gap-[24px]">
            <button 
              onClick={audioContext.handlePrev} 
              className="text-[#e0e0e0] bg-transparent border-none text-[18px] cursor-pointer hover:text-[#00ffd1] transition-colors"
            >
              &#171;
            </button>
            <button 
              onClick={() => audioContext.setIsPlaying(!audioContext.isPlaying)} 
              className="w-[48px] h-[48px] rounded-full bg-[#e0e0e0] text-[#050505] flex items-center justify-center hover:bg-[#00ffd1] transition-colors cursor-pointer text-[18px]"
            >
               {audioContext.isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
            </button>
            <button 
              onClick={audioContext.handleNext} 
              className="text-[#e0e0e0] bg-transparent border-none text-[18px] cursor-pointer hover:text-[#00ffd1] transition-colors"
            >
              &#187;
            </button>
          </div>
          <div 
            className="w-full h-[4px] bg-[#333] rounded-[2px] cursor-pointer"
            onClick={audioContext.handleSeek}
          >
             <div 
               className="h-full bg-[#00ffd1] shadow-[0_0_10px_rgba(0,255,209,0.5)] rounded-[2px]" 
               style={{ width: `${audioContext.progress}%` }} 
             />
          </div>
        </div>

        <div className="w-[150px] flex items-center gap-[12px] flex-shrink-0 text-[#666]">
          <span className="text-lg leading-none">&#128266;</span>
          <div className="relative w-full h-[4px] bg-[#333] rounded-[2px]">
             <input 
                type="range" 
                min="0" max="1" step="0.01"
                value={audioContext.volume}
                onChange={(e) => audioContext.setVolume(parseFloat(e.target.value))}
                className="absolute inset-0 opacity-0 cursor-pointer w-full"
             />
             <div 
               className="h-full bg-[#666] pointer-events-none rounded-[2px]" 
               style={{ width: `${audioContext.volume * 100}%` }} 
             />
          </div>
        </div>
      </footer>

    </div>
  );
}
