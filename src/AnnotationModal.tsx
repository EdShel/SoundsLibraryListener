import { FocusTrap } from "focus-trap-react";
import { useEffect, useRef, useState } from "react";

interface AnnotationModalProps {
  soundName: string;
  initialText: string;
  onSave: (text: string) => void;
  onClose: () => void;
}

export function AnnotationModal({
  soundName,
  initialText,
  onSave,
  onClose,
}: AnnotationModalProps) {
  const [annotationText, setAnnotationText] = useState(initialText);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [initialText]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      onSave(annotationText);
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      onClose();
    }
  };

  return (
    <FocusTrap>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <h3 style={{ color: "black" }}>Annotate: {soundName}</h3>
          <input
            ref={inputRef}
            type="text"
            value={annotationText}
            onChange={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setAnnotationText(e.target.value);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Enter annotation..."
          />
          <p className="modal-hint">Enter to save | Escape to cancel</p>
        </div>
      </div>
    </FocusTrap>
  );
}
