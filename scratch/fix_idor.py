with open("backend/routes/fees.py", "r", encoding="utf-8") as f:
    c = f.read()

old_str = """    # Zero-Trust IDOR Protection: Students may only access their own receipts
    if current_user and (current_user.role or "").lower() == "student":
        caller_code = getattr(current_user, "student_code", None) or current_user.user_id
        rcpt_sc = str(m.get("student_code") or "")
        if caller_code and caller_code != rcpt_sc and current_user.id != m.get("student_code"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: You are only authorized to access your own institutional fee receipts."
            )"""

new_str = """    # Zero-Trust IDOR Protection: Students may only access their own receipts
    if current_user and (current_user.role or "").lower() == "student":
        caller_ident = str(getattr(current_user, "identifier", None) or getattr(current_user, "student_code", None) or current_user.user_id or "")
        caller_id = str(current_user.id or "")
        rcpt_sc = str(m.get("student_code") or "")
        stud_table_id = str(m.get("student_id") or "")
        allowed = (
            (rcpt_sc and rcpt_sc == caller_ident)
            or (rcpt_sc and rcpt_sc == caller_id)
            or (stud_table_id and stud_table_id == caller_id)
        )
        if not allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: You are only authorized to access your own institutional fee receipts."
            )"""

old_select = "s.roll_no, c.name as class_full_name,"
new_select = "s.id as student_id, s.roll_no, c.name as class_full_name,"

if old_str in c:
    c = c.replace(old_str, new_str, 1)
else:
    # Try normalized newlines
    c_norm = c.replace("\r\n", "\n")
    if old_str in c_norm:
        c_norm = c_norm.replace(old_str, new_str, 1)
        c = c_norm
    else:
        raise ValueError("old_str pattern not matched")

if old_select in c:
    c = c.replace(old_select, new_select, 1)

with open("backend/routes/fees.py", "w", encoding="utf-8") as f:
    f.write(c)

print("IDOR fix applied successfully!")

