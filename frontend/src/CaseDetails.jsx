import { useEffect, useState } from "react";

import {
  getCases,
  getCaseAnalyses,
  getReferenceImageUrl,
} from "./api";

import "./index.css";


function CaseDetails({
  caseId,
  onBack,
  onOpenCCTV,
}) {

  // ======================================================
  // STATE
  // ======================================================

  const [caseData, setCaseData] = useState(null);
  const [analyses, setAnalyses] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedImage, setSelectedImage] = useState(null);


  // ======================================================
  // LOAD CASE
  // ======================================================

  async function loadCase() {

    if (!caseId) {
      setError("No case selected.");
      setLoading(false);
      return;
    }

    try {

      setLoading(true);
      setError("");

      const casesResponse = await getCases();

      const allCases =
        casesResponse?.cases || [];

      const foundCase =
        allCases.find(
          item =>
            String(item.id) ===
            String(caseId)
        );

      if (!foundCase) {

        setError(
          `Case #${caseId} could not be found.`
        );

        setCaseData(null);
        setAnalyses([]);

        return;
      }

      setCaseData(foundCase);


      const analysisResponse =
        await getCaseAnalyses(caseId);

      setAnalyses(
        Array.isArray(
          analysisResponse?.analyses
        )
          ? analysisResponse.analyses
          : []
      );

    } catch (err) {

      console.error(
        "Case details error:",
        err
      );

      setError(
        err?.message ||
        "Could not load case details."
      );

    } finally {

      setLoading(false);

    }
  }


  // ======================================================
  // LOAD
  // ======================================================

  useEffect(() => {

    loadCase();

  }, [caseId]);


  // ======================================================
  // REFERENCE IMAGE URL
  // ======================================================

  function getReferenceImage(
    imagePath
  ) {

    if (
      !caseData ||
      !imagePath
    ) {
      return "";
    }

    const normalizedPath =
      String(imagePath)
        .replaceAll("\\", "/");

    const filename =
      normalizedPath
        .split("/")
        .pop();

    if (!filename) {
      return "";
    }

    return getReferenceImageUrl(
      caseData.id,
      filename
    );
  }


  // ======================================================
  // STATUS
  // ======================================================

  function getStatusLabel(
    status
  ) {

    if (status === "ready") {
      return "READY";
    }

    if (status === "created") {
      return "PROFILE NEEDED";
    }

    return String(
      status || "UNKNOWN"
    ).toUpperCase();
  }


  // ======================================================
  // PERCENTAGE
  // ======================================================

  function percentage(
    value
  ) {

    if (
      value === null ||
      value === undefined
    ) {
      return "--";
    }

    const number =
      Number(value);

    if (Number.isNaN(number)) {
      return "--";
    }

    return `${(
      number * 100
    ).toFixed(1)}%`;
  }


  // ======================================================
  // DATE
  // ======================================================

  function formatDate(
    value
  ) {

    if (!value) {
      return "Not provided";
    }

    try {

      return new Date(
        value
      ).toLocaleDateString(
        "en-IN",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }
      );

    } catch {

      return value;

    }
  }


  // ======================================================
  // STATISTICS
  // ======================================================

  const totalAnalyses =
    analyses.length;


  const totalPotentialMatches =
    analyses.reduce(
      (total, item) =>
        total +
        Number(
          item.potential_matches || 0
        ),
      0
    );


  const totalConfirmedSightings =
    analyses.reduce(
      (total, item) =>
        total +
        Number(
          item.confirmed_sightings || 0
        ),
      0
    );


  const bestSimilarity =
    analyses.length > 0
      ? Math.max(
          ...analyses.map(
            item =>
              Number(
                item.best_similarity || 0
              )
          )
        )
      : null;


  const referenceCount =
    caseData?.reference_images?.length || 0;


  // ======================================================
  // LOADING
  // ======================================================

  if (loading) {

    return (

      <div className="case-details-page">

        <div className="case-loading">

          <div className="loading-spinner" />

          <strong>
            Loading investigation
          </strong>

          <span>
            Retrieving case information...
          </span>

        </div>

      </div>

    );

  }


  // ======================================================
  // ERROR
  // ======================================================

  if (error || !caseData) {

    return (

      <div className="case-details-page">

        <div className="case-error">

          <div className="case-error-icon">
            !
          </div>

          <div>

            <strong>
              Unable to load case
            </strong>

            <span>
              {error || "Case not found."}
            </span>

          </div>

        </div>


        <button
          type="button"
          className="back-button"
          onClick={onBack}
        >
          ← Back to Cases
        </button>

      </div>

    );

  }


  // ======================================================
  // RENDER
  // ======================================================

  return (

    <div className="case-details-page">


      {/* ==================================================
          ACTION BAR
      ================================================== */}

      <div className="investigation-toolbar">

        <button
          type="button"
          className="back-button"
          onClick={onBack}
        >
          ← Back to Cases
        </button>


        <div className="toolbar-actions">

          <button
            type="button"
            className="secondary-button"
            onClick={loadCase}
            disabled={loading}
          >
            ↻ Refresh
          </button>


          <button
            type="button"
            className="primary-button"
            onClick={() =>
              onOpenCCTV?.(
                caseData.id
              )
            }
          >
            Analyze CCTV →
          </button>

        </div>

      </div>


      {/* ==================================================
          CASE HERO
      ================================================== */}

      <section className="case-hero">

        <div className="case-hero-main">

          <div className="case-id-label">
            CASE #{caseData.id}
          </div>


          <div className="case-name-row">

            <h1>
              {caseData.name}
            </h1>


            <span
              className={
                "case-status " +
                (
                  caseData.status === "ready"
                    ? "ready"
                    : "created"
                )
              }
            >
              <span className="status-dot-small" />

              {getStatusLabel(
                caseData.status
              )}
            </span>

          </div>


          <p>
            Missing-person investigation
            and AI detection profile.
          </p>

        </div>


        <div className="case-hero-summary">

          <div>

            <span>
              REFERENCES
            </span>

            <strong>
              {referenceCount}
            </strong>

          </div>


          <div>

            <span>
              CCTV SEARCHES
            </span>

            <strong>
              {totalAnalyses}
            </strong>

          </div>

        </div>

      </section>


      {/* ==================================================
          PERSON INFORMATION
      ================================================== */}

      <section className="investigation-card">

        <div className="investigation-card-header">

          <div>

            <div className="card-label">
              PERSON INFORMATION
            </div>

            <h2>
              Missing Person Profile
            </h2>

          </div>

        </div>


        <div className="person-profile-grid">

          <div className="profile-info">

            <span>
              FULL NAME
            </span>

            <strong>
              {caseData.name || "Not provided"}
            </strong>

          </div>


          <div className="profile-info">

            <span>
              AGE
            </span>

            <strong>
              {caseData.age ?? "Not provided"}
            </strong>

          </div>


          <div className="profile-info">

            <span>
              GENDER
            </span>

            <strong>
              {caseData.gender || "Not provided"}
            </strong>

          </div>


          <div className="profile-info">

            <span>
              LAST SEEN DATE
            </span>

            <strong>
              {formatDate(
                caseData.last_seen_date
              )}
            </strong>

          </div>


          <div className="profile-info profile-info-location">

            <span>
              LAST KNOWN LOCATION
            </span>

            <strong>
              {caseData.last_seen_location ||
                "Location not provided"}
            </strong>

          </div>


          {caseData.description && (

            <div className="profile-description">

              <span>
                DESCRIPTION
              </span>

              <p>
                {caseData.description}
              </p>

            </div>

          )}

        </div>

      </section>


      {/* ==================================================
          AI REFERENCE PROFILE
      ================================================== */}

      <section className="investigation-card">

        <div className="investigation-card-header">

          <div>

            <div className="card-label">
              AI REFERENCE PROFILE
            </div>

            <h2>
              Reference Images
            </h2>

            <p className="section-description">
              Images used by the AI system to
              identify the missing person in CCTV footage.
            </p>

          </div>


          <div className="profile-header-status">

            <div
              className={
                "profile-status " +
                (
                  caseData.reference_profile
                    ? "ready"
                    : "not-ready"
                )
              }
            >

              <span>
                {caseData.reference_profile
                  ? "✓"
                  : "!"}
              </span>

              {caseData.reference_profile
                ? "AI PROFILE READY"
                : "PROFILE NOT READY"}

            </div>

          </div>

        </div>


        {referenceCount > 0 ? (

          <>

            <div className="reference-toolbar">

              <span>
                {referenceCount} reference
                {referenceCount !== 1 ? "s" : ""}
                {" "}registered
              </span>

              {!caseData.reference_profile && (

                <span className="reference-warning">
                  Add enough reference images
                  before CCTV analysis.
                </span>

              )}

            </div>


            <div className="reference-gallery upgraded-gallery">

              {caseData.reference_images.map(
                (
                  imagePath,
                  index
                ) => {

                  const imageUrl =
                    getReferenceImage(
                      imagePath
                    );

                  return (

                    <button
                      type="button"
                      className="reference-item upgraded-reference-item"
                      key={
                        `${imagePath}-${index}`
                      }
                      onClick={() =>
                        setSelectedImage({
                          url: imageUrl,
                          index:
                            index + 1,
                        })
                      }
                    >

                      <img
                        src={imageUrl}
                        alt={
                          `Reference ${index + 1}`
                        }
                        loading="lazy"
                      />


                      <div className="reference-overlay">

                        <span>
                          Reference {index + 1}
                        </span>

                        <span>
                          View
                        </span>

                      </div>


                      <div className="reference-number">
                        {index + 1}
                      </div>

                    </button>

                  );

                }
              )}

            </div>

          </>

        ) : (

          <div className="reference-empty upgraded-empty">

            <div className="reference-empty-icon">
              +
            </div>

            <strong>
              No reference images
            </strong>

            <span>
              Add reference images before
              running CCTV analysis.
            </span>

          </div>

        )}

      </section>


      {/* ==================================================
          INVESTIGATION OVERVIEW
      ================================================== */}

      <div className="investigation-section-heading">

        <div>

          <div className="card-label">
            INVESTIGATION OVERVIEW
          </div>

          <h2>
            Detection Activity
          </h2>

        </div>

      </div>


      <section className="investigation-stats">

        <div className="investigation-stat">

          <div className="investigation-stat-icon">
            ◫
          </div>

          <div>

            <span>
              CCTV ANALYSES
            </span>

            <strong>
              {totalAnalyses}
            </strong>

            <small>
              Footage processed
            </small>

          </div>

        </div>


        <div className="investigation-stat">

          <div className="investigation-stat-icon">
            ◇
          </div>

          <div>

            <span>
              POTENTIAL MATCHES
            </span>

            <strong>
              {totalPotentialMatches}
            </strong>

            <small>
              Faces flagged by AI
            </small>

          </div>

        </div>


        <div className="investigation-stat">

          <div className="investigation-stat-icon">
            ◉
          </div>

          <div>

            <span>
              CONFIRMED SIGHTINGS
            </span>

            <strong>
              {totalConfirmedSightings}
            </strong>

            <small>
              Confirmed detections
            </small>

          </div>

        </div>


        <div className="investigation-stat">

          <div className="investigation-stat-icon">
            %
          </div>

          <div>

            <span>
              BEST MATCH
            </span>

            <strong>
              {percentage(
                bestSimilarity
              )}
            </strong>

            <small>
              Highest similarity
            </small>

          </div>

        </div>

      </section>


      {/* ==================================================
          CCTV HISTORY
      ================================================== */}

      <section className="investigation-card">

        <div className="investigation-card-header">

          <div>

            <div className="card-label">
              INVESTIGATION HISTORY
            </div>

            <h2>
              CCTV Analysis History
            </h2>

            <p className="section-description">
              Previous CCTV searches performed
              for this case.
            </p>

          </div>


          <button
            type="button"
            className="secondary-button"
            onClick={loadCase}
          >
            ↻ Refresh
          </button>

        </div>


        {analyses.length === 0 ? (

          <div className="analysis-empty">

            <div className="analysis-empty-icon">
              ◫
            </div>

            <strong>
              No CCTV searches yet
            </strong>

            <span>
              Upload CCTV footage to start
              searching for this person.
            </span>


            <button
              type="button"
              className="primary-button"
              disabled={
                !referenceCount
              }
              onClick={() =>
                onOpenCCTV?.(
                  caseData.id
                )
              }
            >

              {referenceCount
                ? "Analyze CCTV →"
                : "Add References First"}

            </button>

          </div>

        ) : (

          <div className="analysis-table">

            <div className="analysis-table-header">

              <span>
                ANALYSIS
              </span>

              <span>
                POTENTIAL
              </span>

              <span>
                CONFIRMED
              </span>

              <span>
                BEST MATCH
              </span>

              <span>
                STATUS
              </span>

            </div>


            {analyses.map(
              analysis => (

                <div
                  className="analysis-table-row"
                  key={
                    analysis.id ||
                    analysis.analysis_id
                  }
                >

                  <div className="analysis-identity">

                    <div className="analysis-status">
                      <span />
                    </div>

                    <div>

                      <strong>
                        {analysis.analysis_id}
                      </strong>

                      <small>
                        Video #{analysis.video_id}
                      </small>

                    </div>

                  </div>


                  <div className="analysis-value">

                    <strong>
                      {
                        analysis.potential_matches ??
                        0
                      }
                    </strong>

                    <span>
                      candidates
                    </span>

                  </div>


                  <div className="analysis-value">

                    <strong>
                      {
                        analysis.confirmed_sightings ??
                        0
                      }
                    </strong>

                    <span>
                      sightings
                    </span>

                  </div>


                  <div className="analysis-value">

                    <strong>
                      {percentage(
                        analysis.best_similarity
                      )}
                    </strong>

                    <span>
                      similarity
                    </span>

                  </div>


                  <div>

                    <span className="analysis-status-badge">
                      {
                        String(
                          analysis.status ||
                          "UNKNOWN"
                        ).toUpperCase()
                      }
                    </span>

                  </div>

                </div>

              )
            )}

          </div>

        )}

      </section>


      {/* ==================================================
          NEXT STEP
      ================================================== */}

      <section className="next-step-card">

        <div className="next-step-icon">
          AI
        </div>


        <div className="next-step-content">

          <div className="card-label">
            NEXT INVESTIGATION STEP
          </div>

          <h2>
            Search CCTV Footage
          </h2>

          <p>
            Upload CCTV footage and let the AI
            compare detected faces against this
            person's reference profile.
          </p>

        </div>


        <button
          type="button"
          className="primary-button next-step-button"
          disabled={!referenceCount}
          onClick={() =>
            onOpenCCTV?.(
              caseData.id
            )
          }
        >

          {referenceCount
            ? "Start CCTV Analysis →"
            : "Add References First"}

        </button>

      </section>


      {/* ==================================================
          IMAGE PREVIEW
      ================================================== */}

      {selectedImage && (

        <div
          className="image-preview-overlay"
          onClick={() =>
            setSelectedImage(null)
          }
        >

          <div
            className="image-preview-modal"
            onClick={event =>
              event.stopPropagation()
            }
          >

            <button
              type="button"
              className="image-preview-close"
              onClick={() =>
                setSelectedImage(null)
              }
            >
              ×
            </button>


            <img
              src={selectedImage.url}
              alt={
                `Reference ${selectedImage.index}`
              }
            />


            <div className="image-preview-caption">

              Reference {selectedImage.index}

            </div>

          </div>

        </div>

      )}

    </div>

  );

}


export default CaseDetails;
