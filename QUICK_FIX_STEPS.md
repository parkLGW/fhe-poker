# 快速修复步骤

## 问题

前端启动时出现 Relayer 连接错误：
```
FHEVM初始化失败: Error: Relayer didn't respond correctly. Bad JSON.
CORS policy: No 'Access-Control-Allow-Origin' header
```

## 解决方案已应用

✅ **Vite 代理配置已添加**

文件: `frontend/vite.config.ts`

```typescript
server: {
  proxy: {
    '/relayer': {
      target: 'https://relayer.testnet.zama.cloud',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/relayer/, ''),
    },
  },
}
```

---

## 现在需要做的

### 1. 刷新浏览器页面

访问: http://localhost:5173/

**按 Ctrl+F5** (强制刷新，清除缓存)

### 2. 查看浏览器控制台

打开开发者工具: **F12** 或 **Cmd+Option+I**

### 3. 查看日志

应该看到以下日志序列：

```
✅ SDK 初始化完成
✅ FHEVM 实例创建成功
✅ FHEVM initialized for chain: 11155111
```

### 4. 连接钱包

1. 点击"连接钱包"按钮
2. 选择 MetaMask
3. 确保连接到 **Sepolia 测试网**

### 5. 开始测试

按照 [TESTING_GUIDE.md](./TESTING_GUIDE.md) 进行测试

---

## 如果仍然有错误

### 检查清单

- [ ] 前端服务器是否在运行 (http://localhost:5173/)
- [ ] 是否进行了强制刷新 (Ctrl+F5)
- [ ] 浏览器控制台是否显示 FHEVM 初始化成功
- [ ] 钱包是否连接到 Sepolia 测试网
- [ ] 网络连接是否正常

### 常见问题

**问题**: 仍然看到 CORS 错误

**解决**:
1. 完全关闭前端服务器 (Ctrl+C)
2. 重新启动: `npm run dev`
3. 清除浏览器缓存 (Ctrl+Shift+Delete)
4. 刷新页面 (Ctrl+F5)

**问题**: 看到 "crossOriginIsolated = false"

**解决**:
1. 使用最新版本的浏览器
2. 尝试隐私模式
3. 清除浏览器数据

**问题**: 仍然无法连接 Relayer

**解决**:
1. 检查网络连接
2. 等待 Relayer 服务恢复
3. 参考 [RELAYER_ISSUE_FIX.md](./RELAYER_ISSUE_FIX.md)

---

## 预期结果

修复后，应该能够：

1. ✅ 前端正常加载
2. ✅ FHEVM 初始化成功
3. ✅ 钱包连接成功
4. ✅ 可以创建游戏桌
5. ✅ 可以加入游戏
6. ✅ 可以开始游戏
7. ✅ **可以下注（关键测试）**

---

## 下一步

1. 刷新浏览器页面
2. 查看控制台日志
3. 连接钱包
4. 按照 [TESTING_GUIDE.md](./TESTING_GUIDE.md) 进行测试

---

**修复状态**: ✅ **已应用**
**测试状态**: 📋 **待进行**

