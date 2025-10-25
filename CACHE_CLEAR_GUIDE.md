# 浏览器缓存清除指南

## ⚠️ 重要

修改了前端代码后，**必须清除浏览器缓存**，否则浏览器会继续使用旧的代码！

## 🔧 清除缓存的方法

### 方法 1: Chrome/Edge 快速清除（推荐）

1. **打开开发者工具**
   - Windows: `F12` 或 `Ctrl+Shift+I`
   - Mac: `Cmd+Option+I`

2. **打开 Application 标签**
   - 点击顶部的 "Application" 标签

3. **清除 Cache Storage**
   - 左侧菜单 → "Cache Storage"
   - 右键点击所有缓存条目 → "Delete"

4. **清除 Local Storage**
   - 左侧菜单 → "Local Storage"
   - 右键点击 "http://localhost:5173" → "Clear"

5. **刷新页面**
   - `Ctrl+F5` (Windows) 或 `Cmd+Shift+R` (Mac)

### 方法 2: 完整清除（最彻底）

1. **打开清除浏览数据对话框**
   - Windows: `Ctrl+Shift+Delete`
   - Mac: `Cmd+Shift+Delete`

2. **选择清除选项**
   - 时间范围: "所有时间"
   - 勾选:
     - ✅ Cookies 和其他网站数据
     - ✅ 缓存的图片和文件
     - ✅ 应用程序缓存

3. **点击"清除数据"**

4. **刷新页面**
   - `Ctrl+F5` (Windows) 或 `Cmd+Shift+R` (Mac)

### 方法 3: 使用无痕模式（最简单）

1. **打开无痕窗口**
   - Windows: `Ctrl+Shift+N`
   - Mac: `Cmd+Shift+N`

2. **访问应用**
   - 在无痕窗口中访问 `http://localhost:5173/`

3. **测试功能**
   - 无痕模式不会使用任何缓存

## 🔄 重启前端服务

即使清除了缓存，也建议重启前端服务以确保加载最新的代码：

```bash
# 停止当前的前端服务 (Ctrl+C)

# 重新启动
cd frontend
npm run dev
```

## ✅ 验证缓存已清除

1. **打开开发者工具** (F12)
2. **切换到 Console 标签**
3. **刷新页面** (Ctrl+F5)
4. **查看日志**
   - 应该看到新的日志信息
   - 如果看到旧的日志，说明缓存还没清除

## 🧪 测试步骤

1. **清除缓存**（按上述方法）
2. **重启前端服务**
   ```bash
   cd frontend
   npm run dev
   ```
3. **打开浏览器开发者工具** (F12)
4. **访问应用** `http://localhost:5173/`
5. **连接钱包**
6. **创建/加入游戏**
7. **开始游戏**
8. **点击"加注"**
9. **查看控制台日志**
   - 应该看到新的加密日志
   - 检查地址是否正确

## 📊 预期日志

清除缓存后，应该看到类似的日志：

```
🔐 encryptBetAmount 参数: {
  amount: 100,
  contractAddr: "0x0699b2fFc94782D66808a472872ED8319e92A60d",
  userAddr: "0xd76c72551dF78318Fcbe0Dd9E816bFf4B113eE1b"
}

🔐 开始加密 uint64: {
  value: 100,
  contractAddress: "0x0699b2fFc94782D66808a472872ED8319e92A60d",
  userAddress: "0xd76c72551dF78318Fcbe0Dd9E816bFf4B113eE1b"
}

🔐 加密结果 - 完整对象: {
  keys: [...],
  handles: [Uint8Array(32)],
  inputProof: Uint8Array(...)
}
```

## 🚨 常见问题

### Q: 清除缓存后还是不行？
A: 
1. 确保前端服务已重启
2. 检查浏览器控制台是否有错误
3. 尝试使用无痕模式
4. 检查合约地址是否正确

### Q: 如何确认代码已更新？
A:
1. 打开开发者工具 (F12)
2. 切换到 Sources 标签
3. 找到 `useFHEVM.ts` 文件
4. 检查代码是否包含新的注释和修改

### Q: 为什么还是报错？
A:
1. 检查浏览器控制台的完整错误信息
2. 查看加密日志中的地址是否正确
3. 确保合约地址与前端配置一致

## 📝 总结

1. **清除浏览器缓存** - 最重要！
2. **重启前端服务** - 确保加载最新代码
3. **打开开发者工具** - 查看日志
4. **重新测试** - 验证修复是否有效

