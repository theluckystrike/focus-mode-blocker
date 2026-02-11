# Section 4: CI/CD Pipeline & Build System

> **Focus Mode - Blocker v1.0.0** | Manifest V3 Chrome Extension
> Part of MD 10 — Automated Testing Suite

---

## Table of Contents

- [4.1 GitHub Actions CI/CD Workflow](#41-github-actions-cicd-workflow)
- [4.2 Manifest Validation Script](#42-manifest-validation-script)
- [4.3 CSP Validation Script](#43-csp-validation-script)
- [4.4 Version Bumping Script](#44-version-bumping-script)
- [4.5 Package.json Scripts](#45-packagejson-scripts)
- [4.6 Pre-commit Hooks](#46-pre-commit-hooks)
- [4.7 Release Process](#47-release-process)
- [4.8 Environment & Secrets Configuration](#48-environment--secrets-configuration)

---

## 4.1 GitHub Actions CI/CD Workflow

### `.github/workflows/extension-ci.yml`

```yaml
# =============================================================================
# Focus Mode - Blocker: CI/CD Pipeline
# =============================================================================
# Triggers: push to main/develop, pull requests, release tags
# Jobs: lint -> test -> build -> e2e -> security -> deploy-*
# =============================================================================

name: Focus Mode - Blocker CI/CD

on:
  push:
    branches: [main, develop]
    tags: ['v*.*.*']
  pull_request:
    branches: [main, develop]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

env:
  NODE_VERSION: '20'
  EXTENSION_NAME: 'focus-mode-blocker'
  SIZE_BUDGET_TOTAL_KB: 500
  SIZE_BUDGET_POPUP_KB: 150
  SIZE_BUDGET_BACKGROUND_KB: 100
  SIZE_BUDGET_CONTENT_KB: 50

permissions:
  contents: read

jobs:
  # ===========================================================================
  # Job 1: Lint & Static Analysis
  # ===========================================================================
  lint:
    name: Lint & Static Analysis
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run ESLint
        run: npm run lint -- --max-warnings 0

      - name: TypeScript typecheck
        run: npm run typecheck

      - name: Prettier format check
        run: npm run format:check

      - name: Check for console.log in production code
        run: |
          FOUND=$(grep -rn "console\.log" src/ --include="*.js" --include="*.ts" || true)
          if [ -n "$FOUND" ]; then
            echo "::warning::Found console.log statements in production code:"
            echo "$FOUND"
          fi

      - name: Check for TODO/FIXME markers
        run: |
          FOUND=$(grep -rn "TODO\|FIXME\|HACK\|XXX" src/ --include="*.js" --include="*.ts" || true)
          if [ -n "$FOUND" ]; then
            echo "::notice::Found TODO/FIXME markers:"
            echo "$FOUND"
          fi

  # ===========================================================================
  # Job 2: Unit & Integration Tests
  # ===========================================================================
  test:
    name: Tests & Coverage
    runs-on: ubuntu-latest
    timeout-minutes: 15
    needs: [lint]
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests with coverage
        run: npm run test:unit -- --coverage --coverageReporters=lcov --coverageReporters=text-summary

      - name: Run integration tests
        run: npm run test:integration -- --coverage --coverageReporters=lcov --coverageReporters=text-summary

      - name: Merge coverage reports
        run: |
          npx nyc merge coverage/ coverage/merged-coverage.json
          npx nyc report \
            --reporter=lcov \
            --reporter=text-summary \
            --temp-dir=coverage \
            --report-dir=coverage/merged

      - name: Check coverage thresholds
        run: npm run coverage:check

      - name: Upload coverage to Codecov
        if: github.event_name != 'pull_request' || github.event.pull_request.head.repo.full_name == github.repository
        uses: codecov/codecov-action@v4
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
          files: ./coverage/merged/lcov.info
          flags: unittests
          name: focus-mode-blocker-coverage
          fail_ci_if_error: false

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: test-results
          path: |
            coverage/
            test-results/
          retention-days: 14

  # ===========================================================================
  # Job 3: Build (Matrix — Chrome, Firefox, Edge)
  # ===========================================================================
  build:
    name: Build (${{ matrix.browser }})
    runs-on: ubuntu-latest
    timeout-minutes: 15
    needs: [lint]
    strategy:
      fail-fast: false
      matrix:
        browser: [chrome, firefox, edge]
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build for ${{ matrix.browser }}
        run: npm run build:${{ matrix.browser }}

      - name: Validate manifest (${{ matrix.browser }})
        run: node scripts/validate-manifest.js dist/${{ matrix.browser }}/manifest.json ${{ matrix.browser }}

      - name: Validate CSP
        run: node scripts/validate-csp.js dist/${{ matrix.browser }}/manifest.json

      - name: Check bundle sizes
        run: |
          echo "=== Bundle Size Report (${{ matrix.browser }}) ==="

          check_size() {
            local file="$1"
            local budget_kb="$2"
            local label="$3"

            if [ -f "$file" ]; then
              local size_bytes=$(wc -c < "$file" | tr -d ' ')
              local size_kb=$((size_bytes / 1024))
              local budget_bytes=$((budget_kb * 1024))

              if [ "$size_bytes" -gt "$budget_bytes" ]; then
                echo "::error::$label: ${size_kb}KB exceeds budget of ${budget_kb}KB"
                return 1
              else
                echo "  $label: ${size_kb}KB / ${budget_kb}KB budget"
              fi
            fi
          }

          TOTAL_SIZE=$(du -sk dist/${{ matrix.browser }}/ | cut -f1)
          echo "  Total extension size: ${TOTAL_SIZE}KB / ${{ env.SIZE_BUDGET_TOTAL_KB }}KB budget"

          if [ "$TOTAL_SIZE" -gt "${{ env.SIZE_BUDGET_TOTAL_KB }}" ]; then
            echo "::error::Total extension size ${TOTAL_SIZE}KB exceeds budget of ${{ env.SIZE_BUDGET_TOTAL_KB }}KB"
            exit 1
          fi

          check_size "dist/${{ matrix.browser }}/popup/popup.js" ${{ env.SIZE_BUDGET_POPUP_KB }} "popup.js"
          check_size "dist/${{ matrix.browser }}/background/service-worker.js" ${{ env.SIZE_BUDGET_BACKGROUND_KB }} "service-worker.js"
          check_size "dist/${{ matrix.browser }}/content/detector.js" ${{ env.SIZE_BUDGET_CONTENT_KB }} "detector.js"
          check_size "dist/${{ matrix.browser }}/content/blocker.js" ${{ env.SIZE_BUDGET_CONTENT_KB }} "blocker.js"
          check_size "dist/${{ matrix.browser }}/content/tracker.js" ${{ env.SIZE_BUDGET_CONTENT_KB }} "tracker.js"

      - name: Verify required files exist
        run: |
          echo "=== Verifying required files (${{ matrix.browser }}) ==="
          MISSING=0

          check_file() {
            if [ ! -f "$1" ]; then
              echo "::error::Missing required file: $1"
              MISSING=1
            else
              echo "  Found: $1"
            fi
          }

          check_file "dist/${{ matrix.browser }}/manifest.json"
          check_file "dist/${{ matrix.browser }}/popup/popup.html"
          check_file "dist/${{ matrix.browser }}/popup/popup.js"
          check_file "dist/${{ matrix.browser }}/background/service-worker.js"
          check_file "dist/${{ matrix.browser }}/content/detector.js"
          check_file "dist/${{ matrix.browser }}/content/blocker.js"
          check_file "dist/${{ matrix.browser }}/content/tracker.js"
          check_file "dist/${{ matrix.browser }}/content/block-page.html"
          check_file "dist/${{ matrix.browser }}/options/options.html"
          check_file "dist/${{ matrix.browser }}/assets/icons/icon-16.png"
          check_file "dist/${{ matrix.browser }}/assets/icons/icon-32.png"
          check_file "dist/${{ matrix.browser }}/assets/icons/icon-48.png"
          check_file "dist/${{ matrix.browser }}/assets/icons/icon-128.png"

          if [ "$MISSING" -eq 1 ]; then
            exit 1
          fi

      - name: Package as .zip
        run: |
          cd dist/${{ matrix.browser }}
          zip -r ../../${{ env.EXTENSION_NAME }}-${{ matrix.browser }}.zip . \
            -x "*.map" \
            -x "*.ts" \
            -x ".DS_Store" \
            -x "__MACOSX/*"
          cd ../..
          echo "Package size: $(du -h ${{ env.EXTENSION_NAME }}-${{ matrix.browser }}.zip | cut -f1)"

      - name: Upload build artifact
        uses: actions/upload-artifact@v4
        with:
          name: build-${{ matrix.browser }}
          path: ${{ env.EXTENSION_NAME }}-${{ matrix.browser }}.zip
          retention-days: 30

  # ===========================================================================
  # Job 4: E2E Tests (Playwright against Chrome build)
  # ===========================================================================
  e2e:
    name: E2E Tests
    runs-on: ubuntu-latest
    timeout-minutes: 30
    needs: [build]
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install chromium --with-deps

      - name: Download Chrome build artifact
        uses: actions/download-artifact@v4
        with:
          name: build-chrome
          path: ./artifacts

      - name: Unzip Chrome extension
        run: |
          mkdir -p dist/chrome
          unzip artifacts/${{ env.EXTENSION_NAME }}-chrome.zip -d dist/chrome/

      - name: Run E2E tests
        run: npm run test:e2e
        env:
          EXTENSION_PATH: ${{ github.workspace }}/dist/chrome
          CI: true

      - name: Upload E2E test report on failure
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: e2e-report
          path: |
            playwright-report/
            test-results/
            screenshots/
          retention-days: 14

      - name: Upload E2E trace on failure
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: e2e-traces
          path: test-results/**/trace.zip
          retention-days: 7

  # ===========================================================================
  # Job 5: Security Checks
  # ===========================================================================
  security:
    name: Security Audit
    runs-on: ubuntu-latest
    timeout-minutes: 15
    needs: [build]
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: npm audit (production dependencies)
        run: npm audit --omit=dev --audit-level=high
        continue-on-error: false

      - name: TruffleHog secret scan
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          extra_args: --only-verified

      - name: Download Chrome build for CSP check
        uses: actions/download-artifact@v4
        with:
          name: build-chrome
          path: ./artifacts

      - name: Unzip Chrome extension
        run: |
          mkdir -p dist/chrome
          unzip artifacts/${{ env.EXTENSION_NAME }}-chrome.zip -d dist/chrome/

      - name: CSP validation on built extension
        run: node scripts/validate-csp.js dist/chrome/manifest.json

      - name: Check for eval and unsafe patterns
        run: |
          echo "=== Scanning for eval() and unsafe patterns ==="
          VIOLATIONS=0

          # Check for eval()
          if grep -rn "eval(" dist/chrome/ --include="*.js" --include="*.html" | grep -v "node_modules"; then
            echo "::error::Found eval() usage in built extension"
            VIOLATIONS=1
          fi

          # Check for new Function()
          if grep -rn "new Function(" dist/chrome/ --include="*.js" | grep -v "node_modules"; then
            echo "::error::Found new Function() usage in built extension"
            VIOLATIONS=1
          fi

          # Check for innerHTML assignments with user input patterns
          if grep -rn "\.innerHTML\s*=" dist/chrome/ --include="*.js" | grep -v "node_modules"; then
            echo "::warning::Found .innerHTML usage — verify no user input is injected"
          fi

          # Check for document.write
          if grep -rn "document\.write(" dist/chrome/ --include="*.js" | grep -v "node_modules"; then
            echo "::error::Found document.write() usage"
            VIOLATIONS=1
          fi

          # Check for remote script loading
          if grep -rn "https\?://.*\.js" dist/chrome/ --include="*.html" | grep "<script"; then
            echo "::error::Found remote script loading in HTML files"
            VIOLATIONS=1
          fi

          # Check for unsafe-inline or unsafe-eval in CSP
          if grep -rn "unsafe-inline\|unsafe-eval" dist/chrome/manifest.json; then
            echo "::error::Found unsafe CSP directives in manifest"
            VIOLATIONS=1
          fi

          if [ "$VIOLATIONS" -eq 1 ]; then
            exit 1
          fi

          echo "Security scan passed."

      - name: Check extension permissions are minimal
        run: |
          echo "=== Verifying extension permissions ==="
          MANIFEST="dist/chrome/manifest.json"
          ALLOWED_PERMISSIONS='["storage","alarms","declarativeNetRequest","declarativeNetRequestWithHostAccess","activeTab","scripting","notifications","offscreen"]'

          node -e "
            const fs = require('fs');
            const manifest = JSON.parse(fs.readFileSync('$MANIFEST', 'utf8'));
            const allowed = $ALLOWED_PERMISSIONS;
            const declared = manifest.permissions || [];
            const unexpected = declared.filter(p => !allowed.includes(p));

            if (unexpected.length > 0) {
              console.error('Unexpected permissions found:', unexpected);
              process.exit(1);
            }

            console.log('All declared permissions are expected:', declared);
          "

  # ===========================================================================
  # Job 6: Deploy to Chrome Web Store (release tags only)
  # ===========================================================================
  deploy-chrome:
    name: Deploy to Chrome Web Store
    runs-on: ubuntu-latest
    timeout-minutes: 15
    needs: [test, build, e2e, security]
    if: startsWith(github.ref, 'refs/tags/v')
    environment: production-chrome
    permissions:
      contents: read
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Extract version from tag
        id: version
        run: |
          VERSION=${GITHUB_REF#refs/tags/v}
          echo "version=$VERSION" >> $GITHUB_OUTPUT
          echo "Deploying version: $VERSION"

      - name: Download Chrome build artifact
        uses: actions/download-artifact@v4
        with:
          name: build-chrome
          path: ./artifacts

      - name: Unzip and update version in manifest
        run: |
          mkdir -p dist/chrome
          unzip artifacts/${{ env.EXTENSION_NAME }}-chrome.zip -d dist/chrome/
          node scripts/update-version.js dist/chrome/manifest.json ${{ steps.version.outputs.version }}

      - name: Repackage with updated version
        run: |
          cd dist/chrome
          zip -r ../../${{ env.EXTENSION_NAME }}-chrome-${{ steps.version.outputs.version }}.zip .
          cd ../..

      - name: Get Chrome Web Store access token
        id: cws-token
        run: |
          TOKEN=$(curl -s -X POST "https://oauth2.googleapis.com/token" \
            -d "client_id=${{ secrets.CHROME_CLIENT_ID }}" \
            -d "client_secret=${{ secrets.CHROME_CLIENT_SECRET }}" \
            -d "refresh_token=${{ secrets.CHROME_REFRESH_TOKEN }}" \
            -d "grant_type=refresh_token" \
            | jq -r '.access_token')

          if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
            echo "::error::Failed to obtain Chrome Web Store access token"
            exit 1
          fi

          echo "::add-mask::$TOKEN"
          echo "token=$TOKEN" >> $GITHUB_OUTPUT

      - name: Upload to Chrome Web Store
        run: |
          RESPONSE=$(curl -s -w "\n%{http_code}" \
            -H "Authorization: Bearer ${{ steps.cws-token.outputs.token }}" \
            -H "x-goog-api-version: 2" \
            -X PUT \
            -T ${{ env.EXTENSION_NAME }}-chrome-${{ steps.version.outputs.version }}.zip \
            "https://www.googleapis.com/upload/chromewebstore/v1.1/items/${{ secrets.CHROME_EXTENSION_ID }}")

          HTTP_CODE=$(echo "$RESPONSE" | tail -1)
          BODY=$(echo "$RESPONSE" | head -n -1)

          echo "HTTP Status: $HTTP_CODE"
          echo "Response: $BODY"

          if [ "$HTTP_CODE" -ne 200 ]; then
            echo "::error::Chrome Web Store upload failed with HTTP $HTTP_CODE"
            exit 1
          fi

          UPLOAD_STATUS=$(echo "$BODY" | jq -r '.uploadState')
          if [ "$UPLOAD_STATUS" != "SUCCESS" ]; then
            echo "::error::Upload state: $UPLOAD_STATUS"
            echo "$BODY" | jq '.itemError'
            exit 1
          fi

      - name: Publish to Chrome Web Store
        run: |
          RESPONSE=$(curl -s -w "\n%{http_code}" \
            -H "Authorization: Bearer ${{ steps.cws-token.outputs.token }}" \
            -H "x-goog-api-version: 2" \
            -H "Content-Length: 0" \
            -X POST \
            "https://www.googleapis.com/chromewebstore/v1.1/items/${{ secrets.CHROME_EXTENSION_ID }}/publish")

          HTTP_CODE=$(echo "$RESPONSE" | tail -1)
          BODY=$(echo "$RESPONSE" | head -n -1)

          echo "HTTP Status: $HTTP_CODE"
          echo "Response: $BODY"

          if [ "$HTTP_CODE" -ne 200 ]; then
            echo "::error::Chrome Web Store publish failed with HTTP $HTTP_CODE"
            exit 1
          fi

          STATUS=$(echo "$BODY" | jq -r '.status[0]')
          if [ "$STATUS" != "OK" ]; then
            echo "::error::Publish status: $STATUS"
            echo "$BODY" | jq '.statusDetail'
            exit 1
          fi

          echo "Successfully published Focus Mode - Blocker v${{ steps.version.outputs.version }} to Chrome Web Store"

      - name: Notify Slack (Chrome deployment)
        if: always()
        uses: slackapi/slack-github-action@v1.27.0
        with:
          payload: |
            {
              "text": "${{ job.status == 'success' && ':white_check_mark:' || ':x:' }} Chrome Web Store deployment ${{ job.status }}: Focus Mode - Blocker v${{ steps.version.outputs.version }}",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "${{ job.status == 'success' && ':white_check_mark: *Chrome Web Store deployment succeeded*' || ':x: *Chrome Web Store deployment failed*' }}\n*Version:* v${{ steps.version.outputs.version }}\n*Commit:* `${{ github.sha }}`\n*Actor:* ${{ github.actor }}"
                  }
                }
              ]
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
          SLACK_WEBHOOK_TYPE: INCOMING_WEBHOOK

  # ===========================================================================
  # Job 7: Deploy to Firefox Add-ons (release tags only)
  # ===========================================================================
  deploy-firefox:
    name: Deploy to Firefox Add-ons
    runs-on: ubuntu-latest
    timeout-minutes: 20
    needs: [test, build, e2e, security]
    if: startsWith(github.ref, 'refs/tags/v')
    environment: production-firefox
    permissions:
      contents: read
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install web-ext
        run: npm install -g web-ext@8

      - name: Extract version from tag
        id: version
        run: |
          VERSION=${GITHUB_REF#refs/tags/v}
          echo "version=$VERSION" >> $GITHUB_OUTPUT

      - name: Download Firefox build artifact
        uses: actions/download-artifact@v4
        with:
          name: build-firefox
          path: ./artifacts

      - name: Unzip and update version
        run: |
          mkdir -p dist/firefox
          unzip artifacts/${{ env.EXTENSION_NAME }}-firefox.zip -d dist/firefox/
          node scripts/update-version.js dist/firefox/manifest.json ${{ steps.version.outputs.version }}

      - name: Validate with web-ext lint
        run: web-ext lint --source-dir dist/firefox/ --warnings-as-errors

      - name: Sign and upload to Firefox Add-ons
        run: |
          web-ext sign \
            --source-dir dist/firefox/ \
            --artifacts-dir web-ext-artifacts/ \
            --api-key=${{ secrets.FIREFOX_API_KEY }} \
            --api-secret=${{ secrets.FIREFOX_API_SECRET }} \
            --channel=listed
        env:
          WEB_EXT_API_KEY: ${{ secrets.FIREFOX_API_KEY }}
          WEB_EXT_API_SECRET: ${{ secrets.FIREFOX_API_SECRET }}

      - name: Upload signed XPI artifact
        uses: actions/upload-artifact@v4
        with:
          name: firefox-signed-xpi
          path: web-ext-artifacts/*.xpi
          retention-days: 90

      - name: Notify Slack (Firefox deployment)
        if: always()
        uses: slackapi/slack-github-action@v1.27.0
        with:
          payload: |
            {
              "text": "${{ job.status == 'success' && ':white_check_mark:' || ':x:' }} Firefox Add-ons deployment ${{ job.status }}: Focus Mode - Blocker v${{ steps.version.outputs.version }}"
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
          SLACK_WEBHOOK_TYPE: INCOMING_WEBHOOK

  # ===========================================================================
  # Job 8: Deploy to Edge Add-ons (release tags only)
  # ===========================================================================
  deploy-edge:
    name: Deploy to Edge Add-ons
    runs-on: ubuntu-latest
    timeout-minutes: 15
    needs: [test, build, e2e, security]
    if: startsWith(github.ref, 'refs/tags/v')
    environment: production-edge
    permissions:
      contents: read
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Extract version from tag
        id: version
        run: |
          VERSION=${GITHUB_REF#refs/tags/v}
          echo "version=$VERSION" >> $GITHUB_OUTPUT

      - name: Download Edge build artifact
        uses: actions/download-artifact@v4
        with:
          name: build-edge
          path: ./artifacts

      - name: Unzip and update version
        run: |
          mkdir -p dist/edge
          unzip artifacts/${{ env.EXTENSION_NAME }}-edge.zip -d dist/edge/
          node scripts/update-version.js dist/edge/manifest.json ${{ steps.version.outputs.version }}

      - name: Repackage with updated version
        run: |
          cd dist/edge
          zip -r ../../${{ env.EXTENSION_NAME }}-edge-${{ steps.version.outputs.version }}.zip .
          cd ../..

      - name: Get Edge API access token
        id: edge-token
        run: |
          TOKEN=$(curl -s -X POST "https://login.microsoftonline.com/common/oauth2/v2.0/token" \
            -H "Content-Type: application/x-www-form-urlencoded" \
            -d "client_id=${{ secrets.EDGE_CLIENT_ID }}" \
            -d "client_secret=${{ secrets.EDGE_CLIENT_SECRET }}" \
            -d "scope=https://api.addons.microsoftedge.microsoft.com/.default" \
            -d "grant_type=client_credentials" \
            | jq -r '.access_token')

          if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
            echo "::error::Failed to obtain Edge API access token"
            exit 1
          fi

          echo "::add-mask::$TOKEN"
          echo "token=$TOKEN" >> $GITHUB_OUTPUT

      - name: Upload to Edge Add-ons
        run: |
          PRODUCT_ID="${{ secrets.EDGE_PRODUCT_ID }}"

          # Upload package
          RESPONSE=$(curl -s -w "\n%{http_code}" \
            -H "Authorization: Bearer ${{ steps.edge-token.outputs.token }}" \
            -H "Content-Type: application/zip" \
            -X POST \
            --data-binary @${{ env.EXTENSION_NAME }}-edge-${{ steps.version.outputs.version }}.zip \
            "https://api.addons.microsoftedge.microsoft.com/v1/products/${PRODUCT_ID}/submissions/draft/package")

          HTTP_CODE=$(echo "$RESPONSE" | tail -1)
          BODY=$(echo "$RESPONSE" | head -n -1)

          echo "Upload HTTP Status: $HTTP_CODE"

          if [ "$HTTP_CODE" -ne 202 ] && [ "$HTTP_CODE" -ne 200 ]; then
            echo "::error::Edge Add-ons upload failed with HTTP $HTTP_CODE"
            echo "$BODY"
            exit 1
          fi

          OPERATION_ID=$(echo "$BODY" | jq -r '.operationId // empty')
          echo "operation_id=$OPERATION_ID" >> $GITHUB_OUTPUT

          # Wait for upload processing
          echo "Waiting for upload processing..."
          for i in $(seq 1 30); do
            sleep 10
            STATUS_RESPONSE=$(curl -s \
              -H "Authorization: Bearer ${{ steps.edge-token.outputs.token }}" \
              "https://api.addons.microsoftedge.microsoft.com/v1/products/${PRODUCT_ID}/submissions/draft/package/operations/${OPERATION_ID}")

            STATUS=$(echo "$STATUS_RESPONSE" | jq -r '.status')
            echo "  Attempt $i: status=$STATUS"

            if [ "$STATUS" = "Succeeded" ]; then
              echo "Upload processing completed."
              break
            elif [ "$STATUS" = "Failed" ]; then
              echo "::error::Upload processing failed"
              echo "$STATUS_RESPONSE" | jq '.errors'
              exit 1
            fi
          done

      - name: Publish Edge submission
        run: |
          PRODUCT_ID="${{ secrets.EDGE_PRODUCT_ID }}"

          RESPONSE=$(curl -s -w "\n%{http_code}" \
            -H "Authorization: Bearer ${{ steps.edge-token.outputs.token }}" \
            -H "Content-Type: application/json" \
            -X POST \
            -d '{"notes":"Automated release v${{ steps.version.outputs.version }}"}' \
            "https://api.addons.microsoftedge.microsoft.com/v1/products/${PRODUCT_ID}/submissions")

          HTTP_CODE=$(echo "$RESPONSE" | tail -1)
          BODY=$(echo "$RESPONSE" | head -n -1)

          echo "Publish HTTP Status: $HTTP_CODE"

          if [ "$HTTP_CODE" -ne 202 ] && [ "$HTTP_CODE" -ne 200 ]; then
            echo "::error::Edge Add-ons publish failed with HTTP $HTTP_CODE"
            echo "$BODY"
            exit 1
          fi

          echo "Successfully submitted Focus Mode - Blocker v${{ steps.version.outputs.version }} to Edge Add-ons"

      - name: Notify Slack (Edge deployment)
        if: always()
        uses: slackapi/slack-github-action@v1.27.0
        with:
          payload: |
            {
              "text": "${{ job.status == 'success' && ':white_check_mark:' || ':x:' }} Edge Add-ons deployment ${{ job.status }}: Focus Mode - Blocker v${{ steps.version.outputs.version }}"
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
          SLACK_WEBHOOK_TYPE: INCOMING_WEBHOOK
```

### Pipeline Dependency Graph

```
lint ─────────┬──> test ──────────┐
              │                   │
              └──> build ─┬──> e2e ──────┬──> deploy-chrome
                          │              │
                          └──> security ─┼──> deploy-firefox
                                         │
                                         └──> deploy-edge
```

---

## 4.2 Manifest Validation Script

### `scripts/validate-manifest.js`

```javascript
#!/usr/bin/env node

// =============================================================================
// Focus Mode - Blocker: Manifest Validation Script
// =============================================================================
// Usage: node scripts/validate-manifest.js <manifest-path> [browser]
// Validates manifest.json for compliance, correctness, and Focus Mode specifics.
// =============================================================================

'use strict';

const fs = require('fs');
const path = require('path');

const MANIFEST_PATH = process.argv[2] || 'manifest.json';
const TARGET_BROWSER = process.argv[3] || 'chrome';

// --- Configuration ---

const REQUIRED_FIELDS = [
  'name',
  'version',
  'manifest_version',
  'description',
  'icons',
  'action',
  'background',
  'permissions',
];

const REQUIRED_ICON_SIZES = ['16', '32', '48', '128'];

const ALLOWED_PERMISSIONS = [
  'storage',
  'alarms',
  'declarativeNetRequest',
  'declarativeNetRequestWithHostAccess',
  'activeTab',
  'scripting',
  'notifications',
  'offscreen',
];

const MV3_FORBIDDEN_KEYS = [
  'browser_action',
  'page_action',
];

const NAME_MAX_LENGTH = 45;
const DESCRIPTION_MAX_LENGTH = 132;
const VERSION_REGEX = /^\d+\.\d+\.\d+$/;

const CONTENT_SCRIPT_FILES = [
  'content/detector.js',
  'content/blocker.js',
  'content/tracker.js',
];

const UNSAFE_CSP_PATTERNS = [
  'unsafe-eval',
  'unsafe-inline',
];

// --- Validation Engine ---

class ManifestValidator {
  constructor(manifestPath, browser) {
    this.manifestPath = path.resolve(manifestPath);
    this.browser = browser;
    this.errors = [];
    this.warnings = [];
    this.manifest = null;
    this.manifestDir = path.dirname(this.manifestPath);
  }

  error(message) {
    this.errors.push(message);
    console.error(`  ERROR: ${message}`);
  }

  warn(message) {
    this.warnings.push(message);
    console.warn(`  WARN:  ${message}`);
  }

  info(message) {
    console.log(`  OK:    ${message}`);
  }

  loadManifest() {
    if (!fs.existsSync(this.manifestPath)) {
      this.error(`Manifest file not found: ${this.manifestPath}`);
      return false;
    }

    try {
      const content = fs.readFileSync(this.manifestPath, 'utf-8');
      this.manifest = JSON.parse(content);
      this.info('Manifest loaded and parsed successfully');
      return true;
    } catch (err) {
      this.error(`Failed to parse manifest: ${err.message}`);
      return false;
    }
  }

  validateRequiredFields() {
    console.log('\n--- Required Fields ---');
    for (const field of REQUIRED_FIELDS) {
      if (this.manifest[field] === undefined || this.manifest[field] === null) {
        this.error(`Missing required field: "${field}"`);
      } else {
        this.info(`Field "${field}" is present`);
      }
    }
  }

  validateManifestVersion() {
    console.log('\n--- Manifest Version ---');
    const mv = this.manifest.manifest_version;

    if (this.browser === 'firefox') {
      // Firefox may use MV2 for compatibility
      if (mv !== 2 && mv !== 3) {
        this.error(`manifest_version must be 2 or 3 for Firefox, got: ${mv}`);
      } else {
        this.info(`manifest_version: ${mv} (Firefox target)`);
      }
    } else {
      if (mv !== 3) {
        this.error(`manifest_version must be 3 for ${this.browser}, got: ${mv}`);
      } else {
        this.info(`manifest_version: 3`);
      }
    }
  }

  validateMV3Compliance() {
    console.log('\n--- MV3 Compliance ---');

    if (this.manifest.manifest_version !== 3) {
      this.info('Skipping MV3 compliance checks (manifest_version is not 3)');
      return;
    }

    // Check for MV2-only keys
    for (const key of MV3_FORBIDDEN_KEYS) {
      if (this.manifest[key] !== undefined) {
        this.error(`MV3 manifest must not contain "${key}" (MV2 only)`);
      }
    }

    // background.scripts is MV2 only
    if (this.manifest.background) {
      if (this.manifest.background.scripts) {
        this.error('MV3 manifest must not use background.scripts (use background.service_worker)');
      }
      if (this.manifest.background.persistent !== undefined) {
        this.error('MV3 manifest must not use background.persistent');
      }
      if (!this.manifest.background.service_worker && this.browser !== 'firefox') {
        this.error('MV3 manifest must define background.service_worker');
      }
    }

    this.info('MV3 compliance checks passed');
  }

  validateCSP() {
    console.log('\n--- Content Security Policy ---');
    const csp = this.manifest.content_security_policy;

    if (!csp) {
      this.info('No custom CSP defined (browser defaults apply)');
      return;
    }

    const cspString = typeof csp === 'string'
      ? csp
      : (csp.extension_pages || '') + ' ' + (csp.sandbox || '');

    for (const pattern of UNSAFE_CSP_PATTERNS) {
      if (cspString.includes(pattern)) {
        this.error(`CSP contains unsafe directive: "${pattern}"`);
      }
    }

    // Check for remote script sources
    const scriptSrcMatch = cspString.match(/script-src\s+([^;]+)/);
    if (scriptSrcMatch) {
      const sources = scriptSrcMatch[1].trim().split(/\s+/);
      for (const source of sources) {
        if (source.startsWith('http://') || source.startsWith('https://')) {
          this.error(`CSP script-src contains remote source: "${source}"`);
        }
      }
    }

    this.info('CSP validation passed');
  }

  validatePermissions() {
    console.log('\n--- Permissions ---');
    const permissions = this.manifest.permissions || [];

    for (const perm of permissions) {
      if (!ALLOWED_PERMISSIONS.includes(perm)) {
        this.error(`Unexpected permission: "${perm}"`);
      }
    }

    // Host permissions should NOT be in the permissions array
    for (const perm of permissions) {
      if (perm.includes('://') || perm === '<all_urls>') {
        this.error(`Host permission "${perm}" should be in host_permissions, not permissions`);
      }
    }

    // Check host_permissions if present
    const hostPermissions = this.manifest.host_permissions || [];
    for (const hp of hostPermissions) {
      if (!hp.includes('://') && hp !== '<all_urls>') {
        this.warn(`host_permissions entry "${hp}" does not look like a host pattern`);
      }
    }

    this.info(`Declared permissions: [${permissions.join(', ')}]`);
    if (hostPermissions.length > 0) {
      this.info(`Host permissions: [${hostPermissions.join(', ')}]`);
    }
  }

  validateVersion() {
    console.log('\n--- Version ---');
    const version = this.manifest.version;

    if (!version) {
      this.error('Version is missing');
      return;
    }

    if (!VERSION_REGEX.test(version)) {
      this.error(`Version "${version}" does not match X.Y.Z format`);
    } else {
      this.info(`Version: ${version}`);
    }
  }

  validateNameAndDescription() {
    console.log('\n--- Name & Description ---');
    const name = this.manifest.name || '';
    const description = this.manifest.description || '';

    if (name.length === 0) {
      this.error('Name is empty');
    } else if (name.length > NAME_MAX_LENGTH) {
      this.error(`Name length ${name.length} exceeds maximum of ${NAME_MAX_LENGTH} characters: "${name}"`);
    } else {
      this.info(`Name: "${name}" (${name.length}/${NAME_MAX_LENGTH} chars)`);
    }

    if (description.length === 0) {
      this.error('Description is empty');
    } else if (description.length > DESCRIPTION_MAX_LENGTH) {
      this.error(`Description length ${description.length} exceeds maximum of ${DESCRIPTION_MAX_LENGTH} characters`);
    } else {
      this.info(`Description: ${description.length}/${DESCRIPTION_MAX_LENGTH} chars`);
    }
  }

  validateIcons() {
    console.log('\n--- Icons ---');
    const icons = this.manifest.icons;

    if (!icons || typeof icons !== 'object') {
      this.error('Icons object is missing');
      return;
    }

    for (const size of REQUIRED_ICON_SIZES) {
      if (!icons[size]) {
        this.error(`Missing required icon size: ${size}px`);
      } else {
        const iconPath = path.resolve(this.manifestDir, icons[size]);
        if (!fs.existsSync(iconPath)) {
          this.error(`Icon file not found: ${icons[size]} (resolved: ${iconPath})`);
        } else {
          this.info(`Icon ${size}px: ${icons[size]}`);
        }
      }
    }
  }

  validateDeclarativeNetRequest() {
    console.log('\n--- Declarative Net Request ---');
    const dnr = this.manifest.declarative_net_request;

    if (!dnr) {
      this.warn('declarative_net_request is not defined');
      return;
    }

    if (!dnr.rule_resources || !Array.isArray(dnr.rule_resources)) {
      this.error('declarative_net_request.rule_resources must be an array');
      return;
    }

    for (const resource of dnr.rule_resources) {
      if (!resource.id || !resource.path) {
        this.error('Each rule_resource must have an "id" and "path"');
        continue;
      }

      const rulesPath = path.resolve(this.manifestDir, resource.path);
      if (!fs.existsSync(rulesPath)) {
        this.error(`Rules file not found: ${resource.path} (resolved: ${rulesPath})`);
      } else {
        this.info(`Rules file "${resource.id}": ${resource.path}`);

        // Validate rules JSON
        try {
          const rules = JSON.parse(fs.readFileSync(rulesPath, 'utf-8'));
          if (!Array.isArray(rules)) {
            this.error(`Rules file "${resource.path}" must contain a JSON array`);
          } else {
            this.info(`  Contains ${rules.length} rule(s)`);
          }
        } catch (err) {
          this.error(`Failed to parse rules file "${resource.path}": ${err.message}`);
        }
      }
    }
  }

  validateContentScripts() {
    console.log('\n--- Content Scripts ---');
    const contentScripts = this.manifest.content_scripts;

    if (!contentScripts || !Array.isArray(contentScripts)) {
      this.warn('No content_scripts defined in manifest');
      return;
    }

    for (const entry of contentScripts) {
      const jsFiles = entry.js || [];
      const cssFiles = entry.css || [];

      for (const file of [...jsFiles, ...cssFiles]) {
        const filePath = path.resolve(this.manifestDir, file);
        if (!fs.existsSync(filePath)) {
          this.error(`Content script file not found: ${file} (resolved: ${filePath})`);
        } else {
          this.info(`Content script: ${file}`);
        }
      }
    }

    // Verify expected content scripts are referenced
    for (const expected of CONTENT_SCRIPT_FILES) {
      const found = contentScripts.some(entry => {
        const jsFiles = entry.js || [];
        return jsFiles.some(f => f.includes(expected) || f.endsWith(path.basename(expected)));
      });
      if (!found) {
        this.warn(`Expected content script not found in manifest: ${expected}`);
      }
    }
  }

  validateServiceWorker() {
    console.log('\n--- Service Worker ---');

    if (this.manifest.manifest_version !== 3) {
      this.info('Skipping service worker check (MV2)');
      return;
    }

    const bg = this.manifest.background;
    if (!bg || !bg.service_worker) {
      if (this.browser !== 'firefox') {
        this.error('No service_worker defined in background');
      }
      return;
    }

    const swPath = path.resolve(this.manifestDir, bg.service_worker);
    if (!fs.existsSync(swPath)) {
      this.error(`Service worker file not found: ${bg.service_worker} (resolved: ${swPath})`);
    } else {
      this.info(`Service worker: ${bg.service_worker}`);
    }

    if (bg.type) {
      this.info(`Service worker type: ${bg.type}`);
    }
  }

  validateNoRemoteCode() {
    console.log('\n--- Remote Code Check ---');

    // Check web_accessible_resources for remote loading patterns
    const war = this.manifest.web_accessible_resources;
    if (war) {
      this.info('web_accessible_resources defined — manual review recommended');
    }

    // Check externally_connectable
    if (this.manifest.externally_connectable) {
      const ec = this.manifest.externally_connectable;
      if (ec.matches) {
        for (const match of ec.matches) {
          if (match === '<all_urls>' || match === '*://*/*') {
            this.warn(`externally_connectable has broad match pattern: "${match}"`);
          }
        }
      }
    }

    this.info('No remote code loading patterns detected in manifest');
  }

  validate() {
    console.log('=============================================================================');
    console.log(`Focus Mode - Blocker: Manifest Validation`);
    console.log(`  Manifest: ${this.manifestPath}`);
    console.log(`  Browser:  ${this.browser}`);
    console.log('=============================================================================');

    if (!this.loadManifest()) {
      return this.report();
    }

    this.validateRequiredFields();
    this.validateManifestVersion();
    this.validateMV3Compliance();
    this.validateCSP();
    this.validatePermissions();
    this.validateVersion();
    this.validateNameAndDescription();
    this.validateIcons();
    this.validateDeclarativeNetRequest();
    this.validateContentScripts();
    this.validateServiceWorker();
    this.validateNoRemoteCode();

    return this.report();
  }

  report() {
    console.log('\n=============================================================================');
    console.log('Validation Summary');
    console.log('=============================================================================');
    console.log(`  Errors:   ${this.errors.length}`);
    console.log(`  Warnings: ${this.warnings.length}`);

    if (this.errors.length > 0) {
      console.log('\nErrors:');
      this.errors.forEach((e, i) => console.log(`  ${i + 1}. ${e}`));
    }

    if (this.warnings.length > 0) {
      console.log('\nWarnings:');
      this.warnings.forEach((w, i) => console.log(`  ${i + 1}. ${w}`));
    }

    const passed = this.errors.length === 0;
    console.log(`\nResult: ${passed ? 'PASSED' : 'FAILED'}\n`);
    return passed;
  }
}

// --- Main ---

const validator = new ManifestValidator(MANIFEST_PATH, TARGET_BROWSER);
const passed = validator.validate();
process.exit(passed ? 0 : 1);
```

---

## 4.3 CSP Validation Script

### `scripts/validate-csp.js`

```javascript
#!/usr/bin/env node

// =============================================================================
// Focus Mode - Blocker: CSP Validation Script
// =============================================================================
// Usage: node scripts/validate-csp.js <manifest-path>
// Validates Content Security Policy for MV3 compliance and security.
// =============================================================================

'use strict';

const fs = require('fs');
const path = require('path');

const MANIFEST_PATH = process.argv[2] || 'manifest.json';

// --- CSP Rules ---

const FORBIDDEN_DIRECTIVES = [
  'unsafe-eval',
  'unsafe-inline',
  'unsafe-hashes',
];

const FORBIDDEN_SCHEMES = [
  'http:',
  'data:',
  'blob:',
];

const REQUIRED_OBJECT_SRC = "'none'";

class CSPValidator {
  constructor(manifestPath) {
    this.manifestPath = path.resolve(manifestPath);
    this.errors = [];
    this.warnings = [];
    this.manifest = null;
  }

  error(message) {
    this.errors.push(message);
    console.error(`  ERROR: ${message}`);
  }

  warn(message) {
    this.warnings.push(message);
    console.warn(`  WARN:  ${message}`);
  }

  info(message) {
    console.log(`  OK:    ${message}`);
  }

  loadManifest() {
    if (!fs.existsSync(this.manifestPath)) {
      this.error(`Manifest not found: ${this.manifestPath}`);
      return false;
    }

    try {
      this.manifest = JSON.parse(fs.readFileSync(this.manifestPath, 'utf-8'));
      return true;
    } catch (err) {
      this.error(`Failed to parse manifest: ${err.message}`);
      return false;
    }
  }

  parseCSPString(cspString) {
    const directives = {};

    if (!cspString) return directives;

    const parts = cspString.split(';').map(s => s.trim()).filter(Boolean);

    for (const part of parts) {
      const tokens = part.split(/\s+/);
      const name = tokens[0];
      const values = tokens.slice(1);
      directives[name] = values;
    }

    return directives;
  }

  validateDirectives(directives, label) {
    console.log(`\n--- ${label} ---`);

    if (Object.keys(directives).length === 0) {
      this.info(`No custom ${label} defined (browser defaults apply)`);
      return;
    }

    // Display parsed directives
    for (const [name, values] of Object.entries(directives)) {
      this.info(`${name}: ${values.join(' ')}`);
    }

    // Check for forbidden directives in all values
    for (const [directiveName, values] of Object.entries(directives)) {
      for (const value of values) {
        // Remove quotes for comparison
        const cleanValue = value.replace(/'/g, '');

        for (const forbidden of FORBIDDEN_DIRECTIVES) {
          if (cleanValue === forbidden) {
            this.error(`"${forbidden}" found in ${directiveName} (${label})`);
          }
        }
      }
    }

    // Check for remote sources in script-src
    const scriptSrc = directives['script-src'] || [];
    for (const source of scriptSrc) {
      // Check for http/https remote URLs
      if (/^https?:\/\//.test(source)) {
        this.error(`Remote script source found in script-src: "${source}" (${label})`);
      }

      // Check for wildcard hosts
      if (source === '*' || source.includes('*://')) {
        this.error(`Wildcard script source found: "${source}" (${label})`);
      }

      // Check for forbidden schemes
      for (const scheme of FORBIDDEN_SCHEMES) {
        if (source === scheme || source.startsWith(`${scheme}//`)) {
          this.error(`Forbidden scheme "${scheme}" in script-src (${label})`);
        }
      }
    }

    // Validate object-src
    const objectSrc = directives['object-src'];
    if (objectSrc) {
      const hasNone = objectSrc.some(v => v === "'none'" || v === 'none');
      if (!hasNone) {
        this.error(`object-src should be "'none'" but is: ${objectSrc.join(' ')} (${label})`);
      } else {
        this.info(`object-src is correctly set to 'none' (${label})`);
      }
    } else if (Object.keys(directives).length > 0) {
      this.warn(`object-src is not explicitly set — consider adding object-src 'none' (${label})`);
    }

    // Check for remote sources in style-src
    const styleSrc = directives['style-src'] || [];
    for (const source of styleSrc) {
      if (/^https?:\/\//.test(source)) {
        this.warn(`Remote style source in style-src: "${source}" (${label})`);
      }
    }

    // Check for connect-src remote endpoints
    const connectSrc = directives['connect-src'] || [];
    for (const source of connectSrc) {
      if (/^https?:\/\//.test(source)) {
        this.info(`Remote connect-src endpoint: "${source}" (${label}) — verify this is intended`);
      }
    }
  }

  validateSourceFiles() {
    console.log('\n--- Source File CSP Compliance ---');

    const manifestDir = path.dirname(this.manifestPath);
    const htmlFiles = [];

    // Find HTML files in extension
    function findHTMLFiles(dir) {
      if (!fs.existsSync(dir)) return;

      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory() && entry.name !== 'node_modules') {
          findHTMLFiles(fullPath);
        } else if (entry.name.endsWith('.html')) {
          htmlFiles.push(fullPath);
        }
      }
    }

    findHTMLFiles(manifestDir);

    for (const htmlFile of htmlFiles) {
      const content = fs.readFileSync(htmlFile, 'utf-8');
      const relativePath = path.relative(manifestDir, htmlFile);

      // Check for inline scripts
      const inlineScriptPattern = /<script(?![^>]*\bsrc=)[^>]*>[\s\S]*?<\/script>/gi;
      const inlineScripts = content.match(inlineScriptPattern);
      if (inlineScripts) {
        for (const match of inlineScripts) {
          // Allow empty script tags
          const innerContent = match.replace(/<\/?script[^>]*>/gi, '').trim();
          if (innerContent.length > 0) {
            this.error(`Inline script found in ${relativePath}`);
          }
        }
      }

      // Check for inline event handlers
      const eventHandlerPattern = /\bon\w+\s*=\s*["'][^"']*["']/gi;
      const eventHandlers = content.match(eventHandlerPattern);
      if (eventHandlers) {
        this.error(`Inline event handler(s) found in ${relativePath}: ${eventHandlers.join(', ')}`);
      }

      // Check for remote script sources
      const remoteScriptPattern = /<script[^>]+src=["'](https?:\/\/[^"']+)["']/gi;
      let remoteMatch;
      while ((remoteMatch = remoteScriptPattern.exec(content)) !== null) {
        this.error(`Remote script source in ${relativePath}: ${remoteMatch[1]}`);
      }

      // Check for javascript: protocol
      const jsProtocolPattern = /href=["']javascript:/gi;
      if (jsProtocolPattern.test(content)) {
        this.error(`javascript: protocol link found in ${relativePath}`);
      }

      this.info(`Scanned: ${relativePath}`);
    }
  }

  validate() {
    console.log('=============================================================================');
    console.log('Focus Mode - Blocker: CSP Validation');
    console.log(`  Manifest: ${this.manifestPath}`);
    console.log('=============================================================================');

    if (!this.loadManifest()) {
      return this.report();
    }

    const csp = this.manifest.content_security_policy;
    const mv = this.manifest.manifest_version;

    if (mv === 3) {
      // MV3: CSP is an object with extension_pages and optional sandbox
      if (typeof csp === 'string') {
        this.error('MV3 content_security_policy must be an object, not a string');
        const directives = this.parseCSPString(csp);
        this.validateDirectives(directives, 'CSP (parsed as string)');
      } else if (csp && typeof csp === 'object') {
        // Validate extension_pages CSP
        const extensionPages = this.parseCSPString(csp.extension_pages || '');
        this.validateDirectives(extensionPages, 'extension_pages CSP');

        // Validate sandbox CSP
        if (csp.sandbox) {
          const sandbox = this.parseCSPString(csp.sandbox);
          this.validateDirectives(sandbox, 'sandbox CSP');
        }
      } else {
        this.info('No custom CSP defined — browser defaults apply');
        this.info('Default MV3 CSP: script-src \'self\'; object-src \'self\'');
      }
    } else if (mv === 2) {
      // MV2: CSP is a string
      if (typeof csp === 'string') {
        const directives = this.parseCSPString(csp);
        this.validateDirectives(directives, 'MV2 CSP');
      } else if (csp) {
        this.warn('MV2 content_security_policy should be a string');
      }
    }

    // Validate HTML files for CSP compliance
    this.validateSourceFiles();

    return this.report();
  }

  report() {
    console.log('\n=============================================================================');
    console.log('CSP Validation Summary');
    console.log('=============================================================================');
    console.log(`  Errors:   ${this.errors.length}`);
    console.log(`  Warnings: ${this.warnings.length}`);

    if (this.errors.length > 0) {
      console.log('\nErrors:');
      this.errors.forEach((e, i) => console.log(`  ${i + 1}. ${e}`));
    }

    if (this.warnings.length > 0) {
      console.log('\nWarnings:');
      this.warnings.forEach((w, i) => console.log(`  ${i + 1}. ${w}`));
    }

    const passed = this.errors.length === 0;
    console.log(`\nResult: ${passed ? 'PASSED' : 'FAILED'}\n`);
    return passed;
  }
}

// --- Main ---

const validator = new CSPValidator(MANIFEST_PATH);
const passed = validator.validate();
process.exit(passed ? 0 : 1);
```

---

## 4.4 Version Bumping Script

### `scripts/update-version.js`

```javascript
#!/usr/bin/env node

// =============================================================================
// Focus Mode - Blocker: Version Update Script
// =============================================================================
// Usage:
//   node scripts/update-version.js <manifest-path> <version>
//   node scripts/update-version.js <manifest-path> patch|minor|major
//
// Examples:
//   node scripts/update-version.js manifest.json 1.2.3
//   node scripts/update-version.js manifest.json patch
//   node scripts/update-version.js dist/chrome/manifest.json 2.0.0
// =============================================================================

'use strict';

const fs = require('fs');
const path = require('path');

const MANIFEST_PATH = process.argv[2];
const VERSION_INPUT = process.argv[3];
const SEMVER_REGEX = /^(\d+)\.(\d+)\.(\d+)$/;

// --- Helpers ---

function usage() {
  console.log('Usage: node scripts/update-version.js <manifest-path> <version|patch|minor|major>');
  console.log('');
  console.log('Examples:');
  console.log('  node scripts/update-version.js manifest.json 1.2.3');
  console.log('  node scripts/update-version.js manifest.json patch');
  console.log('  node scripts/update-version.js manifest.json minor');
  console.log('  node scripts/update-version.js manifest.json major');
  process.exit(1);
}

function parseSemver(version) {
  const match = version.match(SEMVER_REGEX);
  if (!match) return null;
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
  };
}

function bumpVersion(currentVersion, bumpType) {
  const parsed = parseSemver(currentVersion);
  if (!parsed) {
    console.error(`Cannot parse current version: "${currentVersion}"`);
    process.exit(1);
  }

  switch (bumpType) {
    case 'patch':
      parsed.patch += 1;
      break;
    case 'minor':
      parsed.minor += 1;
      parsed.patch = 0;
      break;
    case 'major':
      parsed.major += 1;
      parsed.minor = 0;
      parsed.patch = 0;
      break;
    default:
      console.error(`Invalid bump type: "${bumpType}"`);
      process.exit(1);
  }

  return `${parsed.major}.${parsed.minor}.${parsed.patch}`;
}

// --- Main ---

if (!MANIFEST_PATH || !VERSION_INPUT) {
  usage();
}

const resolvedPath = path.resolve(MANIFEST_PATH);

if (!fs.existsSync(resolvedPath)) {
  console.error(`Manifest not found: ${resolvedPath}`);
  process.exit(1);
}

let manifest;
try {
  const content = fs.readFileSync(resolvedPath, 'utf-8');
  manifest = JSON.parse(content);
} catch (err) {
  console.error(`Failed to parse manifest: ${err.message}`);
  process.exit(1);
}

const currentVersion = manifest.version || '0.0.0';
let newVersion;

if (['patch', 'minor', 'major'].includes(VERSION_INPUT)) {
  newVersion = bumpVersion(currentVersion, VERSION_INPUT);
} else if (SEMVER_REGEX.test(VERSION_INPUT)) {
  newVersion = VERSION_INPUT;
} else {
  console.error(`Invalid version input: "${VERSION_INPUT}"`);
  console.error('Must be a semver string (X.Y.Z) or bump type (patch, minor, major)');
  process.exit(1);
}

// Validate the new version
if (!parseSemver(newVersion)) {
  console.error(`Invalid version format: "${newVersion}"`);
  process.exit(1);
}

// Update manifest
manifest.version = newVersion;

try {
  fs.writeFileSync(resolvedPath, JSON.stringify(manifest, null, 2) + '\n', 'utf-8');
} catch (err) {
  console.error(`Failed to write manifest: ${err.message}`);
  process.exit(1);
}

console.log(`Version updated: ${currentVersion} -> ${newVersion}`);
console.log(`  File: ${resolvedPath}`);

// Also update package.json if it exists in the same directory or project root
const packageJsonPaths = [
  path.join(path.dirname(resolvedPath), 'package.json'),
  path.join(process.cwd(), 'package.json'),
];

for (const pkgPath of packageJsonPaths) {
  if (fs.existsSync(pkgPath)) {
    try {
      const pkgContent = fs.readFileSync(pkgPath, 'utf-8');
      const pkg = JSON.parse(pkgContent);
      const oldPkgVersion = pkg.version;
      pkg.version = newVersion;
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8');
      console.log(`  package.json updated: ${oldPkgVersion} -> ${newVersion} (${pkgPath})`);
    } catch (err) {
      console.warn(`  Warning: Could not update ${pkgPath}: ${err.message}`);
    }
    break; // Only update the first found package.json
  }
}

process.exit(0);
```

---

## 4.5 Package.json Scripts

Add the following `scripts` section to the project's `package.json`:

```jsonc
{
  "name": "focus-mode-blocker",
  "version": "1.0.0",
  "private": true,
  "description": "Focus Mode - Blocker: Website Blocker & Focus Timer",
  "scripts": {
    // -----------------------------------------------------------------------
    // Development
    // -----------------------------------------------------------------------
    "dev": "npm run build:chrome -- --watch",
    "dev:firefox": "npm run build:firefox -- --watch",

    // -----------------------------------------------------------------------
    // Build
    // -----------------------------------------------------------------------
    "build": "npm run build:chrome",
    "build:chrome": "node scripts/build.js --browser=chrome --mode=production",
    "build:firefox": "node scripts/build.js --browser=firefox --mode=production",
    "build:edge": "node scripts/build.js --browser=edge --mode=production",
    "build:all": "npm run build:chrome && npm run build:firefox && npm run build:edge",
    "build:dev": "node scripts/build.js --browser=chrome --mode=development",

    // -----------------------------------------------------------------------
    // Lint & Formatting
    // -----------------------------------------------------------------------
    "lint": "eslint src/ tests/ scripts/ --ext .js,.ts",
    "lint:fix": "eslint src/ tests/ scripts/ --ext .js,.ts --fix",
    "typecheck": "tsc --noEmit",
    "format": "prettier --write 'src/**/*.{js,ts,html,css,json}' 'tests/**/*.{js,ts}' 'scripts/**/*.js'",
    "format:check": "prettier --check 'src/**/*.{js,ts,html,css,json}' 'tests/**/*.{js,ts}' 'scripts/**/*.js'",

    // -----------------------------------------------------------------------
    // Testing
    // -----------------------------------------------------------------------
    "test": "jest",
    "test:unit": "jest --testPathPattern='tests/unit'",
    "test:integration": "jest --testPathPattern='tests/integration'",
    "test:e2e": "playwright test --config=playwright.config.js",
    "test:e2e:headed": "playwright test --config=playwright.config.js --headed",
    "test:e2e:debug": "playwright test --config=playwright.config.js --debug",
    "test:performance": "jest --testPathPattern='tests/performance' --testTimeout=60000",
    "test:watch": "jest --watch",
    "test:ci": "jest --ci --coverage --maxWorkers=2 --coverageReporters=lcov --coverageReporters=text-summary",

    // -----------------------------------------------------------------------
    // Coverage
    // -----------------------------------------------------------------------
    "coverage": "jest --coverage",
    "coverage:check": "jest --coverage --coverageThreshold='{\"global\":{\"branches\":80,\"functions\":80,\"lines\":80,\"statements\":80}}'",
    "coverage:report": "jest --coverage --coverageReporters=html && open coverage/index.html",
    "coverage:badge": "jest --coverage --coverageReporters=json-summary && node scripts/generate-coverage-badge.js",

    // -----------------------------------------------------------------------
    // Validation
    // -----------------------------------------------------------------------
    "validate": "npm run validate:manifest && npm run validate:csp",
    "validate:manifest": "node scripts/validate-manifest.js manifest.json chrome",
    "validate:manifest:firefox": "node scripts/validate-manifest.js manifest.json firefox",
    "validate:csp": "node scripts/validate-csp.js manifest.json",

    // -----------------------------------------------------------------------
    // Packaging
    // -----------------------------------------------------------------------
    "package": "npm run package:chrome",
    "package:chrome": "npm run build:chrome && cd dist/chrome && zip -r ../../focus-mode-blocker-chrome.zip . -x '*.map' '*.ts' '.DS_Store'",
    "package:firefox": "npm run build:firefox && web-ext build --source-dir=dist/firefox --artifacts-dir=web-ext-artifacts --overwrite-dest",
    "package:edge": "npm run build:edge && cd dist/edge && zip -r ../../focus-mode-blocker-edge.zip . -x '*.map' '*.ts' '.DS_Store'",
    "package:all": "npm run package:chrome && npm run package:firefox && npm run package:edge",

    // -----------------------------------------------------------------------
    // Version & Release
    // -----------------------------------------------------------------------
    "version:patch": "node scripts/update-version.js manifest.json patch",
    "version:minor": "node scripts/update-version.js manifest.json minor",
    "version:major": "node scripts/update-version.js manifest.json major",

    "release": "npm run lint && npm run typecheck && npm run test:ci && npm run validate && npm run build:all && npm run package:all",
    "release:patch": "npm run version:patch && npm run release",
    "release:minor": "npm run version:minor && npm run release",
    "release:major": "npm run version:major && npm run release",

    // -----------------------------------------------------------------------
    // Utilities
    // -----------------------------------------------------------------------
    "clean": "rm -rf dist/ coverage/ test-results/ playwright-report/ web-ext-artifacts/ *.zip",
    "prepare": "husky",
    "precommit": "lint-staged"
  }
}
```

---

## 4.6 Pre-commit Hooks

### Husky + lint-staged Configuration

#### `.husky/pre-commit`

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "=== Focus Mode - Blocker: Pre-commit Checks ==="

# 1. Run lint-staged (ESLint + Prettier on staged files)
echo "[1/4] Linting staged files..."
npx lint-staged
if [ $? -ne 0 ]; then
  echo "Lint-staged failed. Please fix the issues above."
  exit 1
fi

# 2. TypeScript type check
echo "[2/4] Running TypeScript type check..."
npx tsc --noEmit
if [ $? -ne 0 ]; then
  echo "TypeScript type check failed. Please fix type errors."
  exit 1
fi

# 3. Run related unit tests with coverage
echo "[3/4] Running related tests..."
npx jest --bail --findRelatedTests $(git diff --cached --name-only --diff-filter=ACMR | grep -E '\.(js|ts)$' | tr '\n' ' ') --coverage --coverageThreshold='{"global":{"branches":80,"functions":80,"lines":80,"statements":80}}' --passWithNoTests
if [ $? -ne 0 ]; then
  echo "Tests failed or coverage threshold not met."
  exit 1
fi

# 4. Validate manifest
echo "[4/4] Validating manifest..."
node scripts/validate-manifest.js manifest.json chrome
if [ $? -ne 0 ]; then
  echo "Manifest validation failed."
  exit 1
fi

echo "=== All pre-commit checks passed ==="
```

#### `lint-staged` configuration in `package.json`

```jsonc
{
  "lint-staged": {
    "src/**/*.{js,ts}": [
      "eslint --fix --max-warnings 0",
      "prettier --write"
    ],
    "src/**/*.{html,css,json}": [
      "prettier --write"
    ],
    "manifest.json": [
      "node scripts/validate-manifest.js manifest.json chrome"
    ],
    "tests/**/*.{js,ts}": [
      "eslint --fix --max-warnings 0",
      "prettier --write"
    ]
  }
}
```

#### `.husky/commit-msg`

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Enforce conventional commit messages
COMMIT_MSG=$(cat "$1")

# Pattern: type(optional-scope): description
PATTERN="^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\(.+\))?!?: .{1,100}$"

if ! echo "$COMMIT_MSG" | head -1 | grep -qE "$PATTERN"; then
  echo ""
  echo "ERROR: Invalid commit message format."
  echo ""
  echo "The first line must match: type(scope): description"
  echo ""
  echo "Allowed types:"
  echo "  feat     - A new feature"
  echo "  fix      - A bug fix"
  echo "  docs     - Documentation only changes"
  echo "  style    - Code style changes (formatting, semicolons, etc.)"
  echo "  refactor - Code change that neither fixes a bug nor adds a feature"
  echo "  perf     - Performance improvement"
  echo "  test     - Adding or modifying tests"
  echo "  build    - Build system or external dependency changes"
  echo "  ci       - CI configuration changes"
  echo "  chore    - Other changes that don't modify src or test files"
  echo "  revert   - Reverts a previous commit"
  echo ""
  echo "Examples:"
  echo "  feat(blocker): add scheduled blocking feature"
  echo "  fix(popup): resolve timer display issue"
  echo "  test: add unit tests for detector module"
  echo ""
  echo "Your message: $COMMIT_MSG"
  exit 1
fi
```

---

## 4.7 Release Process

### Step-by-Step Release Workflow

#### Overview

```
Version Bump --> Tests --> Build --> Package --> Tag --> GitHub Release --> Store Deployments --> Monitor
```

---

### Step 1: Version Bump

Choose the appropriate bump level:

```bash
# Patch release (1.0.0 -> 1.0.1): bug fixes, minor tweaks
npm run version:patch

# Minor release (1.0.0 -> 1.1.0): new features, non-breaking changes
npm run version:minor

# Major release (1.0.0 -> 2.0.0): breaking changes
npm run version:major
```

This updates both `manifest.json` and `package.json`.

---

### Step 2: Changelog Generation

Use `conventional-changelog` to auto-generate changelog entries:

```bash
# Generate changelog from conventional commits
npx conventional-changelog -p angular -i CHANGELOG.md -s -r 0
```

Alternatively, use the release script:

```bash
# scripts/generate-changelog.js
```

```javascript
#!/usr/bin/env node

'use strict';

const { execSync } = require('child_process');
const fs = require('fs');

const version = JSON.parse(fs.readFileSync('manifest.json', 'utf-8')).version;
const date = new Date().toISOString().split('T')[0];

// Get commits since last tag
let lastTag;
try {
  lastTag = execSync('git describe --tags --abbrev=0 2>/dev/null', { encoding: 'utf-8' }).trim();
} catch {
  lastTag = '';
}

const range = lastTag ? `${lastTag}..HEAD` : 'HEAD';
const log = execSync(`git log ${range} --oneline --no-merges`, { encoding: 'utf-8' }).trim();

const categories = {
  feat: { title: 'Features', items: [] },
  fix: { title: 'Bug Fixes', items: [] },
  perf: { title: 'Performance', items: [] },
  refactor: { title: 'Refactoring', items: [] },
  docs: { title: 'Documentation', items: [] },
  test: { title: 'Tests', items: [] },
  chore: { title: 'Chores', items: [] },
  other: { title: 'Other Changes', items: [] },
};

for (const line of log.split('\n').filter(Boolean)) {
  const match = line.match(/^([a-f0-9]+)\s+(feat|fix|perf|refactor|docs|test|chore|ci|build|style|revert)(?:\(([^)]+)\))?!?:\s+(.+)$/);

  if (match) {
    const [, hash, type, scope, message] = match;
    const category = categories[type] || categories.other;
    const scopeStr = scope ? `**${scope}:** ` : '';
    category.items.push(`- ${scopeStr}${message} (\`${hash}\`)`);
  } else {
    const hash = line.substring(0, 7);
    const message = line.substring(8);
    categories.other.items.push(`- ${message} (\`${hash}\`)`);
  }
}

