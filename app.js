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

const ADMIN_UID = "zuwXPgS4TPYF5GyAYEPEOrsYV0z1";


// ==========================================================
// Firebase Initialize
// ==========================================================

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getDatabase(app);


// ==========================================================
// Elements
// ==========================================================

const loginPage = document.getElementById("loginPage");

const adminPage = document.getElementById("adminPage");

const emailInput = document.getElementById("email");

const passwordInput = document.getElementById("password");

const loginBtn = document.getElementById("loginBtn");

const loginError = document.getElementById("loginError");

const logoutBtn = document.getElementById("logoutBtn");


const requestsList = document.getElementById("requestsList");

const loading = document.getElementById("loading");

const empty = document.getElementById("empty");

const searchInput = document.getElementById("searchInput");


const totalCount = document.getElementById("totalCount");

const pendingCount = document.getElementById("pendingCount");

const completedCount = document.getElementById("completedCount");


const editModal = document.getElementById("editModal");

const closeModal = document.getElementById("closeModal");

const modalAccount = document.getElementById("modalAccount");

const accountNumber16 = document.getElementById("accountNumber16");

const accountName = document.getElementById("accountName");

const accountBranch = document.getElementById("accountBranch");

const accountType = document.getElementById("accountType");

const saveBtn = document.getElementById("saveBtn");

const saveError = document.getElementById("saveError");

const toast = document.getElementById("toast");


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

  toast.textContent = message;

  toast.classList.add("show");

  setTimeout(() => {

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

    return new Intl.DateTimeFormat("ar", {

      dateStyle: "medium",

      timeStyle: "short"

    }).format(new Date(timestamp));

  } catch {

    return "غير متوفر";

  }

}


// ==========================================================
// Render Requests
// ==========================================================

