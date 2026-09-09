import { useState } from 'react';
import axios from 'axios';
import './Login.css';
import {
  LockKeyhole,
  Mail,
  LogIn,
  AlertCircle,
  Trophy,
  ShieldCheck
} from 'lucide-react';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [pendingUser, setPendingUser] = useState(null);
  const [pendingToken, setPendingToken] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError('');

    try {
      const res = await axios.post(
        'https://info-sport.onrender.com/api/auth/login',
        {
          email,
          password
        }
      );

      if (res.data.mustChangePassword) {
        setPendingUser(res.data.user);
        setPendingToken(res.data.token);
        setMustChangePassword(true);
        setNewPassword('');
        setConfirmPassword('');
        return;
      }

      onLogin(res.data.user, res.data.token);

    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Erreur de connexion'
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError('');

    try {
      if (!pendingUser || !pendingToken) {
        throw new Error('Session invalide');
      }

      if (newPassword.length < 6) {
        throw new Error('Le nouveau mot de passe doit contenir au moins 6 caractères');
      }

      if (newPassword !== confirmPassword) {
        throw new Error('Les mots de passe ne correspondent pas');
      }

      await axios.patch(
        'https://info-sport.onrender.com/api/auth/change-password',
        {
          currentPassword: password,
          newPassword
        },
        {
          headers: { 'x-auth-token': pendingToken }
        }
      );

      onLogin({ ...pendingUser, mustChangePassword: false }, pendingToken);
      setMustChangePassword(false);
      setPendingUser(null);
      setPendingToken('');
      setPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        'Erreur lors du changement de mot de passe'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-modern">

      <div className="login-showcase">
        <div className="showcase-overlay" />
        <div className="showcase-content">
          <div className="showcase-logo">
            <Trophy size={25} />
          </div>
          <div className="showcase-brand">
            EQUIPE<span> S.I.G.R </span>
          </div>
          <div className="showcase-line" />
          <h1>
            Le football,
            <br />
            <strong>organisé simplement.</strong>
          </h1>
          <p>
            Organisez vos matchs, gérez les joueurs
            et créez vos équipes en quelques clics.
          </p>
          <div className="showcase-features">
            <div>
              <span>01</span>
              <p>Planifiez vos matchs</p>
            </div>
            <div>
              <span>02</span>
              <p>Gérez les participations</p>
            </div>
            <div>
              <span>03</span>
              <p>Formez vos équipes</p>
            </div>
          </div>
        </div>
        <div className="showcase-ball">⚽</div>
      </div>

      <div className="login-form-side">
        <div className="login-box">
          <div className="login-header">
            <div className="login-small-logo">⚽</div>
            <div>
              <span className="login-eyebrow">ESPACE JOUEUR</span>
              <h2>{mustChangePassword ? 'Première connexion' : 'Connexion'}</h2>
            </div>
          </div>

          <p className="login-description">
            {mustChangePassword
              ? 'Choisissez votre nouveau mot de passe pour sécuriser votre compte.'
              : 'Connectez-vous pour accéder à vos matchs et gérer votre participation.'}
          </p>

          {error && (
            <div className="modern-error">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {mustChangePassword ? (
            <form onSubmit={handlePasswordChange}>
              <div className="modern-field">
                <label htmlFor="newPassword">Nouveau mot de passe</label>
                <div className="modern-input">
                  <LockKeyhole size={18} />
                  <input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Choisissez un nouveau mot de passe"
                    autoComplete="new-password"
                    required
                  />
                </div>
              </div>

              <div className="modern-field">
                <label htmlFor="confirmPassword">Confirmer le mot de passe</label>
                <div className="modern-input">
                  <ShieldCheck size={18} />
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Répétez le nouveau mot de passe"
                    autoComplete="new-password"
                    required
                  />
                </div>
              </div>

              <button type="submit" className="modern-login-button" disabled={loading}>
                {loading ? (
                  <>
                    <span className="modern-spinner" />
                    Mise à jour...
                  </>
                ) : (
                  <>
                    <ShieldCheck size={18} />
                    Enregistrer le nouveau mot de passe
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="modern-field">
                <label htmlFor="email">Adresse email</label>
                <div className="modern-input">
                  <Mail size={18} />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="exemple@email.com"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div className="modern-field">
                <label htmlFor="password">Mot de passe</label>
                <div className="modern-input">
                  <LockKeyhole size={18} />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Votre mot de passe"
                    autoComplete="current-password"
                    required
                  />
                </div>
              </div>

              <button type="submit" className="modern-login-button" disabled={loading}>
                {loading ? (
                  <>
                    <span className="modern-spinner" />
                    Connexion...
                  </>
                ) : (
                  <>
                    <LogIn size={18} />
                    Se connecter
                  </>
                )}
              </button>
            </form>
          )}

          {mustChangePassword && (
            <button
              type="button"
              className="modern-login-button secondary"
              onClick={() => {
                setMustChangePassword(false);
                setError('');
                setNewPassword('');
                setConfirmPassword('');
              }}
              style={{ marginTop: 12 }}
            >
              <LogIn size={18} />
              Revenir à la connexion
            </button>
          )}

          {!mustChangePassword ? (
            <div className="login-security-note">
              <ShieldCheck size={16} />
              <span>Votre compte est protégé par une connexion sécurisée.</span>
            </div>
          ) : (
            <div className="login-security-note warning">
              <AlertCircle size={16} />
              <span>Première connexion : choisissez un nouveau mot de passe pour continuer.</span>
            </div>
          )}

          <div className="login-footer-help">
            <ShieldCheck size={14} />
            <span>Accès sécurisé à l’espace football</span>
          </div>

          <div className="login-bottom">
            <span>Pas encore de compte ?</span>
            <strong>Contactez votre administrateur</strong>
          </div>
        </div>

        <div className="login-footer-modern">INFO-SPORT © 2026 - Tous droits réservés</div>
      </div>
    </div>
  );
};

export default Login;
