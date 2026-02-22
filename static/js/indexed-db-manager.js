const DB_NAME = "AnalysisDB";

const dbManager = {
    // Veritabanını açar ve gerekli tabloları (stores) oluşturur
    open: function () {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, 3); // Versiyonu güncelledik
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                // Ham veriler için tablo
                if (!db.objectStoreNames.contains("dataStore")) {
                    db.createObjectStore("dataStore", {keyPath: "id"});
                }
                // Ayarlar (delimiter, analysis_type vb.) için tablo
                if (!db.objectStoreNames.contains("settings")) {
                    db.createObjectStore("settings", {keyPath: "id"});
                }
            };
            request.onsuccess = (e) => resolve(e.target.result);
            request.onerror = (e) => reject("DB hatası");
        });
    },

    // Her ayarı settings tablosunda ayrı bir satır olarak kaydeder
    set_setting: async function (id, content) {
        const db = await this.open();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(["settings"], "readwrite");
            const store = transaction.objectStore("settings");

            // Veriyi ekler veya günceller (id: "delimiter", content: "tab")
            const request = store.put({id: id, content: content, updatedAt: new Date().toISOString()});

            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(false);
        });
    },
    delete_setting: async function (id) { // Genellikle sadece id yeterlidir
        const db = await this.open();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(["settings"], "readwrite");
            const store = transaction.objectStore("settings");

            // IndexedDB'de silme işlemi sadece anahtar (key) ile yapılır
            const request = store.delete(id);

            request.onsuccess = () => {
                console.log(`${id} başarıyla silindi.`);
                resolve(true);
            };
            request.onerror = () => {
                console.error(`${id} silinirken hata oluştu.`);
                reject(false);
            };
        });
    },
    // Belirli bir ayarı settings tablosundan okur
    get_setting: async function (id) {
        const db = await this.open();
        return new Promise((resolve) => {
            const transaction = db.transaction(["settings"], "readonly");
            const store = transaction.objectStore("settings");
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result ? request.result.content : null);
            request.onerror = () => resolve(null);
        });
    },

    // Ham veriyi (current_data) dataStore tablosuna kaydeder
    save_data: async function (dataArray) {
        const db = await this.open();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(["dataStore"], "readwrite");
            const store = transaction.objectStore("dataStore");

            // Önce eskisini temizleyip yenisini yazmak veri tutarlılığı sağlar
            store.delete("current_data");
            const request = store.put({id: "current_data", content: dataArray});

            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(false);
        });
    },
    save_data_analysis: async function (dataArray) {
        const db = await this.open();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(["dataStore"], "readwrite");
            const store = transaction.objectStore("dataStore");

            // Önce eskisini temizleyip yenisini yazmak veri tutarlılığı sağlar
            store.delete("current_data");
            const request = store.put({id: "analysis_data", content: dataArray});

            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(false);
        });
    },
    // Tüm ayarları tek bir obje olarak toplar (API'ye göndermek için)
    get_data: async function () {
        const db = await this.open();
        return new Promise((resolve) => {
            const transaction = db.transaction(["dataStore"], "readonly");
            const store = transaction.objectStore("dataStore");
            const request = store.get("current_data");

            request.onsuccess = () => resolve(request.result ? request.result.content : null);
            request.onerror = () => reject(null);
        });
    },
    get_data_analysis: async function () {
        const db = await this.open();
        return new Promise((resolve) => {
            const transaction = db.transaction(["dataStore"], "readonly");
            const store = transaction.objectStore("dataStore");
            const request = store.get("analysis_data");

            request.onsuccess = () => resolve(request.result ? request.result.content : null);
            request.onerror = () => reject(null);
        });
    },
    // Tüm ayarları tek bir obje olarak toplar (API'ye göndermek için)
    get_all_settings: async function () {
        const db = await this.open();
        return new Promise((resolve) => {
            const transaction = db.transaction(["settings"], "readonly");
            const store = transaction.objectStore("settings");
            const request = store.getAll();

            request.onsuccess = () => {
                const settingsObj = {};
                request.result.forEach(item => {
                    settingsObj[item.id] = item.content;
                });
                resolve(settingsObj);
            };
            request.onerror = () => resolve({});
        });
    }
};