import axiosClient from "./axiosClient";

export async function login(username, password) {
  // Backend expects POST /auth/login -> { access_token, token_type }
  const { data } = await axiosClient.post("/auth/login", {
    username,
    password,
  });
  return data;
}

export async function registerHospital(payload) {
  // payload: { hospital_name, admin_username, admin_password,
  //            hospital_address?, contact_email? }
  // Returns { access_token, token_type } — the new admin is signed in immediately.
  const { data } = await axiosClient.post("/auth/register-hospital", payload);
  return data;
}