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
    initializeApp(
        firebaseConfig
    );


const auth =
    getAuth(
        app
    );


const db =
    getDatabase(
        app
    );


// ==========================================================
// ADMIN
// ==========================================================

const ADMIN_UID =
    "zuwXPgS4TPYF5GyAYEPEOrsYV0z1";


// ==========================================================
// DOM
// ==========================================================

const loginPage =
    document.getElementById(
        "loginPage"
    );


const adminPage =
    document.getElementById(
        "adminPage"
    );


const email =
    document.getElementById(
        "email"
    );


const password =
    document.getElementById(
        "password"
    );


const loginBtn =
    document.getElementById(
        "loginBtn"
    );


const loginError =
    document.getElementById(
        "loginError"
    );


const logoutBtn =
    document.getElementById(
        "logoutBtn"
    );


const requestsList =
    document.getElementById(
        "requestsList"
    );


const loading =
    document.getElementById(
        "loading"
    );


const empty =
    document.getElementById(
        "empty"
    );


const searchInput =
    document.getElementById(
        "searchInput"
    );


const totalCount =
    document.getElementById(
        "totalCount"
    );


const pendingCount =
    document.getElementById(
        "pendingCount"
    );


const completedCount =
    document.getElementById(
        "completedCount"
    );


// ==========================================================
// MODAL
// ==========================================================

const editModal =
    document.getElementById(
        "editModal"
    );


const closeModal =
    document.getElementById(
        "closeModal"
    );


const modalAccount =
    document.getElementById(
        "modalAccount"
    );


const accountNumber16 =
    document.getElementById(
        "accountNumber16"
    );


const accountName =
    document.getElementById(
        "accountName"
    );


const accountBranch =
    document.getElementById(
        "accountBranch"
    );


const accountType =
    document.getElementById(
        "accountType"
    );


const saveBtn =
    document.getElementById(
        "saveBtn"
    );


const saveError =
    document.getElementById(
        "saveError"
    );


const toast =
    document.getElementById(
        "toast"
    );


// ==========================================================
// OCR DOM
// ==========================================================

const ocrImage =
    document.getElementById(
        "ocrImage"
    );


const ocrBtn =
    document.getElementById(
        "ocrBtn"
    );


const ocrPreview =
    document.getElementById(
        "ocrPreview"
    );


const ocrStatus =
    document.getElementById(
        "ocrStatus"
    );


const cropContainer =
    document.getElementById(
        "cropContainer"
    );


const cropCanvas =
    document.getElementById(
        "cropCanvas"
    );


const cropSelection =
    document.getElementById(
        "cropSelection"
    );


const cropBtn =
    document.getElementById(
        "cropBtn"
    );


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
// OCR STATE
// ==========================================================

let ocrWorker =
    null;


let ocrReady =
    false;


let selectedImage =
    null;


let imageNaturalWidth =
    0;


let imageNaturalHeight =
    0;


let displayWidth =
    0;


let displayHeight =
    0;


// ==========================================================
// CROP STATE
// ==========================================================

let cropStartX =
    0;


let cropStartY =
    0;


let cropEndX =
    0;


let cropEndY =
    0;


let isSelecting =
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
// ENTER
// ==========================================================

