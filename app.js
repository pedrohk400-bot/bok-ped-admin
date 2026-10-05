// ==========================================================
// FIREBASE
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
// FIREBASE CONFIG
// ==========================================================

const firebaseConfig = {

    apiKey:
        "AIzaSyDnvmRTgZl1p325V3TmCjIH-PnPfjJPPpk",

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


// ==========================================================
// INITIALIZE
// ==========================================================

const app =
    initializeApp(firebaseConfig);


const auth =
    getAuth(app);


const db =
    getDatabase(app);


// ==========================================================
// ADMIN UID
// ==========================================================

const ADMIN_UID =
    "zuwXPgS4TPYF5GyAYEPEOrsYV0z1";


// ==========================================================
// DOM
// ==========================================================

const loginPage =
    document.getElementById("loginPage");


const adminPage =
    document.getElementById("adminPage");


const email =
    document.getElementById("email");


const password =
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


// ==========================================================
// MODAL
// ==========================================================

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
// OCR DOM
// ==========================================================

const ocrImage =
    document.getElementById("ocrImage");


const ocrBtn =
    document.getElementById("ocrBtn");


const ocrPreview =
    document.getElementById("ocrPreview");


const ocrStatus =
    document.getElementById("ocrStatus");


// ==========================================================
// STATE
// ==========================================================

let currentUser =
    null;


let requests =
    {};


let selectedRequestId =
    null;


// ==========================================================
// OCR WORKER
// ==========================================================

let ocrWorker =
    null;


let ocrReady =
    false;


// ==========================================================
// LOGIN
// ==========================================================

loginBtn.addEventListener(
    "click",
    async function () {

        loginError.textContent =
            "";


        const userEmail =
            email.value.trim();


        const userPassword =
            password.value;


        if (
            !userEmail ||
            !userPassword
        ) {

            loginError.textContent =
                "أدخل البريد الإلكتروني وكلمة المرور.";

            return;

        }


        loginBtn.disabled =
            true;


        loginBtn.textContent =
            "جاري تسجيل الدخول...";


        try {

            await signInWithEmailAndPassword(
                auth,
                userEmail,
                userPassword
            );

        } catch (error) {

            console.error(error);


            loginError.textContent =
                "بيانات تسجيل الدخول غير صحيحة.";


            loginBtn.disabled =
                false;


            loginBtn.textContent =
                "تسجيل الدخول";

        }

    }
);


// ==========================================================
// ENTER LOGIN
// ==========================================================

password.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key === "Enter"
        ) {

            loginBtn.click();

        }

    }
);


// ==========================================================
// AUTH
// ==========================================================

onAuthStateChanged(
    auth,
    function (user) {


        if (!user) {

            currentUser =
                null;


            loginPage.style.display =
                "flex";


            adminPage.style.display =
                "none";


            return;

        }


        if (
            user.uid !==
            ADMIN_UID
        ) {

            signOut(auth);


            loginError.textContent =
                "هذا الحساب غير مصرح له بالدخول.";


            return;

        }


        currentUser =
            user;


        loginPage.style.display =
            "none";


        adminPage.style.display =
            "block";


        loadRequests();


        /*
         * نجهز OCR في الخلفية
         * حتى لا ينتظر المستخدم عند أول صورة.
         */
        prepareOCR();

    }
);


// ==========================================================
// LOGOUT
// ==========================================================

logoutBtn.addEventListener(
    "click",
    async function () {

        await signOut(auth);

    }
);


// ==========================================================
// LOAD REQUESTS
// ==========================================================

function loadRequests() {


    loading.style.display =
        "block";


    empty.style.display =
        "none";


    const requestsRef =
        ref(
            db,
            "requests"
        );


    onValue(
        requestsRef,
        function (snapshot) {


            const data =
                snapshot.val();


            requests =
                data || {};


            loading.style.display =
                "none";


            renderRequests();

        },


        function (error) {


            console.error(error);


            loading.style.display =
                "none";


            requestsList.innerHTML =
                "";


            empty.style.display =
                "block";


            empty.textContent =
                "تعذر تحميل الطلبات.";

        }
    );

}


