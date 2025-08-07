// src/pages/FeedbackModal.jsx

export default function FeedbackModal({ isOpen, onClose, title, affectedSubjects = [] }) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Sucesso!</h3>
          <button className="modal-close-button" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <h4>{title}</h4>
          {affectedSubjects.length > 0 && (
            <ul className="feedback-list">
              {affectedSubjects.map((materia) => (
                <li key={materia.id}>{materia.nomeMateria}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}