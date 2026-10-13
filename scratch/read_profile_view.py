with open('frontend/html/teacher-dashboard.html', encoding='utf-8') as f:
    lines = f.readlines()

for i, l in enumerate(lines):
    if 'id="profile-view"' in l:
        print(''.join(lines[i-2:i+55]))
        break

