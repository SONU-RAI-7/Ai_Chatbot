import styles from './ExportImport.module.css';

export function ExportImport({ onExport, onImport }) {
  const handleExport = () => {
    onExport();
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target.result);
        onImport(importedData);
      } catch (error) {
        console.error("Failed to import:", error);
        alert("Invalid file format. Please upload a valid JSON.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className={styles.container}>
      <button
        className={`${styles.button} ${styles.export}`}
        onClick={handleExport}
        title="Download all chats as JSON"
      >
        📤 Export Chats
      </button>

      {/* Styled label to look like a button */}
      <label className={`${styles.button} ${styles.import}`}>
        📥 Import Chats
        <input
          type="file"
          accept=".json"
          onChange={handleImport}
          className={styles.fileInput}
        />
      </label>
    </div>
  );
}
