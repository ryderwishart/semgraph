import React, { useRef, ChangeEvent, RefObject } from 'react';

interface FileSelectorProps {
  onFileSelect: (content: string | string[]) => void;
}

const FileSelector: React.FC<FileSelectorProps> = ({ onFileSelect }) => {
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        if (e.target?.result) {
          onFileSelect(e.target.result as string);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleFolderSelect = () => {
    folderInputRef.current?.click();
  };

  const handleFolderChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const xmlFiles = Array.from(files).filter(file => file.name.endsWith('.xml'));
      Promise.all(xmlFiles.map(file => readFileAsText(file)))
        .then(contents => {
          onFileSelect(contents);
        })
        .catch(error => {
          console.error('Error reading files:', error);
        });
    }
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        if (e.target?.result) {
          resolve(e.target.result as string);
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      reader.onerror = (e: ProgressEvent<FileReader>) => reject(e);
      reader.readAsText(file);
    });
  };

  return (
    <div>
      <input type="file" accept=".xml" onChange={handleFileChange} />
      <button onClick={handleFolderSelect}>Select Folder</button>
      <input
        type="file"
        ref={folderInputRef}
        style={{ display: 'none' }}
        webkitdirectory=""
        directory=""
        multiple
        onChange={handleFolderChange}
      />
    </div>
  );
};

export default FileSelector;