// ==========================================================
// RENDER
// ==========================================================

function renderRequests() {


    requestsList.innerHTML =
        "";


    const search =
        searchInput.value
            .trim()
            .toLowerCase();


    const items =
        Object.entries(
            requests
        );


    const filtered =
        items.filter(
            function ([id, item]) {


                if (!search) {

                    return true;

                }


                const account =
                    String(
                        item.accountNumber ||
                        ""
                    ).toLowerCase();


                return account.includes(
                    search
                );

            }
        );


    totalCount.textContent =
        items.length;


    let pending =
        0;


    let completed =
        0;


    items.forEach(
        function ([id, item]) {


            if (
                item.status ===
                "completed"
            ) {

                completed++;

            } else {

                pending++;

            }

        }
    );


    pendingCount.textContent =
        pending;


    completedCount.textContent =
        completed;


    if (
        filtered.length === 0
    ) {

        empty.style.display =
            "block";

        return;

    }


    empty.style.display =
        "none";


    filtered.forEach(
        function ([id, item]) {


            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "request-card";


            const account =
                item.accountNumber ||
                "-";


            const account16 =
                item.accountNumber16 ||
                "-";


            const name =
                item.name ||
                "-";


            const branch =
                item.branch ||
                "-";


            const type =
                item.accountType ||
                "-";


            const status =
                item.status ===
                "completed"
                    ? "مكتملة"
                    : "قيد الانتظار";


            card.innerHTML = `

                <div class="request-header">

                    <strong>
                        حساب ${escapeHTML(account)}
                    </strong>

                    <span class="status">
                        ${escapeHTML(status)}
                    </span>

                </div>


                <div class="request-row">

                    <span>
                        رقم الحساب
                    </span>

                    <b>
                        ${escapeHTML(account16)}
                    </b>

                </div>


                <div class="request-row">

                    <span>
                        الاسم
                    </span>

                    <b>
                        ${escapeHTML(name)}
                    </b>

                </div>


                <div class="request-row">

                    <span>
                        الفرع
                    </span>

                    <b>
                        ${escapeHTML(branch)}
                    </b>

                </div>


                <div class="request-row">

                    <span>
                        نوع الحساب
                    </span>

                    <b>
                        ${escapeHTML(type)}
                    </b>

                </div>


                <button
                    class="edit-btn"
                    type="button"
                    data-id="${escapeHTML(id)}">

                    إكمال / تعديل

                </button>

            `;


            const editButton =
                card.querySelector(
                    ".edit-btn"
                );


            editButton.addEventListener(
                "click",
                function () {

                    openEdit(id);

                }
            );


            requestsList.appendChild(
                card
            );

        }
    );

}


// ==========================================================
// SEARCH
// ==========================================================

searchInput.addEventListener(
    "input",
    function () {

        renderRequests();

    }
);


// ==========================================================
// OPEN EDIT
// ==========================================================

function openEdit(id) {


    const item =
        requests[id];


    if (!item) {

        return;

    }


    selectedRequestId =
        id;


    modalAccount.textContent =
        "رقم الطلب: " +
        (
            item.accountNumber ||
            "-"
        );


    accountNumber16.value =
        item.accountNumber16 ||
        "";


    accountName.value =
        item.name ||
        "";


    accountBranch.value =
        item.branch ||
        "";


    accountType.value =
        item.accountType ||
        "";


    saveError.textContent =
        "";


    ocrStatus.textContent =
        "";


    ocrPreview.style.display =
        "none";


    ocrPreview.src =
        "";


    ocrImage.value =
        "";


    editModal.style.display =
        "flex";

}


// ==========================================================
// CLOSE
// ==========================================================

closeModal.addEventListener(
    "click",
    closeEdit
);


function closeEdit() {


    editModal.style.display =
        "none";


    selectedRequestId =
        null;


    saveError.textContent =
        "";

}


// ==========================================================
// OUTSIDE MODAL
// ==========================================================

editModal.addEventListener(
    "click",
    function (event) {


        if (
            event.target ===
            editModal
        ) {

            closeEdit();

        }

    }
);


