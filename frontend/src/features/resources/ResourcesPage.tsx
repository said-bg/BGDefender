'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { ResourceSource, ResourceType } from '@/types/api';
import useResourcesPage from './hooks/useResourcesPage';
import styles from './ResourcesPage.module.css';

function ResourcesPageContent() {
  const {
    deletingId,
    error,
    filteredResources,
    form,
    handleDelete,
    handleSubmit,
    handleUpload,
    isUploading,
    loading,
    message,
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
              {t('eyebrow', { defaultValue: 'Private resources' })}
            </p>
            <h1 className={styles.title}>
              {t('title', { defaultValue: 'My resources' })}
            </h1>
            <p className={styles.subtitle}>
              {t('subtitle', {
                defaultValue:
                  'Keep your private documents and useful links in one clean space. Admin-shared files and your own uploads both live here.',
              })}
            </p>
          </div>
        </header>

        <section className={styles.summary}>
          <article className={styles.summaryCard}>
            <span className={styles.summaryLabel}>
              {t('summaryTotal', { defaultValue: 'Total resources' })}
            </span>
            <strong className={styles.summaryValue}>{summary.total}</strong>
          </article>
          <article className={styles.summaryCard}>
            <span className={styles.summaryLabel}>
              {t('summaryFiles', { defaultValue: 'Documents' })}
            </span>
            <strong className={styles.summaryValue}>{summary.files}</strong>
          </article>
          <article className={styles.summaryCard}>
            <span className={styles.summaryLabel}>
              {t('summaryLinks', { defaultValue: 'Links' })}
            </span>
            <strong className={styles.summaryValue}>{summary.links}</strong>
          </article>
          <article className={styles.summaryCard}>
            <span className={styles.summaryLabel}>
              {t('summaryAdminSent', { defaultValue: 'Shared by admin' })}
            </span>
            <strong className={styles.summaryValue}>{summary.adminShared}</strong>
          </article>
          <article className={styles.summaryCard}>
            <span className={styles.summaryLabel}>
              {t('summaryMine', { defaultValue: 'My uploads' })}
            </span>
            <strong className={styles.summaryValue}>{summary.mine}</strong>
          </article>
        </section>

        <section className={styles.layout}>
          <section className={styles.formCard}>
            <div className={styles.cardHeader}>
              <h2 className={styles.sectionTitle}>
                {t('formTitle', { defaultValue: 'Add a resource' })}
              </h2>
              <p className={styles.sectionDescription}>
                {t('formDescription', {
                  defaultValue:
                    'Upload a private document for yourself or save a useful link so it stays easy to find later.',
                })}
              </p>
            </div>

            <div className={styles.formGrid}>
              {message ? <p className={styles.successMessage}>{message}</p> : null}
              {error ? <p className={styles.errorMessage}>{error}</p> : null}
              {uploadError ? <p className={styles.errorMessage}>{uploadError}</p> : null}

              <div className={styles.fieldGroup}>
                <span className={styles.fieldLabel}>
                  {t('type', { defaultValue: 'Resource type' })}
                </span>
                <div className={styles.modeGroup}>
                  <button
                    type="button"
                    className={`${styles.modeButton} ${
                      form.type === ResourceType.FILE ? styles.modeButtonActive : ''
                    }`}
                    onClick={() => updateForm('type', ResourceType.FILE)}
                  >
                    {t('typeFile', { defaultValue: 'Document' })}
                  </button>
                  <button
                    type="button"
                    className={`${styles.modeButton} ${
                      form.type === ResourceType.LINK ? styles.modeButtonActive : ''
                    }`}
                    onClick={() => updateForm('type', ResourceType.LINK)}
                  >
                    {t('typeLink', { defaultValue: 'Link' })}
                  </button>
                </div>
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel} htmlFor="my-resource-title">
                  {t('resourceTitle', { defaultValue: 'Title' })}
                </label>
                <input
                  id="my-resource-title"
                  className={styles.input}
                  value={form.title}
                  onChange={(event) => updateForm('title', event.target.value)}
                  placeholder={t('resourceTitlePlaceholder', {
                    defaultValue: 'Example: Personal incident response notes',
                  })}
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel} htmlFor="my-resource-description">
                  {t('resourceDescription', { defaultValue: 'Description' })}
                </label>
                <textarea
                  id="my-resource-description"
                  className={styles.textarea}
                  value={form.description}
                  onChange={(event) => updateForm('description', event.target.value)}
                  placeholder={t('resourceDescriptionPlaceholder', {
                    defaultValue:
                      'Add a short note so you remember why this resource matters.',
                  })}
                />
              </div>

              {form.type === ResourceType.FILE ? (
                <div className={styles.fieldGroup}>
                  <span className={styles.fieldLabel}>
                    {t('uploadLabel', { defaultValue: 'Document upload' })}
                  </span>
                  <div className={styles.uploadBox}>
                    <label className={styles.uploadLabel}>
                      {isUploading
                        ? t('uploading', { defaultValue: 'Uploading document...' })
                        : t('uploadCta', { defaultValue: 'Choose a document to upload' })}
                      <input
                        className={styles.uploadInput}
                        type="file"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain,text/csv"
                        onChange={(event) => void handleUpload(event.target.files?.[0])}
                      />
                    </label>
                    <p className={styles.uploadMeta}>
                      {form.filename
                        ? t('uploadedFile', {
                            defaultValue: 'Uploaded file: {{name}}',
                            name: form.filename,
                          })
                        : t('uploadHelper', {
                            defaultValue:
                              'Supported: PDF, Word, Excel, PowerPoint, TXT, or CSV up to 15 MB.',
                          })}
                    </p>
                  </div>
                </div>
              ) : (
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel} htmlFor="my-resource-link">
                    {t('linkLabel', { defaultValue: 'Link URL' })}
                  </label>
                  <input
                    id="my-resource-link"
                    className={styles.input}
                    value={form.linkUrl}
                    onChange={(event) => updateForm('linkUrl', event.target.value)}
                    placeholder={t('linkPlaceholder', {
                      defaultValue: 'https://example.com/private-resource',
                    })}
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
                    ? t('sending', { defaultValue: 'Saving resource...' })
                    : t('submit', { defaultValue: 'Save resource' })}
                </button>
              </div>
            </div>
          </section>

          <section className={styles.listCard}>
            <div className={styles.cardHeader}>
              <h2 className={styles.sectionTitle}>
                {t('listTitle', { defaultValue: 'My resource library' })}
              </h2>
              <p className={styles.sectionDescription}>
                {t('listDescription', {
                  defaultValue:
                    'Everything shared with you by the admin and everything you have uploaded for yourself in one place.',
                })}
              </p>
            </div>

            <div className={styles.filters}>
              <input
                className={styles.searchInput}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t('searchPlaceholder', {
                  defaultValue: 'Search by title or description',
                })}
              />
              <select
                className={styles.filterSelect}
                value={typeFilter}
                onChange={(event) =>
                  setTypeFilter(event.target.value as 'all' | ResourceType)
                }
              >
                <option value="all">
                  {t('filterAllTypes', { defaultValue: 'All types' })}
                </option>
                <option value={ResourceType.FILE}>
                  {t('typeFile', { defaultValue: 'Document' })}
                </option>
                <option value={ResourceType.LINK}>
                  {t('typeLink', { defaultValue: 'Link' })}
                </option>
              </select>
            </div>

            {loading ? (
              <p className={styles.helperMessage}>
                {t('loading', { defaultValue: 'Loading resources...' })}
              </p>
            ) : filteredResources.length === 0 ? (
              <div className={styles.emptyState}>
                <h3 className={styles.emptyTitle}>
                  {t('emptyTitle', { defaultValue: 'No resources yet' })}
                </h3>
                <p className={styles.emptyDescription}>
                  {t('emptyDescription', {
                    defaultValue:
                      'When an admin shares a document or you upload one yourself, it will appear here.',
                  })}
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
                            ? t('typeFile', { defaultValue: 'Document' })
                            : t('typeLink', { defaultValue: 'Link' })}
                        </span>
                        <span
                          className={`${styles.badge} ${
                            resource.source === ResourceSource.ADMIN
                              ? styles.badgeAdmin
                              : styles.badgeUser
                          }`}
                        >
                          {resource.source === ResourceSource.ADMIN
                            ? t('sourceAdmin', { defaultValue: 'Shared by admin' })
                            : t('sourceUser', { defaultValue: 'My upload' })}
                        </span>
                      </div>
                    </div>

                    <div className={styles.resourceMeta}>
                      <span>
                        {t('createdLabel', { defaultValue: 'Created' })}:{' '}
                        {new Date(resource.createdAt).toLocaleDateString()}
                      </span>
                      {resource.filename ? <span>{resource.filename}</span> : null}
                    </div>

                    <div className={styles.resourceActions}>
                      {resource.type === ResourceType.FILE && resource.fileUrl ? (
                        <a
                          href={resource.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className={styles.inlineLink}
                        >
                          {t('openFile', { defaultValue: 'Open document' })}
                        </a>
                      ) : null}
                      {resource.type === ResourceType.LINK && resource.linkUrl ? (
                        <a
                          href={resource.linkUrl}
                          target="_blank"
                          rel="noreferrer"
                          className={styles.inlineLink}
                        >
                          {t('openLink', { defaultValue: 'Open link' })}
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
                            ? t('deleting', { defaultValue: 'Deleting...' })
                            : t('delete', { defaultValue: 'Delete' })}
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
    <ProtectedRoute>
      <ResourcesPageContent />
    </ProtectedRoute>
  );
}
