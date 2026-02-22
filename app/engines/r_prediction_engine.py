import json  # Sadece standart json modülü yeterli!
import os

import rpy2.rinterface_lib.callbacks
import rpy2.robjects as robjects
from fastapi import HTTPException
from rpy2.robjects import default_converter
from rpy2.robjects.conversion import localconverter


def r_console_write(x):
    print(x, end='')


rpy2.rinterface_lib.callbacks.consolewrite_print = r_console_write


def call_prediction(data):
    project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    r_script_path = os.path.join(project_root, "app", "r_logic", "prediction_script.R")

    try:
        # R'dan sadece bir metin (JSON string) alacağımız için ekstra converter'lara gerek yok
        with localconverter(default_converter):
            robjects.r.source(r_script_path)
            analysis_func = robjects.r['predictData']

            # None değerleri NULL'a çevirerek veriyi R'a gönderiyoruz
            r_input = robjects.ListVector({k: (v if v is not None else robjects.NULL) for k, v in data.items()})

            # R fonksiyonunu çalıştırıyoruz. Çıktı artık tek elemanlı bir string vektörü.
            r_output = analysis_func(r_input)

            # R'dan dönen JSON string'ini alıp Python dict'e çeviriyoruz
            # r_output[0] metnin kendisini verir
            parsed_data = json.loads(r_output[0])



        return {
            "predict_data": parsed_data
        }

    except Exception as e:
        print(f"R Analysis Error: {str(e)} | type: {type(e)}")
        raise HTTPException(status_code=500, detail=f"{str(e)} | type: {type(e)}")
