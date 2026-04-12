'use client';

import { useCallback, useState } from 'react';
import type { QuizQuestionType } from '@/services/course';
import { createOptionDraft, createQuestionDraft } from '../lib/assessmentDraft.utils';
import type {
  AssessmentFormState,
  AssessmentQuestionDraft,
} from '../lib/assessmentDraft.types';

export default function useAssessmentDraftForm(initialState: AssessmentFormState) {
  const [form, setForm] = useState<AssessmentFormState>(initialState);

  const replaceForm = useCallback((nextForm: AssessmentFormState) => {
    setForm(nextForm);
  }, []);

  const updateTopLevelField = useCallback(
    <K extends keyof Omit<AssessmentFormState, 'questions'>>(
      field: K,
      value: AssessmentFormState[K],
    ) => {
      setForm((previous) => ({
        ...previous,
        [field]: value,
      }));
    },
    [],
  );

  const updateQuestion = useCallback(
    (
      questionId: string,
      updater: (question: AssessmentQuestionDraft) => AssessmentQuestionDraft,
    ) => {
      setForm((previous) => ({
        ...previous,
        questions: previous.questions.map((question) =>
          question.id === questionId ? updater(question) : question,
        ),
      }));
    },
    [],
  );

  const updateQuestionField = useCallback(
    <K extends keyof Omit<AssessmentQuestionDraft, 'id' | 'options' | 'type'>>(
      questionId: string,
      field: K,
      value: AssessmentQuestionDraft[K],
    ) => {
      updateQuestion(questionId, (question) => ({
        ...question,
        [field]: value,
      }));
    },
    [updateQuestion],
  );

  const handleQuestionTypeChange = useCallback(
    (questionId: string, nextType: QuizQuestionType) => {
      updateQuestion(questionId, (question) => {
        const firstCorrectIndex = question.options.findIndex((option) => option.isCorrect);

        return {
          ...question,
          type: nextType,
          options:
            nextType === 'single_choice'
              ? question.options.map((option, index) => ({
                  ...option,
                  isCorrect: index === (firstCorrectIndex >= 0 ? firstCorrectIndex : 0),
                }))
              : question.options,
        };
      });
    },
    [updateQuestion],
  );

  const toggleOptionCorrect = useCallback(
    (questionId: string, optionId: string, checked: boolean) => {
      updateQuestion(questionId, (question) => ({
        ...question,
        options: question.options.map((option) => {
          if (question.type === 'single_choice') {
            return {
              ...option,
              isCorrect: option.id === optionId ? checked : false,
            };
          }

          return option.id === optionId ? { ...option, isCorrect: checked } : option;
        }),
      }));
    },
    [updateQuestion],
  );

  const updateOptionField = useCallback(
    (questionId: string, optionId: string, field: 'labelEn' | 'labelFi', value: string) => {
      updateQuestion(questionId, (question) => ({
        ...question,
        options: question.options.map((option) =>
          option.id === optionId ? { ...option, [field]: value } : option,
        ),
      }));
    },
    [updateQuestion],
  );

  const addQuestion = useCallback(() => {
    setForm((previous) => ({
      ...previous,
      questions: [...previous.questions, createQuestionDraft()],
    }));
  }, []);

  const removeQuestion = useCallback((questionId: string) => {
    setForm((previous) => ({
      ...previous,
      questions:
        previous.questions.length > 1
          ? previous.questions.filter((question) => question.id !== questionId)
          : previous.questions,
    }));
  }, []);

  const addOption = useCallback((questionId: string) => {
    updateQuestion(questionId, (question) => ({
      ...question,
      options: [...question.options, createOptionDraft()],
    }));
  }, [updateQuestion]);

  const removeOption = useCallback((questionId: string, optionId: string) => {
    updateQuestion(questionId, (question) => ({
      ...question,
      options:
        question.options.length > 2
          ? question.options.filter((option) => option.id !== optionId)
          : question.options,
    }));
  }, [updateQuestion]);

  return {
    addOption,
    addQuestion,
    form,
    handleQuestionTypeChange,
    removeOption,
    removeQuestion,
    replaceForm,
    setForm,
    toggleOptionCorrect,
    updateOptionField,
    updateQuestionField,
    updateTopLevelField,
  };
}
