import { useEffect, useMemo, useState } from "react";

import {
    getCases,
    createCase,
    uploadReferenceImages,
    getReferenceImageUrl,
} from "./api";

import "./index.css";


function Cases({ onOpenCase }) {

    // ======================================================
    // STATE
    // ======================================================

    const [cases, setCases] = useState([]);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");

    const [showCreateForm, setShowCreateForm] =
        useState(false);

    const [creating, setCreating] = useState(false);

    const [uploading, setUploading] = useState(false);

    const [selectedCase, setSelectedCase] =
        useState(null);

    const [referenceFiles, setReferenceFiles] =
        useState([]);

    const [searchQuery, setSearchQuery] =
        useState("");


    const [form, setForm] = useState({
        name: "",
        age: "",
        gender: "",
        last_seen_location: "",
        last_seen_date: "",
        description: "",
    });


    // ======================================================
    // LOAD CASES
    // ======================================================

    async function loadCases() {

        try {

            setLoading(true);
            setError("");

            const data = await getCases();

            setCases(
                Array.isArray(data?.cases)
                    ? data.cases
                    : []
            );

        } catch (err) {

            console.error(
                "Load cases error:",
                err
            );

            setError(
                err?.message ||
                "Could not load cases."
            );

            setCases([]);

        } finally {

            setLoading(false);

        }
    }


    useEffect(() => {

        loadCases();

    }, []);


    // ======================================================
    // FILTERED CASES
    // ======================================================

    const filteredCases = useMemo(() => {

        const query =
            searchQuery.trim().toLowerCase();

        if (!query) {
            return cases;
        }

        return cases.filter((item) => {

            return [

                item.id,
                item.name,
                item.gender,
                item.last_seen_location,
                item.status,

            ]
                .filter(Boolean)
                .some(value =>
                    String(value)
                        .toLowerCase()
                        .includes(query)
                );

        });

    }, [
        cases,
        searchQuery,
    ]);


    // ======================================================
    // STATISTICS
    // ======================================================

    const totalCases =
        cases.length;

    const readyCases =
        cases.filter(
            item =>
                item.status === "ready"
        ).length;

    const casesWithoutReferences =
        cases.filter(
            item =>
                !item.reference_images ||
                item.reference_images.length === 0
        ).length;


    // ======================================================
    // FORM CHANGE
    // ======================================================

    function handleChange(event) {

        const {
            name,
            value,
        } = event.target;

        setForm(previous => ({
            ...previous,
            [name]: value,
        }));

    }


    // ======================================================
    // CREATE CASE
    // ======================================================

    async function handleCreateCase(event) {

        event.preventDefault();

        setError("");

        if (!form.name.trim()) {

            setError(
                "Missing person name is required."
            );

            return;
        }


        if (
            form.age !== "" &&
            (
                Number(form.age) < 0 ||
                Number(form.age) > 150
            )
        ) {

            setError(
                "Please enter a valid age."
            );

            return;
        }


        try {

            setCreating(true);

            const payload = {

                name:
                    form.name.trim(),

                age:
                    form.age !== ""
                        ? Number(form.age)
                        : null,

                gender:
                    form.gender || null,

                last_seen_location:
                    form.last_seen_location.trim()
                    || null,

                last_seen_date:
                    form.last_seen_date
                    || null,

                description:
                    form.description.trim()
                    || null,

            };


            const result =
                await createCase(payload);


            const newCase =
                result?.case;


            setForm({
                name: "",
                age: "",
                gender: "",
                last_seen_location: "",
                last_seen_date: "",
                description: "",
            });


            setShowCreateForm(false);

            await loadCases();


            if (newCase) {

                setSelectedCase(
                    newCase
                );

            }

        } catch (err) {

            console.error(
                "Create case error:",
                err
            );

            setError(
                err?.message ||
                "Could not create case."
            );

        } finally {

            setCreating(false);

        }

    }


    // ======================================================
    // REFERENCE FILE SELECTION
    // ======================================================

    function handleReferenceFiles(event) {

        setError("");

        const files =
            Array.from(
                event.target.files || []
            );


        if (!files.length) {

            setReferenceFiles([]);

            return;

        }


        if (files.length > 5) {

            setError(
                "You can select a maximum of 5 reference images."
            );

            event.target.value = "";

            setReferenceFiles([]);

            return;

        }


        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp",
        ];


        const invalidFile =
            files.find(
                file =>
                    !allowedTypes.includes(
                        file.type
                    )
            );


        if (invalidFile) {

            setError(
                `Unsupported image: ${invalidFile.name}. ` +
                "Only JPG, PNG and WEBP are allowed."
            );

            event.target.value = "";

            setReferenceFiles([]);

            return;

        }


        setReferenceFiles(files);

    }


    // ======================================================
    // UPLOAD REFERENCES
    // ======================================================

    async function handleUploadReferences() {

        setError("");

        if (!selectedCase) {

            setError(
                "Please select a case first."
            );

            return;

        }


        if (!referenceFiles.length) {

            setError(
                "Please select reference images first."
            );

            return;

        }


        try {

            setUploading(true);

            const result =
                await uploadReferenceImages(
                    selectedCase.id,
                    referenceFiles
                );


            setReferenceFiles([]);

            await loadCases();


            setSelectedCase(previous => {

                if (!previous) {
                    return previous;
                }

                return {

                    ...previous,

                    status:
                        result?.status ||
                        "ready",

                    reference_images:
                        result?.reference_images ||
                        previous.reference_images ||
                        [],

                    reference_profile:
                        result?.reference_profile ||
                        previous.reference_profile ||
                        null,

                };

            });


        } catch (err) {

            console.error(
                "Reference upload error:",
                err
            );

            setError(
                err?.message ||
                "Reference image upload failed."
            );

        } finally {

            setUploading(false);

        }

    }


    // ======================================================
    // OPEN CASE
    // ======================================================

    function handleOpenCase(caseItem) {

        if (!caseItem) {
            return;
        }

        if (onOpenCase) {
            onOpenCase(caseItem.id);
        }

    }


    // ======================================================
    // REFERENCES
    // ======================================================

    function handleOpenReferences(caseItem) {

        setError("");

        setSelectedCase(caseItem);

        setReferenceFiles([]);

    }


    function closeReferencePanel() {

        setSelectedCase(null);

        setReferenceFiles([]);

        setError("");

    }


    // ======================================================
    // STATUS
    // ======================================================

    function getStatusLabel(status) {

        if (status === "ready") {
            return "READY";
        }

        if (status === "created") {
            return "CREATED";
        }

        return String(
            status || "UNKNOWN"
        ).toUpperCase();

    }


    // ======================================================
    // REFERENCE IMAGE URL
    // ======================================================

    function getReferenceImage(
        caseItem,
        imagePath
    ) {

        if (
            !caseItem ||
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
            caseItem.id,
            filename
        );

    }


    // ======================================================
    // FORMAT DATE
    // ======================================================

    function formatDate(date) {

        if (!date) {
            return "Not provided";
        }

        try {

            return new Date(date)
                .toLocaleDateString(
                    "en-IN",
                    {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                    }
                );

        } catch {

            return date;

        }

    }


    // ======================================================
    // RENDER
    // ======================================================

    return (

        <div className="cases-page">

            {/* ==================================================
                PAGE HEADER
            ================================================== */}

            <div className="cases-header">

                <div>

                    <div className="page-label">
                        CASE MANAGEMENT
                    </div>

                    <h1>
                        Missing Person Cases
                    </h1>

                    <p>
                        Register, manage and investigate
                        missing-person cases.
                    </p>

                </div>


                <button
                    type="button"
                    className="primary-button new-case-button"
                    onClick={() => {

                        setError("");

                        setShowCreateForm(true);

                    }}
                >
                    <span>+</span>
                    New Case
                </button>

            </div>


            {/* ==================================================
                ERROR
            ================================================== */}

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
                    >
                        ×
                    </button>

                </div>

            )}


            {/* ==================================================
                STATISTICS
            ================================================== */}

            <section className="cases-stats">

                <div className="cases-stat-card">

                    <div className="cases-stat-icon">
                        #
                    </div>

                    <div>

                        <span>
                            TOTAL CASES
                        </span>

                        <strong>
                            {totalCases}
                        </strong>

                    </div>

                </div>


                <div className="cases-stat-card">

                    <div className="cases-stat-icon ready">
                        ✓
                    </div>

                    <div>

                        <span>
                            AI READY
                        </span>

                        <strong>
                            {readyCases}
                        </strong>

                    </div>

                </div>


                <div className="cases-stat-card">

                    <div className="cases-stat-icon warning">
                        !
                    </div>

                    <div>

                        <span>
                            NEED REFERENCES
                        </span>

                        <strong>
                            {casesWithoutReferences}
                        </strong>

                    </div>

                </div>

            </section>


            {/* ==================================================
                CREATE FORM
            ================================================== */}

            {showCreateForm && (

                <section className="case-form-card">

                    <div className="case-form-heading">

                        <div>

                            <div className="card-label">
                                NEW INVESTIGATION
                            </div>

                            <h2>
                                Register Missing Person
                            </h2>

                            <p>
                                Add the person's basic information
                                to create an investigation case.
                            </p>

                        </div>


                        <button
                            type="button"
                            className="icon-button"
                            onClick={() => {

                                setShowCreateForm(false);

                                setError("");

                            }}
                        >
                            ×
                        </button>

                    </div>


                    <form
                        onSubmit={
                            handleCreateCase
                        }
                    >

                        <div className="form-grid">

                            <div className="form-field">

                                <label>
                                    Full Name *
                                </label>

                                <input
                                    name="name"
                                    value={form.name}
                                    onChange={handleChange}
                                    placeholder="e.g. Rahul Sharma"
                                    autoComplete="off"
                                    required
                                />

                            </div>


                            <div className="form-field">

                                <label>
                                    Age
                                </label>

                                <input
                                    name="age"
                                    type="number"
                                    min="0"
                                    max="150"
                                    value={form.age}
                                    onChange={handleChange}
                                    placeholder="Age"
                                />

                            </div>


                            <div className="form-field">

                                <label>
                                    Gender
                                </label>

                                <select
                                    name="gender"
                                    value={form.gender}
                                    onChange={handleChange}
                                >

                                    <option value="">
                                        Select gender
                                    </option>

                                    <option value="Male">
                                        Male
                                    </option>

                                    <option value="Female">
                                        Female
                                    </option>

                                    <option value="Other">
                                        Other
                                    </option>

                                </select>

                            </div>


                            <div className="form-field">

                                <label>
                                    Last Seen Date
                                </label>

                                <input
                                    name="last_seen_date"
                                    type="date"
                                    value={
                                        form.last_seen_date
                                    }
                                    onChange={handleChange}
                                />

                            </div>


                            <div className="form-field full">

                                <label>
                                    Last Seen Location
                                </label>

                                <input
                                    name="last_seen_location"
                                    value={
                                        form.last_seen_location
                                    }
                                    onChange={handleChange}
                                    placeholder="City, area or landmark"
                                />

                            </div>


                            <div className="form-field full">

                                <label>
                                    Description
                                </label>

                                <textarea
                                    name="description"
                                    rows="4"
                                    value={
                                        form.description
                                    }
                                    onChange={handleChange}
                                    placeholder="Clothing, appearance, identifying marks or other useful information..."
                                />

                            </div>

                        </div>


                        <div className="form-actions">

                            <button
                                type="button"
                                className="secondary-button"
                                onClick={() => {

                                    setShowCreateForm(false);

                                    setError("");

                                }}
                            >
                                Cancel
                            </button>


                            <button
                                type="submit"
                                className="primary-button"
                                disabled={creating}
                            >

                                {creating
                                    ? "Creating Case..."
                                    : "Create Case"}

                            </button>

                        </div>

                    </form>

                </section>

            )}


            {/* ==================================================
                CASE LIST HEADER
            ================================================== */}

            <section className="cases-section">

                <div className="cases-toolbar">

                    <div>

                        <div className="card-label">
                            INVESTIGATIONS
                        </div>

                        <h2>
                            All Cases
                        </h2>

                    </div>


                    <div className="cases-toolbar-actions">

                        <div className="case-search">

                            <span>
                                ⌕
                            </span>

                            <input
                                value={searchQuery}
                                onChange={event =>
                                    setSearchQuery(
                                        event.target.value
                                    )
                                }
                                placeholder="Search cases..."
                            />

                        </div>


                        <button
                            type="button"
                            className="refresh-button"
                            onClick={loadCases}
                            disabled={loading}
                        >
                            ↻ Refresh
                        </button>

                    </div>

                </div>


                {/* ==================================================
                    LOADING
                ================================================== */}

                {loading && (

                    <div className="cases-loading">

                        <div className="loading-spinner" />

                        <strong>
                            Loading investigations
                        </strong>

                        <span>
                            Fetching case information...
                        </span>

                    </div>

                )}


                {/* ==================================================
                    EMPTY
                ================================================== */}

                {!loading &&
                    filteredCases.length === 0 && (

                        <div className="cases-empty">

                            <div className="cases-empty-icon">
                                ◉
                            </div>

                            <strong>
                                {searchQuery
                                    ? "No matching cases"
                                    : "No cases found"}
                            </strong>

                            <span>
                                {searchQuery
                                    ? "Try another name, case ID or location."
                                    : "Create your first missing-person investigation."}
                            </span>

                            {!searchQuery && (

                                <button
                                    type="button"
                                    className="primary-button"
                                    onClick={() =>
                                        setShowCreateForm(true)
                                    }
                                >
                                    + Create First Case
                                </button>

                            )}

                        </div>

                    )}


                {/* ==================================================
                    CASE CARDS
                ================================================== */}

                {!loading &&
                    filteredCases.length > 0 && (

                        <div className="cases-grid">

                            {filteredCases.map(
                                (caseItem) => {

                                    const referenceCount =
                                        caseItem
                                            .reference_images
                                            ?.length || 0;


                                    return (

                                        <article
                                            className="case-card"
                                            key={
                                                caseItem.id
                                            }
                                        >

                                            {/* TOP */}

                                            <div className="case-card-top">

                                                <div>

                                                    <span className="case-card-label">
                                                        CASE
                                                    </span>

                                                    <strong className="case-number">
                                                        #{caseItem.id}
                                                    </strong>

                                                </div>


                                                <span
                                                    className={
                                                        "case-status " +
                                                        (
                                                            caseItem.status ===
                                                                "ready"
                                                                ? "ready"
                                                                : "created"
                                                        )
                                                    }
                                                >

                                                    <span className="status-dot-small" />

                                                    {
                                                        getStatusLabel(
                                                            caseItem.status
                                                        )
                                                    }

                                                </span>

                                            </div>


                                            {/* PERSON */}

                                            <div className="case-person">

                                                <div className="case-avatar">

                                                    {caseItem.name
                                                        ?.charAt(0)
                                                        ?.toUpperCase() ||
                                                        "?"}

                                                </div>


                                                <div>

                                                    <h3>
                                                        {
                                                            caseItem.name
                                                        }
                                                    </h3>

                                                    <p>
                                                        {caseItem.age != null
                                                            ? `${caseItem.age} years`
                                                            : "Age not provided"}

                                                        {" · "}

                                                        {caseItem.gender ||
                                                            "Gender not provided"}
                                                    </p>

                                                </div>

                                            </div>


                                            {/* INFORMATION */}

                                            <div className="case-info-grid">

                                                <div>

                                                    <span>
                                                        LAST SEEN
                                                    </span>

                                                    <strong>
                                                        {
                                                            caseItem
                                                                .last_seen_location ||
                                                            "Not provided"
                                                        }
                                                    </strong>

                                                </div>


                                                <div>

                                                    <span>
                                                        DATE
                                                    </span>

                                                    <strong>
                                                        {formatDate(
                                                            caseItem
                                                                .last_seen_date
                                                        )}
                                                    </strong>

                                                </div>

                                            </div>


                                            {/* REFERENCES */}

                                            <div className="case-reference-status">

                                                <div className="reference-status-icon">
                                                    ◉
                                                </div>

                                                <div>

                                                    <strong>
                                                        {referenceCount}{" "}
                                                        reference{" "}
                                                        {referenceCount === 1
                                                            ? "image"
                                                            : "images"}
                                                    </strong>

                                                    <span>
                                                        {referenceCount > 0
                                                            ? "AI profile available"
                                                            : "Upload images to build AI profile"}
                                                    </span>

                                                </div>

                                            </div>


                                            {/* DESCRIPTION */}

                                            {caseItem.description && (

                                                <p className="case-description">

                                                    {caseItem.description}

                                                </p>

                                            )}


                                            {/* ACTIONS */}

                                            <div className="case-card-actions">

                                                <button
                                                    type="button"
                                                    className="case-primary-action"
                                                    onClick={() =>
                                                        handleOpenCase(
                                                            caseItem
                                                        )
                                                    }
                                                >
                                                    View Case
                                                    <span>→</span>
                                                </button>


                                                <button
                                                    type="button"
                                                    className="case-secondary-action"
                                                    onClick={() =>
                                                        handleOpenReferences(
                                                            caseItem
                                                        )
                                                    }
                                                >
                                                    References
                                                </button>

                                            </div>

                                        </article>

                                    );

                                }
                            )}

                        </div>

                    )}

            </section>


            {/* ==================================================
                REFERENCE MODAL
            ================================================== */}

            {selectedCase && (

                <div
                    className="reference-modal-overlay"
                    onMouseDown={event => {

                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            closeReferencePanel();
                        }

                    }}
                >

                    <section
                        className="reference-modal"
                        onMouseDown={event =>
                            event.stopPropagation()
                        }
                    >

                        <div className="reference-modal-header">

                            <div>

                                <div className="card-label">
                                    AI REFERENCE PROFILE
                                </div>

                                <h2>
                                    {selectedCase.name}
                                </h2>

                                <p>
                                    Case #{selectedCase.id}
                                    {" · "}
                                    {selectedCase.age != null
                                        ? `${selectedCase.age} years`
                                        : "Age not provided"}
                                </p>

                            </div>


                            <button
                                type="button"
                                className="modal-close-button"
                                onClick={
                                    closeReferencePanel
                                }
                            >
                                ×
                            </button>

                        </div>


                        {/* REFERENCES */}

                        <div className="reference-section">

                            <div className="reference-section-heading">

                                <div>

                                    <strong>
                                        Registered Images
                                    </strong>

                                    <span>
                                        Used by the AI matching
                                        system.
                                    </span>

                                </div>

                                <div className="reference-count">
                                    <strong>
                                        {
                                            selectedCase
                                                .reference_images
                                                ?.length || 0
                                        }
                                    </strong>

                                    <span>
                                        images
                                    </span>
                                </div>

                            </div>


                            {selectedCase.reference_images?.length > 0 ? (

                                <div className="reference-gallery">

                                    {selectedCase.reference_images.map(
                                        (
                                            imagePath,
                                            index
                                        ) => {

                                            const imageUrl =
                                                getReferenceImage(
                                                    selectedCase,
                                                    imagePath
                                                );


                                            return (

                                                <div
                                                    className="reference-item"
                                                    key={
                                                        `${imagePath}-${index}`
                                                    }
                                                >

                                                    <img
                                                        src={imageUrl}
                                                        alt={
                                                            `Reference ${index + 1}`
                                                        }
                                                        loading="lazy"
                                                        onError={event => {

                                                            event.currentTarget.style.display =
                                                                "none";

                                                        }}
                                                    />

                                                    <div className="reference-number">
                                                        {index + 1}
                                                    </div>

                                                </div>

                                            );

                                        }
                                    )}

                                </div>

                            ) : (

                                <div className="reference-empty">

                                    <div className="reference-empty-icon">
                                        ◉
                                    </div>

                                    <strong>
                                        No reference images yet
                                    </strong>

                                    <span>
                                        Add clear photos of the
                                        missing person to build
                                        the AI profile.
                                    </span>

                                </div>

                            )}

                        </div>


                        {/* UPLOAD */}

                        <div className="reference-upload">

                            <div className="reference-upload-heading">

                                <div>

                                    <strong>
                                        Add Reference Images
                                    </strong>

                                    <span>
                                        Select up to 5 clear
                                        photos.
                                    </span>

                                </div>

                            </div>


                            <label className="reference-file-drop">

                                <input
                                    type="file"
                                    accept=".jpg,.jpeg,.png,.webp"
                                    multiple
                                    onChange={
                                        handleReferenceFiles
                                    }
                                />

                                <div className="reference-upload-icon">
                                    ↑
                                </div>

                                <strong>
                                    Choose images
                                </strong>

                                <span>
                                    JPG, PNG or WEBP
                                </span>

                            </label>

                        </div>


                        {/* SELECTED */}

                        {referenceFiles.length > 0 && (

                            <div className="selected-files">

                                <strong>
                                    {referenceFiles.length}{" "}
                                    selected
                                </strong>


                                {referenceFiles.map(file => (

                                    <span
                                        key={
                                            `${file.name}-${file.size}`
                                        }
                                    >
                                        {file.name}
                                    </span>

                                ))}

                            </div>

                        )}


                        {/* ACTIONS */}

                        <div className="form-actions">

                            <button
                                type="button"
                                className="secondary-button"
                                onClick={
                                    closeReferencePanel
                                }
                            >
                                Close
                            </button>


                            <button
                                type="button"
                                className="primary-button"
                                disabled={
                                    uploading ||
                                    referenceFiles.length === 0
                                }
                                onClick={
                                    handleUploadReferences
                                }
                            >

                                {uploading
                                    ? "Building AI Profile..."
                                    : "Upload & Build Profile"}

                            </button>

                        </div>


                        {selectedCase.reference_profile && (

                            <div className="profile-ready">

                                <span>
                                    ✓
                                </span>

                                <div>

                                    <strong>
                                        AI profile ready
                                    </strong>

                                    <small>
                                        This case is ready for
                                        CCTV face matching.
                                    </small>

                                </div>

                            </div>

                        )}

                    </section>

                </div>

            )}

        </div>

    );

}


export default Cases;