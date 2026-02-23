import os
import re
import sqlite3
import uuid

from fastapi import HTTPException

from app.db.db_models.parameter_schema import ParameterSchema


def get_db_connection():
    # Mevcut dosyanın (database.py) bulunduğu klasörü temel alarak yolu belirle
    base_dir = os.path.dirname(os.path.abspath(__file__))
    db_path = os.path.join(base_dir, 'dtcomb_data.db')

    conn = sqlite3.connect(db_path, check_same_thread=False)
    return conn


def generate_insert_scripts():
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Tüm tablo isimlerini al
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = [row[0] for row in cursor.fetchall()]

    all_inserts = ""

    for table in tables:
        all_inserts += f"\n-- Table: {table} --\n"

        # 2. Kolon isimlerini al
        cursor.execute(f"PRAGMA table_info({table})")
        columns = [info[1] for info in cursor.fetchall()]
        col_names = ", ".join(columns)

        # 3. Verileri al
        cursor.execute(f"SELECT * FROM {table}")
        rows = cursor.fetchall()

        for row in rows:
            # Verileri SQL formatına uygun hale getir (None -> NULL, String -> 'text')
            formatted_values = []
            for val in row:
                if val is None:
                    formatted_values.append("NULL")
                elif isinstance(val, str):
                    # Tek tırnakları escape et (kaçış karakteri ekle)
                    safe_val = val.replace("'", "''")
                    formatted_values.append(f"'{safe_val}'")
                else:
                    formatted_values.append(str(val))

            vals_str = ", ".join(formatted_values)
            all_inserts += f"INSERT INTO {table} ({col_names}) VALUES ({vals_str});\n"

    conn.close()
    return all_inserts

def get_functions():
    conn = get_db_connection()
    # Row_factory kullanarak sütun isimlerine (func['Name'] gibi) erişebiliriz
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    query = "SELECT * FROM Tbl_Function2 ORDER BY OrderNumber ASC"
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
                INSERT OR REPLACE INTO Tbl_Function2 (Id, FunctionKey, FunctionName, OrderNumber)
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
    cursor.execute("DELETE FROM Tbl_Function2 WHERE Id = ?", (id,))
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
            FROM Tbl_Method2 m
                     LEFT JOIN Tbl_Function2 f ON m.FunctionId = f.Id
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
            INSERT OR REPLACE INTO Tbl_Method2 (Id, FunctionId, MethodKey, MethodName, OrderNumber)
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

        cursor.execute("DELETE FROM Tbl_Method2 WHERE Id = ?", (id,))
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
            FROM Tbl_Parameter2 p
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
            FROM Tbl_Parameter2 p
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
        # 1. Ana Parametreyi Kaydet (Tbl_Parameter2)
        cursor.execute("""
            INSERT OR REPLACE INTO Tbl_Parameter2 
            (Id, ParentId, ParameterKey, ParameterName, InputType, DefaultValue, MinValue, MaxValue, OrderNumber, ExistSubItem, ValueStep)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (data.Id, data.ParentId, data.ParameterKey, data.ParameterName, data.InputType,
              data.DefaultValue, data.MinValue, data.MaxValue, data.OrderNumber, data.ExistSubItem, data.ValueStep))

        # 2. Yeni Değerleri (Values Listesi) Kaydet (Tbl_ParameterValue2)
        for val in data.Values:
            if not val.Id:
                val.Id = str(uuid.uuid4())
            cursor.execute("""
                           INSERT OR REPLACE INTO Tbl_ParameterValue2
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

        cursor.execute("DELETE FROM Tbl_ParameterValue2 WHERE ParameterId = ?", (id,))
        cursor.execute("DELETE FROM Tbl_Parameter2 WHERE Id = ?", (id,))
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

        cursor.execute("DELETE FROM Tbl_ParameterValue2 WHERE Id = ?", (id,))
        cursor.execute("DELETE FROM Tbl_Parameter2 WHERE ParentId = ?", (id,))
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
        query = "SELECT * FROM Tbl_ParameterValue2 WHERE ParameterId = ? ORDER BY OrderNumber ASC"
        cursor.execute(query, (parameter_id,))
        rows = cursor.fetchall()
        return rows
    finally:
        conn.close()

def run_sql(data: str):
    # Boşlukları temizle ve küçük harfe çevirerek kontrol et
    clean_query = data.strip().upper()

    # Sadece INSERT veya UPDATE ile başlayıp başlamadığını kontrol et
    # ^(INSERT|UPDATE)\b  --> Satır başı INSERT veya UPDATE olmalı, devamında kelime sınırı olmalı
    if not re.match(r"^(INSERT|UPDATE)\b", clean_query):
        raise HTTPException(
            status_code=403,
            detail="Güvenlik ihlali: Sadece INSERT ve UPDATE işlemlerine izin verilir!"
        )

    # İkinci bir bariyer: Tehlikeli anahtar kelimeler sorgu içinde geçiyor mu?
    forbidden_words = ["DELETE", "DROP", "ALTER", "CREATE", "TRUNCATE", "REPLACE", "ATTACH", "DETACH"]
    if any(word in clean_query for word in forbidden_words):
        raise HTTPException(
            status_code=403,
            detail="Sorgu yasaklı anahtar kelimeler içeriyor!"
        )

    conn = get_db_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    try:
        query = data
        cursor.execute(query, )
        conn.commit()
        return {"status": "success"}
    finally:
        conn.close()