password.addEventListener(
    "keydown",
    function (event) {


        if (
            event.key ===
            "Enter"
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


            signOut(
                auth
            );


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
         * تشغيل OCR مبكراً
         * حتى يكون جاهزاً عند اختيار الصورة.
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


        await signOut(
            auth
        );

    }
);


// ==========================================================
// REQUESTS
// ==========================================================

function loadRequests() {


    loading.style.display =
        "block";


    const requestsRef =
        ref(
            db,
            "requests"
        );


    onValue(
        requestsRef,
        function (snapshot) {


            requests =
                snapshot.val() ||
                {};


            loading.style.display =
                "none";


            renderRequests();

        },
        function () {


            loading.style.display =
                "none";


            empty.style.display =
                "block";


            empty.textContent =
                "تعذر تحميل الطلبات.";

        }
    );

}


// ==========================================================
// RENDER REQUESTS
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


            card.innerHTML = `

                <div class="request-header">

                    <strong>
                        حساب ${escapeHTML(
                            item.accountNumber || "-"
                        )}
                    </strong>

                    <span class="status">
                        ${
                            item.status ===
                            "completed"
                                ? "مكتملة"
                                : "قيد الانتظار"
                        }
                    </span>

                </div>


                <div class="request-row">

                    <span>
                        رقم الحساب
                    </span>

                    <b>
                        ${escapeHTML(
                            item.accountNumber16 || "-"
                        )}
                    </b>

                </div>


                <div class="request-row">

                    <span>
                        الاسم
                    </span>

                    <b>
                        ${escapeHTML(
                            item.name || "-"
                        )}
                    </b>

                </div>


                <div class="request-row">

                    <span>
                        الفرع
                    </span>

                    <b>
                        ${escapeHTML(
                            item.branch || "-"
                        )}
                    </b>

                </div>


                <div class="request-row">

                    <span>
                        نوع الحساب
                    </span>

                    <b>
                        ${escapeHTML(
                            item.accountType || "-"
                        )}
                    </b>

                </div>


                <button
                    class="edit-btn"
                    type="button">

                    إكمال / تعديل

                </button>

            `;


            card
                .querySelector(
                    ".edit-btn"
                )
                .addEventListener(
                    "click",
                    function () {

                        openEdit(
                            id
                        );

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
    renderRequests
);


// ==========================================================
// OPEN EDIT
// ==========================================================

function openEdit(
    id
) {


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


    cropContainer.style.display =
        "none";


    cropBtn.style.display =
        "none";


    ocrPreview.style.display =
        "none";


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


    selectedImage =
        null;


}


// ==========================================================
// MODAL OUTSIDE
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
// GALLERY ONLY
// ==========================================================

ocrBtn.addEventListener(
    "click",
    function () {


        /*
         * لا يوجد capture.
         * هذا يجعل الاختيار من الصور.
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


        selectedImage =
            file;


        ocrStatus.textContent =
            "حدد المنطقة التي تحتوي على بيانات الحساب.";


        await showCropEditor(
            file
        );

    }
);


// ==========================================================
// SHOW CROP EDITOR
// ==========================================================

function showCropEditor(
    file
) {


    return new Promise(
        function (resolve, reject) {


            const img =
                new Image();


            img.onload =
                function () {


                    imageNaturalWidth =
                        img.naturalWidth;


                    imageNaturalHeight =
                        img.naturalHeight;


                    /*
                     * حجم العرض مناسب للهاتف.
                     */

                    const maxWidth =
                        Math.min(
                            window.innerWidth - 40,
                            900
                        );


                    const ratio =
                        maxWidth /
                        imageNaturalWidth;


                    displayWidth =
                        maxWidth;


                    displayHeight =
                        Math.round(
                            imageNaturalHeight *
                            ratio
                        );


                    cropCanvas.width =
                        displayWidth;


                    cropCanvas.height =
                        displayHeight;


                    const ctx =
                        cropCanvas.getContext(
                            "2d"
                        );


                    ctx.drawImage(
                        img,
                        0,
                        0,
                        displayWidth,
                        displayHeight
                    );


                    cropContainer.style.display =
                        "block";


                    cropBtn.style.display =
                        "block";


                    /*
                     * مربع البداية
                     */

                    cropStartX =
                        displayWidth *
                        0.05;


                    cropStartY =
                        displayHeight *
                        0.20;


                    cropEndX =
                        displayWidth *
                        0.95;


                    cropEndY =
                        displayHeight *
                        0.80;


                    updateCropSelection();


                    resolve();

                };


            img.onerror =
                function () {

                    reject(
                        new Error(
                            "تعذر فتح الصورة"
                        )
                    );

                };


            img.src =
                URL.createObjectURL(
                    file
                );

        }
    );

}


// ==========================================================
// POINTER DOWN
// ==========================================================

