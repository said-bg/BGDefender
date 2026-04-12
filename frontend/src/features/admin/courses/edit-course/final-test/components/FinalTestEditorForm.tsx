'use client';

import type { TFunction } from 'i18next';
import AssessmentEditorForm from '@/features/admin/courses/edit-course/assessments/components/AssessmentEditorForm';
import type {
  AssessmentFormState,
  AssessmentStats,
} from '@/features/admin/courses/edit-course/assessments/lib/assessmentDraft.types';

type FinalTestEditorFormProps = {
  form: AssessmentFormState;
  isDeletingFinalTest: boolean;
  isSavingFinalTest: boolean;
  loadedFinalTestStats: AssessmentStats | null;
  finalTestError: string | null;
  finalTestMessage: string | null;
  styles: Record<string, string>;
  t: TFunction<'admin', undefined>;
  onAddOption: (questionId: string) => void;
  onAddQuestion: () => void;
  onDeleteFinalTest: () => void;
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

export default function FinalTestEditorForm({
  form,
  isDeletingFinalTest,
  isSavingFinalTest,
  loadedFinalTestStats,
  finalTestError,
  finalTestMessage,
  styles,
  t,
  onAddOption,
  onAddQuestion,
  onDeleteFinalTest,
  onQuestionTypeChange,
  onRemoveOption,
  onRemoveQuestion,
  onReset,
  onSave,
  onToggleOptionCorrect,
  onUpdateOptionField,
  onUpdateQuestionField,
  onUpdateTopLevelField,
}: FinalTestEditorFormProps) {
  return (
    <AssessmentEditorForm
      copy={{
        addOption: t('edit.finalTest.addOption', { defaultValue: 'Add option' }),
        addQuestion: t('edit.finalTest.addQuestion', { defaultValue: 'Add question' }),
        attemptsShort: t('edit.finalTest.attemptsShort', { defaultValue: 'attempts' }),
        bestScoreLabel: t('edit.finalTest.bestScoreLabel', { defaultValue: 'Best score' }),
        cancel: t('common.cancel', { defaultValue: 'Cancel' }),
        correctAnswer: t('edit.finalTest.correctAnswer', { defaultValue: 'Correct' }),
        deleteAction: t('edit.finalTest.deleteTest', { defaultValue: 'Delete final test' }),
        deletingAction: t('edit.finalTest.deleting', {
          defaultValue: 'Deleting final test...',
        }),
        descriptionEn: t('edit.finalTest.descriptionEn', {
          defaultValue: 'Description (English)',
        }),
        descriptionFi: t('edit.finalTest.descriptionFi', {
          defaultValue: 'Description (Finnish)',
        }),
        explanationEn: t('edit.finalTest.explanationEn', {
          defaultValue: 'Explanation (English)',
        }),
        explanationFi: t('edit.finalTest.explanationFi', {
          defaultValue: 'Explanation (Finnish)',
        }),
        multipleChoice: t('edit.finalTest.multipleChoice', {
          defaultValue: 'Multiple choice',
        }),
        optionEn: t('edit.finalTest.optionEn', { defaultValue: 'Option (English)' }),
        optionFi: t('edit.finalTest.optionFi', { defaultValue: 'Option (Finnish)' }),
        optionsTitle: t('edit.finalTest.optionsTitle', { defaultValue: 'Answer options' }),
        passingScore: t('edit.finalTest.passingScore', {
          defaultValue: 'Passing score (%)',
        }),
        promptEn: t('edit.finalTest.promptEn', { defaultValue: 'Prompt (English)' }),
        promptFi: t('edit.finalTest.promptFi', { defaultValue: 'Prompt (Finnish)' }),
        publishNow: t('edit.finalTest.publishNow', {
          defaultValue: 'Make this final test visible to learners now',
        }),
        questionLabel: t('edit.finalTest.questionLabel', { defaultValue: 'Question' }),
        questionType: t('edit.finalTest.questionType', { defaultValue: 'Question type' }),
        questionsTitle: t('edit.finalTest.questionsTitle', { defaultValue: 'Questions' }),
        saveAction: t('edit.finalTest.saveTest', { defaultValue: 'Save final test' }),
        savingAction: t('edit.finalTest.saving', {
          defaultValue: 'Saving final test...',
        }),
        singleChoice: t('edit.finalTest.singleChoice', { defaultValue: 'Single choice' }),
        titleEn: t('edit.finalTest.titleEn', { defaultValue: 'Final test title (English)' }),
        titleFi: t('edit.finalTest.titleFi', { defaultValue: 'Final test title (Finnish)' }),
        untitledQuestion: t('edit.finalTest.untitledQuestion', {
          defaultValue: 'Untitled question',
        }),
      }}
      error={finalTestError}
      form={form}
      hasExistingAssessment={Boolean(loadedFinalTestStats)}
      isDeleting={isDeletingFinalTest}
      isSaving={isSavingFinalTest}
      message={finalTestMessage}
      stats={loadedFinalTestStats}
      styles={styles}
      onAddOption={onAddOption}
      onAddQuestion={onAddQuestion}
      onDelete={onDeleteFinalTest}
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
