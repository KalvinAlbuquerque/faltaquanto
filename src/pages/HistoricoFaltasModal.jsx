// src/pages/HistoricoFaltasModal.jsx

// Adicionamos a nova prop 'onRemoveFalta'
export default function HistoricoFaltasModal({ isOpen, onClose, faltas = [], onRemoveFalta }) {
  if (!isOpen) {
    return null;
  }

  const formatarData = (timestamp) => {
    if (!timestamp || !timestamp.toDate) {
      return "Data inválida";
    }
    return timestamp.toDate().toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Histórico de Faltas</h3>
          <button className="modal-close-button" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          {faltas.length > 0 ? (
            <ul className="history-list">
              {faltas.map((falta, index) => (
                <li key={index} className="history-list-item">
                  <span>{formatarData(falta.data)}</span>
                  {/* Este botão chamará a função que veio do Dashboard */}
                  <button 
                    className="remove-falta-button" 
                    onClick={() => onRemoveFalta(falta)}
                  >
                    Remover
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p>Nenhuma falta registrada ainda. Continue assim!</p>
          )}
        </div>
      </div>
    </div>
  );
}