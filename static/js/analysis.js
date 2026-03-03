//analiz ve veri toplama
$('#collect-data').on('click', async function () {
    // 1. Temel analiz bilgilerini al
    let payload = await collectAllData()
    if (payload === undefined) {
        return;
    }
    // 4. Backend'e Gönder
    $.ajax({
        url: 'run-analysis',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(payload),
        beforeSend: function () {
            showLoader('analysis');
            $('#download-results-btn').hide()
            $('#collect-data').prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Analyzing...');
        },
        success: async function (response) {

            if (response.task_id) {
                const taskId = response.task_id;
                const pollInterval = setInterval(async () => {
                    try {
                        const statusResponse = await $.get(`/analysis-status/${taskId}`);
                        if (statusResponse.state === 'SUCCESS') {
                            clearInterval(pollInterval);
                            const result = statusResponse.result;
                            if (result.statusCode == "error") {
                                Swal.fire({
                                    title: response.errorModel.title,
                                    text: response.errorModel.text,
                                    icon: response.errorModel.type
                                })
                                return;
                            }
                            // Handle successful result (same as before)
                            await dbManager.save_data_analysis(result.predictData)
                            drawRocChart(result);
                            fillRocCoordinatesTables(result.roc_data);
                            fillAucStatisticsTable(result.auc_data);
                            fillMultipleComparisonTable(result.mult_comp_data);
                            fillThreeCutPointTables(result);
                            fillDiagnosticTables(result.diag_stat_data);

                            drawDensityPlot(result.markers, result.thresholds.marker1, result.marker1, result.status, result.status_levels, "destiny_plot_marker_1");
                            drawDensityPlot(result.markers, result.thresholds.marker1, result.marker2, result.status, result.status_levels, "destiny_plot_marker_2");
                            drawDensityPlot(result.comb_score, result.thresholds.combined, "Combination Score", result.status, result.status_levels, "destiny_plot_comb_score");
                            drawIndividualValuePlot(result.markers, result.thresholds.marker1, result.marker1, result.status, result.status_levels, "individual_value_marker_1");
                            drawIndividualValuePlot(result.markers, result.thresholds.marker2, result.marker2, result.status, result.status_levels, "individual_value_marker_2");
                            drawIndividualValuePlot(result.comb_score, result.thresholds.combined, "Combination Score", result.status, result.status_levels, "individual_value_comb_score");
                            drawSensitivitySpecificityPlot(result.roc_data, result.thresholds.marker1, result.marker1, "sens_spec_curve_marker_1");
                            drawSensitivitySpecificityPlot(result.roc_data, result.thresholds.marker2, result.marker2, "sens_spec_curve_marker_2");
                            drawSensitivitySpecificityPlot(result.roc_data, result.thresholds.combined, "Combination", "sens_spec_curve_comb_score"); // Fixed typo 'Combiantion'

                            $('#download-results-btn').off('click').on('click', function () {
                                downloadJsonResponse(result.predictData, `analysis_${Date.now()}.json`);
                            }).show();
                            $('#collect-data').prop('disabled', false).html('<i class="fas fa-chart-line mr-1"></i> Analyze');
                            hideLoader('analysis');
                        } else if (statusResponse.state === 'FAILURE') {
                            clearInterval(pollInterval);
                            Swal.fire({
                                title: "Analysis Failed",
                                text: statusResponse.status,
                                icon: "error"
                            });
                            $('#collect-data').prop('disabled', false).html('<i class="fas fa-chart-line mr-1"></i> Analyze');
                            hideLoader('analysis');
                        } else {
                            // Still processing
                            $('#collect-data').html(`<i class="fas fa-spinner fa-spin"></i> Analyzing... (${statusResponse.status})`);

                        }
                    } catch (error) {
                        clearInterval(pollInterval);
                        console.error("Polling error:", error);
                        Swal.fire("Error", "Failed to check analysis status.", "error");
                        $('#collect-data').prop('disabled', false).html('<i class="fas fa-chart-line mr-1"></i> Analyze');
                        hideLoader('analysis');

                    }
                }, 2000); // Poll every 2 seconds

                return; // Exit main success handler, wait for polling
            }

            // Fallback for non-async response (if any)
            // await dbManager.save_data_analysis(response.predictData)
            // drawRocChart(response);
            // fillRocCoordinatesTables(response.roc_data);
            // fillAucStatisticsTable(response.auc_data);
            // fillMultipleComparisonTable(response.mult_comp_data);
            // fillThreeCutPointTables(response);
            // fillDiagnosticTables(response.diag_stat_data);
            //
            // drawDensityPlot(response.markers, response.thresholds.marker1, response.marker1, response.status, response.status_levels, "destiny_plot_marker_1");
            // drawDensityPlot(response.markers, response.thresholds.marker1, response.marker2, response.status, response.status_levels, "destiny_plot_marker_2");
            // drawDensityPlot(response.comb_score, response.thresholds.combined, "Combination Score", response.status, response.status_levels, "destiny_plot_comb_score");
            // drawIndividualValuePlot(response.markers, response.thresholds.marker1, response.marker1, response.status, response.status_levels, "individual_value_marker_1");
            // drawIndividualValuePlot(response.markers, response.thresholds.marker2, response.marker2, response.status, response.status_levels, "individual_value_marker_2");
            // drawIndividualValuePlot(response.comb_score, response.thresholds.combined, "Combination Score", response.status, response.status_levels, "individual_value_comb_score");
            // drawSensitivitySpecificityPlot(response.roc_data, response.thresholds.marker1, response.marker1, "sens_spec_curve_marker_1");
            // drawSensitivitySpecificityPlot(response.roc_data, response.thresholds.marker2, response.marker2, "sens_spec_curve_marker_2");
            // drawSensitivitySpecificityPlot(response.roc_data, response.thresholds.combined, "Combination", "sens_spec_curve_comb_score");
            // Bir indirme butonu oluşturup response'u ona bağlayalım

        },
        error: function (xhr) {
            $('#collect-data').prop('disabled', false).text('<i class="fas fa-chart-line mr-1"></i> Analyze');
            hideLoader('analysis');
        },
        complete: function () {
            //$('#collect-data').prop('disabled', false).html('<i class="fas fa-chart-line mr-1"></i> Analyze');
            //hideLoader('analysis');
        }
    });

});

