---
title: Web 安全攻防总结
date: 2020-04-20 15:24:20
tags: 
- Web 安全
- XSS
- CSRF
- SQL 注入
- DDoS
categories:
- Web
description: 常见 Web 安全攻防总结，安全问题永远是大问题
---

### 前言

开发的大部分 Web 应用都是服务于内网，导致 Web 的安全问题并没有仔细的考虑和实践过。这次借着部门内部分享的机会好好总结下 Web 安全攻防的相关知识，避免以后踩雷。本文主要分析常见的几种的 Web 安全问题，并探讨其原理和防御策略。

### SQL  注入

SQL 注入是指 Web 应用程序对用户输入的合法性判定或者过滤不严，导致攻击者可以在管理员不知情的情况下实现非法操作，从而执行非授权的数据库查询，获取用户信息等。

#### SQL 攻击原理
1. 盗取网站敏感信息
   假设存在某种应用场景，用户在前端输入ID，后台根据用户的输入按照如下的规则拼接 `SQL` ， 然后把查询结果返回到用户：

   ```javascript
   const querySQL = `
   	SELECT first_name, last_name 
   	FROM users 
   	WHERE user_id = '${userID}'
   `;
   ```

   普通用户的输入可以得到如下结果：
   ![](/images/web-security/2.png)

   但是攻击者可不会乖乖的输入正常的用户ID，比如攻击者输入 `x' union select database(),user()#` 进行查询，这时查询语句就变成了这样：
   ```sql
   SELECT first_name, last_name FROM users WHERE user_id = 'x' union select database(),user()#'
   ```

   ![](/images/web-security/3.png)

   - `database()` 将会返回当前网站所使用的数据库名字
   - `user()` 将会返回执行当前查询的用户名
   - `x` 的值是随意构造的

   这时用户查询到的是管理员不希望用户知道的信息，当然除了可以获取数据库的名字和查询用户名之外，还可以获取其他的一些信息，比如通过 `version()` 获取数据库版本，`@@version_compile_os` 获取当前操作系统等等。

2. 绕过登录验证
   假设前端的登录表单如下：
   ```html
   <form action="/login" method="POST">
       <p>用户: <input type="text" name="username" /></p>
       <p>密码: <input type="password" name="password" /></p>
       <p><input type="submit" value="登陆" /></p>
   </form>
   ```

   后端 `SQL` 语句的拼接可能是如下这样：
   ```javascript
   const querySQL = `
       SELECT *
       FROM user
       WHERE username='${username}'
       AND psw='${password}'
   `;
   // 接下来就是执行 sql 语句...
   ```

   正常的用户输入，则会执行类似如下这样的 `SQL` 语句，只有当用户名和密码都匹配的时候，才能正常登录。

   ```sql
   SELECT * FROM user WHERE username='admin' and password='WUs&Ez';
   ```

   但是现实情况是，并不是所有用户都能乖乖的输入用户名和密码，比如攻击者进行如下输入：
   ![](/images/web-security/1.png)

   这时，后台实际执行的 `SQL` 就变成了下面这样：
   ```sql
   SELECT * FROM user WHERE username='admin' OR 1 = 1 --' and password='111111';
   ```

   按照 `MySQL` 的语法，`--` 后面的内容相当于注释会被忽略，这样攻击者在不用知道密码的情况下，可以使用 `admin` 的身份绕过登录验证，直接成功登录。

#### 预防 SQL 注入

`SQL` 注入的核心就是用户的非法输入拼接到了后端的 `SQL` 中，所以防范的核心在于永远不相信用户的输入，对于用户的输入信息进行充分转义。除此之外也还是不够的，还需要注意以下几点：

- **严格限制Web应用的数据库的操作权限**，给此用户提供仅仅能够满足其工作的最低权限，从而最大限度的减少注入攻击对数据库的危害

- **充分转义，或者限制用户输入数据库特殊字符（'，"，\，<，>，&，*，; 等）**

