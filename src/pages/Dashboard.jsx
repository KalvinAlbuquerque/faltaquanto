import { useState, useEffect } from 'react';
import { auth, db } from '../firebase/config';
import { signOut } from 'firebase/auth';
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  increment,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';

// Importando os componentes de arquivos separados
import EditMateriaForm from './EditMateriaForm';
import HistoricoFaltasModal from './HistoricoFaltasModal';

export default function Dashboard() {
  const [materias, setMaterias] = useState([]);
  const [nomeMateria, setNomeMateria] = useState('');
  const [diasSemana, setDiasSemana] = useState({});
  const [editingMateriaId, setEditingMateriaId] = useState(null);
  const [materiaModal, setMateriaModal] = useState(null); // Controla o modal de histórico

  const user = auth.currentUser;
  const hoje = new Date().getDay(); // Pega o dia da semana atual (0=Dom, 1=Seg, ...)

  // Efeito para buscar as matérias do usuário em tempo real
  useEffect(() => {
    if (!user) return;

    const materiasRef = collection(db, "materias");
    const q = query(materiasRef, where("userId", "==", user.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMaterias(items);
    });

    return () => unsubscribe();
  }, [user]);
  const handleRemoveFalta = async (faltaParaRemover) => {
    if (!materiaModal) return; // Segurança

    const materiaRef = doc(db, "materias", materiaModal.id);
    try {
      await updateDoc(materiaRef, {
        // Remove o objeto exato do array de histórico
        historicoFaltas: arrayRemove(faltaParaRemover),
        // Decrementa o contador total de faltas
        faltasCometidas: increment(-1)
      });

      // Atualiza o estado local do modal para refletir a remoção imediatamente
      setMateriaModal(prev => ({
        ...prev,
        historicoFaltas: prev.historicoFaltas.filter(f => f.data !== faltaParaRemover.data)
      }));

    } catch (error) {
      console.error("Erro ao remover falta: ", error);
      alert("Não foi possível remover a falta. Tente novamente.");
    }
  };
  const handleAddMateria = async (e) => {
    e.preventDefault();
    const diasSelecionados = Object.keys(diasSemana).filter(dia => diasSemana[dia]).map(Number);

    if (!nomeMateria || diasSelecionados.length === 0) {
      alert("Preencha o nome e selecione pelo menos um dia da semana.");
      return;
    }

    try {
      await addDoc(collection(db, 'materias'), {
        userId: user.uid,
        nomeMateria: nomeMateria,
        diasDaSemana: diasSelecionados,
        totalFaltasPermitidas: 7,
        faltasCometidas: 0,
        aulasAssistidas: 0,
        historicoFaltas: []
      });
      setNomeMateria('');
      setDiasSemana({});
    } catch (error) {
      console.error("Erro ao adicionar matéria: ", error);
      alert("Não foi possível adicionar a matéria.");
    }
  };

  const handleUpdateMateria = async (newData) => {
    const materiaRef = doc(db, "materias", editingMateriaId);
    await updateDoc(materiaRef, newData);
    setEditingMateriaId(null);
  };

  const handleDeleteMateria = async (id) => {
    if (window.confirm("Tem certeza que deseja excluir esta matéria? Esta ação não pode ser desfeita.")) {
      const materiaRef = doc(db, "materias", id);
      await deleteDoc(materiaRef);
    }
  };

  const handleAttendance = async (id, type) => {
    const materiaRef = doc(db, "materias", id);
    if (type === 'presente') {
      await updateDoc(materiaRef, { aulasAssistidas: increment(1) });
    } else if (type === 'faltei') {
      await updateDoc(materiaRef, {
        faltasCometidas: increment(1),
        historicoFaltas: arrayUnion({ data: new Date() })
      });
    }
  };

  const handleDiaChange = (dia) => {
    setDiasSemana(prev => ({ ...prev, [dia]: !prev[dia] }));
  };

  return (
    <>
      <div className="dashboard-container">
        <header className="dashboard-header">
          <h1 className="dashboard-logo">Falta<span>Quanto</span></h1>
          <div className="dashboard-user-info">
            <p>Olá, {user?.email}</p>
            <button onClick={() => signOut(auth)} className="dashboard-logout-button">Sair</button>
          </div>
        </header>

        <div className="form-container">
          <h3 style={{ marginBottom: '16px' }}>Cadastrar Nova Matéria</h3>
          <form onSubmit={handleAddMateria}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input
                className="login-input"
                type="text"
                placeholder="Nome da Matéria (Ex: Cálculo I)"
                value={nomeMateria}
                onChange={(e) => setNomeMateria(e.target.value)}
              />
              <div className="dias-checkbox-container" style={{ justifyContent: 'flex-start' }}>
                <span style={{color: 'var(--text-secondary)'}}>Dias:</span>
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((dia, index) => (
                  <label key={index} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={!!diasSemana[index]}
                      onChange={() => handleDiaChange(index)}
                    /> {dia}
                  </label>
                ))}
              </div>
              <button type="submit" className="login-submit-button">Adicionar Matéria</button>
            </div>
          </form>
        </div>

        <h2 style={{ marginBottom: '24px' }}>Minhas Matérias</h2>
        <div className="materias-grid">
          {materias.length > 0 ? materias.map(materia => {
            const faltasPercent = (materia.faltasCometidas / materia.totalFaltasPermitidas) * 100;
            const isToday = materia.diasDaSemana.includes(hoje);

            return (
              <div key={materia.id} className="materia-card">
                {editingMateriaId === materia.id ? (
                  <EditMateriaForm
                    materia={materia}
                    onSave={handleUpdateMateria}
                    onCancel={() => setEditingMateriaId(null)}
                  />
                ) : (
                  <>
                    <div className="card-header">
                      <h4>{materia.nomeMateria}</h4>
                      <div className="card-actions">
                        <button className="icon-button" title="Editar Matéria" onClick={() => setEditingMateriaId(materia.id)}>✏️</button>
                        <button className="icon-button" title="Excluir Matéria" onClick={() => handleDeleteMateria(materia.id)}>🗑️</button>
                      </div>
                    </div>
                    <div className="card-body">
                      <p>Faltas: {materia.faltasCometidas} de {materia.totalFaltasPermitidas}</p>
                      <div className="progress-bar">
                        <div
                          className={`progress-fill ${faltasPercent > 70 ? 'danger' : ''}`}
                          style={{ width: `${faltasPercent}%` }}>
                        </div>
                      </div>
                      <p>Aulas assistidas: {materia.aulasAssistidas}</p>
                    </div>
                    <div className="card-footer">
                      <div className="attendance-buttons">
                        <button
                          className="action-button presente"
                          disabled={!isToday}
                          onClick={() => handleAttendance(materia.id, 'presente')}
                        >
                          Presente
                        </button>
                        <button
                          className="action-button faltei"
                          disabled={!isToday}
                          onClick={() => handleAttendance(materia.id, 'faltei')}
                        >
                          Faltei
                        </button>
                      </div>
                      <button 
                        className="history-button" 
                        onClick={() => setMateriaModal(materia)}
                      >
                        Ver Histórico
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          }) : (
            <p style={{ color: 'var(--text-secondary)' }}>Nenhuma matéria cadastrada ainda. Adicione uma no formulário acima!</p>
          )}
        </div>
      </div>
      
      <HistoricoFaltasModal
        isOpen={!!materiaModal}
        onClose={() => setMateriaModal(null)}
        faltas={materiaModal?.historicoFaltas || []}
        onRemoveFalta={handleRemoveFalta}
      />
    </>
  );
}