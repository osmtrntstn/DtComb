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
    if isinstance(data.get("analysisData"), str):
        try:
            data["analysisData"] = json.loads(data["analysisData"])
        except Exception as e:
            print(f"JSON Parse Hatası: {e}")
    try:
        with localconverter(default_converter):
            robjects.r.source(r_script_path)
            analysis_func = robjects.r['predictData']

            # KRİTİK DÜZELTME: Veriyi rekürsif olarak çeviriyoruz
            r_input = python_to_r(data)

            # r_input = robjects.ListVector(converted_items)
            r_output = analysis_func(r_input)

            # R'dan gelen veri bazen StrVector formatında olabilir
            parsed_data = json.loads(str(r_output[0]))

        return {"predict_data": parsed_data}

    except Exception as e:
        print(f"R Analysis Error: {str(e)} | type: {type(e)}")
        raise HTTPException(status_code=500, detail=f"R Prediction Error: {str(e)}")


# İç içe geçmiş Python nesnelerini R nesnelerine çeviren fonksiyon
def python_to_r(obj):
    if obj is None:
        return robjects.NULL
    elif isinstance(obj, dict):
        # Sözlük içindeki her şeyi tek tek R'a çevir
        return robjects.ListVector({k: python_to_r(v) for k, v in obj.items()})
    elif isinstance(obj, list):
        # Liste boşsa boş vektör döndür
        if not obj:
            return robjects.BoolVector([])
        # Listenin ilk elemanına bakarak tip belirle (veya genel FloatVector kullan)
        try:
            if isinstance(obj[0], bool):
                return robjects.BoolVector(obj)
            elif isinstance(obj[0], int):
                return robjects.IntVector(obj)
            elif isinstance(obj[0], float):
                return robjects.FloatVector(obj)
            else:
                return robjects.StrVector([str(i) for i in obj])
        except:
            return robjects.StrVector([str(i) for i in obj])
    elif isinstance(obj, (int, float, str, bool)):
        return obj  # Temel tipleri rpy2 zaten halleder
    else:
        return str(obj)
