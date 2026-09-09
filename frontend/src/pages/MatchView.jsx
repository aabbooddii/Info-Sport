import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import './MatchView.css';

import {
  ArrowLeft,
  CheckCircle,
  MapPinned,
  XCircle,
  Users,
} from 'lucide-react';
import {
  getGoogleMapsDirectionsUrl,
  getLocationText,
} from '../services/terrainService';
import { formatDateTimeLong } from '../utils/dateUtils';

const MatchView = ({ user }) => {
  const { id } = useParams();

  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [itineraryLoading, setItineraryLoading] = useState(false);
  const [goalInput, setGoalInput] = useState(0);
  const [adminNoteInput, setAdminNoteInput] = useState('');
  const [adminRatingInput, setAdminRatingInput] = useState(0);
  const [reviewDrafts, setReviewDrafts] = useState({});
  const [savingGoal, setSavingGoal] = useState(false);
  const [savingAdminReview, setSavingAdminReview] = useState(false);
  const [savingPlayerReview, setSavingPlayerReview] = useState(null);
  const [confirmingGoals, setConfirmingGoals] = useState(false);
  const [manOfMatchResults, setManOfMatchResults] = useState([]);
  const [myVote, setMyVote] = useState(null);
  const [voteSelection, setVoteSelection] = useState('');
  const [voting, setVoting] = useState(false);
  const [notationDrafts, setNotationDrafts] = useState({});

  // =========================================================
  // RÉCUPÉRER LE MATCH
  // =========================================================

  const fetchMatch = async () => {
    try {
      const token = localStorage.getItem('token');

      const res = await axios.get(
        `https://info-sport.onrender.com/api/matches/${id}`,
        {
          headers: {
            'x-auth-token': token,
          },
        }
      );

      setMatch(res.data);
      // fetch man of match votes
      fetchManOfMatch();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchManOfMatch = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`https://info-sport.onrender.com/api/matches/${id}/man-of-match`, {
        headers: { 'x-auth-token': token },
      });

      setManOfMatchResults(res.data.results || []);
      setMyVote(res.data.myVote || null);
      setVoteSelection(res.data.myVote ? res.data.myVote.votedParticipantId : '');
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMatch();
  }, [id]);

  useEffect(() => {
    if (!match) return;

    const currentParticipant = match.participants?.find(
      (p) => p.user?._id === user?.id
    );

    const nextDrafts = {};

    match.participants?.forEach((participant) => {
      const participantKey = participant.id || participant.user?._id;

      if (participantKey) {
        nextDrafts[participantKey] = {
          rating: participant.rating ?? 0,
          note: participant.note || '',
        };
      }
    });

    setGoalInput(currentParticipant?.goals ?? 0);
    setAdminNoteInput(match.adminNote || '');
    setAdminRatingInput(match.generalRating ?? 0);
    setReviewDrafts(nextDrafts);
  }, [match, user?.id]);

  // =========================================================
  // RSVP
  // =========================================================

  const handleRSVP = async (status) => {
    setActionLoading(true);

    try {
      const token = localStorage.getItem('token');

      await axios.post(
        `https://info-sport.onrender.com/api/matches/${id}/rsvp`,
        { status },
        {
          headers: {
            'x-auth-token': token,
          },
        }
      );

      await fetchMatch();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="match-loading">
        Chargement du match...
      </div>
    );
  }

  if (!match) {
    return (
      <div className="match-loading">
        Match introuvable
      </div>
    );
  }

  // =========================================================
  // DATE
  // =========================================================

  const formattedDate = formatDateTimeLong(match.date);
  const matchStatus = String(match.status || 'planifié').toLowerCase();
  const isMatchLocked = matchStatus === 'annulé' || matchStatus === 'terminé';

  // =========================================================
  // PARTICIPANTS
  // =========================================================

  const presents =
    match.participants?.filter(
      (p) => p.status === 'présent'
    ) || [];

  const absents =
    match.participants?.filter(
      (p) => p.status === 'absent'
    ) || [];

  const waitlist =
    match.participants?.filter(
      (p) => p.status === 'en_attente'
    ) || [];

  const myParticipant = match.participants?.find(
    (p) => p.user?._id === user?.id
  );

  // =========================================================
  // ÉQUIPES
  // =========================================================

  const isTeamsGenerated =
    match.teamA?.length > 0 &&
    match.teamB?.length > 0;

  // =========================================================
  // FORMATION
  // =========================================================

  const getFormationPositions = (team, side) => {
    if (!team || team.length === 0) return [];

    // Map textual positions to normalized roles
    const mapPos = (pos) => {
      if (!pos) return 'MID';
      const p = String(pos).toLowerCase();
      if (p.includes('gardi') || p.includes('goal')) return 'GK';
      if (p.includes('défen') || p.includes('defen') || p.includes('def')) return 'DEF';
      if (p.includes('mil') || p.includes('mid')) return 'MID';
      if (p.includes('atta') || p.includes('striker') || p.includes('forw')) return 'ATT';
      return 'MID';
    };

    // Define formation slots (1-2-3) for each side
    const slots = side === 'A'
      ? [
          { x: 10, y: 50, role: 'GK' },
          { x: 28, y: 35, role: 'DEF' },
          { x: 28, y: 65, role: 'DEF' },
          { x: 47, y: 20, role: 'ATT' },
          { x: 47, y: 50, role: 'ATT' },
          { x: 47, y: 80, role: 'ATT' },
        ]
      : [
          { x: 90, y: 50, role: 'GK' },
          { x: 72, y: 35, role: 'DEF' },
          { x: 72, y: 65, role: 'DEF' },
          { x: 53, y: 20, role: 'ATT' },
          { x: 53, y: 50, role: 'ATT' },
          { x: 53, y: 80, role: 'ATT' },
        ];

    // Clone and normalize team players
    const pool = team.map((p) => ({ ...(p || {}), mappedPos: mapPos(p.position), rating: p.rating || 0 }));

    // Group by mappedPos and sort by rating desc
    const groups = {
      GK: pool.filter((p) => p.mappedPos === 'GK').sort((a, b) => b.rating - a.rating),
      DEF: pool.filter((p) => p.mappedPos === 'DEF').sort((a, b) => b.rating - a.rating),
      MID: pool.filter((p) => p.mappedPos === 'MID').sort((a, b) => b.rating - a.rating),
      ATT: pool.filter((p) => p.mappedPos === 'ATT').sort((a, b) => b.rating - a.rating),
    };

    const taken = new Set();
    const pickForRole = (role) => {
      const order = role === 'GK' ? ['GK', 'DEF', 'MID', 'ATT']
        : role === 'DEF' ? ['DEF', 'MID', 'ATT', 'GK']
        : role === 'MID' ? ['MID', 'DEF', 'ATT', 'GK']
        : ['ATT', 'MID', 'DEF', 'GK'];

      for (const r of order) {
        const grp = groups[r];
        while (grp.length > 0) {
          const cand = grp.shift();
          if (!taken.has(cand._id)) {
            taken.add(cand._id);
            return cand;
          }
        }
      }

      // fallback: any remaining from pool
      const fallback = pool.find((p) => !taken.has(p._id));
      if (fallback) {
        taken.add(fallback._id);
        return fallback;
      }

      return null;
    };

    const assigned = [];
    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i];
      const player = pickForRole(slot.role);
      if (player) {
        assigned.push({ ...player, x: slot.x, y: slot.y, role: slot.role });
      }
    }

    return assigned;
  };

  const teamAPositions = getFormationPositions(
    match.teamA,
    'A'
  );

  const teamBPositions = getFormationPositions(
    match.teamB,
    'B'
  );

  // =========================================================
  // JOUEUR
  // =========================================================

  const getInitials = (name) => {
    if (!name) return 'U';

    return name
      .split(' ')
      .map((part) => part.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  // =========================================================
  // RÉSULTATS
  // =========================================================

  const saveMyGoals = async () => {
    if (!myParticipant) return;

    setSavingGoal(true);

    try {
      const token = localStorage.getItem('token');

      await axios.patch(
        `https://info-sport.onrender.com/api/matches/${id}/my-goals`,
        { goals: Number.parseInt(goalInput, 10) || 0 },
        {
          headers: {
            'x-auth-token': token,
          },
        }
      );

      await fetchMatch();
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.message || err.message || 'Erreur lors de l\'enregistrement des buts';
      alert(msg);
    } finally {
      setSavingGoal(false);
    }
  };

  const confirmGoals = async () => {
    setConfirmingGoals(true);

    try {
      const token = localStorage.getItem('token');

      await axios.patch(
        `https://info-sport.onrender.com/api/matches/${id}/confirm-goals`,
        {},
        {
          headers: {
            'x-auth-token': token,
          },
        }
      );

      await fetchMatch();
    } catch (err) {
      console.error(err);
    } finally {
      setConfirmingGoals(false);
    }
  };

  const saveAdminReview = async () => {
    setSavingAdminReview(true);

    try {
      const token = localStorage.getItem('token');

      await axios.patch(
        `https://info-sport.onrender.com/api/matches/${id}/admin-note`,
        {
          generalRating: Number(adminRatingInput),
          adminNote: adminNoteInput,
        },
        {
          headers: {
            'x-auth-token': token,
          },
        }
      );

      await fetchMatch();
    } catch (err) {
      console.error(err);
    } finally {
      setSavingAdminReview(false);
    }
  };

  const updateMatchStatus = async (nextStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `https://info-sport.onrender.com/api/matches/${id}/status`,
        { status: nextStatus },
        { headers: { 'x-auth-token': token } }
      );
      await fetchMatch();
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.message || 'Erreur lors de la mise à jour du statut';
      alert(msg);
    }
  };

  const savePlayerReview = async (participantId) => {
    const draft = reviewDrafts[participantId];

    if (!draft) return;

    setSavingPlayerReview(participantId);

    try {
      const token = localStorage.getItem('token');

      await axios.patch(
        `https://info-sport.onrender.com/api/matches/${id}/participants/${participantId}/evaluate`,
        {
          rating: Number(draft.rating),
          note: draft.note,
        },
        {
          headers: {
            'x-auth-token': token,
          },
        }
      );

      await fetchMatch();
    } catch (err) {
      console.error(err);
    } finally {
      setSavingPlayerReview(null);
    }
  };

  const submitVote = async () => {
    if (!voteSelection) return;
    setVoting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `https://info-sport.onrender.com/api/matches/${id}/man-of-match/vote`,
        { votedParticipantId: voteSelection },
        { headers: { 'x-auth-token': token } }
      );

      await fetchManOfMatch();
    } catch (err) {
      console.error(err);
    } finally {
      setVoting(false);
    }
  };

  const createNotation = async (participantId) => {
    const draft = notationDrafts[participantId] || { rating: 0, comment: '' };
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `https://info-sport.onrender.com/api/matches/${id}/participants/${participantId}/notation`,
        { rating: Number(draft.rating), comment: draft.comment },
        { headers: { 'x-auth-token': token } }
      );

      // clear draft
      setNotationDrafts((prev) => ({ ...prev, [participantId]: { rating: 0, comment: '' } }));
    } catch (err) {
      console.error(err);
    }
  };

  // =========================================================
  // ITINÉRAIRE
  // =========================================================

  const handleOpenItinerary = () => {
    const destination = getLocationText(match.location);

    if (!destination) {
      return;
    }

    const openMaps = (origin = null) => {
      const url = getGoogleMapsDirectionsUrl(destination, origin);
      window.open(url, '_blank', 'noopener,noreferrer');
    };

    if (!navigator.geolocation) {
      openMaps();
      return;
    }

    setItineraryLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        openMaps({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setItineraryLoading(false);
      },
      () => {
        openMaps();
        setItineraryLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="match-page animate-fade-in">

      {/* =====================================================
          RETOUR
      ====================================================== */}

      <Link
        to="/"
        className="btn btn-outline match-back-btn"
      >
        <ArrowLeft size={16} />
        Retour
      </Link>

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="match-header">

        <div>
          <h1 className="match-title">
            {formattedDate}
          </h1>

          <div className="match-meta">

            <span>
              📍 {match.location}
            </span>

            <span className="meta-separator">
              |
            </span>

            <span>
              👥 Format {match.format}v{match.format}
            </span>

            <span className="meta-separator">
              |
            </span>

            <span>
              🏷️ {matchStatus === 'planifié' ? 'Planifié' : matchStatus === 'annulé' ? 'Annulé' : 'Terminé'}
            </span>

          </div>
        </div>

        <button
          type="button"
          className="btn btn-primary itinerary-btn"
          onClick={handleOpenItinerary}
          disabled={itineraryLoading}
        >
          <MapPinned size={16} />
          {itineraryLoading ? 'Calcul...' : 'Itinéraire'}
        </button>

      </div>

      {/* =====================================================
          CONTENU
      ====================================================== */}

      <div className="match-layout">

        {/* ===================================================
            COLONNE PRINCIPALE
        ==================================================== */}

        <main className="match-main">

          {/* =================================================
              RSVP
          ================================================== */}

          <div className="glass-panel rsvp-card">

            <h2 className="section-title">
              Votre participation
            </h2>

            <div className="rsvp-buttons">

              <button
                onClick={() => handleRSVP('présent')}
                disabled={
                  actionLoading ||
                  myParticipant?.status === 'présent' ||
                  isMatchLocked
                }
                className={`btn rsvp-btn ${
                  myParticipant?.status === 'présent'
                    ? 'btn-primary'
                    : 'btn-outline'
                }`}
              >
                <CheckCircle size={20} />
                Je participe
              </button>

              <button
                onClick={() => handleRSVP('absent')}
                disabled={
                  actionLoading ||
                  myParticipant?.status === 'absent' ||
                  isMatchLocked
                }
                className={`btn rsvp-btn ${
                  myParticipant?.status === 'absent'
                    ? 'btn-danger'
                    : 'btn-outline'
                }`}
              >
                <XCircle size={20} />
                Je serai absent
              </button>

            </div>

            {isMatchLocked && (
              <div className="waiting-message">
                {matchStatus === 'annulé'
                  ? 'Ce match a été annulé.'
                  : 'Ce match est terminé.'}
              </div>
            )}

            {myParticipant?.status === 'en_attente' && (

              <div className="waiting-message">
                ⏳ Vous êtes sur liste d'attente.
                Vous serez promu si quelqu'un se désiste.
              </div>

            )}

          </div>

          {/* =================================================
              TERRAIN
          ================================================== */}

          {user?.role?.toLowerCase() === 'admin' && (
            <div className="glass-panel result-card">
              <h2 className="section-title">
                Validation du match
              </h2>

              <div className="admin-match-status-row">
                <label>Statut du match</label>
                <div className="notation-input-row">
                  <select
                    value={matchStatus}
                    onChange={(e) => updateMatchStatus(e.target.value)}
                    disabled={actionLoading}
                  >
                    <option value="planifié">Planifié</option>
                    <option value="annulé">Annulé</option>
                    <option value="terminé">Terminé</option>
                  </select>
                </div>
              </div>

              <div className="result-actions">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={confirmGoals}
                  disabled={confirmingGoals}
                >
                  {confirmingGoals ? 'Confirmation...' : 'Confirmer les buts'}
                </button>
              </div>

              <div className="player-review-list">
                {match.participants?.map((participant) => {
                  const participantKey = participant.id || participant.user?._id;
                  const draft = reviewDrafts[participantKey] || {
                    rating: participant.rating ?? 0,
                    note: participant.note || '',
                  };

                  return (
                    <div key={participantKey} className="player-review-item">
                      <div className="player-review-header">
                        <strong>{participant.user?.name || 'Joueur'}</strong>
                            <span>{participant.user?.position || 'Position'}</span>
                            {user?.role?.toLowerCase() === 'admin' && (
                              <span className="pending-goals-badge" style={{marginLeft:8, color: participant.goals > 0 && !participant.goalsConfirmed ? 'crimson' : 'inherit'}}>
                                {participant.goals > 0 ? `${participant.goals} but${participant.goals>1?'s':''}` : ''}
                                {!participant.goalsConfirmed && participant.goals > 0 ? ' (à confirmer)' : ''}
                              </span>
                            )}
                      </div>

                      <div className="player-review-inline">
                        <input
                          type="range"
                          min="0"
                          max="10"
                          value={draft.rating}
                          onChange={(e) =>
                            setReviewDrafts((prev) => ({
                              ...prev,
                              [participantKey]: {
                                ...(prev[participantKey] || {}),
                                rating: Number(e.target.value),
                              },
                            }))
                          }
                        />
                        <span className="rating-value">{draft.rating}/10</span>
                      </div>

                      <textarea
                        rows="2"
                        value={draft.note}
                        onChange={(e) =>
                          setReviewDrafts((prev) => ({
                            ...prev,
                            [participantKey]: {
                              ...(prev[participantKey] || {}),
                              note: e.target.value,
                            },
                          }))
                        }
                        placeholder="Note ou commentaire pour ce joueur"
                      />

                      <button
                        type="button"
                        className="btn btn-primary small-btn"
                        onClick={() => savePlayerReview(participantKey)}
                        disabled={savingPlayerReview === participantKey}
                      >
                        {savingPlayerReview === participantKey
                          ? 'Sauvegarde...'
                          : 'Valider'}
                      </button>

                      {user?.role?.toLowerCase() === 'admin' && (
                        <div className="admin-goals-edit">
                          <label>Modifier buts</label>
                          <div className="notation-input-row">
                            <input type="number" min="0" defaultValue={participant.goals || 0} id={`admin-goals-${participant.id}`} />
                            <button type="button" className="btn btn-outline small-btn" onClick={async () => {
                              const val = parseInt(document.getElementById(`admin-goals-${participant.id}`).value, 10) || 0;
                              try {
                                const token = localStorage.getItem('token');
                                await axios.patch(`https://info-sport.onrender.com/api/matches/${id}/participants/${participant.id}/goals`, { goals: val, confirm: true }, { headers: { 'x-auth-token': token } });
                                await fetchMatch();
                              } catch (err) {
                                console.error(err);
                                alert(err?.response?.data?.message || 'Erreur lors de la mise à jour des buts');
                              }
                            }}>Modifier & Confirmer</button>
                          </div>
                        </div>
                      )}

                      <div className="admin-notation-group">
                        <small>
                          Une seule note et un seul nombre de buts sont autorisés par joueur pour ce match.
                        </small>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="admin-note-group">
                <label>
                  Note générale du match
                </label>

                <input
                  type="range"
                  min="0"
                  max="10"
                  value={adminRatingInput}
                  onChange={(e) =>
                    setAdminRatingInput(Number(e.target.value))
                  }
                />

                <div className="rating-value">
                  {adminRatingInput}/10
                </div>

                <textarea
                  rows="3"
                  value={adminNoteInput}
                  onChange={(e) =>
                    setAdminNoteInput(e.target.value)
                  }
                  placeholder="Ajouter un commentaire général sur la rencontre"
                />

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={saveAdminReview}
                  disabled={savingAdminReview}
                >
                  {savingAdminReview ? 'Sauvegarde...' : 'Valider la note'}
                </button>
              </div>
            </div>
          )}

            {/* =================================================
                VOTE HOMME DU MATCH
            ==================================================*/}

            {match.status === 'terminé' && (
              <div className="glass-panel result-card">
                <h2 className="section-title">Homme du match</h2>

                <p>Votez pour le joueur qui a été le plus performant.</p>

                <div className="man-of-match-list">
                  {
                    (() => {
                      const candidates = (() => {
                        if (isTeamsGenerated) {
                          const ids = new Set([
                            ...(match.teamA || []).map((t) => t._id || t.id || (t.user?._id)),
                            ...(match.teamB || []).map((t) => t._id || t.id || (t.user?._id)),
                          ]);

                          return (match.participants || []).filter((p) => {
                            const pid = p.id || p.user?._id;
                            return pid && ids.has(pid);
                          });
                        }

                        return (match.participants || []).filter((p) => p.status === 'présent');
                      })();

                      return candidates.map((p) => {
                        const participantId = p.id || p.user?._id;
                        return (
                          <label key={participantId} className="man-of-match-item">
                            <input
                              type="radio"
                              name="manOfMatch"
                              value={String(participantId)}
                              checked={String(voteSelection) === String(participantId)}
                              onChange={(e) => setVoteSelection(e.target.value)}
                            />
                            {p.user?.name || p.name || 'Joueur'}
                            <span className="man-of-match-votes">{(manOfMatchResults.find((r) => String(r.participantId) === String(participantId))?.votes) || 0} votes</span>
                          </label>
                        );
                      });
                    })()
                  }
                </div>

                <div className="man-of-match-actions">
                  <button className="btn btn-primary" onClick={submitVote} disabled={voting || !voteSelection}>
                    {voting ? 'Vote en cours...' : myVote ? 'Modifier mon vote' : 'Voter'}
                  </button>
                </div>
              </div>
            )}

          {isTeamsGenerated ? (

            <div className="glass-panel pitch-card">

              <div className="pitch-header">

                <div>
                  <h2 className="section-title">
                    Compositions
                  </h2>

                  <p className="section-subtitle">
                    Formation 1 - 2 - 3
                  </p>
                </div>

                <div className="team-legend">

                  <div className="legend-item">
                    <span className="team-color-dot team-a-color" />
                    {match.teamAName || 'SIGR-1'}
                  </div>

                  <div className="legend-item">
                    <span className="team-color-dot team-b-color" />
                    {match.teamBName || 'SIGR-2'}
                  </div>

                </div>

              </div>

              <div className="football-pitch horizontal-pitch">

                <div className="pitch-grass" />
                <div className="pitch-border" />
                <div className="pitch-line-center" />
                <div className="pitch-circle" />
                <div className="pitch-center-dot" />

                <div className="penalty-area penalty-area-left" />
                <div className="penalty-area penalty-area-right" />
                {teamAPositions.map((player) => (

                  <div
                    key={`A-${player._id}`}
                    className="pitch-player"
                    style={{
                      left: `${player.x}%`,
                      top: `${player.y}%`,
                    }}
                  >

                    <div className="player-dot team-a">
                      {player.name
                        ?.substring(0, 2)
                        .toUpperCase()}
                    </div>

                    <div className="player-label">
                      {player.name}
                    </div>

                    <div className="player-role">
                      {player.role}
                    </div>

                  </div>

                ))}

                {/* ÉQUIPE B */}

                {teamBPositions.map((player) => (

                  <div
                    key={`B-${player._id}`}
                    className="pitch-player"
                    style={{
                      left: `${player.x}%`,
                      top: `${player.y}%`,
                    }}
                  >

                    <div className="player-dot team-b">
                      {player.name
                        ?.substring(0, 2)
                        .toUpperCase()}
                    </div>

                    <div className="player-label">
                      {player.name}
                    </div>

                    <div className="player-role">
                      {player.role}
                    </div>

                  </div>

                ))}

              </div>

            </div>

          ) : (

            <div className="glass-panel teams-empty">

              <Users size={48} />

              <p>
                Les équipes n'ont pas encore été générées
                par l'administrateur.
              </p>

            </div>

          )}

        </main>

        {/* ===================================================
            COLONNE DROITE
        ==================================================== */}

        <aside className="players-sidebar">

          {/* =================================================
              PRÉSENTS
          ================================================== */}

          <div className="glass-panel players-card">

            <div className="players-card-header">

              <div>
                <h3 className="players-title">
                  Joueurs présents
                </h3>

                <p className="players-subtitle">
                  Participants confirmés
                </p>
              </div>

              <div className="players-count players-count-success">
                <span>{presents.length}</span>
                <small>
                  / {match.format * 2}
                </small>
              </div>

            </div>

            <div className="players-list">

              {presents.map((p) => {

                const playerName =
                  p.user?.name || 'Joueur';

                return (
                  <div
                    key={p.user?._id}
                    className="player-list-item"
                  >

                    <div className="player-avatar player-avatar-success">
                      {getInitials(playerName)}
                    </div>

                    <div className="player-info">

                      <div className="player-name">
                        {playerName}
                      </div>

                      <div className="player-position">
                        {p.user?.position ||
                          'Position non définie'}
                      </div>

                    </div>

                    <div className="player-status status-present">
                      <CheckCircle size={14} />
                    </div>

                  </div>
                );
              })}

              {presents.length === 0 && (
                <div className="players-empty">
                  <Users size={24} />
                  <span>
                    Aucun joueur confirmé
                  </span>
                </div>
              )}

            </div>

          </div>

          {/* =================================================
              LISTE D'ATTENTE
          ================================================== */}

          {waitlist.length > 0 && (

            <div className="glass-panel players-card">

              <div className="players-card-header">

                <div>
                  <h3 className="players-title">
                    Liste d'attente
                  </h3>

                  <p className="players-subtitle">
                    En attente d'une place
                  </p>
                </div>

                <div className="players-count players-count-warning">
                  {waitlist.length}
                </div>

              </div>

              <div className="players-list">

                {waitlist.map((p, index) => {

                  const playerName =
                    p.user?.name || 'Joueur';

                  return (
                    <div
                      key={p.user?._id}
                      className="player-list-item"
                    >

                      <div className="waitlist-number">
                        #{index + 1}
                      </div>

                      <div className="player-avatar player-avatar-warning">
                        {getInitials(playerName)}
                      </div>

                      <div className="player-info">

                        <div className="player-name">
                          {playerName}
                        </div>

                        <div className="player-position">
                          {p.user?.position ||
                            'Position non définie'}
                        </div>

                      </div>

                      <div className="player-status status-waiting">
                        ⏳
                      </div>

                    </div>
                  );
                })}

              </div>

            </div>

          )}

          {/* =================================================
              ABSENTS
          ================================================== */}

          <div className="glass-panel players-card">

            <div className="players-card-header">

              <div>
                <h3 className="players-title">
                  Absents
                </h3>

                <p className="players-subtitle">
                  Joueurs indisponibles
                </p>
              </div>

              <div className="players-count players-count-danger">
                {absents.length}
              </div>

            </div>

            <div className="players-list">

              {absents.map((p) => {

                const playerName =
                  p.user?.name || 'Joueur';

                return (
                  <div
                    key={p.user?._id}
                    className="player-list-item player-absent"
                  >

                    <div className="player-avatar player-avatar-danger">
                      {getInitials(playerName)}
                    </div>

                    <div className="player-info">

                      <div className="player-name">
                        {playerName}
                      </div>

                      <div className="player-position">
                        {p.user?.position ||
                          'Position non définie'}
                      </div>

                    </div>

                    <div className="player-status status-absent">
                      <XCircle size={14} />
                    </div>

                  </div>
                );
              })}

              {absents.length === 0 && (
                <div className="players-empty">
                  <CheckCircle size={24} />
                  <span>
                    Aucun joueur absent
                  </span>
                </div>
              )}

            </div>

          </div>

        </aside>

      </div>

    </div>
  );
};

export default MatchView;