function downloadJsonResponse(data, fileName = "analysis_results.json") {
    // Veriyi string formatına çevir (pretty print için 4 boşluk ekledik)
    const jsonString = JSON.stringify(data, null, 4);

    // Veriyi Blob nesnesine dönüştür
    const blob = new Blob([jsonString], {type: "application/json"});

    // Geçici bir indirme bağlantısı oluştur
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = fileName;

    // Bağlantıya tıkla ve sonra temizle
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
}

async function collectAllData() {
    // 1. IndexedDB'den asıl veriyi oku
    const tableData = await dbManager.get_data();
    const delimiter = await dbManager.get_setting('delimiter');
    const dataInputRadio = await dbManager.get_setting('dataInputRadio');
    const exampleDataRadio = await dbManager.get_setting('exampleDataRadio');
    const status = await dbManager.get_setting('status');
    const category = await dbManager.get_setting('category');
    const marker1 = await dbManager.get_setting('marker1');
    const marker2 = await dbManager.get_setting('marker2');

    if (!marker1 || !marker2 || !status || !category) {
        Swal.fire({
            title: "No Marker/Status/Category Selected",
            text: "Please select at least one marker/status/category to perform Analysis.",
            icon: "warning"
        });
        return;
    }

    // 2. Parametreleri ve tablo verisini birleştir
    let payload = {
        function: $('#functions').val(),
        method: $('#methods').val(),
        markers: tableData, // Tüm tabloyu buraya ekliyoruz
        delimiter: delimiter,
        dataInput: dataInputRadio,
        exampleData: exampleDataRadio,
        marker1: marker1,
        marker2: marker2,
        category: category,
        status: status,
    };
    const isAdvancedChecked = $('#advancedCheckBox').is(':checked');

    // Advanced alanları manuel ekle veya bu inputlara da 'data-dynamic' ekleyebilirsin
    payload['cutoffMethod'] = $('#optimalCutOff').val();
    payload['direction'] = $('#direction').val();

    // Sayısal değerler için güvenli parseFloat
    let confLevelRaw = $('#confidenceLevel').val();
    payload['confLevel'] = parseFloat(confLevelRaw.replace(',', '.'));

    // Dinamik inputları topla
    $('[data-dynamic]').each(function () {
        const name = $(this).attr('name');
        const val = $(this).val();
        if (name) payload[name] = val;
    });
    return payload;
}

// .analiz ve veri toplama

// analiz parametreleri
$(document).ready(function () {
    // 1. Sayfa ilk açıldığında seçili olan ana kategoriyi al
    const initialFunctionId = $('#functions').find(':selected').data('id');

    // 2. Eğer bir ID varsa parametreleri getir
    if (initialFunctionId) {
        fetchParams(initialFunctionId, 'dynamic-function-parameters-container');
    }
    const initialMethodId = $('#methods').find(':selected').data('id');
    if (initialMethodId) {
        fetchParams(initialMethodId, 'dynamic-method-parameters-container');
    }
});

$(document).on('change', '#functions', function () {

    const selectedOption = $(this).find('option:selected');

    // Yöntem A: data() fonksiyonu ile (Önerilen)
    const functionId = selectedOption.data('id');

    $.ajax({
        url: 'get-function-methods',
        method: 'POST',
        data: {id: functionId},
        success: function (response) {
            let $methodsSelect = $('#methods');
            $methodsSelect.empty();

            if (response && response.length > 0) {
                let selectedValue = true
                response.forEach(item => {
                    // 1. Seçeneği oluştur: new Option(text, value)
                    let newOption = new Option(item.MethodName, item.MethodKey, selectedValue, selectedValue);

                    // 2. jQuery ile seçeneğe data attribute ekle
                    $(newOption).attr('data-id', item.Id);

                    // 3. Dropdown menüsüne ekle
                    $methodsSelect.append(newOption);
                    selectedValue = false;
                });
            }
            $methodsSelect.trigger('change');
        }
    });
    fetchParams(functionId, 'dynamic-function-parameters-container');
});
$(document).on('change', '#methods', function () {
    const methodId = $(this).find('option:selected').data('id');

    fetchParams(methodId, 'dynamic-method-parameters-container');
});

