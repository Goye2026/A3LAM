# A3LAM Android Wrapper Foundation

## Scope

This directory records the Android wrapper contract for A3LAM. It is intentionally a foundation and portability boundary, not a separately implemented native product. The wrapper must load the existing A3LAM HTTPS application and reuse its public routes, backend, authentication, profile lifecycle, and search behavior.

## Proposed identity

| Item | Value |
|---|---|
| App name | A3LAM |
| Arabic name | أعلام |
| Application/package ID | `org.a3lam.app` |
| Direction | Arabic-first RTL; preserve LTR handling for future English surfaces |
| Web origin | Configure at build time; default documentation placeholder is `https://your-domain.example` |
| Transport | HTTPS only; no database connection, Admin token, password, or provider secret in the app |

## Wrapper responsibilities

The eventual Capacitor or equivalent wrapper should provide a branded splash screen, status-bar treatment, Android back navigation, external URL handling, safe keyboard behavior, screen rotation policy, deep-link routing to public `/person/[slug]` and `/categories/[slug]` paths, and a bounded offline/error state. It must not create a second authentication system or copy session secrets into native storage.

The wrapper should open only the configured HTTPS application origin. External links should use the platform browser or a controlled external-intent policy. File upload and picker behavior must remain dependent on the existing server-side storage provider and must show `REQUIRES CONFIGURATION` when that provider is absent.

## Build boundary

The current sandbox does not provide Android SDK, Gradle, or ADB, and no signing key is available. Therefore this foundation is **REQUIRES DEVICE VERIFICATION**. No APK/AAB, release signing, emulator result, or device result is claimed by this phase. A future implementation may add generated native project files after the Android toolchain and package choice are explicitly available and reproducible.

## Security boundary

The Android artifact must never contain `DATABASE_URL`, `A3LAM_ADMIN_ACCESS_TOKEN`, storage tokens, email credentials, private keys, or production secrets. The only runtime dependency is the public HTTPS application boundary. Admin routes remain protected by the existing Admin session and are not granted native bypasses.

## Verification checklist

Before an Android release, a maintainer must verify the package ID, HTTPS-only navigation, splash, back button, deep links, keyboard and rotation behavior, external URL handling, offline/error state, public user login isolation from Admin sessions, and the absence of secrets from the generated artifact. Debug builds may be assembled for testing; release signing remains `RELEASE SIGNING = NOT CONFIGURED` until an owner-managed key is supplied outside the repository.
