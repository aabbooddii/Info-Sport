import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Dashboard.css';
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  ArrowRight,
  Trophy,
  Sparkles
} from 'lucide-react';
import { formatDate, formatTime } from '../utils/dateUtils';

const Dashboard = ({ user }) => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const plannedMatches = matches.filter(
    (match) => String(match.status || 'planifié').toLowerCase() === 'planifié'
  );

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const token = localStorage.getItem('token');

        const res = await axios.get(
          'https://info-sport.onrender.com/api/matches',
          {
            headers: {
              'x-auth-token': token
            }
          }
        );

        setMatches(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, []);

  // =========================================================
  // STATUT DE L'UTILISATEUR
  // =========================================================

  const getMyStatus = (match) => {
    const participant = match.participants?.find(
      (p) => {
        const participantId =
          typeof p.user === 'object'
            ? p.user?._id
            : p.user;

        return participantId === user?.id;
      }
    );

    return participant?.status || null;
  };

  // =========================================================
  // BADGE STATUT
  // =========================================================

  const renderStatusBadge = (status) => {
    if (status === 'présent') {
      return (
        <span className="dashboard-status status-present">
          <span className="status-dot" />
          Présent
        </span>
      );
    }

    if (status === 'absent') {
      return (
        <span className="dashboard-status status-absent">
          <span className="status-dot" />
          Absent
        </span>
      );
    }

    if (status === 'en_attente') {
      return (
        <span className="dashboard-status status-waiting">
          <span className="status-dot" />
          En attente
        </span>
      );
    }

    return (
      <span className="dashboard-status status-none">
        À confirmer
      </span>
    );
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="dashboard-page">

        <div className="dashboard-header">
          <div className="skeleton skeleton-title" />
          <div className="skeleton skeleton-subtitle" />
        </div>

        <div className="dashboard-grid">

          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="dashboard-match-card"
            >
              <div className="skeleton skeleton-date" />
              <div className="skeleton skeleton-line" />
              <div className="skeleton skeleton-line small" />
              <div className="skeleton skeleton-button" />
            </div>
          ))}

        </div>

      </div>
    );
  }

  return (
    <div className="dashboard-page animate-fade-in">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="dashboard-header">

        <div>

          <div className="dashboard-welcome">

            <span className="welcome-icon">
              <Sparkles size={16} />
            </span>

            <span>
              Bienvenue sur votre espace joueur
            </span>

          </div>

          <h1 className="dashboard-title">

            Bonjour,{' '}

            <span className="dashboard-name">
              {user?.name}
            </span>

            <span className="dashboard-wave">
              👋
            </span>

          </h1>

          <p className="dashboard-subtitle">
            Retrouvez vos prochains matchs et gérez
            facilement votre participation.
          </p>

        </div>

        {/* Petit bloc statistiques */}

        <div className="dashboard-summary">

          <div className="summary-icon">
            <Trophy size={22} />
          </div>

          <div>
            <span className="summary-label">
              Matchs planifiés
            </span>

            <strong className="summary-value">
              {plannedMatches.length}
            </strong>
          </div>

        </div>

      </div>


      {/* =====================================================
          SECTION MATCHS
      ====================================================== */}

      <section className="matches-section">

        <div className="section-heading">

          <div>

            <h2>
              <Calendar size={21} />
              Prochains matchs
            </h2>

            <p>
              Vos rencontres à venir
            </p>

          </div>

          {plannedMatches.length > 0 && (
            <span className="matches-count">
              {plannedMatches.length}{' '}
              {plannedMatches.length > 1
                ? 'matchs'
                : 'match'}
            </span>
          )}

        </div>


        {/* ===================================================
            AUCUN MATCH
        ==================================================== */}

        {plannedMatches.length === 0 ? (

          <div className="empty-matches">

            <div className="empty-icon">
              <Calendar size={32} />
            </div>

            <h3>
              Aucun match planifié
            </h3>

            <p>
              Il n'y a aucun match prévu pour le moment.
              Revenez bientôt pour découvrir les prochaines
              rencontres.
            </p>

          </div>

        ) : (

          /* =================================================
             LISTE DES MATCHS
          ================================================== */

          <div className="dashboard-grid">

            {plannedMatches.map((match) => {

              const formattedDate = formatDate(match.date, { weekday: 'short', day: 'numeric', month: 'short' });

              const formattedTime = formatTime(match.date);

              const myStatus =
                getMyStatus(match);

              const participantsCount =
                match.participants?.filter(
                  (p) => p.status === 'présent'
                ).length || 0;

              const totalPlayers =
                match.format * 2;

              return (

                <article
                  key={match._id}
                  className="dashboard-match-card"
                >

                  {/* =================================================
                      TOP CARD
                  ================================================== */}

                  <div className="match-card-top">

                    <div className="match-date-box">

                      <Calendar size={18} />

                      <div>

                        <span className="match-date-label">
                          MATCH
                        </span>

                        <strong>
                          {formattedDate}
                        </strong>

                      </div>

                    </div>

                    {renderStatusBadge(myStatus)}

                  </div>


                  {/* =================================================
                      HEURE
                  ================================================== */}

                  <div className="match-time">

                    <Clock size={17} />

                    <span>
                      {formattedTime}
                    </span>

                  </div>


                  {/* =================================================
                      INFOS
                  ================================================== */}

                  <div className="match-info-list">

                    <div className="match-info">

                      <div className="info-icon location">
                        <MapPin size={17} />
                      </div>

                      <div>
                        <span>
                          Lieu
                        </span>

                        <strong>
                          {match.location}
                        </strong>
                      </div>

                    </div>


                    <div className="match-info">

                      <div className="info-icon players">
                        <Users size={17} />
                      </div>

                      <div>

                        <span>
                          Format
                        </span>

                        <strong>
                          {match.format}v{match.format}
                        </strong>

                      </div>

                    </div>

                  </div>


                  {/* =================================================
                      PARTICIPANTS
                  ================================================== */}

                  <div className="match-participants">

                    <div className="participants-left">

                      <div className="participant-avatars">

                        {match.participants
                          ?.filter(
                            (p) =>
                              p.status === 'présent'
                          )
                          .slice(0, 4)
                          .map((p, index) => {

                            const name =
                              typeof p.user === 'object'
                                ? p.user?.name
                                : '';

                            return (
                              <div
                                key={
                                  p.user?._id ||
                                  index
                                }
                                className="participant-avatar"
                                title={name}
                              >
                                {name
                                  ?.substring(0, 1)
                                  .toUpperCase() || '?'}
                              </div>
                            );
                          })}

                      </div>

                      <span>
                        {participantsCount}/
                        {totalPlayers} joueurs
                      </span>

                    </div>

                    <div className="participants-progress">

                      <div
                        className="progress-fill"
                        style={{
                          width: `${Math.min(
                            (participantsCount /
                              totalPlayers) *
                              100,
                            100
                          )}%`
                        }}
                      />

                    </div>

                  </div>


                  {/* =================================================
                      BOUTON
                  ================================================== */}

                  <Link
                    to={`/match/${match._id}`}
                    className="match-details-button"
                  >

                    <span>
                      Voir les détails
                    </span>

                    <ArrowRight size={18} />

                  </Link>

                </article>

              );
            })}

          </div>

        )}

      </section>

    </div>
  );
};

export default Dashboard;
