import json

with open('supabase/scripts/data_teacher_timetables.json', 'r') as f:
    data = json.load(f)

classes = ['3R', '2R1', '2R2', '4R']
result = {}

for cls in classes:
    result[cls] = {}
    for day in ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']:
        slots_found = []
        for emp, fac in data.items():
            name = fac.get('name')
            sched = fac.get('schedule', {})
            for s in sched.get(day, []):
                if s.get('class') == cls:
                    slots_found.append({
                        'slot': s.get('slot'),
                        'subject': s.get('subject'),
                        'faculty': name,
                        'venue': s.get('venue'),
                        'batch': s.get('batch'),
                        'is_lab': s.get('is_lab')
                    })
        result[cls][day] = sorted(slots_found, key=lambda x: (x['slot'], x['batch'] or ''))

print("3R Monday count:", len(result['3R']['Monday']))
print("2R1 Monday count:", len(result['2R1']['Monday']))
print("2R2 Monday count:", len(result['2R2']['Monday']))
print("4R Monday count:", len(result['4R']['Monday']))

# Save output to scratch/timetables_by_class.json
with open('supabase/scripts/timetables_by_class.json', 'w') as out:
    json.dump(result, out, indent=2)
print("Successfully generated supabase/scripts/timetables_by_class.json")

