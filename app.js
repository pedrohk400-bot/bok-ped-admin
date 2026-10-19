import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

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
// FIREBASE CONFIGURATION - BOK PEDRO NEW
// ==========================================================

const firebaseConfig = {
    apiKey: "AIzaSyCRUpWEIvw927UEIjdl_G7ecdgZ_V-oDpo",
    authDomain: "bok-pedro-new.firebaseapp.com",
    databaseURL: "https://bok-pedro-new-default-rtdb.firebaseio.com",
    projectId: "bok-pedro-new",
    storageBucket: "bok-pedro-new.firebasestorage.app",
    messagingSenderId: "79997674431",
    appId: "1:79997674431:web:92c4b0db8d8d5d3863370a",
    measurementId: "G-HJ3PYMKG5X"
};


// ==========================================================
// ADMIN
// ==========================================================

const ADMIN_UID =
    "gL1GGUJ7FWS4zRZmzdaf60qqHMD3";

const ADMIN_EMAIL =
    "website-reader@bok-ped.com";


// ==========================================================
// FIREBASE INITIALIZATION
// ==========================================================

const app =
    initializeApp(firebaseConfig);

const auth =
    getAuth(app);

const db =
    getDatabase(app);


// ==========================================================
// ELEMENTS
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
// VARIABLES
// ==========================================================

let currentUser = null;

let requests = {};

let selectedRequestId = null;

let requestsListenerStarted = false;


// ==========================================================
// SHOW LOGIN
// ==========================================================

function showLogin() {

    if (loginPage) {
        loginPage.classList.remove("hidden");
    }

    if (adminPage) {
        adminPage.classList.add("hidden");
    }

}


// ==========================================================
// SHOW ADMIN
// ==========================================================

function showAdmin() {

    if (loginPage) {
        loginPage.classList.add("hidden");
    }

    if (adminPage) {
        adminPage.classList.remove("hidden");
    }

}


// ==========================================================
// TOAST
// ==========================================================

function showToast(text) {

    if (!toast) {
        return;
    }

    toast.textContent = text;

    toast.classList.add("show");

    setTimeout(function () {

        toast.classList.remove("show");

    }, 2500);

}


// ==========================================================
// ESCAPE HTML
// ==========================================================

