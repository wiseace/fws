
import { useState, useRef, useEffect } from 'react';
import { Edit2 } from 'lucide-react';

interface EditableElementProps {
  editMode: boolean;
  type: 'text' | 'image' | 'link';
  className?: string;
  defaultValue: string;
  onChange?: (value: string) => void;
}

export const EditableElement = ({ 
  editMode, 
  type, 
  className = '', 
  defaultValue, 
  onChange 
}: EditableElementProps) => {
  const [value, setValue] = useState(defaultValue);
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = () => {
    setIsEditing(false);
    if (onChange) {
      onChange(value);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      setIsEditing(false);
      setValue(defaultValue);
    }
  };

  if (editMode && isEditing) {
    return type === 'text' ? (
      <textarea
        ref={inputRef as React.RefObject<HTMLTextAreaElement>}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyPress}
        className={`${className} border-2 border-blue-400 rounded px-2 py-1 resize-none`}
        rows={3}
      />
    ) : (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyPress}
        className={`${className} border-2 border-blue-400 rounded px-2 py-1`}
      />
    );
  }

  return (
    <div 
      className={`${className} ${editMode ? 'relative group cursor-pointer hover:bg-blue-50 hover:bg-opacity-20 rounded p-2' : ''}`}
      onClick={() => editMode && setIsEditing(true)}
    >
      {type === 'text' ? value : <span>{value}</span>}
      {editMode && (
        <Edit2 className="absolute top-1 right-1 w-4 h-4 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </div>
  );
};
