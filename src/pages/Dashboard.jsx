import { useState, useEffect, useMemo } from 'react';
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
  arrayRemove,
  writeBatch
} from 'firebase/firestore';

// Importando todos os nossos componentes de arquivos separados
import EditMateriaForm from './EditMateriaForm';
import HistoricoFaltasModal from './HistoricoFaltasModal';
import FeedbackModal from './FeedbackModal';

export default function Dashboard() {
  const [materias, setMaterias] = useState([]);
  const [nomeMateria, setNomeMateria] = useState('');
  const [diasSemana, setDiasSemana] = useState({});
  // Adicionado novo estado para o total de faltas
  const [totalFaltasPermitidas, setTotalFaltasPermitidas] = useState(7);
  const [editingMateriaId, setEditingMateriaId] = useState(null);
  const [materiaModal, setMateriaModal] = useState(null);
  const [feedbackModalInfo, setFeedbackModalInfo] = useState({
    isOpen: false,
    title: '',
    subjects: []
  });

  const [selectedDay, setSelectedDay] = useState(null); // null = Todos, 0 = Dom, 1 = Seg, etc.
  const [searchTerm, setSearchTerm] = useState('');
  const user = auth.currentUser;
  const hoje = new Date().getDay(); // Pega o dia da semana atual (0=Dom, 1=Seg, ...)
  const diasDaSemanaNomes = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

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

  const handleAddMateria = async (e) => {
    e.preventDefault();
    const diasSelecionados = Object.keys(diasSemana).filter(dia => diasSemana[dia]).map(Number);
    // Adicionada a validação para o nome e dias, e agora também para o total de faltas
    if (!nomeMateria || diasSelecionados.length === 0 || totalFaltasPermitidas < 0) {
      alert("Preencha o nome, selecione pelo menos um dia da semana e o total de faltas deve ser um número válido.");
      return;
    }
    try {
      await addDoc(collection(db, 'materias'), {
        userId: user.uid,
        nomeMateria: nomeMateria,
        diasDaSemana: diasSelecionados,
        totalFaltasPermitidas: Number(totalFaltasPermitidas), // Garante que o valor é um número
        faltasCometidas: 0,
        aulasAssistidas: 0,
        historicoFaltas: []
      });
      setNomeMateria('');
      setDiasSemana({});
      setTotalFaltasPermitidas(7); // Reseta o valor para o padrão após adicionar
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
  
  const handleRemoveFalta = async (faltaParaRemover) => {
    if (!materiaModal) return;
    const materiaRef = doc(db, "materias", materiaModal.id);
    try {
      await updateDoc(materiaRef, {
        historicoFaltas: arrayRemove(faltaParaRemover),
        faltasCometidas: increment(-1)
      });
      setMateriaModal(prev => ({
        ...prev,
        historicoFaltas: prev.historicoFaltas.filter(f => f.data !== faltaParaRemover.data)
      }));
    } catch (error) {
      console.error("Erro ao remover falta: ", error);
      alert("Não foi possível remover a falta. Tente novamente.");
    }
  };
  
  const filteredMaterias = useMemo(() => {
    return materias
      .filter(materia => {
        // Filtro por dia da semana
        if (selectedDay !== null) {
          return materia.diasDaSemana.includes(selectedDay);
        }
        return true; // Se nenhum dia selecionado, retorna todas
      })
      .filter(materia => {
        // Filtro por termo de busca (case-insensitive)
        if (searchTerm) {
          return materia.nomeMateria.toLowerCase().includes(searchTerm.toLowerCase());
        }
        return true; // Se não houver busca, retorna todas
      });
  }, [materias, selectedDay, searchTerm]);
  const handleDiaChange = (dia) => {
    setDiasSemana(prev => ({ ...prev, [dia]: !prev[dia] }));
  };
  
  const handleGlobalAttendance = async (type) => {
    const materiasDeHoje = materias.filter(m => m.diasDaSemana.includes(hoje));
    if (materiasDeHoje.length === 0) {
      alert("Nenhuma matéria agendada para hoje!");
      return;
    }
    const batch = writeBatch(db);
    materiasDeHoje.forEach(materia => {
      const materiaRef = doc(db, "materias", materia.id);
      if (type === 'presente') {
        batch.update(materiaRef, { aulasAssistidas: increment(1) });
      } else {
        batch.update(materiaRef, {
          faltasCometidas: increment(1),
          historicoFaltas: arrayUnion({ data: new Date() })
        });
      }
    });
    try {
      await batch.commit();
      const acao = type === 'presente' ? 'Presenças aplicadas' : 'Faltas aplicadas';
      setFeedbackModalInfo({
        isOpen: true,
        title: `${acao} em ${materiasDeHoje.length} matéria(s):`,
        subjects: materiasDeHoje
      });
    } catch (error) {
      console.error("Erro ao atualizar matérias em lote: ", error);
      alert("Ocorreu um erro ao atualizar as matérias.");
    }
  };

  return (
    <>
      <div className="dashboard-container">
        <header className="dashboard-header">
          <h1 className="dashboard-logo">Falta<span>Quanto</span></h1>
          <div className="dashboard-user-info">
            <p>Olá, Sunshine</p>
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
              <input
                className="login-input"
                type="number"
                placeholder="Faltas Permitidas"
                value={totalFaltasPermitidas}
                onChange={(e) => setTotalFaltasPermitidas(e.target.value)}
                min="0"
              />
               <div className="dias-checkbox-container" style={{ gridColumn: '1 / -1' }}>
                <span style={{color: 'var(--text-secondary)', gridColumn: '1 / -1'}}>Dias:</span>
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((dia, index) => (
                  <label
                    key={index}
                    className={`day-label ${diasSemana[index] ? 'active' : ''}`}
                  >
                    <input
                      type="checkbox"
                      className="day-input"
                      checked={!!diasSemana[index]}
                      onChange={() => handleDiaChange(index)}
                    />
                    {dia}
                  </label>
                ))}
              </div>
              <button type="submit" className="login-submit-button">Adicionar Matéria</button>
            </div>
          </form>
        </div>

        <div className="global-actions-container">
            <button
              className="global-action-button presente-todas"
              onClick={() => handleGlobalAttendance('presente')}
            >
              Presente em Todas Hoje
            </button>
            <button
              className="global-action-button faltei-todas"
              onClick={() => handleGlobalAttendance('faltei')}
            >
              Faltei em Todas Hoje
            </button>
        </div>

        <div className="filter-controls">
          <div className="day-filter-container">
            <button
              className={`day-filter-button ${selectedDay === null ? 'active' : ''}`}
              onClick={() => setSelectedDay(null)}
            >
              Todos
            </button>
            {diasDaSemanaNomes.map((dia, index) => (
              <button
                key={index}
                className={`day-filter-button ${selectedDay === index ? 'active' : ''}`}
                onClick={() => setSelectedDay(index)}
              >
                {dia}
              </button>
            ))}
          </div>
          <input
            type="search"
            className="search-input"
            placeholder="Buscar matéria pelo nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <h2 style={{ marginBottom: '24px' }}>Minhas Matérias</h2>
        <div className="materias-grid">
          {filteredMaterias.length > 0 ? filteredMaterias.map(materia => {
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
            <p style={{ color: 'var(--text-secondary)' }}>Nenhuma matéria encontrada para os filtros aplicados.</p>
          )}
        </div>
      </div>
      
      <HistoricoFaltasModal
        isOpen={!!materiaModal}
        onClose={() => setMateriaModal(null)}
        faltas={materiaModal?.historicoFaltas || []}
        onRemoveFalta={handleRemoveFalta}
      />

      <FeedbackModal
        isOpen={feedbackModalInfo.isOpen}
        onClose={() => setFeedbackModalInfo({ isOpen: false, title: '', subjects: [] })}
        title={feedbackModalInfo.title}
        affectedSubjects={feedbackModalInfo.subjects}
      />
    </>
  );
}