// ==========================================================
// OCR - GALLERY
// ==========================================================

ocrBtn.addEventListener(
    "click",
    function () {


        /*
         * لا توجد:
         *
         * capture="camera"
         *
         * لذلك يفتح اختيار الصور.
         */

        ocrImage.click();

    }
);


// ==========================================================
// IMAGE SELECTED
// ==========================================================

ocrImage.addEventListener(
    "change",
    async function () {


        const file =
            ocrImage.files &&
            ocrImage.files[0];


        if (!file) {

            return;

        }


        // ==============================================
        // PREVIEW
        // ==============================================

        const previewURL =
            URL.createObjectURL(
                file
            );


        ocrPreview.src =
            previewURL;


        ocrPreview.style.display =
            "block";


        // ==============================================
        // OCR
        // ==============================================

        await fastOCR(
            file
        );

    }
);


// ==========================================================
// PREPARE OCR
// ==========================================================

async function prepareOCR() {


    if (
        ocrReady
    ) {

        return;

    }


    if (
        typeof Tesseract ===
        "undefined"
    ) {

        console.error(
            "Tesseract غير محمل"
        );

        return;

    }


    try {


        /*
         * إنشاء Worker مرة واحدة.
         *
         * بعد ذلك الصور التالية
         * لا تحتاج تحميل Worker جديد.
         */

        ocrWorker =
            await Tesseract.createWorker(
                "ara+eng",
                1,
                {

                    logger:
                        function (message) {


                            if (
                                message.status ===
                                "loading language"
                            ) {

                                console.log(
                                    "تحميل لغة OCR..."
                                );

                            }


                            if (
                                message.status ===
                                "initializing api"
                            ) {

                                console.log(
                                    "تهيئة OCR..."
                                );

                            }

                        }

                }
            );


        ocrReady =
            true;


        console.log(
            "OCR جاهز"
        );


    } catch (error) {


        console.error(
            "OCR INIT ERROR:",
            error
        );


        ocrWorker =
            null;


        ocrReady =
            false;

    }

}


// ==========================================================
// FAST OCR
// ==========================================================

async function fastOCR(file) {


    ocrBtn.disabled =
        true;


    ocrStatus.textContent =
        "⚡ تجهيز الصورة...";


    try {


        // ==============================================
        // تجهيز سريع
        // ==============================================

        const processed =
            await prepareFastImage(
                file
            );


        // ==============================================
        // تأكد من OCR
        // ==============================================

        if (
            !ocrReady
        ) {

            ocrStatus.textContent =
                "⚡ تشغيل محرك القراءة...";


            await prepareOCR();

        }


        if (
            !ocrWorker
        ) {

            throw new Error(
                "OCR Worker غير جاهز"
            );

        }


        ocrStatus.textContent =
            "⚡ قراءة بيانات الحساب...";


        // ==============================================
        // OCR
        // ==============================================

        const result =
            await ocrWorker.recognize(
                processed
            );


        const text =
            result.data.text ||
            "";


        console.log(
            "OCR TEXT:",
            text
        );


        // ==============================================
        // استخراج الأربعة فقط
        // ==============================================

        const data =
            extractBankakFields(
                text
            );


        // ==============================================
        // ACCOUNT NUMBER
        // ==============================================

        if (
            data.accountNumber16
        ) {

            accountNumber16.value =
                data.accountNumber16;

        }


        // ==============================================
        // NAME
        // ==============================================

        if (
            data.name
        ) {

            accountName.value =
                data.name;

        }


        // ==============================================
        // BRANCH
        // ==============================================

        if (
            data.branch
        ) {

            accountBranch.value =
                data.branch;

        }


        // ==============================================
        // TYPE
        // ==============================================

        if (
            data.accountType
        ) {

            accountType.value =
                data.accountType;

        }


        // ==============================================
        // COUNT
        // ==============================================

        let count =
            0;


        if (
            data.accountNumber16
        ) {

            count++;

        }


        if (
            data.name
        ) {

            count++;

        }


        if (
            data.accountType
        ) {

            count++;

        }


        if (
            data.branch
        ) {

            count++;

        }


        // ==============================================
        // RESULT
        // ==============================================

        if (
            count === 4
        ) {


            ocrStatus.textContent =
                "✓ تم استخراج البيانات الأربعة.";


        } else if (
            count > 0
        ) {


            ocrStatus.textContent =
                "تم استخراج " +
                count +
                " من 4 بيانات. راجع البيانات.";


        } else {


            ocrStatus.textContent =
                "لم يتم العثور على البيانات. جرّب صورة أوضح.";

        }


    } catch (error) {


        console.error(
            "OCR ERROR:",
            error
        );


        ocrStatus.textContent =
            "تعذر قراءة الصورة.";

    }


    ocrBtn.disabled =
        false;

}


