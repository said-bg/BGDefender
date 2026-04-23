'use client';

import { CSSProperties, useEffect, useRef, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { UserRole } from '@/types/api';
import styles from './AdminCollectionsPage.module.css';
import useAdminCollections from './useAdminCollections';
import AdminCollectionsForm from './components/AdminCollectionsForm';
import AdminCollectionsHero from './components/AdminCollectionsHero';
import AdminCollectionsList from './components/AdminCollectionsList';
import AdminCollectionsSummary from './components/AdminCollectionsSummary';

export default function AdminCollectionsPage() {
  return (
    <ProtectedRoute requiredRole={[UserRole.ADMIN]}>
      <AdminCollectionsPageContent />
    </ProtectedRoute>
  );
}

function AdminCollectionsPageContent() {
  const formPanelRef = useRef<HTMLDivElement | null>(null);
  const [matchedPanelHeight, setMatchedPanelHeight] = useState<number | null>(null);
  const {
    availableCourses,
    coverUploadError,
    deletingId,
    editingCollectionId,
    error,
    form,
    handleCoverUpload,
    handleDelete,
    handleImageModeChange,
    handleMoveCollection,
    handleMoveCourse,
    handleSubmit,
    handleToggleCourse,
    imageMode,
    isUploadingCover,
    language,
    loading,
    message,
    preparedCollections,
    resetForm,
    search,
    selectedCourses,
    setSearch,
    startEdit,
    submitting,
    summary,
    t,
    uploadedFilename,
    updateForm,
  } = useAdminCollections();

  useEffect(() => {
    const formPanel = formPanelRef.current;

    if (!formPanel || typeof window === 'undefined') {
      return undefined;
    }

    const mobileQuery = window.matchMedia('(max-width: 1000px)');

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

  const listPanelStyle =
    matchedPanelHeight !== null
      ? ({ '--collections-panel-height': `${matchedPanelHeight}px` } as CSSProperties)
      : undefined;

  return (
    <div className={styles.page}>
      <AdminCollectionsHero t={t} />

      {message ? <p className={styles.successMessage}>{message}</p> : null}
      {error ? <p className={styles.errorMessage}>{error}</p> : null}

      <AdminCollectionsSummary summary={summary} t={t} />

      <section className={styles.layout}>
        <div ref={formPanelRef} className={styles.formPanel}>
          <AdminCollectionsForm
            availableCourses={availableCourses}
            coverUploadError={coverUploadError}
            editingCollectionId={editingCollectionId}
            form={form}
            handleCoverUpload={handleCoverUpload}
            handleImageModeChange={handleImageModeChange}
            handleMoveCourse={handleMoveCourse}
            handleSubmit={handleSubmit}
            handleToggleCourse={handleToggleCourse}
            imageMode={imageMode}
            isUploadingCover={isUploadingCover}
            language={language}
            resetForm={resetForm}
            selectedCourses={selectedCourses}
            submitting={submitting}
            t={t}
            uploadedFilename={uploadedFilename}
            updateForm={updateForm}
          />
        </div>
        <div className={styles.listPanel} style={listPanelStyle}>
          <AdminCollectionsList
            deletingId={deletingId}
            handleDelete={handleDelete}
            handleMoveCollection={handleMoveCollection}
            language={language}
            loading={loading}
            preparedCollections={preparedCollections}
            search={search}
            setSearch={setSearch}
            startEdit={startEdit}
            t={t}
          />
        </div>
      </section>
    </div>
  );
}
