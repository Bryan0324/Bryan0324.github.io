# Hexo Theme Yun - Frontmatter Reference

Complete guide to all available frontmatter options for posts and pages in hexo-theme-yun.

## Basic Metadata

### `title` (Required)
- **Type:** String
- **Purpose:** Post/page title displayed as heading and in page title
- **Example:** `title: My Blog Post`

### `date`
- **Type:** Date (YYYY-MM-DD or YYYY-MM-DD HH:mm:ss)
- **Purpose:** Post creation date, used for sorting and display
- **Example:** `date: 2025-12-25`
- **Note:** Omit to hide date display on gallery/special pages

### `updated`
- **Type:** Date (YYYY-MM-DD or YYYY-MM-DD HH:mm:ss)
- **Purpose:** Last modified date, shown if different from creation date
- **Example:** `updated: 2026-01-04 15:30:00`

### `description`
- **Type:** String
- **Purpose:** Short post description shown on post cards
- **Example:** `description: A brief summary of the post`

## Content Organization

### `tags`
- **Type:** Array of strings
- **Purpose:** Categorize posts by tags, creates tag pages
- **Example:**
  ```yaml
  tags:
    - javascript
    - web
    - tutorial
  ```

### `categories`
- **Type:** Array of strings
- **Purpose:** Categorize posts by categories
- **Example:**
  ```yaml
  categories:
    - Development
    - Frontend
  ```

### `type`
- **Type:** String
- **Purpose:** Special post type (link, draft, etc.) - affects display and styling
- **Example:** `type: link`
- **How to configure types:** In `_config.yun.yml` you can define custom types with color/icon. Then reference by name in frontmatter.
  ```yaml
  # _config.yun.yml
  types:
    link:
      color: "#0078E7"
      icon: ri:external-link-line
    # add your own types:
    # note:
    #   color: "#FF9900"
    #   icon: ri:sticky-note-line
  ```
  Use in frontmatter:
  ```yaml
  type: link
  ```

## Display & Visibility

### `cover`
- **Type:** String (URL)
- **Purpose:** Post thumbnail/cover image URL
- **Example:** `cover: /img/my-image.jpg` or `cover: https://example.com/image.jpg`

### `hideTime`
- **Type:** Boolean
- **Purpose:** Hide the creation/updated date display
- **Example:** `hideTime: true`
- **Use Case:** Gallery pages, special pages that don't need date

### `hide`
- **Type:** Boolean
- **Purpose:** Completely hide post from post lists and archives
- **Example:** `hide: true`
- **Use Case:** Draft posts, unlisted pages

### `top` / `sticky`
- **Type:** Boolean
- **Purpose:** Pin post to top of post list
- **Example:** `top: true` or `sticky: true`

### `readmore`
- **Type:** Boolean
- **Purpose:** Show "Read More" button on post card
- **Example:** `readmore: true`
- **Default:** Usually auto-determined by excerpt

## Author & Contact

### `author`
- **Type:** String
- **Purpose:** Override default post author
- **Example:** `author: Guest Author`
- **Note:** Uses global author from config if not specified

### `email`
- **Type:** String
- **Purpose:** Author email, used for Gravatar avatar
- **Example:** `email: author@example.com`

## Special Features

### `reward`
- **Type:** Boolean
- **Purpose:** Display reward/donation section at end of post
- **Example:** `reward: true`

### `gallery_password`
- **Type:** String
- **Purpose:** Password-protect gallery page (requires encryption key)
- **Example:** `gallery_password: my-secret-key`
- **Note:** For gallery/album pages only

### `photos`
- **Type:** Array of objects
- **Purpose:** Define photos/images for gallery page
- **Example:**
  ```yaml
  photos:
    - src: /img/photo1.jpg
      caption: Photo Caption
      desc: Photo Description
    - src: /img/photo2.jpg
      caption: Another Photo
      desc: Another Description
  ```
- **Note:** Used with gallery layout

## Complete Example: Post

```yaml
---
title: Learning JavaScript Async/Await
description: A comprehensive guide to async/await in JavaScript
date: 2025-12-25 10:00:00
updated: 2026-01-04 15:30:00
cover: /img/js-async-await.jpg
author: Your Name
email: your@email.com
tags:
  - javascript
  - async
  - tutorial
categories:
  - Programming
  - Web Development
readmore: true
reward: true
---
```

## Complete Example: Gallery Page

```yaml
---
title: 圖庫
hideTime: true
photos:
  - src: /img/gallery/photo1.jpg
    caption: Beautiful Sunset
    desc: Taken at the beach
  - src: /img/gallery/photo2.jpg
    caption: Mountain View
    desc: Alpine landscape
---
```

## Complete Example: Special Page

```yaml
---
title: About Me
hideTime: true
---
```

## Common Use Cases

### Hide everything except title
```yaml
---
title: My Page
hideTime: true
---
```

### Pin important announcement
```yaml
---
title: Important Announcement
top: true
sticky: true
---
```

### Create a link post
```yaml
---
title: Great Article
type: link
url: https://example.com/article
---
```

### Password-protected album
```yaml
---
title: Private Album
gallery_password: secret123
photos: [...]
---
```

## Notes

- **YAML Format:** All frontmatter must be valid YAML between `---` markers
- **Required:** Only `title` is typically required
- **Hierarchy:** Post-level settings override theme defaults
