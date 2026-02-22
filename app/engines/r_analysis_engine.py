import rpy2.robjects as robjects
from fastapi import HTTPException
from rpy2 import rinterface
from rpy2.robjects import default_converter
from rpy2.robjects.conversion import localconverter
import uuid
import os
import rpy2.rinterface_lib.callbacks
import json  # Sadece standart json modülü yeterli!


def r_console_write(x):
    print(x, end='')


rpy2.rinterface_lib.callbacks.consolewrite_print = r_console_write


def call_plot_analysis(data):
    project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    r_script_path = os.path.join(project_root, "app", "r_logic", "analysis_script.R")

    try:
        # R'dan sadece bir metin (JSON string) alacağımız için ekstra converter'lara gerek yok
        with localconverter(default_converter):
            robjects.r.source(r_script_path)
            analysis_func = robjects.r['createROCPlot']

            # None değerleri NULL'a çevirerek veriyi R'a gönderiyoruz
            r_input = robjects.ListVector({k: (v if v is not None else robjects.NULL) for k, v in data.items()})

            # R fonksiyonunu çalıştırıyoruz. Çıktı artık tek elemanlı bir string vektörü.
            r_output = analysis_func(r_input)

            # R'dan dönen JSON string'ini alıp Python dict'e çeviriyoruz
            # r_output[0] metnin kendisini verir
            parsed_data = json.loads(r_output[0])

            # Verileri güvenle çekiyoruz (JSON içinden liste ve sözlük olarak hazır gelir)
            roc_data = parsed_data.get('rocCoordinates', [])
            auc_data = parsed_data.get('aucTable', [])
            mult_comp_data = parsed_data.get('multCompTable', {})
            diag_stat_data = parsed_data.get('diagStatMarkers', {})
            criterion_data = parsed_data.get('criterions', {})
            thresholds = parsed_data.get('thresholds', {})
            cutoff_method = parsed_data.get('cuttoffMethod', {})
            coefficients = parsed_data.get('coefficients', {})
            markers = parsed_data.get('markers', {})
            marker1 = parsed_data.get('marker1', {})
            marker2 = parsed_data.get('marker2', {})
            comb_score = parsed_data.get('combScore', {})
            status = parsed_data.get('status', {})
            status_levels = parsed_data.get('statusLevels', {})
            predictData = parsed_data.get('predictData', {})

        return {
            "status": status,
            "marker1": marker1,
            "marker2": marker2,
            "comb_score": comb_score,
            "roc_data": roc_data,
            "auc_data": auc_data,
            "mult_comp_data": mult_comp_data,
            "diag_stat_data": diag_stat_data,
            "criterion_data": criterion_data,
            "thresholds": thresholds,
            "cutoff_method": cutoff_method,
            "coefficients": coefficients,
            "markers": markers,
            "status_levels": status_levels,
            "predictData": predictData
        }

    except Exception as e:
        print(f"R Analysis Error: {str(e)} | type: {type(e)}")
        raise HTTPException(status_code=500, detail=f"{str(e)} | type: {type(e)}")

