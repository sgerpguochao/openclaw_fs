# Agent Browser 测试案例

## 测试目标

验证 `agent-browser` Skill 是否正常工作。

## 测试结果

✅ **所有测试通过！**

---

## 测试执行

### 1. 打开网页

```bash
$ agent-browser open https://example.com

✓ Example Domain
  https://example.com/
```

**结果**: ✅ 成功

---

### 2. 获取页面快照（交互元素）

```bash
$ agent-browser snapshot -i

- link "Learn more" [ref=e1]
```

**结果**: ✅ 成功 - 识别出页面中的交互元素

---

### 3. 获取页面标题

```bash
$ agent-browser get title

Example Domain
```

**结果**: ✅ 成功

---

### 4. 截图

```bash
$ agent-browser screenshot /tmp/test-page.png

✓ Screenshot saved to /tmp/test-page.png
```

**结果**: ✅ 成功 - 截图文件大小 17115 字节

---

### 5. 关闭浏览器

```bash
$ agent-browser close

✓ Browser closed
```

**结果**: ✅ 成功

---

## 测试总结

| 测试项 | 状态 |
|--------|------|
| 打开网页 | ✅ 通过 |
| 页面快照 | ✅ 通过 |
| 获取标题 | ✅ 通过 |
| 截图保存 | ✅ 通过 |
| 关闭浏览器 | ✅ 通过 |

---

## 使用的命令

```bash
# 安装
npm install -g agent-browser
agent-browser install

# 测试命令
agent-browser open <url>
agent-browser snapshot -i
agent-browser get title
agent-browser screenshot <file>
agent-browser close
```
