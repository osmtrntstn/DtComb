let dataTableSettings = {
    "responsive": true,
    "lengthChange": true,
    "autoWidth": false,
    "dom": "<'row'<'col-sm-12 col-md-8 d-flex align-items-center'B l><'col-sm-12 col-md-4 text-right'f>>" +
        "<'row'<'col-sm-12'tr>>" +
        "<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>",
    "buttons": [
        {
            extend: 'copy',
            className: 'btn btn-custom-color btn-sm' // 'btn-custom-color' özel sınıfımız
        },
        {extend: 'csv', className: 'btn btn-custom-color btn-sm'},
        {extend: 'excel', className: 'btn btn-custom-color btn-sm'},
        {extend: 'pdf', className: 'btn btn-custom-color btn-sm'},
        {extend: 'print', className: 'btn btn-custom-color btn-sm'}
    ],
    "language": {"lengthMenu": "_MENU_", "search": "Search:"}
};
$(function () {
    //Initialize Select2 Elements
    $('.select2bs4').select2({
        theme: 'bootstrap4',
        placeholder: "Please select...", // Görünecek metin
        allowClear: true // Kullanıcının seçimi temizleyebilmesine izin verir
    })
})
$(document).ready(async function () {
    try {
        const delimiter = await dbManager.get_setting("delimiter");
        if (delimiter != null) {
            // Kaydedilmiş delimiter'ı radyo butonlarına yansıt
            if (delimiter === 'comma') $('#delimiterRadio1').prop('checked', true);
            else if (delimiter === 'tab') $('#delimiterRadio2').prop('checked', true);
            else if (delimiter === 'semicolon') $('#delimiterRadio3').prop('checked', true);
            else if (delimiter === 'space') $('#delimiterRadio4').prop('checked', true);
        }
    } catch (error) {
        console.error("IndexedDB okuma hatası:", error);
    }
});
$(document).ready(function () {
    fetchExampleData();
});
// Radyo butonları değiştiğinde tetiklenir
$('input[name="exampleDataRadio"]').on('change', function () {
    fetchExampleData();
});

function fetchExampleData() {
    const selectedData = $('input[name="exampleDataRadio"]:checked').val();
    $('#analysisTable').empty();
    $.ajax({
        url: '/fetch-example-data',
        method: 'POST',
        dataType: 'json',
        data: {data_name: selectedData},
        beforeSend: function () {
            showLoader('data-list');
            $('#btn-save').prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Loading...');
        },
        success: function (response) {
            updateTableAndDropdowns({
                columns: response.columns,
                data: response.data
            });

            let $categorySelect = $('#category');
            let $categoryRocSelect = $('#categoryRoc');
            $categorySelect.empty();
            $categoryRocSelect.empty();

            // Backend'den gelen benzersiz değerleri Category listesine bas
            response.categories.forEach(cat => {
                let isSelected = response.selectedCategory.includes(cat);
                $categorySelect.append(new Option(cat, cat, isSelected, isSelected));
                $categoryRocSelect.append(new Option(cat, cat, isSelected, isSelected));
            });
            $categorySelect.trigger('change');
            $categoryRocSelect.trigger('change');

            const dropdowns = ['#marker1', '#marker2', '#status', '#statusRoc'];
            dropdowns.forEach(id => {
                let $select = $(id);
                $select.empty(); // Eskileri sil
                $select.append(new Option("Please select...", "", true, true));
                response.columns.forEach(col => {
                    // response.selectedMarker1 içinde bu sütun var mı kontrol et (Liste kontrolü)
                    let isSelected = false;
                    if (id === '#marker1' && response.selectedMarker1.includes(col)) isSelected = true;
                    if (id === '#marker2' && response.selectedMarker2.includes(col)) isSelected = true;
                    if (id === '#status' && response.selectedStatus.includes(col)) isSelected = true;
                    if (id === '#category' && response.selectedCategory.includes(col)) isSelected = true;
                    if (id === '#statusRoc' && response.selectedStatus.includes(col)) isSelected = true;

                    let option = new Option(col, col, isSelected, isSelected);
                    $select.append(option);
                });

                // Select2'yi yeni verilerle tetikle
                $select.trigger('change');
            });
            // Multi-select olan markersRoc için özel güncelleme
            let $markersRoc = $('select[name="markersRoc"]');
            $markersRoc.empty();
            response.columns.forEach(col => {
                $markersRoc.append(new Option(col, col));
            });
            $markersRoc.trigger('change');

            // 2. Yeni başlıkları (columns) oluştur - En başa "#" ekliyoruz
            let headerRow = '<thead><tr><th></th>'; // Satır numarası başlığı
            response.columns.forEach(col => {
                headerRow += `<th>${col}</th>`;
            });
            headerRow += '</tr></thead>';
            let tbody = "<tbody>";
            response.data.forEach((row, index) => {
                let rowHtml = `<tr><td>${index + 1}</td>`; // Satır numarası hücresi
                response.columns.forEach(col => {
                    rowHtml += `<td>${row[col]}</td>`;
                });
                rowHtml += '</tr>';
                tbody += rowHtml;
            })
            tbody += '</tbody>';
            // $('#analysisTable').append(headerRow + tbody);

            // table = $('#analysisTable').DataTable(dataTableSettings);

        },
        error: function (xhr) {
            $('#btn-save').prop('disabled', false).html('<i class="fa fa-forward"></i> Next');
            hideLoader('data-list');
        },
        complete: function () {
            $('#btn-save').prop('disabled', false).html('<i class="fa fa-forward"></i> Next');
            hideLoader('data-list');
        }
    });
}