// Gerekli mi? Evet, ama daha genel bir isimle daha işlevsel:
function fetchParams(parentId, targetContainerId) {
    // Görsel geri bildirim için temizle ve yükleniyor göster
    const $container = $(`#${targetContainerId}`);
    $container.empty()
    $.ajax({
        url: 'get-params',
        method: 'POST',
        data: {parentId: parentId},
        success: function (response) {
            renderDynamicParameters(response, targetContainerId);
        },
        error: function () {
            $container.hide().empty();
        }
    });
}

function renderDynamicParameters(data, targetContainerId = 'dynamic-function-parameters-container') {
    const container = $(`#${targetContainerId}`);
    if (targetContainerId === 'dynamic-function-parameters-container') container.empty();

    if (!data || data.length === 0) return;
    container.show();
    data.forEach(param => {
        let formElement = '';
        const subAreaId = `sub_area_${param.Id}`;

        if (param.InputType === 'select') {

            let optionsHtml = param.Values.map(opt => {
                let isSelected = param.DefaultValue === opt.ValueKey ? 'selected' : '';
                return `<option value="${opt.ValueKey}" data-id="${opt.Id}" data-sub="${opt.ExistSubItem}" ${isSelected}>${opt.ValueName}</option>`
            }).join('');

            formElement = `
            <div class="form-group param-group mb-0" style="width: 100%;">
                <label>${param.ParameterName}</label>
                <select name="${param.ParameterKey}" class="form-control select2bs4 dynamic-select" data-dynamic data-param-id="${param.Id}">
                    <option value="" disabled selected>Seçiniz...</option>
                    ${optionsHtml}
                </select>
                <div id="${subAreaId}" class="sub-parameter-area mt-2"></div>
            </div>`;
        } else if (param.InputType === 'number') {
            // Sayısal girdi oluşturma
            let html = `<input type="number" name="${param.ParameterKey}" class="form-control method-dynamic-input" data-dynamic
                        value="${param.DefaultValue || ''}"
                        min="${param.MinValue || ''}"
                        max="${param.MaxValue || ''}" step="${param.ValueStep || 'any'}">`;
            formElement = `
            <div class="form-group param-group" style="width: 100%;">
                <label>${param.ParameterName}</label>
                ${html}
            </div>`;
        } else if (param.InputType === 'radio') {
            let radiosHtml = param.Values.map(opt => {
                const isSelected = (opt.ValueKey === param.DefaultValue) ? 'checked' : '';
                return `
                 <div class="custom-control custom-radio">
                    <input class="custom-control-input dynamic-radio" type="radio" data-dynamic
                           id="rad_${opt.Id}" name="${param.ParameterKey}" value="${opt.ValueKey}"
                           data-id="${opt.Id}" data-sub="${opt.ExistSubItem}" data-param-id="${param.Id}" ${isSelected}>
                    <label for="rad_${opt.Id}" class="custom-control-label">${opt.ValueName}</label>

                </div>`
            }).join('');

            formElement = `
            <div class="form-group param-group" style="width: 100%;">
                <label>${param.ParameterName}</label>
                ${radiosHtml}
                <div id="${subAreaId}" class="sub-parameter-area mt-2"></div>
            </div>`;
        }

        container.append(formElement);
        // Yeni eklenen selectler için select2'yi tekrar başlat
        $('.select2bs4').select2({theme: 'bootstrap4'});
    });
}

// SELECT Değişimi
$(document).on('change', '.dynamic-select', function () {
    const selectedOption = $(this).find('option:selected');
    const valueId = selectedOption.data('id');
    const hasSub = selectedOption.data('sub');
    const paramId = $(this).data('param-id');
    const subContainer = $(`#sub_area_${paramId}`);

    subContainer.empty(); // Eski alt parametreleri temizle

    if (hasSub == 1 && valueId) {
        fetchParams(valueId, subContainer.attr('id'));
    }
});

// RADIO Değişimi
$(document).on('change', '.dynamic-radio', function () {
    const valueId = $(this).data('id');
    const hasSub = $(this).data('sub');
    const paramId = $(this).data('param-id');
    const subContainer = $(`#sub_area_${paramId}`);

    subContainer.empty();

    if (hasSub == 1) {
        fetchParams(valueId, subContainer.attr('id'));
    }
});
// .analiz parametreleri

