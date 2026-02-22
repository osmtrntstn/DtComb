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
    $(`#loader-${targetDivId}`).fadeOut(200, function() {
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
// $(document).ajaxStop(function () {
//     // Tüm aktif AJAX istekleri bittiğinde gizle
//     $('#global-loader').fadeOut('fast');
// });
//
// // 3. Hata Durumunda (Opsiyonel)
// $(document).ajaxError(function () {
//     // Bir istek hata alırsa loader takılı kalmasın diye gizle
//     $('#global-loader').hide();
// });