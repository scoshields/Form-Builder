import React, { useState } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import { Question } from './types';
import QuestionForm from './components/QuestionForm';
import QuestionList from './components/QuestionList';
import QuestionPreview from './components/QuestionPreview';
import { utils, writeFile } from 'xlsx';

export default function App() {
  const [formName, setFormName] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<Question | undefined>();
  const [activeTab, setActiveTab] = useState<'build' | 'preview'>('build');

  const handleAddQuestion = (question: Question) => {
    setQuestions([...questions, question]);
  };

  const handleUpdateQuestion = (updatedQuestion: Question) => {
    setQuestions(questions.map(q => 
      q.id === updatedQuestion.id ? updatedQuestion : q
    ));
    setEditingQuestion(undefined);
  };

  const handleDeleteQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const handleNewForm = () => {
    if (confirm('Are you sure you want to start a new form? All current questions will be cleared.')) {
      setFormName('');
      setQuestions([]);
      setEditingQuestion(undefined);
      setActiveTab('build');
    }
  };

  const exportToExcel = () => {
    if (questions.length === 0) return;

    // Create workbook and worksheet
    const workbook = utils.book_new();
    const questionsSheet = utils.aoa_to_sheet([['Form Name', formName]]);
    utils.book_append_sheet(workbook, questionsSheet, 'Questions');

    // Add headers row
    const headers = ['Question', 'Type', 'Attribute', 'Condition', 'Required', 'Option/Value', 'Decision'];
    utils.sheet_add_aoa(questionsSheet, [headers], { origin: 'A2' });

    // Add questions data
    const rows: any[] = [];
    questions.forEach((question) => {
      const baseRow = [
        question.wording,
        question.type,
        question.attribute,
        question.condition ? 
          `${question.condition.attributeName} ${question.condition.expression}` : '',
        question.required ? 'Yes' : 'No'
      ];

      if (question.type === 'date') {
        question.decisions.forEach(decision => {
          const [operator, value, unit] = decision.condition.split(' ');
          rows.push([
            ...baseRow,
            `${operator} ${value} ${unit}`,
            decision.outcome
          ]);
        });
      } else if (question.options?.length) {
        question.options.forEach((option) => {
          const decisions = question.decisions
            .filter(d => d.condition === `= ${option}`)
            .map(d => d.outcome)
            .join(', ');
          rows.push([...baseRow, option, decisions]);
        });
      } else {
        question.decisions.forEach(decision => {
          const [operator, value] = decision.condition.split(' ');
          rows.push([
            ...baseRow,
            `${operator} ${value}`,
            decision.outcome
          ]);
        });
      }
    });

    utils.sheet_add_aoa(questionsSheet, rows, { origin: 'A3' });

    // Save workbook
    writeFile(workbook, `${formName.toLowerCase().replace(/\s+/g, '-')}-questions.xlsx`);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex-1 max-w-md">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Form Builder</h1>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Enter form name"
              className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-4">
            <button
              onClick={handleNewForm}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              New Form
            </button>
            <button
              onClick={exportToExcel}
              disabled={!formName || questions.length === 0}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <Download className="h-4 w-4 mr-2" />
              Export to Excel
            </button>
          </div>
        </div>

        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('build')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'build'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Build Form
              </button>
              <button
                onClick={() => setActiveTab('preview')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'preview'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Preview Form
              </button>
            </nav>
          </div>
        </div>

        {activeTab === 'build' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <QuestionForm
                onAdd={handleAddQuestion}
                onUpdate={handleUpdateQuestion}
                existingQuestions={questions}
                formName={formName}
                disabled={!formName}
                editingQuestion={editingQuestion}
                onCancelEdit={() => setEditingQuestion(undefined)}
              />
            </div>
            <div>
              <QuestionList
                questions={questions}
                onDelete={handleDeleteQuestion}
                onEdit={setEditingQuestion}
              />
            </div>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <QuestionPreview questions={questions} />
          </div>
        )}
      </div>
    </div>
  );
}