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
        addOption: t('edit.finalTest.addOption'),
        addQuestion: t('edit.finalTest.addQuestion'),
        attemptsShort: t('edit.finalTest.attemptsShort'),
        bestScoreLabel: t('edit.finalTest.bestScoreLabel'),
        cancel: t('common.cancel'),
        correctAnswer: t('edit.finalTest.correctAnswer'),
        deleteAction: t('edit.finalTest.deleteTest'),
        deleteQuestion: t('edit.finalTest.deleteQuestion'),
        deletingAction: t('edit.finalTest.deleting'),
        descriptionEn: t('edit.finalTest.descriptionEn'),
        descriptionFi: t('edit.finalTest.descriptionFi'),
        explanationEn: t('edit.finalTest.explanationEn'),
        explanationFi: t('edit.finalTest.explanationFi'),
        multipleChoice: t('edit.finalTest.multipleChoice'),
        optionEn: t('edit.finalTest.optionEn'),
        optionFi: t('edit.finalTest.optionFi'),
        optionsTitle: t('edit.finalTest.optionsTitle'),
        passingScore: t('edit.finalTest.passingScore'),
        promptEn: t('edit.finalTest.promptEn'),
        promptFi: t('edit.finalTest.promptFi'),
        publishNow: t('edit.finalTest.publishNow'),
        questionLabel: t('edit.finalTest.questionLabel'),
        questionType: t('edit.finalTest.questionType'),
        questionsTitle: t('edit.finalTest.questionsTitle'),
        saveAction: t('edit.finalTest.saveTest'),
        savingAction: t('edit.finalTest.saving'),
        singleChoice: t('edit.finalTest.singleChoice'),
        titleEn: t('edit.finalTest.titleEn'),
        titleFi: t('edit.finalTest.titleFi'),
        untitledQuestion: t('edit.finalTest.untitledQuestion'),
      }}
      error={finalTestError}
      form={form}
      hasExistingAssessment={Boolean(loadedFinalTestStats)}
      isDeleting={isDeletingFinalTest}
      isSaving={isSavingFinalTest}
      message={finalTestMessage}
      stats={loadedFinalTestStats}
      showInlineStats={false}
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