- **使用[参数化查询](https://zh.wikipedia.org/wiki/%E5%8F%83%E6%95%B8%E5%8C%96%E6%9F%A5%E8%A9%A2)**，现代语言基本都有提供参数化查询的接口，比如 Node.js 中的 mysqljs 库的 `query` 方法中的 `?` 占位参数

  ```javascript
  mysql.query(`SELECT * FROM user WHERE username = ? AND psw = ?`, [username, psw]);
  ```

- **在应用发布之前建议使用专业的 SQL 注入检测工具进行检测**，以及时修补被发现的 SQL 注入漏洞。网上有很多这方面的开源工具，例如 sqlmap、SQLninja 等

- **避免网站打印出 SQL 错误信息**，比如类型错误、字段不匹配等，把代码里的 SQL 语句暴露出来，以防止攻击者利用这些错误信息进行 SQL 注入

公司代码中的 `SQL` 语句属于高级别的机密，特别是关键的表和库，不应该随意暴露，容易被别有用心的人利用。

### 命令行注入

命令行注入漏洞，指的是攻击者能够通过 HTTP 请求直接侵入主机，执行攻击者预设的 shell 命令，听起来好像匪夷所思，这往往是 Web 开发者最容易忽视但是却是最危险的一个漏洞之一。

命令行注入的原理和 `SQL` 注入的原理是一样的，不过从后台拼接 `SQL` 语句转换成了后台拼接 `shell` 命令，其预防方法也是一样的。不过命令行注入带来的危害甚至更大。所以站点服务调用 `shell` 脚本时应该要限制执行权限。

### XSS

XSS 全称为`Cross Site Scripting`，为了和 CSS 分开简写为 XSS ，中文名为跨站脚本。该漏洞发生在用户端，是指在渲染过程中发生了不在预期过程中的 JavaScript 代码执行。XSS通常被用于获取 Cookie、以受攻击者的身份进行操作等行为。

XSS 的本质是：恶意代码未经过滤，与网站正常的代码混在一起；浏览器无法分辨哪些脚本是可信的，导致恶意脚本被执行。

#### 存储型 XSS

存储型的 XSS 一般存在于 Form 表单提交等交互功能，如发帖留言等。也就是说攻击者的恶意代码已经存储到了网站的数据库中，当前端页面获取数据进行展示时，恶意代码就会被执行。

存储型的 XSS 不需要诱骗用户进行点击，只需要找到网站漏洞，进行注入即可，而且一旦攻击成功，危害面就会非常广。不过这种 XSS 攻击的成本也还是很高，需要站点同时满足以下的条件：

- POST 请求的表单，前后端都没有进行转义，直接进行入库
- 前端请求的数据直接来自数据库，没有进行转义
- 前端生成 DOM 时，没有对后端返回的数据进行检查

存储型的 XSS 有以下几个特点：

- 持久性，植入在数据库中
- 危害面广，甚至可以让用户机器变成 DDoS 攻击的肉鸡
- 盗取用户敏感私密信息

#### 反射型 XSS

反射型 XSS 漏洞常见于通过 URL 传递参数的功能，如网站搜索、跳转等，由于需要用户主动打开恶意的 URL 才能生效，攻击者往往会结合多种手段诱导用户点击（比如邮件发送攻击链接等）。XSS 攻击的步骤大致如下图所示：

![](/images/web-security/1.jpg)

POST 的内容也可以触发反射型 XSS，只不过其触发条件比较苛刻（需要构造表单提交页面，并引导用户点击），所以非常少见。

假设服务端的代码如下图所示，服务端根据 URL 参数返回搜索的值和搜索结果，这样的场景跟百度或者谷歌的搜索框是一样的：

```javascript
const getData = ctx.query;
ctx.body = `
  <div>
    <p>你的搜索是：</p>
    ${getData.search}
    <p>搜索结果是：... ...</p>
  </div>	
`;
```

乍一看好像没什么问题，正常的请求应该类似是这样的：`http://api.ceshi.cn/xss?search=NormalData`，这时前端的 `HTML` 将正常显示。

```html
<div>
  <p>你的搜索是：</p>
  NormalData
  <p>搜索结果是：... ...</p>
</div>	
```

然而攻击者可以构造一条这样的请求，诱导普通用户进行点击：`http://api.ceshi.cn/xss?search=<img onerror="alert('执行侵入代码')" src="x">`，这时服务端会返回代码侵入代码的脚本到用户，并且执行。

```html
<div>
  <p>你的搜索是：</p>
  <img onerror="alert('执行侵入代码')" src="x">
  <p>搜索结果是：... ...</p>
</div>	
```

可以看到 `HTML` 中被插入了侵入的节点，因为 `img` 标签在 `src` 属性无效的情况下，会执行 `onerror` 中的 js 代码，通常攻击者会在这段脚本中获取用户登录的 `cookie` 等信息。

#### DOM 型 XSS

反射型的 XSS 攻击是属于服务端的安全漏洞，不过通过创建不受控的 DOM 节点的方式进行攻击也可以完全在浏览器端完成，这种完全通过浏览器端取出和执行恶意代码的攻击方式就属于 DOM 型的 XSS。 特别是目前大量流行的框架都是前后端分离， DOM 型的 XSS 会更加的常见。

DOM 型的 XSS 攻击原理同反射型的类似，只需要把【Web 应用程序】改成 【客户端程序】 即可。这里不进行过多的赘述了。

#### XSS 攻击的预防

通过以上的分析，可以得到，XSS 攻击有两大要素：

- 攻击者提交恶意代码
- 浏览器执行恶意代码

所以防御可以从以上两点入手，包括检测用户输入和检测 HTML 的输出：

- 输入检测，用户的所有输入都不应该信任。
  不过这种防范策略是有局限性的，更多的是对于有明确的输入类型的数据进行检测，比如数字，URL，电话、邮箱等内容。但是大部分时候我们并没有明确的输入类型限定，也不希望转义用户的输入，而是保留用户的原始数据。这时候就需要检测 HTML 的输出环节了。

- 采用前后端分离的方式，数据和代码分割开。

  在前端渲染时明确的告诉浏览器，从后端获取的数据以纯文本的方式进行展示，或者明确的设置属性、样式等，这样可以避免存储型和反射型的 XSS 攻击，但依然需要考虑 DOM 型的XSS攻击。

- 后端对输出的 HTML 进行充分转义。这样可以避免存储型和反射型的 XSS 攻击。

- 前端对输出的 HTML 进行充分转义。DOM 型 XSS 攻击，实际上就是因为前端的 `JavaScript` 代码不够严谨造成的。

其他 XSS 防范的措施：

第一点就是 [CSP](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/CSP) 策略。Content Security Policy，简称 CSP。顾名思义，这个规范与内容安全有关，主要是用来定义页面可以加载哪些资源，减少 XSS 的发生。CSP的策略可以通过 HTTP 头或者 meta 元素进行定义，具体的用法，网上有很多其他教程，这里不做叙述了。

通过严格的 CSP 策略在 XSS 防范中可以起到一下作用：

1. 禁止加载外域的代码，可以有效防止复杂的攻击逻辑
2. 禁止外域提交，也就是说就算站点被攻击，截获的用户信息也没法传输到攻击者
3. 利用 `Content-Security-Policy-Report-Only` 字段可以上报并及时发现 XSS 漏洞

第二点是限制内容长度，通过 CSP 策略已经限制了外域的代码，再通过限制用户输入长度，达到限制侵入脚本大小的目的，可以大大增加攻击的难度。

第三点是对于可能存在的风险提交进行验证码校验。

第四点是对于关键的 `Cookie` 增加 `HTTPOnly` 的限制，这样就算攻击者成功注入恶意脚本，也无法窃取此 `Cookie`。

可以看到 `github.com` 就使用了上述的这些策略。

![](/images/web-security/4.png)

### CSRF

CSRF（Cross-site request forgery）跨站请求伪造：攻击者诱导受害者进入第三方网站，在第三方网站中，向被攻击网站发送跨站请求。利用受害者在被攻击网站已经获取的注册凭证，绕过后台的用户验证，达到冒充用户对被攻击的网站执行某项操作的目的。
一个典型的 CSRF 攻击包括了如下的这样一些步骤。

![](/images/web-security/2.jpg)

#### GET 类型的 CSRF





### 参考文档
[常见 Web 安全攻防总结](https://zoumiaojiang.com/article/common-web-security/)
[前端安全系列（一）：如何防止XSS攻击](https://tech.meituan.com/2018/09/27/fe-security.html)
[前端安全系列（二）：如何防止CSRF攻击](https://tech.meituan.com/2018/10/11/fe-security-csrf.html)