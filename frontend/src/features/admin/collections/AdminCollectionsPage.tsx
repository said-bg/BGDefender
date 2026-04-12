'use client';

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
  const {
    availableCourses,
    deletingId,
    editingCollectionId,
    error,
    form,
    handleDelete,
    handleMoveCourse,
    handleSubmit,
    handleToggleCourse,
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
    updateForm,
  } = useAdminCollections();

  return (
    <div className={styles.page}>
      <AdminCollectionsHero t={t} />

      {message ? <p className={styles.successMessage}>{message}</p> : null}
      {error ? <p className={styles.errorMessage}>{error}</p> : null}

      <AdminCollectionsSummary summary={summary} t={t} />

      <section className={styles.layout}>
        <AdminCollectionsForm
          availableCourses={availableCourses}
          editingCollectionId={editingCollectionId}
          form={form}
          handleMoveCourse={handleMoveCourse}
          handleSubmit={handleSubmit}
          handleToggleCourse={handleToggleCourse}
          resetForm={resetForm}
          selectedCourses={selectedCourses}
          submitting={submitting}
          t={t}
          updateForm={updateForm}
        />
        <AdminCollectionsList
          deletingId={deletingId}
          handleDelete={handleDelete}
          loading={loading}
          preparedCollections={preparedCollections}
          search={search}
          setSearch={setSearch}
          startEdit={startEdit}
          t={t}
        />
      </section>
    </div>
  );
}
