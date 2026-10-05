import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getDatabase,
  ref,
  onValue,
  update
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";


// ==========================================================
// Firebase Configuration
// ==========================================================

const firebaseConfig = {
  apiKey: "AIzaSyDnvmRTgZl1p325V3TmCjIH-PnPfjJPPpk",
  authDomain: "bok-ped.firebaseapp.com",
  databaseURL: "https://bok-ped-default-rtdb.firebaseio.com/",
  projectId: "bok-ped",
  storageBucket: "bok-ped.firebasestorage.app",
  messagingSenderId: "812838230843",
  appId: "1:812838230843:web:f3bd5f59343db42b52b51e",
  measurementId: "G-26SMZR0QCC"
};


// ==========================================================
// Admin UID
// ==========================================================

const ADMIN_UID =
  "zuwXPgS4TPYF5GyAYEPEOrsYV0z1";


// ==========================================================
// Firebase
// ==========================================================

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getDatabase(app);


// ==========================================================
// Elements
// ==========================================================

const loginPage =
  document.getElementById("loginPage");

const adminPage =
  document.getElementById("adminPage");

const emailInput =
  document.getElementById("email");

const passwordInput =
  document.getElementById("password");

const loginBtn =
  document.getElementById("loginBtn");

const loginError =
  document.getElementById("loginError");

const logoutBtn =
  document.getElementById("logoutBtn");

const requestsList =
  document.getElementById("requestsList");

const loading =
  document.getElementById("loading");

const empty =
  document.getElementById("empty");

const searchInput =
  document.getElementById("searchInput");

const totalCount =
  document.getElementById("totalCount");

const pendingCount =
  document.getElementById("pendingCount");

const completedCount =
  document.getElementById("completedCount");

const editModal =
  document.getElementById("editModal");

const closeModal =
  document.getElementById("closeModal");

const modalAccount =
  document.getElementById("modalAccount");

const accountNumber16 =
  document.getElementById("accountNumber16");

const accountName =
  document.getElementById("accountName");

const accountBranch =
  document.getElementById("accountBranch");

const accountType =
  document.getElementById("accountType");

const saveBtn =
  document.getElementById("saveBtn");

const saveError =
  document.getElementById("saveError");

const toast =
  document.getElementById("toast");


// ==========================================================
// Variables
// ==========================================================

let currentUser = null;

let requests = {};

let selectedRequestId = null;


// ==========================================================
// Show Login
// ==========================================================

function showLogin() {

  loginPage.classList.remove("hidden");

  adminPage.classList.add("hidden");

}


// ==========================================================
// Show Admin
// ==========================================================

function showAdmin() {

  loginPage.classList.add("hidden");

  adminPage.classList.remove("hidden");

}


// ==========================================================
// Toast
// ==========================================================

function showToast(message) {

  if (!toast) {
    return;
  }

  toast.textContent = message;

  toast.classList.add("show");

  setTimeout(function () {

    toast.classList.remove("show");

  }, 2500);

}


// ==========================================================
// Escape HTML
// ==========================================================

function escapeHtml(value) {

  return String(value ?? "")

    .replaceAll("&", "&amp;")

    .replaceAll("<", "&lt;")

    .replaceAll(">", "&gt;")

    .replaceAll('"', "&quot;")

    .replaceAll("'", "&#039;");
}


// ==========================================================
// Format Date
// ==========================================================

function formatDate(timestamp) {

  if (!timestamp) {

    return "غير متوفر";

  }

  try {

    return new Intl.DateTimeFormat(
      "ar",
      {
        dateStyle: "medium",
        timeStyle: "short"
      }
    ).format(
      new Date(
        Number(timestamp)
      )
    );

  } catch (error) {

    return "غير متوفر";

  }

}


// ==========================================================
// Render Requests
// ==========================================================

function renderRequests() {

  if (!requestsList) {
    return;
  }

  const search =
    searchInput
      ? searchInput.value.trim()
      : "";


  const items =
    Object.entries(requests)

      .map(function (entry) {

        const id = entry[0];

        const data = entry[1] || {};

        return {
          id: id,
          ...data
        };

      })

      .sort(function (a, b) {

        return (
          Number(b.createdAt || 0) -
          Number(a.createdAt || 0)
        );

      })

      .filter(function (item) {

        if (!search) {
          return true;
        }

        return String(
          item.accountNumber || ""
        ).includes(search);

      });


  // ========================================================
  // Statistics
  // ========================================================

  if (totalCount) {

    totalCount.textContent =
      Object.keys(requests).length;

  }


  const all =
    Object.values(requests);


  if (pendingCount) {

    pendingCount.textContent =
      all.filter(function (item) {

        return item.status !== "completed";

      }).length;

  }


  if (completedCount) {

    completedCount.textContent =
      all.filter(function (item) {

        return item.status === "completed";

      }).length;

  }


  if (loading) {

    loading.classList.add("hidden");

  }


  // ========================================================
  // Empty
  // ========================================================

  if (!items.length) {

    requestsList.innerHTML = "";

    if (empty) {

      empty.classList.remove("hidden");

    }

    return;

  }


  if (empty) {

    empty.classList.add("hidden");

  }


  // ========================================================
  // Cards
  // ========================================================

  requestsList.innerHTML =
    items.map(function (item) {

      const completed =
        item.status === "completed";


      return `

        <div class="request-card">

          <div class="request-head">

            <div class="account-number">

              ${escapeHtml(
                item.accountNumber || item.id
              )}

            </div>

            <span class="status ${
              completed
                ? "completed"
                : "pending"
            }">

              ${
                completed
                  ? "مكتمل"
                  : "قيد الانتظار"
              }

            </span>

          </div>


          <div class="details">

            <div class="detail">

              <small>
                الرقم البنكي
              </small>

              <span>

                ${escapeHtml(
                  item.accountNumber16 ||
                  "لم تتم الإضافة"
                )}

              </span>

            </div>


            <div class="detail">

              <small>
                الاسم
              </small>

              <span>

                ${escapeHtml(
                  item.name ||
                  "لم تتم الإضافة"
                )}

              </span>

            </div>


            <div class="detail">

              <small>
                الفرع
              </small>
