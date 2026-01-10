import "./App.css";
import { useEffect, useRef, useState } from "react";
import { soundFiles } from "./sounds";

const soundsDirectory = `/assets/sounds/`;

interface Sound {
  name: string;
  path: string;
}

function App() {
  const [sounds, setSounds] = useState<Sound[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const currentSoundItemRef = useRef<HTMLLIElement>(null);

  // Load sounds from imported soundFiles
  useEffect(() => {
    const loadedSounds: Sound[] = soundFiles.map((file) => ({
      name: file.replace(/\.[^/.]+$/, ""),
      path: soundsDirectory + file,
    }));

    setSounds(loadedSounds);
  }, []);

  // Load favorites from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("audioFavorites");
    if (stored) {
      setFavorites(new Set(JSON.parse(stored)));
    }
  }, []);

  // Auto-play when current sound changes
  useEffect(() => {
    if (sounds.length > 0 && audioRef.current) {
      audioRef.current.src = sounds[currentIndex].path;
      audioRef.current.play().catch(() => {});
    }
  }, [currentIndex, sounds]);

  // Update duration when metadata loads
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (sounds.length === 0) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setCurrentIndex((prev) => (prev + 1) % sounds.length);
          break;
        case "ArrowUp":
          e.preventDefault();
          setCurrentIndex((prev) => (prev - 1 + sounds.length) % sounds.length);
          break;
        case "ArrowLeft":
          e.preventDefault();
          if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play();
          }
          break;
        case "ArrowRight":
        case "f":
        case "F":
          e.preventDefault();
          toggleFavorite();
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [sounds, currentIndex, favorites]);

  // Scroll to current sound item
  useEffect(() => {
    if (currentSoundItemRef.current) {
      currentSoundItemRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [currentIndex]);

  const toggleFavorite = () => {
    if (sounds.length === 0) return;

    const currentSound = sounds[currentIndex].name;
    const newFavorites = new Set(favorites);

    if (newFavorites.has(currentSound)) {
      newFavorites.delete(currentSound);
    } else {
      newFavorites.add(currentSound);
    }

    setFavorites(newFavorites);
    localStorage.setItem(
      "audioFavorites",
      JSON.stringify(Array.from(newFavorites))
    );
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="app">
      <audio ref={audioRef} onLoadedMetadata={handleLoadedMetadata} />

      <div className="player">
        <h1>Audio Listener</h1>
        {sounds.length > 0 && (
          <div className="current-sound">
            <h2>{sounds[currentIndex].name}</h2>
            <p className="duration">Duration: {formatTime(duration)}</p>
          </div>
        )}
      </div>

      <div className="controls">
        <p className="hint">
          ↑ Previous | ↓ Next | ← Start | → or F Toggle Favorite
        </p>
      </div>

      <div className="sound-list">
        <h3>Sounds</h3>
        <ul>
          {sounds.map((sound, index) => (
            <li
              key={sound.path}
              ref={index === currentIndex ? currentSoundItemRef : null}
              className={`sound-item ${index === currentIndex ? "active" : ""}`}
              onClick={() => setCurrentIndex(index)}
            >
              <span>{sound.name}</span>
              {favorites.has(sound.name) && <span className="favorite">★</span>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;
