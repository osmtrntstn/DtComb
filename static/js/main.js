function printRocChart() {
    if (!window.rocChartInstance) {
        alert("Yazdırılacak aktif bir grafik bulunamadı.");
        return;
    }

    const chartImage = window.rocChartInstance.toBase64Image();
    const aucOverlayContent = document.getElementById('aucOverlay').innerHTML;

    const printWindow = window.open('', '_blank');

    printWindow.document.write(`
        <html>
            <head>
                <title>ROC Analiz Raporu</title>
                <style>
                    body { font-family: sans-serif; padding: 20px; text-align: center; }
                    
                    /* Grafiği ve Overlay'i bir arada tutan ana kapsayıcı */
                    .report-container {
                        position: relative;
                        display: inline-block;
                        margin-top: 20px;
                        border: 1px solid #f0f0f0;
                        padding: 10px;
                    }

                    .main-chart {
                        max-width: 800px; /* Çıktı boyutu kontrolü */
                        height: auto;
                        display: block;
                    }

                    /* AUC panelini tam olarak görseldeki yerine konumlandırıyoruz */
                    .auc-panel-print {
                        position: absolute;
                        bottom: 65px;   /* Alt eksenden uzaklık */
                        right: 30px;    /* Sağ eksenden uzaklık */
                        background: rgba(255, 255, 255, 0.9);
                        border: 1px solid #ccc;
                        border-radius: 8px;
                        padding: 10px;
                        min-width: 180px;
                        text-align: left;
                        font-size: 13px;
                        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                    }

                    /* Renk kutucuklarının basılması için kritik ayar */
                    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                    
                    h2 { color: #333; margin-bottom: 5px; }
                </style>
            </head>
            <body>
                <h2>ROC Curves for Combination Diagnostic Test</h2>
                <div class="report-container">
                    <img src="${chartImage}" class="main-chart" />
                    
                    <div class="auc-panel-print">
                        ${aucOverlayContent}
                    </div>
                </div>

                <script>
                    window.onload = function() {
                        window.print();
                        window.onafterprint = function() { window.close(); };
                    };
                </script>
            </body>
        </html>
    `);

    printWindow.document.close();
}

// LOADER ÖNCESİ (Başlatırken)
function showLoader(targetDivId) {
    const isDark = $('body').hasClass('dark-mode');
    const container = $(`#${targetDivId}`).parent('.overlay-wrapper');

    // Eğer loader zaten varsa tekrar ekleme
    if (container.find('.overlay-loader').length === 0) {
        const loaderHtml = `
            <div class="overlay-loader" id="loader-${targetDivId}">
                <div class="spinner-border ${isDark ? 'text-light' : 'text-primary'}" role="status"></div>
            </div>`;
        container.append(loaderHtml);
    }
}

// LOADER SONRASI (Bittiğinde)
function hideLoader(targetDivId) {
    $(`#loader-${targetDivId}`).fadeOut(200, function () {
        $(this).remove(); // Katmanı tamamen temizle
    });
}

$(function () {
    $("input[data-bootstrap-switch]").each(function () {
        $(this).bootstrapSwitch('state', $(this).prop('checked'));
        $(this).css('display', "block");
    })
});

$(document).ready(function () {
    const $body = $('body');
    const $switch = $('#darkModeSwitch');


    // 1. Tarayıcıda kayıtlı tercihi kontrol et
    const currentTheme = localStorage.getItem('theme');
    if (currentTheme === 'dark') {
        $body.addClass('dark-mode');
        $switch.bootstrapSwitch('state', true, true);
    } else {
        $switch.bootstrapSwitch('state', false, true);
    }

    // Değişimi dinle
    $('#darkModeSwitch').on('switchChange.bootstrapSwitch', function (event, state) {
        // state: true (Açık) veya false (Kapalı) döner
        if (state) {
            $('body').addClass('dark-mode');
            localStorage.setItem('theme', 'dark');
        } else {
            $('body').removeClass('dark-mode');
            localStorage.setItem('theme', 'light');
        }

        // Grafiği güncelle
        if (typeof refreshChartTheme === 'function') {
            refreshChartTheme();
        }

        const overlay = document.getElementById('aucOverlay');

        // Panel stilini dark mode'a göre güncelle
        overlay.style.backgroundColor = state ? 'rgba(52, 58, 64, 0.8)' : 'rgba(255, 255, 255, 0.8)';
        overlay.style.color = state ? '#fff' : '#333';
        overlay.style.borderColor = state ? '#4b545c' : '#ddd';

        const chartIds = ['densityChartDiv', 'destiny_plot_marker_1', 'destiny_plot_marker_2', 'individual_value_marker_1', 'individual_value_marker_2', 'sens_spec_curve_marker_1', 'sens_spec_curve_marker_2'];

        chartIds.forEach(id => {
            if (document.getElementById(id)) {
                // Temayı anlık güncelle
                Plotly.relayout(id, {
                        'title.font': {color: state ? '#ffffff' : '#333'},
                        'xaxis.gridcolor': state ? '#878787' : '#eee',
                        'yaxis.gridcolor': state ? '#878787' : '#eee',
                        'yaxis.linecolor': state ? '#878787' : '#ccc',
                        'xaxis.linecolor': state ? '#878787' : '#ccc',
                        'xaxis.tickfont': {color: state ? '#ffffff' : '#333'},
                        'yaxis.tickfont': {color: state ? '#ffffff' : '#333'},
                        'legend.font': {color: state ? '#ffffff' : '#333'},
                        'shapes[0].line': {color: state ? '#ffffff' : '#878787', width: 2, dash: 'dot'},
                        font: {color: state ? '#ffffff' : '#333'},

                    }
                );
            }
        });
    });
});


// 1. Sayfa İlk Açılış Kontrolü
$(window).on('load', function () {
    // Tüm resimler, scriptler ve CSS'ler hazır olduğunda kapat
    $('#global-loader').fadeOut('slow');
});
//
// // 2. Global AJAX Takibi (jQuery Global Ajax Events)
// $(document).ajaxStart(function () {
//     // Herhangi bir AJAX isteği başladığında göster
//     $('#global-loader').show();
// });
//
$(document).ajaxStop(function () {
    // Tüm aktif AJAX istekleri bittiğinde gizle
    $('#global-loader').fadeOut('fast');
});

// 3. Hata Durumunda (Opsiyonel)
$(document).ajaxError(function () {
    // Bir istek hata alırsa loader takılı kalmasın diye gizle
    $('#global-loader').hide();
});

// 3. Hata Durumunda (Opsiyonel)
$(document).ajaxSuccess(function () {
    // Bir istek hata alırsa loader takılı kalmasın diye gizle
    $('#global-loader').hide();
});