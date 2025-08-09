// src/pages/EditMateriaForm.jsx

import { useState } from 'react';

export default function EditMateriaForm({ materia, onSave, onCancel }) {
  const [nome, setNome] = useState(materia.nomeMateria);
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
    if (!nome || diasSelecionados.length === 0) {
      alert("O nome e pelo menos um dia da semana são obrigatórios.");
      return;
    }
    // Envia os novos dados para a função onSave no Dashboard
    onSave({
      nomeMateria: nome,
      diasDaSemana: diasSelecionados
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