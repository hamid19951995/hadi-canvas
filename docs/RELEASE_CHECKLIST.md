# Release checklist

1. CI green (test, typecheck, build, smoke)
2. `.env` production secrets set
3. HTTPS + ALLOWED_ORIGIN
4. Optional: IDENTITY_BACKEND=postgres after migrate/cutover
5. `npm run smoke:flow` against live broker
6. Backup verified
