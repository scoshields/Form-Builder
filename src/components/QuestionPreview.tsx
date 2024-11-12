import React, { useState, useEffect } from 'react';
import { isWithinInterval, subDays, subMonths, subYears, parseISO, startOfDay } from 'date-fns';
import { Question } from '../types';

interface QuestionPreviewProps {
  questions: Question[];
}

export default function QuestionPreview({ questions }: QuestionPreviewProps) {
  const [answers, setAnswers] = useState<{ [key: string]: string | number | undefined }>({});
  const [decisions, setDecisions] = useState<{ [key: string]: string }>({});
  const [visibleQuestions, setVisibleQuestions] = useState<Question[]>([]);

  const evaluateDateCondition = (condition: string, value: string): boolean => {
    if (!value) return false;
    
    const [operator, amount, unit] = condition.trim().split(' ');
    const numAmount = parseInt(amount);
    const currentDate = startOfDay(new Date());
    const inputDate = startOfDay(parseISO(value));
    
    let startDate;
    switch (unit.toUpperCase()) {
      case 'DAYS':
        startDate = subDays(currentDate, numAmount);
        break;
      case 'MONTHS':
        startDate = subMonths(currentDate, numAmount);
        break;
      case 'YEARS':
        startDate = subYears(currentDate, numAmount);
        break;
      default:
        return false;
    }

    const interval = { start: startDate, end: currentDate };
    const isWithin = isWithinInterval(inputDate, interval);
    return operator === 'Within' ? isWithin : !isWithin;
  };

  const evaluateCondition = (condition: { attributeName: string, expression: string }): boolean => {
    const dependentValue = answers[condition.attributeName];
    if (dependentValue === undefined) return false;

    const dependentQuestion = questions.find(q => q.attribute === condition.attributeName);
    if (!dependentQuestion) return false;

    if (dependentQuestion.type === 'date') {
      return evaluateDateCondition(condition.expression, dependentValue.toString());
    }

    if (condition.expression.startsWith('= ')) {
      return dependentValue === condition.expression.substring(2);
    }

    const numericValue = Number(dependentValue);
    const [operator, threshold] = condition.expression.split(' ');
    const numericThreshold = Number(threshold);

    switch (operator) {
      case '>': return numericValue > numericThreshold;
      case '<': return numericValue < numericThreshold;
      case '=': return numericValue === numericThreshold;
      case '>=': return numericValue >= numericThreshold;
      case '<=': return numericValue <= numericThreshold;
      default: return false;
    }
  };

  const evaluateQuestionVisibility = (question: Question): boolean => {
    if (!question.conditionGroup) return true;

    const { conditions, logic } = question.conditionGroup;
    if (conditions.length === 0) return true;

    if (logic === 'AND') {
      return conditions.every(evaluateCondition);
    } else {
      return conditions.some(evaluateCondition);
    }
  };

  useEffect(() => {
    const visible = questions.filter(evaluateQuestionVisibility);
    setVisibleQuestions(visible);
  }, [answers, questions]);

  const handleAnswerChange = (question: Question, value: string) => {
    const newValue = question.type === 'integer' ? parseInt(value) || undefined : value;
    setAnswers(prev => ({
      ...prev,
      [question.attribute]: newValue
    }));

    // Evaluate decisions
    const decision = question.decisions?.find(d => {
      if (question.type === 'date') {
        return evaluateDateCondition(d.condition, value);
      } else if (question.type === 'picklist') {
        return d.condition === `= ${value}`;
      } else if (question.type === 'integer') {
        const [operator, threshold] = d.condition.split(' ');
        const numValue = parseInt(value);
        const numThreshold = parseInt(threshold);
        
        switch (operator) {
          case '>': return numValue > numThreshold;
          case '<': return numValue < numThreshold;
          case '=': return numValue === numThreshold;
          case '>=': return numValue >= numThreshold;
          case '<=': return numValue <= numThreshold;
          default: return false;
        }
      }
      return false;
    });

    if (decision) {
      setDecisions(prev => ({
        ...prev,
        [question.id]: decision.outcome
      }));
    } else {
      setDecisions(prev => {
        const newDecisions = { ...prev };
        delete newDecisions[question.id];
        return newDecisions;
      });
    }
  };

  const renderInput = (question: Question) => {
    const decision = decisions[question.id];
    const decisionClass = decision ? `border-l-4 ${
      decision === 'ACCEPT' ? 'border-green-500' :
      decision === 'DECLINE' ? 'border-red-500' :
      decision === 'REFER' ? 'border-yellow-500' :
      'border-blue-500'
    }` : '';

    switch (question.type) {
      case 'picklist':
        return (
          <select
            value={answers[question.attribute]?.toString() || ''}
            onChange={(e) => handleAnswerChange(question, e.target.value)}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border ${decisionClass}`}
            required={question.required}
          >
            <option value="">Select an option</option>
            {question.options?.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );
      case 'date':
        return (
          <input
            type="date"
            value={answers[question.attribute]?.toString() || ''}
            onChange={(e) => handleAnswerChange(question, e.target.value)}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border ${decisionClass}`}
            required={question.required}
          />
        );
      case 'integer':
        return (
          <input
            type="number"
            value={answers[question.attribute]?.toString() || ''}
            onChange={(e) => handleAnswerChange(question, e.target.value)}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border ${decisionClass}`}
            required={question.required}
          />
        );
      default:
        return (
          <input
            type="text"
            value={answers[question.attribute]?.toString() || ''}
            onChange={(e) => handleAnswerChange(question, e.target.value)}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border ${decisionClass}`}
            required={question.required}
          />
        );
    }
  };

  return (
    <div className="space-y-6">
      {visibleQuestions.map((question) => (
        <div key={question.id} className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            {question.wording}
            {!question.required && <span className="text-gray-500 ml-1">(Optional)</span>}
          </label>
          {renderInput(question)}
          {decisions[question.id] && (
            <div className={`text-sm font-medium ${
              decisions[question.id] === 'ACCEPT' ? 'text-green-600' :
              decisions[question.id] === 'DECLINE' ? 'text-red-600' :
              decisions[question.id] === 'REFER' ? 'text-yellow-600' :
              'text-blue-600'
            }`}>
              Decision: {decisions[question.id]}
            </div>
          )}
        </div>
      ))}
      {visibleQuestions.length === 0 && (
        <p className="text-gray-500 text-center">No questions to display</p>
      )}
    </div>
  );
}