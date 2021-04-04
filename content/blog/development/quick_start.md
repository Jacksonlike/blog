---
title: 'Quick Start'
date: 2020-07-05 17:21:13
category: 'development'
draft: false
---

# Getting Started 😎

## 奥术大师大所多啥大苏打阿萨德打.

```sh
# create a new Gatsby site using the blog starter
$ npx gatsby new my-blog-starter https://github.com/JaeYeopHan/gatsby-starter-bee
```

> If you are not using `npx`, following [Gatsby Getting Started](https://www.gatsbyjs.org/docs/quick-start)

```shell
$ npm install -g gatsby-cli
$ gatsby new my-blog-starter https://github.com/JaeYeopHan/gatsby-starter-bee
```

```js
const a = 100
const b = 200
console.log(a + b)
```

## 2. Start developing.

```sh
$ cd my-blog-starter/
$ npm start
# open localhost:8000
```

## 3. Add your content

好消息：ES2020 的新特性都已经完成了！这意味着我们现在对新的 JavaScript 规范 ES2020 的变化有了完整的了解。So，让我们看看都有哪些变化把。
You can write...阿斯顿撒大所大所大设群翁付凡事都噶防守打法阿尔法啥地方放沙发

- contents to blog in `content/blog` directory.
- resume `content/__about` directory.

> With markdown syntax and some meta data

### Support script for creating new post

![](./images/cli-tool-example.gif)

```sh
$ npm run post
```

## 4. Fix meta data

You can fix meta data of blog in `/gatsby-meta-config.js` file.

## 5. Publish with [netlify](https://netlify.com)

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/JaeYeopHab/gatsby-starter-bee)

:bulb: if you want to deploy github pages, add following script to package.json

```json
"scripts": {
    "deploy": "gatsby build && gh-pages -d public -b master -r 'git@github.com:${your github id}/${github page name}.github.io.git'"
}
```

# :memo: Write a post!

```
content
├── __about
└── blog
```

- You can register your resume on the web. (in `__about` directory)
- You can register your post. (in `blog` directory)

# 🧐 Customize!

## Gatsby config

```
/root
├── gatsby-browser.js // font, polyfill, onClientRender ...
├── gatsby-config.js // Gatsby config
├── gatsby-meta-config.js // Template meta config
└── gatsby-node.js // Gatsby Node config
```

## Structure

```
src
├── components // Just component with styling
├── layout // home, post layout
├── pages // routing except post: /(home), /about
├── styles
│   ├── code.scss
│   ├── dark-theme.scss
│   ├── light-theme.scss
│   └── variables.scss
└── templates
    ├── blog-post.js
    └── home.js
```

## Style

You can customize color in `src/styles` directory.

```
src/styles
├── code.scss
├── dark-theme.scss
├── light-theme.scss
└── variables.scss
```

> Welcome to gatsby-starter-bee!
> Happy blogging! 👻
