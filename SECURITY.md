# Security Policy 🛡️

The **PyroShield AI** team takes safety, data privacy, and cybersecurity with the highest degree of seriousness. Because this platform is engineered for emergency disaster response, climate resilience, and public evacuation guidance, system reliability and data authenticity are life-critical.

---

## Supported Versions

Only the current main deployment branch receives active security updates and vulnerability patches.

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x (Current) | :white_check_mark: |
| < 1.0   | :x:                |

---

## Reporting a Vulnerability

If you discover a security vulnerability or critical failure mode in PyroShield AI:

1. **Do NOT disclose the issue publicly.** Do not open public GitHub issues for security vulnerabilities.
2. **Contact the Lead Maintainer Directly:**
   * Email: `contact@codewitheugene.top` or `contact@hackalphax.co`
   * Subject Line: `[SECURITY] PyroShield AI Vulnerability Report`
3. **Include Details:**
   * Exact steps to reproduce the vulnerability.
   * Affected endpoints, components, or API calls.
   * Potential impact (e.g. prompt injection, unauthorized USSD callback manipulation, denial of service, telemetry spoofing).
4. **Response Timeline:**
   * You will receive an acknowledgement within **24 hours**.
   * Critical life-safety or authentication vulnerabilities will be patched within **48 hours**.

---

## Core Security Protocols in PyroShield AI

### 1. Zero-Trust API Key Management
* The **TypeSafe AI API Key (`TYPESAFE_API_KEY`)** is strictly scoped to the server runtime (`app/api/*`).
* It is **never bundled into client JavaScript** or transmitted across browser WebSockets.
* In Vercel, the key is securely managed as an encrypted environment secret.

### 2. Africa's Talking USSD Verification & Rate Limiting
* All incoming requests to `/api/ussd` are sanitized and validated against standard GSM input patterns.
* Malicious SQL/XSS/injection strings in user-submitted spot fire reports are neutralized before storage or transmission to the Jev verification pipeline.

### 3. Protection Against Hallucinations in Life-Safety Contexts
* PyroShield AI explicitly avoids unconstrained text generation for emergency routing.
* By strictly constraining all decision-making to **TypeSafe Jev System One typed primitives (`Choice`, `Noul`, `Score`)**, the system eliminates arbitrary hallucination risks, ensuring that road closure flags and safety corridors are deterministic and calibrated.

### 4. Telemetry Integrity
* Ingested NASA FIRMS and Open-Meteo feeds are verified against range bounds (e.g. realistic wind speeds, physical coordinates, and positive Fire Radiative Power values) before updating the tactical state engine.

Thank you for helping keep PyroShield AI and its users secure!