document.querySelectorAll('input[name="dataInputRadio"]').forEach((radio) => {
    radio.addEventListener('change', function () {
        const delimiterDiv = document.getElementById('delimiterOptions');
        const datasetsDiv = document.getElementById('datasets');
        if (this.value === 'upload') {
            delimiterDiv.style.display = 'block'; // Upload seçilirse göster
            datasetsDiv.style.display = 'none'; // Upload seçilirse göster
        } else {
            delimiterDiv.style.display = 'none';  // Diğer durumlarda gizle
            datasetsDiv.style.display = 'block';  // Diğer durumlarda gizle
        }
    });
});

document.getElementById('advancedCheckBox').addEventListener('change', function () {
    // Class adı 'advancedCheckBox' olan tüm form-group'ları bul
    const advancedElements = document.querySelectorAll('.form-group.advancedCheckBox');

    // const key = $el.attr('id');
    // const value = $el.val();
    // // 2. Sadece bu alanı IndexedDB'ye gönder
    // if (key) {
    //     saveSingleField(key, value);
    // }
    advancedElements.forEach(el => {
        // 2. Eğer alanlar görünür olduysa (veya her durumda) içindeki inputları kaydet
        const inputs = el.querySelectorAll('input, select');
        let key, value;
        inputs.forEach(input => {
            key = input.id || input.name;
            if (input.type === 'checkbox') {
                value = input.checked;
            } else {
                value = input.value;
            }


        });
        if (this.checked) {
            if (key && value) {
                saveSingleField(key, value); // Tekil kayıt fonksiyonunu çağır
            }
            el.style.display = 'block';  // Seçili ise göster
        } else {
            if (key && value) {
                dbManager.delete_setting(key); // Tekil kayıt fonksiyonunu çağır
            }
            el.style.display = 'none'; // Seçili değilse gizle
        }
    });
});
document.getElementById('custom-content-below-tab').addEventListener('change', async function () {
    // Class adı 'advancedCheckBox' olan tüm form-group'ları bul
    const advancedElements = document.getElementById('custom-content-below-tab');
    const activeDataKey = $('#custom-content-below-tab').find('li a.active').attr('data-key');
    await dbManager.set_setting("analysis_type", activeDataKey);
    advancedElements.forEach(el => {
        if (this.checked) {
            el.style.display = 'block';  // Seçili ise GİZLE
        } else {
            el.style.display = 'none'; // Seçili değilse GÖSTER
        }
    });
});

