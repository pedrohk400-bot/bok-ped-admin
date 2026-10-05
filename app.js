// ==========================================================
// BOK PEDRO
// Firebase + Login + Requests + Edit + OCR
// ==========================================================

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
// Firebase Config
// ==========================================================

const firebaseConfig = {
    apiKey: "AIzaSyDnvmCjIH-PnPfjJPPpk",
    authDomain: "bok-ped.firebaseapp.com",
    databaseURL: "https://bok-ped-default-rtdb.firebaseio.com/",
    projectId: "bok-ped",
    storageBucket: "bok-ped.firebasestorage.app",
    messagingSenderId: "812838230843",
    appId: "1:812838230843:web:f3bd5f59343db42b52b51e",
    measurementId: "G-26SMZR0QCC"
};


// ==========================================================
// Firebase
// ==========================================================

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getDatabase(app);


// ==========================================================
// Admin UID
// ==========================================================

const ADMIN_UID =
    "zuwXPgS4TPYF5GyAYEPEOrsYV0z1";


// ==========================================================
// Login Elements
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


// ==========================================================
// Requests Elements
// ==========================================================

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


// ==========================================================
// Modal Elements
// ==========================================================

const editModal =
    document.getElementById("editModal");

const modalOverlay =
    document.getElementById("modalOverlay");

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
// OCR Elements
// ==========================================================

const ocrImage =
    document.getElementById("ocrImage");

const ocrBtn =
    document.getElementById("ocrBtn");

const ocrPreview =
    document.getElementById("ocrPreview");

const ocrPreviewImage =
    document.getElementById("ocrPreviewImage");

const ocrStatus =
    document.getElementById("ocrStatus");


// ==========================================================
// Variables
// ==========================================================

let currentUser = null;

let allRequests = [];

let selectedRequestId = null;

let selectedRequest = null;

let ocrWorker = null;

let ocrBusy = false;


// ==========================================================
// Helpers
// ==========================================================

function normalizeArabic(text) {

    if (!text) {
        return "";
    }

    return String(text)
        .replace(/\u0640/g, "")
        .replace(/[إأآا]/g, "ا")
        .replace(/ى/g, "ي")
        .replace(/ة/g, "ه")
        .replace(/\s+/g, " ")
        .trim();
}


function cleanText(text) {

    if (!text) {
        return "";
    }

    return String(text)
        .replace(/\r/g, "\n")
        .replace(/[ \t]+/g, " ")
        .replace(/\n{3,}/g, "\n")
        .trim();
}


function showToast(message) {

    toast.textContent = message;

    toast.classList.add("show");

    setTimeout(function() {

        toast.classList.remove("show");

    }, 3000);
}