// graph codes
function drawRocChart(response) {
    try {


        // --- 1. GRAFİK VERİSİNİ HAZIRLAMA ---
        // Marker isimlerine göre datayı grupla
        const groupedData = {};

        response.roc_data.forEach(row => {
            if (!groupedData[row.marker]) {
                groupedData[row.marker] = [];
            }
            // X ekseni (1 - Specificity)
            // Y ekseni (Sensitivity)
            groupedData[row.marker].push({
                x: 1 - row.specificity,
                y: row.sensitivity,
                threshold: row.threshold // Hover (tooltip) için saklıyoruz
            });
        });

        // Çizgilerin zikzak yapmaması için X eksenine göre sırala
        Object.keys(groupedData).forEach(key => {
            groupedData[key].sort((a, b) => a.x - b.x);
        });

        // Renk paleti
        const colors = {
            "Combination": "#F8766D", // Kırmızı
            [response.marker1]: "#619CFF",      // Mavi
            [response.marker2]: "#00BA38" // Yeşil
        };

        const datasets = Object.keys(groupedData).map(marker => {
            return {
                label: marker === "Combination" ? "Combination Score" : marker, // İsimlendirme
                data: groupedData[marker],
                borderColor: colors[marker] || "#333333",
                backgroundColor: 'transparent',
                borderWidth: 3,
                showLine: true,
                pointRadius: 0, // Noktaları gizle
                pointHoverRadius: 6, // Üzerine gelince noktalar görünsün
                pointStyle: 'line' // <--- Lejantta çizgi görünmesi için bunu ekleyin
            };
        });

        // Köşegen Referans Çizgisi (Rastgele Şans)
        datasets.push({
            label: 'Reference Line',
            data: [{x: 0, y: 0}, {x: 1, y: 1}],
            borderColor: '#999999',
            borderWidth: 2,
            borderDash: [5, 5],
            showLine: true,
            pointRadius: 0,
            pointHoverRadius: 0,
            pointStyle: 'line' // <--- Lejantta çizgi görünmesi için bunu ekleyin
        });

        // --- 2. GRAFİĞİ ÇİZDİRME (CHART.JS) ---
        const ctx = document.getElementById('rocChart').getContext('2d');

        // Varsa eski grafiği yok et
        if (window.rocChartInstance) {
            window.rocChartInstance.destroy();
        }

        // 1. Dark Mode kontrolü yap ve renkleri belirle
        const isDarkMode = $('body').hasClass('dark-mode');
        const overlay = document.getElementById('aucOverlay');

        // Panel stilini dark mode'a göre güncelle
        overlay.style.backgroundColor = isDarkMode ? 'rgba(52, 58, 64, 0.8)' : 'rgba(255, 255, 255, 0.8)';
        overlay.style.color = isDarkMode ? '#fff' : '#333';
        overlay.style.borderColor = isDarkMode ? '#4b545c' : '#ddd';
        overlay.style.border = "1px solid #ddd"
        let aucHtml = `<b style="display:block; margin-bottom:5px; border-bottom:1px solid ${isDarkMode ? '#555' : '#eee'}">AUC Values</b>`;

        response.auc_data.forEach(row => {
            const color = colors[row._row === "Combination Score" ? "Combination" : row._row] || "#333";
            const isBold = row._row === 'Combination Score' ? 'font-weight: bold;' : '';

            aucHtml += `
            <div style="margin-bottom: 3px; ${isBold} display: flex; align-items: center;">
                <span style="display:inline-block; width:10px; height:10px; background:${color}; margin-right:5px; border-radius:2px;"></span>
                <span style="flex:1; margin-right:15px;">${row._row}:</span>
                <span>${row.auc}</span>
            </div>`;
        });

        overlay.innerHTML = aucHtml;

        const textColor = isDarkMode ? '#ffffff' : '#666666'; // Metin rengi
        const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'; // Izgara çizgileri

        window.rocChartInstance = new Chart(ctx, {
            type: 'scatter',
            data: {datasets: datasets},
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        type: 'linear',
                        position: 'bottom',
                        grid: {color: gridColor}, // Izgara çizgisi rengi
                        ticks: {color: textColor}, // Eksen rakamları rengi
                        title: {
                            display: true,
                            text: '1 - Specificity (False Positive Rate)',
                            color: textColor // Eksen başlığı rengi
                        },
                        min: 0, max: 1
                    },
                    y: {
                        grid: {color: gridColor},
                        ticks: {color: textColor},
                        title: {
                            display: true,
                            text: 'Sensitivity (True Positive Rate)',
                            color: textColor
                        },
                        min: 0, max: 1
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: textColor, // Üstteki lejant metinlerinin rengi
                            usePointStyle: true, // Set to false to use box style
                            boxWidth: 500, // Length of the line
                            boxHeight: 50  // Height of the box, making it look like a line
                        }
                    },
                    tooltip: {
                        // Tooltip arka planını dark mode'da biraz daha belirgin yapabilirsin
                        backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                        titleColor: isDarkMode ? '#fff' : '#000',
                        bodyColor: isDarkMode ? '#fff' : '#000',
                        callbacks: {
                            label: function (context) {
                                let point = context.raw;
                                let lbl = context.dataset.label;
                                if (lbl === 'Reference Line') return '';
                                let threshStr = point.threshold !== undefined ? point.threshold : 'N/A';
                                return `${lbl} | Cutoff: ${threshStr} | Sen: ${point.y} | 1-Spe: ${point.x}`;
                            }
                        }
                    }
                }
            }
        });
    } catch (e) {
        toastr.warning('Roc grafiği çizilirken bir aksaklık oldu.')
    }

}

function refreshChartTheme() {
    if (!window.rocChartInstance) return;

    const colors = getChartColors();
    const options = window.rocChartInstance.options;

    // Eksen renklerini güncelle
    options.scales.x.grid.color = colors.grid;
    options.scales.x.ticks.color = colors.text;
    options.scales.x.title.color = colors.text;

    options.scales.y.grid.color = colors.grid;
    options.scales.y.ticks.color = colors.text;
    options.scales.y.title.color = colors.text;

    // Lejant ve Tooltip renklerini güncelle
    options.plugins.legend.labels.color = colors.text;
    options.plugins.tooltip.backgroundColor = colors.tooltipBg;

    // Değişiklikleri uygula
    window.rocChartInstance.update();
}

