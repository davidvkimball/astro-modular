---
title: Vault CMS
description: Use Obsidian as a content management system for your Astro website.
date: 2025-08-25
categories:
  - Obsidian
  - Astro
  - Vault
  - Template
repositoryUrl:
projectUrl: https://github.com/davidvkimball/vault-cms
status: in-progress
image: "[[glacier.png]]"
imageAlt: Blue glaciers and mountains.
hideCoverImage: false
hideTOC: false
draft: false
featured: true
aliases:
  - obsidian-astro-suite
---
## Project Overview

Vault CMS (formerly Obsidian Astro Suite) is a collection of pre-configured Obsidian vaults designed to seamlessly integrate with Astro static sites. It provides a complete content management solution that bridges the gap between note-taking and web publishing, with three optimized vault options: **Default**, **Minimal**, and **Docs**.

## Philosophy

Vault CMS is built on three core principles:

1. **Plug-and-play Astro blogging experience** - Pre-configured vaults ready for immediate use
2. **Emphasis on customization and modularity** - Flexible configuration for different use cases
3. **Visual parity between backend and frontend** - Seamless workflow from Obsidian to Astro publishing

## Vault Options

### Default
Optimized for general-purpose Astro blogs, configured for the Slate blog theme.

### Minimal
Optimized for minimal Astro themes, prioritizing visual minimalism and distraction-free writing, configured for the Chiri theme.

### Docs
Optimized for Starlight and other documentation-focused Astro themes.

## Included Community Plugins

### Core Content Management
- **Astro Composer**: Automated post creation and management with kebab-case slug generation
- **Bases CMS**: CMS-like homepage using Obsidian Bases for content management
- **Homepage**: Customizable homepage experience
- **Default New Tab Page**: CMS-like directory view of all blog posts

### Image & Media Management
- **Image Inserter**: Pull images from Unsplash or other sources with `CTRL + '`
- **Paste Image Rename**: Automatic kebab-case, SEO-friendly image renaming
- **Paste Image Into Property**: Insert images directly into frontmatter properties

### Content Organization
- **Property Over Filename**: Use `title` property as primary identifier instead of filename
- **Tag Wrangler**: Bulk tag management and organization

### Writing & Editing
- **Editing Toolbar**: Microsoft Word-style toolbar for markdown editing
- **SEO**: Content audit tool for search engine optimization
- **Simple Banner**: Automatic banner display for posts with cover images

### Theme & Customization
- **Simple Focus**: Simplify file explorer to relevant directories
- **Zen Mode**: Full-screen writing mode (`CTRL + SHIFT + Z`)
- **Status Bar Organizer**: Customize status bar layout

### Publishing & Workflow
- **Git**: Optional instant-publish functionality via Git plugin (`CTRL + SHIFT + S`)
- **Settings Search**: Global search for all Obsidian settings

## Key Features

- **Plug-and-Play Setup**: Pre-configured vaults ready for immediate use with optimized plugins and settings
- **CMS-Like Homepage**: "Home Base" view showing all posts in reverse-chronological order with bulk editing
- **Astro Integration**: Seamless workflow from Obsidian to Astro publishing without link conversion
- **Optimized Hotkeys**: Custom keyboard shortcuts designed for Astro workflows (see [Vault Guide](/posts/vault-cms-guide))
- **Git Integration**: Optional instant-publish functionality via Git plugin
- **Visual Parity**: Oxygen theme matches frontend styling for consistent experience

## Default Settings

- Markdown links used in favor of wikilinks
- Default location for new notes set per-vault
- Indentation guides disabled
- Custom hotkeys optimized for Astro workflows

## Technical Implementation

The suite is built on Obsidian's plugin ecosystem and designed to work with Astro's content collections system. It provides a complete development environment for content creators who want to use Obsidian as their primary writing tool, with seamless integration that requires no link conversion or manual configuration.

## Installation & Setup

1. Clone or download your Astro theme of choice
2. Clone or download Vault CMS repository
3. Open the folder of the version you want (Default, Minimal, or Docs)
4. Copy the contents into your Astro project's `src/content` folder
5. Open Obsidian and select "Open folder as vault", choosing the folder with the `.obsidian` directory

## Project Status

This project is actively maintained and provides a complete solution for Obsidian-based content management with Astro publishing workflows. The suite is designed to work seamlessly with the above examples and [Astro Modular](https://github.com/davidvkimball/astro-modular) but can be integrated into any Astro project.

<a href="https://github.com/davidvkimball/vault-cms" class="no-styling no-underline" target="_blank"><button class="btn btn-primary w-full">  
    View Project  
  </button></a>
