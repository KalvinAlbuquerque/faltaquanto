import { useState } from 'react';

export default function EditMateriaForm({ materia, onSave, onCancel }) {
  const [nome, setNome] = useState(materia.nomeMateria);
  // Adicionado novo estado para o total de faltas, usando o valor da matéria existente
  const [totalFaltas, setTotalFaltas] = useState(materia.totalFaltasPermitidas || 7);
  const [dias, setDias] = useState(() => {
    // Cria um estado inicial para os checkboxes a partir dos dados da matéria
    const diasState = {};
    if (materia.diasDaSemana) {
      materia.diasDaSemana.forEach(dia => {
        diasState[dia] = true;
      });
    }
    return diasState;
  });

  const handleSave = (e) => {
    e.preventDefault();
    const diasSelecionados = Object.keys(dias).filter(dia => dias[dia]).map(Number);
    // Adicionada a validação para o nome e dias, e agora também para o total de faltas
    if (!nome || diasSelecionados.length === 0 || totalFaltas < 0) {
      alert("O nome, pelo menos um dia da semana e o total de faltas são obrigatórios.");
      return;
    }
    // Envia os novos dados para a função onSave no Dashboard, incluindo o total de faltas
    onSave({
      nomeMateria: nome,
      diasDaSemana: diasSelecionados,
      totalFaltasPermitidas: Number(totalFaltas)
    });
  };

  const handleDiaChange = (dia) => {
    setDias(prev => ({ ...prev, [dia]: !prev[dia] }));
  };

  return (
    <form onSubmit={handleSave} className="edit-form">
      <input
        type="text"
        className="login-input"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        placeholder="Nome da Matéria"
      />
      <input
        type="number"
        className="login-input"
        value={totalFaltas}
        onChange={(e) => setTotalFaltas(e.target.value)}
        placeholder="Faltas Permitidas"
        min="0"
      />
      <div className="dias-checkbox-container">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((dia, index) => (
          // O label agora tem a classe dinâmica
          <label
            key={index}
            className={`day-label ${dias[index] ? 'active' : ''}`}
          >
            {/* O input agora está escondido, mas funciona perfeitamente */}
            <input
              type="checkbox"
              className="day-input"
              checked={!!dias[index]}
              onChange={() => handleDiaChange(index)}
            />
            {dia}
          </label>
        ))}
      </div>
      <div className="edit-form-actions">
        <button type="button" className="action-button secondary" onClick={onCancel}>Cancelar</button>
        <button type="submit" className="action-button primary">Salvar</button>
      </div>
    </form>
  );
}