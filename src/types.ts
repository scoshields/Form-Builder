export type QuestionType = 'picklist' | 'integer' | 'date' | 'text';

export type DecisionOutcome = 'ACCEPT' | 'DECLINE' | 'REFER' | 'POSTPONE';

export type ConditionLogic = 'AND' | 'OR';

export interface Condition {
  attributeName: string;
  expression: string;
}

export interface ConditionGroup {
  conditions: Condition[];
  logic: ConditionLogic;
}

export interface Decision {
  id: string;
  condition: string;
  outcome: DecisionOutcome;
}

export interface Question {
  id: string;
  wording: string;
  type: QuestionType;
  attribute: string;
  conditionGroup?: ConditionGroup;
  options?: string[];
  required: boolean;
  decisions: Decision[];
}