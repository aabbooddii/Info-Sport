import { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminPanel.css';
import { toInputLocal, formatDate, formatTime } from '../utils/dateUtils';
import {
  Plus,
  Users,
  Calendar as CalendarIcon,
  Play,
  MapPin,
  Clock,
  Shield,
  UserPlus,
  Trophy,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const AdminPanel = ({ user }) => {
  const [users, setUsers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  const defaultUser = {
    name: '',
    email: '',
    password: '',
    role: 'player',
    position: 'Milieu',
    rating: 50
  };

  const defaultMatch = {
    date: null,
    location: 'Terrain Principal',
    format: 6,
    pitchId: ''
  };

  const [newUser, setNewUser] = useState(defaultUser);
  const [newMatch, setNewMatch] = useState(defaultMatch);
  const [creatingUser, setCreatingUser] = useState(false);
  const [creatingMatch, setCreatingMatch] = useState(false);
  const [generatingMatch, setGeneratingMatch] = useState(null);
  const [pendingGoalsCount, setPendingGoalsCount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');

        const [usersRes, matchesRes] = await Promise.all([
          axios.get('https://info-sport.onrender.com/api/users', { headers: { 'x-auth-token': token } }),
          axios.get('https://info-sport.onrender.com/api/matches', { headers: { 'x-auth-token': token } })
        ]);

        setUsers(usersRes.data || []);
        setMatches(matchesRes.data || []);

        // compute pending goals count for admin notifications
        const pending = (matchesRes.data || []).reduce((acc, m) => {
          const c = (m.participants || []).filter(p => (p.goals || 0) > 0 && !p.goalsConfirmed).length;
          return acc + c;
        }, 0);
        setPendingGoalsCount(pending);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCreateMatch = async (e) => {
    e.preventDefault();
    try {
      setCreatingMatch(true);
      const token = localStorage.getItem('token');

      const payload = {
        date: newMatch.date ? newMatch.date.toISOString() : null,
        location: newMatch.location,
        format: newMatch.format
      };

      await axios.post('https://info-sport.onrender.com/api/matches', payload, { headers: { 'x-auth-token': token } });

      const res = await axios.get('https://info-sport.onrender.com/api/matches', { headers: { 'x-auth-token': token } });
      setMatches(res.data || []);
      setNewMatch(defaultMatch);
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la création du match');
    } finally {
      setCreatingMatch(false);
    }
  };

  const handleGenerateTeams = async (matchId) => {
    try {
      setGeneratingMatch(matchId);
      const token = localStorage.getItem('token');

      await axios.post(`https://info-sport.onrender.com/api/matches/${matchId}/generate-teams`, {}, { headers: { 'x-auth-token': token } });

      const res = await axios.get('https://info-sport.onrender.com/api/matches', { headers: { 'x-auth-token': token } });
      setMatches(res.data || []);
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la génération des équipes');
    } finally {
      setGeneratingMatch(null);
    }
  };

  const handleStatusUpdate = async (matchId, nextStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `https://info-sport.onrender.com/api/matches/${matchId}/status`,
        { status: nextStatus },
        { headers: { 'x-auth-token': token } }
      );

      const res = await axios.get('https://info-sport.onrender.com/api/matches', { headers: { 'x-auth-token': token } });
      setMatches(res.data || []);
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || 'Erreur lors de la mise à jour du statut du match');
    }
  };

  const finishedMatches = matches.filter((m) => {
    const status = String(m.status || '').toLowerCase();
    return status === 'terminé' || new Date(m.date) < new Date();
  });

  const upcomingMatches = matches.filter((m) => {
    const status = String(m.status || 'planifié').toLowerCase();
    return status !== 'annulé' && status !== 'terminé' && new Date(m.date) >= new Date();
  });
  const totalPlayers = users.filter(u => String(u.role || '').toLowerCase() === 'player').length;
  const totalAdmins = users.filter(u => String(u.role || '').toLowerCase() === 'admin').length;
  const generatedMatches = matches.filter(m => (m.teamA?.length || 0) > 0).length;

  return (
    <div className="admin-page">
      <div className="admin-grid">
        <div className="admin-left-column">

          <div className="admin-card">
            <div className="admin-card-header">
              <div className="admin-card-title-wrapper">
                <div className="admin-card-icon green">
                  <UserPlus size={18} />
                </div>
                <div>
                  <h3>Créer un joueur</h3>
                  <p>Ajoutez un nouvel utilisateur (joueur ou administrateur)</p>
                </div>
              </div>
            </div>

            <div className="admin-card-body">
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    setCreatingUser(true);
                    const token = localStorage.getItem('token');
                    const payload = {
                      name: newUser.name,
                      email: newUser.email,
                      password: newUser.password,
                      role: newUser.role,
                      position: newUser.position,
                      rating: Number(newUser.rating || 50)
                    };
                    await axios.post('https://info-sport.onrender.com/api/users', payload, { headers: { 'x-auth-token': token } });
                    const res = await axios.get('https://info-sport.onrender.com/api/users', { headers: { 'x-auth-token': token } });
                    setUsers(res.data || []);
                    setNewUser(defaultUser);
                    alert('Utilisateur créé');
                  } catch (err) {
                    console.error(err);
                    alert('Erreur lors de la création de l\'utilisateur');
                  } finally {
                    setCreatingUser(false);
                  }
                }}
              >

                <div className="admin-input-group">
                  <label>Nom</label>
                  <input type="text" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} required />
                </div>

                <div className="admin-input-group">
                  <label>Email</label>
                  <input type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} required />
                </div>

                <div className="admin-input-group">
                  <label>Mot de passe</label>
                  <input type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} required />
                </div>

                <div className="admin-input-group">
                  <label>Rôle</label>
                  <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}>
                    <option value="player">Joueur</option>
                    <option value="admin">Administrateur</option>
                  </select>
                </div>

                <div className="admin-input-group">
                  <label>Position</label>
                  <select value={newUser.position} onChange={(e) => setNewUser({ ...newUser, position: e.target.value })}>
                    <option>Gardien</option>
                    <option>Défenseur</option>
                    <option>Milieu</option>
                    <option>Attaquant</option>
                  </select>
                </div>

                <div className="admin-input-group">
                  <label>Rating</label>
                  <input type="number" min="0" max="100" value={newUser.rating} onChange={(e) => setNewUser({ ...newUser, rating: Number(e.target.value) })} />
                </div>

                <div className="admin-input-group">
                  <button type="submit" className="admin-submit-button green" disabled={creatingUser}>{creatingUser ? 'Création...' : 'Ajouter le joueur'}</button>
                </div>

              </form>
            </div>
          </div>

          <form
            onSubmit={handleCreateMatch}
            className="admin-form"
          >

            <div className="admin-input-group">

              <label>
                Date et heure
              </label>

              <div className="admin-input-with-icon">

                <CalendarIcon size={17} />

                <input
                  type="datetime-local"
                  value={toInputLocal(newMatch.date)}
                  onChange={(e) => {
                    const v = e.target.value;
                    setNewMatch({ ...newMatch, date: v ? new Date(v) : null });
                  }}
                  className="admin-input"
                  required
                />

              </div>

            </div>

            <div className="admin-input-group">

              <label>
                  Terrain du match
              </label>

              <div className="admin-input-with-icon">

                <MapPin size={17} />

                <input
                  type="text"
                  placeholder="Nom du terrain (ex: Terrain principal)"
                  value={newMatch.location}
                  onChange={(e) =>
                    setNewMatch({
                      ...newMatch,
                      location: e.target.value,
                      pitchId: ''
                    })
                  }
                  required
                />

              </div>

            </div>

            <div className="admin-input-group">

              <label>
                Format du match
              </label>

              <select
                value={newMatch.format}
                onChange={(e) =>
                  setNewMatch({
                    ...newMatch,
                    format: Number(e.target.value)
                  })
                }
              >

                <option value="5">5v5 — 10 joueurs</option>
                <option value="6">6v6 — 12 joueurs</option>
                <option value="7">7v7 — 14 joueurs</option>
                <option value="8">8v8 — 16 joueurs</option>
                <option value="9">9v9 — 18 joueurs</option>
                <option value="10">10v10 — 20 joueurs</option>
                <option value="11">11v11 — 22 joueurs</option>

              </select>

            </div>

            <div className="match-format-preview">
              <div className="format-preview-icon">
                <Users size={20} />
              </div>
              <div>
                <span>Nombre de joueurs</span>
                <strong>{newMatch.format * 2} joueurs</strong>
              </div>
              <div className="format-vs">{newMatch.format}v{newMatch.format}</div>
            </div>

            <button type="submit" className="admin-submit-button blue" disabled={creatingMatch}>
              {creatingMatch ? (
                <><span className="button-spinner" />Planification...</>
              ) : (
                <><CalendarIcon size={18} />Planifier le match</>
              )}
            </button>

          </form>

        </div>
      </div>

      <section className="admin-matches-section">
        <div className="admin-section-header">
          <div>
            <div className="admin-section-title">
              <CalendarIcon size={21} />
              <h2>Matchs planifiés</h2>
              {pendingGoalsCount > 0 && (
                <span className="pending-badge" style={{ marginLeft: 8, background: 'crimson', color: 'white', padding: '2px 6px', borderRadius: 12, fontSize: 12 }}>
                  {pendingGoalsCount}
                </span>
              )}
            </div>
            <p>Gérez les rencontres et générez les équipes.</p>
          </div>
          <div className="admin-section-count">
            {upcomingMatches.length} {upcomingMatches.length > 1 ? 'matchs' : 'match'}
          </div>
        </div>

        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Match</th>
                <th>Lieu</th>
                <th>Format</th>
                <th>Joueurs</th>
                <th>Statut</th>
                <th>Équipes</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {upcomingMatches.length === 0 ? (
                <tr><td colSpan="6" className="admin-empty-table"><CalendarIcon size={30} /><span>Aucun match planifié</span></td></tr>
              ) : (
                upcomingMatches.map((match) => {
                  const isGenerated = match.teamA?.length > 0 && match.teamB?.length > 0;
                  const presents = match.participants?.filter((p) => p.status === 'présent').length || 0;
                  const requiredPlayers = match.format * 2;
                  const isFull = presents >= requiredPlayers;

                  return (
                    <tr key={match._id}>
                      <td>
                        <div className="table-match">
                          <div className="table-date-icon"><CalendarIcon size={17} /></div>
                          <div>
                            <strong>{formatDate(match.date)}</strong>
                            <span><Clock size={12} />{formatTime(match.date)}</span>
                          </div>
                        </div>
                      </td>
                      <td><div className="table-location"><MapPin size={15} /><span>{match.location}</span></div></td>
                      <td><span className="format-badge">{match.format}v{match.format}</span></td>
                      <td>
                        <div className="table-players"><strong className={isFull ? 'full' : ''}>{presents}</strong><span>/ {requiredPlayers}</span></div>
                        <div className="table-progress"><div className={isFull ? 'full' : ''} style={{ width: `${Math.min((presents / requiredPlayers) * 100, 100)}%` }} /></div>
                      </td>
                      <td>
                        <select value={String(match.status || 'planifié')} onChange={(e) => handleStatusUpdate(match._id, e.target.value)}>
                          <option value="planifié">Planifié</option>
                          <option value="annulé">Annulé</option>
                          <option value="terminé">Terminé</option>
                        </select>
                      </td>
                      <td>{isGenerated ? <span className="admin-status generated"><CheckCircle size={14} />Générées</span> : <span className="admin-status waiting"><AlertCircle size={14} />En attente</span>}</td>
                      <td>
                        <button onClick={() => handleGenerateTeams(match._id)} disabled={isGenerated || !isFull || generatingMatch === match._id || String(match.status || 'planifié').toLowerCase() !== 'planifié'} className={`generate-button ${isGenerated ? 'generated' : ''}`} title={!isFull ? `Il faut ${requiredPlayers} joueurs présents` : isGenerated ? 'Équipes déjà générées' : 'Générer les équipes'}>
                          {generatingMatch === match._id ? <span className="button-spinner" /> : isGenerated ? <CheckCircle size={15} /> : <Play size={15} />}
                          {isGenerated ? 'Générées' : generatingMatch === match._id ? 'Génération...' : 'Générer'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="admin-mobile-matches">
          {upcomingMatches.length === 0 ? (
            <div className="admin-mobile-empty">Aucun match planifié.</div>
          ) : (
            upcomingMatches.map((match) => {
              const isGenerated = match.teamA?.length > 0 && match.teamB?.length > 0;
              const presents = match.participants?.filter((p) => p.status === 'présent').length || 0;
              const requiredPlayers = match.format * 2;
              const isFull = presents >= requiredPlayers;

              return (
                <div key={match._id} className="admin-mobile-card">
                  <div className="mobile-card-top">
                    <div>
                      <strong>{formatDate(match.date)}</strong>
                      <span><Clock size={13} />{formatTime(match.date)}</span>
                    </div>
                    <span className="format-badge">{match.format}v{match.format}</span>
                  </div>
                  <div className="mobile-card-location"><MapPin size={15} />{match.location}</div>
                  <div className="mobile-card-players"><div><Users size={16} /><span>Joueurs présents</span></div><strong className={isFull ? 'full' : ''}>{presents}/{requiredPlayers}</strong></div>
                  <div className="table-progress"><div className={isFull ? 'full' : ''} style={{ width: `${Math.min((presents / requiredPlayers) * 100, 100)}%` }} /></div>
                  <div className="mobile-card-bottom">{isGenerated ? <span className="admin-status generated"><CheckCircle size={14} />Équipes générées</span> : <span className="admin-status waiting"><AlertCircle size={14} />En attente</span>}
                    <button onClick={() => handleGenerateTeams(match._id)} disabled={isGenerated || !isFull || generatingMatch === match._id} className={`generate-button ${isGenerated ? 'generated' : ''}`}>{generatingMatch === match._id ? <span className="button-spinner" /> : <Play size={15} />}{isGenerated ? 'Générées' : 'Générer'}</button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {finishedMatches.length > 0 && (
        <section className="admin-matches-section">
          <div className="admin-section-header">
            <div>
              <div className="admin-section-title"><Trophy size={21} /><h2>Matchs terminés</h2></div>
              <p>Notes des joueurs et appréciation globale de la rencontre.</p>
            </div>
            <div className="admin-section-count">{finishedMatches.length} {finishedMatches.length > 1 ? 'matchs' : 'match'}</div>
          </div>

          <div className="admin-finished-matches">
            <div className="table-container">
              <table>
                <thead><tr><th>Notes</th><th>Match</th><th>Joueurs</th></tr></thead>
                <tbody>
                  {finishedMatches.map((match) => {
                    const matchParticipants = match.participants || [];
                    return (
                      <tr key={match._id}>
                        <td>
                          {matchParticipants.some((p) => p.note) && (<div><strong>Notes joueurs :</strong>{matchParticipants.filter((p) => p.note).map((p) => (<div key={p.userId || p.id} className="finished-player-note"><span>{p.user?.name || 'Joueur'} :</span><p>{p.note}</p></div>))}</div>)}
                          {match.adminNote && (<div className="finished-match-note"><strong>Note admin :</strong><p>{match.adminNote}</p></div>)}
                        </td>
                        <td><div><strong>{formatDate(match.date)}</strong><div><Clock size={13} /> {formatTime(match.date)}</div><div className="finished-match-location"><MapPin size={13} /> {match.location}</div></div><div className="finished-match-rating">{typeof match.generalRating === 'number' ? `${match.generalRating}/10` : '—'}</div></td>
                        <td>{matchParticipants.length > 0 ? matchParticipants.map((participant) => (<div key={participant.userId || participant.id} className="finished-player-row"><span>{participant.user?.name || participant.name || 'Joueur'}</span><div className="finished-player-meta"><strong>{participant.goals || 0} but{participant.goals > 1 ? 's' : ''}</strong><small>{participant.rating || 0}/10</small></div></div>)) : (<div className="finished-player-row empty">Aucun joueur</div>)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      <div className="admin-footer-stats">
        <div><Users size={17} /><span>{totalPlayers} joueurs</span></div>
        <div><Shield size={17} /><span>{totalAdmins} administrateurs</span></div>
        <div><Trophy size={17} /><span>{generatedMatches} équipes générées</span></div>
      </div>

    </div>
  );
};

export default AdminPanel;
