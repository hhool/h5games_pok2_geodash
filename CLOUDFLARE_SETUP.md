Cloudflare Pages setup — quick steps

1) Create an API Token

- Go to Cloudflare Dashboard → My Profile → API Tokens → Create Token
- Choose "Edit Cloudflare Pages" or create a Custom Token with at least: Account.Pages:Edit, Account:Read, Zone:Read
- Copy the token value.

2) Get your Account ID

- Cloudflare Dashboard → Overview (on any site) → Account ID (copy value)

3) Create a Pages project (optional via API)

Replace values and run:

```bash
curl -X POST "https://api.cloudflare.com/client/v4/accounts/$CF_ACCOUNT_ID/pages/projects" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"YOUR_PROJECT_NAME","production_branch":"main"}'
```

4) Add GitHub repo secrets

In your GitHub repo: Settings → Secrets → Actions, add:

- `CLOUDFLARE_API_TOKEN` = (value from step 1)
- `CLOUDFLARE_ACCOUNT_ID` = (value from step 2)
- `CLOUDFLARE_PROJECT_NAME` = (Pages project name you created on Cloudflare)

You can also set these via `gh` CLI:

```bash
gh secret set CLOUDFLARE_API_TOKEN --body "$CF_API_TOKEN"
gh secret set CLOUDFLARE_ACCOUNT_ID --body "$CF_ACCOUNT_ID"
gh secret set CLOUDFLARE_PROJECT_NAME --body "YOUR_PROJECT_NAME"
```

5) Trigger deploy

- Push to `main` (or `master`) or run the workflow manually in GitHub Actions to build and deploy.
