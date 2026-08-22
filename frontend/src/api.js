const API_BASE_URL = "http://127.0.0.1:8000/api";


// ========================================================
// GENERIC REQUEST
// ========================================================

async function request(url, options = {}) {

  const response = await fetch(
    `${API_BASE_URL}${url}`,
    options
  );


  if (!response.ok) {

    let message =
      `Request failed: ${response.status}`;


    try {

      const data =
        await response.json();

      message =
        data.detail ||
        message;

    } catch {
      // Ignore JSON parsing errors
    }


    throw new Error(
      message
    );

  }


  return response;

}


// ========================================================
// GET ALL CASES
// ========================================================

export async function getCases() {

  const response =
    await request(
      "/cases"
    );


  return response.json();

}


// ========================================================
// GET SINGLE CASE
// ========================================================

export async function getCase(
  caseId
) {

  const response =
    await request(
      `/cases/${caseId}`
    );


  return response.json();

}


// ========================================================
// CREATE CASE
// ========================================================

export async function createCase(
  caseData
) {

  const response =
    await request(
      "/cases",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify(
            caseData
          ),
      }
    );


  return response.json();

}


// ========================================================
// UPLOAD REFERENCE IMAGES
// ========================================================

export async function uploadReferenceImages(
  caseId,
  files
) {

  const formData =
    new FormData();


  for (
    const file
    of files
  ) {

    formData.append(
      "files",
      file
    );

  }


  const response =
    await request(
      `/cases/${caseId}/references`,
      {
        method: "POST",

        body: formData,
      }
    );


  return response.json();

}


// ========================================================
// REFERENCE IMAGE URL
// ========================================================

export function getReferenceImageUrl(
  caseId,
  filename
) {

  return (
    `${API_BASE_URL}` +
    `/cases/${caseId}` +
    `/references/${encodeURIComponent(filename)}`
  );

}


// ========================================================
// GET ALL CCTV ANALYSES
// ========================================================

export async function getCaseAnalyses(
  caseId
) {

  const response =
    await request(
      `/cases/${caseId}/analyses`
    );


  return response.json();

}


// ========================================================
// GET SINGLE ANALYSIS
// ========================================================

export async function getAnalysis(
  caseId,
  analysisId
) {

  const response =
    await request(
      `/cases/${caseId}/analyses/${analysisId}`
    );


  return response.json();

}


// ========================================================
// GET CONFIRMED SIGHTINGS
// ========================================================

export async function getSightings(
  caseId,
  analysisId
) {

  const response =
    await request(
      `/cases/${caseId}/analyses/${analysisId}/sightings`
    );


  return response.json();

}


// ========================================================
// GET POTENTIAL MATCHES
// ========================================================

export async function getMatches(
  caseId,
  analysisId
) {

  const response =
    await request(
      `/cases/${caseId}/analyses/${analysisId}/matches`
    );


  return response.json();

}


// ========================================================
// UPLOAD CCTV VIDEO
// ========================================================

export async function uploadCCTV(
  caseId,
  file
) {

  const formData =
    new FormData();


  formData.append(
    "file",
    file
  );


  const response =
    await request(
      `/cases/${caseId}/videos`,
      {
        method: "POST",

        body: formData,
      }
    );


  return response.json();

}


// ========================================================
// EVIDENCE IMAGE URL
// ========================================================

export function getEvidenceImageUrl(
  caseId,
  analysisId,
  filename
) {

  return (
    `${API_BASE_URL}` +
    `/cases/${caseId}` +
    `/analyses/${analysisId}` +
    `/evidence/${encodeURIComponent(filename)}`
  );

}


// ========================================================
// EXPORT API BASE URL
// ========================================================

export {
  API_BASE_URL,
};