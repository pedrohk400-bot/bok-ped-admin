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

              <span>

                ${escapeHtml(
                  item.branch ||
                  "لم تتم الإضافة"
                )}

              </span>

            </div>


            <div class="detail">

              <small>
                نوع الحساب
              </small>

              <span>

                ${escapeHtml(
                  item.accountType ||
                  "لم تتم الإضافة"
                )}

              </span>

            </div>


            <div class="detail">

              <small>
                تاريخ الطلب
              </small>

              <span>

                ${escapeHtml(
                  formatDate(
                    item.createdAt
                  )
                )}

              </span>

            </div>


            <div class="detail">

              <small>
                الحالة
              </small>

              <span>

                ${
                  completed
                    ? "تم إكمال البيانات"
                    : "بانتظار الإدارة"
                }

              </span>

            </div>

          </div>


          <button
            class="edit-btn"
            data-id="${escapeHtml(item.id)}"
          >

            ${
              completed
                ? "تعديل البيانات"
                : "إكمال البيانات"
            }

          </button>

        </div>

      `;

    }).join("");


  // ========================================================
  // Buttons
  // ========================================================

  document
    .querySelectorAll(".edit-btn")
    .forEach(function (button) {

      button.addEventListener(
        "click",
        function () {

          openEdit(
            button.dataset.id
          );

        }
      );

    });

}


// ==========================================================
// Open Edit
// ==========================================================

function openEdit(id) {

  const item =
    requests[id];


  if (!item) {

    return;

  }


  selectedRequestId =
    id;


  if (modalAccount) {

    modalAccount.textContent =
      "رقم الطلب: " +
      (item.accountNumber || id);

  }


  if (accountNumber16) {

    accountNumber16.value =
      item.accountNumber16 || "";

  }


  if (accountName) {

    accountName.value =
      item.name || "";

  }


  if (accountBranch) {

    accountBranch.value =
      item.branch || "";

  }


  if (accountType) {

    accountType.value =
      item.accountType || "";

  }


  if (saveError) {

    saveError.textContent = "";

  }


  if (editModal) {

    editModal.classList.remove(
      "hidden"
    );

  }

}


// ==========================================================
// Close Edit
// ==========================================================

function closeEdit() {

  if (editModal) {

    editModal.classList.add(
      "hidden"
    );

  }

  selectedRequestId =
    null;

}


// ==========================================================
// Login
// ==========================================================

if (loginBtn) {

  loginBtn.addEventListener(
    "click",
    async function () {

      if (loginError) {
        loginError.textContent = "";
      }


      const email =
        emailInput
          ? emailInput.value.trim()
          : "";


      const password =
        passwordInput
          ? passwordInput.value
          : "";


      if (!email || !password) {

        if (loginError) {

          loginError.textContent =
            "أدخل البريد الإلكتروني وكلمة المرور.";

        }

        return;

      }


      loginBtn.disabled = true;

      loginBtn.textContent =
        "جاري الدخول...";


      try {

        await signInWithEmailAndPassword(
          auth,
          email,
          password
        );

      } catch (error) {

        console.error(
          "Login error:",
          error
        );

        if (loginError) {

          loginError.textContent =
            "فشل تسجيل الدخول. تأكد من البيانات.";

        }

      } finally {

        loginBtn.disabled = false;

        loginBtn.textContent =
          "تسجيل الدخول";

      }

    }
  );

}


// ==========================================================
// Enter Login
// ==========================================================

if (passwordInput) {

  passwordInput.addEventListener(
    "keydown",
    function (e) {

      if (e.key === "Enter") {

        if (loginBtn) {
          loginBtn.click();
        }

      }

    }
  );

}


if (emailInput) {

  emailInput.addEventListener(
    "keydown",
    function (e) {

      if (e.key === "Enter") {

        if (loginBtn) {
          loginBtn.click();
        }

      }

    }
  );

}


// ==========================================================
// Logout
// ==========================================================

if (logoutBtn) {

  logoutBtn.addEventListener(
    "click",
    async function () {

      try {

        await signOut(auth);

      } catch (error) {

        console.error(
          "Logout error:",
          error
        );

      }

    }
  );

}


// ==========================================================
// Close Modal
// ==========================================================

if (closeModal) {

  closeModal.addEventListener(
    "click",
    closeEdit
  );

}


if (editModal) {

  editModal.addEventListener(
    "click",
    function (e) {

      if (e.target === editModal) {

        closeEdit();

      }

    }
  );

}


// ==========================================================
// Search
// ==========================================================

if (searchInput) {

  searchInput.addEventListener(
    "input",
    renderRequests
  );

}


// ==========================================================
// Save Request
// ==========================================================

if (saveBtn) {

  saveBtn.addEventListener(
    "click",
    async function () {

      if (saveError) {
        saveError.textContent = "";
      }


      if (!selectedRequestId) {

        return;

      }


      const number16 =
        accountNumber16
          ? accountNumber16.value.trim()
          : "";


      const name =
        accountName
          ? accountName.value.trim()
          : "";


      const branch =
        accountBranch
          ? accountBranch.value.trim()
          : "";


      const type =
        accountType
          ? accountType.value.trim()
          : "";


      if (!/^[0-9]{16}$/.test(number16)) {

        if (saveError) {

          saveError.textContent =
            "الرقم البنكي يجب أن يكون 16 رقمًا.";

        }

        return;

      }


      if (!name || !branch || !type) {

        if (saveError) {

          saveError.textContent =
            "أكمل جميع البيانات.";

        }

        return;

      }


      saveBtn.disabled = true;

      saveBtn.textContent =
        "جاري الحفظ...";


      try {

        await update(
          ref(
            db,
            "requests/" +
            selectedRequestId
          ),
          {

            accountNumber16:
              number16,

            name:
              name,

            branch:
              branch,

            accountType:
              type,

            status:
              "completed",

            updatedAt:
              Date.now(),

            updatedBy:
              currentUser.uid

          }
        );


        closeEdit();


        showToast(
          "تم حفظ بيانات الحساب بنجاح"
        );


      } catch (error) {

        console.error(
          "Save error:",
          error
        );


        if (saveError) {

          saveError.textContent =
            "تعذر الحفظ: " +
            (error.message || "خطأ غير معروف");

        }

      } finally {

        saveBtn.disabled = false;

        saveBtn.textContent =
          "حفظ البيانات";

      }

    }
  );

}


// ==========================================================
// LOAD REQUESTS
// ==========================================================

function loadRequests() {

  if (loading) {

    loading.classList.remove(
      "hidden"
    );

    loading.textContent =
      "جاري تحميل الطلبات...";

  }


  console.log(
    "بدء قراءة requests..."
  );

  console.log(
    "Admin UID:",
    currentUser
      ? currentUser.uid
      : "لا يوجد"
  );


  const requestsRef =
    ref(
      db,
      "requests"
    );


  onValue(

    requestsRef,

    function (snapshot) {

      console.log(
        "تمت قراءة requests بنجاح."
      );


      console.log(
        "Snapshot exists:",
        snapshot.exists()
      );


      const data =
        snapshot.val();


      console.log(
        "Requests:",
        data
      );


      if (data === null) {

        requests = {};

      } else {

        requests = data;

      }


      renderRequests();

    },


    function (error) {

      console.error(
        "Firebase requests error:",
        error.code,
        error.message
      );


      requests = {};


      if (loading) {

        loading.classList.remove(
          "hidden"
        );

        loading.textContent =
          "تعذر تحميل الطلبات: " +
          error.message;

      }

    }

  );

}


// ==========================================================
// AUTH STATE
// ==========================================================

onAuthStateChanged(

  auth,

  function (user) {

    currentUser =
      user;


    console.log(
      "Auth state:",
      user
        ? user.uid
        : "لا يوجد مستخدم"
    );


    if (!user) {

      showLogin();

      return;

    }


    if (user.uid !== ADMIN_UID) {

      console.error(
        "الحساب ليس Admin"
      );


      signOut(auth);


      if (loginError) {

        loginError.textContent =
          "هذا الحساب غير مصرح له بالدخول إلى لوحة الإدارة.";

      }


      showLogin();

      return;

    }


    console.log(
      "تم تسجيل دخول الأدمن بنجاح"
    );


    showAdmin();


    loadRequests();

  }

);
