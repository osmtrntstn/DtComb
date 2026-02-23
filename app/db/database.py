import sqlite3, os
from typing import List, Optional

from app.db.db_models.function_schema import FunctionSchema
from app.db.db_models.method_schema import MethodSchema
from app.models.MethodParameterValueModel import MethodParameterModel, MethodParameterValueModel


def get_db_connection():
    # Mevcut dosyanın (database.py) bulunduğu klasörü temel alarak yolu belirle
    base_dir = os.path.dirname(os.path.abspath(__file__))
    db_path = os.path.join(base_dir, 'dtcomb_data.db')

    conn = sqlite3.connect(db_path, check_same_thread=False)
    return conn


def get_functions():
    conn = get_db_connection()
    # Row_factory kullanarak sütun isimlerine (func['Name'] gibi) erişebiliriz
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # Tablo adı görseldeki gibi 'Function' (tekil) olmalı
    cursor.execute("SELECT * FROM Tbl_Function2 ORDER BY [OrderNumber] ASC")
    functions = cursor.fetchall()
    conn.close()
    return [FunctionSchema.model_validate(dict(f)) for f in functions]


def get_methods(id: str):
    conn = get_db_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # GÜVENLİ YÖNTEM: ? işareti placeholder (yer tutucu) olarak kullanılır
    # Değişken, sorguya ikinci bir parametre olarak (tuple formatında) gönderilir
    cursor.execute("SELECT * FROM Tbl_Method2 WHERE FunctionId = ? ORDER BY [OrderNumber] ASC", (id,))

    methods = cursor.fetchall()
    conn.close()

    return [MethodSchema.model_validate(dict(f)) for f in methods]


def get_parameters(id: str):
    conn = get_db_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # GÜVENLİ YÖNTEM: ? işareti placeholder (yer tutucu) olarak kullanılır
    # Değişken, sorguya ikinci bir parametre olarak (tuple formatında) gönderilir
    query = """SELECT fp.Id             as ParameterId,
                      fp.ParentId,
                      fp.ParameterKey,
                      fp.ParameterName,
                      fp.InputType,
                      fp.DefaultValue,
                      fp.MinValue,
                      fp.MaxValue,
                      fp.OrderNumber    as ParameterOrder,
                      fp.ExistSubItem   as ParameterExistSubItem,
                      fpv.Id            as ValueId,
                      fpv.ValueKey,
                      fpv.ValueName,
                      fp.ValueStep,
                      fpv.[OrderNumber] as ValueOrder,
                      fpv.ExistSubItem  as ValueExistSubItem
               FROM Tbl_Parameter2 fp
                        LEFT JOIN Tbl_ParameterValue2 fpv
                                  on fp.Id = fpv.ParameterId
               where fp.ParentId = ?
               ORDER BY fp.[OrderNumber], fpv.[OrderNumber] ASC """;
    cursor.execute(query, (id,))

    parameters = cursor.fetchall()
    conn.close()

    return transform_to_nested_params(parameters)


def transform_to_nested_params(rows):
    """
    Flat SQL sonucunu nested ParameterSchema yapısına dönüştürür.
    """
    # Parametreleri id'lerine göre gruplamak için bir sözlük kullanıyoruz
    param_dict = {}

    for row in rows:
        p_id = row['ParameterId']

        # Eğer bu parametre sözlükte yoksa yeni oluştur
        if p_id not in param_dict:
            param_dict[p_id] = {
                "Id": p_id,
                "ParentId": row['ParentId'],
                "ParameterKey": row['ParameterKey'],
                "ParameterName": row['ParameterName'],
                "InputType": row['InputType'],
                "DefaultValue": row['DefaultValue'],
                "MinValue": row['MinValue'],
                "MaxValue": row['MaxValue'],
                "OrderNumber": row['ParameterOrder'],
                "ExistSubItem": row['ParameterExistSubItem'],
                "ValueStep": row['ValueStep'],
                "Values": []  # Değerler için boş liste
            }

        # Eğer satırda bir ValueId varsa (LEFT JOIN nedeniyle boş gelebilir)
        # ve daha önce eklenmemişse Values listesine ekle
        if row['ValueId']:
            value_item = {
                "Id": row['ValueId'],
                "ValueKey": row['ValueKey'],
                "ValueName": row['ValueName'],
                "OrderNumber": row['ValueOrder'],
                "ExistSubItem": row['ValueExistSubItem']
            }
            param_dict[p_id]["Values"].append(value_item)

    # Sözlükteki değerleri liste olarak döndür
    return list(param_dict.values())