// ==========================================================
// FAST IMAGE PROCESSING
// ==========================================================

function prepareFastImage(file) {


    return new Promise(
        function (resolve, reject) {


            const image =
                new Image();


            image.onload =
                function () {


                    URL.revokeObjectURL(
                        image.src
                    );


                    // ==========================================
                    // تصغير الصورة
                    // ==========================================

                    const MAX_WIDTH =
                        1400;


                    let width =
                        image.naturalWidth;


                    let height =
                        image.naturalHeight;


                    if (
                        width >
                        MAX_WIDTH
                    ) {


                        const ratio =
                            MAX_WIDTH /
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


                    // ==========================================
                    // Canvas
                    // ==========================================

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


                    // ==========================================
                    // الاقتصاص
                    //
                    // نركز على منطقة محتوى الحساب.
                    //
                    // لا نقص الصورة بشدة حتى لا نفقد
                    // أحد الحقول في اختلاف أحجام الصور.
                    // ==========================================

                    const cropTop =
                        Math.floor(
                            height * 0.18
                        );


                    const cropBottom =
                        Math.floor(
                            height * 0.92
                        );


                    const cropHeight =
                        cropBottom -
                        cropTop;


                    const cropCanvas =
                        document.createElement(
                            "canvas"
                        );


                    cropCanvas.width =
                        width;


                    cropCanvas.height =
                        cropHeight;


                    const cropCtx =
                        cropCanvas.getContext(
                            "2d",
                            {
                                willReadFrequently:
                                    true
                            }
                        );


                    cropCtx.drawImage(
                        canvas,
                        0,
                        cropTop,
                        width,
                        cropHeight,
                        0,
                        0,
                        width,
                        cropHeight
                    );


                    // ==========================================
                    // تحسين OCR
                    // ==========================================

                    const imageData =
                        cropCtx.getImageData(
                            0,
                            0,
                            width,
                            cropHeight
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


                        // ======================================
                        // Contrast
                        // ======================================

                        gray =
                            (
                                gray -
                                128
                            ) *
                            1.45 +
                            128;


                        if (
                            gray < 0
                        ) {

                            gray =
                                0;

                        }


                        if (
                            gray > 255
                        ) {

                            gray =
                                255;

                        }


                        data[i] =
                            gray;


                        data[i + 1] =
                            gray;


                        data[i + 2] =
                            gray;


                    }


                    cropCtx.putImageData(
                        imageData,
                        0,
                        0
                    );


                    // ==========================================
                    // JPEG سريع
                    // ==========================================

                    cropCanvas.toBlob(
                        function (blob) {


                            if (!blob) {


                                reject(
                                    new Error(
                                        "تعذر تجهيز الصورة"
                                    )
                                );


                                return;

                            }


                            resolve(
                                blob
                            );


                        },
                        "image/jpeg",
                        0.78
                    );


                };


            image.onerror =
                function () {


                    reject(
                        new Error(
                            "تعذر فتح الصورة"
                        )
                    );


                };


            image.src =
                URL.createObjectURL(
                    file
                );

        }
    );

}


// ==========================================================
// NORMALIZE ARABIC
// ==========================================================

function normalizeArabicText(
    text
) {


    let value =
        String(
            text ||
            ""
        );


    const arabic =
        "٠١٢٣٤٥٦٧٨٩";


    const persian =
        "۰۱۲۳۴۵۶۷۸۹";


    for (
        let i = 0;
        i < 10;
        i++
    ) {


        value =
            value.replace(
                new RegExp(
                    arabic[i],
                    "g"
                ),
                String(i)
            );


        value =
            value.replace(
                new RegExp(
                    persian[i],
                    "g"
                ),
                String(i)
            );

    }


    value =
        value.replace(
            /\u00A0/g,
            " "
        );


    return value;

}


// ==========================================================
// EXTRACT BANKAK FIELDS
// ==========================================================

function extractBankakFields(
    text
) {


    const clean =
        normalizeArabicText(
            text
        );


    const lines =
        clean
            .split(/\r?\n/)
            .map(
                function (line) {

                    return line
                        .replace(
                            /\s+/g,
                            " "
                        )
                        .trim();

                }
            )
            .filter(
                function (line) {

                    return line.length > 0;

                }
            );


    const result = {

        accountNumber16:
            find16DigitAccount(
                clean
            ),

        name:
            findFieldAfterLabel(
                lines,
                [
                    "الاسم",
                    "اسم العميل",
                    "اسم صاحب الحساب"
                ]
            ),

        accountType:
            findAccountType(
                clean
            ),

        branch:
            findFieldAfterLabel(
                lines,
                [
                    "الفرع",
                    "فرع"
                ]
            )

    };


    // ==============================================
    // Fallback Name
    // ==============================================

    if (
        !result.name
    ) {

        result.name =
            findNameLine(
                lines
            );

    }


    // ==============================================
    // تنظيف
    // ==============================================

    result.name =
        cleanName(
            result.name
        );


    result.branch =
        cleanValue(
            result.branch
        );


    return result;

}


// ==========================================================
// FIND 16 DIGIT ACCOUNT
// ==========================================================

function find16DigitAccount(
    text
) {


    // ==============================================
    // رقم متصل
    // ==============================================

    const direct =
        text.match(
            /\d{16}/g
        );


    if (
        direct &&
        direct.length
    ) {


        for (
            let i = 0;
            i < direct.length;
            i++
        ) {


            if (
                direct[i].length === 16
            ) {

                return direct[i];

            }

        }

    }


    // ==============================================
    // مجموعات
    //
    // 1003 0778 8697 0001
    // ==============================================

    const grouped =
        text.match(
            /\d(?:[\s-]*\d){15,20}/g
        );


    if (
        grouped &&
        grouped.length
    ) {


        for (
            let i = 0;
            i < grouped.length;
            i++
        ) {


            const number =
                grouped[i]
                    .replace(
                        /[^0-9]/g,
                        ""
                    );


            if (
                number.length === 16
            ) {

                return number;

            }

        }

    }


    return "";

}


// ==========================================================
// ACCOUNT TYPE
// ==========================================================

function findAccountType(
    text
) {


    const value =
        String(
            text ||
            ""
        );


    if (
        value.includes(
            "توفير مميز"
        )
    ) {

        return "توفير مميز";

    }


    if (
        value.includes(
            "حساب توفير"
        )
    ) {

        return "حساب توفير";

    }


    if (
        value.includes(
            "توفير"
        )
    ) {

        return "حساب توفير";

    }


    if (
        value.includes(
            "حساب جاري"
        )
    ) {

        return "حساب جاري";

    }


    if (
        value.includes(
            "جاري"
        )
    ) {

        return "حساب جاري";

    }


    return "";

}


// ==========================================================
// FIELD AFTER LABEL
// ==========================================================

function findFieldAfterLabel(
    lines,
    labels
) {


    for (
        let i = 0;
        i < lines.length;
        i++
    ) {


        const current =
            lines[i];


        for (
            let j = 0;
            j < labels.length;
            j++
        ) {


            const label =
                labels[j];


            // ==========================================
            // السطر نفسه
            // الاسم: محمد
            // ==========================================

            if (
                current.indexOf(
                    label
                ) === 0
            ) {


                let value =
                    current
                        .substring(
                            label.length
                        )
                        .replace(
                            /^[\s:：\-]+/,
                            ""
                        )
                        .trim();


                if (
                    value &&
                    value !== label
                ) {

                    return value;

                }


                // ======================================
                // السطر التالي
                // ======================================

                if (
                    lines[i + 1]
                ) {

                    return lines[i + 1];

                }

            }

        }

    }


    return "";

}


// ==========================================================
// FIND NAME
// ==========================================================

function findNameLine(
    lines
) {


    const labels = [

        "الاسم",

        "اسم العميل",

        "اسم صاحب الحساب"

    ];


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


            if (
                line.includes(
                    labels[j]
                )
            ) {


                let value =
                    line
                        .replace(
                            labels[j],
                            ""
                        )
                        .replace(
                            /^[\s:：\-]+/,
                            ""
                        )
                        .trim();


                if (
                    value &&
                    !containsNumber(
                        value
                    )
                ) {

                    return value;

                }


                if (
                    lines[i + 1] &&
                    !containsNumber(
                        lines[i + 1]
                    )
                ) {

                    return lines[i + 1];

                }

            }

        }

    }


    return "";

}