function getChartColors() {
    const isDark = $('body').hasClass('dark-mode');
    return {
        text: isDark ? '#ffffff' : '#666666',
        grid: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        tooltipBg: isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.9)'
    };
}

// ROC grafiği çizdirme fonksiyonu ve tema yenileme fonksiyonu yukarıda tanımlanmıştır.

/**
 * @param {Array} data - JSON veri dizisi
 * @param {number} threshold - Dikey çizgi değeri
 * @param {string} valueKey - Değerin olduğu anahtar (örn: "ddimer")
 * @param {string} labelKey - Grubun olduğu anahtar (örn: "group")
 */
function drawDensityPlot(data, threshold, valueKey, labelKey = "group", status_levels, targetDivId = 'densityChartDiv') {
    try {
        const groups = {};
        const isDark = $('body').hasClass('dark-mode'); // Koyu mod kontrolü

        data.forEach(item => {
            const label = item[labelKey];
            const val = parseFloat(item[valueKey]);
            if (label && !isNaN(val)) {
                if (!groups[label]) groups[label] = [];
                groups[label].push(val);
            }
        });

        const plotData = [];
        const colors = {
            [status_levels[0]]: '#F8766D',
            [status_levels[1]]: '#00BFC4'
        };
        Object.keys(groups).forEach(label => {
            const values = groups[label];
            if (values.length === 0) return;
            const kde = calcKDE(values);

            plotData.push({
                x: kde.x,
                y: kde.y,
                mode: 'lines',
                name: label,
                line: {width: 3, color: colors[label] || null},
                fill: 'none'
            });
        });

        const layout = {
            title: {
                text: `<b>Kernel density plot (${valueKey})</b>`,
                font: {color: isDark ? '#ffffff' : '#333'}
            },
            // Çerçeve ve Eksen Ayarları
            xaxis: {
                title: valueKey,
                gridcolor: isDark ? '#878787' : '#eee',
                showline: true,         // Eksen çizgisini göster
                mirror: true,           // Çerçeve oluşturmak için karşıya yansıt
                linecolor: isDark ? '#666' : '#ccc', // Çerçeve rengi
                linewidth: 2            // Çerçeve kalınlığı
            },
            yaxis: {
                title: 'Density',
                gridcolor: isDark ? '#878787' : '#eee',
                showline: true,         // Eksen çizgisini göster
                mirror: true,           // Çerçeve oluşturmak için karşıya yansıt
                linecolor: isDark ? '#666' : '#ccc', // Çerçeve rengi
                linewidth: 2            // Çerçeve kalınlığı
            },
            autosize: true,
            margin: {l: 50, r: 30, t: 50, b: 80}, // Çerçeve için boşlukları biraz artırdık
            legend: {
                orientation: "h",
                y: -0.25,
                x: 0.5,
                xanchor: "center",
                font: {color: isDark ? '#ffffff' : '#333'}
            },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            font: {color: isDark ? '#ffffff' : '#333'},
            shapes: [{
                type: 'line',
                x0: threshold, x1: threshold,
                y0: 0, y1: 1, yref: 'paper',
                line: {color: isDark ? '#ffffff' : '#878787', width: 2, dash: 'dot'}
            }]
        };

        const config = {
            responsive: true,
            displayModeBar: true, // Paneli görünür yapar
            displaylogo: false,   // Plotly logosunu gizleyerek kalabalığı önler
            modeBarButtonsToRemove: ['select2d', 'lasso2d'], // Gereksiz butonları temizleyebilirsin
            toImageButtonOptions: {
                format: 'png', // İndirme butonunun formatı
                filename: 'density_plot',
                height: 500,
                width: 700,
                scale: 2 // Daha kaliteli çıktı için çözünürlüğü artırır
            }
        };

        Plotly.newPlot(targetDivId, plotData, layout, config);
    } catch (e) {
        toastr.warning('Density grafigi çizilirken bir aksaklık oldu.')
    }
}

// KDE hesaplama fonksiyonu aynı kalıyor...
// Basit Kernel Yoğunluk Hesaplama Fonksiyonu
function calcKDE(values) {
    const min = Math.min(...values) - 1;
    const max = Math.max(...values) + 1;
    const steps = 100;
    const bandwidth = 0.5; // ggplot2'nin 'bw' parametresine benzer
    const x = [], y = [];

    for (let i = 0; i <= steps; i++) {
        const curX = min + (i * (max - min) / steps);
        let sum = 0;
        values.forEach(v => {
            const z = (curX - v) / bandwidth;
            sum += Math.exp(-0.5 * z * z) / (Math.sqrt(2 * Math.PI) * bandwidth);
        });
        x.push(curX);
        y.push(sum / values.length);
    }
    return {x, y};
}

// drawDensityPlot fonksiyonu, verilen veri setine göre kernel yoğunluk grafiği oluşturur. Koyu mod desteği ve estetik iyileştirmeler içerir.

