---
title: npm package CICD 自動化部署筆記
description: npm package CICD 自動化部署筆記
date: 2026-01-18
tags:
    - nodejs
    - CICD
    - github action
categories:
    - 自動化部署
---

```yml
name: Publish Package

on:
  push:
    tags:
      - 'v*'

permissions:
  id-token: write  # Required for OIDC
  contents: read

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '24'
          registry-url: 'https://registry.npmjs.org'
      - run: npm install -g npm@latest # 點睛之筆 更新 npm 版本 github action 預設的 npm 版本過舊 會導致 publish 失敗 我被坑了好久
      - run: npm install
      - run: npm run build --if-present
      - run: npm test
      - run: npm publish
```
更新 npm 版本 github action 預設的 npm 版本過舊 會導致 publish 失敗 我被坑了好久
其他就照[官方文件](https://docs.npmjs.com/trusted-publishers)走即可