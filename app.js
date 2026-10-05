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


// =====================================================
// FIREBASE CONFIG
// =====================================================

const firebaseConfig = {

    apiKey:
        "AIzaSyDnvmZgT9l1p325V3TmCjIH-PnPfjJPPpk",

    authDomain:
        "bok-ped.firebaseapp.com",

    databaseURL:
        "https://bok-ped-default-rtdb.firebaseio.com/",

    projectId:
        "bok-ped",

    storageBucket:
        "bok-ped.firebasestorage.app",

    messagingSenderId:
        "812838230843",

    appId:
        "1:812838230843:web:f3bd5f59343db42b52b51e",

    measurementId:
        "G-26SMZR0QCC"
};


// =====================================================
// FIREBASE
// =====================================================

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getDatabase(app);


// =====================================================
// ADMIN UID
// =====================================================

const ADMIN_UID =
    "zuwXPgS4TPYF5GyAYEPEOrsYV0z1";


// =====================================================
// DOM
// =====================================================

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

const ocrImage =
    document.getElementById("ocrImage");

const ocrBtn =
    document.getElementById("ocrBtn");

const ocrPreview =
    document.getElementById("ocrPreview");

const ocrStatus =
    document.getElementById("ocrStatus");


// =====================================================
// VARIABLES
// =====================================================

let allRequests = [];

let selectedRequestId = null;

let currentUser = null;

let ocrWorker = null;

let ocrWorkerReady = false;

let ocrRunning = false;


// =====================================================
// TOAST
// =====================================================

function showToast(message) {

    toast.textContent = message;

    toast.classList.add("show");

    setTimeout(function () {

        toast.classList.remove("show");

    }, 2500);
}


// =====================================================
// AUTH
// =====================================================

onAuthStateChanged(auth, async function(user) {

    if (!user) {

        currentUser = null;

        loginPage.style.display = "flex";

        adminPage.style.display = "none";

        return;
    }


    if (user.uid !== ADMIN_UID) {

        await signOut(auth);

        loginPage.style.display = "flex";

        adminPage.style.display = "none";

        loginError.textContent =
            "هذا الحساب غير مصرح له بالدخول.";

        return;
    }


    currentUser = user;

    loginPage.style.display = "none";

    adminPage.style.display = "block";

    loginError.textContent = "";

    startRequestsListener();

    prepareOCR();

});


// =====================================================
// LOGIN
// =====================================================

loginBtn.addEventListener("click", async function() {

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
        "جاري تسجيل الدخول...";


    try {

        await signInWithEmailAndPassword(
            auth,
            email,
            password
        );

    } catch (error) {

        loginError.textContent =
            "بيانات تسجيل الدخول غير صحيحة.";

    }


    loginBtn.disabled = false;

    loginBtn.textContent =
        "تسجيل الدخول";

});


// =====================================================
// ENTER LOGIN
// =====================================================

passwordInput.addEventListener(
    "keydown",
    function(event) {

        if (event.key === "Enter") {

            loginBtn.click();

        }

    }
);


// =====================================================
// LOGOUT
// =====================================================

logoutBtn.addEventListener(
    "click",
    async function() {

        await signOut(auth);

    }
);


// =====================================================
// REQUESTS LISTENER
// =====================================================

function startRequestsListener() {

    loading.style.display = "block";

    const requestsRef =
        ref(db, "requests");


    onValue(
        requestsRef,
        function(snapshot) {

            const data =
                snapshot.val() || {};

            allRequests = [];


            Object.keys(data).forEach(function(id) {

                const item =
                    data[id];

                if (!item) {
                    return;
                }


                allRequests.push({

                    id: id,

                    ...item

                });

            });


            loading.style.display = "none";

            updateStats();

            renderRequests();

        },

        function(error) {

            loading.textContent =
                "تعذر تحميل الطلبات.";

        }
    );

}


// =====================================================
// STATS
// =====================================================

