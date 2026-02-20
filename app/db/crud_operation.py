import sqlite3, os
from typing import List, Optional
import uuid

from fastapi import HTTPException

from app.db.db_models.parameter_schema import ParameterSchema


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

    query = "SELECT * FROM Tbl_Function ORDER BY OrderNumber ASC"
    # Tablo adı görseldeki gibi 'Function' (tekil) olmalı
    cursor.execute(query)
    functions = cursor.fetchall()
    conn.close()
    return functions


def save_function(data):
    if not data.Id:
        data.Id = str(uuid.uuid4())

    conn = get_db_connection()
    try:
        # SQLite'da Row_factory nesne sözlüğü gibi erişim sağlar
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        query = """
                INSERT OR REPLACE INTO Tbl_Function (Id, FunctionKey, FunctionName, OrderNumber)
                VALUES (:Id, :FunctionKey, :FunctionName, :OrderNumber)
            """

        # Pydantic modelini dictionary'ye çevirerek parametre olarak geçiyoruz
        cursor.execute(query, data.dict())

        # KRİTİK: Değişiklikleri veritabanına işle (commit et)
        conn.commit()

    except Exception as e:
        # Bir hata oluşursa işlemi geri al
        conn.rollback()
        print(f"Veritabanı hatası: {e}")
        raise e
    finally:
        # Bağlantıyı her durumda kapat
        conn.close()

    return data.Id


def delete_function(id):
    conn = get_db_connection()
    # Row_factory kullanarak sütun isimlerine (func['Name'] gibi) erişebiliriz
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # Tablo adı görseldeki gibi 'Function' (tekil) olmalı
    cursor.execute("DELETE FROM Tbl_Function WHERE Id = ?", (id,))
    conn.commit()
    conn.close()
    return


def get_methods():
    conn = get_db_connection()
    # SQLite'da Row_factory nesne sözlüğü gibi erişim sağlar
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    query = """
            SELECT m.Id,
                   m.MethodName,
                   m.MethodKey,
                   m.OrderNumber,
                   m.FunctionId,
                   f.FunctionName
            FROM Tbl_Method m
                     LEFT JOIN Tbl_Function f ON m.FunctionId = f.Id
            ORDER BY m.OrderNumber ASC \
            """
    cursor.execute(query)
    rows = cursor.fetchall()
    conn.close()
    return rows


def save_method(data):
    conn = get_db_connection()
    if not data.Id:
        data.Id = str(uuid.uuid4())
    try:
        cursor = conn.cursor()
        query = """
            INSERT OR REPLACE INTO Tbl_Method (Id, FunctionId, MethodKey, MethodName, OrderNumber)
            VALUES (:Id, :FunctionId, :MethodKey, :MethodName, :OrderNumber)
        """
        cursor.execute(query, data.dict())
        conn.commit()
        return {"status": "success", "Id": data.Id}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


def delete_method(id):
    conn = get_db_connection()

    try:
        cursor = conn.cursor()

        cursor.execute("DELETE FROM Tbl_Method WHERE Id = ?", (id,))
        conn.commit()
        return {"status": "success"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


def get_parameters_by_parent(parent_id):
    conn = get_db_connection()
    # SQLite'da Row_factory nesne sözlüğü gibi erişim sağlar
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    query = """
            SELECT p.*
            FROM Tbl_Parameter p
            WHERE p.ParentId = ?
            ORDER BY p.OrderNumber ASC \
            """
    cursor.execute(query, (parent_id,))
    rows = cursor.fetchall()
    conn.close()
    return rows

def get_parameters_by_id(id):
    conn = get_db_connection()
    # SQLite'da Row_factory nesne sözlüğü gibi erişim sağlar
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    query = """
            SELECT p.*
            FROM Tbl_Parameter p
            WHERE p.Id = ?
            ORDER BY p.OrderNumber ASC \
            """
    cursor.execute(query, (id,))
    rows = cursor.fetchone()
    conn.close()
    return rows

def save_parameter_bulk(data: ParameterSchema):
    conn = get_db_connection()
    cursor = conn.cursor()
    if not data.Id:
        data.Id = str(uuid.uuid4())
    try:
        # 1. Ana Parametreyi Kaydet (Tbl_Parameter)
        cursor.execute("""
            INSERT OR REPLACE INTO Tbl_Parameter 
            (Id, ParentId, ParameterKey, ParameterName, InputType, DefaultValue, MinValue, MaxValue, OrderNumber, ExistSubItem, ValueStep)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (data.Id, data.ParentId, data.ParameterKey, data.ParameterName, data.InputType,
              data.DefaultValue, data.MinValue, data.MaxValue, data.OrderNumber, data.ExistSubItem, data.ValueStep))

        # 2. Yeni Değerleri (Values Listesi) Kaydet (Tbl_ParameterValue)
        for val in data.Values:
            if not val.Id:
                val.Id = str(uuid.uuid4())
            cursor.execute("""
                           INSERT OR REPLACE INTO Tbl_ParameterValue
                               (Id, ParameterId, ValueKey, ValueName, ExistSubItem, OrderNumber)
                           VALUES (?, ?, ?, ?, ?, ?)
                           """, (val.Id, data.Id, val.ValueKey, val.ValueName, val.ExistSubItem, val.OrderNumber))

        # 3. İşlemleri onayla
        conn.commit()
        return data.Id

    except Exception as e:
        conn.rollback()
        print(f"Hata: {e}")
        raise e
    finally:
        conn.close()

def delete_parameter(id):
    conn = get_db_connection()

    try:
        cursor = conn.cursor()

        cursor.execute("DELETE FROM Tbl_ParameterValue WHERE ParameterId = ?", (id,))
        cursor.execute("DELETE FROM Tbl_Parameter WHERE Id = ?", (id,))
        conn.commit()
        return {"status": "success"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

def delete_parameter_value(id):
    conn = get_db_connection()

    try:
        cursor = conn.cursor()

        cursor.execute("DELETE FROM Tbl_ParameterValue WHERE Id = ?", (id,))
        cursor.execute("DELETE FROM Tbl_Parameter WHERE ParentId = ?", (id,))
        conn.commit()
        return {"status": "success"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


def get_parameter_values(parameter_id: str):
    conn = get_db_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    try:
        query = "SELECT * FROM Tbl_ParameterValue WHERE ParameterId = ? ORDER BY OrderNumber ASC"
        cursor.execute(query, (parameter_id,))
        rows = cursor.fetchall()
        return rows
    finally:
        conn.close()
