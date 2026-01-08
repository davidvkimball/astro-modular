---
title: Formatting Reference
date: 2025-09-07
description: Explore all the markdown, extended markdown, and other embed features available in this blog theme.
tags:
  - markdown
  - formatting
  - tutorial
  - reference
  - meta
  - blog
image: "[[attachments/mountains.png]]"
imageAlt: Mountains and water.
imageOG: false
hideCoverImage: false
hideTOC: false
targetKeyword:
draft: false
---
This post demonstrates all the markdown, extended markdown, and other embed features available in Astro Modular. Use this as both a reference guide and a showcase of what's possible.

## Basic Formatting

### Text Emphasis

- **Bold text** using `**bold**` or `__bold__`
- *Italic text* using `*italic*` or `_italic_`
- ***Bold and italic*** using `***text***`
- ~~Strikethrough~~ using `~~text~~`
- ==Highlighted text== using `==text==`
- `Inline code` using backticks

### Headings

# Heading 1
## Heading 2
### Heading 3
#### Heading 4
##### Heading 5
###### Heading 6

```markdown
# Heading 1
## Heading 2
### Heading 3
#### Heading 4
##### Heading 5
###### Heading 6
```

## Callouts and Admonitions

Our theme supports Obsidian-style callouts with proper icons and styling. Each callout type has its own color scheme and matching Lucide icon.

### Basic Callouts

> [!note]
> This is a note callout. Use it for general information that readers should be aware of.

> [!tip]
> This is a tip callout. Perfect for helpful suggestions and best practices.

> [!important]
> This is an important callout. Use it to highlight critical information.

> [!warning]
> This is a warning callout. Use it to alert readers about potential issues.

> [!caution]
> This is a caution callout. Use it for dangerous or risky situations.

### Custom Titles

> [!note] Custom Note Title
> You can customize the title of any callout by adding text after the callout type.

> [!tip] Pro Tip
> Custom titles help you provide more context for your callouts.

### Collapsible Callouts

You can make callouts collapsible by adding `+` (expanded by default) or `-` (collapsed by default) after the callout type:

> [!note]+ Expanded by Default
> This callout starts expanded and can be collapsed by clicking the toggle button or the title.

> [!warning]- Collapsed by Default
> This callout starts collapsed and can be expanded by clicking the toggle button or the title.

> [!tip]+ Collapsible with Custom Title
> You can combine collapsible functionality with custom titles for more control over your content organization.

### Extended Callout Types

> [!info]
> Info callouts provide additional context or details.

> [!success]
> Success callouts highlight positive outcomes or achievements.

> [!question]
> Question callouts can be used to pose questions or highlight areas of uncertainty.

> [!example]
> Example callouts are perfect for showcasing code examples or demonstrations.

> [!quote]
> Quote callouts can be used to highlight important quotes or references.

### Callouts with Formatting 

