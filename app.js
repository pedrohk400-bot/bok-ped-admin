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
// FIREBASE INIT
// ==========================================================

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getDatabase(app);


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
// OCR ELEMENTS
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
// VARIABLES
// ==========================================================

let allRequests = [];

let selectedRequestId = null;

let currentUser = null;

let ocrWorker = null;

let ocrWorkerReady = false;

let ocrRunning = false;


// ==========================================================
// TOAST
// ==========================================================

function showToast(message) {

    toast.textContent = message;

    toast.classList.add("show");

    setTimeout(function() {

        toast.classList.remove("show");

    }, 2500);

}


// ==========================================================
// AUTH STATE
// ==========================================================

onAuthStateChanged(
    auth,
    function(user) {

        if (user) {

            if (
                user.uid !== ADMIN_UID
            ) {

                signOut(auth);

                loginPage.style.display =
                    "flex";

                adminPage.style.display =
                    "none";

                loginError.textContent =
                    "هذا الحساب غير مصرح له بالدخول.";

                return;

            }


            currentUser = user;

            loginPage.style.display =
                "none";

            adminPage.style.display =
                "block";

            startRequestsListener();

            prepareOCR();

        } else {

            currentUser = null;

            loginPage.style.display =
                "flex";

            adminPage.style.display =
                "none";

        }

    }
);


// ==========================================================
// LOGIN
// ==========================================================
// نفس منطق تسجيل الدخول
// ==========================================================

loginBtn.addEventListener(
    "click",
    function() {

        const emailValue =
            email.value.trim();

        const passwordValue =
            password.value;


        loginError.textContent =
            "";


        if (
            !emailValue ||
            !passwordValue
        ) {

            loginError.textContent =
                "أدخل البريد الإلكتروني وكلمة المرور.";

            return;

        }


        loginBtn.disabled =
            true;


        loginBtn.textContent =
            "جاري تسجيل الدخول...";


        signInWithEmailAndPassword(
            auth,
            emailValue,
            passwordValue
        )
        .then(
            function() {

                loginError.textContent =
                    "";

            }
        )
        .catch(
            function(error) {

                console.error(
                    error
                );


                loginError.textContent =
                    "بيانات تسجيل الدخول غير صحيحة.";

            }
        )
        .finally(
            function() {

                loginBtn.disabled =
                    false;

                loginBtn.textContent =
                    "تسجيل الدخول";

            }
        );

    }
);


// ==========================================================
// ENTER LOGIN
// ==========================================================

password.addEventListener(
    "keydown",
    function(event) {

        if (
            event.key === "Enter"
        ) {

            loginBtn.click();

        }

    }
);


// ==========================================================
// LOGOUT
// ==========================================================

logoutBtn.addEventListener(
    "click",
    function() {

        signOut(auth);

    }
);


// ==========================================================
// REQUESTS LISTENER
// ==========================================================

function startRequestsListener() {

    loading.style.display =
        "block";


    const requestsRef =
        ref(
            db,
            "requests"
        );


    onValue(
        requestsRef,
        function(snapshot) {

            const data =
                snapshot.val() || {};


            allRequests = [];


            Object.keys(data).forEach(
                function(id) {

                    const item =
                        data[id];


                    if (!item) {
                        return;
                    }


                    allRequests.push({

                        id: id,

                        ...item

                    });

                }
            );


            loading.style.display =
                "none";


            updateStats();

            renderRequests();

        },
        function(error) {

            console.error(
                error
            );


            loading.textContent =
                "تعذر تحميل الطلبات.";

        }
    );

}


// ==========================================================
// STATS
// ==========================================================

function updateStats() {

    let pending = 0;

    let completed = 0;


    allRequests.forEach(
        function(item) {

            const status =
                String(
                    item.status || ""
                ).toLowerCase();


            if (
                status === "completed" ||
                status === "مكتملة"
            ) {

                completed++;

            } else {

                pending++;

            }

        }
    );


    totalCount.textContent =
        allRequests.length;

    pendingCount.textContent =
        pending;

    completedCount.textContent =
        completed;

}


// ==========================================================
// RENDER REQUESTS
// ==========================================================