function renderRequests() {

  const search = searchInput.value.trim();


  const items = Object.entries(requests)

    .map(([id, data]) => ({

      id,

      ...data

    }))

    .sort(

      (a, b) =>

        Number(b.createdAt || 0) -

        Number(a.createdAt || 0)

    )

    .filter(

      item =>

        !search ||

        String(item.accountNumber || "").includes(search)

    );


  // ========================================================
  // Statistics
  // ========================================================

  totalCount.textContent = Object.keys(requests).length;


  const all = Object.values(requests);


  pendingCount.textContent =

    all.filter(

      x => x.status !== "completed"

    ).length;


  completedCount.textContent =

    all.filter(

      x => x.status === "completed"

    ).length;


  loading.classList.add("hidden");


  // ========================================================
  // Empty
  // ========================================================

  if (!items.length) {

    requestsList.innerHTML = "";

    empty.classList.remove("hidden");

    return;

  }


  empty.classList.add("hidden");


  // ========================================================
  // Cards
  // ========================================================

  requestsList.innerHTML = items

    .map(item => {

      const completed =

        item.status === "completed";


      return `

        <div class="request-card">

          <div class="request-head">

            <div class="account-number">

              ${escapeHtml(

                item.accountNumber ||

                "بدون رقم"

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

              <small>الرقم البنكي</small>

              <span>

                ${escapeHtml(

                  item.accountNumber16 ||

                  "لم تتم الإضافة"

                )}

              </span>

            </div>


            <div class="detail">

              <small>الاسم</small>

              <span>

                ${escapeHtml(

                  item.name ||

                  "لم تتم الإضافة"

                )}

              </span>

            </div>


            <div class="detail">

              <small>الفرع</small>

              <span>

                ${escapeHtml(

                  item.branch ||

                  "لم تتم الإضافة"

                )}

              </span>

            </div>


            <div class="detail">

              <small>نوع الحساب</small>

              <span>

                ${escapeHtml(

                  item.accountType ||

                  "لم تتم الإضافة"

                )}

              </span>

            </div>


            <div class="detail">

              <small>تاريخ الطلب</small>

              <span>

                ${escapeHtml(

                  formatDate(item.createdAt)

                )}

              </span>

            </div>


            <div class="detail">

              <small>الحالة</small>

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

    })

    .join("");


  // ========================================================
  // Edit Buttons
  // ========================================================

  document

    .querySelectorAll(".edit-btn")

    .forEach(button => {

      button.addEventListener(

        "click",

        () => {

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

  const item = requests[id];


  if (!item) {

    return;

  }


  selectedRequestId = id;


  modalAccount.textContent =

    `رقم الطلب: ${

      item.accountNumber || id

    }`;


  accountNumber16.value =

    item.accountNumber16 || "";


  accountName.value =

    item.name || "";


  accountBranch.value =

    item.branch || "";


  accountType.value =

    item.accountType || "";


  saveError.textContent = "";


  editModal.classList.remove("hidden");

}


// ==========================================================
// Close Edit
// ==========================================================

function closeEdit() {

  editModal.classList.add("hidden");

  selectedRequestId = null;

}


// ==========================================================
// Login
// ==========================================================

loginBtn.addEventListener(

  "click",

  async () => {

    loginError.textContent = "";


    const email =

      emailInput.value.trim();


    const password =

      passwordInput.value;


    if (!email || !password) {

      loginError.textContent =

        "أدخل البريد الإلكتروني وكلمة المرور.";

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


      loginError.textContent =

        "فشل تسجيل الدخول. تأكد من البيانات.";

    } finally {

      loginBtn.disabled = false;

      loginBtn.textContent =

        "تسجيل الدخول";

    }

  }

);


// ==========================================================
// Password Enter
// ==========================================================

passwordInput.addEventListener(

  "keydown",

  e => {

    if (e.key === "Enter") {

      loginBtn.click();

    }

  }

);


// ==========================================================
// Email Enter
// ==========================================================

emailInput.addEventListener(

  "keydown",

  e => {

    if (e.key === "Enter") {

      loginBtn.click();

    }

  }

);


// ==========================================================
// Logout
// ==========================================================

logoutBtn.addEventListener(

  "click",

  async () => {

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


// ==========================================================
// Close Modal Button
// ==========================================================

closeModal.addEventListener(

  "click",

  closeEdit

);


// ==========================================================
// Close Modal Outside
// ==========================================================

editModal.addEventListener(

  "click",

  e => {

    if (e.target === editModal) {

      closeEdit();

    }

  }

);


// ==========================================================
// Search
// ==========================================================

searchInput.addEventListener(

  "input",

  renderRequests

);


// ==========================================================
// Save Request
// ==========================================================

saveBtn.addEventListener(

  "click",

  async () => {

    saveError.textContent = "";


    if (!selectedRequestId) {

      return;

    }


    const number16 =

      accountNumber16.value.trim();


    const name =

      accountName.value.trim();


    const branch =

      accountBranch.value.trim();


    const type =

      accountType.value.trim();


    // ======================================================
    // Validate 16 Digit Account
    // ======================================================

    if (!/^[0-9]{16}$/.test(number16)) {

      saveError.textContent =

        "الرقم البنكي يجب أن يكون 16 رقمًا.";

      return;

    }


    // ======================================================
    // Validate Other Fields
    // ======================================================

    if (!name || !branch || !type) {

      saveError.textContent =

        "أكمل جميع البيانات.";

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


      saveError.textContent =

        "تعذر الحفظ. تحقق من قواعد Firebase.";

    } finally {

      saveBtn.disabled = false;

      saveBtn.textContent =

        "حفظ البيانات";

    }

  }

);


// ==========================================================
// LOAD REQUESTS
// ==========================================================

function loadRequests() {

  console.log(

    "===================================="

  );

  console.log(

    "بدء قراءة requests..."

  );


  console.log(

    "Firebase UID:",

    currentUser

      ? currentUser.uid

      : "لا يوجد"

  );


  console.log(

    "Admin UID:",

    ADMIN_UID

  );


  console.log(

    "Database URL:",

    firebaseConfig.databaseURL

  );


  console.log(

    "===================================="

  );


  const requestsRef =

    ref(db, "requests");


  onValue(

    requestsRef,


    snapshot => {

      console.log(

        "تمت قراءة requests بنجاح."

      );


      console.log(

        "Snapshot exists:",

        snapshot.exists()

      );


      console.log(

        "Snapshot value:",

        snapshot.val()

      );


      requests =

        snapshot.val() || {};


      renderRequests();

    },


    error => {

      console.error(

        "===================================="

      );


      console.error(

        "خطأ Firebase أثناء قراءة requests"

      );


      console.error(

        "Error code:",

        error.code

      );


      console.error(

        "Error message:",

        error.message

      );


      console.error(

        "Full error:",

        error

      );


      console.error(

        "===================================="

      );


      loading.textContent =

        "تعذر تحميل الطلبات.";

    }

  );

}


// ==========================================================
// AUTH STATE
// ==========================================================

onAuthStateChanged(

  auth,

  user => {

    currentUser = user;


    console.log(

      "===================================="

    );


    console.log(

      "Firebase Auth State Changed"

    );


    console.log(

      "User:",

      user

    );


    if (!user) {

      console.log(

        "لا يوجد مستخدم مسجل الدخول."

      );


      showLogin();


      return;

    }


    console.log(

      "Current UID:",

      user.uid

    );


    console.log(

      "Expected Admin UID:",

      ADMIN_UID

    );


    // ======================================================
    // Check Admin
    // ======================================================

    if (user.uid !== ADMIN_UID) {

      console.error(

        "الحساب الحالي ليس حساب الأدمن."

      );


      signOut(auth);


      loginError.textContent =

        "هذا الحساب غير مصرح له بالدخول إلى لوحة الإدارة.";


      showLogin();


      return;

    }


    // ======================================================
    // Admin Confirmed
    // ======================================================

    console.log(

      "تم التحقق من الأدمن بنجاح."

    );


    showAdmin();


    loadRequests();

  }

);
