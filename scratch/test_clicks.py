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
    user_data_dir = os.path.join(ARTIFACTS_DIR, "scratch", "chrome_test_clicks")
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
        print("Headless Chrome failed to start")
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
            await send_cmd(ws, "Console.enable", msg_id=mid); mid += 1

            # Monitor console logs
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

            # Check elements
            inspect_js = """
            (function() {
                const payable = document.getElementById('sublinkPayable');
                const payment = document.getElementById('sublinkOnlinePayment');
                const receipt = document.getElementById('sublinkReceipt');
                const feesItem = document.getElementById('sidebarItemFees');
                const feesToggle = document.getElementById('feesMenuToggle');
                const feesMainContainer = document.getElementById('feesMainContainer');
                
                return {
                    hasPayable: !!payable,
                    hasPayment: !!payment,
                    hasReceipt: !!receipt,
                    feesItemExpanded: feesItem ? feesItem.classList.contains('expanded') : null,
                    feesMainContainerDisplay: feesMainContainer ? feesMainContainer.style.display : null,
                    paymentBoundingRect: payment ? payment.getBoundingClientRect() : null,
                    paymentComputedStyle: payment ? {
                        pointerEvents: window.getComputedStyle(payment).pointerEvents,
                        display: window.getComputedStyle(payment).display,
                        visibility: window.getComputedStyle(payment).visibility,
                        zIndex: window.getComputedStyle(payment).zIndex,
                        opacity: window.getComputedStyle(payment).opacity
                    } : null
                };
            })()
            """
            res = await send_cmd(ws, "Runtime.evaluate", {"expression": inspect_js, "returnByValue": True}, msg_id=mid); mid += 1
            val = res.get("result", {}).get("result", {}).get("value")
            print("Inspect before click:", json.dumps(val, indent=2))

            # Now try clicking on Fee Online Payment link
            click_js = """
            (function() {
                const payment = document.getElementById('sublinkOnlinePayment');
                if (!payment) return "payment link not found";
                try {
                    payment.click();
                    return "clicked payment link";
                } catch(e) {
                    return "error clicking: " + e.message;
                }
            })()
            """
            res = await send_cmd(ws, "Runtime.evaluate", {"expression": click_js, "returnByValue": True}, msg_id=mid); mid += 1
            print("Click result:", res.get("result", {}).get("result", {}).get("value"))

            await asyncio.sleep(1.5)

            # Check state after click
            state_js = """
            (function() {
                const payableScreen = document.getElementById('feesPayableScreen');
                const paymentScreen = document.getElementById('feesOnlinePaymentScreen');
                const receiptScreen = document.getElementById('feesReceiptsScreen');
                const feesMainContainer = document.getElementById('feesMainContainer');

                return {
                    feesMainContainerDisplay: feesMainContainer ? feesMainContainer.style.display : null,
                    payableDisplay: payableScreen ? payableScreen.style.display : null,
                    paymentDisplay: paymentScreen ? paymentScreen.style.display : null,
                    receiptDisplay: receiptScreen ? receiptScreen.style.display : null,
                    activeFeesTab: window.activeFeesTab || null
                };
            })()
            """
            res = await send_cmd(ws, "Runtime.evaluate", {"expression": state_js, "returnByValue": True}, msg_id=mid); mid += 1
            print("State after clicking payment:", json.dumps(res.get("result", {}).get("result", {}).get("value"), indent=2))

            # Now test simulated pointer/mouse click using Input.dispatchMouseEvent at the center of #sublinkOnlinePayment
            get_coord_js = """
            (function() {
                const el = document.getElementById('sublinkOnlinePayment');
                if (!el) return null;
                const r = el.getBoundingClientRect();
                return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
            })()
            """
            res = await send_cmd(ws, "Runtime.evaluate", {"expression": get_coord_js, "returnByValue": True}, msg_id=mid); mid += 1
            coords = res.get("result", {}).get("result", {}).get("value")
            print("Coords of sublinkOnlinePayment:", coords)

            if coords:
                # Check what element is at (x, y)
                cx = coords['x']
                cy = coords['y']
                hit_test_js = f"""
                (function() {{
                    const el = document.elementFromPoint({cx}, {cy});
                    return {{
                        tagName: el ? el.tagName : null,
                        id: el ? el.id : null,
                        className: el ? el.className : null,
                        outerHTML: el ? el.outerHTML.slice(0, 150) : null
                    }};
                }})()
                """
                res = await send_cmd(ws, "Runtime.evaluate", {"expression": hit_test_js, "returnByValue": True}, msg_id=mid); mid += 1
                print("Element at point:", json.dumps(res.get("result", {}).get("result", {}).get("value"), indent=2))

                # Dispatch mouse press and release
                await send_cmd(ws, "Input.dispatchMouseEvent", {"type": "mousePressed", "x": coords["x"], "y": coords["y"], "button": "left", "clickCount": 1}, msg_id=mid); mid += 1
                await send_cmd(ws, "Input.dispatchMouseEvent", {"type": "mouseReleased", "x": coords["x"], "y": coords["y"], "button": "left", "clickCount": 1}, msg_id=mid); mid += 1
                await asyncio.sleep(1.5)

                res = await send_cmd(ws, "Runtime.evaluate", {"expression": state_js, "returnByValue": True}, msg_id=mid); mid += 1
                print("State after real mouse event on payment:", json.dumps(res.get("result", {}).get("result", {}).get("value"), indent=2))

    finally:
        proc.terminate()
        try:
            proc.wait(timeout=3)
        except Exception:
            proc.kill()

if __name__ == "__main__":
    asyncio.run(main())