$(document).on('shown.bs.tab', 'a[data-toggle="pill"]', async function (e) {
    const targetId = $(e.target).attr('id');
    const advancedDiv = $('.roc-analysis-advanced');
    const advancedCheckBox = document.getElementById('advancedCheckBox')

    // Eğer tıklanan tab "ROC Analysis" tabı ise göster, değilse gizle
    if (targetId === 'custom-content-below-roc-analysis-tab') {
        await dbManager.set_setting("analysis_type", "roc-analysis");
        $("#li-analysis").fadeOut();
        $("#li-predict").fadeOut();
        $("#li-roc-analysis").fadeIn();

        advancedDiv.fadeIn(); // Şık bir geçişle göster
    } else {
        $("#li-roc-analysis").fadeOut();
        $("#li-analysis").fadeIn();
        $("#li-predict").fadeIn();
        // await dbManager.set_analysis_type("analysis"); // Analysis tabına geçildiğinde session'daki analysis_type'ı güncelle
        await dbManager.set_setting("analysis_type", "analysis");
        advancedDiv.hide(); // Diğer tablarda gizle
        if (advancedCheckBox.checked) {
            advancedCheckBox.checked = false; // Eğer "Advanced" seçiliyse, diğer tablara geçerken sıfırla
            $('.form-group.advancedCheckBox').hide(); // "Advanced" seçeneklerini gizle
        }
    }
});

document.querySelectorAll('input[name="dataInputRadio"]').forEach((radio) => {
    radio.addEventListener('change', function () {
        const delimiterDiv = document.getElementById('delimiterOptions');
        const datasetsDiv = document.getElementById('datasets');

        if (this.value === 'upload') {
            if ($.fn.DataTable.isDataTable('#analysisTable')) {
                $('#analysisTable').DataTable().destroy();
            }
            $('#analysisTable').empty();
            delimiterDiv.style.display = 'block';
            datasetsDiv.style.display = 'none';

            // --- TÜM SELECTLERİ BOŞALTMA İŞLEMİ ---
            // Form içindeki tüm select elementlerini bul ve temizle
            $('select.select2bs4').each(function () {
                $(this).empty(); // Seçenekleri sil
                $(this).trigger('change'); // Değişikliği Select2'ye bildir
            });
            // --------------------------------------

        } else {
            delimiterDiv.style.display = 'none';
            datasetsDiv.style.display = 'block';

            // Eğer "Load example data" seçilirse varsayılan veriyi
            // tekrar yüklemek için radyo butonunu tetikleyebilirsiniz
            $('input[name="exampleDataRadio"]:checked').trigger('change');

        }
    });
});

// Dosya seçildiğinde tetiklenir
$('#exampleInputFile').on('change', async function () {
    let file = this.files[0];
    if (!file) return;

    // Arayüzü güncelle
    $('.custom-file-label').html(file.name);
    let delimiter = $('input[name="delimiterRadio"]:checked').val();

    // 1. DOSYAYI OKU VE INDEXEDDB'YE KAYDET
    const reader = new FileReader();

    // Okuma işlemi bittiğinde çalışacak olan olay (Event)
    reader.onload = async function (e) {
        const rawString = e.target.result; // Dosyanın orijinal metin hali

        try {
            // Loader'ı göster
            $('#global-loader').show();

            // Veritabanı işlemlerini yap
            await dbManager.save_data(rawString);
            await dbManager.set_setting("delimiter", delimiter);
            await dbManager.set_setting("fileName", file.name); // Dosya adını da saklayalım

            // 2. BACKEND VE TABLO GÜNCELLEME
            // uploadAndRefreshTable fonksiyonu içerisinden rawString'i
            // veya doğrudan inputları kullanabilirsin.
            await uploadAndRefreshTable();

        } catch (error) {
            console.error("Dosya işleme hatası:", error);
        } finally {
            $('#global-loader').fadeOut('fast');
        }
    };

    // Dosya okumayı BAŞLAT (Kritik satır!)
    reader.readAsText(file);
});

