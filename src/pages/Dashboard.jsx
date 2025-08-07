import { useState, useEffect } from 'react';
import { auth, db } from '../firebase/config';
import { signOut } from 'firebase/auth';
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot
} from 'firebase/firestore';

export default function Dashboard() {
  const [materias, setMaterias] = useState([]);
  const [nomeMateria, setNomeMateria] = useState('');
  const [diasSemana, setDiasSemana] = useState({});

  const user = auth.currentUser;

  // Efeito para buscar as matérias do usuário em tempo real
  useEffect(() => {
    if (!user) return;

    const materiasRef = collection(db, "materias");
    const q = query(materiasRef, where("userId", "==", user.uid));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const items = [];
      querySnapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() });
      });
      setMaterias(items);
    });

    // Limpa o listener ao desmontar o componente para evitar vazamento de memória
    return () => unsubscribe();
  }, [user]);

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
        criadaEm: new Date() // Opcional: para ordenar no futuro
      });
      // Limpa o formulário após o sucesso
      setNomeMateria('');
      setDiasSemana({});
    } catch (error) {
      console.error("Erro ao adicionar matéria: ", error);
      alert("Não foi possível adicionar a matéria. Tente novamente.");
    }
  };

  const handleDiaChange = (dia) => {
    setDiasSemana(prev => ({ ...prev, [dia]: !prev[dia] }));
  };

  return (
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
              className="login-input" // Reutilizando a classe de input do login
              type="text"
              placeholder="Nome da Matéria (Ex: Direito Penal)"
              value={nomeMateria}
              onChange={(e) => setNomeMateria(e.target.value)}
            />
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{color: 'var(--text-secondary)'}}>Dias:</span>
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((dia, index) => (
                <label key={index} style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
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
          return (
            <div key={materia.id} className="materia-card">
              <h4>{materia.nomeMateria}</h4>
              <p>Faltas: {materia.faltasCometidas} de {materia.totalFaltasPermitidas}</p>
              
              <div className="progress-bar">
                <div 
                  className={`progress-fill ${faltasPercent > 70 ? 'danger' : ''}`}
                  style={{ width: `${faltasPercent}%` }}>
                </div>
              </div>

              <p>Aulas assistidas: {materia.aulasAssistidas}</p>
              {/* Futuros botões de ação ("Faltei", "Presente") entrarão aqui */}
            </div>
          );
        }) : (
          <p style={{color: 'var(--text-secondary)'}}>Nenhuma matéria cadastrada ainda. Adicione uma no formulário acima!</p>
        )}
      </div>
    </div>
  );
}