import asyncio
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

async def wait_for_chrome(port, max_retries=15):
    url = f"http://127.0.0.1:{port}/json/version"
    for i in range(max_retries):
        try:
            with urllib.request.urlopen(url, timeout=1.0) as resp:
                if resp.getcode() == 200:
                    return True
        except Exception:
            pass
        time.sleep(0.5)
    return False

async def main():
    user_data_dir = os.path.join(ARTIFACTS_DIR, "scratch", "chrome_diag")
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
    
    connected = await wait_for_chrome(PORT)
    if not connected:
        print("Headless Chrome failed to connect")
        proc.terminate()
        return

    try:
        new_url = f"http://127.0.0.1:{PORT}/json/new"
        req = urllib.request.Request(new_url, method="PUT")
        with urllib.request.urlopen(req) as resp:
            page_info = json.loads(resp.read().decode("utf-8"))
        ws_url = page_info["webSocketDebuggerUrl"]

        async with websockets.connect(ws_url) as ws:
            mid = 1
            await send_cmd(ws, "Page.enable", msg_id=mid); mid += 1
            await send_cmd(ws, "Runtime.enable", msg_id=mid); mid += 1
            await send_cmd(ws, "Log.enable", msg_id=mid); mid += 1

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

            # Reload
            await send_cmd(ws, "Page.navigate", {"url": "http://localhost:8000/html/student-dashboard.html"}, msg_id=mid); mid += 1
            await asyncio.sleep(2.5)

            # Step 1: Click the Fees toggle in sidebar
            toggle_step = """
            (function() {
                const ft = document.getElementById('feesMenuToggle');
                if (!ft) return "feesMenuToggle not found";
                ft.click();
                const item = document.getElementById('sidebarItemFees');
                const sub = document.getElementById('feesSubmenu');
                const paymentLink = document.getElementById('sublinkOnlinePayment');
                const rect = paymentLink ? paymentLink.getBoundingClientRect() : null;
                return {
                    expanded: item ? item.classList.contains('expanded') : false,
                    submenuDisplay: sub ? window.getComputedStyle(sub).display : null,
                    paymentRect: rect ? { x: rect.x, y: rect.y, width: rect.width, height: rect.height } : null
                };
            })()
            """
            res = await send_cmd(ws, "Runtime.evaluate", {"expression": toggle_step, "returnByValue": True}, msg_id=mid); mid += 1
            print("Step 1 (Click Fees Toggle):", json.dumps(res["result"]["result"].get("value"), indent=2))

            # Step 2: Now simulate real mouse click on center of sublinkOnlinePayment
            r = res["result"]["result"].get("value", {}).get("paymentRect")
            if r and r["width"] > 0:
                cx = r["x"] + r["width"] / 2
                cy = r["y"] + r["height"] / 2
                print(f"Clicking at ({cx}, {cy})...")

                # What element is at this point?
                hit_js = f"""
                (function() {{
                    const el = document.elementFromPoint({cx}, {cy});
                    return {{
                        tagName: el ? el.tagName : null,
                        id: el ? el.id : null,
                        className: el ? el.className : null,
                        text: el ? el.textContent.trim() : null
                    }};
                }})()
                """
                res = await send_cmd(ws, "Runtime.evaluate", {"expression": hit_js, "returnByValue": True}, msg_id=mid); mid += 1
                print("Element at point:", json.dumps(res["result"]["result"].get("value"), indent=2))

                await send_cmd(ws, "Input.dispatchMouseEvent", {"type": "mousePressed", "x": cx, "y": cy, "button": "left", "clickCount": 1}, msg_id=mid); mid += 1
                await send_cmd(ws, "Input.dispatchMouseEvent", {"type": "mouseReleased", "x": cx, "y": cy, "button": "left", "clickCount": 1}, msg_id=mid); mid += 1
                await asyncio.sleep(1.5)

                check_active_js = """
                (function() {
                    const payableScreen = document.getElementById('feesPayableScreen');
                    const paymentScreen = document.getElementById('feesOnlinePaymentScreen');
                    const receiptScreen = document.getElementById('feesReceiptsScreen');
                    return {
                        payableDisplay: payableScreen ? payableScreen.style.display : null,
                        paymentDisplay: paymentScreen ? paymentScreen.style.display : null,
                        receiptDisplay: receiptScreen ? receiptScreen.style.display : null,
                        activeTab: window.activeFeesTab || 'none'
                    };
                })()
                """
                res = await send_cmd(ws, "Runtime.evaluate", {"expression": check_active_js, "returnByValue": True}, msg_id=mid); mid += 1
                print("Step 2 Result after clicking Fee Online Payment:", json.dumps(res["result"]["result"].get("value"), indent=2))

            # Step 3: Now simulate real mouse click on Receipt link
            receipt_rect_js = """
            (function() {
                const rLink = document.getElementById('sublinkReceipt');
                if (!rLink) return null;
                const rect = rLink.getBoundingClientRect();
                return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
            })()
            """
            res = await send_cmd(ws, "Runtime.evaluate", {"expression": receipt_rect_js, "returnByValue": True}, msg_id=mid); mid += 1
            rr = res["result"]["result"].get("value")
            print("Receipt link rect:", rr)
            if rr and rr["width"] > 0:
                rx = rr["x"] + rr["width"] / 2
                ry = rr["y"] + rr["height"] / 2
                print(f"Clicking Receipt at ({rx}, {ry})...")
                await send_cmd(ws, "Input.dispatchMouseEvent", {"type": "mousePressed", "x": rx, "y": ry, "button": "left", "clickCount": 1}, msg_id=mid); mid += 1
                await send_cmd(ws, "Input.dispatchMouseEvent", {"type": "mouseReleased", "x": rx, "y": ry, "button": "left", "clickCount": 1}, msg_id=mid); mid += 1
                await asyncio.sleep(1.5)

                res = await send_cmd(ws, "Runtime.evaluate", {"expression": check_active_js, "returnByValue": True}, msg_id=mid); mid += 1
                print("Step 3 Result after clicking Receipt:", json.dumps(res["result"]["result"].get("value"), indent=2))

    finally:
        proc.terminate()
        try:
            proc.wait(timeout=3)
        except Exception:
            proc.kill()

if __name__ == "__main__":
    asyncio.run(main())

