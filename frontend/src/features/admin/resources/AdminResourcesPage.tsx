'use client';

import { CSSProperties, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { ResourceSource, ResourceType, UserRole } from '@/types/api';
import { getAdminResourceUserLabel } from './adminResources.utils';
import styles from './AdminResourcesPage.module.css';
import useAdminResources from './useAdminResources';

export default function AdminResourcesPage() {
  return (
    <ProtectedRoute requiredRole={[UserRole.ADMIN]}>
      <AdminResourcesPageContent />
    </ProtectedRoute>
  );
}

function AdminResourcesPageContent() {
  const formCardRef = useRef<HTMLElement | null>(null);
  const [matchedPanelHeight, setMatchedPanelHeight] = useState<number | null>(null);
  const {
    deletingId,
    error,
    form,
    handleDelete,
    handleOpenFile,
    handleSubmit,
    handleUpload,
    isUploading,
    loading,
    message,
    openingId,
    resources,
    search,
    setSearch,
    setTypeFilter,
    submitting,
    summary,
    t,
    typeFilter,
    updateForm,
    uploadError,
    users,
  } = useAdminResources();

  useEffect(() => {
    const formCard = formCardRef.current;

    if (!formCard || typeof window === 'undefined') {
      return undefined;
    }

    const mobileQuery = window.matchMedia('(max-width: 980px)');

    const updatePanelHeight = () => {
      if (mobileQuery.matches) {
        setMatchedPanelHeight(null);
        return;
      }

      setMatchedPanelHeight(formCard.offsetHeight);
    };

    updatePanelHeight();

    const resizeObserver = new ResizeObserver(() => {
      updatePanelHeight();
    });

    resizeObserver.observe(formCard);
    window.addEventListener('resize', updatePanelHeight);

    const handleQueryChange = () => updatePanelHeight();
    mobileQuery.addEventListener('change', handleQueryChange);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updatePanelHeight);
      mobileQuery.removeEventListener('change', handleQueryChange);
    };
  }, []);

  const listCardStyle =
    matchedPanelHeight !== null
      ? ({ '--resource-panel-height': `${matchedPanelHeight}px` } as CSSProperties)
      : undefined;

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <Link href="/admin" className={styles.backLink}>
            {t('backToOverview')}
          </Link>
          <p className={styles.eyebrow}>
            {t('resources.eyebrow')}
          </p>
          <h1 className={styles.title}>
            {t('resources.title')}
          </h1>
          <p className={styles.subtitle}>
            {t('resources.subtitle')}
          </p>
        </div>
      </section>

      <section className={styles.summary}>
        <article className={styles.summaryCard}>
          <span className={styles.summaryLabel}>
            {t('resources.summaryTotal')}
          </span>
          <strong className={styles.summaryValue}>{summary.total}</strong>
        </article>
        <article className={styles.summaryCard}>
          <span className={styles.summaryLabel}>
            {t('resources.summaryFiles')}
          </span>
          <strong className={styles.summaryValue}>{summary.files}</strong>
        </article>
        <article className={styles.summaryCard}>
          <span className={styles.summaryLabel}>
            {t('resources.summaryLinks')}
          </span>
          <strong className={styles.summaryValue}>{summary.links}</strong>
        </article>
        <article className={styles.summaryCard}>
          <span className={styles.summaryLabel}>
            {t('resources.summaryAdminSent')}
          </span>
          <strong className={styles.summaryValue}>{summary.adminSent}</strong>
        </article>
      </section>

      <section className={styles.layout}>
        <section ref={formCardRef} className={styles.formCard}>
          <div className={styles.cardHeader}>
            <h2 className={styles.sectionTitle}>
              {t('resources.formTitle')}
            </h2>
            <p className={styles.sectionDescription}>
              {t('resources.formDescription')}
            </p>
          </div>

          <div className={styles.formGrid}>
            {message ? <p className={styles.successMessage}>{message}</p> : null}
            {error ? <p className={styles.errorMessage}>{error}</p> : null}
            {uploadError ? <p className={styles.errorMessage}>{uploadError}</p> : null}

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="resource-user">
                {t('resources.targetUser')}
              </label>
              <select
                id="resource-user"
                className={styles.select}
                value={form.assignedUserId}
                onChange={(event) => updateForm('assignedUserId', event.target.value)}
              >
                <option value="">
                  {t('resources.targetUserPlaceholder')}
                </option>
                {users.map((user) => (
                  <option key={user.id} value={String(user.id)}>
                    {getAdminResourceUserLabel(user)} - {user.email}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.fieldGroup}>
              <span className={styles.fieldLabel}>
                {t('resources.type')}
              </span>
              <div className={styles.modeGroup}>
                <button
                  type="button"
                  className={`${styles.modeButton} ${
                    form.type === ResourceType.FILE ? styles.modeButtonActive : ''
                  }`}
                  onClick={() => updateForm('type', ResourceType.FILE)}
                >
                  {t('resources.typeFile')}
                </button>
                <button
                  type="button"
                  className={`${styles.modeButton} ${
                    form.type === ResourceType.LINK ? styles.modeButtonActive : ''
                  }`}
                  onClick={() => updateForm('type', ResourceType.LINK)}
                >
                  {t('resources.typeLink')}
                </button>
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="resource-title">
                {t('resources.resourceTitle')}
              </label>
              <input
                id="resource-title"
                className={styles.input}
                value={form.title}
                onChange={(event) => updateForm('title', event.target.value)}
                placeholder={t('resources.resourceTitlePlaceholder')}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="resource-description">
                {t('resources.resourceDescription')}
              </label>
              <textarea
                id="resource-description"
                className={styles.textarea}
                value={form.description}
                onChange={(event) => updateForm('description', event.target.value)}
                placeholder={t('resources.resourceDescriptionPlaceholder')}
              />
            </div>

            {form.type === ResourceType.FILE ? (
              <div className={styles.fieldGroup}>
                <span className={styles.fieldLabel}>
                  {t('resources.uploadLabel')}
                </span>
                <div className={styles.uploadBox}>
                  <label className={styles.uploadLabel}>
                    {isUploading
                      ? t('resources.uploading')
                      : t('resources.uploadCta')}
                    <input
                      className={styles.uploadInput}
                      type="file"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain,text/csv"
                      onChange={(event) => void handleUpload(event.target.files?.[0])}
                    />
                  </label>
                  <p className={styles.uploadMeta}>
                    {form.filename
                      ? t('resources.uploadedFile', {
                          name: form.filename,
                        })
                      : t('resources.uploadHelper')}
                  </p>
                </div>
              </div>
            ) : (
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel} htmlFor="resource-link">
                  {t('resources.linkLabel')}
                </label>
                <input
                  id="resource-link"
                  className={styles.input}
                  value={form.linkUrl}
                  onChange={(event) => updateForm('linkUrl', event.target.value)}
                  placeholder={t('resources.linkPlaceholder')}
                />
              </div>
            )}

            <div className={styles.actionsRow}>
              <button
                type="button"
                className={styles.primaryAction}
                onClick={() => void handleSubmit()}
                disabled={submitting || isUploading}
              >
                {submitting
                  ? t('resources.sending')
                  : t('resources.submit')}
              </button>
            </div>
          </div>
        </section>

        <section className={styles.listCard} style={listCardStyle}>
          <div className={styles.cardHeader}>
            <h2 className={styles.sectionTitle}>
              {t('resources.listTitle')}
            </h2>
            <p className={styles.sectionDescription}>
              {t('resources.listDescription')}
            </p>
          </div>

          <div className={styles.filters}>
            <input
              className={styles.searchInput}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t('resources.searchPlaceholder')}
            />
            <select
              className={styles.filterSelect}
              value={typeFilter}
              onChange={(event) =>
                setTypeFilter(event.target.value as 'all' | ResourceType)
              }
            >
              <option value="all">
                {t('resources.filterAllTypes')}
              </option>
              <option value={ResourceType.FILE}>
                {t('resources.typeFile')}
              </option>
              <option value={ResourceType.LINK}>
                {t('resources.typeLink')}
              </option>
            </select>
          </div>

          {loading ? (
            <p className={styles.helperMessage}>
              {t('loading')}
            </p>
          ) : resources.length === 0 ? (
            <section className={styles.emptyState}>
              <h3 className={styles.emptyTitle}>
                {t('resources.emptyTitle')}
              </h3>
              <p className={styles.emptyDescription}>
                {t('resources.emptyDescription')}
              </p>
            </section>
          ) : (
            <div className={styles.resourceList}>
              {resources.map((resource) => (
                <article key={resource.id} className={styles.resourceCard}>
                  <div className={styles.resourceTop}>
                    <div className={styles.resourceCopy}>
                      <h3 className={styles.resourceTitle}>{resource.title}</h3>
                      {resource.description ? (
                        <p className={styles.resourceDescription}>{resource.description}</p>
                      ) : null}
                    </div>

                    <div className={styles.badgeRow}>
                      <span
                        className={`${styles.badge} ${
                          resource.type === ResourceType.FILE
                            ? styles.badgeFile
                            : styles.badgeLink
                        }`}
                      >
                        {resource.type === ResourceType.FILE
                          ? t('resources.typeFile')
                          : t('resources.typeLink')}
                      </span>
                      <span
                        className={`${styles.badge} ${
                          resource.source === ResourceSource.ADMIN
                            ? styles.badgeAdmin
                            : styles.badgeUser
                        }`}
                      >
                        {resource.source === ResourceSource.ADMIN
                          ? t('resources.sourceAdmin')
                          : t('resources.sourceUser')}
                      </span>
                    </div>
                  </div>

                  <div className={styles.resourceMeta}>
                    <span>
                      {t('resources.targetUserLabel')}:{' '}
                      {getAdminResourceUserLabel(resource.assignedUser)}
                    </span>
                    <span>
                      {t('resources.createdLabel')}:{' '}
                      {new Date(resource.createdAt).toLocaleDateString()}
                    </span>
                    {resource.filename ? <span>{resource.filename}</span> : null}
                  </div>

                  <div className={styles.resourceActions}>
                    {resource.type === ResourceType.FILE && resource.fileUrl ? (
                      <button
                        type="button"
                        className={styles.inlineLink}
                        onClick={() => void handleOpenFile(resource)}
                        disabled={openingId === resource.id}
                      >
                        {t('resources.openFile')}
                      </button>
                    ) : null}
                    {resource.type === ResourceType.LINK && resource.linkUrl ? (
                      <a
                        href={resource.linkUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={styles.inlineLink}
                      >
                        {t('resources.openLink')}
                      </a>
                    ) : null}
                    <button
                      type="button"
                      className={styles.inlineDanger}
                      onClick={() => void handleDelete(resource)}
                      disabled={deletingId === resource.id}
                    >
                      {deletingId === resource.id
                        ? t('resources.deleting')
                        : t('resources.delete')}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </div>
  );
}