let changelog = `## [${version}] - ${date}\n\n`;

for (const category of Object.values(categories)) {
  if (category.items.length > 0) {
    changelog += `### ${category.title}\n\n`;
    changelog += category.items.join('\n') + '\n\n';
  }
}

// Prepend to CHANGELOG.md
const changelogPath = 'CHANGELOG.md';
let existing = '';
if (fs.existsSync(changelogPath)) {
  existing = fs.readFileSync(changelogPath, 'utf-8');
}

const header = '# Changelog\n\nAll notable changes to Focus Mode - Blocker will be documented in this file.\n\n';
const content = existing.startsWith('# Changelog')
  ? existing.replace('# Changelog\n\nAll notable changes to Focus Mode - Blocker will be documented in this file.\n\n', '')
  : existing;

fs.writeFileSync(changelogPath, header + changelog + content, 'utf-8');

console.log(`Changelog updated for v${version}`);
console.log(changelog);
```

---

### Step 3: Git Tag

```bash
# Stage version changes and changelog
git add manifest.json package.json CHANGELOG.md

# Commit
git commit -m "chore(release): v$(node -p "require('./package.json').version")"

# Create annotated tag
VERSION=$(node -p "require('./package.json').version")
git tag -a "v${VERSION}" -m "Release v${VERSION}"
```

---

### Step 4: GitHub Release Creation

```bash
# Push commit and tag
git push origin main
git push origin "v${VERSION}"