function updateStats() {

    let total = allRequests.length;

    let pending = 0;

    let completed = 0;


    allRequests.forEach(function(item) {

        const status =
            String(item.status || "")
                .toLowerCase();


        if (
            status === "completed" ||
            status === "مكتملة"
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


// =====================================================
// RENDER REQUESTS
// =====================================================

function renderRequests() {

    const search =
        searchInput.value
            .trim();


    requestsList.innerHTML = "";


    const filtered =
        allRequests.filter(
            function(item) {

                if (!search) {
                    return true;
                }


                const account =
                    String(
                        item.accountNumber || ""
                    );


                return account.includes(search);

            }
        );


    if (filtered.length === 0) {

        empty.style.display = "block";

        return;

    }


    empty.style.display = "none";


    filtered.forEach(function(item) {

        const card =
            document.createElement("div");

        card.className =
            "request-card";


        const status =
            String(item.status || "pending");


        let statusText =
            "قيد الانتظار";


        if (
            status === "completed" ||
            status === "مكتملة"
        ) {

            statusText =
                "مكتملة";

        }


        card.innerHTML = `

            <div class="request-header">

                <strong>
                    ${escapeHTML(
                        item.accountNumber || "-"
                    )}
                </strong>

                <span class="status">
                    ${escapeHTML(statusText)}
                </span>

            </div>


            <div class="request-row">

                <span>
                    رقم الحساب
                </span>

                <b>
                    ${escapeHTML(
                        item.accountNumber || "-"
                    )}
                </b>

            </div>


            <div class="request-row">

                <span>
                    الاسم
                </span>

                <b>
                    ${escapeHTML(
                        item.name || "لم تتم الإضافة"
                    )}
                </b>

            </div>


            <div class="request-row">

                <span>
                    رقم الحساب 16
                </span>

                <b>
                    ${escapeHTML(
                        item.accountNumber16 || "لم تتم الإضافة"
                    )}
                </b>

            </div>


            <div class="request-row">

                <span>
                    الفرع
                </span>

                <b>
                    ${escapeHTML(
                        item.branch || "لم تتم الإضافة"
                    )}
                </b>

            </div>


            <div class="request-row">

                <span>
                    نوع الحساب
                </span>

                <b>
                    ${escapeHTML(
                        item.accountType || "لم تتم الإضافة"
                    )}
                </b>

            </div>


            <button
                class="edit-btn"
                type="button"
                data-id="${escapeHTML(item.id)}"
            >
                ✏️ تعديل البيانات
            </button>

        `;


        const editButton =
            card.querySelector(".edit-btn");


        editButton.addEventListener(
            "click",
            function() {

                openEditModal(item);

            }
        );


        requestsList.appendChild(card);

    });

}


// =====================================================
// SEARCH
// =====================================================

searchInput.addEventListener(
    "input",
    function() {

        renderRequests();

    }
);


// =====================================================
// OPEN EDIT
// =====================================================

function openEditModal(item) {

    selectedRequestId =
        item.id;


    modalAccount.textContent =
        "رقم الطلب: " +
        String(
            item.accountNumber || "-"
        );


    accountNumber16.value =
        String(
            item.accountNumber16 || ""
        );


    accountName.value =
        String(
            item.name || ""
        );


    accountBranch.value =
        String(
            item.branch || ""
        );


    setAccountType(
        item.accountType || ""
    );


    saveError.textContent = "";

    ocrStatus.textContent = "";

    ocrPreview.style.display =
        "none";

    ocrPreview.removeAttribute(
        "src"
    );


    editModal.style.display =
        "flex";


    document.body.style.overflow =
        "hidden";

}


// =====================================================
// CLOSE EDIT
// =====================================================

function closeEditModal() {

    editModal.style.display =
        "none";

    document.body.style.overflow =
        "";

    selectedRequestId =
        null;

    saveError.textContent =
        "";

    ocrStatus.textContent =
        "";

    ocrPreview.style.display =
        "none";

    ocrPreview.removeAttribute(
        "src"
    );

    ocrImage.value =
        "";

}


closeModal.addEventListener(
    "click",
    closeEditModal
);


// =====================================================
// CLOSE WHEN CLICK OUTSIDE
// =====================================================

editModal.addEventListener(
    "click",
    function(event) {

        if (
            event.target === editModal
        ) {

            closeEditModal();

        }

    }
);


// =====================================================
// ESC
// =====================================================

document.addEventListener(
    "keydown",
    function(event) {

        if (
            event.key === "Escape" &&
            editModal.style.display !== "none"
        ) {

            closeEditModal();

        }

    }
);


// =====================================================
// SET ACCOUNT TYPE
// =====================================================

function setAccountType(value) {

    const clean =
        String(value || "")
            .trim();


    const options =
        Array.from(
            accountType.options
        );


    const found =
        options.find(
            function(option) {

                return normalizeArabicText(
                    option.value
                ) ===
                normalizeArabicText(
                    clean
                );

            }
        );


    if (found) {

        accountType.value =
            found.value;

        return;

    }


    if (
        clean.includes("توفير")
    ) {

        accountType.value =
            "حساب توفير";

        return;

    }


    if (
        clean.includes("جاري")
    ) {

        accountType.value =
            "حساب جاري";

        return;

    }


    accountType.value =
        clean;

}


// =====================================================
// SAVE
// =====================================================

saveBtn.addEventListener(
    "click",
    async function() {

        saveError.textContent = "";


        if (!selectedRequestId) {

            saveError.textContent =
                "لم يتم اختيار طلب.";

            return;

        }


        const number16 =
            accountNumber16.value
                .replace(/\D/g, "")
                .trim();


        const name =
            accountName.value
                .trim();


        const branch =
            accountBranch.value
                .trim();


        const type =
            accountType.value
                .trim();


        if (number16.length !== 16) {

            saveError.textContent =
                "رقم الحساب يجب أن يكون 16 رقمًا.";

            return;

        }


        if (!name) {

            saveError.textContent =
                "أدخل الاسم.";

            return;

        }


        if (!type) {

            saveError.textContent =
                "اختر نوع الحساب.";

            return;

        }


        if (!branch) {

            saveError.textContent =
                "أدخل الفرع.";

            return;

        }


        saveBtn.disabled =
            true;

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
                "تم حفظ البيانات بنجاح"
            );


            closeEditModal();


        } catch (error) {

            saveError.textContent =
                "حدث خطأ أثناء حفظ البيانات.";

        }


        saveBtn.disabled =
            false;

        saveBtn.textContent =
            "حفظ البيانات";

    }
);


// =====================================================
// OCR - PREPARE WORKER
// =====================================================

async function prepareOCR() {

    if (ocrWorkerReady) {
        return;
    }


    if (ocrWorker) {
        return;
    }


    try {

        ocrStatus.textContent =
            "جاري تجهيز محرك القراءة...";


        ocrWorker =
            await Tesseract.createWorker(
                "ara+eng",
                1
            );


        await ocrWorker.setParameters({

            preserve_interword_spaces:
                "1"

        });


        ocrWorkerReady =
            true;


        ocrStatus.textContent =
            "";

    } catch (error) {

        ocrWorker =
            null;

        ocrWorkerReady =
            false;

        ocrStatus.textContent =
            "تعذر تجهيز محرك القراءة.";

    }

}


// =====================================================
// OCR IMAGE BUTTON
// =====================================================

ocrBtn.addEventListener(
    "click",
    function() {

        if (ocrRunning) {
            return;
        }


        ocrImage.click();

    }
);


// =====================================================
// IMAGE SELECTED
// =====================================================

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


        await runFullImageOCR(file);

    }
);


