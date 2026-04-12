import type { QuizQuestionType } from '@/services/course';
import type {
  AssessmentFormState,
  AssessmentOptionDraft,
  AssessmentQuestionDraft,
} from './assessmentDraft.types';

type AssessmentOptionLike = {
  id: string;
  labelEn: string;
  labelFi: string;
  isCorrect?: boolean | null;
};

type AssessmentQuestionLike = {
  id: string;
  promptEn: string;
  promptFi: string;
  explanationEn?: string | null;
  explanationFi?: string | null;
  type: QuizQuestionType;
  options: AssessmentOptionLike[];
};

type AssessmentLike = {
  titleEn: string;
  titleFi: string;
  descriptionEn?: string | null;
  descriptionFi?: string | null;
  passingScore: number;
  isPublished: boolean;
  questions: AssessmentQuestionLike[];
};

export const createDraftId = () => Math.random().toString(36).slice(2, 10);

export const createOptionDraft = (
  overrides?: Partial<AssessmentOptionDraft>,
): AssessmentOptionDraft => ({
  id: createDraftId(),
  labelEn: '',
  labelFi: '',
  isCorrect: false,
  ...overrides,
});

export const createQuestionDraft = (
  overrides?: Partial<AssessmentQuestionDraft>,
): AssessmentQuestionDraft => ({
  id: createDraftId(),
  promptEn: '',
  promptFi: '',
  explanationEn: '',
  explanationFi: '',
  type: 'single_choice',
  options: [createOptionDraft({ isCorrect: true }), createOptionDraft()],
  ...overrides,
});

export const createEmptyAssessmentForm = (
  titleEn = '',
  titleFi = '',
): AssessmentFormState => ({
  titleEn,
  titleFi,
  descriptionEn: '',
  descriptionFi: '',
  passingScore: '70',
  isPublished: false,
  questions: [createQuestionDraft()],
});

export const mapAssessmentToForm = (
  assessment: AssessmentLike,
): AssessmentFormState => ({
  titleEn: assessment.titleEn,
  titleFi: assessment.titleFi,
  descriptionEn: assessment.descriptionEn ?? '',
  descriptionFi: assessment.descriptionFi ?? '',
  passingScore: String(assessment.passingScore),
  isPublished: assessment.isPublished,
  questions: assessment.questions.map((question) => ({
    id: question.id,
    promptEn: question.promptEn,
    promptFi: question.promptFi,
    explanationEn: question.explanationEn ?? '',
    explanationFi: question.explanationFi ?? '',
    type: question.type,
    options: question.options.map((option) => ({
      id: option.id,
      labelEn: option.labelEn,
      labelFi: option.labelFi,
      isCorrect: Boolean(option.isCorrect),
    })),
  })),
});
