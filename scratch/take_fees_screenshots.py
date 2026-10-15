import asyncio
import base64
import json
import os
import subprocess
import time
import urllib.request
import websockets

ARTIFACTS_DIR = r"C:\Users\Gopal\.gemini\antigravity\brain\c36bfa9a-11ad-4add-8faa-0cab022e70b1"
CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
PORT = 9222

def get_auth_token(student_code="308637"):
    url = "http://127.0.0.1:8000/api/v1/auth/login"
    payload = json.dumps({"user_id": student_code, "username": student_code, "password": "password123", "role": "student"}).encode("utf-8")
    req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode("utf-8"))
        return data["access_token"], data["user"]

async def send_cmd(ws, method, params=None, msg_id=1):
    payload = {"id": msg_id, "method": method, "params": params or {}}
    await ws.send(json.dumps(payload))
    while True:
        raw = await asyncio.wait_for(ws.recv(), timeout=10.0)
        resp = json.loads(raw)
        if resp.get("id") == msg_id:
            return resp

async def capture_student_views(ws, mid, student_code, prefix):
    token, user = get_auth_token(student_code)
    print(f"Setting context for student: {student_code} ({user.get('full_name')})...", flush=True)

    init_js = f"""
    localStorage.setItem('ssgmce_access_token', '{token}');
    localStorage.setItem('token', '{token}');
    localStorage.setItem('student_code', '{student_code}');
    localStorage.setItem('ssgmce_user', JSON.stringify({json.dumps(user)}));
    """
    await send_cmd(ws, "Runtime.evaluate", {"expression": init_js}, msg_id=mid); mid += 1

    # Reload page
    await send_cmd(ws, "Page.navigate", {"url": "http://localhost:8000/html/student-dashboard.html#fees-payable"}, msg_id=mid); mid += 1
    await asyncio.sleep(2.5)

    # Open payable view
    await send_cmd(ws, "Runtime.evaluate", {"expression": "if (window.openFeesView) window.openFeesView('payable');"}, msg_id=mid); mid += 1
    await asyncio.sleep(1.5)

    # Capture Payable Desktop
    print(f"Capturing {prefix}_payable_desktop...", flush=True)
    res = await send_cmd(ws, "Page.captureScreenshot", {"format": "png"}, msg_id=mid); mid += 1
    img = base64.b64decode(res["result"]["data"])
    path = os.path.join(ARTIFACTS_DIR, f"{prefix}_payable_desktop.png")
    with open(path, "wb") as f:
        f.write(img)
    print("Saved:", path, flush=True)

    # Capture Online Payment Desktop
    print(f"Capturing {prefix}_payment_desktop...", flush=True)
    await send_cmd(ws, "Runtime.evaluate", {"expression": "if (window.openFeesView) window.openFeesView('online-payment');"}, msg_id=mid); mid += 1
    await asyncio.sleep(1.2)
    res = await send_cmd(ws, "Page.captureScreenshot", {"format": "png"}, msg_id=mid); mid += 1
    img = base64.b64decode(res["result"]["data"])
    path = os.path.join(ARTIFACTS_DIR, f"{prefix}_payment_desktop.png")
    with open(path, "wb") as f:
        f.write(img)
    print("Saved:", path, flush=True)

    # Return to payable
    await send_cmd(ws, "Runtime.evaluate", {"expression": "if (window.openFeesView) window.openFeesView('payable');"}, msg_id=mid); mid += 1
    await asyncio.sleep(1.0)

    return mid

async def main():
    user_data_dir = os.path.join(ARTIFACTS_DIR, "scratch", "chrome_profile")
    os.makedirs(user_data_dir, exist_ok=True)

    cmd = [
        CHROME_PATH,
        "--headless=new",
        f"--remote-debugging-port={PORT}",
        f"--user-data-dir={user_data_dir}",
        "--window-size=1280,950",
        "--disable-gpu",
        "--no-sandbox",
        "about:blank"
    ]
    proc = subprocess.Popen(cmd)
    time.sleep(2.5)

    try:
        new_url = f"http://127.0.0.1:{PORT}/json/new"
        req = urllib.request.Request(new_url, method="PUT")
        with urllib.request.urlopen(req) as resp:
            page_info = json.loads(resp.read().decode("utf-8"))
        ws_url = page_info["webSocketDebuggerUrl"]
        print("Connected to page ws:", ws_url, flush=True)

        async with websockets.connect(ws_url) as ws:
            mid = 1
            await send_cmd(ws, "Page.enable", msg_id=mid); mid += 1
            await send_cmd(ws, "Runtime.enable", msg_id=mid); mid += 1

            # Navigate to origin
            await send_cmd(ws, "Page.navigate", {"url": "http://localhost:8000/html/student-dashboard.html"}, msg_id=mid); mid += 1
            await asyncio.sleep(1.5)

            # 1. Student 308637 (Class 3R)
            mid = await capture_student_views(ws, mid, "308637", "fees_class_3r")

            # 2. Student 312225E015 (Class 2R1)
            mid = await capture_student_views(ws, mid, "312225E015", "fees_class_2r1")

            # 3. Mobile View for Class 2R1 (375x812)
            print("Emulating mobile viewport 375x812...", flush=True)
            await send_cmd(ws, "Emulation.setDeviceMetricsOverride", {
                "width": 375,
                "height": 812,
                "deviceScaleFactor": 2,
                "mobile": True
            }, msg_id=mid); mid += 1
            await asyncio.sleep(1.0)

            print("Capturing fees_class_2r1_mobile_375px...", flush=True)
            res_mob = await send_cmd(ws, "Page.captureScreenshot", {"format": "png"}, msg_id=mid); mid += 1
            img_mob = base64.b64decode(res_mob["result"]["data"])
            path_mob = os.path.join(ARTIFACTS_DIR, "fees_class_2r1_mobile_375px.png")
            with open(path_mob, "wb") as f:
                f.write(img_mob)
            print("Saved mobile screenshot:", path_mob, flush=True)

    finally:
        proc.terminate()
        try:
            proc.wait(timeout=3)
        except Exception:
            proc.kill()

if __name__ == "__main__":
    asyncio.run(main())
