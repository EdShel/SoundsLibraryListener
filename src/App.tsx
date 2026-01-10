import "./App.css";
import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { List } from "react-virtualized";
import { soundFiles } from "./sounds";
import { AnnotationModal } from "./AnnotationModal";

const soundsDirectory = `/assets/sounds/`;
const ITEM_HEIGHT = 60;

interface Sound {
  name: string;
  path: string;
}

interface Filter {
  text: string;
  favoritesAndAnnotatedOnly: boolean;
}

function App() {
  const [allSounds] = useState<Sound[]>(() => {
    return soundFiles.map((file) => ({
      name: file.replace(/\.[^/.]+$/, ""),
      path: soundsDirectory + file,
    }));
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [favorites, setFavorites] = useState<Set<string>>(() =>
    localStorage.getItem("audioFavorites")
      ? new Set(JSON.parse(localStorage.getItem("audioFavorites")!))
      : new Set()
  );
  const [annotations, setAnnotations] = useState<Record<string, string>>(() =>
    localStorage.getItem("audioAnnotations")
      ? JSON.parse(localStorage.getItem("audioAnnotations")!)
      : {}
  );
  const [duration, setDuration] = useState(0);
  const [showAnnotationModal, setShowAnnotationModal] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const listRef = useRef<List>(null);
  const [filter, setFilter] = useState<Filter>({
    text: "",
    favoritesAndAnnotatedOnly: false,
  });

  const filteredSounds = useMemo(() => {
    const normalizedFilter = filter.text.toLowerCase();
    return allSounds.filter((sound) => {
      const matchesText =
        sound.name.toLowerCase().includes(normalizedFilter) ||
        (annotations[sound.name] &&
          annotations[sound.name].toLowerCase().includes(normalizedFilter));
      if (!matchesText) return false;

      if (filter.favoritesAndAnnotatedOnly) {
        return favorites.has(sound.name) || annotations[sound.name];
      }

      return true;
    });
  }, [allSounds, filter, favorites, annotations]);

  // Auto-play when current sound changes
  useEffect(() => {
    if (filteredSounds.length > 0 && audioRef.current) {
      const currentSound = filteredSounds[currentIndex];
      audioRef.current.src = currentSound.path;
      audioRef.current.play().catch(() => {});
    }
  }, [currentIndex, filteredSounds]);

  // Update duration when metadata loads
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const toggleFavorite = () => {
    if (filteredSounds.length === 0) return;

    const currentSound = filteredSounds[currentIndex].name;
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

  const openAnnotationModal = () => {
    if (filteredSounds.length === 0) return;
    setShowAnnotationModal(true);
  };

  const closeAnnotationModal = () => {
    setShowAnnotationModal(false);
  };

  // Keyboard controls
  const handleKeyDown = useEffectEvent((e: KeyboardEvent) => {
    if (filteredSounds.length === 0) return;
    if (
      document.activeElement &&
      (document.activeElement.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA")
    ) {
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setCurrentIndex((prev) => {
          const n = (prev + 1) % filteredSounds.length;
          listRef.current?.scrollToRow(
            Math.min(n + 5, filteredSounds.length - 1)
          );
          return n;
        });
        break;
      case "ArrowUp":
        e.preventDefault();
        setCurrentIndex((prev) => {
          const n = (prev - 1 + filteredSounds.length) % filteredSounds.length;
          listRef.current?.scrollToRow(Math.max(0, n - 5));
          return n;
        });
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
      case "Enter":
        e.preventDefault();
        openAnnotationModal();
        break;
      default:
        break;
    }
  });
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const saveAnnotation = (text: string) => {
    if (filteredSounds.length === 0) return;
    const currentSound = filteredSounds[currentIndex].name;
    const newAnnotations = { ...annotations };

    if (text.trim()) {
      newAnnotations[currentSound] = text;
    } else {
      delete newAnnotations[currentSound];
    }

    setAnnotations(newAnnotations);
    localStorage.setItem("audioAnnotations", JSON.stringify(newAnnotations));
    closeAnnotationModal();
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const renderSoundItem = ({
    index,
    key,
    style,
  }: {
    index: number;
    key: string;
    style: React.CSSProperties;
  }) => {
    const sound = filteredSounds[index];
    return (
      <li
        key={key}
        style={style}
        className={`sound-item ${index === currentIndex ? "active" : ""}`}
        onClick={() => {
          setCurrentIndex(index);
          if (index === currentIndex) {
            if (audioRef.current) {
              audioRef.current.currentTime = 0;
              audioRef.current.play();
            }
          }
        }}
      >
        <span>
          {sound.name}

          {annotations[sound.name] && (
            <span className="annotation-preview">
              {annotations[sound.name]}
            </span>
          )}
        </span>
        {favorites.has(sound.name) && <span className="favorite">★</span>}
      </li>
    );
  };

  return (
    <div className="app">
      <audio ref={audioRef} onLoadedMetadata={handleLoadedMetadata} />

      <div className="player">
        <h1>
          {currentIndex + 1} / {filteredSounds.length}
        </h1>
        {filteredSounds.length > 0 && (
          <div className="current-sound">
            <h2>
              {filteredSounds[currentIndex]?.name}
              {annotations[filteredSounds[currentIndex]?.name] && (
                <span className="annotation">
                  {annotations[filteredSounds[currentIndex].name]}
                </span>
              )}
            </h2>
            <p className="duration">Duration: {formatTime(duration)}</p>
          </div>
        )}
      </div>

      <div className="filter-controls">
        <input
          type="text"
          placeholder="Search sounds..."
          value={filter.text}
          onKeyDown={(e) => e.stopPropagation()}
          onChange={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setFilter({ ...filter, text: e.target.value });
            setCurrentIndex(0);
          }}
          className="filter-input"
        />
        <label className="filter-checkbox">
          <input
            type="checkbox"
            checked={filter.favoritesAndAnnotatedOnly}
            onChange={(e) => {
              setFilter({
                ...filter,
                favoritesAndAnnotatedOnly: e.target.checked,
              });
              setCurrentIndex(0);
            }}
          />
          Favorites & Annotated Only
        </label>
      </div>

      <div className="sound-list">
        {filteredSounds.length > 0 && (
          <List
            ref={listRef}
            width={600}
            height={500}
            rowCount={filteredSounds.length}
            rowHeight={ITEM_HEIGHT}
            rowRenderer={renderSoundItem}
          />
        )}
      </div>

      <div className="controls">
        ↑ Previous | ↓ Next | ← Start | → or F Toggle Favorite | Enter Annotate
      </div>

      {showAnnotationModal && (
        <AnnotationModal
          soundName={filteredSounds[currentIndex]?.name || ""}
          initialText={annotations[filteredSounds[currentIndex]?.name] || ""}
          onSave={saveAnnotation}
          onClose={closeAnnotationModal}
        />
      )}
    </div>
  );
}

export default App;
