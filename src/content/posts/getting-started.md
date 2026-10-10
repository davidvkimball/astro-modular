---
title: Getting Started
date: 2025-09-06
description: Quick start guide for Astro Modular - get your blog running in minutes. This will walk you through Vault CMS and the particulars of this theme.
tags:
  - tutorial
  - setup
  - quick-start
  - astro
  - blog
image: "[[attachments/sunset.png]]"
imageAlt: A pink and purple sunset over the sea.
imageOG: true
hideCoverImage: false
hideTOC: false
draft: false
---
Welcome to Astro Modular! This quick start guide will get your blog running in minutes. Choose your preferred workflow [below](posts/getting-started.md#Choose%20Your%20Workflow).

## Get Astro Modular

> [!important] Vault CMS is already included
> Astro Modular ships with Vault CMS and every Obsidian plugin it uses, preconfigured in `src/content/.obsidian/`. Don't install Vault CMS separately: its installer copies its own `.obsidian` and `_bases` folders over the ones bundled here.

**Without the command line:** open the [latest release](https://github.com/davidvkimball/astro-modular/releases/latest), download **Source code (zip)** under **Assets**, and extract it wherever you want your site's project folder to live.

**With the command line** (requires Node.js and pnpm):

```bash
pnpm create astro-modular my-blog
```

Either way, open the `src/content` folder as a vault in Obsidian next. See [Choose Your Workflow](posts/getting-started.md#Choose%20Your%20Workflow) below.

## What You Need

- **[Obsidian](https://obsidian.md)** to write.
- **[Git](https://git-scm.com/) and a [GitHub](https://github.com) account** to publish. The setup wizard creates the GitHub repository for you.
- **A host** such as Netlify, Vercel, or Cloudflare. The host builds your site from GitHub, so publishing needs nothing else installed on your computer.
- **Optional: Node.js 24.13.0+ and pnpm.** You only need these to preview the site on your own computer or to use the command-line install.

### Preview on Your Computer (Optional)

Run these from the project folder (the one that contains `package.json`):

```bash
# Install pnpm
npm install -g pnpm

# Install dependencies
pnpm install

# Preview
pnpm dev # or pnpm preview
# Available at http://localhost:5000

# Build for production
pnpm build
```

## Choose Your Workflow

### Using Obsidian?

Perfect! Astro Modular is designed specifically for Obsidian users.

**Quick Start:**
1. Open folder as vault: Navigate to `src/content/` in Obsidian
2. Trust the author and enable the preconfigured plugins
3. Follow the setup wizards: Astro Modular Settings configures your theme and preferences, then Vault CMS connects your site to GitHub and your host
4. Start writing with the included templates and hotkeys

**What you get:**
- **Seamless publishing**: write in Obsidian, publish to your blog with git
- **Versatile internal linking support**: `[[Wikilinks]]` and markdown links work perfectly
- **Obsidian-specific features**: callouts, highlighting, and more display beautifully
- **Preconfigured plugins & hotkeys**: all optimized for blogging

**Next Steps:**
- Read the [Obsidian Vault Guide](vault-cms-guide.md) for detailed setup
- Use the **Astro Modular Settings** plugin to customize your theme and preferences
- Start writing your first post with the included templates

### **Not Using Obsidian?**

No problem! You can still use Astro Modular with any editor.

**Quick Start:**
1. **Edit `src/config.ts`** to customize your site settings
2. **Create content** in `src/content/posts/` using standard markdown
3. **Deploy** when ready

**Next Steps:**
- Read the [setup guide](docs/configuration.md) for detailed configuration
- Explore the [reference guide](formatting-reference.md) for markdown features
- Customize your theme and layout in `src/config.ts`

## Essential Configuration

Update these core settings in `src/config.ts`:

```typescript
export const siteConfig = {
  site: 'https://yourdomain.com',
  title: 'Your Blog Title',
  description: 'Your blog description',
  author: 'Your Name',
  language: 'en',
}
```

## Key Features

### **17+ Beautiful Themes**
Switch between Oxygen, Minimal, Nord, Dracula, and more. Use `Ctrl+K` → "Change Theme" for instant switching.

### **Command Palette**
Press `Ctrl+K` for instant navigation, search, and theme switching.

### **Responsive & Fast**
Optimized for performance with automatic image optimization and lazy loading.

### **Smart Linking**
- **Wikilinks** (Obsidian users): `[[Post Title]]`
- **Standard links** (all users): `[Post Title](posts/post-slug)`

### **Content Types**
- **Posts** - Blog articles with tags and linked mentions
- **Pages** - Static pages like About, Contact
- **Projects** - Portfolio items and showcases
- **Documentation** - Guides and references

## Next Steps

### For Obsidian Users:
1. **Set up the vault** - Open `src/content/` in Obsidian
2. **Configure with the plugin** - Use Astro Modular Settings
3. **Start writing** - Use the included templates and hotkeys
4. **Read the vault guide** - [Obsidian Vault Guide](vault-cms-guide.md)

### For Non-Obsidian Users:
1. **Customize your site** - Edit `src/config.ts`
2. **Read the full guide** - [Complete Setup Guide](docs/configuration.md)
3. **Explore features** - [Formatting Reference](formatting-reference.md)
4. **Start writing** - Create your first post

## Need Help?

- **Complete Setup Guide**: [Configuration Documentation](docs/configuration.md)
- **Obsidian Vault Guide**: [Obsidian Vault Guide](vault-cms-guide.md)
- **Formatting Reference**: [Formatting Reference](formatting-reference.md)

Your modular Astro blog is ready to go!