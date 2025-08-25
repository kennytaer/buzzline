import { useState, useCallback } from 'react';

export interface UseCustomFieldsProps {
  initialFields: string[];
  orgId: string;
  initialActiveFields?: string[];
  initialValues?: Record<string, string>;
  onFieldAdded?: (fieldName: string) => void;
}

export interface UseCustomFieldsReturn {
  availableFields: string[];
  activeFields: string[];
  fieldValues: Record<string, string>;
  addField: (fieldName: string) => Promise<string>;
  removeField: (fieldName: string) => void;
  updateFieldValue: (fieldName: string, value: string) => void;
  clearAllFields: () => void;
}

export function useCustomFields({ 
  initialFields, 
  orgId,
  initialActiveFields = [],
  initialValues = {},
  onFieldAdded 
}: UseCustomFieldsProps): UseCustomFieldsReturn {
  const [availableFields, setAvailableFields] = useState<string[]>(initialFields);
  const [activeFields, setActiveFields] = useState<string[]>(initialActiveFields);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>(initialValues);

  const addField = useCallback(async (fieldName: string): Promise<string> => {
    const cleanFieldName = fieldName.trim();
    
    if (!cleanFieldName) {
      throw new Error('Field name cannot be empty');
    }
    
    if (activeFields.includes(cleanFieldName)) {
      throw new Error('Field is already active');
    }

    // Add to available fields if not already there
    if (!availableFields.includes(cleanFieldName)) {
      setAvailableFields(prev => [...prev, cleanFieldName]);
      
      // Optionally sync with server (could also be done on form submit)
      if (onFieldAdded) {
        onFieldAdded(cleanFieldName);
      }
    }

    // Add to active fields for this form
    setActiveFields(prev => [...prev, cleanFieldName]);
    setFieldValues(prev => ({ ...prev, [cleanFieldName]: '' }));
    
    return cleanFieldName;
  }, [availableFields, activeFields, onFieldAdded]);

  const removeField = useCallback((fieldName: string) => {
    setActiveFields(prev => prev.filter(field => field !== fieldName));
    setFieldValues(prev => {
      const newValues = { ...prev };
      delete newValues[fieldName];
      return newValues;
    });
  }, []);

  const updateFieldValue = useCallback((fieldName: string, value: string) => {
    setFieldValues(prev => ({ ...prev, [fieldName]: value }));
  }, []);

  const clearAllFields = useCallback(() => {
    setActiveFields([]);
    setFieldValues({});
  }, []);

  return {
    availableFields,
    activeFields,
    fieldValues,
    addField,
    removeField,
    updateFieldValue,
    clearAllFields
  };
}