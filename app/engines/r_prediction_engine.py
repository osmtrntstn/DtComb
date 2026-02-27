import json
import os
import rpy2.rinterface_lib.callbacks
import rpy2.robjects as robjects
from rpy2.robjects import vectors  # ListVector ve StrVector için
from fastapi import HTTPException
from rpy2.robjects import default_converter
from rpy2.robjects.conversion import localconverter


def r_console_write(x):
    # UnicodeDecodeError almamak için replace kullanıyoruz
    if isinstance(x, bytes):
        print(x.decode('utf-8', errors='replace'), end='')
    else:
        print(x, end='')


rpy2.rinterface_lib.callbacks.consolewrite_print = r_console_write


def call_prediction(data):
    project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    r_script_path = os.path.join(project_root, "app", "r_logic", "prediction_script.R")

    try:
        with localconverter(default_converter):
            robjects.r.source(r_script_path)
            analysis_func = robjects.r['predictData']

            # Hata Buradaydı: ListVector'e gönderilen değerleri R objelerine çeviriyoruz
            # Özellikle 'dict' tipindeki verileri R'ın anlayacağı ListVector'e zorluyoruz
            converted_items = {}
            for k, v in data.items():
                if v is None:
                    converted_items[k] = robjects.NULL
                elif isinstance(v, (list, tuple)):
                    # Liste ise Float veya Int vektöre çevir
                    converted_items[k] = robjects.FloatVector(v) if any(
                        isinstance(i, float) for i in v) else robjects.IntVector(v)
                elif isinstance(v, str):
                    converted_items[k] = robjects.StrVector([v])
                else:
                    converted_items[k] = v

            r_input = robjects.ListVector(converted_items)
            r_output = analysis_func(r_input)

            # R'dan gelen veri bazen StrVector formatında olabilir
            parsed_data = json.loads(str(r_output[0]))

        return {"predict_data": parsed_data}

    except Exception as e:
        print(f"R Analysis Error: {str(e)} | type: {type(e)}")
        raise HTTPException(status_code=500, detail=f"R Prediction Error: {str(e)}")