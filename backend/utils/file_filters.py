ALLOWED_EXTENSIONS = {".py", ".js", ".ts", ".jsx", ".tsx", ".java", ".php"}

def is_safe_code_file(path: str) -> bool:
    p = path.lower()
    return any(p.endswith(ext) for ext in ALLOWED_EXTENSIONS)
