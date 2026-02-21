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
        const chartIds = ['densityChartDiv', 'destiny_plot_marker_1', 'destiny_plot_marker_2'];

        chartIds.forEach(id => {
            if (document.getElementById(id)) {
                // Temayı anlık güncelle
                Plotly.relayout(id, {
                        'title.font': {color: state ? '#ffffff' : '#333'},
                        'xaxis.gridcolor': state ? '#878787' : '#eee',
                        'yaxis.gridcolor': state ? '#878787' : '#eee',
                        'yaxis.linecolor': state ? '#666' : '#ccc',
                        'xaxis.linecolor': state ? '#666' : '#ccc',
                        'legend.font': {color: state ? '#ffffff' : '#333'},
                        'shapes.line': {color: state ? '#bbb' : 'grey', width: 2, dash: 'dot'},
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

// 2. Global AJAX Takibi (jQuery Global Ajax Events)
$(document).ajaxStart(function () {
    // Herhangi bir AJAX isteği başladığında göster
    $('#global-loader').show();
});

$(document).ajaxStop(function () {
    // Tüm aktif AJAX istekleri bittiğinde gizle
    $('#global-loader').fadeOut('fast');
});

// 3. Hata Durumunda (Opsiyonel)
$(document).ajaxError(function () {
    // Bir istek hata alırsa loader takılı kalmasın diye gizle
    $('#global-loader').hide();
});