import React, { useState } from 'react';
import { PlusCircle, X } from 'lucide-react';
import { Question, Decision, DecisionOutcome } from '../types';

interface DecisionMappingProps {
  question: Question;
  onUpdate: (decisions: Decision[]) => void;
}

const DECISION_OUTCOMES: DecisionOutcome[] = ['ACCEPT', 'DECLINE', 'REFER', 'POSTPONE'];
const TIME_UNITS = ['DAYS', 'MONTHS', 'YEARS'];

export default function DecisionMapping({ question, onUpdate }: DecisionMappingProps) {
  const [newCondition, setNewCondition] = useState('');
  const [newOutcome, setNewOutcome] = useState<DecisionOutcome>('ACCEPT');
  const [dateOperator, setDateOperator] = useState('Within');
  const [dateValue, setDateValue] = useState('');
  const [dateUnit, setDateUnit] = useState('DAYS');

  const addDecision = () => {
    if (question.type === 'date') {
      if (dateValue.trim() && dateOperator && dateUnit) {
        const condition = `${dateOperator} ${dateValue} ${dateUnit}`;
        const newDecision: Decision = {
          id: Date.now().toString(),
          condition,
          outcome: newOutcome
        };
        onUpdate([...question.decisions, newDecision]);
        setDateOperator('Within');
        setDateValue('');
        setDateUnit('DAYS');
      }
    } else if (newCondition.trim()) {
      const newDecision: Decision = {
        id: Date.now().toString(),
        condition: newCondition.trim(),
        outcome: newOutcome
      };
      onUpdate([...question.decisions, newDecision]);
      setNewCondition('');
    }
    setNewOutcome('ACCEPT');
  };

  const removeDecision = (id: string) => {
    onUpdate(question.decisions.filter(d => d.id !== id));
  };

  const renderConditionInput = () => {
    switch (question.type) {
      case 'date':
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
            <select
              value={dateOperator}
              onChange={(e) => setDateOperator(e.target.value)}
              className="w-full h-12 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 text-base"
            >
              <option value="Within">Within</option>
              <option value="Not Within">Not Within</option>
            </select>
            <input
              type="number"
              value={dateValue}
              onChange={(e) => setDateValue(e.target.value)}
              placeholder="Enter value"
              className="w-full h-12 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 text-base"
            />
            <select
              value={dateUnit}
              onChange={(e) => setDateUnit(e.target.value)}
              className="w-full h-12 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 text-base"
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
            value={newCondition}
            onChange={(e) => setNewCondition(e.target.value)}
            className="w-full h-12 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 text-base"
          >
            <option value="">Select option</option>
            {question.options?.map((option) => (
              <option key={option} value={`= ${option}`}>{option}</option>
            ))}
          </select>
        );
      case 'integer':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            <select
              value={newCondition.split(' ')[0] || ''}
              onChange={(e) => setNewCondition(`${e.target.value} ${newCondition.split(' ')[1] || ''}`)}
              className="w-full h-12 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 text-base"
            >
              <option value="">Select operator</option>
              <option value="<">Less than</option>
              <option value=">">Greater than</option>
              <option value="=">Equal to</option>
              <option value="<=">Less than or equal to</option>
              <option value=">=">Greater than or equal to</option>
            </select>
            <input
              type="number"
              value={newCondition.split(' ')[1] || ''}
              onChange={(e) => setNewCondition(`${newCondition.split(' ')[0] || ''} ${e.target.value}`)}
              className="w-full h-12 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 text-base"
            />
          </div>
        );
      default:
        return (
          <input
            type="text"
            value={newCondition}
            onChange={(e) => setNewCondition(e.target.value)}
            placeholder="Enter condition"
            className="w-full h-12 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 text-base"
          />
        );
    }
  };

  return (
    <div className="space-y-6 mt-8 bg-gray-50 p-6 rounded-lg">
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <h4 className="text-lg font-medium text-gray-900">Decision Mapping</h4>
      </div>
      
      <div className="space-y-3">
        {question.decisions.map((decision) => (
          <div key={decision.id} className="flex items-center gap-4 bg-white p-4 rounded-md shadow-sm">
            <span className="flex-1 text-base">If {decision.condition}</span>
            <span className="flex-1 text-base">Then <span className={`font-medium ${
              decision.outcome === 'ACCEPT' ? 'text-green-600' :
              decision.outcome === 'DECLINE' ? 'text-red-600' :
              decision.outcome === 'REFER' ? 'text-yellow-600' :
              'text-blue-600'
            }`}>{decision.outcome}</span></span>
            <button
              type="button"
              onClick={() => removeDecision(decision.id)}
              className="text-red-600 hover:text-red-700 p-2"
            >
              <X size={20} />
            </button>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          {renderConditionInput()}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select
              value={newOutcome}
              onChange={(e) => setNewOutcome(e.target.value as DecisionOutcome)}
              className="w-full h-12 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 text-base"
            >
              {DECISION_OUTCOMES.map(outcome => (
                <option key={outcome} value={outcome}>{outcome}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={addDecision}
              disabled={question.type === 'date' ? !dateValue || !dateOperator || !dateUnit : !newCondition}
              className="w-full h-12 flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 rounded-md hover:bg-indigo-700 transition-colors disabled:bg-gray-400 text-base"
            >
              <PlusCircle size={20} />
              Add Decision
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}