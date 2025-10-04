# Eleventy + Tailwind CSS + GitHub Pages + Custom Domain Template

A starter template for static sites using Eleventy, Tailwind CSS, and GitHub Pages with custom domain support. All common deployment and configuration gotchas are solved.

## Features

- Eleventy static site generator
- Tailwind CSS with PostCSS and Autoprefixer
- GitHub Actions for CI/CD
- Automatic CNAME passthrough for custom domains
- Correct asset paths for GitHub Pages
- Ready for deployment at domain root

## Setup

1. **Clone this repo**
2. **Install dependencies**
   ```sh
   npm install
   ```
3. **Set your custom domain**
   - Edit the `CNAME` file and replace `your-custom-domain.com` with your domain.
4. **Configure DNS**
   - Apex domain: Add A records for 185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153
   - www: Add a CNAME record pointing to `<your-github-username>.github.io`
5. **Build and serve locally**
   ```sh
   npm start
   ```
6. **Deploy**
   - Push to GitHub. GitHub Actions will build and deploy to GitHub Pages automatically.

## GitHub Pages Configuration

After pushing your code to GitHub, follow these steps to configure GitHub Pages deployment:

### Step 1: Access Repository Settings

1. Navigate to your repository on GitHub
2. Click on the **Settings** tab (located at the top of the repository page)
3. Scroll down to find the **Pages** section in the left sidebar

### Step 2: Configure Pages Source

1. In the **Pages** section, look for the **Source** dropdown
2. Select **GitHub Actions** from the dropdown menu
   - **Important**: Do NOT select "Deploy from a branch"
   - GitHub Actions allows your workflow file to handle the entire build and deployment process
3. Leave all other settings as default

### Step 3: Set Up Custom Domain (Optional)

If you want to use a custom domain:

1. In the same **Pages** section, find the **Custom domain** field
2. Enter your domain name (e.g., `example.com` or `www.example.com`)
3. Click **Save**
4. GitHub will automatically create or update your `CNAME` file
5. Make sure your DNS settings are configured correctly (see DNS setup in the main Setup section above)

### Step 4: Enable HTTPS

1. Check the **Enforce HTTPS** checkbox (highly recommended for security)
2. This option may take a few minutes to become available after setting up your domain

### Step 5: Verify Deployment

1. Push any changes to your `main` branch
2. Go to the **Actions** tab in your repository
3. Watch the workflow run and complete successfully
4. Your site will be available at your custom domain or at `https://yourusername.github.io/repository-name`

**Why GitHub Actions source?** Your workflow uses the official GitHub Pages deployment actions (`actions/upload-pages-artifact@v3` and `actions/deploy-pages@v4`) which deploy directly to GitHub Pages without needing to push to a separate branch. By selecting "GitHub Actions" as the source, GitHub Pages will automatically deploy whatever your workflow publishes. This modern approach is more secure and doesn't require branch push permissions.

## Google Fonts & Typography

### Rubik Font

- This template uses the [Rubik](https://fonts.google.com/specimen/Rubik) font from Google Fonts as the default sans-serif font for all text.
- All 9 font weights (100–900) are loaded for maximum flexibility.
- The font is loaded via `<link>` tags in `src/_includes/layout.njk`.
- Tailwind is configured to use Rubik as the default `font-sans` in `tailwind.config.js`.
- The main heading (`h1`) uses Rubik Black (font-weight 900) for a bold, impactful look.

### Custom Styles

- The file `src/assets/styles.css` is the main entry for Tailwind and any custom CSS.
- A custom `.rubik-black` class is defined in `styles.css` to ensure the `h1` uses Rubik Black (900).
- You can add more custom styles to this file as needed; they will be processed by PostCSS and included in the build.

## Gotchas Solved

- CNAME file is always copied to the output directory.
- Asset paths use Eleventy’s `url` filter for compatibility.
- `pathPrefix` is `/` for custom domain root.
- Example DNS and deployment instructions included.

## Troubleshooting

- If your custom domain is removed, check that the CNAME file is present in the published branch after deploy.
- For 404 errors on CSS, ensure asset paths use the `url` filter and the CSS file exists in `_site/assets/`.
- For domain verification, add a TXT record if GitHub Pages requests it.

---

MIT License
