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
        addOption: t('edit.quiz.addOption'),
        addQuestion: t('edit.quiz.addQuestion'),
        attemptsShort: t('edit.quiz.attemptsShort'),
        bestScoreLabel: t('edit.quiz.bestScoreLabel'),
        cancel: t('common.cancel'),
        correctAnswer: t('edit.quiz.correctAnswer'),
        deleteAction: t('edit.quiz.deleteQuiz'),
        deleteQuestion: t('edit.quiz.deleteQuestion'),
        deletingAction: t('edit.quiz.deleting'),
        descriptionEn: t('edit.quiz.descriptionEn'),
        descriptionFi: t('edit.quiz.descriptionFi'),
        explanationEn: t('edit.quiz.explanationEn'),
        explanationFi: t('edit.quiz.explanationFi'),
        multipleChoice: t('edit.quiz.multipleChoice'),
        optionEn: t('edit.quiz.optionEn'),
        optionFi: t('edit.quiz.optionFi'),
        optionsTitle: t('edit.quiz.optionsTitle'),
        passingScore: t('edit.quiz.passingScore'),
        promptEn: t('edit.quiz.promptEn'),
        promptFi: t('edit.quiz.promptFi'),
        publishNow: t('edit.quiz.publishNow'),
        questionLabel: t('edit.quiz.questionLabel'),
        questionType: t('edit.quiz.questionType'),
        questionsTitle: t('edit.quiz.questionsTitle'),
        saveAction: t('edit.quiz.saveQuiz'),
        savingAction: t('edit.quiz.saving'),
        singleChoice: t('edit.quiz.singleChoice'),
        titleEn: t('edit.quiz.titleEn'),
        titleFi: t('edit.quiz.titleFi'),
        untitledQuestion: t('edit.quiz.untitledQuestion'),
      }}
      error={quizError}
      form={form}
      hasExistingAssessment={Boolean(loadedQuizStats)}
      isDeleting={isDeletingQuiz}
      isSaving={isSavingQuiz}
      message={quizMessage}
      stats={loadedQuizStats}
      showInlineStats={false}
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
