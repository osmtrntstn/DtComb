const DB_NAME = "AnalysisDB";
const STORE_NAME = "dataStore";

const dbManager = {
    open: function () {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, 1);
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, {keyPath: "id"});
                }
            };
            request.onsuccess = (e) => resolve(e.target.result);
            request.onerror = (e) => reject("DB hatası");
        });
    },

    // Yeni veri gelince eskisini siler ve yenisini yazar
    save: async function (dataArray) {
        const db = await this.open();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], "readwrite");
            const store = transaction.objectStore(STORE_NAME);

            // 1. Önce depodaki her şeyi temizle
            const clearRequest = store.delete("current_data");

            clearRequest.onsuccess = () => {
                // 2. Temizlik başarılı olduktan sonra yeni veriyi ekle
                const addRequest = store.put({id: "current_data", content: dataArray});
                addRequest.onsuccess = () => resolve(true);
                addRequest.onerror = () => reject(false);
            };
        });
    },
    // Yeni veri gelince eskisini siler ve yenisini yazar
    save_delimiter: async function (dataArray) {
        const db = await this.open();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], "readwrite");
            const store = transaction.objectStore(STORE_NAME);

            // 1. Önce depodaki her şeyi temizle
            const clearRequest = store.delete("delimiter");

            clearRequest.onsuccess = () => {
                // 2. Temizlik başarılı olduktan sonra yeni veriyi ekle
                const addRequest = store.put({id: "delimiter", content: dataArray});
                addRequest.onsuccess = () => resolve(true);
                addRequest.onerror = () => reject(false);
            };
        });
    },
    // Veriyi Okuma
    get: async function () {
        const db = await this.open();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], "readonly");
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get("current_data");
            request.onsuccess = () => resolve(request.result ? request.result.content : null);
            request.onerror = () => reject(null);
        });
    },
    // Veriyi Okuma
    get_delimiter: async function () {
        const db = await this.open();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], "readonly");
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get("delimiter");
            request.onsuccess = () => resolve(request.result ? request.result.content : null);
            request.onerror = () => reject(null);
        });
    }
};