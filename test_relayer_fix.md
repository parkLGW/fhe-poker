# 🔧 Relayer连接问题修复测试指南

## 问题诊断结果

### 根本原因
1. **Relayer URL配置错误**: FHEVM直接访问外部URL而不是使用本地代理
2. **CORS和Cloudflare WAF阻拦**: 直接访问被防火墙阻止
3. **SDK版本不匹配**: CDN版本与Vite代理配置不兼容

### 已应用的修复

#### ✅ 修复1: 更新Relayer URL配置
- **文件**: `frontend/src/lib/fhevm.ts` (第86行)
- **修改**: `relayerUrl: window.location.origin + '/relayer'`
- **效果**: 使用本地代理而不是直接访问外部URL

#### ✅ 修复2: 改进SDK加载逻辑
- **文件**: `frontend/src/lib/fhevm.ts` (第14-47行)
- **修改**: 优先尝试npm包版本，失败时回退到CDN版本
- **效果**: 提供更好的兼容性

#### ✅ 修复3: 注释CDN脚本
- **文件**: `frontend/index.html` (第10行)
- **修改**: 准备切换到npm包版本
- **效果**: 避免版本冲突

## 测试步骤

### 步骤1: 安装npm包版本 (可选但推荐)
```bash
cd frontend
npm install @zama-fhe/relayer-sdk
```

### 步骤2: 重启前端服务器
```bash
# 完全停止当前服务器 (Ctrl+C)
npm run dev
```

### 步骤3: 清除浏览器缓存
- 按 `Ctrl+Shift+Delete` (Windows) 或 `Cmd+Shift+Delete` (Mac)
- 选择"缓存的图片和文件"
- 点击"清除数据"

### 步骤4: 测试FHEVM初始化
1. 打开 `http://localhost:5173/`
2. 按 `F12` 打开开发者工具
3. 查看Console标签

**预期成功日志**:
```
🔍 加载 npm 版本的 Relayer SDK...
✅ npm 版本 Relayer SDK 已加载
🔍 浏览器兼容性检查: { ... }
✅ FHEVM initialized for chain: 11155111
```

**如果看到回退日志**:
```
⚠️ npm 版本不可用，回退到 CDN 版本...
✅ CDN 版本 Relayer SDK 已加载
✅ FHEVM initialized for chain: 11155111
```

### 步骤5: 测试加入游戏功能
1. 连接钱包 (确保在Sepolia测试网)
2. 创建或选择一个游戏桌
3. 点击"加入游戏"
4. 输入买入金额 (如1000)
5. 点击"确认"

**预期成功日志**:
```
🔐 开始加密买入金额...
🔐 加密完成: { encryptedAmountLength: 32, inputProofLength: ... }
✅ 成功加入游戏！
```

## 故障排查

### 问题1: 仍然看到CORS错误
**解决方案**:
```bash
# 1. 完全重启前端
npm run dev

# 2. 强制刷新浏览器
# 按 Ctrl+F5 (Windows) 或 Cmd+Shift+R (Mac)
```

### 问题2: "Failed to resolve entry for package"
**解决方案**:
```bash
# 删除Vite缓存
rm -rf node_modules/.vite
npm run dev
```

### 问题3: 仍然出现400错误
**检查代理是否工作**:
```javascript
// 在浏览器控制台运行
fetch('http://localhost:5173/relayer/v1/keyurl')
  .then(r => {
    console.log('代理状态码:', r.status);
    return r.text();
  })
  .then(t => console.log('代理响应:', t))
  .catch(e => console.log('代理错误:', e))
```

### 问题4: npm包安装失败
**回退到CDN版本**:
1. 恢复 `frontend/index.html` 中的CDN脚本
2. 修改 `frontend/src/lib/fhevm.ts` 中的loadSDK函数直接使用CDN版本

## 验证清单

- [ ] 前端服务器正常启动 (http://localhost:5173)
- [ ] 浏览器控制台没有CORS错误
- [ ] FHEVM初始化成功 (看到"✅ FHEVM initialized"日志)
- [ ] 钱包连接正常
- [ ] 能够创建游戏桌
- [ ] 能够加入游戏 (不出现400错误)
- [ ] 加密功能正常工作

## 预期结果

修复后，加入游戏时应该看到：
```
🔐 开始加密买入金额...
🔐 加密完成: { ... }
✅ 成功加入游戏！
🎮 即将进入游戏页面，tableId: 0
```

而不是：
```
❌ 加入失败: Error: Relayer didn't response correctly. Bad status . Content: {"message":"Transaction rejected: \"Input request failed: Transaction failed: Transaction failed: Failed to check contract code: backend connection task has stopped\""}
```

## 联系支持

如果问题仍然存在：
1. 收集完整的浏览器控制台日志
2. 检查网络标签中的请求详情
3. 查看Zama社区论坛: https://community.zama.ai/
4. 联系Zama Discord: https://discord.com/invite/zama
