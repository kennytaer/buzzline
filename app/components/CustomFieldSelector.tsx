import { useState } from 'react';

interface CustomFieldSelectorProps {
  existingFields: string[];
  selectedField?: string;
  onFieldSelect: (fieldName: string) => void;
  onNewFieldCreate: (fieldName: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function CustomFieldSelector({
  existingFields,
  selectedField,
  onFieldSelect,
  onNewFieldCreate,
  placeholder = "Select or add custom field",
  disabled = false,
  className = ""
}: CustomFieldSelectorProps) {
  const [showNewFieldInput, setShowNewFieldInput] = useState(false);
  const [newFieldName, setNewFieldName] = useState("");

  const handleSelectChange = (value: string) => {
    if (value === 'ADD_CUSTOM') {
      setShowNewFieldInput(true);
      return;
    }
    
    if (value) {
      onFieldSelect(value);
    }
    setShowNewFieldInput(false);
  };

  const handleNewFieldSubmit = () => {
    const trimmedName = newFieldName.trim();
    if (trimmedName && !existingFields.includes(trimmedName)) {
      onNewFieldCreate(trimmedName);
      setNewFieldName("");
      setShowNewFieldInput(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNewFieldSubmit();
    } else if (e.key === 'Escape') {
      setNewFieldName("");
      setShowNewFieldInput(false);
    }
  };

  if (showNewFieldInput) {
    return (
      <div className={`flex gap-2 ${className}`}>
        <input
          type="text"
          value={newFieldName}
          onChange={(e) => setNewFieldName(e.target.value)}
          onKeyDown={handleKeyPress}
          className="flex-1 form-input"
          placeholder="e.g., Vehicle Year, Job Title"
          autoFocus
          disabled={disabled}
        />
        <button
          type="button"
          onClick={handleNewFieldSubmit}
          disabled={!newFieldName.trim() || existingFields.includes(newFieldName.trim()) || disabled}
          className="px-3 py-2 border border-gray-300 bg-primary-50 text-primary-700 rounded-md hover:bg-primary-100 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add
        </button>
        <button
          type="button"
          onClick={() => {
            setNewFieldName("");
            setShowNewFieldInput(false);
          }}
          className="px-3 py-2 border border-gray-300 bg-gray-50 text-gray-700 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
          disabled={disabled}
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <select
      value={selectedField || ''}
      onChange={(e) => handleSelectChange(e.target.value)}
      className={`form-select ${className}`}
      disabled={disabled}
    >
      <option value="">{placeholder}</option>
      {existingFields.length > 0 && (
        <optgroup label="Existing Custom Fields">
          {existingFields.map((fieldName) => (
            <option key={fieldName} value={fieldName}>
              {fieldName}
            </option>
          ))}
        </optgroup>
      )}
      <optgroup label="Actions">
        <option value="ADD_CUSTOM">+ Add New Custom Field</option>
      </optgroup>
    </select>
  );
}