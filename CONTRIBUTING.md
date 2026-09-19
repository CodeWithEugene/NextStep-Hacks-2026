# Contributing to PyroShield AI 🛡️

Thank you for your interest in contributing to **PyroShield AI**! This project was built for **NextStep Hacks 2026** (*Earth Forward*) to revolutionize tactical wildfire resilience and community evacuation safety using **TypeSafe's Jev System One model**.

We welcome contributions from developers, designers, GIS specialists, wildfire responders, and climate scientists.

---

## 📜 Code of Conduct

We are committed to providing a welcoming, inclusive, and harassment-free environment. All contributors and participants must:
* Be respectful, constructive, and empathetic in communications.
* Maintain scientific rigor and integrity when dealing with environmental, climate, and emergency life-safety algorithms.
* Refuse any features that could introduce false emergency signals, uncalibrated hallucinated advice, or security vulnerabilities.

---

## 🛠️ Development Workflow & Branching Strategy

We follow a Git workflow with conventional commits and focused PRs:

1. **Fork or Branch:**
   * Fork the repository or create a feature branch off `main`:
     ```bash
     git checkout -b feature/your-feature-name
     # or
     git checkout -b fix/your-bugfix-name
     ```

2. **Code Standards:**
   * **TypeScript:** Strict type-checking enabled (`strict: true` in `tsconfig.json`). Avoid `any` where typed interfaces exist.
   * **UI Standard:** Strictly use official **shadcn/ui** (`https://ui.shadcn.com/`) primitives and Tailwind CSS utility classes. Avoid bespoke, unstyled CSS classes.
   * **Semantic AI Standard:** When adding semantic decision logic, always use **TypeSafe Jev** (`jev-latest`) via `@typesafe-ai/sdk` (`Noul`, `Score`, `Choice`). Never fall back to conversational chat prompts for programmatic judgments.
   * **Security:** Never commit API keys (`TYPESAFE_API_KEY`, Vercel tokens). Always use `.env.local` and `.gitignore`.

3. **Conventional Commits:**
   Format commit messages using the Conventional Commits specification:
   * `feat: add live wind vector particle layer on tactical map`
   * `fix: correct USSD session parsing for nested menu options`
   * `docs: update build.md with Africa's Talking callback URL`
   * `refactor: optimize Jev corridor score probability distribution rendering`
   * `perf: reduce MapLibre re-render frequency on time slider scrub`

---

## 🧪 Testing & Verification

Before submitting a Pull Request:
1. Run local lint and type checks:
   ```bash
   pnpm lint
   pnpm tsc --noEmit
   ```
2. Test the production build:
   ```bash
   pnpm build
   ```
3. Test TypeSafe Jev API routes:
   Ensure all endpoints in `app/api/jev/*` return sub-second typed responses with valid `noul`, `score`, or `choice` values.
4. Verify mobile responsiveness on both desktop and mobile viewports (`< 768px`).

---

## 🚀 Submitting Pull Requests

1. Push your branch to GitHub:
   ```bash
   git push origin feature/your-feature-name
   ```
2. Open a Pull Request against `main`.
3. Provide a clear PR description detailing:
   * What problem this PR solves.
   * Testing steps and screenshots/screen recordings (especially for UI/GIS changes).
   * Any new environment variables or package dependencies introduced.

Thank you for helping make PyroShield AI the definitive tool for wildfire climate resilience!
