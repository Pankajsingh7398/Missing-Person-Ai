import { useEffect, useState } from "react";

import Cases from "./cases.jsx";
import CaseDetails from "./CaseDetails.jsx";

import {
  getCaseAnalyses,
  getAnalysis,
  getSightings,
  uploadCCTV,
  getEvidenceImageUrl,
} from "./api";

import "./index.css";


function App() {

  // ======================================================
  // APPLICATION NAVIGATION
  // ======================================================

  const [currentPage, setCurrentPage] =
    useState("dashboard");

  const [activeCaseId, setActiveCaseId] =
    useState(null);

  const [selectedCaseId, setSelectedCaseId] =
    useState(null);


  // ======================================================
  // DASHBOARD STATE
  // ======================================================

  const [caseId, setCaseId] =
    useState("1");

  const [analyses, setAnalyses] =
    useState([]);

  const [selectedAnalysis, setSelectedAnalysis] =
    useState(null);

  const [sightings, setSightings] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [uploading, setUploading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [selectedFile, setSelectedFile] =
    useState(null);


  // ======================================================
  // LOAD ANALYSES
  // ======================================================

  async function loadAnalyses() {

    if (!caseId) {
      setAnalyses([]);
      return;
    }

    try {

      setLoading(true);
      setError("");

      const data =
        await getCaseAnalyses(caseId);

      setAnalyses(
        Array.isArray(data?.analyses)
          ? data.analyses
          : []
      );

    } catch (err) {

      console.error(
        "Load analyses error:",
        err
      );

      setError(
        err?.message ||
        "Could not load analyses."
      );

      setAnalyses([]);

    } finally {

      setLoading(false);

    }
  }


  // ======================================================
  // LOAD SINGLE ANALYSIS
  // ======================================================

  async function openAnalysis(
    analysisId
  ) {

    if (!analysisId || !caseId) {
      return;
    }

    try {

      setLoading(true);
      setError("");

      const [
        analysisData,
        sightingsData,
      ] = await Promise.all([

        getAnalysis(
          caseId,
          analysisId
        ),

        getSightings(
          caseId,
          analysisId
        ),

      ]);


      setSelectedAnalysis(
        analysisData
      );


      setSightings(
        Array.isArray(
          sightingsData?.confirmed_sightings
        )
          ? sightingsData.confirmed_sightings
          : []
      );

    } catch (err) {

      console.error(
        "Open analysis error:",
        err
      );

      setError(
        err?.message ||
        "Could not load analysis."
      );

    } finally {

      setLoading(false);

    }
  }


  // ======================================================
  // LOAD ANALYSES WHEN DASHBOARD CASE CHANGES
  // ======================================================

  useEffect(() => {

    if (
      currentPage === "dashboard" &&
      caseId
    ) {

      loadAnalyses();

    }

  }, [
    currentPage,
    caseId,
  ]);


  // ======================================================
  // OPEN CASE DETAILS
  // ======================================================

  function handleOpenCase(
    selectedCaseIdValue
  ) {

    if (
      selectedCaseIdValue === null ||
      selectedCaseIdValue === undefined
    ) {
      return;
    }


    const id =
      String(selectedCaseIdValue);


    console.log(
      "Opening case details:",
      id
    );


    // Store selected case

    setSelectedCaseId(id);

    setActiveCaseId(id);

    setCaseId(id);


    // Clear dashboard-specific data

    setSelectedAnalysis(null);

    setSightings([]);

    setAnalyses([]);

    setSelectedFile(null);

    setError("");


    // Open Case Details page

    setCurrentPage(
      "case-details"
    );

  }


  // ======================================================
  // OPEN CASES PAGE
  // ======================================================

  function handleOpenCases() {

    setCurrentPage(
      "cases"
    );

    setSelectedAnalysis(null);

    setSightings([]);

    setError("");

  }


  // ======================================================
  // OPEN GENERAL DASHBOARD
  // ======================================================

  function handleOpenDashboard() {

    setCurrentPage(
      "dashboard"
    );

    setError("");

  }


  // ======================================================
  // OPEN CCTV ANALYSIS
  // ======================================================

  function handleOpenCCTV(
    requestedCaseId = null
  ) {

    const id =
      requestedCaseId !== null &&
        requestedCaseId !== undefined
        ? String(requestedCaseId)
        : (
          activeCaseId
            ? String(activeCaseId)
            : String(caseId || "1")
        );


    console.log(
      "Opening CCTV analysis for case:",
      id
    );


    setSelectedCaseId(id);

    setActiveCaseId(id);

    setCaseId(id);


    setSelectedAnalysis(null);

    setSightings([]);

    setAnalyses([]);

    setSelectedFile(null);

    setError("");


    setCurrentPage(
      "dashboard"
    );

  }


  // ======================================================
  // BACK TO CASE DETAILS
  // ======================================================

  function handleBackToCaseDetails() {

    if (!selectedCaseId) {

      setCurrentPage(
        "cases"
      );

      return;
    }


    setError("");

    setCurrentPage(
      "case-details"
    );

  }


  // ======================================================
  // UPLOAD CCTV
  // ======================================================

  async function handleUpload() {

    if (!selectedFile) {

      setError(
        "Please select a CCTV video first."
      );

      return;
    }


    if (!caseId) {

      setError(
        "Please select a case first."
      );

      return;
    }


    try {

      setUploading(true);

      setError("");


      const result =
        await uploadCCTV(
          caseId,
          selectedFile
        );


      console.log(
        "Upload result:",
        result
      );


      setSelectedFile(null);


      // --------------------------------------------------
      // Reset file input
      // --------------------------------------------------

      const fileInput =
        document.getElementById(
          "cctv-file"
        );


      if (fileInput) {
        fileInput.value = "";
      }


      // --------------------------------------------------
      // Refresh analyses
      // --------------------------------------------------

      await loadAnalyses();


      // --------------------------------------------------
      // Open newly created analysis
      // --------------------------------------------------

      if (result?.analysis_id) {

        await openAnalysis(
          result.analysis_id
        );

      }

    } catch (err) {

      console.error(
        "CCTV upload error:",
        err
      );

      setError(
        err?.message ||
        "CCTV analysis failed."
      );

    } finally {

      setUploading(false);

    }
  }


  // ======================================================
  // FORMAT TIMESTAMP
  // ======================================================

  function formatTimestamp(
    seconds
  ) {

    if (
      seconds === null ||
      seconds === undefined
    ) {
      return "--";
    }


    const number =
      Number(seconds);


    if (
      Number.isNaN(number)
    ) {
      return "--";
    }


    return `${number.toFixed(2)} sec`;

  }


  // ======================================================
  // FORMAT PERCENTAGE
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


    if (
      Number.isNaN(number)
    ) {
      return "--";
    }


    return `${(
      number * 100
    ).toFixed(1)}%`;

  }


  // ======================================================
  // SIDEBAR
  // ======================================================

  function renderSidebar() {

    return (

      <aside className="sidebar">

        {/* ==================================================
            BRAND
        ================================================== */}

        <div className="brand">

          <div className="brand-icon">
            AI
          </div>


          <div>

            <div className="brand-title">
              Missing Person
            </div>

            <div className="brand-subtitle">
              AI Detection System
            </div>

          </div>

        </div>


        {/* ==================================================
            NAVIGATION
        ================================================== */}

        <nav>

          <div className="nav-section">
            SYSTEM
          </div>


          {/* DASHBOARD */}

          <button
            type="button"
            className={
              "nav-item " +
              (
                currentPage === "dashboard" &&
                  !activeCaseId
                  ? "active"
                  : ""
              )
            }
            onClick={
              handleOpenDashboard
            }
          >

            <span>
              ▣
            </span>

            Dashboard

          </button>


          {/* CASES */}

          <button
            type="button"
            className={
              "nav-item " +
              (
                currentPage === "cases" ||
                  currentPage === "case-details"
                  ? "active"
                  : ""
              )
            }
            onClick={
              handleOpenCases
            }
          >

            <span>
              ◉
            </span>

            Cases

          </button>


          {/* CCTV ANALYSIS */}

          <button
            type="button"
            className={
              "nav-item " +
              (
                currentPage === "dashboard" &&
                  activeCaseId
                  ? "active"
                  : ""
              )
            }
            onClick={() =>
              handleOpenCCTV(
                activeCaseId || caseId
              )
            }
          >
            <span>
              ◫
            </span>

            CCTV Analysis
          </button>


          {/* ALERTS */}

          <button
            type="button"
            className="nav-item"
            onClick={() => {

              setError(
                "Alerts module is coming next."
              );

            }}
          >

            <span>
              ⚠
            </span>

            Alerts

          </button>


          <div className="nav-section">
            MANAGEMENT
          </div>


          {/* MISSING PERSONS */}

          <button
            type="button"
            className="nav-item"
            onClick={
              handleOpenCases
            }
          >

            <span>
              ◎
            </span>

            Missing Persons

          </button>


          {/* REPORTS */}

          <button
            type="button"
            className="nav-item"
            onClick={() => {

              setError(
                "Reports module is coming next."
              );

            }}
          >

            <span>
              ▤
            </span>

            Reports

          </button>

        </nav>


        {/* ==================================================
            SYSTEM STATUS & LOGOUT
        ================================================== */}

        <div className="sidebar-bottom" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>

          {/* LOGOUT */}

          <button
            type="button"
            className="nav-item logout-btn"
            style={{
              width: "100%",
              boxSizing: "border-box",
              background: "rgba(10, 30, 20, 0.5)",
              border: "1px solid rgba(0, 255, 127, 0.15)",
              color: "rgba(220, 255, 240, 0.8)",
              transition: "all 0.2s ease"
            }}
            onClick={() => {
              console.log("Logout clicked");
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#00ff7f";
              e.currentTarget.style.borderColor = "rgba(0, 255, 127, 0.4)";
              e.currentTarget.style.boxShadow = "0 0 10px rgba(0, 255, 127, 0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "rgba(220, 255, 240, 0.8)";
              e.currentTarget.style.borderColor = "rgba(0, 255, 127, 0.15)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <span>
              ⎋
            </span>
            Logout
          </button>

          <div className="system-status">

            <div className="status-dot" />

            <div>

              <strong>
                System Online
              </strong>

              <span>
                AI engine operational
              </span>

            </div>

          </div>

        </div>

      </aside>

    );

  }


  // ======================================================
  // HEADER
  // ======================================================

  function renderHeader() {

    const isCasesPage =
      currentPage === "cases";


    const isCaseDetailsPage =
      currentPage === "case-details";


    let label =
      "INVESTIGATION";


    let title =
      "CCTV Intelligence Dashboard";


    if (isCasesPage) {

      label =
        "CASE MANAGEMENT";

      title =
        "Missing Person Cases";

    }


    if (isCaseDetailsPage) {

      label =
        "CASE MANAGEMENT";

      title =
        `Case #${selectedCaseId || caseId}`;

    }


    return (

      <header className="header">

        <div>

          <div className="page-label">

            {label}

          </div>


          <h1 className="header-title">
            {isCasesPage ? (
              <>Missing Person <em>Cases</em></>
            ) : isCaseDetailsPage ? (
              <>Case <em>#{selectedCaseId || caseId}</em> Details</>
            ) : (
              <>CCTV <em>Intelligence</em> Dashboard</>
            )}
          </h1>

        </div>


        <div className="header-right">

          


          <button
            type="button"
            className="signin-btn"
            style={{
              padding: "6px 14px",
              borderRadius: "20px",
              fontSize: "12px",
              fontWeight: "600",
              background: "rgba(0, 255, 127, 0.1)",
              border: "1px solid rgba(0, 255, 127, 0.3)",
              color: "#00ff7f",
              cursor: "pointer",
              transition: "all 0.2s ease",
              boxShadow: "0 0 10px rgba(0, 255, 127, 0.05)",
            }}
            onClick={() => {
              console.log("Sign In clicked");
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(0, 255, 127, 0.2)";
              e.currentTarget.style.boxShadow = "0 0 15px rgba(0, 255, 127, 0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(0, 255, 127, 0.1)";
              e.currentTarget.style.boxShadow = "0 0 10px rgba(0, 255, 127, 0.05)";
            }}
          >
            Sign In
          </button>


          <div className="avatar">
            AI
          </div>

        </div>

      </header>

    );

  }


  // ======================================================
  // CASE MANAGEMENT PAGE
  // ======================================================

  function renderCasesPage() {

    return (

      <>

        {renderHeader()}


        <Cases
          onOpenCase={
            handleOpenCase
          }
        />

      </>

    );

  }


  // ======================================================
  // CASE DETAILS PAGE
  // ======================================================

  function renderCaseDetailsPage() {

    if (!selectedCaseId) {

      return (

        <>

          {renderHeader()}

          <div className="content">

            <div className="error-box">

              <strong>
                No Case Selected
              </strong>

              <span>
                Please select a case first.
              </span>

              <button
                type="button"
                onClick={
                  handleOpenCases
                }
              >
                Go to Cases
              </button>

            </div>

          </div>

        </>

      );

    }


    return (

      <>

        {renderHeader()}


        <CaseDetails
          caseId={
            selectedCaseId
          }

          onBack={
            handleOpenCases
          }

          onOpenCCTV={() =>
            handleOpenCCTV(
              selectedCaseId
            )
          }

        />

      </>

    );

  }


  // ======================================================
  // DASHBOARD PAGE
  // ======================================================

  function renderDashboardPage() {

    return (

      <>

        {renderHeader()}


        <div className="content">


          {/* =================================================
              ERROR
          ================================================= */}

          {error && (

            <div className="error-box">

              <strong>
                Error
              </strong>


              <span>
                {error}
              </span>


              <button
                type="button"
                onClick={() =>
                  setError("")
                }
                aria-label="Close error"
              >
                ×
              </button>

            </div>

          )}


          {/* =================================================
              ACTIVE CASE
          ================================================= */}

          <section className="control-card">

            <div>

              <div className="card-label">
                ACTIVE CASE
              </div>


              <h2>
                Missing Person Case
              </h2>


              {activeCaseId && (

                <p>
                  Currently investigating
                  Case #{activeCaseId}
                </p>

              )}

            </div>


            <div className="case-controls">

              <label>
                Case ID
              </label>


              <input
                value={caseId}
                onChange={(event) => {

                  const value =
                    event.target.value;


                  setCaseId(value);

                  setActiveCaseId(
                    value || null
                  );

                  setSelectedCaseId(
                    value || null
                  );

                  setSelectedAnalysis(
                    null
                  );

                  setSightings([]);

                  setAnalyses([]);

                }}
                placeholder="1"
              />


              <button
                type="button"
                className="secondary-button"
                onClick={() => {

                  setActiveCaseId(
                    caseId
                  );

                  setSelectedCaseId(
                    caseId
                  );

                  setSelectedAnalysis(
                    null
                  );

                  setSightings([]);

                  loadAnalyses();

                }}
                disabled={
                  loading ||
                  !caseId
                }
              >
                Load Case
              </button>

            </div>

          </section>


          {/* =================================================
              STATISTICS
          ================================================= */}

          <section className="stats-grid">


            {/* ANALYSES */}

            <div className="stat-card">

              <div className="stat-icon">
                ◫
              </div>


              <div>

                <span>
                  CCTV ANALYSES
                </span>


                <strong>
                  {analyses.length}
                </strong>

              </div>

            </div>


            {/* SIGHTINGS */}

            <div className="stat-card">

              <div className="stat-icon">
                ◉
              </div>


              <div>

                <span>
                  CONFIRMED SIGHTINGS
                </span>


                <strong>

                  {analyses.reduce(
                    (
                      total,
                      item
                    ) =>
                      total +
                      Number(
                        item.confirmed_sightings ||
                        0
                      ),
                    0
                  )}

                </strong>

              </div>

            </div>


            {/* BEST MATCH */}

            <div className="stat-card">

              <div className="stat-icon">
                %
              </div>


              <div>

                <span>
                  BEST MATCH
                </span>


                <strong>

                  {analyses.length > 0

                    ? percentage(
                      Math.max(
                        ...analyses.map(
                          item =>
                            Number(
                              item.best_similarity ||
                              0
                            )
                        )
                      )
                    )

                    : "--"}

                </strong>

              </div>

            </div>


            {/* STATUS */}

            <div className="stat-card">

              <div className="stat-icon">
                ✓
              </div>


              <div>

                <span>
                  SYSTEM STATUS
                </span>


                <strong className="online">
                  ONLINE
                </strong>

              </div>

            </div>

          </section>


          {/* =================================================
              CCTV UPLOAD
          ================================================= */}

          <section className="upload-card">

            <div className="upload-header">

              <div>

                <div className="card-label">
                  CCTV ANALYSIS
                </div>


                <h2>
                  Analyze New CCTV Footage
                </h2>


                <p>
                  Upload CCTV footage to compare
                  detected faces against the
                  registered missing-person
                  profile.
                </p>

              </div>


              <div className="upload-symbol">
                ↑
              </div>

            </div>


            <div className="upload-area">

              <input
                id="cctv-file"
                type="file"
                accept=".mp4,.avi,.mov,.mkv,.webm"
                onChange={(event) => {

                  setSelectedFile(
                    event.target.files?.[0] ||
                    null
                  );

                }}
              />


              <label
                htmlFor="cctv-file"
                className="file-label"
              >

                <div className="upload-icon">
                  ↑
                </div>


                <strong>

                  {selectedFile
                    ? selectedFile.name
                    : "Select CCTV video"}

                </strong>


                <span>
                  MP4, AVI, MOV, MKV or WEBM
                </span>

              </label>

            </div>


            <button
              type="button"
              className="primary-button"
              disabled={
                uploading ||
                !selectedFile ||
                !caseId
              }
              onClick={
                handleUpload
              }
            >

              {uploading
                ? "Analyzing CCTV..."
                : "Start AI Analysis"}

            </button>

          </section>


          {/* =================================================
              ANALYSIS HISTORY
          ================================================= */}

          <section className="analysis-section">

            <div className="section-header">

              <div>

                <div className="card-label">
                  ANALYSIS HISTORY
                </div>


                <h2>
                  CCTV Analyses
                </h2>

              </div>


              <button
                type="button"
                className="refresh-button"
                onClick={
                  loadAnalyses
                }
                disabled={
                  loading
                }
              >
                ↻ Refresh
              </button>

            </div>


            {/* LOADING */}

            {loading && (

              <div className="loading">
                Loading analysis data...
              </div>

            )}


            {/* EMPTY */}

            {!loading &&
              analyses.length === 0 && (

                <div className="empty">

                  <div>
                    ◫
                  </div>


                  <strong>
                    No CCTV analyses found
                  </strong>


                  <span>
                    Upload a CCTV video to begin.
                  </span>

                </div>

              )}


            {/* LIST */}

            {!loading &&
              analyses.length > 0 && (

                <div className="analysis-list">

                  {analyses.map(
                    (analysis) => (

                      <button
                        type="button"
                        key={
                          analysis.id ||
                          analysis.analysis_id
                        }
                        className={
                          "analysis-row " +
                          (
                            selectedAnalysis
                              ?.analysis
                              ?.analysis_id ===
                              analysis.analysis_id
                              ? "selected"
                              : ""
                          )
                        }
                        onClick={() =>
                          openAnalysis(
                            analysis.analysis_id
                          )
                        }
                      >

                        <div className="analysis-main">

                          <div className="analysis-status">
                            <span />
                          </div>


                          <div>

                            <strong>
                              {
                                analysis.analysis_id
                              }
                            </strong>


                            <small>
                              Video ID #
                              {
                                analysis.video_id
                              }
                            </small>

                          </div>

                        </div>


                        <div className="analysis-metric">

                          <span>
                            POTENTIAL
                          </span>


                          <strong>
                            {
                              analysis.potential_matches ??
                              0
                            }
                          </strong>

                        </div>


                        <div className="analysis-metric">

                          <span>
                            CONFIRMED
                          </span>


                          <strong>
                            {
                              analysis.confirmed_sightings ??
                              0
                            }
                          </strong>

                        </div>


                        <div className="analysis-metric">

                          <span>
                            BEST MATCH
                          </span>


                          <strong>
                            {percentage(
                              analysis.best_similarity
                            )}
                          </strong>

                        </div>


                        <div className="analysis-status-text">

                          <span>
                            {
                              analysis.status ||
                              "UNKNOWN"
                            }
                          </span>

                          →

                        </div>

                      </button>

                    )
                  )}

                </div>

              )}

          </section>


          {/* =================================================
              SELECTED ANALYSIS
          ================================================= */}

          {selectedAnalysis && (

            <section className="result-section">


              <div className="section-header">

                <div>

                  <div className="card-label">
                    ANALYSIS RESULT
                  </div>


                  <h2>
                    Confirmed Sightings
                  </h2>

                </div>


                <div className="completed-badge">
                  ✓ COMPLETED
                </div>

              </div>


              {/* SUMMARY */}

              <div className="result-summary">

                <div>

                  <span>
                    ANALYSIS ID
                  </span>


                  <strong>
                    {
                      selectedAnalysis
                        ?.analysis
                        ?.analysis_id
                    }
                  </strong>

                </div>


                <div>

                  <span>
                    POTENTIAL MATCHES
                  </span>


                  <strong>
                    {
                      selectedAnalysis
                        ?.analysis
                        ?.potential_matches ??
                      0
                    }
                  </strong>

                </div>


                <div>

                  <span>
                    CONFIRMED
                  </span>


                  <strong>
                    {
                      selectedAnalysis
                        ?.analysis
                        ?.confirmed_sightings ??
                      0
                    }
                  </strong>

                </div>


                <div>

                  <span>
                    BEST SIMILARITY
                  </span>


                  <strong>
                    {percentage(
                      selectedAnalysis
                        ?.analysis
                        ?.best_similarity
                    )}
                  </strong>

                </div>

              </div>


              {/* SIGHTINGS */}

              {sightings.length === 0 ? (

                <div className="no-sightings">

                  No confirmed sightings
                  were detected.

                </div>

              ) : (

                <div className="sightings-grid">

                  {sightings.map(
                    (sighting) => {

                      const imageUrl =
                        getEvidenceImageUrl(
                          caseId,
                          selectedAnalysis
                            ?.analysis
                            ?.analysis_id,
                          sighting.evidence_image
                        );


                      return (

                        <article
                          className="sighting-card"
                          key={
                            sighting.sighting_id
                          }
                        >

                          {/* IMAGE */}

                          <div className="evidence-image">

                            <img
                              src={imageUrl}
                              alt={
                                `Evidence ${sighting.sighting_id}`
                              }
                              onError={(event) => {

                                console.error(
                                  "Could not load evidence image:",
                                  imageUrl
                                );

                                event.currentTarget.style.display =
                                  "none";

                              }}
                            />


                            <div className="match-score">

                              {percentage(
                                sighting.best_similarity
                              )}

                            </div>

                          </div>


                          {/* BODY */}

                          <div className="sighting-body">

                            <div className="sighting-title">

                              <strong>
                                Sighting #
                                {
                                  sighting.sighting_id
                                }
                              </strong>


                              <span>
                                CONFIRMED
                              </span>

                            </div>


                            <div className="sighting-data">

                              <div>

                                <span>
                                  START
                                </span>


                                <strong>
                                  {formatTimestamp(
                                    sighting.start_timestamp
                                  )}
                                </strong>

                              </div>


                              <div>

                                <span>
                                  END
                                </span>


                                <strong>
                                  {formatTimestamp(
                                    sighting.end_timestamp
                                  )}
                                </strong>

                              </div>


                              <div>

                                <span>
                                  DURATION
                                </span>


                                <strong>
                                  {formatTimestamp(
                                    sighting.duration_seconds
                                  )}
                                </strong>

                              </div>


                              <div>

                                <span>
                                  CONFIRMATIONS
                                </span>


                                <strong>
                                  {
                                    sighting.confirmation_count ??
                                    0
                                  }
                                </strong>

                              </div>

                            </div>

                          </div>

                        </article>

                      );

                    }
                  )}

                </div>

              )}

            </section>

          )}

        </div>

      </>

    );

  }

  // ======================================================
  // MAIN RENDER
  // ======================================================

  return (

    <div className="app">

      {/* ==================================================
        SIDEBAR
    ================================================== */}

      {renderSidebar()}


      {/* ==================================================
        MAIN
    ================================================== */}

      <main className="main">

        {currentPage === "cases" ? (

          renderCasesPage()

        ) : currentPage === "case-details" ? (

          renderCaseDetailsPage()

        ) : (

          renderDashboardPage()

        )}

      </main>

    </div>

  );

}


export default App;