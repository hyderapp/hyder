## 使用说明


```shell
yarn add --dev eslint eslint-config-hyder
```


在`.eslintrc`中配置

```js
{
  extends: 'hyder',
  rules: {
    // custom rules
  }
}
```

在`package.json`中配置

```json
{
  "scripts": {
    "lint": "eslint src"
  }
}
```

然后就可以`yarn lint`来检测代码了。

使用 `yarn lint --fix` 自动修复一些格式不规范的点。
