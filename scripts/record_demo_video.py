import os
import sys
import time
import asyncio
import subprocess
from pathlib import Path
from playwright.async_api import async_playwright

BASE_DIR = Path(__file__).resolve().parent.parent
OUTPUT_DIR = BASE_DIR / "docs" / "demo_videos"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

FFMPEG_PATH = Path(r"C:\Users\DELL\AppData\Local\ms-playwright\ffmpeg-1013\ffmpeg-win64.exe")

CURSOR_INJECTION_JS = """
(() => {
    if (document.getElementById('custom-mouse-pointer')) return;
    const cursor = document.createElement('div');
    cursor.id = 'custom-mouse-pointer';
    cursor.style.position = 'fixed';
    cursor.style.top = '0';
    cursor.style.left = '0';
    cursor.style.width = '18px';
    cursor.style.height = '18px';
    cursor.style.borderRadius = '50%';
    cursor.style.backgroundColor = 'rgba(37, 99, 235, 0.8)';
    cursor.style.border = '2px solid white';
    cursor.style.boxShadow = '0 0 12px rgba(0,0,0,0.35)';
    cursor.style.pointerEvents = 'none';
    cursor.style.zIndex = '9999999';
    cursor.style.transition = 'transform 0.08s ease-out, background-color 0.15s ease';
    cursor.style.transform = 'translate(-50%, -50%)';
    document.body.appendChild(cursor);

    window.addEventListener('mousemove', (e) => {
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';
    });

    window.addEventListener('mousedown', () => {
        cursor.style.transform = 'translate(-50%, -50%) scale(0.65)';
        cursor.style.backgroundColor = 'rgba(239, 68, 68, 0.95)';
    });

    window.addEventListener('mouseup', () => {
        cursor.style.transform = 'translate(-50%, -50%) scale(1)';
        cursor.style.backgroundColor = 'rgba(37, 99, 235, 0.8)';
    });
})();
"""

BANNER_INJECTION_JS = """
(title, subtitle) => {
    let banner = document.getElementById('demo-scene-banner');
    if (!banner) {
        banner = document.createElement('div');
        banner.id = 'demo-scene-banner';
        banner.style.position = 'fixed';
        banner.style.bottom = '28px';
        banner.style.left = '50%';
        banner.style.transform = 'translateX(-50%)';
        banner.style.padding = '12px 28px';
        banner.style.backgroundColor = 'rgba(15, 23, 42, 0.94)';
        banner.style.color = '#ffffff';
        banner.style.borderRadius = '9999px';
        banner.style.boxShadow = '0 12px 30px -4px rgba(0, 0, 0, 0.5), 0 0 1px 1px rgba(255, 255, 255, 0.15)';
        banner.style.backdropFilter = 'blur(16px)';
        banner.style.zIndex = '9999998';
        banner.style.fontFamily = 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        banner.style.display = 'flex';
        banner.style.alignItems = 'center';
        banner.style.gap = '14px';
        banner.style.pointerEvents = 'none';
        banner.style.transition = 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
        document.body.appendChild(banner);
    }
    banner.innerHTML = `
        <span style="display:inline-block; width:10px; height:10px; border-radius:50%; background-color:#38bdf8; box-shadow:0 0 10px #38bdf8;"></span>
        <span style="font-weight:700; font-size:13px; letter-spacing:0.02em; color:#f8fafc;">${title}</span>
        <span style="color:#64748b; font-size:13px;">|</span>
        <span style="font-size:12px; color:#cbd5e1; font-weight:400;">${subtitle}</span>
    `;
    banner.style.opacity = '1';
    banner.style.transform = 'translateX(-50%) translateY(0)';
}
"""

async def show_banner(page, title: str, subtitle: str):
    await page.evaluate(f"({BANNER_INJECTION_JS})({repr(title)}, {repr(subtitle)})")

async def smooth_move(page, target_x: float, target_y: float, steps: int = 15):
    await page.mouse.move(target_x, target_y, steps=steps)
    await asyncio.sleep(0.04)

async def smooth_scroll(page, y_delta: int, duration_sec: float = 1.0):
    steps = 15
    dy = y_delta / steps
    interval = duration_sec / steps
    for _ in range(steps):
        await page.mouse.wheel(0, dy)
        await asyncio.sleep(interval)