// Hem örnek veri hem de yüklenen veri için ortak güncelleme fonksiyonu
function updateTableAndDropdowns(response) {
    // A. Tabloyu Temizle ve Yeniden Kur
    if ($.fn.DataTable.isDataTable('#analysisTable')) {
        $('#analysisTable').DataTable().destroy();
    }
    $('#analysisTable').empty();

    let headerRow = '<thead><tr><th>#</th>';
    response.columns.forEach(col => {
        headerRow += `<th>${col}</th>`;
    });
    headerRow += '</tr></thead>';

    let tbody = "<tbody>";
    response.data.forEach((row, index) => {
        let rowHtml = `<tr><td>${index + 1}</td>`;
        response.columns.forEach(col => {
            rowHtml += `<td>${row[col] || ''}</td>`;
        });
        rowHtml += '</tr>';
        tbody += rowHtml;
    });
    tbody += '</tbody>';
    $('#analysisTable').append(headerRow + tbody);

    // DataTable'ı başlat (Daha önce belirlediğimiz #175f76 rengiyle)
    $('#analysisTable').DataTable(dataTableSettings);

    // B. Seçim Kutularını (Select) Doldur
    const dropdowns = ['#marker1', '#marker2', '#status', '#markersRoc', '#statusRoc'];
    dropdowns.forEach(id => {
        let $select = $(id);
        $select.empty();
        $select.append(new Option("Please select...", "", true, true));
        response.columns.forEach(col => {
            $select.append(new Option(col, col, false, false));
        });
        $select.trigger('change');
    });
}

async function uploadAndRefreshTable() {

    const storedData = await dbManager.get_data();
    let delimiter = $('input[name="delimiterRadio"]:checked').val();
    await dbManager.set_setting("delimiter", delimiter);

    const formatted = await formatDataByDelimiter(storedData);
    updateTableAndDropdowns(formatted);

}

// Status dropdown değiştiğinde tetiklenir
$(document).on('change', '#status, #statusRoc', async function () {

    const selectedStatus = $(this).val();
    if (!selectedStatus || selectedStatus === "") {
        $('#category').empty().trigger('change');
        return;
    }
    let dataInputRadioVal = $('input[name="dataInputRadio"]:checked').val();
    let delimiter

    let data;
    if (dataInputRadioVal === 'upload') {
        data = await dbManager.get_data()
        delimiter = await dbManager.get_setting("delimiter");
    } else {
        data = dataInputRadioVal;
        delimiter = $('input[name="exampleDataRadio"]:checked').val();
    }
    let currentStatusId = $(this)[0].id;
    $.ajax({
        url: '/get-unique-categories',
        method: 'POST',
        data: {status_col: selectedStatus, data: data, delimiter: delimiter},
        success: async function (response) {
            let categorySelectId = currentStatusId === 'status' ? 'category' : 'categoryRoc';
            let $categorySelect = $(`#${categorySelectId}`);
            $categorySelect.empty();
            $categorySelect.append(new Option("Please select category", "", true, true));

            if (response.categories && response.categories.length > 0) {
                for (const cat of response.categories) {
                    if (response.selectedCategory === cat) {
                        $categorySelect.append(new Option(cat, cat, true, true));
                    } else {
                        const selectedCategory = await dbManager.get_setting(categorySelectId);
                        if (selectedCategory === cat) {
                            $categorySelect.append(new Option(cat, cat, true, true));
                        } else {
                            $categorySelect.append(new Option(cat, cat));
                        }
                    }
                }
            }
            $categorySelect.trigger('change');
        }
    });
});

// Herhangi bir input değiştiğinde sadece o alanı güncelle
$(document).on('change', 'input, select', function () {
    const $el = $(this);
    let key, value;

    // 1. Key belirleme (Radio buttonlar için 'name', diğerleri için 'id' kullanılır)
    if ($el.is(':radio')) {
        key = $el.attr('name');
        value = $('input[name="' + key + '"]:checked').val();
    } else if ($el.is(':checkbox')) {
        key = $el.attr('id');
        value = $el.is(':checked'); // Boolean değer saklar
    } else {
        key = $el.attr('id');
        value = $el.val();
    }

    // 2. Sadece bu alanı IndexedDB'ye gönder
    if (key) {
        saveSingleField(key, value);
    }
});