# Create GitHub release
VERSION=$(node -p "require('./package.json').version")
gh release create "v${VERSION}" \
  --title "Focus Mode - Blocker v${VERSION}" \
  --notes-file CHANGELOG.md \
  focus-mode-blocker-chrome.zip \
  focus-mode-blocker-edge.zip \
  web-ext-artifacts/*.xpi
```

Alternatively, use the automated workflow. Pushing a `v*.*.*` tag triggers the CI/CD pipeline which handles Steps 5-6 automatically.

---

### Step 5: Automated Store Deployment

Triggered automatically by the GitHub Actions workflow (Section 4.1) when a `v*.*.*` tag is pushed:

| Store | Job | Mechanism |
|-------|-----|-----------|
| Chrome Web Store | `deploy-chrome` | Chrome Web Store API (upload + publish) |
| Firefox Add-ons | `deploy-firefox` | `web-ext sign` (auto-submits to AMO) |
| Edge Add-ons | `deploy-edge` | Edge Add-ons API (upload + submit) |

Each deployment job runs only after `test`, `build`, `e2e`, and `security` pass.

---

### Step 6: Post-Release Monitoring Checklist

After deployment, verify the following:

```markdown
## Post-Release Checklist — v{VERSION}

### Immediate (within 1 hour)
- [ ] GitHub Actions CI/CD pipeline completed successfully
- [ ] All three deployment jobs (chrome, firefox, edge) succeeded
- [ ] Slack notifications received for all deployments
- [ ] GitHub Release page has correct artifacts attached
- [ ] CHANGELOG.md is accurate and up to date

### Chrome Web Store (within 24-72 hours)
- [ ] Extension status is "Published" in CWS Developer Dashboard
- [ ] New version is live on the Chrome Web Store listing
- [ ] CWS listing screenshots and description are current
- [ ] No rejection emails received from CWS review team
- [ ] Install and verify basic functionality on a fresh Chrome profile

### Firefox Add-ons (within 24-48 hours)
- [ ] Extension status shows new version on AMO Developer Hub
- [ ] Signed XPI is available
- [ ] Install and verify basic functionality on Firefox
- [ ] No review issues flagged

### Edge Add-ons (within 48-96 hours)
- [ ] Submission status is "Published" in Edge Partner Center
- [ ] New version is live on Edge Add-ons store
- [ ] Install and verify basic functionality on Edge

### Functional Verification (all browsers)
- [ ] Extension installs without errors
- [ ] Popup opens and displays correctly
- [ ] Focus timer starts and counts down
- [ ] Website blocking activates during focus sessions
- [ ] Block page displays when visiting blocked sites
- [ ] Notifications fire at session boundaries
- [ ] Options page loads and saves settings
- [ ] Sound effects play (if enabled)
- [ ] Icon state changes (default/active/disabled) work correctly
- [ ] Storage sync between popup and options works

### Monitoring (48 hours post-release)
- [ ] No crash reports in Chrome Web Store Developer Dashboard
- [ ] No spike in user uninstalls
- [ ] User ratings remain stable
- [ ] No new 1-star reviews citing bugs
- [ ] Error tracking (if configured) shows no new error patterns
- [ ] Support channels checked for user-reported issues

### Rollback Plan
If critical issues are discovered:
1. Pull the release from stores (CWS: unpublish, Firefox: disable version)
2. Revert the git tag: `git push --delete origin v{VERSION} && git tag -d v{VERSION}`
3. Fix the issue on a hotfix branch
4. Create new patch release (e.g., v1.0.1 -> v1.0.2)
```

---

### Complete Release Script

For convenience, a single script that orchestrates the full release:

```bash
#!/usr/bin/env bash

# scripts/release.sh
# Usage: ./scripts/release.sh [patch|minor|major]

set -euo pipefail

BUMP_TYPE="${1:-patch}"
echo "=== Focus Mode - Blocker Release (${BUMP_TYPE}) ==="

# Ensure clean working directory
if [ -n "$(git status --porcelain)" ]; then
  echo "ERROR: Working directory is not clean. Commit or stash changes first."
  exit 1
fi

# Ensure on main branch
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$BRANCH" != "main" ]; then
  echo "ERROR: Must be on main branch to release. Currently on: $BRANCH"
  exit 1
fi

# Pull latest
echo "[1/8] Pulling latest from origin..."
git pull origin main

# Bump version
echo "[2/8] Bumping version (${BUMP_TYPE})..."
node scripts/update-version.js manifest.json "$BUMP_TYPE"
VERSION=$(node -p "require('./package.json').version")
echo "  New version: ${VERSION}"

# Run full test suite
echo "[3/8] Running full test suite..."
npm run lint
npm run typecheck
npm run test:ci

# Validate
echo "[4/8] Validating manifest and CSP..."
npm run validate

# Build all targets
echo "[5/8] Building for all browsers..."
npm run build:all

# Package
echo "[6/8] Packaging..."
npm run package:all

# Generate changelog
echo "[7/8] Generating changelog..."
node scripts/generate-changelog.js

# Git operations
echo "[8/8] Creating commit, tag, and pushing..."
git add manifest.json package.json CHANGELOG.md
git commit -m "chore(release): v${VERSION}"
git tag -a "v${VERSION}" -m "Release v${VERSION}"
git push origin main
git push origin "v${VERSION}"

echo ""
echo "=== Release v${VERSION} pushed ==="
echo "GitHub Actions will now handle store deployments."
echo "Monitor: https://github.com/theluckystrike/focus-mode-blocker/actions"
echo ""
echo "To create a GitHub Release manually:"
echo "  gh release create v${VERSION} --title \"Focus Mode - Blocker v${VERSION}\" --generate-notes focus-mode-blocker-chrome.zip focus-mode-blocker-edge.zip web-ext-artifacts/*.xpi"
```

---

## 4.8 Environment & Secrets Configuration

### Required GitHub Repository Secrets

Configure these in **Settings > Secrets and variables > Actions** for the `theluckystrike/focus-mode-blocker` repository.

#### Chrome Web Store Secrets

| Secret Name | Description | How to Obtain |
|---|---|---|
| `CHROME_EXTENSION_ID` | The Chrome extension's unique ID (32-char string from CWS URL) | CWS Developer Dashboard > Your extension > URL contains the ID |
| `CHROME_CLIENT_ID` | Google OAuth2 client ID for CWS API access | Google Cloud Console > APIs & Services > Credentials > Create OAuth2 Client ID |
| `CHROME_CLIENT_SECRET` | Google OAuth2 client secret | Created alongside the Client ID |
| `CHROME_REFRESH_TOKEN` | Long-lived refresh token for automated access | Use the OAuth2 flow with the Chrome Web Store API scope: `https://www.googleapis.com/auth/chromewebstore` |

**Setup steps for Chrome Web Store API:**

```bash
# 1. Enable Chrome Web Store API in Google Cloud Console
#    https://console.cloud.google.com/apis/library/chromewebstore.googleapis.com

# 2. Create OAuth2 credentials (Desktop application type)

# 3. Generate authorization code
CLIENT_ID="your-client-id"
open "https://accounts.google.com/o/oauth2/auth?response_type=code&scope=https://www.googleapis.com/auth/chromewebstore&client_id=${CLIENT_ID}&redirect_uri=urn:ietf:wg:oauth:2.0:oob"

# 4. Exchange authorization code for refresh token
AUTH_CODE="code-from-step-3"
CLIENT_SECRET="your-client-secret"
curl -s -X POST "https://oauth2.googleapis.com/token" \
  -d "client_id=${CLIENT_ID}" \
  -d "client_secret=${CLIENT_SECRET}" \
  -d "code=${AUTH_CODE}" \
  -d "grant_type=authorization_code" \
  -d "redirect_uri=urn:ietf:wg:oauth:2.0:oob"

# Response contains refresh_token — save this as CHROME_REFRESH_TOKEN
```

---

#### Firefox Add-ons Secrets

| Secret Name | Description | How to Obtain |
|---|---|---|
| `FIREFOX_API_KEY` | AMO API key (JWT issuer) | [addons.mozilla.org/developers/addon/api/key](https://addons.mozilla.org/en-US/developers/addon/api/key/) |
| `FIREFOX_API_SECRET` | AMO API secret (JWT secret) | Generated alongside the API key |

**Setup steps:**

1. Log in to [addons.mozilla.org](https://addons.mozilla.org) with your developer account
2. Navigate to **Tools > Manage API Keys**
3. Generate a new API key pair
4. Store the **JWT Issuer** as `FIREFOX_API_KEY`
5. Store the **JWT Secret** as `FIREFOX_API_SECRET`

---

#### Edge Add-ons Secrets

| Secret Name | Description | How to Obtain |
|---|---|---|
| `EDGE_CLIENT_ID` | Azure AD application client ID | Azure Portal > App Registrations |
| `EDGE_CLIENT_SECRET` | Azure AD application client secret | Azure Portal > App Registrations > Certificates & Secrets |
| `EDGE_PRODUCT_ID` | Edge Add-ons product identifier | Edge Partner Center > Your extension |
| `EDGE_ACCESS_TOKEN` | (Alternative) Pre-generated access token | Azure AD OAuth2 flow |

**Setup steps:**

1. Register the extension in the [Edge Partner Center](https://partner.microsoft.com/en-us/dashboard/microsoftedge/overview)
2. Create an Azure AD application in [Azure Portal](https://portal.azure.com)
3. Grant the application **Microsoft Edge Add-ons API** permissions
4. Generate a client secret (note the expiration date)
5. Note the Product ID from the Partner Center URL

---

#### CI/CD Service Secrets

| Secret Name | Description | How to Obtain |
|---|---|---|
| `CODECOV_TOKEN` | Codecov upload token for coverage reports | [codecov.io](https://codecov.io) > Repository Settings > Upload Token |
| `SLACK_WEBHOOK_URL` | Slack incoming webhook for deployment notifications | Slack App > Incoming Webhooks > Create New Webhook |

---

### GitHub Environments

Configure three deployment environments with protection rules:

#### `production-chrome`
- **Required reviewers:** At least 1 team member
- **Wait timer:** 0 minutes (deploy immediately after approval)
- **Branch restrictions:** Only `main` branch
- **Secrets:** `CHROME_EXTENSION_ID`, `CHROME_CLIENT_ID`, `CHROME_CLIENT_SECRET`, `CHROME_REFRESH_TOKEN`

#### `production-firefox`
- **Required reviewers:** At least 1 team member
- **Wait timer:** 0 minutes
- **Branch restrictions:** Only `main` branch
- **Secrets:** `FIREFOX_API_KEY`, `FIREFOX_API_SECRET`

#### `production-edge`
- **Required reviewers:** At least 1 team member
- **Wait timer:** 0 minutes
- **Branch restrictions:** Only `main` branch
- **Secrets:** `EDGE_CLIENT_ID`, `EDGE_CLIENT_SECRET`, `EDGE_PRODUCT_ID`

---

### Environment Variables Reference

Non-secret configuration values set in the workflow:

| Variable | Value | Description |
|---|---|---|
| `NODE_VERSION` | `20` | Node.js version for all jobs |
| `EXTENSION_NAME` | `focus-mode-blocker` | Used for artifact naming |
| `SIZE_BUDGET_TOTAL_KB` | `500` | Total extension size budget |
| `SIZE_BUDGET_POPUP_KB` | `150` | popup.js size budget |
| `SIZE_BUDGET_BACKGROUND_KB` | `100` | service-worker.js size budget |
| `SIZE_BUDGET_CONTENT_KB` | `50` | Per-content-script size budget |

---

### Secret Rotation Schedule

| Secret | Rotation Frequency | Notes |
|---|---|---|
| `CHROME_REFRESH_TOKEN` | Annually | Does not expire but should be rotated |
| `CHROME_CLIENT_SECRET` | Annually | Rotate in Google Cloud Console |
| `FIREFOX_API_KEY` / `FIREFOX_API_SECRET` | Annually | Regenerate in AMO Developer Hub |
| `EDGE_CLIENT_SECRET` | Per Azure AD expiry (max 24 months) | Set a calendar reminder before expiration |
| `CODECOV_TOKEN` | As needed | Rotate if compromised |
| `SLACK_WEBHOOK_URL` | As needed | Rotate if webhook URL is exposed |

---

### Local Development `.env` Template

For local development and manual store uploads, create a `.env` file (never committed):

```bash
# .env — Focus Mode - Blocker local development secrets
# This file is in .gitignore. Never commit this file.

# Chrome Web Store
CHROME_EXTENSION_ID=your-extension-id-here
CHROME_CLIENT_ID=your-client-id.apps.googleusercontent.com
CHROME_CLIENT_SECRET=your-client-secret
CHROME_REFRESH_TOKEN=your-refresh-token

# Firefox Add-ons
FIREFOX_API_KEY=user:12345678:123
FIREFOX_API_SECRET=your-api-secret

# Edge Add-ons
EDGE_CLIENT_ID=your-azure-ad-client-id
EDGE_CLIENT_SECRET=your-azure-ad-secret
EDGE_PRODUCT_ID=your-edge-product-id

# Codecov
CODECOV_TOKEN=your-codecov-token

# Slack
SLACK_WEBHOOK_URL=<your-slack-webhook-url>
```

Ensure `.env` is listed in `.gitignore`:

```
# .gitignore (relevant entries)
.env
.env.local
.env.*.local
```

---

## Summary

This CI/CD pipeline provides Focus Mode - Blocker with:

- **Automated quality gates** via lint, typecheck, and format checks
- **Comprehensive test execution** with unit, integration, E2E, and performance tests
- **Multi-browser builds** producing validated, size-checked packages for Chrome, Firefox, and Edge
- **Security scanning** including dependency audit, secret detection, CSP validation, and unsafe pattern detection
- **Automated deployments** to all three extension stores on release tags
- **Pre-commit hooks** that catch issues before they enter the repository
- **A repeatable release process** with version bumping, changelog generation, and post-release monitoring

All scripts are specific to the Focus Mode - Blocker extension, referencing its actual file structure, permissions, content scripts, and deployment targets.
