import os
import re

base_dir = "backend/app"
routes = []

for root, dirs, files in os.walk(base_dir):
    if "routers" in root:
        for file in files:
            if file.endswith(".py") and not file.startswith("__"):
                path = os.path.join(root, file)
                with open(path, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()
                prefix_match = re.search(r'router\s*=\s*APIRouter\([^)]*prefix=[\'"]([^\'"]+)[\'"]', content)
                prefix = prefix_match.group(1) if prefix_match else ""
                matches = re.findall(r'@router\.(get|post|put|patch|delete)\(\s*[\'"]([^\'"]*)[\'"]', content)
                for method, route in matches:
                    full_route = (prefix + route) if prefix else route
                    routes.append((file, method.upper(), full_route))

print(f"Total endpoints found: {len(routes)}")
for file, method, r in sorted(routes, key=lambda x: (x[0], x[2])):
    print(f"{file:22} | {method:6} | {r}")
