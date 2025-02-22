import React, { useState, useEffect } from 'react';
import { PlusCircle, X } from 'lucide-react';
import { Question, QuestionType, Decision, Condition, ConditionLogic } from '../types';
import DecisionMapping from './DecisionMapping';

const TIME_UNITS = ['DAYS', 'MONTHS', 'YEARS'];
const INTEGER_OPERATORS = ['<', '>', '=', '<=', '>='];

interface QuestionFormProps {
  onAdd: (question: Question) => void;
  onUpdate: (question: Question) => void;
  existingQuestions: Question[];
  formName: string;
  disabled: boolean;
  editingQuestion?: Question;
  onCancelEdit: () => void;
}

export default function QuestionForm({ 
  onAdd, 
  onUpdate,
  existingQuestions, 
  formName, 
  disabled,
  editingQuestion,
  onCancelEdit
}: QuestionFormProps) {
  const [wording, setWording] = useState('');
  const [type, setType] = useState<QuestionType>('text');
  const [attribute, setAttribute] = useState('');
  const [isDeveloperDetermined, setIsDeveloperDetermined] = useState(false);
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [conditionLogic, setConditionLogic] = useState<ConditionLogic>('AND');
  const [optional, setOptional] = useState(false);
  const [options, setOptions] = useState<string[]>([]);
  const [newOption, setNewOption] = useState('');
  const [decisions, setDecisions] = useState<Decision[]>([]);

  useEffect(() => {
    if (editingQuestion) {
      setWording(editingQuestion.wording);
      setType(editingQuestion.type);
      setAttribute(editingQuestion.attribute);
      setIsDeveloperDetermined(editingQuestion.attribute.startsWith('DEV_'));
      setConditions(editingQuestion.conditionGroup?.conditions || []);
      setConditionLogic(editingQuestion.conditionGroup?.logic || 'AND');
      setOptional(!editingQuestion.required);
      setOptions(editingQuestion.options || []);
      setDecisions(editingQuestion.decisions || []);
    }
  }, [editingQuestion]);

  useEffect(() => {
    if (isDeveloperDetermined) {
      const timestamp = Date.now();
      setAttribute(`DEV_${type.toUpperCase()}_${timestamp}`);
    }
  }, [isDeveloperDetermined, type]);

  const resetForm = () => {
    setWording('');
    setAttribute('');
    setIsDeveloperDetermined(false);
    setConditions([]);
    setConditionLogic('AND');
    setOptional(false);
    setOptions([]);
    setType('text');
    setDecisions([]);
  };

  const addOption = () => {
    if (newOption.trim()) {
      setOptions([...options, newOption.trim()]);
      setNewOption('');
    }
  };

  const removeOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const addCondition = () => {
    setConditions([...conditions, { attributeName: '', expression: '' }]);
  };

  const removeCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const updateCondition = (index: number, field: keyof Condition, value: string) => {
    const updatedConditions = [...conditions];
    updatedConditions[index] = {
      ...updatedConditions[index],
      [field]: value
    };
    setConditions(updatedConditions);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const question: Question = {
      id: editingQuestion?.id || Date.now().toString(),
      wording,
      type,
      attribute,
      conditionGroup: conditions.length > 0 ? {
        conditions,
        logic: conditionLogic
      } : undefined,
      required: !optional,
      options: type === 'picklist' ? options : undefined,
      decisions
    };

    if (editingQuestion) {
      onUpdate(question);
      onCancelEdit();
    } else {
      onAdd(question);
    }
    resetForm();
  };

  const renderConditionInput = (condition: Condition, index: number) => {
    const selectedQuestion = existingQuestions.find(q => q.attribute === condition.attributeName);

    switch (selectedQuestion?.type) {
      case 'date':
        return (
          <div className="grid grid-cols-3 gap-2">
            <select
              value={condition.expression.split(' ')[0] || ''}
              onChange={(e) => updateCondition(index, 'expression', `${e.target.value} ${condition.expression.split(' ')[1] || ''} ${condition.expression.split(' ')[2] || 'DAYS'}`)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
            >
              <option value="">Select operator</option>
              <option value="Within">Within</option>
              <option value="Not Within">Not Within</option>
            </select>
            <input
              type="number"
              value={condition.expression.split(' ')[1] || ''}
              onChange={(e) => updateCondition(index, 'expression', `${condition.expression.split(' ')[0] || ''} ${e.target.value} ${condition.expression.split(' ')[2] || 'DAYS'}`)}
              placeholder="Value"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
            />
            <select
              value={condition.expression.split(' ')[2] || 'DAYS'}
              onChange={(e) => updateCondition(index, 'expression', `${condition.expression.split(' ')[0] || ''} ${condition.expression.split(' ')[1] || ''} ${e.target.value}`)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
            >
              {TIME_UNITS.map(unit => (
                <option key={unit} value={unit}>{unit}</option>
              ))}
            </select>
          </div>
        );
      case 'picklist':
        return (
          <select
            value={condition.expression}
            onChange={(e) => updateCondition(index, 'expression', e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
          >
            <option value="">Select Option</option>
            {selectedQuestion.options?.map((option) => (
              <option key={option} value={`= ${option}`}>{option}</option>
            ))}
          </select>
        );
      case 'integer':
        return (
          <div className="grid grid-cols-2 gap-2">
            <select
              value={condition.expression.split(' ')[0] || ''}
              onChange={(e) => updateCondition(index, 'expression', `${e.target.value} ${condition.expression.split(' ')[1] || ''}`)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
            >
              <option value="">Select operator</option>
              {INTEGER_OPERATORS.map(op => (
                <option key={op} value={op}>{op}</option>
              ))}
            </select>
            <input
              type="number"
              value={condition.expression.split(' ')[1] || ''}
              onChange={(e) => updateCondition(index, 'expression', `${condition.expression.split(' ')[0] || ''} ${e.target.value}`)}
              placeholder="Enter value"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
            />
          </div>
        );
      default:
        return (
          <input
            type="text"
            value={condition.expression}
            onChange={(e) => updateCondition(index, 'expression', e.target.value)}
            placeholder="Enter condition"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
          />
        );
    }
  };

  if (disabled) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <p className="text-gray-500 text-center">
          Please enter a form name to start adding questions
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md space-y-4">
      <div className="text-sm text-gray-500 mb-4">
        Form: <span className="font-medium text-gray-700">{formName}</span>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Question Wording</label>
        <input
          type="text"
          value={wording}
          onChange={(e) => setWording(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Question Type</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as QuestionType)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
        >
          <option value="text">Text Box</option>
          <option value="picklist">Picklist</option>
          <option value="integer">Integer</option>
          <option value="date">Date</option>
        </select>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">Attribute Name</label>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="developerDetermined"
              checked={isDeveloperDetermined}
              onChange={(e) => setIsDeveloperDetermined(e.target.checked)}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="developerDetermined" className="text-sm text-gray-600">
              Developer to determine
            </label>
          </div>
        </div>
        <input
          type="text"
          value={attribute}
          onChange={(e) => !isDeveloperDetermined && setAttribute(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
          required
          disabled={isDeveloperDetermined}
          placeholder={isDeveloperDetermined ? "Auto-generated attribute name" : "Enter attribute name"}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">Conditions (Optional)</label>
          <button
            type="button"
            onClick={addCondition}
            className="inline-flex items-center px-2 py-1 border border-transparent text-sm font-medium rounded text-indigo-600 hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PlusCircle className="h-4 w-4 mr-1" />
            Add Condition
          </button>
        </div>
        
        {conditions.length > 0 && (
          <div className="flex items-center gap-2 mb-2">
            <label className="text-sm text-gray-600">Logic:</label>
            <select
              value={conditionLogic}
              onChange={(e) => setConditionLogic(e.target.value as ConditionLogic)}
              className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-1 border text-sm"
            >
              <option value="AND">ALL conditions must be true (AND)</option>
              <option value="OR">ANY condition must be true (OR)</option>
            </select>
          </div>
        )}

        {conditions.map((condition, index) => (
          <div key={index} className="space-y-2 p-4 border border-gray-200 rounded-md">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Condition {index + 1}</span>
              <button
                type="button"
                onClick={() => removeCondition(index)}
                className="text-red-600 hover:text-red-700"
              >
                <X size={20} />
              </button>
            </div>
            <select
              value={condition.attributeName}
              onChange={(e) => updateCondition(index, 'attributeName', e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
            >
              <option value="">Select Attribute</option>
              {existingQuestions.map(({ attribute, type }) => (
                <option key={attribute} value={attribute}>{attribute} ({type})</option>
              ))}
            </select>
            {condition.attributeName && renderConditionInput(condition, index)}
          </div>
        ))}
      </div>

      {type === 'picklist' && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Options</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newOption}
              onChange={(e) => setNewOption(e.target.value)}
              className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
              placeholder="Add option"
            />
            <button
              type="button"
              onClick={addOption}
              className="p-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              <PlusCircle size={20} />
            </button>
          </div>
          <div className="space-y-2">
            {options.map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="flex-1 p-2 bg-gray-50 rounded-md">{option}</span>
                <button
                  type="button"
                  onClick={() => removeOption(index)}
                  className="p-1 text-red-600 hover:text-red-700"
                >
                  <X size={20} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="optional"
          checked={optional}
          onChange={(e) => setOptional(e.target.checked)}
          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
        />
        <label htmlFor="optional" className="text-sm font-medium text-gray-700">
          Optional
        </label>
      </div>

      {wording && (
        <DecisionMapping
          question={{
            id: editingQuestion?.id || Date.now().toString(),
            wording,
            type,
            attribute,
            required: !optional,
            options,
            decisions
          }}
          onUpdate={setDecisions}
        />
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors"
        >
          {editingQuestion ? 'Update Question' : 'Add Question'}
        </button>
        {editingQuestion && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}