function escapeHtml(value) {

    return String(
        value == null ? "" : value
    )
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


// ==========================================================
// FORMAT DATE
// ==========================================================

function formatDate(timestamp) {

    if (!timestamp) {
        return "غير متوفر";
    }

    const date = new Date(Number(timestamp));

    if (isNaN(date.getTime())) {
        return "غير متوفر";
    }

    try {

        return new Intl.DateTimeFormat(
            "ar",
            {
                dateStyle: "medium",
                timeStyle: "short"
            }
        ).format(date);

    } catch (error) {

        return date.toLocaleString();

    }

}


// ==========================================================
// RENDER REQUESTS
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
        Object.keys(requests)
        .map(function (id) {

            const data = requests[id] || {};

            return Object.assign(
                { id: id },
                data
            );

        })
        .sort(function (a, b) {

            return Number(b.createdAt || 0) -
                   Number(a.createdAt || 0);

        })
        .filter(function (item) {

            if (!search) {
                return true;
            }

            return String(
                item.accountNumber || item.id || ""
            ).includes(search);

        });


    // ======================================================
    // STATISTICS
    // ======================================================

    const all =
        Object.values(requests);

    if (totalCount) {

        totalCount.textContent =
            all.length;

    }

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


    // ======================================================
    // EMPTY STATE
    // ======================================================

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


    // ======================================================
    // REQUEST CARDS
    // ======================================================

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
                        type="button"
                        class="edit-btn"
                        data-id="${escapeHtml(item.id)}">

                        ${
                            completed
                                ? "تعديل البيانات"
                                : "إكمال البيانات"
                        }

                    </button>

                </div>

            `;

        }).join("");


    // ======================================================
    // EDIT BUTTONS
    // ======================================================

    requestsList
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
// OPEN EDIT
// ==========================================================

function openEdit(id) {

    const item =
        requests[id];

    if (!item) {
        return;
    }

    selectedRequestId = id;

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

        editModal.classList.remove("hidden");

    }

}


// ==========================================================
// CLOSE EDIT
// ==========================================================

function closeEdit() {

    if (editModal) {

        editModal.classList.add("hidden");

    }

    selectedRequestId = null;

}


// ==========================================================
// LOGIN
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

            const pass =
                passwordInput
                    ? passwordInput.value
                    : "";

            if (!email || !pass) {

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

                const result =
                    await signInWithEmailAndPassword(
                        auth,
                        email,
                        pass
                    );

                const user = result.user;

                if (
                    user.uid !== ADMIN_UID ||
                    user.email !== ADMIN_EMAIL
                ) {

                    await signOut(auth);

                    if (loginError) {

                        loginError.textContent =
                            "هذا الحساب غير مصرح له بالدخول.";

                    }

                }

            } catch (error) {

                console.error(
                    "Login error:",
                    error
                );

                let text =
                    "فشل تسجيل الدخول. تأكد من البيانات.";

                if (
                    error.code ===
                    "auth/too-many-requests"
                ) {

                    text =
                        "محاولات كثيرة. انتظر قليلاً ثم حاول مجدداً.";

                } else if (
                    error.code ===
                    "auth/network-request-failed"
                ) {

                    text =
                        "تحقق من اتصال الإنترنت.";

                } else if (
                    error.code ===
                    "auth/operation-not-allowed"
                ) {

                    text =
                        "فعّل تسجيل الدخول بالبريد وكلمة المرور في Firebase.";

                } else if (
                    error.code ===
                    "auth/invalid-email"
                ) {

                    text =
                        "البريد الإلكتروني غير صحيح.";

                } else if (
                    error.code ===
                    "auth/invalid-credential" ||
                    error.code ===
                    "auth/wrong-password" ||
                    error.code ===
                    "auth/user-not-found"
                ) {

                    text =
                        "البريد الإلكتروني أو كلمة المرور غير صحيحة.";

                }

                if (loginError) {
                    loginError.textContent = text;
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
// ENTER TO LOGIN
// ==========================================================

if (passwordInput) {

    passwordInput.addEventListener(
        "keydown",
        function (event) {

            if (event.key === "Enter" && loginBtn) {
                loginBtn.click();
            }

        }
    );

}

if (emailInput) {

    emailInput.addEventListener(
        "keydown",
        function (event) {

            if (event.key === "Enter" && loginBtn) {
                loginBtn.click();
            }

        }
    );

}


// ==========================================================
// LOGOUT
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
// CLOSE MODAL
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
        function (event) {

            if (event.target === editModal) {
                closeEdit();
            }

        }
    );

}


// ==========================================================
// SEARCH
// ==========================================================

if (searchInput) {

    searchInput.addEventListener(
        "input",
        renderRequests
    );

}


// ==========================================================
// SAVE REQUEST
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

            const user = auth.currentUser;

            if (
                !user ||
                user.uid !== ADMIN_UID ||
                user.email !== ADMIN_EMAIL
            ) {

                if (saveError) {

                    saveError.textContent =
                        "انتهت جلسة المدير. سجّل الدخول مجدداً.";

                }

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
                        accountNumber16: number16,
                        name: name,
                        branch: branch,
                        accountType: type,
                        status: "completed",
                        updatedAt: Date.now(),
                        updatedBy: user.uid
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

    if (requestsListenerStarted) {
        return;
    }

    requestsListenerStarted = true;

    if (loading) {

        loading.classList.remove("hidden");

        loading.textContent =
            "جاري تحميل الطلبات...";

    }

    const requestsRef =
        ref(db, "requests");

    onValue(
        requestsRef,

        function (snapshot) {

            requests =
                snapshot.val() || {};

            renderRequests();

        },

        function (error) {

            console.error(
                "Firebase requests error:",
                error.code,
                error.message
            );

            requests = {};

            requestsListenerStarted = false;

            if (loading) {

                loading.classList.remove("hidden");

                loading.textContent =
                    "تعذر تحميل الطلبات. تحقق من صلاحيات Firebase.";

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

        currentUser = user;

        if (!user) {

            requestsListenerStarted = false;

            requests = {};

            showLogin();

            return;

        }

        if (
            user.uid !== ADMIN_UID ||
            user.email !== ADMIN_EMAIL
        ) {

            signOut(auth);

            if (loginError) {

                loginError.textContent =
                    "هذا الحساب غير مصرح له بالدخول إلى لوحة الإدارة.";

            }

            showLogin();

            return;

        }

        showAdmin();

        loadRequests();

    }
);
