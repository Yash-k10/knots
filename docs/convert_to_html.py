"""
Convert the 3 KNOTS SIH markdown docs to beautifully styled, print-ready HTML files.
Open each HTML in Chrome/Edge -> Ctrl+P -> Save as PDF
"""
import os
import re
import markdown

BASE = r"c:\Users\kanchan\OneDrive\Desktop\knots\knots\docs"

FILES = [
    ("SIH_PRESENTATION_CONTENT.md", "KNOTS — SIH 2025 Complete Presentation Guide"),
    ("TECHNICAL_DEEP_ANALYSIS.md",  "KNOTS — Full Technical Deep Analysis"),
    ("SIH_TECHNICAL_FLOWCHART.md",  "KNOTS — Technical Approach Flowchart"),
]

CSS = """
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
    --navy:   #0f3460;
    --red:    #e94560;
    --accent: #16213e;
    --bg:     #f8faff;
    --code:   #eef2ff;
    --border: #d1daf0;
    --text:   #1e293b;
    --muted:  #64748b;
}

body {
    font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
    font-size: 13.5px;
    line-height: 1.75;
    color: var(--text);
    background: white;
    max-width: 960px;
    margin: 0 auto;
    padding: 48px 56px;
}

/* ── Cover Banner ─────────────────────────────── */
.cover {
    text-align: center;
    padding: 36px 0 28px;
    border-bottom: 4px solid var(--navy);
    margin-bottom: 40px;
}
.cover h1 {
    font-size: 34px;
    color: var(--navy);
    letter-spacing: -0.5px;
    border: none; margin: 0;
}
.cover .tag {
    display: inline-block;
    margin-top: 10px;
    background: var(--red);
    color: white;
    font-size: 12px;
    font-weight: 600;
    padding: 4px 16px;
    border-radius: 20px;
    letter-spacing: 0.5px;
    text-transform: uppercase;
}

/* ── Headings ──────────────────────────────────── */
h1 {
    font-size: 22px;
    color: var(--navy);
    border-bottom: 3px solid var(--navy);
    padding-bottom: 8px;
    margin: 36px 0 14px;
    page-break-after: avoid;
}
h2 {
    font-size: 17px;
    color: var(--accent);
    border-left: 5px solid var(--red);
    padding-left: 12px;
    margin: 28px 0 10px;
    page-break-after: avoid;
}
h3 {
    font-size: 14.5px;
    color: var(--navy);
    margin: 20px 0 8px;
    font-weight: 600;
    page-break-after: avoid;
}
h4 {
    font-size: 13.5px;
    color: var(--red);
    margin: 16px 0 6px;
    font-weight: 600;
}

/* ── Body text ─────────────────────────────────── */
p { margin: 6px 0 12px; }

ul, ol { margin: 6px 0 12px 22px; }
li { margin: 4px 0; }
li > ul { margin-top: 4px; }

strong { color: var(--navy); font-weight: 600; }
em { color: var(--muted); }

/* ── Tables ────────────────────────────────────── */
table {
    width: 100%;
    border-collapse: collapse;
    margin: 14px 0 22px;
    font-size: 12.5px;
    page-break-inside: avoid;
    border: 1px solid var(--border);
    border-radius: 6px;
    overflow: hidden;
}
thead { background: var(--navy); color: white; }
th {
    padding: 10px 14px;
    text-align: left;
    font-weight: 600;
    font-size: 12px;
    letter-spacing: 0.3px;
}
td {
    padding: 8px 14px;
    border-bottom: 1px solid var(--border);
    vertical-align: top;
}
tr:last-child td { border-bottom: none; }
tr:nth-child(even) td { background: var(--bg); }
tr:hover td { background: #eff6ff; }

/* ── Code blocks ───────────────────────────────── */
pre {
    font-family: 'JetBrains Mono', 'Consolas', monospace;
    font-size: 11.5px;
    background: var(--code);
    border: 1px solid var(--border);
    border-left: 4px solid var(--navy);
    padding: 14px 18px;
    margin: 12px 0 18px;
    overflow-x: auto;
    white-space: pre-wrap;
    word-break: break-word;
    border-radius: 0 6px 6px 0;
    line-height: 1.6;
    page-break-inside: avoid;
}
code {
    font-family: 'JetBrains Mono', 'Consolas', monospace;
    font-size: 11.5px;
    background: var(--code);
    border: 1px solid var(--border);
    padding: 2px 7px;
    border-radius: 4px;
    color: #1e3a5f;
}

/* ── Blockquote ────────────────────────────────── */
blockquote {
    border-left: 4px solid var(--red);
    background: #fff5f7;
    padding: 10px 16px;
    margin: 12px 0 18px;
    border-radius: 0 6px 6px 0;
    color: var(--muted);
    font-style: italic;
}

/* ── Dividers ──────────────────────────────────── */
hr {
    border: none;
    border-top: 2px solid var(--border);
    margin: 32px 0;
}

/* ── Slide heading badge ───────────────────────── */
h1::before {
    content: '';
}

/* ── Print styles ──────────────────────────────── */
@media print {
    body { padding: 20px 28px; font-size: 12.5px; }
    .cover { padding: 20px 0 16px; }
    .cover h1 { font-size: 28px; }
    h1 { font-size: 18px; }
    h2 { font-size: 14px; }
    pre { page-break-inside: avoid; font-size: 10.5px; }
    table { page-break-inside: avoid; font-size: 11.5px; }
    h1, h2, h3 { page-break-after: avoid; }
    a { text-decoration: none; color: inherit; }
}
"""

TEMPLATE = """\
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<style>{css}</style>
</head>
<body>
<div class="cover">
  <h1>KNOTS</h1>
  <div class="tag">SIH 2025 &nbsp;|&nbsp; {title}</div>
</div>
{body}
</body>
</html>"""

md = markdown.Markdown(extensions=["tables", "fenced_code"])

for filename, title in FILES:
    src = os.path.join(BASE, filename)
    out_name = filename.replace(".md", ".html")
    out = os.path.join(BASE, out_name)

    with open(src, "r", encoding="utf-8") as f:
        text = f.read()

    # Strip mermaid blocks (they won't render in static HTML)
    text = re.sub(r"```mermaid.*?```", 
                  "> **[Diagram]** Copy the Mermaid code block from the .md file and paste into https://mermaid.live to generate the diagram image.",
                  text, flags=re.DOTALL)

    md.reset()
    html_body = md.convert(text)

    full_html = TEMPLATE.format(title=title, css=CSS, body=html_body)

    with open(out, "w", encoding="utf-8") as f:
        f.write(full_html)

    size_kb = round(os.path.getsize(out) / 1024, 1)
    print(f"[OK] {out_name}  ({size_kb} KB)")

print()
print("All 3 HTML files created in docs/")
print("HOW TO SAVE AS PDF:")
print("  1. Open each HTML file in Chrome or Edge")
print("  2. Press Ctrl+P")
print("  3. Set Destination = 'Save as PDF'")
print("  4. Set Paper size = A4, Margins = Default")
print("  5. Click Save")