function escapeHtml(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// ==========================================================
// Login
// ==========================================================

loginBtn.addEventListener("click", async function() {

    loginError.textContent = "";

    const emailValue =
        emailInput.value.trim();

    const passwordValue =
        passwordInput.value;

    if (!emailValue || !passwordValue) {

        loginError.textContent =
            "أدخل البريد الإلكتروني وكلمة المرور.";

        return;
    }


    loginBtn.disabled = true;

    loginBtn.textContent =
        "جاري تسجيل الدخول...";


    try {

        await signInWithEmailAndPassword(
            auth,
            emailValue,
            passwordValue
        );

    } catch (error) {

        console.error(error);

        loginError.textContent =
            "بيانات تسجيل الدخول غير صحيحة.";

    }


    loginBtn.disabled = false;

    loginBtn.textContent =
        "تسجيل الدخول";

});


// ==========================================================
// Enter Login
// ==========================================================

passwordInput.addEventListener("keydown", function(event) {

    if (event.key === "Enter") {

        loginBtn.click();

    }

});


// ==========================================================
// Auth State
// ==========================================================

onAuthStateChanged(auth, function(user) {

    if (!user) {

        currentUser = null;

        loginPage.classList.remove("hidden");

        adminPage.classList.add("hidden");

        return;
    }


    // ======================================================
    // Admin Check
    // ======================================================

    if (user.uid !== ADMIN_UID) {

        signOut(auth);

        loginError.textContent =
            "هذا الحساب غير مصرح له بالدخول.";

        return;
    }


    currentUser = user;

    loginPage.classList.add("hidden");

    adminPage.classList.remove("hidden");

    loadRequests();

});


// ==========================================================
// Logout
// ==========================================================

logoutBtn.addEventListener("click", async function() {

    await signOut(auth);

});


// ==========================================================
// Load Requests
// ==========================================================

function loadRequests() {

    loading.classList.remove("hidden");

    empty.classList.add("hidden");

    const requestsRef =
        ref(db, "requests");


    onValue(
        requestsRef,
        function(snapshot) {

            allRequests = [];

            const data =
                snapshot.val();


            if (data) {

                Object.keys(data).forEach(function(id) {

                    const item =
                        data[id] || {};

                    allRequests.push({

                        id: id,

                        ...item

                    });

                });

            }


            loading.classList.add("hidden");

            updateStats();

            renderRequests();

        },
        function(error) {

            console.error(error);

            loading.classList.add("hidden");

            requestsList.innerHTML = "";

            empty.classList.remove("hidden");

            empty.textContent =
                "تعذر تحميل الطلبات.";

        }
    );

}


// ==========================================================
// Stats
// ==========================================================

function updateStats() {

    const total =
        allRequests.length;


    let pending = 0;

    let completed = 0;


    allRequests.forEach(function(item) {

        const status =
            String(item.status || "")
                .toLowerCase();


        if (
            status === "completed" ||
            status === "complete" ||
            status === "مكتمل"
        ) {

            completed++;

        } else {

            pending++;

        }

    });


    totalCount.textContent =
        total;

    pendingCount.textContent =
        pending;

    completedCount.textContent =
        completed;

}


// ==========================================================
// Search
// ==========================================================

searchInput.addEventListener("input", function() {

    renderRequests();

});


// ==========================================================
// Render Requests
// ==========================================================

function renderRequests() {

    const search =
        searchInput.value.trim();


    let filtered =
        allRequests;


    if (search) {

        filtered =
            allRequests.filter(function(item) {

                return String(
                    item.accountNumber || ""
                ).includes(search);

            });

    }


    requestsList.innerHTML = "";


    if (filtered.length === 0) {

        empty.classList.remove("hidden");

        return;

    }


    empty.classList.add("hidden");


    filtered.forEach(function(item) {

        const card =
            document.createElement("div");

        card.className =
            "request-card";


        const status =
            String(item.status || "pending")
                .toLowerCase();


        let statusText =
            "قيد الانتظار";


        let statusClass =
            "pending";


        if (
            status === "completed" ||
            status === "complete" ||
            status === "مكتمل"
        ) {

            statusText =
                "مكتملة";

            statusClass =
                "completed";

        }


        const account7 =
            item.accountNumber || "غير متوفر";


        const account16 =
            item.accountNumber16 || "غير متوفر";


        const name =
            item.name || "غير متوفر";


        const branch =
            item.branch || "غير متوفر";


        const type =
            item.accountType || "غير متوفر";


        card.innerHTML = `

            <div class="request-top">

                <div>
                    <div class="request-label">
                        رقم الحساب
                    </div>

                    <div class="request-account">
                        ${escapeHtml(account7)}
                    </div>
                </div>

                <span class="status ${statusClass}">
                    ${statusText}
                </span>

            </div>


            <div class="request-info">

                <div class="info-row">
                    <span>رقم الحساب 16</span>
                    <strong>
                        ${escapeHtml(account16)}
                    </strong>
                </div>

                <div class="info-row">
                    <span>الاسم</span>
                    <strong>
                        ${escapeHtml(name)}
                    </strong>
                </div>

                <div class="info-row">
                    <span>نوع الحساب</span>
                    <strong>
                        ${escapeHtml(type)}
                    </strong>
                </div>

                <div class="info-row">
                    <span>الفرع</span>
                    <strong>
                        ${escapeHtml(branch)}
                    </strong>
                </div>

            </div>


            <button class="edit-request-btn">
                تعديل البيانات
            </button>

        `;


        const editButton =
            card.querySelector(
                ".edit-request-btn"
            );


        editButton.addEventListener(
            "click",
            function() {

                openEditModal(item);

            }
        );


        requestsList.appendChild(card);

    });

}


// ==========================================================
// Open Modal
// ==========================================================

function openEditModal(item) {

    selectedRequest =
        item;

    selectedRequestId =
        item.id;


    modalAccount.textContent =
        "الحساب: " +
        (item.accountNumber || "");


    accountNumber16.value =
        item.accountNumber16 || "";


    accountName.value =
        item.name || "";


    accountBranch.value =
        item.branch || "";


    accountType.value =
        item.accountType || "";


    saveError.textContent = "";


    ocrStatus.textContent = "";


    ocrPreview.classList.add("hidden");

    ocrPreviewImage.removeAttribute("src");


    ocrImage.value = "";


    editModal.classList.remove("hidden");

    document.body.classList.add("modal-open");

}


// ==========================================================
// Close Modal
// ==========================================================

function closeEditModal() {

    editModal.classList.add("hidden");

    document.body.classList.remove("modal-open");

    selectedRequest =
        null;

    selectedRequestId =
        null;

}


closeModal.addEventListener(
    "click",
    closeEditModal
);


modalOverlay.addEventListener(
    "click",
    closeEditModal
);


// ==========================================================
// Save
// ==========================================================

saveBtn.addEventListener("click", async function() {

    saveError.textContent = "";


    if (!selectedRequestId) {

        saveError.textContent =
            "لم يتم تحديد الطلب.";

        return;

    }


    const number16 =
        accountNumber16.value
            .replace(/\D/g, "")
            .trim();


    const name =
        accountName.value.trim();


    const branch =
        accountBranch.value.trim();


    const type =
        accountType.value.trim();


    if (!number16) {

        saveError.textContent =
            "أدخل رقم الحساب.";

        return;

    }


    if (number16.length !== 16) {

        saveError.textContent =
            "رقم الحساب يجب أن يكون 16 رقم.";

        return;

    }


    if (!name) {

        saveError.textContent =
            "أدخل الاسم.";

        return;

    }


    if (!type) {

        saveError.textContent =
            "أدخل نوع الحساب.";

        return;

    }


    if (!branch) {

        saveError.textContent =
            "أدخل الفرع.";

        return;

    }


    saveBtn.disabled = true;

    saveBtn.textContent =
        "جاري الحفظ...";


    try {

        const requestRef =
            ref(
                db,
                "requests/" +
                selectedRequestId
            );


        await update(
            requestRef,
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


        showToast(
            "تم حفظ البيانات بنجاح."
        );


        closeEditModal();


    } catch (error) {

        console.error(error);

        saveError.textContent =
            "تعذر حفظ البيانات.";

    }


    saveBtn.disabled = false;

    saveBtn.textContent =
        "حفظ البيانات";

});


// ==========================================================
// OCR - Image Selection
// ==========================================================

ocrImage.addEventListener(
    "change",
    async function() {

        const file =
            ocrImage.files &&
            ocrImage.files[0];


        if (!file) {

            return;

        }


        if (!file.type.startsWith("image/")) {

            ocrStatus.textContent =
                "الملف المحدد ليس صورة.";

            return;

        }


        // ================================================
        // عرض الصورة كاملة بدون قص
        // ================================================

        const previewUrl =
            URL.createObjectURL(file);


        ocrPreviewImage.src =
            previewUrl;


        ocrPreview.classList.remove(
            "hidden"
        );


        ocrStatus.textContent =
            "تم اختيار الصورة. جاري تجهيز القراءة...";


        await runOCR(file);

    }
);


// ==========================================================
// OCR Button
// ==========================================================

ocrBtn.addEventListener(
    "click",
    async function() {

        const file =
            ocrImage.files &&
            ocrImage.files[0];


        if (!file) {

            ocrStatus.textContent =
                "اختر صورة أولاً.";

            return;

        }


        await runOCR(file);

    }
);


// ==========================================================
// Create OCR Worker
// ==========================================================

async function getOCRWorker() {

    if (ocrWorker) {

        return ocrWorker;

    }


    ocrStatus.textContent =
        "جاري تشغيل محرك قراءة النص...";


    ocrWorker =
        await Tesseract.createWorker(
            "ara+eng",
            1
        );


    await ocrWorker.setParameters({

        preserve_interword_spaces:
            "1"

    });


    return ocrWorker;

}


// ==========================================================
// Prepare Image
// ==========================================================

function prepareImage(file) {

    return new Promise(
        function(resolve, reject) {

            const image =
                new Image();


            const url =
                URL.createObjectURL(file);


            image.onload =
                function() {

                    try {

                        let width =
                            image.naturalWidth;


                        let height =
                            image.naturalHeight;


                        // =================================
                        // تكبير/تصغير فقط
                        // لا يوجد قص
                        // =================================

                        const maxWidth =
                            2400;


                        if (width > maxWidth) {

                            const ratio =
                                maxWidth / width;

                            width =
                                Math.round(
                                    width * ratio
                                );

                            height =
                                Math.round(
                                    height * ratio
                                );

                        }


                        const canvas =
                            document.createElement(
                                "canvas"
                            );


                        canvas.width =
                            width;

                        canvas.height =
                            height;


                        const ctx =
                            canvas.getContext(
                                "2d",
                                {
                                    willReadFrequently:
                                        true
                                }
                            );


                        ctx.drawImage(
                            image,
                            0,
                            0,
                            width,
                            height
                        );


                        // =================================
                        // تحسين الصورة
                        // =================================

                        const imageData =
                            ctx.getImageData(
                                0,
                                0,
                                width,
                                height
                            );


                        const data =
                            imageData.data;


                        for (
                            let i = 0;
                            i < data.length;
                            i += 4
                        ) {

                            const r =
                                data[i];

                            const g =
                                data[i + 1];

                            const b =
                                data[i + 2];


                            let gray =
                                (
                                    r * 0.299 +
                                    g * 0.587 +
                                    b * 0.114
                                );


                            // contrast
                            gray =
                                (
                                    gray - 128
                                ) * 1.35 + 128;


                            gray =
                                Math.max(
                                    0,
                                    Math.min(
                                        255,
                                        gray
                                    )
                                );


                            data[i] =
                                gray;

                            data[i + 1] =
                                gray;

                            data[i + 2] =
                                gray;

                        }


                        ctx.putImageData(
                            imageData,
                            0,
                            0
                        );


                        URL.revokeObjectURL(
                            url
                        );


                        resolve(canvas);

                    } catch (error) {

                        URL.revokeObjectURL(
                            url
                        );

                        reject(error);

                    }

                };


            image.onerror =
                function(error) {

                    URL.revokeObjectURL(
                        url
                    );

                    reject(error);

                };


            image.src =
                url;

        }
    );

}


// ==========================================================
// OCR
// ==========================================================

async function runOCR(file) {

    if (ocrBusy) {

        return;

    }


    ocrBusy = true;

    ocrBtn.disabled = true;

    ocrBtn.textContent =
        "جاري القراءة...";


    try {

        ocrStatus.textContent =
            "جاري تجهيز الصورة كاملة...";


        const canvas =
            await prepareImage(file);


        const worker =
            await getOCRWorker();


        ocrStatus.textContent =
            "جاري قراءة الصورة كاملة...";


        const result =
            await worker.recognize(canvas);


        const text =
            cleanText(
                result.data.text
            );


        console.log(
            "OCR TEXT:",
            text
        );


        // ================================================
        // استخراج البيانات الأربعة فقط
        // ================================================

        const extracted =
            extractBankakData(text);


        // ================================================
        // تعبئة الحقول مباشرة
        // ================================================

        if (extracted.accountNumber16) {

            accountNumber16.value =
                extracted.accountNumber16;

        }


        if (extracted.name) {

            accountName.value =
                extracted.name;

        }


        if (extracted.accountType) {

            accountType.value =
                extracted.accountType;

        }


        if (extracted.branch) {

            accountBranch.value =
                extracted.branch;

        }


        let found =
            0;


        if (extracted.accountNumber16) {
            found++;
        }

        if (extracted.name) {
            found++;
        }

        if (extracted.accountType) {
            found++;
        }

        if (extracted.branch) {
            found++;
        }


        if (found === 4) {

            ocrStatus.textContent =
                "تم استخراج البيانات الأربعة بنجاح.";

        } else if (found > 0) {

            ocrStatus.textContent =
                "تم استخراج " +
                found +
                " من 4 حقول. راجع البيانات قبل الحفظ.";

        } else {

            ocrStatus.textContent =
                "لم يتم التعرف على البيانات. حاول بصورة أوضح.";

        }


    } catch (error) {

        console.error(
            "OCR ERROR:",
            error
        );


        ocrStatus.textContent =
            "حدث خطأ أثناء قراءة الصورة.";

    }


    ocrBusy = false;

    ocrBtn.disabled = false;

    ocrBtn.textContent =
        "قراءة الصورة";

}


// ==========================================================
// Extract Bankak Data
// ==========================================================

function extractBankakData(rawText) {

    const text =
        cleanText(rawText);


    const lines =
        text
            .split("\n")
            .map(function(line) {

                return line.trim();

            })
            .filter(function(line) {

                return line.length > 0;

            });


    // ======================================================
    // 1 - رقم الحساب 16 رقم
    // ======================================================

    let account =
        "";


    const joined =
        lines.join(" ");


    const accountMatches =
        joined.match(
            /\d[\d\s]{14,22}\d/g
        );


    if (accountMatches) {

        for (
            let i = 0;
            i < accountMatches.length;
            i++
        ) {

            const candidate =
                accountMatches[i]
                    .replace(/\D/g, "");


            if (
                candidate.length === 16
            ) {

                account =
                    candidate;

                break;

            }

        }

    }


    if (!account) {

        const allDigits =
            text.match(
                /\d{16}/g
            );


        if (allDigits &&
            allDigits.length > 0) {

            account =
                allDigits[0];

        }

    }


    // ======================================================
    // 2 - نوع الحساب
    // ======================================================

    let type =
        "";


    const normalizedText =
        normalizeArabic(text);


    if (
        normalizedText.includes(
            "حساب توفير"
        )
    ) {

        type =
            "حساب توفير";

    } else if (
        normalizedText.includes(
            "توفير"
        )
    ) {

        type =
            "حساب توفير";

    } else if (
        normalizedText.includes(
            "حساب جاري"
        )
    ) {

        type =
            "حساب جاري";

    } else if (
        normalizedText.includes(
            "جاري"
        )
    ) {

        type =
            "حساب جاري";

    } else {

        const typeIndex =
            findLabelIndex(
                lines,
                [
                    "نوع الحساب",
                    "نوع"
                ]
            );


        if (typeIndex !== -1) {

            type =
                cleanFieldAfterLabel(
                    lines[typeIndex],
                    [
                        "نوع الحساب",
                        "نوع"
                    ]
                );


            if (!type &&
                lines[typeIndex + 1]) {

                type =
                    cleanValue(
                        lines[typeIndex + 1]
                    );

            }

        }

    }


    // ======================================================
    // 3 - الفرع
    // ======================================================

    let branch =
        "";


    const branchIndex =
        findLabelIndex(
            lines,
            [
                "الفرع",
                "فرع"
            ]
        );


    if (branchIndex !== -1) {

        branch =
            cleanFieldAfterLabel(
                lines[branchIndex],
                [
                    "الفرع",
                    "فرع"
                ]
            );


        if (!branch &&
            lines[branchIndex + 1]) {

            branch =
                cleanValue(
                    lines[branchIndex + 1]
                );

        }

    }


    // محاولة ثانية للفرع
    if (!branch) {

        for (
            let i = 0;
            i < lines.length;
            i++
        ) {

            const line =
                normalizeArabic(
                    lines[i]
                );


            if (
                line.includes("الخرطوم") ||
                line.includes("امدرمان") ||
                line.includes("بحري") ||
                line.includes("عطبره") ||
                line.includes("المئوي")
            ) {

                if (
                    !line.includes("اسم")
                ) {

                    branch =
                        cleanValue(
                            lines[i]
                        );

                    break;

                }

            }

        }

    }


    // ======================================================
    // 4 - الاسم
    // ======================================================

    let name =
        "";


    const nameIndex =
        findLabelIndex(
            lines,
            [
                "الاسم",
                "اسم العميل",
                "اسم صاحب الحساب",
                "اسم"
            ]
        );


    if (nameIndex !== -1) {

        name =
            cleanFieldAfterLabel(
                lines[nameIndex],
                [
                    "اسم صاحب الحساب",
                    "اسم العميل",
                    "الاسم",
                    "اسم"
                ]
            );


        if (!name &&
            lines[nameIndex + 1]) {

            name =
                cleanValue(
                    lines[nameIndex + 1]
                );

        }

    }


    // ======================================================
    // محاولة اكتشاف الاسم تلقائياً
    // ======================================================

    if (!name) {

        const possibleNames = [];


        for (
            let i = 0;
            i < lines.length;
            i++
        ) {

            const line =
                lines[i].trim();


            if (!line) {
                continue;
            }


            const normalized =
                normalizeArabic(line);


            if (
                normalized.includes("رقم") ||
                normalized.includes("حساب") ||
                normalized.includes("فرع") ||
                normalized.includes("نوع") ||
                normalized.includes("توفير") ||
                normalized.includes("جاري") ||
                normalized.includes("بنك") ||
                normalized.includes("bank")
            ) {

                continue;

            }


            if (
                /\d/.test(line)
            ) {

                continue;

            }


            const arabicChars =
                (
                    line.match(
                        /[\u0600-\u06FF]/g
                    ) || []
                ).length;


            if (
                arabicChars >= 5
            ) {

                possibleNames.push(
                    line
                );

            }

        }


        if (
            possibleNames.length > 0
        ) {

            name =
                possibleNames
                    .sort(
                        function(a, b) {
                            return b.length - a.length;
                        }
                    )[0];

        }

    }


    return {

        accountNumber16:
            account,

        name:
            cleanValue(name),

        accountType:
            cleanValue(type),

        branch:
            cleanValue(branch)

    };

}


// ==========================================================
// Find Label
// ==========================================================

function findLabelIndex(
    lines,
    labels
) {

    for (
        let i = 0;
        i < lines.length;
        i++
    ) {

        const normalized =
            normalizeArabic(
                lines[i]
            );


        for (
            let j = 0;
            j < labels.length;
            j++
        ) {

            const label =
                normalizeArabic(
                    labels[j]
                );


            if (
                normalized.includes(label)
            ) {

                return i;

            }

        }

    }


    return -1;

}


// ==========================================================
// Clean field after label
// ==========================================================

function cleanFieldAfterLabel(
    line,
    labels
) {

    let value =
        line;


    for (
        let i = 0;
        i < labels.length;
        i++
    ) {

        const label =
            labels[i];


        value =
            value.replace(
                new RegExp(
                    "^.*?" +
                    escapeRegExp(label) +
                    "\\s*[:：-]?\\s*",
                    "i"
                ),
                ""
            );

    }


    return cleanValue(value);

}


// ==========================================================
// Clean Value
// ==========================================================

function cleanValue(value) {

    if (!value) {

        return "";

    }


    return String(value)
        .replace(
            /^(الاسم|اسم العميل|اسم صاحب الحساب|نوع الحساب|نوع|الفرع|فرع)\s*[:：-]?\s*/i,
            ""
        )
        .replace(
            /\s+/g,
            " "
        )
        .trim();

}


// ==========================================================
// Escape RegExp
// ==========================================================

function escapeRegExp(value) {

    return String(value)
        .replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
        );

}


// ==========================================================
// Cleanup worker when leaving
// ==========================================================

window.addEventListener(
    "beforeunload",
    async function() {

        if (ocrWorker) {

            try {

                await ocrWorker.terminate();

            } catch (error) {

                console.log(error);

            }

        }

    }
);
