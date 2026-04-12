'use client';

import type { QuizQuestionType } from '@/services/course';
import type { AssessmentFormState } from '../lib/assessmentDraft.types';

export type AssessmentQuestionsCopy = {
  addOption: string;
  addQuestion: string;
  correctAnswer: string;
  deleteAction: string;
  explanationEn: string;
  explanationFi: string;
  multipleChoice: string;
  optionEn: string;
  optionFi: string;
  optionsTitle: string;
  promptEn: string;
  promptFi: string;
  questionLabel: string;
  questionType: string;
  questionsTitle: string;
  singleChoice: string;
  untitledQuestion: string;
};

type AssessmentQuestionsSectionProps = {
  copy: AssessmentQuestionsCopy;
  form: AssessmentFormState;
  styles: Record<string, string>;
  onAddOption: (questionId: string) => void;
  onAddQuestion: () => void;
  onQuestionTypeChange: (questionId: string, nextType: QuizQuestionType) => void;
  onRemoveOption: (questionId: string, optionId: string) => void;
  onRemoveQuestion: (questionId: string) => void;
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
};

export default function AssessmentQuestionsSection({
  copy,
  form,
  styles,
  onAddOption,
  onAddQuestion,
  onQuestionTypeChange,
  onRemoveOption,
  onRemoveQuestion,
  onToggleOptionCorrect,
  onUpdateOptionField,
  onUpdateQuestionField,
}: AssessmentQuestionsSectionProps) {
  return (
    <>
      <div className={styles.questionsHeader}>
        <h4 className={styles.chapterSectionTitle}>{copy.questionsTitle}</h4>
        <button type="button" className={styles.secondaryAction} onClick={onAddQuestion}>
          {copy.addQuestion}
        </button>
      </div>

      <div className={styles.questionList}>
        {form.questions.map((question, questionIndex) => (
          <section key={question.id} className={styles.questionCard}>
            <div className={styles.questionCardHeader}>
              <div>
                <p className={styles.chapterOrderLabel}>
                  {copy.questionLabel} {questionIndex + 1}
                </p>
                <h5 className={styles.subChapterTitle}>
                  {question.promptEn.trim() || copy.untitledQuestion}
                </h5>
              </div>
              <button
                type="button"
                className={styles.inlineDanger}
                disabled={form.questions.length === 1}
                onClick={() => onRemoveQuestion(question.id)}
              >
                {copy.deleteAction}
              </button>
            </div>

            <div className={styles.questionGrid}>
              <label className={styles.fieldGroup}>
                <span className={styles.fieldLabel}>{copy.promptEn}</span>
                <input
                  className={styles.input}
                  value={question.promptEn}
                  onChange={(event) =>
                    onUpdateQuestionField(question.id, 'promptEn', event.target.value)
                  }
                />
              </label>

              <label className={styles.fieldGroup}>
                <span className={styles.fieldLabel}>{copy.promptFi}</span>
                <input
                  className={styles.input}
                  value={question.promptFi}
                  onChange={(event) =>
                    onUpdateQuestionField(question.id, 'promptFi', event.target.value)
                  }
                />
              </label>

              <label className={styles.fieldGroup}>
                <span className={styles.fieldLabel}>{copy.explanationEn}</span>
                <textarea
                  className={styles.textarea}
                  value={question.explanationEn}
                  onChange={(event) =>
                    onUpdateQuestionField(question.id, 'explanationEn', event.target.value)
                  }
                />
              </label>

              <label className={styles.fieldGroup}>
                <span className={styles.fieldLabel}>{copy.explanationFi}</span>
                <textarea
                  className={styles.textarea}
                  value={question.explanationFi}
                  onChange={(event) =>
                    onUpdateQuestionField(question.id, 'explanationFi', event.target.value)
                  }
                />
              </label>
            </div>

            <label className={styles.fieldGroupCompact}>
              <span className={styles.fieldLabel}>{copy.questionType}</span>
              <select
                className={styles.select}
                value={question.type}
                onChange={(event) =>
                  onQuestionTypeChange(question.id, event.target.value as QuizQuestionType)
                }
              >
                <option value="single_choice">{copy.singleChoice}</option>
                <option value="multiple_choice">{copy.multipleChoice}</option>
              </select>
            </label>

            <div className={styles.optionsHeader}>
              <h6 className={styles.fieldLabel}>{copy.optionsTitle}</h6>
              <button
                type="button"
                className={styles.inlineAction}
                onClick={() => onAddOption(question.id)}
              >
                {copy.addOption}
              </button>
            </div>

            <div className={styles.optionsList}>
              {question.options.map((option, optionIndex) => (
                <div key={option.id} className={styles.optionRow}>
                  <label className={styles.correctToggle}>
                    <input
                      type={question.type === 'single_choice' ? 'radio' : 'checkbox'}
                      name={`correct-${question.id}`}
                      checked={option.isCorrect}
                      onChange={(event) =>
                        onToggleOptionCorrect(question.id, option.id, event.target.checked)
                      }
                    />
                    <span>{copy.correctAnswer}</span>
                  </label>
                  <input
                    className={styles.input}
                    placeholder={copy.optionEn}
                    value={option.labelEn}
                    onChange={(event) =>
                      onUpdateOptionField(question.id, option.id, 'labelEn', event.target.value)
                    }
                  />
                  <input
                    className={styles.input}
                    placeholder={copy.optionFi}
                    value={option.labelFi}
                    onChange={(event) =>
                      onUpdateOptionField(question.id, option.id, 'labelFi', event.target.value)
                    }
                  />
                  <button
                    type="button"
                    className={styles.inlineDanger}
                    disabled={question.options.length === 2}
                    onClick={() => onRemoveOption(question.id, option.id)}
                  >
                    {optionIndex + 1}
                  </button>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
