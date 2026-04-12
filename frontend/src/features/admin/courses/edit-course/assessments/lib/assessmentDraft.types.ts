import type { QuizQuestionType } from '@/services/course';

export type AssessmentOptionDraft = {
  id: string;
  labelEn: string;
  labelFi: string;
  isCorrect: boolean;
};

export type AssessmentQuestionDraft = {
  id: string;
  promptEn: string;
  promptFi: string;
  explanationEn: string;
  explanationFi: string;
  type: QuizQuestionType;
  options: AssessmentOptionDraft[];
};

export type AssessmentFormState = {
  titleEn: string;
  titleFi: string;
  descriptionEn: string;
  descriptionFi: string;
  passingScore: string;
  isPublished: boolean;
  questions: AssessmentQuestionDraft[];
};

export type AssessmentStats = {
  attemptCount: number;
  bestScore: number | null;
};
