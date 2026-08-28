import axiosClient from "./axiosClient";

export async function listPatients() {
  const { data } = await axiosClient.get("/patients");
  return data;
}

export async function createPatient(payload) {
  // payload: { patient_code, full_name, age, gender }
  const { data } = await axiosClient.post("/patients", payload);
  return data;
}

export async function getPatient(patientId) {
  const { data } = await axiosClient.get(`/patients/${patientId}`);
  return data;
}

export async function updatePatient(patientId, payload) {
  const { data } = await axiosClient.patch(`/patients/${patientId}`, payload);
  return data;
}

export async function deletePatient(patientId) {
  await axiosClient.delete(`/patients/${patientId}`);
}

export async function getHospitalStats() {
  const { data } = await axiosClient.get("/patients/stats");
  return data;
}