function drawIndividualValuePlot(data, threshold, valueKey, labelKey = "group", status_levels, targetDivId = 'individualValuePlotDiv') {
    try {
        const isDark = $('body').hasClass('dark-mode');
        const groups = {};

        // 1. Veriyi gruplandır
        data.forEach(item => {
            const label = item[labelKey];
            const val = parseFloat(item[valueKey]);
            if (label && !isNaN(val)) {
                if (!groups[label]) groups[label] = [];
                groups[label].push(val);
            }
        });

        const plotData = [];
        const colors = {
            [status_levels[0]]: '#F8766D',
            [status_levels[1]]: '#00BFC4'
        };
        // 2. Noktaları (Jitter) oluştur
        Object.keys(groups).forEach(label => {
            plotData.push({
                y: groups[label],
                x: Array(groups[label].length).fill(label),
                name: label,
                mode: 'markers',
                type: 'box', // Box plot kullanarak jitter efektini kolayca sağlarız
                boxpoints: 'all', // Tüm noktaları göster
                jitter: 0.7, // Noktaların yatay dağılım genişliği
                pointpos: 0, // Noktaları merkeze al
                fillcolor: 'rgba(255,255,255,0)', // Kutu dolgusunu gizle
                line: {color: 'rgba(255,255,255,0)'}, // Kutu çizgisini gizle
                marker: {
                    size: 6,
                    color: colors[label] || (isDark ? '#fff' : '#333'),
                    opacity: 0.7
                },
                showlegend: true
            });
        });

        // 3. Grafik Düzeni
        const layout = {
            title: {
                text: `<b>Individual-value plot (${valueKey})</b>`,
                font: {size: 20, color: isDark ? '#ffffff' : '#333'}
            },
            xaxis: {
                title: 'Labels',
                gridcolor: isDark ? '#ffffff' : '#eee',
                showline: true,
                mirror: true,
                linecolor: isDark ? '#ffffff' : '#ccc',
                linewidth: 2,
                tickfont: {color: isDark ? '#bbb' : '#333'}
            },
            yaxis: {
                title: valueKey,
                gridcolor: isDark ? '#ffffff' : '#eee',
                showline: true,
                mirror: true,
                linecolor: isDark ? '#ffffff' : '#ccc',
                linewidth: 2,
                tickfont: {color: isDark ? '#bbb' : '#333'}
            },
            autosize: true,
            margin: {l: 60, r: 30, t: 50, b: 80},
            legend: {
                orientation: "h",
                y: -0.25,
                x: 0.5,
                xanchor: "center",
                font: {color: isDark ? '#ffffff' : '#333'}
            },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            // Yatay Eşik Çizgisi (Horizontal Threshold Line)
            shapes: [{
                type: 'line',
                x0: -0.5, x1: 1.5, // Grupları kapsayacak genişlik
                y0: threshold, y1: threshold,
                xref: 'paper', // Yatayda tüm alanı kaplaması için
                line: {color: isDark ? '#ffffff' : '#878787', width: 2, dash: 'dot'}
            }]
        };

        const config = {
            responsive: true,
            displayModeBar: true, // İstediğin ModeBar'ı aktif ettik
            displaylogo: false
        };

        Plotly.newPlot(targetDivId, plotData, layout, config);
    } catch (e) {
        toastr.warning('Individual grafigi çizilirken bir aksaklık oldu.')
    }
}

// drawIndividualValuePlot fonksiyonu, verilen veri setine göre bireysel değerlerin dağılımını gösteren bir grafik oluşturur. Koyu mod desteği ve estetik iyileştirmeler içerir.
function drawSensitivitySpecificityPlot(allData, threshold, valueKey, targetDivId = 'sensSpecPlotDiv') {
    try {
        const isDark = $('body').hasClass('dark-mode');
        const coordData = allData.filter(d => d.marker === valueKey);


        // 1. Veri Hazırlığı
        const traceSensitivity = {
            x: coordData.map(d => d.threshold),
            y: coordData.map(d => d.sensitivity),
            mode: 'lines',
            name: 'Sensitivity',
            line: {width: 3, color: '#f8766d'}, // R'daki renk ile aynı
            type: 'scatter'
        };

        const traceSpecificity = {
            x: coordData.map(d => d.threshold),
            y: coordData.map(d => d.specificity),
            mode: 'lines',
            name: 'Specificity',
            line: {width: 3, color: '#00bfc4'}, // R'daki renk ile aynı
            type: 'scatter'
        };

        const plotData = [traceSensitivity, traceSpecificity];
        if (valueKey === "Combination") {
            valueKey = "Combination Score";
        }
        // 2. Grafik Düzeni (Layout)
        const layout = {
            title: {
                text: `<b>Sensitivity & Specificity Plot (${valueKey})</b>`,
                font: {size: 20, color: isDark ? '#ffffff' : '#333'}
            },
            xaxis: {
                title: `Threshold (${valueKey})`,
                gridcolor: isDark ? '#878787' : '#ccc', // İstediğin beyaz kılavuz çizgileri
                showline: true,
                mirror: true,
                linecolor: isDark ? '#666' : '#ccc',
                linewidth: 2,
                tickfont: {color: isDark ? '#ffffff' : '#333'}
            },
            yaxis: {
                title: 'Value (0-1)',
                range: [0, 1.05],
                gridcolor: isDark ? '#878787' : '#eee',
                showline: true,
                mirror: true,
                linecolor: isDark ? '#666' : '#ccc',
                linewidth: 2,
                tickfont: {color: isDark ? '#ffffff' : '#333'}
            },
            autosize: true,
            margin: {l: 60, r: 30, t: 50, b: 80},
            legend: {
                orientation: "h",
                y: -0.25,
                x: 0.5,
                xanchor: "center",
                font: {color: isDark ? '#ffffff' : '#333'}
            },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            // Dikey Eşik Çizgisi (Vertical Threshold Line)
            shapes: [{
                type: 'line',
                x0: threshold, x1: threshold,
                y0: 0, y1: 1,
                yref: 'paper',
                line: {color: isDark ? '#ffffff' : '#878787', width: 2, dash: 'dot'},
            }]
        };

        const config = {
            responsive: true,
            displayModeBar: true, // Yakınlaştırma araçlarını aktif ettik
            displaylogo: false
        };

        Plotly.newPlot(targetDivId, plotData, layout, config);
    } catch (e) {
        toastr.warning('Sensitivity grafigi çizilirken bir aksaklık oldu.')
    }
}

