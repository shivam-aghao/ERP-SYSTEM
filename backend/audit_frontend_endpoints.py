import os, re

def audit():
    endpoints = []
    for root, dirs, files in os.walk('frontend'):
        for f in files:
            if not (f.endswith('.js') or f.endswith('.html')): continue
            p = os.path.join(root, f)
            try:
                with open(p, 'r', encoding='utf-8') as fp:
                    content = fp.read()
            except Exception:
                continue
            
            # Find fetch calls
            matches = re.findall(r'fetch\([\'"`]([^\'"`\$\{\}]+)[\'"`]', content)
            for m in matches:
                endpoints.append((f, m))
            
            # Find template literals with /api/
            template_matches = re.findall(r'fetch\(`([^`]+)`', content)
            for m in template_matches:
                endpoints.append((f, m[:80]))
                
    print(f"Total API calls found in frontend: {len(endpoints)}")
    unique_eps = sorted(list(set([f"{f:30} -> {ep}" for f, ep in endpoints])))
    for item in unique_eps:
        print(item)

if __name__ == '__main__':
    audit()

