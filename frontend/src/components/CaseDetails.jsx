import { useEffect, useState } from "react";

import {
  getCase,
  getCaseAnalyses,
  getConfirmedSightings,
  getEvidenceImageUrl,
} from "../cases";


export default function CaseDetails({
  caseId,
  onBack,
}) {

  const [caseData, setCaseData] = useState(null);

  const [analyses, setAnalyses] = useState([]);

  const [selectedAnalysis, setSelectedAnalysis] =
    useState(null);

  const [sightings, setSightings] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(null);


  // ====================================================
  // LOAD CASE
  // ====================================================

  async function loadCase() {

    try {

      setLoading(true);
      setError(null);

      const caseResponse =
        await getCase(caseId);

      const analysesResponse =
        await getCaseAnalyses(caseId);

      setCaseData(caseResponse);

      setAnalyses(
        analysesResponse.analyses || []
      );

      if (
        analysesResponse.analyses?.length > 0
      ) {

        setSelectedAnalysis(
          analysesResponse.analyses[0]
        );

      }

    } catch (err) {

      console.error(err);

      setError(
        err.message ||
        "Failed to load case."
      );

    } finally {

      setLoading(false);

    }
  }


  useEffect(() => {

    loadCase();

  }, [caseId]);


  // ====================================================
  // LOAD SIGHTINGS
  // ====================================================

  async function loadSightings(
    analysis
  ) {

    try {

      setSelectedAnalysis(
        analysis
      );

      const response =
        await getConfirmedSightings(
          caseId,
          analysis.analysis_id
        );

      setSightings(
        response.confirmed_sightings || []
      );

    } catch (err) {

      console.error(err);

      setSightings([]);

    }
  }


  // ====================================================
  // LOADING
  // ====================================================

  if (loading) {

    return (
      <div className="page-loading">
        Loading case...
      </div>
    );

  }


  // ====================================================
  // ERROR
  // ====================================================

  if (error) {

    return (
      <div className="page-error">

        <button
          onClick={onBack}
        >
          ← Back
        </button>

        <h2>
          Unable to load case
        </h2>

        <p>
          {error}
        </p>

      </div>
    );

  }


  // ====================================================
  // CASE NOT FOUND
  // ====================================================

  if (!caseData) {

    return (
      <div className="page-error">

        <button
          onClick={onBack}
        >
          ← Back
        </button>

        <h2>
          Case not found
        </h2>

      </div>
    );

  }


  const person =
    caseData.case ||
    caseData;


  return (

    <div className="case-details">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="case-header">

        <button
          className="back-button"
          onClick={onBack}
        >
          ← Back to Cases
        </button>

        <div>

          <div className="section-label">
            ACTIVE CASE
          </div>

          <h1>
            {person.name}
          </h1>

          <span>
            Case #{person.id}
          </span>

        </div>

      </div>


      {/* =================================================
          PERSON INFORMATION
      ================================================= */}

      <section className="case-card">

        <div className="section-label">
          MISSING PERSON
        </div>

        <h2>
          Person Information
        </h2>

        <div className="person-grid">

          <div>
            <span>Name</span>
            <strong>
              {person.name || "—"}
            </strong>
          </div>

          <div>
            <span>Age</span>
            <strong>
              {person.age ?? "—"}
            </strong>
          </div>

          <div>
            <span>Gender</span>
            <strong>
              {person.gender || "—"}
            </strong>
          </div>

          <div>
            <span>Last Seen Location</span>
            <strong>
              {person.last_seen_location || "—"}
            </strong>
          </div>

          <div>
            <span>Last Seen Date</span>
            <strong>
              {person.last_seen_date || "—"}
            </strong>
          </div>

        </div>

        {person.description && (

          <div className="description">

            <span>Description</span>

            <p>
              {person.description}
            </p>

          </div>

        )}

      </section>


      {/* =================================================
          ANALYSIS SUMMARY
      ================================================= */}

      <section className="case-card">

        <div className="section-label">
          CCTV ANALYSIS
        </div>

        <h2>
          Analysis History
        </h2>


        {analyses.length === 0 ? (

          <div className="empty-state">

            No CCTV analyses found.

          </div>

        ) : (

          <div className="analysis-list">

            {analyses.map(
              (analysis) => (

                <button
                  key={
                    analysis.analysis_id
                  }
                  className={
                    "analysis-row " +
                    (
                      selectedAnalysis
                        ?.analysis_id ===
                      analysis.analysis_id
                        ? "selected"
                        : ""
                    )
                  }
                  onClick={() =>
                    loadSightings(
                      analysis
                    )
                  }
                >

                  <div>

                    <strong>
                      {analysis.analysis_id}
                    </strong>

                    <small>
                      Video ID #{analysis.video_id}
                    </small>

                  </div>

                  <div>

                    <span>
                      Potential
                    </span>

                    <strong>
                      {
                        analysis.potential_matches
                      }
                    </strong>

                  </div>

                  <div>

                    <span>
                      Confirmed
                    </span>

                    <strong>
                      {
                        analysis.confirmed_sightings
                      }
                    </strong>

                  </div>

                  <div>

                    <span>
                      Best Match
                    </span>

                    <strong className="match-score">

                      {
                        analysis.best_similarity != null
                          ? (
                              analysis.best_similarity *
                              100
                            ).toFixed(1)
                          : "0.0"
                      }%

                    </strong>

                  </div>

                  <div>

                    <span
                      className="status-badge"
                    >
                      {analysis.status}
                    </span>

                  </div>

                </button>

              )
            )}

          </div>

        )}

      </section>


      {/* =================================================
          CONFIRMED SIGHTINGS
      ================================================= */}

      {selectedAnalysis && (

        <section className="case-card">

          <div className="section-label">
            ANALYSIS RESULT
          </div>

          <h2>
            Confirmed Sightings
          </h2>


          {sightings.length === 0 ? (

            <div className="empty-state">

              Select an analysis to view
              confirmed sightings.

            </div>

          ) : (

            <div className="sightings-grid">

              {sightings.map(
                (sighting) => {

                  const imageUrl =
                    getEvidenceImageUrl(
                      caseId,
                      selectedAnalysis.analysis_id,
                      sighting.evidence_image
                    );

                  return (

                    <div
                      className="sighting-card"
                      key={
                        sighting.sighting_id
                      }
                    >

                      <div className="evidence-image">

                        <img
                          src={imageUrl}
                          alt={
                            `Evidence frame ${
                              sighting.best_frame
                            }`
                          }
                        />

                        <div className="score">

                          {
                            (
                              sighting.best_similarity *
                              100
                            ).toFixed(1)
                          }%

                        </div>

                      </div>


                      <div className="sighting-info">

                        <h3>
                          Sighting #
                          {
                            sighting.sighting_id
                          }
                        </h3>

                        <div>

                          <span>
                            Time
                          </span>

                          <strong>
                            {
                              sighting.start_timestamp
                            }s
                            {" – "}
                            {
                              sighting.end_timestamp
                            }s
                          </strong>

                        </div>


                        <div>

                          <span>
                            Duration
                          </span>

                          <strong>
                            {
                              sighting.duration_seconds
                            }s
                          </strong>

                        </div>


                        <div>

                          <span>
                            Confirmations
                          </span>

                          <strong>
                            {
                              sighting.confirmation_count
                            }
                          </strong>

                        </div>


                        <div>

                          <span>
                            Best Frame
                          </span>

                          <strong>
                            {
                              sighting.best_frame
                            }
                          </strong>

                        </div>

                      </div>

                    </div>

                  );

                }
              )}

            </div>

          )}

        </section>

      )}

    </div>

  );
}