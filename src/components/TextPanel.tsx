// TextPanel.tsx
import React from 'react';

interface TextPanelProps {
  text: string;
  onWordSelect: (word: string) => void;
  selectedWords: string[];
}

const TextPanel: React.FC<TextPanelProps> = ({
  text,
  onWordSelect,
  selectedWords,
}) => {
  const words = text.split(/\s+/);

  return (
    <div className="text-panel">
      <h2>Text Content</h2>
      <div className="text-content">
        {words.map((word, index) => (
          <span
            key={index}
            className={selectedWords && selectedWords.includes(word) ? 'word selected' : 'word'}
            onClick={() => onWordSelect(word)}
          >
            {word}{' '}
          </span>
        ))}
      </div>
    </div>
  );
};

export default TextPanel;
