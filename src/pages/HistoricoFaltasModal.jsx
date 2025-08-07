// src/pages/HistoricoFaltasModal.jsx

export default function HistoricoFaltasModal({ isOpen, onClose, faltas = [] }) {
  if (!isOpen) {
    return null;
  }

  // Função para formatar a data do Firebase para um formato legível
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
    // O fundo escuro do modal
    <div className="modal-overlay" onClick={onClose}>
      {/* O conteúdo do modal */}
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Histórico de Faltas</h3>
          <button className="modal-close-button" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          {faltas.length > 0 ? (
            <ul>
              {faltas.map((falta, index) => (
                <li key={index}>{formatarData(falta.data)}</li>
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