cropCanvas.addEventListener(
    "pointerdown",
    function (event) {


        isSelecting =
            true;


        const rect =
            cropCanvas.getBoundingClientRect();


        cropStartX =
            event.clientX -
            rect.left;


        cropStartY =
            event.clientY -
            rect.top;


        cropEndX =
            cropStartX;


        cropEndY =
            cropStartY;


        cropCanvas.setPointerCapture(
            event.pointerId
        );


        updateCropSelection();

    }
);


// ==========================================================
// POINTER MOVE
// ==========================================================

cropCanvas.addEventListener(
    "pointermove",
    function (event) {


        if (
            !isSelecting
        ) {

            return;

        }


        const rect =
            cropCanvas.getBoundingClientRect();


        cropEndX =
            event.clientX -
            rect.left;


        cropEndY =
            event.clientY -
            rect.top;


        cropEndX =
            Math.max(
                0,
                Math.min(
                    displayWidth,
                    cropEndX
                )
            );


        cropEndY =
            Math.max(
                0,
                Math.min(
                    displayHeight,
                    cropEndY
                )
            );


        updateCropSelection();

    }
);


// ==========================================================
// POINTER UP
// ==========================================================

cropCanvas.addEventListener(
    "pointerup",
    function () {


        isSelecting =
            false;

    }
);


// ==========================================================
// UPDATE SELECTION
// ==========================================================

function updateCropSelection() {


    const left =
        Math.min(
            cropStartX,
            cropEndX
        );


    const top =
        Math.min(
            cropStartY,
            cropEndY
        );


    const width =
        Math.abs(
            cropEndX -
            cropStartX
        );


    const height =
        Math.abs(
            cropEndY -
            cropStartY
        );


    cropSelection.style.left =
        left +
        "px";


    cropSelection.style.top =
        top +
        "px";


    cropSelection.style.width =
        width +
        "px";


    cropSelection.style.height =
        height +
        "px";

}


// ==========================================================
// CROP BUTTON
// ==========================================================

cropBtn.addEventListener(
    "click",
    async function () {


        const left =
            Math.min(
                cropStartX,
                cropEndX
            );


        const top =
            Math.min(
                cropStartY,
                cropEndY
            );


        const width =
            Math.abs(
                cropEndX -
                cropStartX
            );


        const height =
            Math.abs(
                cropEndY -
                cropStartY
            );


        if (
            width < 20 ||
            height < 20
        ) {


            ocrStatus.textContent =
                "حدد منطقة أكبر قليلاً.";


            return;

        }


        cropBtn.disabled =
            true;


        ocrStatus.textContent =
            "⚡ جاري قص المنطقة...";


        try {


            const blob =
                await createCroppedImage(
                    selectedImage,
                    left,
                    top,
                    width,
                    height
                );


            const previewURL =
                URL.createObjectURL(
                    blob
                );


            ocrPreview.src =
                previewURL;


            ocrPreview.style.display =
                "block";


            ocrStatus.textContent =
                "⚡ جاري استخراج البيانات...";


            await runOCR(
                blob
            );


        } catch (error) {


            console.error(
                error
            );


            ocrStatus.textContent =
                "تعذر معالجة الصورة.";

        }


        cropBtn.disabled =
            false;

    }
);


// ==========================================================
// CREATE CROPPED IMAGE
// ==========================================================

