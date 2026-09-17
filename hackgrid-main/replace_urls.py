import os

def replace_in_file(filepath, replacements):
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        return
        
    with open(filepath, 'r') as f:
        content = f.read()
    
    for old, new in replacements:
        content = content.replace(old, new)
        
    with open(filepath, 'w') as f:
        f.write(content)

# ExportModal
replace_in_file('frontend/src/components/ExportModal.tsx', [
    ("fetch('http://127.0.0.1:8000/api/export/pdf'", "fetch(`${API_BASE}/api/export/pdf`"),
    ("import React, { useState } from 'react';", "import React, { useState } from 'react';\nimport { API_BASE } from '../config';")
])

# HistoryDrawer
replace_in_file('frontend/src/components/HistoryDrawer.tsx', [
    ("fetch('http://127.0.0.1:8000/api/runs?limit=50')", "fetch(`${API_BASE}/api/runs?limit=50`)"),
    ("import React, { useState, useEffect } from 'react';", "import React, { useState, useEffect } from 'react';\nimport { API_BASE } from '../config';")
])

# ScenarioSimulator
replace_in_file('frontend/src/components/ScenarioSimulator.tsx', [
    ("fetch('/api/simulate'", "fetch(`${API_BASE}/api/simulate`"),
    ("fetch('/api/simulate/explain'", "fetch(`${API_BASE}/api/simulate/explain`"),
    ("import type { FirebreakAnalysis } from '../types/firebreak';", "import type { FirebreakAnalysis } from '../types/firebreak';\nimport { API_BASE } from '../config';")
])

# UploadModal
replace_in_file('frontend/src/components/UploadModal.tsx', [
    ("const API_BASE = 'http://localhost:8000';", "import { API_BASE } from '../config';")
])

# TrendTab
replace_in_file('frontend/src/components/TrendTab.tsx', [
    ("const API_BASE = 'http://localhost:8000';", "import { API_BASE } from '../config';")
])

# SensitivitySimulator
replace_in_file('frontend/src/components/SensitivitySimulator.tsx', [
    ("fetch('http://127.0.0.1:8000/api/simulate-sensitivity'", "fetch(`${API_BASE}/api/simulate-sensitivity`"),
    ("import React, { useState, useEffect } from 'react';", "import React, { useState, useEffect } from 'react';\nimport { API_BASE } from '../config';")
])

print("Replacements complete!")
