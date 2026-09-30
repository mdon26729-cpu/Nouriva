# Nouriva

Nouriva is a dependency-light Next.js 14 App Router MVP for gentle nutrition coaching. It keeps the existing Clerk authentication and Firebase seed system, with reusable types and business logic that can later be shared by an Expo client.

## Run locally

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Set the Clerk publishable/secret keys and Firebase client values in `.env.local`. Firebase Admin values are only needed when a signed-in user saves profile, food-log, weight, or coach data. Public routes and `next build` intentionally do not initialize Admin, so missing server credentials are reported as a runtime API error rather than a build failure.

Routes include a public landing page, Clerk `/sign-in` and `/sign-up`, plus the protected dashboard, onboarding, food library, logging, meal planner, progress, grocery list, and reports. Subscription plans and AI Coach are marked Coming Soon; all other app features remain available.

## Data and security

`seed/data.ts` remains the source of the curated food/recipe library. Run `npm run seed` after configuring Admin credentials. `firestore.rules` documents client-side isolation; server API routes additionally scope every user-owned read/write below `users/{clerkUserId}`. Never commit a service-account key.

AI Coach and subscription API routes are disabled for this release and make no OpenAI or Stripe requests. No OpenAI or Stripe credentials are required; the app's other features continue to use authenticated server routes and Firebase.

## Validation

```bash
npm run lint
npx tsc --noEmit
npm run build
```

## Android app (Capacitor)

The Android app loads the production Next.js site at `https://nouriva-sigma.vercel.app` in a Capacitor WebView. The web app uses server-rendered Next.js pages and API routes, so the Android wrapper must stay online and load the deployed site; exporting it as static files would disable authentication, APIs, and other server-backed features. `capacitor-web/index.html` is only a local asset for Capacitor sync and is not a separate app UI.

Install dependencies and sync the Android project:

```bash
npm install
npm run android:sync
```

To open the Android project in Android Studio:

```bash
npm run android:open
```

With Android Studio, the Android SDK, and JDK 21 installed, run on a connected device or emulator. In Android Studio, set **File > Settings > Build, Execution, Deployment > Build Tools > Gradle > Gradle JDK** to JDK 21:

```bash
npm run android:run
```

To build a debug APK (not an AAB), run this in PowerShell:

```powershell
Set-Location android
.\gradlew.bat assembleDebug
```

### Create a signed release App Bundle

The Android release build reads signing credentials from `android/keystore.properties`. First create an upload keystore. In Android Studio's Terminal, run `keytool` from the bundled JDK (adjust the path if Android Studio is installed elsewhere):

```powershell
& "C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe" -genkeypair -v -keystore "C:\Users\YourName\secure\nouriva-upload-key.jks" -alias nouriva-upload -keyalg RSA -keysize 2048 -validity 10000
```

Follow the prompts to set and confirm the keystore and key passwords. Store the keystore somewhere safe outside the repository, and keep a secure backup. Do not share or commit the keystore or its passwords; the Android `.gitignore` excludes both keystore files and `keystore.properties`.

Create `android/keystore.properties` with these entries:

```properties
storeFile=C:/Users/YourName/secure/nouriva-upload-key.jks
storePassword=YOUR_KEYSTORE_PASSWORD
keyAlias=YOUR_KEY_ALIAS
keyPassword=YOUR_KEY_PASSWORD
```

Save the file at `android/keystore.properties`, replacing the example values with the actual keystore path, passwords, and alias you chose. An absolute Windows path is recommended; keep the passwords private. Then, in Android Studio:

1. Open the `android` folder in the project and let Gradle sync finish.
2. Select **Build > Generate Signed Bundle / APK...**.
3. Choose **Android App Bundle** and click **Next**.
4. Select the same keystore file, enter its keystore password, key alias, and key password, then click **Next**.
5. Select the **release** build variant. Leave signature versions at their defaults unless your release requirements specify otherwise.
6. Click **Create**. Android Studio builds the signed `.aab`; the output path is shown in the build result, usually `android/app/release/app-release.aab`.

For Gradle release builds, the same `keystore.properties` file configures the release signing key. Release bundle and APK tasks fail with a clear message if the credentials or keystore file are missing. Keep the same signing key for future updates to this app.
