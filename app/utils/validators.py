# Input Validation Utilities
import re
from typing import Optional
from fastapi import HTTPException


def validate_delimiter(delimiter: str) -> str:
    """Validate and convert delimiter string to actual character"""
    delimiter_map = {
        "comma": ",",
        "tab": "\t",
        "semicolon": ";",
        "space": " ",
        "pipe": "|"
    }

    if delimiter in delimiter_map:
        return delimiter_map[delimiter]
    elif len(delimiter) == 1:
        return delimiter
    else:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid delimiter: {delimiter}"
        )


def validate_column_name(column_name: str) -> bool:
    """
    Validate column name to prevent SQL injection
    Only allow alphanumeric, underscore, and spaces
    """
    pattern = r'^[a-zA-Z0-9_\s]+$'
    return bool(re.match(pattern, column_name))


def sanitize_filename(filename: str) -> str:
    """
    Sanitize filename to prevent path traversal attacks
    """
    # Remove any path separators
    filename = filename.replace('/', '_').replace('\\', '_')
    # Remove any dangerous characters
    filename = re.sub(r'[^\w\s.-]', '', filename)
    # Limit length
    if len(filename) > 255:
        filename = filename[:255]
    return filename


def validate_numeric_range(value: float, min_val: float, max_val: float, param_name: str) -> float:
    """
    Validate that a numeric value is within acceptable range
    """
    if not (min_val <= value <= max_val):
        raise HTTPException(
            status_code=400,
            detail=f"{param_name} must be between {min_val} and {max_val}"
        )
    return value


def validate_positive_integer(value: int, param_name: str) -> int:
    """
    Validate that value is a positive integer
    """
    if not isinstance(value, int) or value <= 0:
        raise HTTPException(
            status_code=400,
            detail=f"{param_name} must be a positive integer"
        )
    return value