// scripts bloğunun en altına ekleyin
async function saveDb() {
    // 1. Verileri topla
    let sessionData = {
        // Radyo Butonları
        dataInputRadio: $('input[name="dataInputRadio"]:checked').val(),
        exampleDataRadio: $('input[name="exampleDataRadio"]:checked').val(),
        delimiterRadio: $('input[name="delimiterRadio"]:checked').val(),

        // Dropdownlar ve Seçimler
        marker1: $('#marker1').val(),
        marker2: $('#marker2').val(),
        status: $('#status').val(),
        category: $('#category').val(),
        markersRoc: $('select[name="markersRoc"]').val(),
        statusRoc: $('#statusRoc').val(),
        categoryRoc: $('#categoryRoc').val(),

        // Gelişmiş Seçenekler
        advanced: $('#advancedCheckBox').is(':checked'),
        optimalCutOff: $('#optimalCutOff').val(),
        direction: $('#direction').val(),
        confidenceLevel: $('#confidenceLevel').val()
    };

    // 2. Düzenli Kayıt İşlemi: Obje üzerindeki her bir key-value çiftini döngüyle kaydet
    const savePromises = Object.entries(sessionData).map(([key, value]) => {
        // Sadece değeri boş olmayanları veya boolean olanları kaydetmek istersen kontrol ekleyebilirsin
        return dbManager.set_setting(key, value);
    });

    // 3. Tüm kayıtların bitmesini bekle
    await Promise.all(savePromises);
}

async function saveSingleField(key, value) {
    try {
        await dbManager.set_setting(key, value);
    } catch (error) {
        console.error(`${key} kaydedilirken hata oluştu:`, error);
    }
}

async function updateSelectedDataInput(key, value) {
    await dbManager.set_setting(key, value);
}


// Seçim yapıldığında çalışacak ortak fonksiyon
function syncSelectors() {
    const selectors = ['#marker1', '#marker2', '#status'];

    // 1. Mevcut tüm seçili değerleri bir listeye topla (boş olmayanlar)
    const selectedValues = selectors
        .map(id => $(id).val())
        .filter(val => val !== "" && val !== null);

    selectors.forEach(id => {
        const $currentSelector = $(id);
        const currentValue = $currentSelector.val();

        // 2. Her select kutusundaki her option'ı kontrol et
        $currentSelector.find('option').each(function () {
            const optionValue = $(this).val();

            // Eğer bu option boş değilse ve BAŞKA bir kutuda seçilmişse disable et
            if (optionValue !== "" && selectedValues.includes(optionValue) && optionValue !== currentValue) {
                $(this).prop('disabled', true);
            } else {
                $(this).prop('disabled', false);
            }
        });

        // 3. Değişikliği IndexedDB'ye kaydet
        if (currentValue) {
            dbManager.set_setting(id.replace('#', ''), currentValue);
        }
    });
}

// Event Listener'ları bağla
$('#marker1, #marker2, #status').on('change', function () {
    syncSelectors();
});

// Seçim yapıldığında çalışacak ortak fonksiyon
function syncSelectorsForRoc() {
    const selectors = ['#markersRoc', '#statusRoc'];

    // 1. Tüm seçili değerleri düz bir liste (flat array) olarak topla
    let allSelected = [];
    selectors.forEach(id => {
        const val = $(id).val();
        if (val) {
            // Eğer değer bir diziyse (multiple), listeye ekle; değilse tekil ekle
            if (Array.isArray(val)) {
                allSelected = allSelected.concat(val);
            } else {
                allSelected.push(val);
            }
        }
    });

    selectors.forEach(id => {
        const $currentSelector = $(id);
        const currentValue = $currentSelector.val() || []; // Seçili olanlar (tekil veya dizi)

        $currentSelector.find('option').each(function () {
            const optionValue = $(this).val();
            if (optionValue === "") return;

            // Bu opsiyon BAŞKA bir yerde seçilmiş mi kontrol et
            const isSelectedElsewhere = Array.isArray(currentValue)
                ? allSelected.filter(v => !currentValue.includes(v)).includes(optionValue)
                : allSelected.includes(optionValue) && optionValue !== currentValue;

            if (isSelectedElsewhere) {
                $(this).prop('disabled', true);
            } else {
                $(this).prop('disabled', false);
            }
        });

        // 3. Değişikliği IndexedDB'ye kaydet
        dbManager.set_setting(id.replace('#', ''), currentValue);
    });
}

// Event Listener'ları bağla
$('#markersRoc, #statusRoc').on('change', function () {
    syncSelectorsForRoc();
});
// Select2 değişimlerini yakalamak için özel tetikleyici
$('.select2bs4').on('select2:select select2:unselect', function (e) {
    saveDb();
});