function renderRequests() {

    requestsList.innerHTML =
        "";


    const search =
        searchInput.value.trim();


    const filtered =
        allRequests.filter(
            function(item) {

                if (!search) {
                    return true;
                }


                return String(
                    item.accountNumber || ""
                ).includes(
                    search
                );

            }
        );


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
        function(item) {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "request-card";


            const status =
                String(
                    item.status ||
                    "pending"
                );


            const statusText =
                (
                    status === "completed" ||
                    status === "مكتملة"
                )
                ? "مكتملة"
                : "قيد الانتظار";


            card.innerHTML = `

                <div class="request-header">

                    <strong>
                        ${escapeHTML(
                            item.accountNumber || "-"
                        )}
                    </strong>

                    <span class="status">
                        ${escapeHTML(
                            statusText
                        )}
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
                            item.name ||
                            "لم تتم الإضافة"
                        )}
                    </b>

                </div>


                <div class="request-row">

                    <span>
                        رقم الحساب 16
                    </span>

                    <b>
                        ${escapeHTML(
                            item.accountNumber16 ||
                            "لم تتم الإضافة"
                        )}
                    </b>

                </div>


                <div class="request-row">

                    <span>
                        الفرع
                    </span>

                    <b>
                        ${escapeHTML(
                            item.branch ||
                            "لم تتم الإضافة"
                        )}
                    </b>

                </div>


                <div class="request-row">

                    <span>
                        نوع الحساب
                    </span>

                    <b>
                        ${escapeHTML(
                            item.accountType ||
                            "لم تتم الإضافة"
                        )}
                    </b>

                </div>


                <button
                    class="edit-btn"
                    type="button"
                >
                    ✏️ تعديل البيانات
                </button>

            `;


            card.querySelector(
                ".edit-btn"
            ).addEventListener(
                "click",
                function() {

                    openEditModal(
                        item
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
    function() {

        renderRequests();

    }
);


// ==========================================================
// OPEN MODAL
// ==========================================================

function openEditModal(item) {

    selectedRequestId =
        item.id;


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


    ocrImage.value =
        "";


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


// ==========================================================
// CLOSE MODAL
// ==========================================================

function closeEditModal() {

    editModal.style.display =
        "none";


    document.body.style.overflow =
        "";


    selectedRequestId =
        null;

}


closeModal.addEventListener(
    "click",
    closeEditModal
);


editModal.addEventListener(
    "click",
    function(event) {

        if (
            event.target ===
            editModal
        ) {

            closeEditModal();

        }

    }
);


// ==========================================================
// SAVE
// ==========================================================

saveBtn.addEventListener(
    "click",
    function() {

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
            convertArabicDigits(
                accountNumber16.value
            )
            .replace(
                /\D/g,
                ""
            );


        const name =
            accountName.value.trim();


        const branch =
            accountBranch.value.trim();


        const type =
            accountType.value.trim();


        if (
            number16.length !== 16
        ) {

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
                "أدخل نوع الحساب.";

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


        const requestRef =
            ref(
                db,
                "requests/" +
                selectedRequestId
            );


        update(
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
        )
        .then(
            function() {

                showToast(
                    "تم حفظ البيانات بنجاح"
                );


                closeEditModal();

            }
        )
        .catch(
            function(error) {

                console.error(
                    error
                );


                saveError.textContent =
                    "حدث خطأ أثناء حفظ البيانات.";

            }
        )
        .finally(
            function() {

                saveBtn.disabled =
                    false;

                saveBtn.textContent =
                    "حفظ البيانات";

            }
        );

    }
);


// ==========================================================
// OCR WORKER
// ==========================================================

async function prepareOCR() {

    if (
        ocrWorkerReady
    ) {

        return;

    }


    try {

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


    } catch (error) {

        console.error(
            "OCR Worker Error:",
            error
        );


        ocrWorker =
            null;

        ocrWorkerReady =
            false;

    }

}


// ==========================================================
// OPEN GALLERY
// ==========================================================

ocrBtn.addEventListener(
    "click",
    function() {

        if (
            ocrRunning
        ) {

            return;

        }


        ocrImage.click();

    }
);


// ==========================================================
// IMAGE SELECT
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


        if (
            !file.type.startsWith(
                "image/"
            )
        ) {

            ocrStatus.textContent =
                "الملف المحدد ليس صورة.";

            return;

        }


        await runOCR(
            file
        );

    }
);


// ==========================================================
// OCR FULL IMAGE
// ==========================================================

async function runOCR(file) {

    if (
        ocrRunning
    ) {

        return;

    }


    ocrRunning =
        true;


    ocrBtn.disabled =
        true;


    ocrBtn.textContent =
        "⚡ جاري قراءة الصورة...";


    ocrStatus.textContent =
        "جاري قراءة الصورة كاملة...";


    let objectUrl =
        null;


    try {

        objectUrl =
            URL.createObjectURL(
                file
            );


        ocrPreview.src =
            objectUrl;


        ocrPreview.style.display =
            "block";


        if (
            !ocrWorkerReady
        ) {

            await prepareOCR();

        }


        if (!ocrWorker) {

            throw new Error(
                "OCR worker not ready"
            );

        }


        const canvas =
            await prepareImage(
                file
            );


        ocrStatus.textContent =
            "⚡ استخراج بيانات بنكك...";


        const result =
            await ocrWorker.recognize(
                canvas
            );


        const text =
            result.data.text || "";


        console.log(
            "OCR TEXT:",
            text
        );


        const data =
            extractBankakData(
                text
            );


        // ==================================================
        // تعبئة الخانات مباشرة
        // ==================================================

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

            accountType.value =
                data.accountType;

        }


        if (
            data.branch
        ) {

            accountBranch.value =
                data.branch;

        }


        let count = 0;


        if (
            data.accountNumber16
        ) count++;


        if (
            data.name
        ) count++;


        if (
            data.accountType
        ) count++;


        if (
            data.branch
        ) count++;


        if (
            count === 4
        ) {

            ocrStatus.textContent =
                "✅ تم استخراج البيانات الأربعة بنجاح.";

        } else if (
            count > 0
        ) {

            ocrStatus.textContent =
                "⚠️ تم استخراج " +
                count +
                " من 4 حقول. راجع البيانات.";

        } else {

            ocrStatus.textContent =
                "❌ لم يتم العثور على البيانات.";

        }


    } catch (error) {

        console.error(
            "OCR ERROR:",
            error
        );


        ocrStatus.textContent =
            "❌ حدث خطأ أثناء قراءة الصورة.";

    }


    if (
        objectUrl
    ) {

        setTimeout(
            function() {

                URL.revokeObjectURL(
                    objectUrl
                );

            },
            1000
        );

    }


    ocrRunning =
        false;


    ocrBtn.disabled =
        false;


    ocrBtn.textContent =
        "🖼️ اختيار صورة من المعرض";

}


// ==========================================================
// PREPARE IMAGE
// ==========================================================

function prepareImage(file) {

    return new Promise(
        function(resolve, reject) {

            const img =
                new Image();


            const url =
                URL.createObjectURL(
                    file
                );


            img.onload =
                function() {

                    try {

                        let width =
                            img.naturalWidth;


                        let height =
                            img.naturalHeight;


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
                            img,
                            0,
                            0,
                            width,
                            height
                        );


                        const imageData =
                            ctx.getImageData(
                                0,
                                0,
                                width,
                                height
                            );


                        const pixels =
                            imageData.data;


                        for (
                            let i = 0;
                            i < pixels.length;
                            i += 4
                        ) {

                            const r =
                                pixels[i];


                            const g =
                                pixels[i + 1];


                            const b =
                                pixels[i + 2];


                            const gray =
                                (
                                    r * 0.299 +
                                    g * 0.587 +
                                    b * 0.114
                                );


                            let value =
                                (
                                    gray -
                                    128
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


                        URL.revokeObjectURL(
                            url
                        );


                        resolve(
                            canvas
                        );


                    } catch (error) {

                        URL.revokeObjectURL(
                            url
                        );


                        reject(
                            error
                        );

                    }

                };


            img.onerror =
                function() {

                    URL.revokeObjectURL(
                        url
                    );


                    reject(
                        new Error(
                            "تعذر فتح الصورة"
                        )
                    );

                };


            img.src =
                url;

        }
    );

}


// ==========================================================
// EXTRACT DATA
// ==========================================================

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
        findAccountNumber16(
            normalized
        );


    const accountType =
        findAccountType(
            lines
        );


    const branch =
        findField(
            lines,
            [
                "الفرع",
                "فرع"
            ]
        );


    let name =
        findField(
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
            findName(
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
            cleanText(
                name
            ),

        accountType:
            normalizeAccountType(
                accountType
            ),

        branch:
            cleanText(
                branch
            )

    };

}


// ==========================================================
// FIND ACCOUNT 16
// ==========================================================

function findAccountNumber16(text) {

    const digits =
        convertArabicDigits(
            text
        );


    const compact =
        digits.replace(
            /[\s\-_:.,]/g,
            ""
        );


    const direct =
        compact.match(
            /\d{16}/
        );


    if (direct) {

        return direct[0];

    }


    const groups =
        digits.match(
            /\d{4}(?:\s+\d{4}){3}/g
        );


    if (groups) {

        for (
            let i = 0;
            i < groups.length;
            i++
        ) {

            const number =
                groups[i].replace(
                    /\D/g,
                    ""
                );


            if (
                number.length === 16
            ) {

                return number;

            }

        }

    }


    const numbers =
        digits.match(
            /\d+/g
        ) || [];


    for (
        let i = 0;
        i < numbers.length;
        i++
    ) {

        if (
            numbers[i].length === 16
        ) {

            return numbers[i];

        }

    }


    return "";

}


// ==========================================================
// FIND ACCOUNT TYPE
// ==========================================================

function findAccountType(lines) {

    for (
        let i = 0;
        i < lines.length;
        i++
    ) {

        const line =
            lines[i];


        if (
            line.includes(
                "نوع الحساب"
            )
        ) {

            let value =
                line.replace(
                    /.*نوع الحساب\s*[:：\-]?\s*/,
                    ""
                ).trim();


            if (
                !value &&
                lines[i + 1]
            ) {

                value =
                    lines[i + 1];

            }


            if (value) {

                return normalizeAccountType(
                    value
                );

            }

        }

    }


    for (
        let i = 0;
        i < lines.length;
        i++
    ) {

        if (
            lines[i].includes(
                "حساب توفير"
            )
        ) {

            return "حساب توفير";

        }


        if (
            lines[i].includes(
                "حساب جاري"
            )
        ) {

            return "حساب جاري";

        }

    }


    return "";

}


// ==========================================================
// FIND FIELD
// ==========================================================

function findField(
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

                    return lines[i + 1];

                }

            }


            if (
                line.startsWith(
                    label
                )
            ) {

                let value =
                    line.substring(
                        label.length
                    );


                value =
                    value.replace(
                        /^[\s:：\-]+/,
                        ""
                    ).trim();


                if (value) {

                    return value;

                }

            }

        }

    }


    return "";

}