# sil
def get_function_parameters(id: str):
    conn = get_db_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # GÜVENLİ YÖNTEM: ? işareti placeholder (yer tutucu) olarak kullanılır
    # Değişken, sorguya ikinci bir parametre olarak (tuple formatında) gönderilir
    query = """SELECT fp.Id             as ParameterId,
                      fp.ParentId,
                      fp.ParameterKey,
                      fp.ParameterName,
                      fp.InputType,
                      fp.DefaultValue,
                      fp.MinValue,
                      fp.MaxValue,
                      fp.ValueStep,
                      fp.OrderNumber    as ParameterOrder,
                      fp.ExistSubItem   as ParameterExistSubItem,
                      fpv.Id            as ValueId,
                      fpv.ValueKey,
                      fpv.ValueName,
                      fpv.[OrderNumber] as ValueOrder,
                      fpv.ExistSubItem  as ValueExistSubItem
               FROM Tbl_Parameter2 fp
                        LEFT JOIN Tbl_ParameterValue2 fpv
                                  on fp.Id = fpv.ParameterId
               where fp.ParentId = ?
               ORDER BY fp.[OrderNumber], fpv.[OrderNumber] ASC """;
    cursor.execute(query, (id,))

    parameters = cursor.fetchall()
    conn.close()

    return transform_to_nested_params(parameters)


def get_method_parameters(method_id: Optional[int] = 0, method_parameter_id: Optional[int] = 0):
    conn = get_db_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    query = """SELECT mp.Id                AS ParameterId,
                      mp.MethodId,
                      mp.Name              AS ParameterName,
                      mp.Label,
                      mp.InputType,
                      mp.DefaultValue,
                      mp.Min,
                      mp.Max,
                      mp.MethodParameterId AS ParentParameterId,
                      mpv.Id               AS ValueId,
                      mpv.Name             AS ValueName,
                      mpv.Value            AS ValueText
               FROM MethodParameters mp
                        LEFT JOIN MethodParameterValues mpv ON mp.Id = mpv.MethodParameterId
               WHERE MethodId = ?
                 AND ParentParameterId = ?
               ORDER BY mp.Id, mpv.Id"""
    params = (method_id, method_parameter_id)
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    return transform_method_params(rows)


def transform_method_params(rows):
    parameters = {}

    for row in rows:
        p_id = row['ParameterId']

        # Eğer bu parametre henüz eklenmemişse ana bilgilerini oluştur
        if p_id not in parameters:
            parameters[p_id] = MethodParameterModel(
                Id=p_id,
                MethodId=row['MethodId'],
                Name=row['ParameterName'],
                Label=row['Label'],
                InputType=row['InputType'],
                DefaultValue=row['DefaultValue'],
                Min=row['Min'],
                Max=row['Max'],
                ParentParameterId=row['ParentParameterId'],
                Options=[]
            )

        # Eğer sağ taraftan (Value tablosundan) bir veri gelmişse Options'a ekle
        if row['ValueId'] is not None:
            val = MethodParameterValueModel(
                Id=row['ValueId'],
                Name=row['ValueName'],
                Value=row['ValueText']
            )
            parameters[p_id].Options.append(val)

    return list(parameters.values())