// ==========================================================
// CLEAN NAME
// ==========================================================

function cleanName(
    value
) {


    if (!value) {

        return "";

    }


    let result =
        String(
            value
        );


    result =
        result.replace(
            /^(الاسم|اسم العميل|اسم صاحب الحساب)\s*[:：\-]?\s*/,
            ""
        );


    result =
        result.replace(
            /\s+/g,
            " "
        );


    return result.trim();

}


// ==========================================================
// CLEAN VALUE
// ==========================================================

function cleanValue(
    value
) {


    if (!value) {

        return "";

    }


    return String(
        value
    )
        .replace(
            /^[\s:：\-]+/,
            ""
        )
        .replace(
            /\s+/g,
            " "
        )
        .trim();

}


// ==========================================================
// CONTAINS NUMBER
// ==========================================================

function containsNumber(
    value
) {


    return /[0-9٠-٩۰-۹]/.test(
        String(
            value ||
            ""
        )
    );

}


// ==========================================================
// ESCAPE HTML
// ==========================================================

function escapeHTML(
    value
) {


    return String(
        value ||
        ""
    )
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


// ==========================================================
// SAVE
// ==========================================================

saveBtn.addEventListener(
    "click",
    async function () {


        saveError.textContent =
            "";


        if (
            !selectedRequestId
        ) {


            saveError.textContent =
                "لم يتم اختيار طلب.";


            return;

        }


        const number16 =
            accountNumber16.value
                .replace(
                    /\s/g,
                    ""
                )
                .trim();


        const name =
            accountName.value.trim();


        const branch =
            accountBranch.value.trim();


        const type =
            accountType.value.trim();


        // ==============================================
        // Validation
        // ==============================================

        if (
            !/^\d{16}$/.test(
                number16
            )
        ) {


            saveError.textContent =
                "رقم الحساب يجب أن يكون 16 رقم.";


            return;

        }


        if (!name) {


            saveError.textContent =
                "أدخل اسم صاحب الحساب.";


            return;

        }


        if (!branch) {


            saveError.textContent =
                "أدخل الفرع.";


            return;

        }


        if (!type) {


            saveError.textContent =
                "اختر نوع الحساب.";


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
                "تم حفظ البيانات بنجاح ✓"
            );


            closeEdit();


        } catch (error) {


            console.error(
                error
            );


            saveError.textContent =
                "تعذر حفظ البيانات. حاول مرة أخرى.";

        }


        saveBtn.disabled =
            false;


        saveBtn.textContent =
            "حفظ وإكمال الطلب";

    }
);


// ==========================================================
// TOAST
// ==========================================================

function showToast(
    message
) {


    toast.textContent =
        message;


    toast.classList.add(
        "show"
    );


    setTimeout(
        function () {

            toast.classList.remove(
                "show"
            );

        },
        2500
    );

}


// ==========================================================
// STOP OCR
// ==========================================================

window.addEventListener(
    "beforeunload",
    async function () {


        if (
            ocrWorker
        ) {


            try {

                await ocrWorker.terminate();

            } catch (error) {

                console.log(
                    error
                );

            }

        }

    }
);