// ==========================================================
// FIND NAME
// ==========================================================

function findName(
    lines,
    accountNumber,
    accountType,
    branch
) {

    const excluded = [

        "بنكك",
        "bankak",
        "الاسم",
        "نوع الحساب",
        "الفرع",
        "رقم الحساب",
        "الرصيد",
        "المبلغ",
        "التاريخ",
        "بنك الخرطوم"

    ];


    for (
        let i = 0;
        i < lines.length;
        i++
    ) {

        const line =
            lines[i].trim();


        if (
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


        let ignored =
            false;


        for (
            let j = 0;
            j < excluded.length;
            j++
        ) {

            if (
                line
                .toLowerCase()
                .includes(
                    excluded[j]
                    .toLowerCase()
                )
            ) {

                ignored =
                    true;

                break;

            }

        }


        if (ignored) {
            continue;
        }


        if (
            containsNumber(
                line
            )
        ) {

            continue;

        }


        const arabic =
            (
                line.match(
                    /[\u0600-\u06FF]/g
                ) || []
            ).length;


        if (
            arabic >= 3
        ) {

            return line;

        }

    }


    return "";

}


// ==========================================================
// CLEAN TEXT
// ==========================================================

function cleanText(value) {

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


// ==========================================================
// CLEAN ACCOUNT
// ==========================================================

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


// ==========================================================
// ACCOUNT TYPE
// ==========================================================

function normalizeAccountType(value) {

    if (!value) {
        return "";
    }


    const text =
        normalizeArabicText(
            value
        );


    if (
        text.includes(
            "توفير"
        )
    ) {

        return "حساب توفير";

    }


    if (
        text.includes(
            "جاري"
        )
    ) {

        return "حساب جاري";

    }


    return cleanText(
        value
    );

}


// ==========================================================
// NORMALIZE ARABIC
// ==========================================================

function normalizeArabicText(text) {

    return String(
        text || ""
    )
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


// ==========================================================
// ARABIC NUMBERS
// ==========================================================

function convertArabicDigits(text) {

    return String(
        text || ""
    )
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


// ==========================================================
// NUMBER CHECK
// ==========================================================

function containsNumber(text) {

    return (
        /\d/.test(
            String(text || "")
        ) ||
        /[٠-٩]/.test(
            String(text || "")
        )
    );

}


// ==========================================================
// ESCAPE HTML
// ==========================================================

function escapeHTML(value) {

    return String(
        value ?? ""
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
// ACCOUNT INPUT
// ==========================================================

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


// ==========================================================
// CLEAN OCR WORKER
// ==========================================================

window.addEventListener(
    "beforeunload",
    function() {

        if (
            ocrWorker
        ) {

            try {

                ocrWorker.terminate();

            } catch (error) {

                // لا شيء

            }

        }

    }
);
