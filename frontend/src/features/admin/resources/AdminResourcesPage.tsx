'use client';

import { CSSProperties, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { formatSiteDate } from '@/lib/datetime';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import {
  DEFAULT_LOCALE,
  getLocaleFromPathname,
  localizePathname,
} from '@/lib/locale';
import { ResourceSource, ResourceType, UserRole } from '@/types/api';
import {
  getAdminResourceGroupLabel,
  getAdminResourceUserLabel,
} from './adminResources.utils';
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
  const pathname = usePathname();
  const activeLocale = getLocaleFromPathname(pathname || '/') ?? DEFAULT_LOCALE;
  const formCardRef = useRef<HTMLElement | null>(null);
  const [matchedPanelHeight, setMatchedPanelHeight] = useState<number | null>(null);
  const [isGroupManagerOpen, setIsGroupManagerOpen] = useState(false);
  const {
    cancelEditingGroup,
    deletingGroupId,
    deletingId,
    error,
    form,
    groupError,
    groupForm,
    groupMessage,
    groupSubmitting,
    groups,
    handleDelete,
    handleDeleteGroup,
    handleOpenFile,
    handleSubmit,
    handleSubmitGroup,
    handleUpload,
    isUploading,
    loading,
    message,
    openingId,
    resources,
    search,
    setSearch,
    setTypeFilter,
    startEditingGroup,
    submitting,
    summary,
    t,
    typeFilter,
    updateForm,
    updateGroupForm,
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

  const openGroupManager = () => setIsGroupManagerOpen(true);

  const closeGroupManager = () => {
    cancelEditingGroup();
    setIsGroupManagerOpen(false);
  };

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
          <p className={styles.eyebrow}>{t('resources.eyebrow')}</p>
          <h1 className={styles.title}>{t('resources.title')}</h1>
          <p className={styles.subtitle}>{t('resources.subtitle')}</p>
        </div>
      </section>

      <section className={styles.summary}>
        <article className={styles.summaryCard}>
          <span className={styles.summaryLabel}>{t('resources.summaryTotal')}</span>
          <strong className={styles.summaryValue}>{summary.total}</strong>
        </article>
        <article className={styles.summaryCard}>
          <span className={styles.summaryLabel}>{t('resources.summaryFiles')}</span>
          <strong className={styles.summaryValue}>{summary.files}</strong>
        </article>
        <article className={styles.summaryCard}>
          <span className={styles.summaryLabel}>{t('resources.summaryLinks')}</span>
          <strong className={styles.summaryValue}>{summary.links}</strong>
        </article>
        <article className={styles.summaryCard}>
          <span className={styles.summaryLabel}>{t('resources.summaryAdminSent')}</span>
          <strong className={styles.summaryValue}>{summary.adminSent}</strong>
        </article>
        <article className={styles.summaryCard}>
          <span className={styles.summaryLabel}>{t('resources.summaryGroupTargets')}</span>
          <strong className={styles.summaryValue}>{summary.groupTargets}</strong>
        </article>
      </section>

      <section className={styles.layout}>
        <section ref={formCardRef} className={styles.formCard}>
          <div className={styles.cardHeader}>
            <h2 className={styles.sectionTitle}>{t('resources.formTitle')}</h2>
            <p className={styles.sectionDescription}>{t('resources.formDescription')}</p>
          </div>

          <div className={styles.formGrid}>
            {message ? <p className={styles.successMessage}>{message}</p> : null}
            {error ? <p className={styles.errorMessage}>{error}</p> : null}
            {uploadError ? <p className={styles.errorMessage}>{uploadError}</p> : null}

            <div className={styles.fieldGroup}>
              <span className={styles.fieldLabel}>{t('resources.targetType')}</span>
              <div className={styles.modeGroup}>
                <button
                  type="button"
                  className={`${styles.modeButton} ${
                    form.targetType === 'user' ? styles.modeButtonActive : ''
                  }`}
                  onClick={() => {
                    updateForm('targetType', 'user');
                    updateForm('assignedGroupId', '');
                  }}
                >
                  {t('resources.targetModeUser')}
                </button>
                <button
                  type="button"
                  className={`${styles.modeButton} ${
                    form.targetType === 'group' ? styles.modeButtonActive : ''
                  }`}
                  onClick={() => {
                    updateForm('targetType', 'group');
                    updateForm('assignedUserId', '');
                  }}
                >
                  {t('resources.targetModeGroup')}
                </button>
              </div>
            </div>

            <div className={styles.fieldGroup}>
              {form.targetType === 'user' ? (
                <>
                  <label className={styles.fieldLabel} htmlFor="resource-user">
                    {t('resources.targetUser')}
                  </label>
                  <select
                    id="resource-user"
                    className={styles.select}
                    value={form.assignedUserId}
                    onChange={(event) => updateForm('assignedUserId', event.target.value)}
                  >
                    <option value="">{t('resources.targetUserPlaceholder')}</option>
                    {users.map((user) => (
                      <option key={user.id} value={String(user.id)}>
                        {getAdminResourceUserLabel(user)} - {user.email}
                      </option>
                    ))}
                  </select>
                </>
              ) : (
                <>
                  <div className={styles.inlineFieldHeader}>
                    <label className={styles.fieldLabel} htmlFor="resource-group">
                      {t('resources.targetGroup')}
                    </label>
                    <button
                      type="button"
                      className={styles.inlineLink}
                      onClick={openGroupManager}
                    >
                      {groups.length > 0
                        ? t('resources.groups.manage')
                        : t('resources.groups.create')}
                    </button>
                  </div>
                  <select
                    id="resource-group"
                    className={styles.select}
                    value={form.assignedGroupId}
                    onChange={(event) => updateForm('assignedGroupId', event.target.value)}
                    disabled={groups.length === 0}
                  >
                    <option value="">
                      {groups.length > 0
                        ? t('resources.targetGroupPlaceholder')
                        : t('resources.groups.emptySelectPlaceholder')}
                    </option>
                    {groups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {getAdminResourceGroupLabel(group)}
                      </option>
                    ))}
                  </select>
                  {groups.length === 0 ? (
                    <p className={styles.helperText}>
                      {t('resources.groups.emptyDescription')}
                    </p>
                  ) : null}
                </>
              )}
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

            <div className={styles.fieldGroup}>
              <span className={styles.fieldLabel}>{t('resources.type')}</span>
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

            {form.type === ResourceType.FILE ? (
              <div className={styles.fieldGroup}>
                <span className={styles.fieldLabel}>{t('resources.uploadLabel')}</span>
                <div className={styles.uploadBox}>
                  <label className={styles.uploadLabel}>
                    {isUploading ? t('resources.uploading') : t('resources.uploadCta')}
                    <input
                      className={styles.uploadInput}
                      type="file"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain,text/csv"
                      onChange={(event) => void handleUpload(event.target.files?.[0])}
                    />
                  </label>
                  <p className={styles.uploadMeta}>
                    {form.filename
                      ? t('resources.uploadedFile', { name: form.filename })
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
                {submitting ? t('resources.sending') : t('resources.submit')}
              </button>
            </div>
          </div>
        </section>

        <section className={styles.listCard} style={listCardStyle}>
          <div className={styles.cardHeader}>
            <h2 className={styles.sectionTitle}>{t('resources.listTitle')}</h2>
            <p className={styles.sectionDescription}>{t('resources.listDescription')}</p>
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
              <option value="all">{t('resources.filterAllTypes')}</option>
              <option value={ResourceType.FILE}>{t('resources.typeFile')}</option>
              <option value={ResourceType.LINK}>{t('resources.typeLink')}</option>
            </select>
          </div>

          {loading ? (
            <p className={styles.helperMessage}>{t('loading')}</p>
          ) : resources.length === 0 ? (
            <section className={styles.emptyState}>
              <h3 className={styles.emptyTitle}>{t('resources.emptyTitle')}</h3>
              <p className={styles.emptyDescription}>{t('resources.emptyDescription')}</p>
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
                    {resource.assignedUser ? (
                      <span>
                        {t('resources.targetUserLabel')}:{' '}
                        {getAdminResourceUserLabel(resource.assignedUser)}
                      </span>
                    ) : null}
                    {resource.assignedGroup ? (
                      <span>
                        {t('resources.targetGroupLabel')}:{' '}
                        {getAdminResourceGroupLabel(resource.assignedGroup)}
                      </span>
                    ) : null}
                    <span>
                      {t('resources.createdLabel')}:{' '}
                      {formatSiteDate(resource.createdAt, activeLocale, {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
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

      {isGroupManagerOpen ? (
        <div
          className={styles.groupModalBackdrop}
          role="presentation"
          onClick={closeGroupManager}
        >
          <section
            className={styles.groupModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="resource-group-manager-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.groupModalHeader}>
              <div className={styles.cardHeader}>
                <h2 id="resource-group-manager-title" className={styles.sectionTitle}>
                  {groupForm.id
                    ? t('resources.groups.editTitle')
                    : t('resources.groups.createTitle')}
                </h2>
                <p className={styles.sectionDescription}>
                  {t('resources.groups.formDescription')}
                </p>
              </div>
              <button
                type="button"
                className={styles.modalCloseButton}
                onClick={closeGroupManager}
              >
                {t('resources.groups.close')}
              </button>
            </div>

            <div className={styles.groupModalLayout}>
              <section className={styles.groupModalPanel}>
                <div className={styles.formGrid}>
                  {groupMessage ? <p className={styles.successMessage}>{groupMessage}</p> : null}
                  {groupError ? <p className={styles.errorMessage}>{groupError}</p> : null}

                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel} htmlFor="resource-group-title">
                      {t('resources.groups.title')}
                    </label>
                    <input
                      id="resource-group-title"
                      className={styles.input}
                      value={groupForm.title}
                      onChange={(event) => updateGroupForm('title', event.target.value)}
                      placeholder={t('resources.groups.titlePlaceholder')}
                    />
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel} htmlFor="resource-group-description">
                      {t('resources.groups.description')}
                    </label>
                    <textarea
                      id="resource-group-description"
                      className={styles.textarea}
                      value={groupForm.description}
                      onChange={(event) => updateGroupForm('description', event.target.value)}
                      placeholder={t('resources.groups.descriptionPlaceholder')}
                    />
                  </div>

                  <div className={styles.fieldGroup}>
                    <span className={styles.fieldLabel}>{t('resources.groups.members')}</span>
                    <div className={styles.memberChecklist}>
                      {users.map((user) => {
                        const value = String(user.id);
                        const checked = groupForm.memberUserIds.includes(value);

                        return (
                          <label key={user.id} className={styles.memberOption}>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() =>
                                updateGroupForm(
                                  'memberUserIds',
                                  checked
                                    ? groupForm.memberUserIds.filter((entry) => entry !== value)
                                    : [...groupForm.memberUserIds, value],
                                )
                              }
                            />
                            <span>
                              {getAdminResourceUserLabel(user)} - {user.email}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                    <p className={styles.helperText}>{t('resources.groups.membersHint')}</p>
                  </div>

                  <div className={styles.actionsRow}>
                    <button
                      type="button"
                      className={styles.primaryAction}
                      onClick={() => void handleSubmitGroup()}
                      disabled={groupSubmitting}
                    >
                      {groupSubmitting
                        ? t('resources.groups.saving')
                        : groupForm.id
                          ? t('resources.groups.save')
                          : t('resources.groups.create')}
                    </button>
                    {groupForm.id ? (
                      <button
                        type="button"
                        className={styles.inlineLink}
                        onClick={cancelEditingGroup}
                      >
                        {t('resources.groups.cancelEdit')}
                      </button>
                    ) : null}
                  </div>
                </div>
              </section>

              <section className={styles.groupModalPanel}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.sectionTitle}>{t('resources.groups.listTitle')}</h3>
                  <p className={styles.sectionDescription}>
                    {t('resources.groups.listDescription')}
                  </p>
                </div>

                {groups.length === 0 ? (
                  <section className={styles.emptyState}>
                    <h4 className={styles.emptyTitle}>{t('resources.groups.emptyTitle')}</h4>
                    <p className={styles.emptyDescription}>
                      {t('resources.groups.emptyDescription')}
                    </p>
                  </section>
                ) : (
                  <div className={styles.resourceList}>
                    {groups.map((group) => (
                      <article key={group.id} className={styles.resourceCard}>
                        <div className={styles.resourceTop}>
                          <div className={styles.resourceCopy}>
                            <h4 className={styles.resourceTitle}>{group.title}</h4>
                            {group.description ? (
                              <p className={styles.resourceDescription}>{group.description}</p>
                            ) : null}
                          </div>

                          <div className={styles.badgeRow}>
                            <span className={`${styles.badge} ${styles.badgeAdmin}`}>
                              {t('resources.groups.memberCount', {
                                count: group.memberCount,
                              })}
                            </span>
                          </div>
                        </div>

                        <div className={styles.resourceMeta}>
                          <span>
                            {group.members
                              .map((member) => getAdminResourceUserLabel(member))
                              .join(', ') || t('resources.groups.noMembers')}
                          </span>
                        </div>

                        <div className={styles.resourceActions}>
                          <button
                            type="button"
                            className={styles.inlineLink}
                            onClick={() => startEditingGroup(group)}
                          >
                            {t('resources.groups.edit')}
                          </button>
                          <button
                            type="button"
                            className={styles.inlineDanger}
                            onClick={() => void handleDeleteGroup(group)}
                            disabled={deletingGroupId === group.id}
                          >
                            {deletingGroupId === group.id
                              ? t('resources.deleting')
                              : t('resources.groups.delete')}
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
