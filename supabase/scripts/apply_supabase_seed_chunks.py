import sys
import os
import json
import urllib.request
import urllib.error
import ctypes
from ctypes import wintypes

class CREDENTIAL(ctypes.Structure):
    _fields_ = [
        ('Flags', wintypes.DWORD), ('Type', wintypes.DWORD), ('TargetName', wintypes.LPWSTR),
        ('Comment', wintypes.LPWSTR), ('LastWritten', wintypes.FILETIME), ('CredentialBlobSize', wintypes.DWORD),
        ('CredentialBlob', ctypes.POINTER(ctypes.c_char)), ('Persist', wintypes.DWORD),
        ('AttributeCount', wintypes.DWORD), ('Attributes', ctypes.c_void_p),
        ('TargetAlias', wintypes.LPWSTR), ('UserName', wintypes.LPWSTR)
    ]

def get_supabase_token():
    advapi32 = ctypes.windll.advapi32
    cred_ptr = ctypes.POINTER(CREDENTIAL)()
    res = advapi32.CredReadW('LegacyGeneric:target=Supabase CLI:supabase', 1, 0, ctypes.byref(cred_ptr))
    if not res:
        raise RuntimeError("Failed to read Supabase CLI credential from Windows Credential Manager.")
    token = ctypes.string_at(cred_ptr.contents.CredentialBlob, cred_ptr.contents.CredentialBlobSize).decode('utf-8')
    return token

def run_query(sql, token):
    req = urllib.request.Request(
        'https://api.supabase.com/v1/projects/gftqvclenyplnuoocbwe/database/query',
        data=json.dumps({'query': sql}).encode('utf-8'),
        headers={'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json'}
    )
    with urllib.request.urlopen(req) as resp:
        return resp.read().decode('utf-8')

def main():
    token = get_supabase_token()
    print("Supabase management token acquired successfully.")

    sql_path = "backend/supabase_attendance_seed.sql"
    if not os.path.exists(sql_path):
        print(f"Error: {sql_path} does not exist.")
        sys.exit(1)

    with open(sql_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Split into discrete statements
    statements = []
    # We can split on semicolon followed by newline
    raw_stmts = content.split(";\n")
    current_chunk = []
    current_size = 0
    max_chunk_size = 200 * 1024 # 200 KB per chunk

    chunks = []
    for s in raw_stmts:
        trimmed = s.strip()
        if not trimmed:
            continue
        if trimmed == "BEGIN" or trimmed == "COMMIT":
            continue
        s_len = len(trimmed.encode('utf-8'))
        if current_size + s_len > max_chunk_size and current_chunk:
            chunks.append(";\n".join(current_chunk) + ";")
            current_chunk = [trimmed]
            current_size = s_len
        else:
            current_chunk.append(trimmed)
            current_size += s_len

    if current_chunk:
        chunks.append(";\n".join(current_chunk) + ";")

    print(f"Prepared {len(chunks)} chunks (each <= 200KB). Applying to Supabase cloud...")

    for idx, chunk in enumerate(chunks):
        pct = round((idx + 1) / len(chunks) * 100, 1)
        print(f"Applying chunk {idx + 1}/{len(chunks)} ({len(chunk)} chars, {pct}%)...", end="", flush=True)
        try:
            run_query(chunk, token)
            print(" DONE")
        except urllib.error.HTTPError as e:
            err_body = e.read().decode('utf-8')
            print(f" ERROR {e.code}: {err_body}")
            sys.exit(1)
        except Exception as e:
            print(f" ERROR: {e}")
            sys.exit(1)

    print("\nSUCCESS: All attendance sessions, records, and student subject aggregates successfully seeded into Supabase Cloud!")

if __name__ == "__main__":
    main()

