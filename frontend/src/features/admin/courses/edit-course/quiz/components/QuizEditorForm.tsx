'use client';

import type { TFunction } from 'i18next';
import AssessmentEditorForm from '@/features/admin/courses/edit-course/assessments/components/AssessmentEditorForm';
import type { AssessmentFormState, AssessmentStats } from '@/features/admin/courses/edit-course/assessments/lib/assessmentDraft.types';

type QuizEditorFormProps = {
  form: AssessmentFormState;
  isDeletingQuiz: boolean;
  isSavingQuiz: boolean;
  loadedQuizStats: AssessmentStats | null;
  quizError: string | null;
  quizMessage: string | null;
  styles: Record<string, string>;
  t: TFunction<'admin', undefined>;
  onAddOption: (questionId: string) => void;
  onAddQuestion: () => void;
  onDeleteQuiz: () => void;
  onQuestionTypeChange: (questionId: string, nextType: 'single_choice' | 'multiple_choice') => void;
  onRemoveOption: (questionId: string, optionId: string) => void;
  onRemoveQuestion: (questionId: string) => void;
  onReset: () => void;
  onSave: () => void;
  onToggleOptionCorrect: (questionId: string, optionId: string, checked: boolean) => void;
  onUpdateOptionField: (
    questionId: string,
    optionId: string,
    field: 'labelEn' | 'labelFi',
    value: string,
  ) => void;
  onUpdateQuestionField: (
    questionId: string,
    field: 'promptEn' | 'promptFi' | 'explanationEn' | 'explanationFi',
    value: string,
  ) => void;
  onUpdateTopLevelField: (
    field: 'titleEn' | 'titleFi' | 'descriptionEn' | 'descriptionFi' | 'passingScore' | 'isPublished',
    value: string | boolean,
  ) => void;
};

export default function QuizEditorForm({
  form,
  isDeletingQuiz,
  isSavingQuiz,
  loadedQuizStats,
  quizError,
  quizMessage,
  styles,
  t,
  onAddOption,
  onAddQuestion,
  onDeleteQuiz,
  onQuestionTypeChange,
  onRemoveOption,
  onRemoveQuestion,
  onReset,
  onSave,
  onToggleOptionCorrect,
  onUpdateOptionField,
  onUpdateQuestionField,
  onUpdateTopLevelField,
}: QuizEditorFormProps) {
  return (
    <AssessmentEditorForm
      copy={{
        addOption: t('edit.quiz.addOption', { defaultValue: 'Add option' }),
        addQuestion: t('edit.quiz.addQuestion', { defaultValue: 'Add question' }),
        attemptsShort: t('edit.quiz.attemptsShort', { defaultValue: 'attempts' }),
        bestScoreLabel: t('edit.quiz.bestScoreLabel', { defaultValue: 'Best score' }),
        cancel: t('common.cancel', { defaultValue: 'Cancel' }),
        correctAnswer: t('edit.quiz.correctAnswer', { defaultValue: 'Correct' }),
        deleteAction: t('edit.quiz.deleteQuiz', { defaultValue: 'Delete quiz' }),
        deletingAction: t('edit.quiz.deleting', { defaultValue: 'Deleting quiz...' }),
        descriptionEn: t('edit.quiz.descriptionEn', { defaultValue: 'Description (English)' }),
        descriptionFi: t('edit.quiz.descriptionFi', { defaultValue: 'Description (Finnish)' }),
        explanationEn: t('edit.quiz.explanationEn', { defaultValue: 'Explanation (English)' }),
        explanationFi: t('edit.quiz.explanationFi', { defaultValue: 'Explanation (Finnish)' }),
        multipleChoice: t('edit.quiz.multipleChoice', { defaultValue: 'Multiple choice' }),
        optionEn: t('edit.quiz.optionEn', { defaultValue: 'Option (English)' }),
        optionFi: t('edit.quiz.optionFi', { defaultValue: 'Option (Finnish)' }),
        optionsTitle: t('edit.quiz.optionsTitle', { defaultValue: 'Answer options' }),
        passingScore: t('edit.quiz.passingScore', { defaultValue: 'Passing score (%)' }),
        promptEn: t('edit.quiz.promptEn', { defaultValue: 'Prompt (English)' }),
        promptFi: t('edit.quiz.promptFi', { defaultValue: 'Prompt (Finnish)' }),
        publishNow: t('edit.quiz.publishNow', {
          defaultValue: 'Make this quiz visible to learners now',
        }),
        questionLabel: t('edit.quiz.questionLabel', { defaultValue: 'Question' }),
        questionType: t('edit.quiz.questionType', { defaultValue: 'Question type' }),
        questionsTitle: t('edit.quiz.questionsTitle', { defaultValue: 'Questions' }),
        saveAction: t('edit.quiz.saveQuiz', { defaultValue: 'Save quiz' }),
        savingAction: t('edit.quiz.saving', { defaultValue: 'Saving quiz...' }),
        singleChoice: t('edit.quiz.singleChoice', { defaultValue: 'Single choice' }),
        titleEn: t('edit.quiz.titleEn', { defaultValue: 'Quiz title (English)' }),
        titleFi: t('edit.quiz.titleFi', { defaultValue: 'Quiz title (Finnish)' }),
        untitledQuestion: t('edit.quiz.untitledQuestion', {
          defaultValue: 'Untitled question',
        }),
      }}
      error={quizError}
      form={form}
      hasExistingAssessment={Boolean(loadedQuizStats)}
      isDeleting={isDeletingQuiz}
      isSaving={isSavingQuiz}
      message={quizMessage}
      stats={loadedQuizStats}
      styles={styles}
      onAddOption={onAddOption}
      onAddQuestion={onAddQuestion}
      onDelete={onDeleteQuiz}
      onQuestionTypeChange={onQuestionTypeChange}
      onRemoveOption={onRemoveOption}
      onRemoveQuestion={onRemoveQuestion}
      onReset={onReset}
      onSave={onSave}
      onToggleOptionCorrect={onToggleOptionCorrect}
      onUpdateOptionField={onUpdateOptionField}
      onUpdateQuestionField={onUpdateQuestionField}
      onUpdateTopLevelField={onUpdateTopLevelField}
    />
  );
}
