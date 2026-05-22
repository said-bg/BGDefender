'use client';

import { CSSProperties, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import certificateSignerService from '@/services/certificate-signers';
import {
  DEFAULT_LOCALE,
  getLocaleFromPathname,
  localizePathname,
} from '@/lib/locale';
import { getApiErrorMessage } from '@/utils/apiError';
import { confirmWithModal } from '@/utils/modalFeedback';
import {
  UserRole,
  type CertificateSignerAssignableCourse,
  type CertificateSignerAssignedCourse,
  type CertificateSignerRecord,
  type CertificateSignerRole,
} from '@/types/api';
import SignaturePad from './components/SignaturePad';
import styles from './CertificateSignersPage.module.css';

type SignerFormState = {
  id: string | null;
  fullName: string;
  role: CertificateSignerRole;
  title: string;
  signatureData: string;
  isActive: boolean;
};

const INITIAL_FORM: SignerFormState = {
  id: null,
  fullName: '',
  role: 'director',
  title: 'Director',
  signatureData: '',
  isActive: true,
};

const EMPTY_ASSIGNMENT_COURSES: CertificateSignerAssignableCourse[] = [];

export default function CertificateSignersPage() {
  return (
    <ProtectedRoute requiredRole={[UserRole.ADMIN]}>
      <CertificateSignersPageContent />
    </ProtectedRoute>
  );
}

function CertificateSignersPageContent() {
  const { t } = useTranslation('admin');
  const pathname = usePathname();
  const activeLocale = getLocaleFromPathname(pathname || '/') ?? DEFAULT_LOCALE;
  const formPanelRef = useRef<HTMLDivElement | null>(null);
  const [matchedPanelHeight, setMatchedPanelHeight] = useState<number | null>(null);
  const [signers, setSigners] = useState<CertificateSignerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [assignmentSignerId, setAssignmentSignerId] = useState<string | null>(null);
  const [assignmentCourses, setAssignmentCourses] = useState<
    CertificateSignerAssignableCourse[]
  >(EMPTY_ASSIGNMENT_COURSES);
  const [assignmentSelection, setAssignmentSelection] = useState<string[]>([]);
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  const [assignmentSaving, setAssignmentSaving] = useState(false);
  const [assignmentError, setAssignmentError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState<SignerFormState>(INITIAL_FORM);

  useEffect(() => {
    const loadSigners = async () => {
      try {
        setLoading(true);
        setError(null);
        setSigners(await certificateSignerService.getAdminSigners());
      } catch (loadError) {
        setError(getApiErrorMessage(loadError, t('signers.failedToLoad')));
      } finally {
        setLoading(false);
      }
    };

    void loadSigners();
  }, [t]);

  const getCourseTitle = (course: {
    titleEn: string;
    titleFi: string;
  }) => {
    if (activeLocale === 'fi') {
      return course.titleFi || course.titleEn;
    }

    return course.titleEn || course.titleFi;
  };

  const applyAssignmentUpdate = (
    signerId: string,
    selectedCourseIds: string[],
    allCourses: CertificateSignerAssignableCourse[],
  ) => {
    const selectedCourseIdsSet = new Set(selectedCourseIds);
    const selectedCourses: CertificateSignerAssignedCourse[] = allCourses
      .filter((course) => selectedCourseIdsSet.has(course.id))
      .map(({ programDirectorId: _programDirectorId, ...course }) => course);

    setSigners((previous) =>
      previous.map((signer) => {
        if (signer.role !== 'program_director') {
          return signer;
        }

        if (signer.id === signerId) {
          return {
            ...signer,
            assignedCourses: selectedCourses,
          };
        }

        return {
          ...signer,
          assignedCourses: signer.assignedCourses.filter(
            (course) => !selectedCourseIdsSet.has(course.id),
          ),
        };
      }),
    );
  };

  useEffect(() => {
    const formPanel = formPanelRef.current;

    if (!formPanel || typeof window === 'undefined') {
      return undefined;
    }

    const mobileQuery = window.matchMedia('(max-width: 980px)');

    const updatePanelHeight = () => {
      if (mobileQuery.matches) {
        setMatchedPanelHeight(null);
        return;
      }

      setMatchedPanelHeight(formPanel.offsetHeight);
    };

    updatePanelHeight();

    const resizeObserver = new ResizeObserver(() => {
      updatePanelHeight();
    });

    resizeObserver.observe(formPanel);
    window.addEventListener('resize', updatePanelHeight);

    const handleQueryChange = () => updatePanelHeight();
    mobileQuery.addEventListener('change', handleQueryChange);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updatePanelHeight);
      mobileQuery.removeEventListener('change', handleQueryChange);
    };
  }, []);

  const summary = useMemo(() => {
    const activeDirector = signers.find(
      (signer) => signer.role === 'director' && signer.isActive,
    );
    const activeProgramDirectors = signers.filter(
      (signer) => signer.role === 'program_director' && signer.isActive,
    ).length;

    return {
      activeDirector,
      activeProgramDirectors,
      total: signers.length,
    };
  }, [signers]);

  const resetForm = (clearMessage = false) => {
    setForm(INITIAL_FORM);
    setError(null);
    if (clearMessage) {
      setMessage(null);
    }
  };

  const startEditing = (signer: CertificateSignerRecord) => {
    setForm({
      id: signer.id,
      fullName: signer.fullName,
      role: signer.role,
      title: signer.title,
      signatureData: signer.signatureData,
      isActive: signer.isActive,
    });
    setError(null);
    setMessage(null);
  };

  const handleRoleChange = (role: CertificateSignerRole) => {
    setForm((previous) => ({
      ...previous,
      role,
      title:
        previous.title === 'Director' || previous.title === 'Program Director'
          ? role === 'director'
            ? 'Director'
            : 'Program Director'
          : previous.title,
    }));
  };

  const handleSubmit = async () => {
    if (!form.fullName.trim()) {
      setError(t('signers.validationName'));
      return;
    }

    if (!form.title.trim()) {
      setError(t('signers.validationTitle'));
      return;
    }

    if (!form.signatureData) {
      setError(t('signers.validationSignature'));
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setMessage(null);

      const payload = {
        fullName: form.fullName.trim(),
        role: form.role,
        title: form.title.trim(),
        signatureData: form.signatureData,
        isActive: form.isActive,
      };

      const savedSigner = form.id
        ? await certificateSignerService.updateAdminSigner(form.id, payload)
        : await certificateSignerService.createAdminSigner(payload);

      const nextSigners = form.id
        ? signers.map((signer) => (signer.id === savedSigner.id ? savedSigner : signer))
        : [savedSigner, ...signers];

      setSigners(
        savedSigner.role === 'director' && savedSigner.isActive
          ? nextSigners.map((signer) =>
              signer.id !== savedSigner.id && signer.role === 'director'
                ? { ...signer, isActive: false }
                : signer,
            )
          : nextSigners,
      );
      setForm(INITIAL_FORM);
      setMessage(form.id ? t('signers.updated') : t('signers.created'));
    } catch (submitError) {
      setError(getApiErrorMessage(submitError, t('signers.saveFailed')));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (signer: CertificateSignerRecord) => {
    const confirmed = await confirmWithModal({
      title: t('signers.delete'),
      message: t('signers.deleteConfirm'),
      confirmLabel: t('signers.delete'),
      type: 'warning',
      confirmVariant: 'danger',
    });

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(signer.id);
      setError(null);
      setMessage(null);
      await certificateSignerService.deleteAdminSigner(signer.id);
      setSigners((previous) => previous.filter((entry) => entry.id !== signer.id));

      if (form.id === signer.id) {
        resetForm();
      }

      if (assignmentSignerId === signer.id) {
        setAssignmentSignerId(null);
        setAssignmentCourses(EMPTY_ASSIGNMENT_COURSES);
        setAssignmentSelection([]);
        setAssignmentError(null);
      }

      setMessage(t('signers.deleted'));
    } catch (deleteError) {
      setError(getApiErrorMessage(deleteError, t('signers.deleteFailed')));
    } finally {
      setDeletingId(null);
    }
  };

  const handleOpenAssignments = async (signer: CertificateSignerRecord) => {
    if (signer.role !== 'program_director') {
      return;
    }

    if (assignmentSignerId === signer.id) {
      setAssignmentSignerId(null);
      setAssignmentCourses(EMPTY_ASSIGNMENT_COURSES);
      setAssignmentSelection([]);
      setAssignmentError(null);
      return;
    }

    try {
      setAssignmentLoading(true);
      setAssignmentSaving(false);
      setAssignmentError(null);
      setAssignmentSignerId(signer.id);

      const response = await certificateSignerService.getAdminSignerCourseAssignments(
        signer.id,
      );

      setAssignmentCourses(response.courses);
      setAssignmentSelection(response.courseIds);
    } catch (loadError) {
      setAssignmentSignerId(null);
      setAssignmentCourses(EMPTY_ASSIGNMENT_COURSES);
      setAssignmentSelection([]);
      setAssignmentError(
        getApiErrorMessage(loadError, t('signers.assignmentLoadFailed')),
      );
    } finally {
      setAssignmentLoading(false);
    }
  };

  const toggleAssignedCourse = (courseId: string) => {
    setAssignmentSelection((previous) =>
      previous.includes(courseId)
        ? previous.filter((id) => id !== courseId)
        : [...previous, courseId],
    );
  };

  const handleSaveAssignments = async (signer: CertificateSignerRecord) => {
    try {
      setAssignmentSaving(true);
      setAssignmentError(null);

      const response =
        await certificateSignerService.updateAdminSignerCourseAssignments(
          signer.id,
          assignmentSelection,
        );

      setAssignmentCourses(response.courses);
      setAssignmentSelection(response.courseIds);
      applyAssignmentUpdate(signer.id, response.courseIds, response.courses);
      setAssignmentSignerId(null);
      setAssignmentCourses(EMPTY_ASSIGNMENT_COURSES);
      setAssignmentSelection([]);
      setAssignmentError(null);
      setMessage(t('signers.assignmentSaved'));
    } catch (saveError) {
      setAssignmentError(
        getApiErrorMessage(saveError, t('signers.assignmentSaveFailed')),
      );
    } finally {
      setAssignmentSaving(false);
    }
  };

  const listPanelStyle =
    matchedPanelHeight !== null
      ? ({ '--signers-panel-height': `${matchedPanelHeight}px` } as CSSProperties)
      : undefined;

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <Link
            href={localizePathname('/admin', activeLocale)}
            className={styles.backLink}
          >
            {t('backToOverview')}
          </Link>
          <p className={styles.eyebrow}>{t('signers.eyebrow')}</p>
          <h1 className={styles.title}>{t('signers.title')}</h1>
          <p className={styles.subtitle}>{t('signers.subtitle')}</p>
        </div>
      </section>

      <section className={styles.summary}>
        <article className={styles.summaryCard}>
          <span className={styles.summaryLabel}>{t('signers.summaryTotal')}</span>
          <strong className={styles.summaryValue}>{summary.total}</strong>
        </article>
        <article className={styles.summaryCard}>
          <span className={styles.summaryLabel}>{t('signers.summaryDirector')}</span>
          <strong className={styles.summaryValue}>
            {summary.activeDirector?.fullName ?? '-'}
          </strong>
        </article>
        <article className={styles.summaryCard}>
          <span className={styles.summaryLabel}>{t('signers.summaryProgramDirectors')}</span>
          <strong className={styles.summaryValue}>{summary.activeProgramDirectors}</strong>
        </article>
      </section>

      <section className={styles.layout}>
        <div ref={formPanelRef} className={styles.formPanel}>
          <section className={styles.formCard}>
            <div className={styles.cardHeader}>
              <h2 className={styles.sectionTitle}>
                {form.id ? t('signers.editTitle') : t('signers.createTitle')}
              </h2>
              <p className={styles.sectionDescription}>{t('signers.formDescription')}</p>
            </div>

            <div className={styles.messages}>
              {message ? <p className={styles.successMessage}>{message}</p> : null}
              {error ? <p className={styles.errorMessage}>{error}</p> : null}
            </div>

            <div className={styles.form}>
              <div className={styles.field}>
                <label htmlFor="certificate-signer-name">{t('signers.name')}</label>
                <input
                  id="certificate-signer-name"
                  className={styles.input}
                  value={form.fullName}
                  onChange={(event) =>
                    setForm((previous) => ({ ...previous, fullName: event.target.value }))
                  }
                  placeholder={t('signers.namePlaceholder')}
                />
              </div>

              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label htmlFor="certificate-signer-role">{t('signers.role')}</label>
                  <select
                    id="certificate-signer-role"
                    className={styles.select}
                    value={form.role}
                    onChange={(event) =>
                      handleRoleChange(event.target.value as CertificateSignerRole)
                    }
                  >
                    <option value="director">{t('signers.roles.director')}</option>
                    <option value="program_director">
                      {t('signers.roles.programDirector')}
                    </option>
                  </select>
                </div>

                <div className={styles.field}>
                  <label htmlFor="certificate-signer-title">{t('signers.titleField')}</label>
                  <input
                    id="certificate-signer-title"
                    className={styles.input}
                    value={form.title}
                    onChange={(event) =>
                      setForm((previous) => ({ ...previous, title: event.target.value }))
                    }
                    placeholder={t('signers.titlePlaceholder')}
                  />
                </div>
              </div>

              <div className={styles.field}>
                <span className={styles.label}>{t('signers.signature')}</span>
                <p className={styles.helperText}>{t('signers.signatureHint')}</p>
                <SignaturePad
                  clearLabel={t('signers.clearSignature')}
                  value={form.signatureData}
                  onChange={(signatureData) =>
                    setForm((previous) => ({ ...previous, signatureData }))
                  }
                />
              </div>

              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(event) =>
                    setForm((previous) => ({ ...previous, isActive: event.target.checked }))
                  }
                />
                <span>{t('signers.activeLabel')}</span>
              </label>

              {form.role === 'director' ? (
                <p className={styles.helperText}>{t('signers.directorUniquenessHint')}</p>
              ) : null}

              {form.role === 'program_director' ? (
                <p className={styles.helperText}>{t('signers.courseAssignmentHint')}</p>
              ) : null}

              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.primaryAction}
                  onClick={() => void handleSubmit()}
                  disabled={saving}
                >
                  {saving
                    ? t('signers.saving')
                    : form.id
                      ? t('signers.save')
                      : t('signers.create')}
                </button>
                {form.id ? (
                  <button
                    type="button"
                    className={styles.secondaryAction}
                    onClick={() => resetForm(true)}
                  >
                    {t('signers.cancelEdit')}
                  </button>
                ) : null}
              </div>
            </div>
          </section>
        </div>

        <div className={styles.listPanel} style={listPanelStyle}>
          <section className={styles.listCard}>
            <div className={styles.cardHeader}>
              <h2 className={styles.sectionTitle}>{t('signers.listTitle')}</h2>
              <p className={styles.sectionDescription}>{t('signers.listDescription')}</p>
            </div>

            {loading ? (
              <p className={styles.emptyState}>{t('loading')}</p>
            ) : signers.length === 0 ? (
              <p className={styles.emptyState}>{t('signers.empty')}</p>
            ) : (
              <div className={styles.list}>
                {signers.map((signer) => (
                  <article key={signer.id} className={styles.signerCard}>
                    <div className={styles.signerTop}>
                      <div>
                        <h3 className={styles.signerName}>{signer.fullName}</h3>
                        <p className={styles.signerRole}>{signer.title}</p>
                      </div>
                      <div className={styles.badgeRow}>
                        <span className={`${styles.badge} ${styles.badgeRole}`}>
                          {signer.role === 'director'
                            ? t('signers.roles.director')
                            : t('signers.roles.programDirector')}
                        </span>
                        <span
                          className={`${styles.badge} ${
                            signer.isActive ? styles.badgeActive : styles.badgeInactive
                          }`}
                        >
                          {signer.isActive ? t('signers.active') : t('signers.inactive')}
                        </span>
                      </div>
                    </div>

                    <img
                      src={signer.signatureData}
                      alt=""
                      className={styles.signerSignature}
                    />

                    <p className={styles.signerMeta}>
                      {signer.role === 'program_director'
                        ? t('signers.courseSpecificLabel')
                        : t('signers.globalDirectorLabel')}
                    </p>

                    {signer.role === 'program_director' ? (
                      <div className={styles.assignedCoursesSection}>
                        <div className={styles.assignedCoursesHeader}>
                          <span className={styles.assignedCoursesTitle}>
                            {t('signers.assignedCoursesTitle')}
                          </span>
                          <span className={styles.assignedCoursesCount}>
                            {t('signers.assignedCoursesCount', {
                              count: signer.assignedCourses.length,
                            })}
                          </span>
                        </div>

                        {signer.assignedCourses.length > 0 ? (
                          <div className={styles.assignedCoursesList}>
                            {signer.assignedCourses.map((course) => (
                              <Link
                                key={course.id}
                                href={localizePathname(
                                  `/admin/courses/${course.id}/edit`,
                                  activeLocale,
                                )}
                                className={styles.courseChip}
                              >
                                <span>{getCourseTitle(course)}</span>
                                <span className={styles.courseChipMeta}>
                                  {t(`status.${course.status}`)}
                                </span>
                              </Link>
                            ))}
                          </div>
                        ) : (
                          <p className={styles.signerMeta}>
                            {t('signers.noAssignedCourses')}
                          </p>
                        )}
                      </div>
                    ) : null}

                    <div className={styles.actions}>
                      {signer.role === 'program_director' ? (
                        <button
                          type="button"
                          className={styles.secondaryAction}
                          onClick={() => void handleOpenAssignments(signer)}
                          disabled={assignmentSaving && assignmentSignerId === signer.id}
                        >
                          {assignmentSignerId === signer.id
                            ? t('signers.closeAssignments')
                            : t('signers.assignCourses')}
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className={styles.secondaryAction}
                        onClick={() => startEditing(signer)}
                      >
                        {t('signers.edit')}
                      </button>
                      <button
                        type="button"
                        className={styles.dangerAction}
                        onClick={() => void handleDelete(signer)}
                        disabled={deletingId === signer.id}
                      >
                        {deletingId === signer.id
                          ? t('signers.deleting')
                          : t('signers.delete')}
                      </button>
                    </div>

                    {signer.role === 'program_director' &&
                    assignmentSignerId === signer.id ? (
                      <div className={styles.assignmentPanel}>
                        <div className={styles.assignmentPanelHeader}>
                          <div>
                            <h4 className={styles.assignmentPanelTitle}>
                              {t('signers.assignmentTitle')}
                            </h4>
                            <p className={styles.assignmentPanelDescription}>
                              {t('signers.assignmentDescription', {
                                name: signer.fullName,
                              })}
                            </p>
                          </div>
                        </div>

                        {assignmentError ? (
                          <p className={styles.errorMessage}>{assignmentError}</p>
                        ) : null}

                        {assignmentLoading ? (
                          <p className={styles.signerMeta}>{t('loading')}</p>
                        ) : assignmentCourses.length > 0 ? (
                          <div className={styles.assignmentCourseList}>
                            {assignmentCourses.map((course) => {
                              const isSelected = assignmentSelection.includes(course.id);

                              return (
                                <label
                                  key={course.id}
                                  className={styles.assignmentCourseRow}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleAssignedCourse(course.id)}
                                  />
                                  <div className={styles.assignmentCourseCopy}>
                                    <span className={styles.assignmentCourseName}>
                                      {getCourseTitle(course)}
                                    </span>
                                    <span className={styles.assignmentCourseMeta}>
                                      {t(`levels.${course.level}`)} -{' '}
                                      {t(`status.${course.status}`)}
                                    </span>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        ) : (
                          <p className={styles.signerMeta}>
                            {t('signers.assignmentEmpty')}
                          </p>
                        )}

                        <div className={styles.actions}>
                          <button
                            type="button"
                            className={styles.primaryAction}
                            onClick={() => void handleSaveAssignments(signer)}
                            disabled={assignmentLoading || assignmentSaving}
                          >
                            {assignmentSaving
                              ? t('signers.assignmentSaving')
                              : t('signers.saveAssignments')}
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </section>
    </div>
  );
}