async def record():
    print("Starting Playwright walkthrough video recording...")
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=[
                "--disable-gpu",
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--window-size=1920,1080"
            ]
        )

        context = await browser.new_context(
            viewport={"width": 1920, "height": 1080},
            record_video_dir=str(OUTPUT_DIR),
            record_video_size={"width": 1920, "height": 1080}
        )

        page = await context.new_page()

        # Step 1: Open Sonic AI Dashboard
        print("Navigating to http://127.0.0.1:5173 ...")
        await page.goto("http://127.0.0.1:5173", wait_until="networkidle", timeout=30000)
        await page.evaluate(CURSOR_INJECTION_JS)
        await asyncio.sleep(1.5)

        # SCENE 1: Executive Dashboard (FinTrackr style UI)
        print("Scene 1: Executive Dashboard...")
        await show_banner(page, "SONIC.AI AR PLATFORM", "Autonomous Collections Agent & Bank Reconciliation Engine")
        await smooth_move(page, 500, 150)
        await asyncio.sleep(1.2)

        # Hover over KPI Cards
        await show_banner(page, "FINANCIAL METRICS", "Real-Time Outstanding Receivables, Overdue Invoices & Collection Velocity")
        cards = await page.query_selector_all(".bg-white.p-5.rounded-2xl")
        for card in cards[:4]:
            box = await card.bounding_box()
            if box:
                await smooth_move(page, box['x'] + box['width']/2, box['y'] + box['height']/2, steps=10)
                await asyncio.sleep(0.6)

        # Sub-filter tabs on Dashboard: Profit, Balances, Summary
        for tab_name in ['Profit', 'Balances', 'Summary']:
            btn = await page.query_selector(f"button:has-text('{tab_name}')")
            if btn:
                box = await btn.bounding_box()
                if box:
                    await smooth_move(page, box['x'] + box['width']/2, box['y'] + box['height']/2, steps=8)
                    await btn.click()
                    await asyncio.sleep(0.6)

        # Scroll to inspect Spline Profit Curve & Donut Distribution
        await show_banner(page, "CASHFLOW ANALYTICS", "Dynamic Spline Projections & Multi-Category Aging Distribution")
        await smooth_scroll(page, 420, duration_sec=1.2)
        await asyncio.sleep(1.8)
        await smooth_scroll(page, -420, duration_sec=0.8)
        await asyncio.sleep(1.0)

        # SCENE 2: Invoices Ledger (Monexa style UI)
        print("Scene 2: Invoices Ledger...")
        await show_banner(page, "INVOICES LEDGER", "Live AR Status, Overdue Color Flags & Instant Customer Reminders")
        inv_nav = await page.wait_for_selector("button:has-text('Invoices')")
        box = await inv_nav.bounding_box()
        if box:
            await smooth_move(page, box['x'] + box['width']/2, box['y'] + box['height']/2, steps=12)
            await inv_nav.click()
        await page.evaluate(CURSOR_INJECTION_JS)
        await asyncio.sleep(1.2)

        # Hover over invoice rows
        rows = await page.query_selector_all("tbody tr")
        for row in rows[:3]:
            box = await row.bounding_box()
            if box:
                await smooth_move(page, box['x'] + 250, box['y'] + box['height']/2, steps=8)
                await asyncio.sleep(0.5)

        # Filter by Overdue
        overdue_filter = await page.query_selector("button:has-text('Overdue')")
        if overdue_filter:
            box = await overdue_filter.bounding_box()
            if box:
                await smooth_move(page, box['x'] + box['width']/2, box['y'] + box['height']/2, steps=10)
                await overdue_filter.click()
                await asyncio.sleep(1.2)

        all_filter = await page.query_selector("button:has-text('All Invoices')")
        if all_filter:
            box = await all_filter.bounding_box()
            if box:
                await smooth_move(page, box['x'] + box['width']/2, box['y'] + box['height']/2, steps=10)
                await all_filter.click()
                await asyncio.sleep(1.0)

        # SCENE 3: Collections Agent & Smart Aging Buckets
        print("Scene 3: Collections Agent...")
        await show_banner(page, "COLLECTIONS AGENT", "Dynamic Aging Buckets (1-15d, 16-30d, 31-45d, 46-60d) & Auto-Escalation")
        coll_nav = await page.wait_for_selector("button:has-text('Collections Agent')")
        box = await coll_nav.bounding_box()
        if box:
            await smooth_move(page, box['x'] + box['width']/2, box['y'] + box['height']/2, steps=12)
            await coll_nav.click()
        await page.evaluate(CURSOR_INJECTION_JS)
        await asyncio.sleep(1.2)

        # Scroll through Aging Buckets
        await smooth_scroll(page, 380, duration_sec=1.0)
        await asyncio.sleep(1.5)

        # Hover over reminder button
        remind_btn = await page.query_selector("button:has-text('Dispatch'), button:has-text('Send Reminder')")
        if remind_btn:
            box = await remind_btn.bounding_box()
            if box:
                await smooth_move(page, box['x'] + box['width']/2, box['y'] + box['height']/2, steps=10)
                await asyncio.sleep(0.8)

        await smooth_scroll(page, -380, duration_sec=0.8)
        await asyncio.sleep(1.0)

        # SCENE 4: Conversations & Gemini 2.5 Flash Classification
        print("Scene 4: Conversations & Gemini AI...")
        await show_banner(page, "CONVERSATIONS & AI INBOX", "Callour Studio 3-Column UI with Live Gemini 2.5 Flash Classification")
        conv_nav = await page.wait_for_selector("button:has-text('Conversations')")
        box = await conv_nav.bounding_box()
        if box:
            await smooth_move(page, box['x'] + box['width']/2, box['y'] + box['height']/2, steps=12)
            await conv_nav.click()
        await page.evaluate(CURSOR_INJECTION_JS)
        await asyncio.sleep(1.5)

        # Click Simulate Customer Reply
        await show_banner(page, "LIVE GEMINI INBOUND SIMULATION", "Simulating Inbound Customer Dispute with Grounded Fact-Check Gate")
        sim_btn = await page.wait_for_selector("button:has-text('Simulate Customer Reply')")
        box = await sim_btn.bounding_box()
        if box:
            await smooth_move(page, box['x'] + box['width']/2, box['y'] + box['height']/2, steps=10)
            await sim_btn.click()
            await asyncio.sleep(1.2)

        # Inside modal: Click 'Inject Email'
        inject_btn = await page.wait_for_selector("button:has-text('Inject Email')")
        box = await inject_btn.bounding_box()
        if box:
            await smooth_move(page, box['x'] + box['width']/2, box['y'] + box['height']/2, steps=8)
            await inject_btn.click()
            print("Gemini classification triggered live...")
            await asyncio.sleep(4.0)

        await page.evaluate(CURSOR_INJECTION_JS)
        await show_banner(page, "AI INTENT CATEGORIZATION", "Classified as DISPUTE (3-Day SLA) -> Routed to Needs Attention")
        await asyncio.sleep(2.5)

        # SCENE 5: Needs Attention Queue (Human-in-the-Loop)
        print("Scene 5: Needs Attention Queue...")
        await show_banner(page, "HUMAN-IN-THE-LOOP DESK", "Human Authorization Gate for Disputes, Settlements & Escalations")
        rev_nav = await page.wait_for_selector("button:has-text('Needs Attention')")
        box = await rev_nav.bounding_box()
        if box:
            await smooth_move(page, box['x'] + box['width']/2, box['y'] + box['height']/2, steps=12)
            await rev_nav.click()
        await page.evaluate(CURSOR_INJECTION_JS)
        await asyncio.sleep(1.5)

        # Click Review & Dispatch Reply
        review_btn = await page.query_selector("button:has-text('Review & Dispatch Reply')")
        if review_btn:
            box = await review_btn.bounding_box()
            if box:
                await smooth_move(page, box['x'] + box['width']/2, box['y'] + box['height']/2, steps=10)
                await review_btn.click()
                await asyncio.sleep(1.5)

                await show_banner(page, "FACT VERIFICATION & DRAFT EDITING", "Reviewing Grounded AI Response with Real Invoice Data")
                # Hover over Authorize & Dispatch button
                auth_btn = await page.query_selector("button:has-text('Authorize & Dispatch')")
                if auth_btn:
                    box_a = await auth_btn.bounding_box()
                    if box_a:
                        await smooth_move(page, box_a['x'] + box_a['width']/2, box_a['y'] + box_a['height']/2, steps=10)
                        await auth_btn.click()
                        await asyncio.sleep(1.5)

        await page.evaluate(CURSOR_INJECTION_JS)
        await asyncio.sleep(1.5)

        # SCENE 6: Bank Reconciliation Engine (5-Signal Engine & 10% TDS)
        print("Scene 6: Bank Reconciliation...")
        await show_banner(page, "BANK RECONCILIATION ENGINE", "5-Signal RapidFuzz Deterministic Algorithm & 10% TDS Deduction Detection")
        recon_nav = await page.wait_for_selector("button:has-text('Bank Reconciliation')")
        box = await recon_nav.bounding_box()
        if box:
            await smooth_move(page, box['x'] + box['width']/2, box['y'] + box['height']/2, steps=12)
            await recon_nav.click()
        await page.evaluate(CURSOR_INJECTION_JS)
        await asyncio.sleep(1.5)

        # Click Load 14-Row Test Statement
        await show_banner(page, "SAMPLE STATEMENT PARSING", "Processing 14 Bank Transactions & Auto-Excluding Debit Charges")
        sample_csv_btn = await page.wait_for_selector("button:has-text('Load 14-Row Test Statement')")
        box = await sample_csv_btn.bounding_box()
        if box:
            await smooth_move(page, box['x'] + box['width']/2, box['y'] + box['height']/2, steps=10)
            await sample_csv_btn.click()
            print("Loaded sample bank statement CSV...")
            await asyncio.sleep(2.5)

        await page.evaluate(CURSOR_INJECTION_JS)

        # Inspect matches: scroll through table
        await show_banner(page, "10% TDS FORMULA VERIFIED", "Quillon Tech: ₹360,000 subtotal - 10% TDS (₹36,000) = ₹324,000 Bank Credit")
        await smooth_scroll(page, 320, duration_sec=1.0)
        await asyncio.sleep(2.0)

        # Approve match
        approve_btns = await page.query_selector_all("button:has-text('Approve (Match Invoice)')")
        if not approve_btns:
            approve_btns = await page.query_selector_all("button:has-text('Approve')")
        if approve_btns:
            box = await approve_btns[0].bounding_box()
            if box:
                await smooth_move(page, box['x'] + box['width']/2, box['y'] + box['height']/2, steps=10)
                await approve_btns[0].click()
                print("Approved reconciliation match...")
                await asyncio.sleep(2.0)

        await smooth_scroll(page, -320, duration_sec=0.8)
        await asyncio.sleep(1.5)

        # SCENE 7: Payment Ledger & Audit Trail
        print("Scene 7: Payment Ledger...")
        await show_banner(page, "PAYMENT LEDGER", "Immutable Audit Trail with Reconciled TDS Deductions & Zero Balance")
        pay_nav = await page.wait_for_selector("button:has-text('Payment Ledger')")
        box = await pay_nav.bounding_box()
        if box:
            await smooth_move(page, box['x'] + box['width']/2, box['y'] + box['height']/2, steps=12)
            await pay_nav.click()
        await page.evaluate(CURSOR_INJECTION_JS)
        await asyncio.sleep(2.5)

        # Return to Dashboard for final wrap-up
        await show_banner(page, "SONIC.AI PLATFORM COMPLETE", "Full AR Collections & Bank Reconciliation Lifecycle Verified")
        dash_nav = await page.wait_for_selector("button:has-text('Dashboard')")
        box = await dash_nav.bounding_box()
        if box:
            await smooth_move(page, box['x'] + box['width']/2, box['y'] + box['height']/2, steps=10)
            await dash_nav.click()
        await page.evaluate(CURSOR_INJECTION_JS)
        await asyncio.sleep(3.5)

        # Finish recording
        print("Closing browser context to finalize video...")
        video_path = await page.video.path()
        await page.close()
        await context.close()
        await browser.close()

        print(f"Recorded raw WebM video to: {video_path}")
        return video_path

def convert_to_mp4(webm_path: str):
    output_mp4 = OUTPUT_DIR / "sonic_ai_demo_walkthrough.mp4"
    print(f"Transcoding {webm_path} to MP4: {output_mp4} using FFmpeg...")
    cmd = [
        str(FFMPEG_PATH),
        "-y",
        "-i", webm_path,
        "-c:v", "libx264",
        "-preset", "medium",
        "-crf", "20",
        "-pix_fmt", "yuv420p",
        "-r", "30",
        str(output_mp4)
    ]
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if res.returncode == 0:
        print(f"Successfully generated MP4 demo video: {output_mp4} ({output_mp4.stat().st_size / 1024 / 1024:.2f} MB)")
        return output_mp4
    else:
        print(f"FFmpeg error: {res.stderr}")
        return None

if __name__ == "__main__":
    raw_video = asyncio.run(record())
    if raw_video and os.path.exists(raw_video):
        mp4_video = convert_to_mp4(raw_video)
        print("Done! Demo video production completed.")
