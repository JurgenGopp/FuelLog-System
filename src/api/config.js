// src/api/config.js

// --- ເຊື່ອມຕໍ່ກັບ GAS API URL ຫຼັກ (ບັນທຶກນ້ຳມັນ) ---
export const API_URL =
  "https://script.google.com/macros/s/AKfycbxUEqs7nHH2Mz6zp3CzwDNVwLqXwA1S8w4SGobcflKJ56-EaYNm3RXvK8nAiCGENg/exec";

// --- ເຊື່ອມຕໍ່ກັບ GAS API URL (ໂລເຄຊັ໋ນລູກຄ້າ) ---
export const LOCATION_GAS_URL =
  "https://script.google.com/macros/s/AKfycbxJxbIvQMBejY5ZmuKS3unVCvyf6ugUd-rJAQ5pljsvk7wtACW9dAjMhElY3ti6x0wT/exec";

// --- Google Maps API Key ---
export const GOOGLE_MAPS_API_KEY = "AIzaSyBfhXi-1tPdrU5x0TpwOLdsYVRUv-ugyIg";

// --- ຟັງຊັ໋ນກາງສຳລັບເອີ້ນໃຊ້ API ຫຼັກ ---
export const callApi = async (payload) => {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("API Error:", error);
    return {
      success: false,
      message: "ບໍ່ສາມາດເຊື່ອມຕໍ່ກັບເຊີບເວີໄດ້. ກະລຸນາກວດສອບອິນເຕີເນັດ.",
    };
  }
};
