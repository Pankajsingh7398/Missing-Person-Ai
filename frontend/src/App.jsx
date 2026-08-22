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

  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);


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
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
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
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>
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
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 10 4.553-2.276A1 1 0 0 1 21 8.618v6.764a1 1 0 0 1-1.447.894L15 14M5 18h8a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2Z"/></svg>
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
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
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
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
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
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/></svg>
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
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
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

        {/* Desktop Header Left */}
        <div className="header-left-desktop">
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

        {/* Mobile & Tablet Header Left (Profile Option) */}
        <div className="header-left-mobile">
          <button
            type="button"
            className="mobile-profile-btn"
            onClick={() => {
              console.log("Profile clicked");
            }}
          >
            <div className="avatar">AI</div>
            <span>Profile</span>
          </button>
        </div>

        {/* Mobile & Tablet Header Title */}
        <div className="header-title-mobile">
          {isCasesPage ? (
            "Cases"
          ) : isCaseDetailsPage ? (
            `Case #${selectedCaseId || caseId}`
          ) : (
            "CCTV Intelligence"
          )}
        </div>

        {/* Desktop Header Right */}
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

        {/* Mobile & Tablet Header Right (Burger Menu Button) */}
        <div className="header-right-mobile">
          <button
            type="button"
            className="mobile-burger-btn"
            aria-label="Toggle navigation menu"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              {mobileMenuOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="4" y1="6" x2="20" y2="6" />
                  <line x1="4" y1="12" x2="20" y2="12" />
                  <line x1="4" y1="18" x2="20" y2="18" />
                </>
              )}
            </svg>
          </button>
        </div>

      </header>

    );

  }


  // ======================================================
  // MOBILE / TABLET BURGER DRAWER MENU
  // ======================================================

  function renderMobileMenu() {

    if (!mobileMenuOpen) return null;

    return (

      <div className="mobile-menu-overlay" onClick={() => setMobileMenuOpen(false)}>

        <div className="mobile-menu-drawer" onClick={(e) => e.stopPropagation()}>

          <div className="mobile-menu-header">

            <div className="brand" style={{ height: "auto", borderBottom: "none", padding: 0 }}>
              <div className="brand-icon">MP</div>
              <div>
                <div className="brand-title">Missing Person</div>
                <div className="brand-subtitle">AI Intelligence</div>
              </div>
            </div>

            <button
              type="button"
              className="mobile-menu-close-btn"
              onClick={() => setMobileMenuOpen(false)}
            >
              ✕
            </button>

          </div>


          <nav className="mobile-menu-nav">

            <div className="nav-section">
              MAIN
            </div>

            <button
              type="button"
              className={`nav-item ${currentPage === "dashboard" && !activeCaseId ? "active" : ""}`}
              onClick={() => {
                setCurrentPage("dashboard");
                setMobileMenuOpen(false);
              }}
            >
              <span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              </span>
              Dashboard
            </button>

            <button
              type="button"
              className={`nav-item ${currentPage === "cases" ? "active" : ""}`}
              onClick={() => {
                handleOpenCases();
                setMobileMenuOpen(false);
              }}
            >
              <span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>
              </span>
              Cases
            </button>


            <button
              type="button"
              className={`nav-item ${currentPage === "dashboard" && activeCaseId ? "active" : ""}`}
              onClick={() => {
                handleOpenCCTV(activeCaseId || caseId);
                setMobileMenuOpen(false);
              }}
            >
              <span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 10 4.553-2.276A1 1 0 0 1 21 8.618v6.764a1 1 0 0 1-1.447.894L15 14M5 18h8a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2Z"/></svg>
              </span>
              CCTV Analysis
            </button>


            <button
              type="button"
              className="nav-item"
              onClick={() => {
                setError("Alerts module is coming next.");
                setMobileMenuOpen(false);
              }}
            >
              <span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
              </span>
              Alerts
            </button>


            <div className="nav-section">
              MANAGEMENT
            </div>

            <button
              type="button"
              className="nav-item"
              onClick={() => {
                handleOpenCases();
                setMobileMenuOpen(false);
              }}
            >
              <span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </span>
              Missing Persons
            </button>


            <button
              type="button"
              className="nav-item"
              onClick={() => {
                setError("Reports module is coming next.");
                setMobileMenuOpen(false);
              }}
            >
              <span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/></svg>
              </span>
              Reports
            </button>


            <div className="nav-section">
              ACCOUNT & SYSTEM
            </div>

            <button
              type="button"
              className="nav-item"
              onClick={() => {
                console.log("Sign In clicked");
                setMobileMenuOpen(false);
              }}
            >
              <span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" x2="3" y1="12" y2="12"/></svg>
              </span>
              Sign In
            </button>


            <button
              type="button"
              className="nav-item logout-btn"
              onClick={() => {
                console.log("Logout clicked");
                setMobileMenuOpen(false);
              }}
            >
              <span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
              </span>
              Logout
            </button>


            <div className="system-status" style={{ marginTop: "12px" }}>
              <div className="status-dot" />
              <div>
                <strong>System Online</strong>
                <span>AI engine operational</span>
              </div>
            </div>

          </nav>

        </div>

      </div>

    );

  }


  // ======================================================
  // BOTTOM NAVIGATION (MOBILE & TABLET)
  // ======================================================

  function renderBottomNav() {

    return (

      <nav className="bottom-nav" aria-label="Mobile Navigation">

        <button
          type="button"
          className={`bottom-nav-item ${currentPage === "dashboard" && !selectedAnalysis ? "active" : ""}`}
          onClick={() => {
            setCurrentPage("dashboard");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          <div className="bottom-nav-icon-wrapper">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <span className="bottom-nav-label">Home</span>
        </button>


        <button
          type="button"
          className={`bottom-nav-item ${currentPage === "cases" ? "active" : ""}`}
          onClick={() => {
            handleOpenCases();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          <div className="bottom-nav-icon-wrapper">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 8v8"/>
              <path d="M8 12h8"/>
            </svg>
          </div>
          <span className="bottom-nav-label">Create Case</span>
        </button>


        <button
          type="button"
          className={`bottom-nav-item ${currentPage === "dashboard" && selectedAnalysis ? "active" : ""}`}
          onClick={() => {
            setCurrentPage("dashboard");
            const element = document.querySelector(".cctv-upload-zone, .upload-container, .analysis-section, .dashboard-grid");
            if (element) {
              element.scrollIntoView({ behavior: "smooth" });
            } else {
              window.scrollTo({ top: 0, behavior: "smooth" });
            }
          }}
        >
          <div className="bottom-nav-icon-wrapper">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="18" x="3" y="3" rx="2"/>
              <path d="M7 16v-4"/>
              <path d="M12 16V8"/>
              <path d="M17 16v-6"/>
            </svg>
          </div>
          <span className="bottom-nav-label">Analysis</span>
        </button>


        <button
          type="button"
          className="bottom-nav-item"
          onClick={() => {
            setError("Reports module is coming next.");
          }}
        >
          <div className="bottom-nav-icon-wrapper">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" x2="8" y1="13" y2="13"/>
              <line x1="16" x2="8" y1="17" y2="17"/>
            </svg>
          </div>
          <span className="bottom-nav-label">Report</span>
        </button>

      </nav>

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

            <div className="control-card-info">

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


      {/* ==================================================
        FIXED BOTTOM NAVIGATION (MOBILE & TABLET)
    ================================================== */}

      {renderBottomNav()}


      {/* ==================================================
        MOBILE DRAWER MENU OVERLAY
    ================================================== */}

      {renderMobileMenu()}

    </div>

  );

}


export default App;