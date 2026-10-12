import json
import urllib.request
import ctypes
from ctypes import wintypes
import sys

class CREDENTIAL(ctypes.Structure):
    _fields_ = [
        ('Flags', wintypes.DWORD),
        ('Type', wintypes.DWORD),
        ('TargetName', wintypes.LPWSTR),
        ('Comment', wintypes.LPWSTR),
        ('LastWritten', wintypes.FILETIME),
        ('CredentialBlobSize', wintypes.DWORD),
        ('CredentialBlob', ctypes.POINTER(ctypes.c_char)),
        ('Persist', wintypes.DWORD),
        ('AttributeCount', wintypes.DWORD),
        ('Attributes', ctypes.c_void_p),
        ('TargetAlias', wintypes.LPWSTR),
        ('UserName', wintypes.LPWSTR),
    ]

advapi32 = ctypes.windll.advapi32
cred_pointer = ctypes.POINTER(CREDENTIAL)()
advapi32.CredReadW('LegacyGeneric:target=Supabase CLI:supabase', 1, 0, ctypes.byref(cred_pointer))
cred = cred_pointer.contents
token = ctypes.string_at(cred.CredentialBlob, cred.CredentialBlobSize).decode('utf-8')

def run_query(sql):
    req = urllib.request.Request(
        'https://api.supabase.com/v1/projects/gftqvclenyplnuoocbwe/database/query',
        data=json.dumps({'query': sql}).encode('utf-8'),
        headers={
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
    )
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        err = e.read().decode('utf-8', errors='replace')
        print(f"SQL ERROR {e.code}: {err}")
        return {'error': err}

if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1].endswith('.sql'):
        with open(sys.argv[1], 'r', encoding='utf-8') as f:
            sql = f.read()
    else:
        sql = " ".join(sys.argv[1:]) if len(sys.argv) > 1 else "SELECT 1 as test;"
    res = run_query(sql)
    print(json.dumps(res, indent=2))