//
// .graph codes

// create table codes
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

function fillRocCoordinatesTables(rocData) {
    try {


        // 1. Veri içindeki benzersiz marker isimlerini ayıkla (Combination hariç olanlar)
        const uniqueMarkers = [...new Set(rocData.map(item => item.marker))].filter(m => m !== 'Combination');

        // 2. Tablo yapılandırmasını dinamik olarak oluştur
        const tableConfigs = [
            {id: '#table_roc_coordinates_comb_score', marker: 'Combination'}
        ];

        // Marker 1 ve Marker 2'yi sırasıyla ekle
        if (uniqueMarkers[0]) {
            tableConfigs.push({id: '#table_roc_coordinates_marker_1', marker: uniqueMarkers[0]});
        }
        if (uniqueMarkers[1]) {
            tableConfigs.push({id: '#table_roc_coordinates_marker_2', marker: uniqueMarkers[1]});
        }
        tableConfigs.forEach(config => {
            const filteredData = rocData.filter(item => item.marker === config.marker);

            if ($.fn.DataTable.isDataTable(config.id)) {
                $(config.id).DataTable().destroy();
            }

            // Ayarları klonla ve tabloya özel verileri üzerine ekle
            let currentSettings = Object.assign({}, dataTableSettings, {
                data: filteredData,
                columns: [
                    {data: null, defaultContent: '', title: '#', className: 'text-center'},
                    {data: 'marker', title: 'Markers', render: d => d ? d : '-', className: 'text-center'},
                    {
                        data: 'threshold',
                        title: 'Threshold',
                        render: d => d ? d : '-',
                        className: 'text-center'
                    },
                    {data: 'specificity', title: 'Specificity', render: d => d ? d : '-', className: 'text-center'},
                    {data: 'sensitivity', title: 'Sensitivity', render: d => d ? d : '-', className: 'text-center'}
                ],
                // Sıralama ve Numaralandırma işlemleri
                drawCallback: function () {
                    var api = this.api();
                    api.column(0, {search: 'applied', order: 'applied'}).nodes().each(function (cell, i) {
                        cell.innerHTML = i + 1;
                    });
                }
            });

            // Tabloyu ilklendir
            $(config.id).DataTable(currentSettings);
        });
    } catch (e) {
        toastr.warning('Roc tablosu çizilirken bir aksaklık oldu.')
    }
}

function fillAucStatisticsTable(aucData) {
    try {

        const tableId = '#table_auc_statistics';
        // Mevcut tabloyu temizle
        if ($.fn.DataTable.isDataTable(tableId)) {
            $(tableId).DataTable().destroy();
        }

        // Ayarları kopyala ve bu tabloya özel kolonları ekle
        let settings = Object.assign({}, dataTableSettings, {
            data: aucData,
            columns: [
                {
                    data: '_row',
                    render: d => d, className: 'text-center'
                },
                {data: 'auc', render: d => d ? d : '-', className: 'text-center'},
                {data: 'seAuc', render: d => d ? d : '-', className: 'text-center'},
                {
                    data: null,
                    render: row => `${row.lowerLimit}`, className: 'text-center'
                },
                {
                    data: null,
                    render: row => `${row.upperLimit}`, className: 'text-center'
                },
                {data: 'z', render: d => d ? d : '-', className: 'text-center'},
                {
                    data: 'pValue',
                    render: d => d ? d : '-', className: 'text-center'
                }
            ]
        });

        $(tableId).DataTable(settings);
    } catch (e) {
        console.error(e)
        toastr.warning('Auc tablosu çizilirken bir aksaklık oldu.')
    }
}

function fillMultipleComparisonTable(compData) {
    try {
        const tableId = '#table_multiple_comparison';

        if ($.fn.DataTable.isDataTable(tableId)) {
            $(tableId).DataTable().destroy();
            $(tableId).empty();
        }

        // Mevcut global settings'i bu tabloya uyarla
        let settings = Object.assign({}, dataTableSettings, {
            data: compData,
            columns: [
                {data: null, defaultContent: ''}, // Satır No
                {data: 'marker1A', title: 'Marker1 (A)', className: 'text-center'},
                {data: 'marker2B', title: 'Marker (B)', className: 'text-center'},
                {data: 'aucA', title: 'AUC (A)', render: d => d ? d : '-', className: 'text-center'},
                {data: 'aucB', title: 'AUC (B)', render: d => d ? d : '-', className: 'text-center'},
                {data: 'a_b', title: '|A-B|', render: d => d ? d : '-', className: 'text-center'},
                {data: 'se_a_b', title: 'SE(|A-B|)', render: d => d ? d : '-', className: 'text-center'},
                {data: 'z', title: 'z', render: d => d ? d : '-', className: 'text-center'},
                {
                    data: 'pValue',
                    title: 'p-value',
                    render: d => d ? d : '-', className: 'text-center'
                }
            ],
            drawCallback: function () {
                var api = this.api();
                api.column(0, {search: 'applied', order: 'applied'}).nodes().each(function (cell, i) {
                    cell.innerHTML = i + 1;
                });
            }

        });

        $(tableId).DataTable(settings);
    } catch (e) {
        toastr.warning('MultipleComparison tablosu çizilirken bir aksaklık oldu.')
    }
}

