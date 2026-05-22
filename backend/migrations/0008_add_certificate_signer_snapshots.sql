ALTER TABLE certificates
  ADD COLUMN directorSnapshotFullName VARCHAR(160) NULL AFTER courseTitleFiSnapshot,
  ADD COLUMN directorSnapshotTitle VARCHAR(120) NULL AFTER directorSnapshotFullName,
  ADD COLUMN directorSnapshotSignatureData LONGTEXT NULL AFTER directorSnapshotTitle,
  ADD COLUMN programDirectorSnapshotFullName VARCHAR(160) NULL AFTER directorSnapshotSignatureData,
  ADD COLUMN programDirectorSnapshotTitle VARCHAR(120) NULL AFTER programDirectorSnapshotFullName,
  ADD COLUMN programDirectorSnapshotSignatureData LONGTEXT NULL AFTER programDirectorSnapshotTitle;
