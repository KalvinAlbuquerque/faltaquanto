import { useState } from 'react';
import { auth } from '../firebase/config';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from 'firebase/auth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      // Mapeia alguns erros comuns do Firebase para mensagens em português
      switch (err.code) {
        case 'auth/invalid-email':
          setError('O formato do e-mail é inválido.');
          break;
        case 'auth/user-not-found':
          setError('Nenhum usuário encontrado com este e-mail.');
          break;
        case 'auth/wrong-password':
          setError('Senha incorreta. Tente novamente.');
          break;
        case 'auth/email-already-in-use':
          setError('Este e-mail já está em uso por outra conta.');
          break;
        case 'auth/weak-password':
            setError('A senha deve ter no mínimo 6 caracteres.');
            break;
        default:
          setError('Ocorreu um erro. Tente novamente.');
          break;
      }
    }
  };

  return (
    <div className="login-container">
      <div className="login-form-box">
        <h2 className="login-heading">{isLogin ? 'Faça login' : 'Crie sua conta'}</h2>
        <p className="login-subheading">para gerenciar suas faltas </p>

        <form onSubmit={handleSubmit} className="login-form">
          <input
            className="login-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
          />
          <input
            className="login-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Senha"
            required
          />
          <button type="submit" className="login-submit-button">
            {isLogin ? 'Entrar' : 'Cadastrar'}
          </button>
        </form>

        <p style={{ marginTop: '24px' }}>
          {isLogin ? 'Não tem uma conta? ' : 'Já tem uma conta? '}
          <button onClick={() => setIsLogin(!isLogin)} className="login-toggle-button">
            {isLogin ? 'Cadastre-se' : 'Faça login'}
          </button>
        </p>

        {error && <p className="login-error">{error}</p>}
      </div>
    </div>
  );
}