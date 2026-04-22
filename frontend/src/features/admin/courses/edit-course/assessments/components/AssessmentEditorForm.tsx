'use client';

import AssessmentQuestionsSection, {
  type AssessmentQuestionsCopy,
} from './AssessmentQuestionsSection';
import type { AssessmentFormState, AssessmentStats } from '../lib/assessmentDraft.types';

type AssessmentEditorCopy = AssessmentQuestionsCopy & {
  attemptsShort: string;
  bestScoreLabel: string;
  cancel: string;
  deleteAction: string;
  deletingAction: string;
  descriptionEn: string;
  descriptionFi: string;
  passingScore: string;
  publishNow: string;
  saveAction: string;
  savingAction: string;
  titleEn: string;
  titleFi: string;
};

type AssessmentEditorFormProps = {
  copy: AssessmentEditorCopy;
  form: AssessmentFormState;
  hasExistingAssessment: boolean;
  isDeleting: boolean;
  isSaving: boolean;
  message: string | null;
  error: string | null;
  stats: AssessmentStats | null;
  showInlineStats?: boolean;
  styles: Record<string, string>;
  onAddOption: (questionId: string) => void;
  onAddQuestion: () => void;
  onDelete: () => void;
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

export default function AssessmentEditorForm({
  copy,
  form,
  hasExistingAssessment,
  isDeleting,
  isSaving,
  message,
  error,
  stats,
  showInlineStats = true,
  styles,
  onAddOption,
  onAddQuestion,
  onDelete,
  onQuestionTypeChange,
  onRemoveOption,
  onRemoveQuestion,
  onReset,
  onSave,
  onToggleOptionCorrect,
  onUpdateOptionField,
  onUpdateQuestionField,
  onUpdateTopLevelField,
}: AssessmentEditorFormProps) {
  return (
    <div className={styles.quizEditorCard}>
      <div className={styles.quizHeaderGrid}>
        <label className={styles.fieldGroup}>
          <span className={styles.fieldLabel}>{copy.titleEn}</span>
          <input
            className={styles.input}
            value={form.titleEn}
            onChange={(event) => onUpdateTopLevelField('titleEn', event.target.value)}
          />
        </label>

        <label className={styles.fieldGroup}>
          <span className={styles.fieldLabel}>{copy.titleFi}</span>
          <input
            className={styles.input}
            value={form.titleFi}
            onChange={(event) => onUpdateTopLevelField('titleFi', event.target.value)}
          />
        </label>

        <label className={styles.fieldGroup}>
          <span className={styles.fieldLabel}>{copy.descriptionEn}</span>
          <textarea
            className={styles.textarea}
            value={form.descriptionEn}
            onChange={(event) => onUpdateTopLevelField('descriptionEn', event.target.value)}
          />
        </label>

        <label className={styles.fieldGroup}>
          <span className={styles.fieldLabel}>{copy.descriptionFi}</span>
          <textarea
            className={styles.textarea}
            value={form.descriptionFi}
            onChange={(event) => onUpdateTopLevelField('descriptionFi', event.target.value)}
          />
        </label>
      </div>

      <div className={styles.quizSettingsRow}>
        <label className={styles.fieldGroupCompact}>
          <span className={styles.fieldLabel}>{copy.passingScore}</span>
          <input
            type="number"
            min={0}
            max={100}
            className={styles.input}
            value={form.passingScore}
            onChange={(event) => onUpdateTopLevelField('passingScore', event.target.value)}
          />
        </label>

        <label className={styles.checkboxRow}>
          <input
            type="checkbox"
            checked={form.isPublished}
            onChange={(event) => onUpdateTopLevelField('isPublished', event.target.checked)}
          />
          <span>{copy.publishNow}</span>
        </label>

        {stats && showInlineStats ? (
          <div className={styles.quizStatsRow}>
            <span>
              {stats.attemptCount} {copy.attemptsShort}
            </span>
            <span>
              {copy.bestScoreLabel}: {stats.bestScore ?? '-'}
            </span>
          </div>
        ) : null}
      </div>

      <AssessmentQuestionsSection
        copy={copy}
        form={form}
        styles={styles}
        onAddOption={onAddOption}
        onAddQuestion={onAddQuestion}
        onQuestionTypeChange={onQuestionTypeChange}
        onRemoveOption={onRemoveOption}
        onRemoveQuestion={onRemoveQuestion}
        onToggleOptionCorrect={onToggleOptionCorrect}
        onUpdateOptionField={onUpdateOptionField}
        onUpdateQuestionField={onUpdateQuestionField}
      />

      {message ? <p className={styles.successMessage}>{message}</p> : null}
      {error ? <p className={styles.errorMessage}>{error}</p> : null}

      <div className={styles.actions}>
        <button type="button" className={styles.secondaryAction} onClick={onReset}>
          {copy.cancel}
        </button>
        {hasExistingAssessment ? (
          <button
            type="button"
            className={styles.inlineDanger}
            disabled={isDeleting}
            onClick={onDelete}
          >
            {isDeleting ? copy.deletingAction : copy.deleteAction}
          </button>
        ) : null}
        <button type="button" className={styles.primaryAction} disabled={isSaving} onClick={onSave}>
          {isSaving ? copy.savingAction : copy.saveAction}
        </button>
      </div>
    </div>
  );
}