> [!example]
> You can use markdown syntax in callout content like *italics*, **bolded text**, or [links](posts/formatting-reference.md#Media%20Content).
## Media Content

### Images

#### Single Image With Caption

![Mountains](/posts/attachments/mountains.png)
*Photo by [Antoine Rault](https://unsplash.com/@antoinerault?utm_source=Obsidian%20Image%20Inserter%20Plugin&utm_medium=referral) on [Unsplash](https://unsplash.com/?utm_source=Obsidian%20Image%20Inserter%20Plugin&utm_medium=referral)*

#### Multiple Image Layouts

This theme automatically arranges consecutive images in responsive grid layouts based on the number of images. Images can be placed together without empty lines between them to create these layouts.

**Two Images Side by Side**

![Mountain landscape](attachments/mountain-landscape.jpg)
![Ocean view](attachments/ocean-view.jpg)

**Three Images in a Row**

![Forest path](attachments/forest-path.jpg)
![Desert sunset](attachments/desert-sunset.jpg)
![City skyline](attachments/city-skyline.jpg)

**Four Images in a Row**

![Winter landscape](attachments/winter-landscape.jpg)
![Spring flowers](attachments/spring-flowers.jpg)
![Summer beach](attachments/summer-beach.jpg)
![Autumn leaves](attachments/autumn-leaves.jpg)

**How to Use Multiple Images / Gallery**

Simply place multiple images together without empty lines between them:

```markdown
![Image 1](image1.jpg)
![Image 2](image2.jpg)
![Image 3](image3.jpg)
```

On mobile devices, all layouts switch to a single column for better readability.

### Linked Images

[![Mountains](/posts/attachments/mountains.png)](https://obsidian.md)

```
[![Mountains](/posts/attachments/mountains.png)](https://obsidian.md)
```

## Lists

### Unordered Lists

- First item
- Second item
  - Nested item
  - Another nested item
    - Deeply nested item
- Third item

### Ordered Lists

1. First step
2. Second step
   1. Sub-step A
   2. Sub-step B
      1. Sub-sub-step
3. Third step

### Task Lists

- [x] Completed task
- [ ] Incomplete task
- [x] Another completed task
  - [ ] Nested incomplete task
  - [x] Nested completed task
- [ ] Final incomplete task

## Links and References

### External Links

Here's an [external link](https://obsidian.md).

### Internal Links

You can create internal links using double brackets (wikilinks) or with standard markdown. 

For example: [[getting-started|Getting Started]] or [Astro Suite Obsidian Vault Guide (Astro Modular)](vault-cms-guide.md).

```markdown
For example: [[getting-started|Getting Started]] or [Obsidian Embeds Demo](obsidian-embeds-demo).
```

Here's an internal link with an anchor: [[sample-folder-based-post/index#Benefits of Folder-Based Approach|Benefits of Folder-Based Approach]]

Here's the same internal link with an anchor formatted in 4 different ways (both Obsidian and standard Astro syntax work):

[Choose Your Workflow](posts/getting-started.md#Choose%20Your%20Workflow)
[Choose Your Workflow](posts/getting-started#Choose%20Your%20Workflow)
[[posts/getting-started#Choose Your Workflow|Choose Your Workflow]]
[Choose Your Workflow](/posts/getting-started#choose-your-workflow)


Here's a relative link: [Obsidian Embeds Demo](obsidian-embeds-demo.md)
### Reference Links

This is a [reference link][1] and this is another [reference link][markdown].

[1]: https://example.com
[markdown]: https://daringfireball.net/projects/markdown/

## Code Blocks

### Inline Code

Use `const variable = 'value'` for inline code snippets.

### JavaScript

```javascript
function greetUser(name) {
  console.log(`Hello, ${name}!`);
  return `Welcome to our blog, ${name}`;
}

const user = "Developer";
greetUser(user);
```

### Python

```python
def calculate_fibonacci(n):
    """Calculate the nth Fibonacci number."""
    if n <= 1:
        return n
    return calculate_fibonacci(n-1) + calculate_fibonacci(n-2)

# Example usage
for i in range(10):
    print(f"F({i}) = {calculate_fibonacci(i)}")
```

### CSS

```css
.button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 8px;
  color: white;
  padding: 12px 24px;
  transition: transform 0.2s ease;
}

.button:hover {
  transform: translateY(-2px);
}
```

### Bash/Shell

```bash
#!/bin/bash
echo "Setting up development environment..."

# Install dependencies
npm install

# Start development server
npm run dev

echo "Development server started on http://localhost:3000"
```

## Tables

### Basic Tables

| Feature   | Supported | Notes                           |
| --------- | --------- | ------------------------------- |
| Markdown  | ✅         | Full CommonMark support         |
| Wikilinks | ✅         | Obsidian-style double brackets  |
| Callouts  | ✅         | Multiple types with icons       |
| Math      | ✅         | LaTeX math with KaTeX rendering |
| Diagrams  | ✅         | Mermaid diagram support         |

### Advanced Tables

| Language | Use Case | Performance | Learning Curve |
|----------|----------|-------------|----------------|
| JavaScript | Web Development | ⭐⭐⭐⭐ | Easy |
| Python | Data Science | ⭐⭐⭐ | Easy |
| Rust | Systems Programming | ⭐⭐⭐⭐⭐ | Hard |
| Go | Backend Services | ⭐⭐⭐⭐ | Medium |

## Blockquotes

### Simple Quotes

> The best way to predict the future is to invent it.
> — Alan Kay

### Nested Quotes

> This is a top-level quote.
> 
> > This is a nested quote within the first quote.
> > 
> > > And this is a quote nested even deeper.
> 
> Back to the top level.

## Horizontal Rules

You can create horizontal rules using three dashes:

---

Or three asterisks:

***

Or three underscores:

___

## HTML Elements

You can use HTML directly. Here are some examples:

<details>
<summary>Click to expand</summary>

This content is hidden by default and can be expanded by clicking the summary.

</details>

<small>Small text for fine print</small>

<sup>Superscript</sup>

<sub>Subscript</sub>

### Keyboard Shortcuts

Press <kbd>Ctrl</kbd> + <kbd>C</kbd> to copy and <kbd>Ctrl</kbd> + <kbd>V</kbd> to paste.

Use <kbd>Cmd</kbd> + <kbd>K</kbd> to open the command palette.

### Special Characters and Symbols

- Copyright: ©
- Trademark: ™
- Registered: ®
- Arrows: ← ↑ → ↓ ↔ ↕
- Symbols: ★ ☆ ♠ ♣ ♥ ♦
- Currency: $ € £ ¥

### Buttons

These buttons use your existing color palette and adapt perfectly to light/dark themes. Wrap them in internal or external links if you prefer:

<div class="btn-group my-8">
  <a href="https://google.com" class="no-styling no-underline" target="_blank"><button class="btn btn-primary">Primary Action</button></a>
  <a href="https://google.com" class="no-styling no-underline" target="_blank"><button class="btn btn-secondary">Secondary</button></a>
    <a href="https://google.com" class="no-styling no-underline" target="_blank"><button class="btn btn-outline">Outlined</button></a>
      <a href="https://google.com" class="no-styling no-underline" target="_blank"><button class="btn btn-ghost">Subtle</button></a>
</div>

```html
<div class="btn-group-center my-8">
  <a href="https://google.com" class="no-styling no-underline" target="_blank"><button class="btn btn-primary">Primary Action</button></a>
  <a href="https://google.com" class="no-styling no-underline" target="_blank"><button class="btn btn-secondary">Secondary</button></a>
    <a href="https://google.com" class="no-styling no-underline" target="_blank"><button class="btn btn-outline">Outlined</button></a>
      <a href="https://google.com" class="no-styling no-underline" target="_blank"><button class="btn btn-ghost">Subtle</button></a>
</div>
```


## Works with Obsidian

All of these formatting options should also appear in Obsidian, with some differences depending on the theme you use. 

### Quick Reference

- **Bold**: `**text**` or `__text__`
- **Italic**: `*text*` or `_text_`
- **Code**: `` `code` ``
- **Highlight:** `==text==`
- **Links**: `[text](url)` or `[[wikilink]]`
- **Images**: `![alt](url)`
- **Lists**: `-` or `1.` for ordered
- **Tasks**: `- [ ]` and `- [x]`
- **Tables**: Use `|` to separate columns
- **Quotes**: Start lines with `>`
- **Callouts**: `> [!TYPE]`
- **Horizontal rule**: `---`

Further reading: [Obsidian Embeds Demo](posts/obsidian-embeds-demo.md)
