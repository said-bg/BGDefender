export type QuizAttemptView = {
  id: string;
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  passed: boolean;
  submittedAt: Date;
};

export type AdminQuizQuestionView = {
  id: string;
  promptEn: string;
  promptFi: string;
  explanationEn: string | null;
  explanationFi: string | null;
  type: string;
  orderIndex: number;
  options: Array<{
    id: string;
    labelEn: string;
    labelFi: string;
    orderIndex: number;
    isCorrect: boolean;
  }>;
};

export type LearnerQuizQuestionView = {
  id: string;
  promptEn: string;
  promptFi: string;
  explanationEn: string | null;
  explanationFi: string | null;
  type: string;
  orderIndex: number;
  options: Array<{
    id: string;
    labelEn: string;
    labelFi: string;
    orderIndex: number;
  }>;
};

export type AdminQuizView = {
  id: string;
  chapterId: string;
  titleEn: string;
  titleFi: string;
  descriptionEn: string | null;
  descriptionFi: string | null;
  passingScore: number;
  isPublished: boolean;
  questions: AdminQuizQuestionView[];
  stats: {
    attemptCount: number;
    latestAttemptAt: Date | null;
    bestScore: number | null;
  };
};

export type LearnerQuizView = {
  id: string;
  chapterId: string;
  titleEn: string;
  titleFi: string;
  descriptionEn: string | null;
  descriptionFi: string | null;
  passingScore: number;
  isPublished: boolean;
  questions: LearnerQuizQuestionView[];
  latestAttempt: QuizAttemptView | null;
  bestAttempt: QuizAttemptView | null;
};

export type AdminFinalTestView = {
  id: string;
  courseId: string;
  titleEn: string;
  titleFi: string;
  descriptionEn: string | null;
  descriptionFi: string | null;
  passingScore: number;
  isPublished: boolean;
  questions: AdminQuizQuestionView[];
  stats: AdminQuizView['stats'];
};

export type LearnerFinalTestView = {
  id: string;
  courseId: string;
  titleEn: string;
  titleFi: string;
  descriptionEn: string | null;
  descriptionFi: string | null;
  passingScore: number;
  isPublished: boolean;
  isUnlocked: boolean;
  certificate: {
    id: string;
    status: 'pending_profile' | 'issued';
    issuedAt: Date | null;
  } | null;
  questions: LearnerQuizQuestionView[];
  latestAttempt: QuizAttemptView | null;
  bestAttempt: QuizAttemptView | null;
};

export type SubmitQuizAttemptResult = {
  attempt: QuizAttemptView;
  latestAttempt: QuizAttemptView;
  bestAttempt: QuizAttemptView;
};
