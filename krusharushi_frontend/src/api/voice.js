import axiosClient from "./axiosClient";

export async function uploadVoiceSample(patientId, file, source) {
  const endpoint = source === "recorded" ? "/voice/record" : "/voice/upload";

  const formData = new FormData();
  formData.append("patient_id", patientId);
  formData.append("file", file);

  // Do NOT set Content-Type manually — axios derives the multipart boundary
  // from the FormData automatically; a hand-set header omits the boundary and
  // the backend can't parse the upload.
  const { data } = await axiosClient.post(endpoint, formData);
  return data;
}

export async function getPrediction(sampleId) {
  const { data } = await axiosClient.get(`/voice/${sampleId}/prediction`);
  return data;
}