// =====================================================
// FULL IMAGE OCR
// =====================================================

async function runFullImageOCR(file) {

    if (ocrRunning) {
        return;
    }


    ocrRunning =
        true;


    ocrBtn.disabled =
        true;


    ocrBtn.textContent =
        "⚡ جاري استخراج البيانات...";


    ocrStatus.textContent =
        "جاري قراءة الصورة كاملة...";


    try {

        // -------------------------------------------------
        // عرض الصورة للمستخدم
        // -------------------------------------------------

        const previewUrl =
            URL.createObjectURL(file);


        ocrPreview.src =
            previewUrl;


        ocrPreview.style.display =
            "block";


        // -------------------------------------------------
        // تجهيز الصورة للـ OCR
        // -------------------------------------------------

        const processedCanvas =
            await prepareImageForOCR(file);


        // -------------------------------------------------
        // تجهيز Worker إذا لم يكن جاهزًا
        // -------------------------------------------------

        if (!ocrWorkerReady) {

            await prepareOCR();

        }


        if (!ocrWorker) {

            throw new Error(
                "OCR worker unavailable"
            );

        }


        ocrStatus.textContent =
            "⚡ يتم استخراج البيانات الآن...";


        // -------------------------------------------------
        // OCR للصورة كاملة
        // -------------------------------------------------

        const result =
            await ocrWorker.recognize(
                processedCanvas
            );


        const text =
            result &&
            result.data
                ? result.data.text || ""
                : "";


        // -------------------------------------------------
        // استخراج الحقول
        // -------------------------------------------------

        const extracted =
            extractBankakData(text);


        // -------------------------------------------------
        // تعبئة الخانات مباشرة
        // -------------------------------------------------

        fillExtractedFields(
            extracted
        );


        const foundCount =
            [
                extracted.accountNumber16,
                extracted.name,
                extracted.accountType,
                extracted.branch
            ]
            .filter(
                function(value) {

                    return value &&
                        value.trim();

                }
            )
            .length;


        if (foundCount === 4) {

            ocrStatus.textContent =
                "✅ تم استخراج البيانات الأربعة بنجاح.";

        } else if (foundCount > 0) {

            ocrStatus.textContent =
                "⚠️ تم استخراج " +
                foundCount +
                " من 4 حقول. راجع البيانات قبل الحفظ.";

        } else {

            ocrStatus.textContent =
                "❌ لم يتم التعرف على البيانات. جرّب صورة أوضح.";

        }


    } catch (error) {

        ocrStatus.textContent =
            "❌ حدث خطأ أثناء قراءة الصورة.";

    }


    ocrRunning =
        false;


    ocrBtn.disabled =
        false;


    ocrBtn.textContent =
        "🖼️ اختيار صورة من المعرض";

}