function createCroppedImage(
    file,
    left,
    top,
    width,
    height
) {


    return new Promise(
        function (resolve, reject) {


            const img =
                new Image();


            img.onload =
                function () {


                    /*
                     * تحويل إحداثيات الشاشة
                     * إلى إحداثيات الصورة الأصلية.
                     */

                    const scaleX =
                        imageNaturalWidth /
                        displayWidth;


                    const scaleY =
                        imageNaturalHeight /
                        displayHeight;


                    const sx =
                        Math.round(
                            left *
                            scaleX
                        );


                    const sy =
                        Math.round(
                            top *
                            scaleY
                        );


                    const sw =
                        Math.round(
                            width *
                            scaleX
                        );


                    const sh =
                        Math.round(
                            height *
                            scaleY
                        );


                    /*
                     * نترك دقة النص جيدة.
                     */

                    const maxOCRWidth =
                        1800;


                    let targetWidth =
                        sw;


                    let targetHeight =
                        sh;


                    if (
                        targetWidth >
                        maxOCRWidth
                    ) {


                        const ratio =
                            maxOCRWidth /
                            targetWidth;


                        targetWidth =
                            Math.round(
                                targetWidth *
                                ratio
                            );


                        targetHeight =
                            Math.round(
                                targetHeight *
                                ratio
                            );

                    }


                    const canvas =
                        document.createElement(
                            "canvas"
                        );


                    canvas.width =
                        targetWidth;


                    canvas.height =
                        targetHeight;


                    const ctx =
                        canvas.getContext(
                            "2d",
                            {
                                willReadFrequently:
                                    true
                            }
                        );


                    ctx.drawImage(
                        img,
                        sx,
                        sy,
                        sw,
                        sh,
                        0,
                        0,
                        targetWidth,
                        targetHeight
                    );


                    /*
                     * تحسين النص بسرعة.
                     */

                    const imageData =
                        ctx.getImageData(
                            0,
                            0,
                            targetWidth,
                            targetHeight
                        );


                    const pixels =
                        imageData.data;


                    for (
                        let i = 0;
                        i < pixels.length;
                        i += 4
                    ) {


                        const gray =
                            (
                                pixels[i] *
                                0.299
                            ) +
                            (
                                pixels[i + 1] *
                                0.587
                            ) +
                            (
                                pixels[i + 2] *
                                0.114
                            );


                        let value =
                            (
                                gray -
                                128
                            ) *
                            1.35 +
                            128;


                        if (
                            value < 0
                        ) {

                            value =
                                0;

                        }


                        if (
                            value > 255
                        ) {

                            value =
                                255;

                        }


                        pixels[i] =
                            value;


                        pixels[i + 1] =
                            value;


                        pixels[i + 2] =
                            value;

                    }


                    ctx.putImageData(
                        imageData,
                        0,
                        0
                    );


                    canvas.toBlob(
                        function (blob) {


                            if (!blob) {


                                reject(
                                    new Error(
                                        "فشل القص"
                                    )
                                );


                                return;

                            }


                            resolve(
                                blob
                            );


                        },
                        "image/jpeg",
                        0.85
                    );

                };


            img.onerror =
                function () {


                    reject(
                        new Error(
                            "تعذر تحميل الصورة"
                        )
                    );

                };


            img.src =
                URL.createObjectURL(
                    file
                );

        }
    );

}


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

        return;

    }


    try {


        /*
         * Worker واحد فقط.
         * لا يتم إنشاء Worker لكل صورة.
         */

        ocrWorker =
            await Tesseract.createWorker(
                "ara+eng",
                1
            );


        /*
         * قراءة كتلة نصية سريعة.
         */

        await ocrWorker.setParameters({

            preserve_interword_spaces:
                "1"

        });


        ocrReady =
            true;


    } catch (error) {


        console.error(
            error
        );


        ocrReady =
            false;

    }

}


// ==========================================================
// RUN OCR
// ==========================================================

