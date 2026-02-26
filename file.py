import os

STRUCTURE = {
    "app": {
        "layout.tsx": "",
        "page.tsx": "",
        "companies": {
            "page.tsx": "",
            "[id]": {
                "page.tsx": ""
            }
        },
        "lists": {
            "page.tsx": ""
        },
        "saved": {
            "page.tsx": ""
        },
        "api": {
            "enrich": {
                "route.ts": ""
            }
        }
    },
    "data": {
        "companies.json": "[]\n"
    },
    "lib": {
        "enrich.ts": "",
        "storage.ts": "",
        "types.ts": ""
    },
    "components": {
        "Sidebar.tsx": "",
        "Topbar.tsx": "",
        "CompanyTable.tsx": "",
        "EnrichmentPanel.tsx": "",
        "SignalBadge.tsx": ""
    },
    ".env.local.example": "AI_API_KEY=\n",
    "README.md": "# VC Intelligence Interface + Live Enrichment\n"
}


def create_structure(base_path, structure):
    for name, content in structure.items():
        path = os.path.join(base_path, name)

        # File
        if isinstance(content, str):
            if not os.path.exists(path):
                with open(path, "w", encoding="utf-8") as f:
                    f.write(content)
                print(f"Created file: {path}")
            else:
                print(f"Skipped existing file: {path}")

        # Directory
        elif isinstance(content, dict):
            if not os.path.exists(path):
                os.makedirs(path)
                print(f"Created directory: {path}")
            else:
                print(f"Skipped existing directory: {path}")

            create_structure(path, content)


if __name__ == "__main__":
    print("📁 Running structure check in current repository...\n")
    create_structure(".", STRUCTURE)
    print("\n✅ Structure creation complete.")