// =====================================================
// PREPARE IMAGE
// =====================================================

function prepareImageForOCR(file) {

    return new Promise(
        function(resolve, reject) {

            const image =
                new Image();


            image.onload =
                function() {

                    try {

                        let width =
                            image.naturalWidth;

                        let height =
                            image.naturalHeight;


                        if (
                            !width ||
                            !height
                        ) {

                            reject(
                                new Error(
                                    "Invalid image"
                                )
                            );

                            return;

                        }


                        // ------------------------------------------------
                        // حد أعلى مناسب للسرعة والدقة
                        // ------------------------------------------------

                        const maxWidth =
                            2200;


                        if (
                            width >
                            maxWidth
                        ) {

                            const ratio =
                                maxWidth /
                                width;


                            width =
                                Math.round(
                                    width *
                                    ratio
                                );


                            height =
                                Math.round(
                                    height *
                                    ratio
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


                        // ------------------------------------------------
                        // تحسين الصورة
                        // ------------------------------------------------

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


                            // Grayscale
                            const gray =
                                Math.round(
                                    (
                                        r * 0.299 +
                                        g * 0.587 +
                                        b * 0.114
                                    )
                                );


                            // Contrast
                            let value =
                                (
                                    gray - 128
                                ) *
                                1.25 +
                                128;


                            value =
                                Math.max(
                                    0,
                                    Math.min(
                                        255,
                                        value
                                    )
                                );


                            data[i] =
                                value;

                            data[i + 1] =
                                value;

                            data[i + 2] =
                                value;

                        }


                        ctx.putImageData(
                            imageData,
                            0,
                            0
                        );


                        URL.revokeObjectURL(
                            image.src
                        );


                        resolve(canvas);


                    } catch (error) {

                        reject(error);

                    }

                };


            image.onerror =
                function() {

                    reject(
                        new Error(
                            "Could not load image"
                        )
                    );

                };


            image.src =
                URL.createObjectURL(file);

        }
    );

}


// =====================================================
// EXTRACT BANKAK DATA
// =====================================================

function extractBankakData(text) {

    const normalized =
        normalizeArabicText(
            text
        );


    const lines =
        normalized
            .split(/\r?\n/)
            .map(
                function(line) {

                    return line
                        .replace(
                            /\s+/g,
                            " "
                        )
                        .trim();

                }
            )
            .filter(
                function(line) {

                    return line.length > 0;

                }
            );


    const accountNumber16 =
        find16DigitAccount(
            normalized
        );


    const accountType =
        findAccountType(
            lines
        );


    const branch =
        findFieldAfterLabel(
            lines,
            [
                "الفرع",
                "فرع"
            ]
        );


    let name =
        findFieldAfterLabel(
            lines,
            [
                "الاسم",
                "اسم العميل",
                "اسم صاحب الحساب",
                "اسم الحساب"
            ]
        );


    if (!name) {

        name =
            findNameLine(
                lines,
                accountNumber16,
                accountType,
                branch
            );

    }


    return {

        accountNumber16:
            cleanAccountNumber(
                accountNumber16
            ),

        name:
            cleanName(name),

        accountType:
            cleanValue(accountType),

        branch:
            cleanValue(branch)

    };

}


// =====================================================
// FIND 16 DIGIT ACCOUNT
// =====================================================

function find16DigitAccount(text) {

    const digitText =
        convertArabicDigits(
            text
        );


    const compact =
        digitText.replace(
            /[\s\-_.:]/g,
            ""
        );


    let match =
        compact.match(
            /\d{16}/
        );


    if (match) {

        return match[0];

    }


    const groups =
        digitText.match(
            /\d{4}(?:\s*\d{4}){3}/g
        );


    if (groups) {

        const number =
            groups[0]
                .replace(
                    /\D/g,
                    ""
                );


        if (
            number.length >= 16
        ) {

            return number.substring(
                0,
                16
            );

        }

    }


    const allDigits =
        digitText.match(
            /\d+/g
        ) || [];


    for (
        let i = 0;
        i < allDigits.length;
        i++
    ) {

        if (
            allDigits[i].length === 16
        ) {

            return allDigits[i];

        }

    }


    return "";

}


// =====================================================
// ACCOUNT TYPE
// =====================================================

function findAccountType(lines) {

    for (
        let i = 0;
        i < lines.length;
        i++
    ) {

        const line =
            lines[i];


        if (
            line.includes("نوع الحساب")
        ) {

            const after =
                line
                    .replace(
                        /.*نوع الحساب\s*[:：\-]?\s*/,
                        ""
                    )
                    .trim();


            if (after) {

                return normalizeAccountType(
                    after
                );

            }


            if (
                lines[i + 1]
            ) {

                return normalizeAccountType(
                    lines[i + 1]
                );

            }

        }

    }


    for (
        let i = 0;
        i < lines.length;
        i++
    ) {

        const line =
            lines[i];


        if (
            line.includes("حساب توفير")
        ) {

            return "حساب توفير";

        }


        if (
            line.includes("حساب جاري")
        ) {

            return "حساب جاري";

        }


        if (
            line === "توفير"
        ) {

            return "توفير";

        }


        if (
            line === "جاري"
        ) {

            return "جاري";

        }

    }


    return "";

}


// =====================================================
// FIND VALUE AFTER LABEL
// =====================================================

function findFieldAfterLabel(
    lines,
    labels
) {

    for (
        let i = 0;
        i < lines.length;
        i++
    ) {

        const line =
            lines[i];


        for (
            let j = 0;
            j < labels.length;
            j++
        ) {

            const label =
                labels[j];


            if (
                line === label
            ) {

                if (
                    lines[i + 1]
                ) {

                    return cleanLabelValue(
                        lines[i + 1]
                    );

                }

            }


            if (
                line.startsWith(
                    label + ":"
                ) ||
                line.startsWith(
                    label + " :"
                ) ||
                line.startsWith(
                    label + "-"
                ) ||
                line.startsWith(
                    label + " -"
                )
            ) {

                const value =
                    line.substring(
                        label.length
                    )
                    .replace(
                        /^[\s:：\-]+/,
                        ""
                    )
                    .trim();


                if (value) {

                    return value;

                }

            }


            const index =
                line.indexOf(
                    label
                );


            if (
                index >= 0
            ) {

                const value =
                    line.substring(
                        index +
                        label.length
                    )
                    .replace(
                        /^[\s:：\-]+/,
                        ""
                    )
                    .trim();


                if (value) {

                    return value;

                }

            }

        }

    }


    return "";

}


// =====================================================
// FIND NAME
// =====================================================

function findNameLine(
    lines,
    accountNumber,
    accountType,
    branch
) {

    const excluded = [

        "رقم الحساب",

        "نوع الحساب",

        "الفرع",

        "اسم",

        "الحساب",

        "تاريخ",

        "المبلغ",

        "الرصيد",

        "بنكك",

        "bankak",

        "bank of khartoum",

        "بنك الخرطوم"

    ];


    for (
        let i = 0;
        i < lines.length;
        i++
    ) {

        let line =
            lines[i]
                .trim();


        if (
            !line ||
            line.length < 4
        ) {

            continue;

        }


        if (
            accountNumber &&
            line.includes(
                accountNumber
            )
        ) {

            continue;

        }


        if (
            accountType &&
            line.includes(
                accountType
            )
        ) {

            continue;

        }


        if (
            branch &&
            line.includes(
                branch
            )
        ) {

            continue;

        }


        let lower =
            line.toLowerCase();


        let skip =
            false;


        for (
            let j = 0;
            j < excluded.length;
            j++
        ) {

            if (
                lower.includes(
                    excluded[j].toLowerCase()
                )
            ) {

                skip = true;

                break;

            }

        }


        if (skip) {
            continue;
        }


        if (
            containsNumber(line)
        ) {

            continue;

        }


        const arabicLetters =
            (
                line.match(
                    /[\u0600-\u06FF]/g
                ) || []
            ).length;


        if (
            arabicLetters >= 3
        ) {

            return line;

        }

    }


    return "";

}


// =====================================================
// CLEAN NAME
// =====================================================

function cleanName(value) {

    if (!value) {
        return "";
    }


    let result =
        String(value)
            .replace(
                /^(الاسم|اسم العميل|اسم صاحب الحساب|اسم الحساب)\s*[:：\-]?\s*/i,
                ""
            )
            .replace(
                /\s+/g,
                " "
            )
            .trim();


    return result;

}


// =====================================================
// CLEAN VALUE
// =====================================================

function cleanValue(value) {

    if (!value) {
        return "";
    }


    return String(value)
        .replace(
            /\s+/g,
            " "
        )
        .replace(
            /^[\s:：\-]+/,
            ""
        )
        .trim();

}


// =====================================================
// CLEAN LABEL VALUE
// =====================================================

function cleanLabelValue(value) {

    if (!value) {
        return "";
    }


    return String(value)
        .replace(
            /^[\s:：\-]+/,
            ""
        )
        .trim();

}


// =====================================================
// CLEAN ACCOUNT NUMBER
// =====================================================

function cleanAccountNumber(value) {

    if (!value) {
        return "";
    }


    return convertArabicDigits(
        value
    )
    .replace(
        /\D/g,
        ""
    )
    .substring(
        0,
        16
    );

}


// =====================================================
// NORMALIZE ACCOUNT TYPE
// =====================================================

function normalizeAccountType(value) {

    const text =
        normalizeArabicText(
            value
        );


    if (
        text.includes("توفير")
    ) {

        return "حساب توفير";

    }


    if (
        text.includes("جاري")
    ) {

        return "حساب جاري";

    }


    return value.trim();

}


// =====================================================
// FILL OCR RESULTS
// =====================================================

function fillExtractedFields(data) {

    if (
        data.accountNumber16
    ) {

        accountNumber16.value =
            data.accountNumber16;

    }


    if (
        data.name
    ) {

        accountName.value =
            data.name;

    }


    if (
        data.accountType
    ) {

        setAccountType(
            data.accountType
        );

    }


    if (
        data.branch
    ) {

        accountBranch.value =
            data.branch;

    }


    // -------------------------------------------------
    // وضع التركيز على أول خانة ناقصة
    // -------------------------------------------------

    if (
        !accountNumber16.value.trim()
    ) {

        accountNumber16.focus();

    } else if (
        !accountName.value.trim()
    ) {

        accountName.focus();

    } else if (
        !accountType.value.trim()
    ) {

        accountType.focus();

    } else if (
        !accountBranch.value.trim()
    ) {

        accountBranch.focus();

    }

}


// =====================================================
// NORMALIZE ARABIC
// =====================================================

function normalizeArabicText(text) {

    return String(text || "")
        .replace(
            /أ|إ|آ/g,
            "ا"
        )
        .replace(
            /ى/g,
            "ي"
        )
        .replace(
            /ة/g,
            "ه"
        )
        .replace(
            /ـ/g,
            ""
        )
        .replace(
            /[\u064B-\u065F]/g,
            ""
        )
        .replace(
            /\s+/g,
            " "
        )
        .trim();

}


// =====================================================
// ARABIC DIGITS -> ENGLISH
// =====================================================

function convertArabicDigits(text) {

    return String(text || "")
        .replace(
            /٠/g,
            "0"
        )
        .replace(
            /١/g,
            "1"
        )
        .replace(
            /٢/g,
            "2"
        )
        .replace(
            /٣/g,
            "3"
        )
        .replace(
            /٤/g,
            "4"
        )
        .replace(
            /٥/g,
            "5"
        )
        .replace(
            /٦/g,
            "6"
        )
        .replace(
            /٧/g,
            "7"
        )
        .replace(
            /٨/g,
            "8"
        )
        .replace(
            /٩/g,
            "9"
        );

}


// =====================================================
// CONTAINS NUMBER
// =====================================================

function containsNumber(text) {

    return /\d|[٠-٩]/.test(
        String(text || "")
    );

}


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHTML(value) {

    return String(value ?? "")
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


// =====================================================
// KEEP ACCOUNT NUMBER NUMERIC
// =====================================================

accountNumber16.addEventListener(
    "input",
    function() {

        this.value =
            convertArabicDigits(
                this.value
            )
            .replace(
                /\D/g,
                ""
            )
            .substring(
                0,
                16
            );

    }
);


// =====================================================
// CLEANUP OCR WORKER
// =====================================================

window.addEventListener(
    "beforeunload",
    async function() {

        if (ocrWorker) {

            try {

                await ocrWorker.terminate();

            } catch (error) {

                // ignore

            }

        }

    }
);
