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
    user_data_dir = os.path.join(ARTIFACTS_DIR, "scratch", "chrome_verify_clicks")
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

            token, user = get_auth_token("312225E015")
            init_js = f"""
            localStorage.setItem('ssgmce_remember_session', 'true');
            localStorage.setItem('ssgmce_access_token', '{token}');
            localStorage.setItem('ssgmce_token', '{token}');
            localStorage.setItem('token', '{token}');
            localStorage.setItem('student_code', '312225E015');
            localStorage.setItem('ssgmce_user', JSON.stringify({json.dumps(user)}));
            """
            await send_cmd(ws, "Page.addScriptToEvaluateOnNewDocument", {"source": init_js}, msg_id=mid); mid += 1
            await send_cmd(ws, "Page.navigate", {"url": "http://localhost:8000/html/student-dashboard.html"}, msg_id=mid); mid += 1
            await asyncio.sleep(3.0)

            # Test 1: Click "Fees" toggle
            await send_cmd(ws, "Runtime.evaluate", {"expression": "document.getElementById('feesMenuToggle')?.click();"}, msg_id=mid); mid += 1
            await asyncio.sleep(0.8)

            t1_js = """
            (function() {
                return {
                    feesItemExpanded: document.getElementById('sidebarItemFees')?.classList.contains('expanded'),
                    payableVisible: document.getElementById('feesPanePayable')?.style.display === 'block',
                    payableActive: document.getElementById('sublinkPayable')?.classList.contains('active')
                };
            })()
            """
            res = await send_cmd(ws, "Runtime.evaluate", {"expression": t1_js, "returnByValue": True}, msg_id=mid); mid += 1
            t1 = res.get("result", {}).get("result", {}).get("value")
            print("Test 1 (Click Fees Toggle):", json.dumps(t1, indent=2))
            assert t1.get("feesItemExpanded") is True, "Fees menu item did not expand"
            assert t1.get("payableVisible") is True, "Payable pane is not visible"
            assert t1.get("payableActive") is True, "Payable sublink is not active"

            # Test 2: Real mouse click on "Fee Online Payment" (#sublinkOnlinePayment)
            t2_js = """
            (function() {
                const link = document.getElementById('sublinkOnlinePayment');
                if (!link) return null;
                const r = link.getBoundingClientRect();
                return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
            })()
            """
            res = await send_cmd(ws, "Runtime.evaluate", {"expression": t2_js, "returnByValue": True}, msg_id=mid); mid += 1
            coords_pay = res.get("result", {}).get("result", {}).get("value")
            print("Fee Online Payment link coords:", coords_pay)

            # Perform mouse click at coords
            await send_cmd(ws, "Input.dispatchMouseEvent", {"type": "mousePressed", "x": coords_pay["x"], "y": coords_pay["y"], "button": "left", "clickCount": 1}, msg_id=mid); mid += 1
            await send_cmd(ws, "Input.dispatchMouseEvent", {"type": "mouseReleased", "x": coords_pay["x"], "y": coords_pay["y"], "button": "left", "clickCount": 1}, msg_id=mid); mid += 1
            await asyncio.sleep(1.0)

            check_pay_js = """
            (function() {
                return {
                    activeTab: window.activeFeesTab,
                    paymentVisible: document.getElementById('feesPaneOnlinePayment')?.style.display === 'block',
                    payableVisible: document.getElementById('feesPanePayable')?.style.display === 'block',
                    receiptVisible: document.getElementById('feesPaneReceipt')?.style.display === 'block',
                    paymentLinkActive: document.getElementById('sublinkOnlinePayment')?.classList.contains('active'),
                    categoriesCount: document.querySelectorAll('.payment-cat-radio-label').length
                };
            })()
            """
            res = await send_cmd(ws, "Runtime.evaluate", {"expression": check_pay_js, "returnByValue": True}, msg_id=mid); mid += 1
            t2 = res.get("result", {}).get("result", {}).get("value")
            print("Test 2 (Click Fee Online Payment):", json.dumps(t2, indent=2))
            assert t2.get("activeTab") == "online-payment", f"Active tab is {t2.get('activeTab')}"
            assert t2.get("paymentVisible") is True, "Online Payment pane not visible"
            assert t2.get("payableVisible") is False, "Payable pane still visible"
            assert t2.get("paymentLinkActive") is True, "Payment link not marked active"
            assert t2.get("categoriesCount") == 6, "Payment categories not rendered"

            # Test 3: Real mouse click on "Receipt" (#sublinkReceipt)
            t3_js = """
            (function() {
                const link = document.getElementById('sublinkReceipt');
                if (!link) return null;
                const r = link.getBoundingClientRect();
                return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
            })()
            """
            res = await send_cmd(ws, "Runtime.evaluate", {"expression": t3_js, "returnByValue": True}, msg_id=mid); mid += 1
            coords_rcpt = res.get("result", {}).get("result", {}).get("value")
            print("Receipt link coords:", coords_rcpt)

            await send_cmd(ws, "Input.dispatchMouseEvent", {"type": "mousePressed", "x": coords_rcpt["x"], "y": coords_rcpt["y"], "button": "left", "clickCount": 1}, msg_id=mid); mid += 1
            await send_cmd(ws, "Input.dispatchMouseEvent", {"type": "mouseReleased", "x": coords_rcpt["x"], "y": coords_rcpt["y"], "button": "left", "clickCount": 1}, msg_id=mid); mid += 1
            await asyncio.sleep(1.0)

            check_rcpt_js = """
            (function() {
                return {
                    activeTab: window.activeFeesTab,
                    paymentVisible: document.getElementById('feesPaneOnlinePayment')?.style.display === 'block',
                    payableVisible: document.getElementById('feesPanePayable')?.style.display === 'block',
                    receiptVisible: document.getElementById('feesPaneReceipt')?.style.display === 'block',
                    receiptLinkActive: document.getElementById('sublinkReceipt')?.classList.contains('active'),
                    receiptRowsCount: document.querySelectorAll('#receiptsTableBody tr').length
                };
            })()
            """
            res = await send_cmd(ws, "Runtime.evaluate", {"expression": check_rcpt_js, "returnByValue": True}, msg_id=mid); mid += 1
            t3 = res.get("result", {}).get("result", {}).get("value")
            print("Test 3 (Click Receipt):", json.dumps(t3, indent=2))
            assert t3.get("activeTab") == "receipt", f"Active tab is {t3.get('activeTab')}"
            assert t3.get("receiptVisible") is True, "Receipt pane not visible"
            assert t3.get("paymentVisible") is False, "Online Payment pane still visible"
            assert t3.get("receiptLinkActive") is True, "Receipt link not marked active"
            assert t3.get("receiptRowsCount") > 0, "Receipt rows not populated"

            # Test 4: Real mouse click back to "Payable" (#sublinkPayable)
            t4_js = """
            (function() {
                const link = document.getElementById('sublinkPayable');
                if (!link) return null;
                const r = link.getBoundingClientRect();
                return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
            })()
            """
            res = await send_cmd(ws, "Runtime.evaluate", {"expression": t4_js, "returnByValue": True}, msg_id=mid); mid += 1
            coords_payb = res.get("result", {}).get("result", {}).get("value")

            await send_cmd(ws, "Input.dispatchMouseEvent", {"type": "mousePressed", "x": coords_payb["x"], "y": coords_payb["y"], "button": "left", "clickCount": 1}, msg_id=mid); mid += 1
            await send_cmd(ws, "Input.dispatchMouseEvent", {"type": "mouseReleased", "x": coords_payb["x"], "y": coords_payb["y"], "button": "left", "clickCount": 1}, msg_id=mid); mid += 1
            await asyncio.sleep(1.0)

            check_payb_js = """
            (function() {
                return {
                    activeTab: window.activeFeesTab,
                    payableVisible: document.getElementById('feesPanePayable')?.style.display === 'block',
                    paymentVisible: document.getElementById('feesPaneOnlinePayment')?.style.display === 'block',
                    receiptVisible: document.getElementById('feesPaneReceipt')?.style.display === 'block',
                    payableLinkActive: document.getElementById('sublinkPayable')?.classList.contains('active')
                };
            })()
            """
            res = await send_cmd(ws, "Runtime.evaluate", {"expression": check_payb_js, "returnByValue": True}, msg_id=mid); mid += 1
            t4 = res.get("result", {}).get("result", {}).get("value")
            print("Test 4 (Click back to Payable):", json.dumps(t4, indent=2))
            assert t4.get("activeTab") == "payable", f"Active tab is {t4.get('activeTab')}"
            assert t4.get("payableVisible") is True, "Payable pane not visible"
            assert t4.get("receiptVisible") is False, "Receipt pane still visible"
            assert t4.get("payableLinkActive") is True, "Payable link not marked active"

            print("\n=======================================================")
            print("ALL 4 SUBMENU CLICK TESTS PASSED PERFECTLY (100% SUCCESS)!")
            print("=======================================================")

    finally:
        proc.terminate()
        try:
            proc.wait(timeout=3)
        except Exception:
            proc.kill()

if __name__ == "__main__":
    asyncio.run(main())