function fillThreeCutPointTables(response) {
    try {
        let row1 = "Optimal cut-off method";
        let row2 = "Optimal criterion";
        let row3 = "Optimal cut-off point";
        let cutPointData = {
            combined: [
                {name: row1, value: response.cutoff_method},
                {name: row2, value: response.criterion_data.combined},
                {name: row3, value: response.thresholds.combined}
            ],
            marker1: [
                {name: row1, value: response.cutoff_method},
                {name: row2, value: response.criterion_data.marker1},
                {name: row3, value: response.thresholds.marker1}
            ],
            marker2: [
                {name: row1, value: response.cutoff_method},
                {name: row2, value: response.criterion_data.marker2},
                {name: row3, value: response.thresholds.marker2}
            ]
        }
        // Dinamik başlıkları ayarla
        $('#title_m1').text($('#marker1').val() || 'Marker 1');
        $('#title_m2').text($('#marker2').val() || 'Marker 2');

        const configs = [
            {id: '#table_cut_combined', data: cutPointData.combined},
            {id: '#table_cut_marker1', data: cutPointData.marker1},
            {id: '#table_cut_marker2', data: cutPointData.marker2}
        ];

        configs.forEach(conf => {
            if ($.fn.DataTable.isDataTable(conf.id)) {
                $(conf.id).DataTable().destroy();
                $(conf.id).empty();
            }

            // Genel ayarları bu özel yapıya uyarla
            let settings = Object.assign({}, dataTableSettings, {
                data: conf.data,
                paging: false,      // Kısa tablo olduğu için sayfalamaya gerek yok
                info: false,        // Bilgi metnini gizle
                ordering: false, // Kullanıcının sütun başlığına tıklayıp sıralamasını da engeller
                order: [],
                columns: [
                    {data: 'name', title: '', className: 'font-weight-bold text-center'},
                    {
                        data: 'value',
                        title: 'Value',
                        render: d => (typeof d === 'number') ? d : (d || '-'), className: 'text-center'
                    }
                ]
            });

            $(conf.id).DataTable(settings);
        });
    } catch (e) {
        toastr.warning('Cutpoints tablosu çizilirken bir aksaklık oldu.')
    }
}

function fillDiagnosticTables(diagData) {
    try {
        const markers = ['combined', 'marker1', 'marker2'];

        markers.forEach(mKey => {
            const data = diagData[mKey];
            if (!data) return;

            // --- 1. CONFUSION MATRIX (Üst Tablo) ---
            const confId = `#table_conf_${mKey}`;
            if ($.fn.DataTable.isDataTable(confId)) $(confId).DataTable().destroy();

            $(confId).DataTable({
                data: data.tab,
                paging: false, searching: false, info: false, ordering: false,
                columns: [
                    {data: '_row', title: ''},
                    {data: 'outComePlus', title: 'Outcome +'},
                    {data: 'outComeMinus', title: 'Outcome -'},
                    {data: 'total', title: 'Total'}
                ]
            });

            // --- 2. DIAGNOSTIC STATISTICS (Alt Tablo) ---
            const statId = `#table_stat_${mKey}`;
            if ($.fn.DataTable.isDataTable(statId)) $(statId).DataTable().destroy();

            $(statId).DataTable(Object.assign({}, dataTableSettings, {
                data: data.detail,
                paging: false,
                columns: [
                    {data: null, defaultContent: '', title: '#', className: 'text-center'},
                    {data: 'statistic', title: 'Statistic', render: d => getStatName(d), className: 'text-center'},
                    {data: 'est', title: 'Est', render: d => d ? d : '-', className: 'text-center'},
                    {data: 'lower', title: 'Lower', render: d => d ? d : '-', className: 'text-center'},
                    {data: 'upper', title: 'Upper', render: d => d ? d : '-', className: 'text-center'}
                ],
                drawCallback: function () {
                    var api = this.api();
                    api.column(0).nodes().each((cell, i) => cell.innerHTML = i + 1);
                }
            }));
        });
    } catch (e) {
        console.error(e)
        toastr.warning('Diagnostic tablosu çizilirken bir aksaklık oldu.')
    }
}

// İstatistik kısaltmalarını görseldeki gibi uzun isimlere çevirir
function getStatName(code) {
    const names = {
        'ap': 'Apparent prevalence', 'tp': 'True prevalence',
        'se': 'Sensitivity', 'sp': 'Specificity',
        'diag.ac': 'Correctly classified proportion',
        'pv.pos': 'Positive predictive value', 'pv.neg': 'Negative predictive value',
        'lr.pos': 'Positive likelihood ratio', 'lr.neg': 'Negative likelihood ratio'
    };
    return names[code] || code;
}

// .create table codes