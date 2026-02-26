---
title: Astro Composer
description: An Obsidian plugin to create and manage Astro blog posts easily with automated file renaming, note properties management, and internal link conversion.
date: 2025-08-20
categories:
  - Obsidian
  - Astro
  - Plugin
repositoryUrl:
projectUrl: https://github.com/davidvkimball/obsidian-astro-composer
status: in-progress
image: "[[attachments/rock.png]]"
imageAlt: Gray, rocky wall
hideCoverImage: false
hideTOC: false
draft: false
featured: true
aliases:
  - obsidian-astro-composer
---
## Project Overview

Astro Composer is an Obsidian plugin that turns your Obsidian notes into posts and pages for your Astro blog with automated content management features. Part of the [Vault CMS](projects/vault-cms/index.md) project, it provides seamless integration between Obsidian note-taking and Astro publishing workflows.

## Key Features

### Content Creation & Management
- **New Post Dialog**: When enabled, prompts for a title when creating new Markdown files via Obsidian's "New note" action, auto-generating kebab-case filenames (e.g., "My Blog Post" → `my-blog-post.md`) and optionally inserting properties with `title`, `date`, etc.
- **Property Standardization**: Updates a note's properties to match a customizable template using the "Standardize Properties" command. Preserves existing property values, adds missing properties from the template in the specified order, and appends unrecognized properties at the end.
- **Rename Post Command**: Easily rename your notes by updating the title property with the desired post name, and get a kebab-case file or folder update afterward.

### Draft Management
- **Underscore Prefix**: Optionally adds an underscore prefix (e.g., `_my-post.md`) to hide drafts from Astro, configurable via settings.

### Link Conversion
- **Internal Link Conversion**: Converts Obsidian wikilinks and markdown internal links (`[[My Post]]` or `[My Post](my-post)`) to Astro-friendly Markdown links (`[My Post](/blog/my-post/)`), supporting both file-based and folder-based post structures.

### Multi-Content Type Support
- **Pages, Docs, Projects**: With "Enable pages" enabled and by creating custom content types, you can do the same automation behavior for any other content type, like pages, documentation, projects, etc.

### Configurable Workflow
- **Customizable Settings**: Configure posts folder, link base path, creation mode (file-based or folder-based with `index.md`), date format, and excluded directories
- **Selective Automation**: Enable or disable automation for new notes and properties insertion independently
- **Robust Automation**: Only triggers the title dialog for user-initiated new notes (e.g., via "New note" command), avoiding unwanted prompts during vault loading or file imports (e.g., via git pull)

## Technical Implementation

Built with TypeScript and following Obsidian's plugin development best practices, the plugin integrates seamlessly with Obsidian's file system and provides a smooth user experience for content creators. It supports both file-based (`my-post.md`) and folder-based (`my-post/index.md`) post structures, making it flexible for different Astro setups.

## Installation

Astro Composer is not yet available in the Community plugins section. Install using BRAT or manually:

### BRAT (Recommended)
1. Download the Beta Reviewers Auto-update Tester (BRAT) plugin from the Obsidian community plugins directory and enable it
2. In the BRAT plugin settings, select `Add beta plugin`
3. Paste: `https://github.com/davidvkimball/obsidian-astro-composer` and select `Add plugin`

### Manual Installation
1. Download the latest release from the Releases page
2. Navigate to your Obsidian vault's `.obsidian/plugins/` directory
3. Create a new folder called `astro-composer` and ensure `manifest.json`, `main.js`, and `styles.css` are in there
4. In Obsidian, go to Settings > Community plugins and enable "Astro Composer"

## Usage

1. **Customize Settings**: In **Settings > Astro Composer**, configure automation, properties template, posts folder, creation mode, and more
2. **Standardize Properties**: Use the `Astro Composer: Standardize Properties` command to update a note's properties to the relevant content type
3. **Convert Internal Links**: Use the `Astro Composer: Convert internal links for Astro` command to transform Obsidian wikilinks and internal Markdown links into Astro-compatible Markdown links
4. **Rename Content**: Using the `Astro Composer: Rename Current Note` command, set the title of your content and have the file or parent folder get automatically renamed with the kebab-case version

## Use Cases

- **Content Creators**: Streamline the process of creating and managing blog posts, pages, and documentation
- **Astro Developers**: Bridge the gap between Obsidian note-taking and Astro publishing
- **Technical Writers**: Maintain consistent formatting and file organization across multiple content types
- **Bloggers**: Focus on content creation rather than file management and slug generation
- **Vault CMS Users**: Core automation component for the complete Obsidian-to-Astro workflow

## Project Status

This project is actively maintained and in-progress. The latest version includes robust automation features, comprehensive configuration options for various Astro workflows, and support for multiple content types beyond just posts.

<a href="https://github.com/davidvkimball/obsidian-astro-composer" class="no-styling no-underline" target="_blank"><button class="btn btn-primary w-full">  
    View Project  
  </button></a>