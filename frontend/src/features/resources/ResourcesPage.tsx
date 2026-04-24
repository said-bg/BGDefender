'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { ResourceSource, ResourceType, UserRole } from '@/types/api';
import useResourcesPage from './hooks/useResourcesPage';
import styles from './ResourcesPage.module.css';

function ResourcesPageContent() {
  const {
    deletingId,
    error,
    filteredResources,
    form,
    handleDelete,
    handleOpenFile,
    handleSubmit,
    handleUpload,
    isUploading,
    loading,
    message,
    openingId,
    search,
    setSearch,
    setTypeFilter,
    submitting,
    summary,
    t,
    typeFilter,
    updateForm,
    uploadError,
  } = useResourcesPage();

  return (
    <div className={styles.page}>
      <section className={styles.content}>
        <header className={styles.pageHeader}>
          <div>
            <p className={styles.eyebrow}>
              {t('eyebrow')}
            </p>
            <h1 className={styles.title}>
              {t('title')}
            </h1>
            <p className={styles.subtitle}>
              {t('subtitle')}
            </p>
          </div>
        </header>

        <section className={styles.summary}>
          <article className={styles.summaryCard}>
            <span className={styles.summaryLabel}>
              {t('summaryTotal')}
            </span>
            <strong className={styles.summaryValue}>{summary.total}</strong>
          </article>
          <article className={styles.summaryCard}>
            <span className={styles.summaryLabel}>
              {t('summaryFiles')}
            </span>
            <strong className={styles.summaryValue}>{summary.files}</strong>
          </article>
          <article className={styles.summaryCard}>
            <span className={styles.summaryLabel}>
              {t('summaryLinks')}
            </span>
            <strong className={styles.summaryValue}>{summary.links}</strong>
          </article>
          <article className={styles.summaryCard}>
            <span className={styles.summaryLabel}>
              {t('summaryAdminSent')}
            </span>
            <strong className={styles.summaryValue}>{summary.adminShared}</strong>
          </article>
          <article className={styles.summaryCard}>
            <span className={styles.summaryLabel}>
              {t('summaryMine')}
            </span>
            <strong className={styles.summaryValue}>{summary.mine}</strong>
          </article>
        </section>

        <section className={styles.layout}>
          <section className={styles.formCard}>
            <div className={styles.cardHeader}>
              <h2 className={styles.sectionTitle}>
                {t('formTitle')}
              </h2>
              <p className={styles.sectionDescription}>
                {t('formDescription')}
              </p>
            </div>

            <div className={styles.formGrid}>
              {message ? <p className={styles.successMessage}>{message}</p> : null}
              {error ? <p className={styles.errorMessage}>{error}</p> : null}
              {uploadError ? <p className={styles.errorMessage}>{uploadError}</p> : null}

              <div className={styles.fieldGroup}>
                <span className={styles.fieldLabel}>
                  {t('type')}
                </span>
                <div className={styles.modeGroup}>
                  <button
                    type="button"
                    className={`${styles.modeButton} ${
                      form.type === ResourceType.FILE ? styles.modeButtonActive : ''
                    }`}
                    onClick={() => updateForm('type', ResourceType.FILE)}
                  >
                    {t('typeFile')}
                  </button>
                  <button
                    type="button"
                    className={`${styles.modeButton} ${
                      form.type === ResourceType.LINK ? styles.modeButtonActive : ''
                    }`}
                    onClick={() => updateForm('type', ResourceType.LINK)}
                  >
                    {t('typeLink')}
                  </button>
                </div>
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel} htmlFor="my-resource-title">
                  {t('resourceTitle')}
                </label>
                <input
                  id="my-resource-title"
                  className={styles.input}
                  value={form.title}
                  onChange={(event) => updateForm('title', event.target.value)}
                  placeholder={t('resourceTitlePlaceholder')}
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel} htmlFor="my-resource-description">
                  {t('resourceDescription')}
                </label>
                <textarea
                  id="my-resource-description"
                  className={styles.textarea}
                  value={form.description}
                  onChange={(event) => updateForm('description', event.target.value)}
                  placeholder={t('resourceDescriptionPlaceholder')}
                />
              </div>

              {form.type === ResourceType.FILE ? (
                <div className={styles.fieldGroup}>
                  <span className={styles.fieldLabel}>
                    {t('uploadLabel')}
                  </span>
                  <div className={styles.uploadBox}>
                    <label className={styles.uploadLabel}>
                      {isUploading
                        ? t('uploading')
                        : t('uploadCta')}
                      <input
                        className={styles.uploadInput}
                        type="file"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain,text/csv"
                        onChange={(event) => void handleUpload(event.target.files?.[0])}
                      />
                    </label>
                    <p className={styles.uploadMeta}>
                      {form.filename
                          ? t('uploadedFile', { name: form.filename })
                        : t('uploadHelper')}
                    </p>
                  </div>
                </div>
              ) : (
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel} htmlFor="my-resource-link">
                    {t('linkLabel')}
                  </label>
                  <input
                    id="my-resource-link"
                    className={styles.input}
                    value={form.linkUrl}
                    onChange={(event) => updateForm('linkUrl', event.target.value)}
                    placeholder={t('linkPlaceholder')}
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
                    ? t('sending')
                    : t('submit')}
                </button>
              </div>
            </div>
          </section>

          <section className={styles.listCard}>
            <div className={styles.cardHeader}>
              <h2 className={styles.sectionTitle}>
                {t('listTitle')}
              </h2>
              <p className={styles.sectionDescription}>
                {t('listDescription')}
              </p>
            </div>

            <div className={styles.filters}>
              <input
                className={styles.searchInput}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t('searchPlaceholder')}
              />
              <select
                className={styles.filterSelect}
                value={typeFilter}
                onChange={(event) =>
                  setTypeFilter(event.target.value as 'all' | ResourceType)
                }
              >
                <option value="all">
                  {t('filterAllTypes')}
                </option>
                <option value={ResourceType.FILE}>
                  {t('typeFile')}
                </option>
                <option value={ResourceType.LINK}>
                  {t('typeLink')}
                </option>
              </select>
            </div>

            {loading ? (
              <p className={styles.helperMessage}>
                {t('loading')}
              </p>
            ) : filteredResources.length === 0 ? (
              <div className={styles.emptyState}>
                <h3 className={styles.emptyTitle}>
                  {t('emptyTitle')}
                </h3>
                <p className={styles.emptyDescription}>
                  {t('emptyDescription')}
                </p>
              </div>
            ) : (
              <div className={styles.resourceList}>
                {filteredResources.map((resource) => (
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
                            ? t('typeFile')
                            : t('typeLink')}
                        </span>
                        <span
                          className={`${styles.badge} ${
                            resource.source === ResourceSource.ADMIN
                              ? styles.badgeAdmin
                              : styles.badgeUser
                          }`}
                        >
                          {resource.source === ResourceSource.ADMIN
                            ? t('sourceAdmin')
                            : t('sourceUser')}
                        </span>
                      </div>
                    </div>

                    <div className={styles.resourceMeta}>
                      <span>
                        {t('createdLabel')}:{' '}
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
                          {t('openFile')}
                        </button>
                      ) : null}
                      {resource.type === ResourceType.LINK && resource.linkUrl ? (
                        <a
                          href={resource.linkUrl}
                          target="_blank"
                          rel="noreferrer"
                          className={styles.inlineLink}
                        >
                          {t('openLink')}
                        </a>
                      ) : null}
                      {resource.source === ResourceSource.USER ? (
                        <button
                          type="button"
                          className={styles.inlineDanger}
                          onClick={() => void handleDelete(resource)}
                          disabled={deletingId === resource.id}
                        >
                          {deletingId === resource.id
                            ? t('deleting')
                            : t('delete')}
                        </button>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </section>
      </section>
    </div>
  );
}

export default function ResourcesPage() {
  return (
    <ProtectedRoute
      requiredRole={[UserRole.USER, UserRole.CREATOR]}
      unauthorizedRedirect="/admin"
    >
      <ResourcesPageContent />
    </ProtectedRoute>
  );
}
