import React from 'react';

interface ControlPanelProps {
  selectedWords: string[];
  onClear: () => void;
  onExport: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  selectedWords,
  onClear,
  onExport,
}) => {
  return (
    <div className="control-panel">
      <button onClick={onClear}>Clear Selection</button>
      <button onClick={onExport}>Export Graph</button>
      <div className="selected-words">
        <strong>Selected words:</strong> {selectedWords.join(', ')}
      </div>
    </div>
  );
};

export default ControlPanel;
