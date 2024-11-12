import React from 'react';
import { Question } from '../types';
import { Trash2, Edit2 } from 'lucide-react';

interface QuestionListProps {
  questions: Question[];
  onDelete: (id: string) => void;
  onEdit: (question: Question) => void;
}

export default function QuestionList({ questions, onDelete, onEdit }: QuestionListProps) {
  return (
    <div className="space-y-4">
      {questions.map((question) => (
        <div key={question.id} className="bg-white p-4 rounded-lg shadow-md">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <h3 className="font-medium text-lg">{question.wording}</h3>
              <div className="space-y-1 text-sm text-gray-600">
                <p>Type: <span className="font-medium">{question.type}</span></p>
                <p>Attribute: <span className="font-medium">{question.attribute}</span></p>
                {question.condition && (
                  <p>Condition: <span className="font-medium">
                    {question.condition.attributeName} {question.condition.expression}
                  </span></p>
                )}
                <p>Optional: <span className="font-medium">{question.required ? 'No' : 'Yes'}</span></p>
                {question.type === 'picklist' && question.options && (
                  <div>
                    <p>Options:</p>
                    <ul className="list-disc list-inside pl-4">
                      {question.options.map((option, index) => (
                        <li key={index}>{option}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {question.decisions && question.decisions.length > 0 && (
                  <div>
                    <p>Decisions:</p>
                    <ul className="list-disc list-inside pl-4">
                      {question.decisions.map((decision) => (
                        <li key={decision.id}>
                          If {decision.condition} Then {decision.outcome}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onEdit(question)}
                className="text-indigo-600 hover:text-indigo-700 p-1"
              >
                <Edit2 size={20} />
              </button>
              <button
                onClick={() => onDelete(question.id)}
                className="text-red-600 hover:text-red-700 p-1"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}