async function runOCR(
    blob
) {


    try {


        if (
            !ocrReady
        ) {


            ocrStatus.textContent =
                "⚡ تجهيز محرك القراءة...";


            await prepareOCR();

        }


        if (
            !ocrWorker
        ) {


            throw new Error(
                "OCR غير جاهز"
            );

        }


        ocrStatus.textContent =
            "⚡ قراءة البيانات...";


        /*
         * OCR فقط للمنطقة التي حددها المستخدم.
         */

        const result =
            await ocrWorker.recognize(
                blob
            );


        const text =
            result.data.text ||
            "";


        const fields =
            extractBankakFields(
                text
            );


        // ==================================================
        // ACCOUNT
        // ==================================================

        if (
            fields.accountNumber16
        ) {


            accountNumber16.value =
                fields.accountNumber16;

        }


        // ==================================================
        // NAME
        // ==================================================

        if (
            fields.name
        ) {


            accountName.value =
                fields.name;

        }


        // ==================================================
        // TYPE
        // ==================================================

        if (
            fields.accountType
        ) {


            accountType.value =
                fields.accountType;

        }


        // ==================================================
        // BRANCH
        // ==================================================

        if (
            fields.branch
        ) {


            accountBranch.value =
                fields.branch;

        }


        let found =
            0;


        if (
            fields.accountNumber16
        ) {

            found++;

        }


        if (
            fields.name
        ) {

            found++;

        }


        if (
            fields.accountType
        ) {

            found++;

        }


        if (
            fields.branch
        ) {

            found++;

        }


        if (
            found === 4
        ) {


            ocrStatus.textContent =
                "✓ تم استخراج بيانات الحساب الأربعة.";


        } else if (
            found > 0
        ) {


            ocrStatus.textContent =
                "✓ تم استخراج " +
                found +
                " من 4 بيانات.";


        } else {


            ocrStatus.textContent =
                "لم يتم التعرف على البيانات.";

        }


    } catch (error) {


        console.error(
            error
        );


        ocrStatus.textContent =
            "حدث خطأ أثناء استخراج البيانات.";

    }

}


// ==========================================================
// NORMALIZE ARABIC NUMBERS
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


    return value;

}


// ==========================================================
// EXTRACT FIELDS
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


    let accountNumber16 =
        find16DigitAccount(
            clean
        );


    let accountType =
        findAccountType(
            clean
        );


    let name =
        findFieldAfterLabel(
            lines,
            [
                "الاسم",
                "اسم العميل",
                "اسم صاحب الحساب"
            ]
        );


    let branch =
        findFieldAfterLabel(
            lines,
            [
                "الفرع",
                "فرع"
            ]
        );


    if (!name) {


        name =
            findNameLine(
                lines
            );

    }


    name =
        cleanName(
            name
        );


    branch =
        cleanValue(
            branch
        );


    return {

        accountNumber16:
            accountNumber16,

        name:
            name,

        accountType:
            accountType,

        branch:
            branch

    };

}


// ==========================================================
// FIND 16 DIGITS
// ==========================================================

function find16DigitAccount(
    text
) {


    /*
     * أرقام متصلة
     */

    const direct =
        text.match(
            /\d{16}/g
        );


    if (
        direct
    ) {


        for (
            let i = 0;
            i < direct.length;
            i++
        ) {


            if (
                direct[i].length ===
                16
            ) {


                return direct[i];

            }

        }

    }


    /*
     * أرقام متقطعة
     */

    const groups =
        text.match(
            /\d(?:[\s-]*\d){15,25}/g
        );


    if (
        groups
    ) {


        for (
            let i = 0;
            i < groups.length;
            i++
        ) {


            const number =
                groups[i]
                    .replace(
                        /[^0-9]/g,
                        ""
                    );


            if (
                number.length ===
                16
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


    if (
        text.includes(
            "توفير مميز"
        )
    ) {


        return "توفير مميز";

    }


    if (
        text.includes(
            "حساب توفير"
        )
    ) {


        return "حساب توفير";

    }


    if (
        text.includes(
            "توفير"
        )
    ) {


        return "حساب توفير";

    }


    if (
        text.includes(
            "حساب جاري"
        )
    ) {


        return "حساب جاري";

    }


    if (
        text.includes(
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
                line.indexOf(
                    label
                ) !== -1
            ) {


                let value =
                    line
                        .replace(
                            label,
                            ""
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


    for (
        let i = 0;
        i < lines.length;
        i++
    ) {


        const line =
            lines[i];


        if (
            line.includes(
                "الاسم"
            )
        ) {


            const value =
                line
                    .replace(
                        "الاسم",
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


    return String(
        value
    )
        .replace(
            /^(الاسم|اسم العميل|اسم صاحب الحساب)\s*[:：\-]?\s*/,
            ""
        )
        .replace(
            /\s+/g,
            " "
        )
        .trim();

}


// ==========================================================
// CLEAN
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
// NUMBER CHECK
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
                "تعذر حفظ البيانات.";

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
// CLEAN OCR WORKER
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

                // ignore

            }

        }

    }
);