// Seçili ayırıcı karakterini döndüren yardımcı fonksiyon
async function getDelimiterChar() {
    const val = $('input[name="delimiterRadio"]:checked').val();
    await dbManager.set_setting("delimiter", val)
    switch (val) {
        case 'tab':
            return '\t';
        case 'semicolon':
            return ';';
        case 'space':
            return ' ';
        case 'comma':
        default:
            return ',';
    }
}

// Ham veriyi (raw string) sütunlara ayıran fonksiyon
async function formatDataByDelimiter(rawContent) {
    const delimiter = await getDelimiterChar();

    const lines = rawContent.trim().split(/\r?\n/); // Satırlara böl
    if (lines.length === 0) return null;

    const headers = lines[0].split(delimiter).map(h => h.trim()); // Başlıklar
    const data = lines.slice(1).map(line => {
        const values = line.split(delimiter);
        let row = {};
        headers.forEach((header, index) => {
            row[header] = values[index] ? values[index].trim() : "";
        });
        return row;
    });

    return {columns: headers, data: data};
}

$('input[name="delimiterRadio"]').on('change', async function () {
    // 1. IndexedDB'den veriyi al
    const content = await dbManager.get_data();

    if (content) {
        // HATA GİDERME: Eğer içerik dizi geliyorsa, tabloyu temizleyip tazelemek gerekir.
        // Ancak görselin değişmesi için verinin HAM METİN olması şarttır.
        if (typeof content === 'string') {
            const formatted = await formatDataByDelimiter(content);
            if (formatted) {
                updateTableAndDropdowns(formatted);
            }
        }
    }
});

async function saveCurrentSelectionsToDb() {
    // Sayfadaki tüm anlamlı inputları yakala
    let sessionData = {
        analysis_type: await dbManager.get_setting("analysis_type") || "analysis", // Hangi tabda olduğumuzu bilmek için
        // Radyo Butonları
        dataInputRadio: $('input[name="dataInputRadio"]:checked').val(),
        exampleDataRadio: $('input[name="exampleDataRadio"]:checked').val(),
        delimiterRadio: $('input[name="delimiterRadio"]:checked').val(),

        // Dropdownlar (Select)
        marker1: $('#marker1').val(),
        marker2: $('#marker2').val(),
        status: $('#status').val(),
        category: $('#category').val(),

        // Çoklu Seçim (Multiple Select)
        markersRoc: $('#markersRoc').val(),
        statusRoc: $('#statusRoc').val(),
        categoryRoc: $('#categoryRoc').val(),

        // Checkbox ve Gelişmiş Seçenekler
        advanced: $('#advancedCheckBox').is(':checked'),
        optimalCutOff: $('#optimalCutOff').val(),
        direction: $('#direction').val(),
        confidenceLevel: $('#confidenceLevel').val()
    };

    if (sessionData.analysis_type !== "roc-analysis") {
        delete sessionData.markersRoc;
        delete sessionData.statusRoc;
        delete sessionData.categoryRoc;
        if (sessionData.advanced === false) {
            delete sessionData.optimalCutOff;
            delete sessionData.direction;
            delete sessionData.confidenceLevel;
        }
    }
    // Tüm key-value çiftlerini bir diziye çevirip paralel olarak kaydet
    const savePromises = Object.entries(sessionData).map(([key, value]) => {
        // Değeri null veya undefined olmayanları kaydet
        if (value !== undefined) {
            return dbManager.set_setting(key, value);
        }
    });

    // Tüm işlemlerin bitmesini bekle
    await Promise.all(savePromises);
}

$('#btn-save').on('click', async function () {
    // 1. Loading ekranını başlat (isteğe bağlı)
    $('#global-loader').show();

    try {
        $('#btn-save').prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Collecting data...');
        // 2. Tüm verileri topla ve IndexedDB'ye yaz
        await saveCurrentSelectionsToDb();
        const activeDataKey = $('#custom-content-below-tab').find('li a.active').attr('data-key');
        await dbManager.set_setting("analysis_type", activeDataKey);

        if (activeDataKey === "roc-analysis") {
            window.location.href = "/roc-analysis";
        } else {
            window.location.href = "/analysis";
        }

    } catch (error) {
        console.error("Kaydetme hatası:", error);
    } finally {
        // 3. Loader'ı kapat
        $('#global-loader').fadeOut('fast');
        $('#btn-save').prop('disabled', false).html('<i class="fa fa-forward"></i> Next');

    }
});