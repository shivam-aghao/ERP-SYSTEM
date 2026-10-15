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

def get_auth_token(student_code="312225E015"):
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

async def save_screenshot(ws, filename, msg_id):
    res = await send_cmd(ws, "Page.captureScreenshot", {"format": "png"}, msg_id=msg_id)
    img = base64.b64decode(res["result"]["data"])
    path = os.path.join(ARTIFACTS_DIR, filename)
    with open(path, "wb") as f:
        f.write(img)
    print(f"Captured: {filename} -> {path}", flush=True)
    return msg_id + 1

async def main():
    user_data_dir = os.path.join(ARTIFACTS_DIR, "scratch", "chrome_profile_pay")
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

            # 1. Login as Student 312225E015 (Ghate Aakansha S, Class 2R1)
            token, user = get_auth_token("312225E015")
            init_js = f"""
            localStorage.setItem('ssgmce_access_token', '{token}');
            localStorage.setItem('token', '{token}');
            localStorage.setItem('student_code', '312225E015');
            localStorage.setItem('ssgmce_user', JSON.stringify({json.dumps(user)}));
            """
            await send_cmd(ws, "Page.navigate", {"url": "http://localhost:8000/html/student-dashboard.html"}, msg_id=mid); mid += 1
            await asyncio.sleep(2.0)
            await send_cmd(ws, "Runtime.evaluate", {"expression": init_js}, msg_id=mid); mid += 1

            # Reload to apply storage and open Fee Online Payment view
            await send_cmd(ws, "Page.navigate", {"url": "http://localhost:8000/html/student-dashboard.html"}, msg_id=mid); mid += 1
            await asyncio.sleep(2.5)

            await send_cmd(ws, "Runtime.evaluate", {"expression": "if (window.openFeesView) window.openFeesView('online-payment');"}, msg_id=mid); mid += 1
            await asyncio.sleep(1.5)

            # View 1: Default selected category (CURRENT_YEAR)
            await send_cmd(ws, "Runtime.evaluate", {"expression": "if (window.onPaymentCategorySelected) window.onPaymentCategorySelected('CURRENT_YEAR');"}, msg_id=mid); mid += 1
            await asyncio.sleep(1.0)
            mid = await save_screenshot(ws, "fees_online_payment_current_year.png", mid)

            # View 2: Select EXAM-(3000)
            await send_cmd(ws, "Runtime.evaluate", {"expression": "if (window.onPaymentCategorySelected) window.onPaymentCategorySelected('EXAM');"}, msg_id=mid); mid += 1
            await asyncio.sleep(1.0)
            mid = await save_screenshot(ws, "fees_online_payment_exam.png", mid)

            # View 3: Select OTHER-(7000)
            await send_cmd(ws, "Runtime.evaluate", {"expression": "if (window.onPaymentCategorySelected) window.onPaymentCategorySelected('OTHER');"}, msg_id=mid); mid += 1
            await asyncio.sleep(1.0)
            mid = await save_screenshot(ws, "fees_online_payment_other.png", mid)

            # View 4: Select zero balance category HOSTEL-(0)
            await send_cmd(ws, "Runtime.evaluate", {"expression": "if (window.onPaymentCategorySelected) window.onPaymentCategorySelected('HOSTEL');"}, msg_id=mid); mid += 1
            await asyncio.sleep(1.0)
            mid = await save_screenshot(ws, "fees_online_payment_zero_category.png", mid)

            # View 5: Mobile View (375x812) with CURRENT_YEAR selected
            await send_cmd(ws, "Runtime.evaluate", {"expression": "if (window.onPaymentCategorySelected) window.onPaymentCategorySelected('CURRENT_YEAR');"}, msg_id=mid); mid += 1
            await send_cmd(ws, "Emulation.setDeviceMetricsOverride", {
                "width": 375,
                "height": 812,
                "deviceScaleFactor": 2,
                "mobile": True
            }, msg_id=mid); mid += 1
            await asyncio.sleep(1.0)
            mid = await save_screenshot(ws, "fees_online_payment_mobile_375px.png", mid)

            # Reset emulation to desktop
            await send_cmd(ws, "Emulation.clearDeviceMetricsOverride", msg_id=mid); mid += 1

            # View 6: Switch to Student 308637 (all 0 dues)
            token_3r, user_3r = get_auth_token("308637")
            init_js_3r = f"""
            localStorage.setItem('ssgmce_access_token', '{token_3r}');
            localStorage.setItem('token', '{token_3r}');
            localStorage.setItem('student_code', '308637');
            localStorage.setItem('ssgmce_user', JSON.stringify({json.dumps(user_3r)}));
            """
            await send_cmd(ws, "Runtime.evaluate", {"expression": init_js_3r}, msg_id=mid); mid += 1
            await send_cmd(ws, "Page.navigate", {"url": "http://localhost:8000/html/student-dashboard.html"}, msg_id=mid); mid += 1
            await asyncio.sleep(2.5)
            await send_cmd(ws, "Runtime.evaluate", {"expression": "if (window.openFeesView) window.openFeesView('online-payment');"}, msg_id=mid); mid += 1
            await asyncio.sleep(1.5)
            mid = await save_screenshot(ws, "fees_online_payment_all_zero_308637.png", mid)

    finally:
        proc.terminate()
        try:
            proc.wait(timeout=3)
        except Exception:
            proc.kill()

if __name__ == "__main__":
    asyncio.run(main())

