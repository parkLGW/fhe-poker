# 🎮 FHE Poker - 隐私链上德州扑克

基于FHEVM (全同态加密虚拟机) 的完全链上德州扑克游戏，手牌完全加密，保证游戏公平性和隐私性。

## ✨ 特性

- 🔐 **完全隐私**: 使用全同态加密(FHE)，手牌在链上完全加密
- 🎲 **可证明公平**: 链上随机数生成，无法作弊
- ⚡ **实时游戏**: 支持2-6人同时游戏
- 🛡️ **安全结算**: 异步解密机制保证结算安全
- 🎯 **完全链上**: 所有游戏逻辑在智能合约中执行

## Quick Start

For detailed instructions see:
[FHEVM Hardhat Quick Start Tutorial](https://docs.zama.ai/protocol/solidity-guides/getting-started/quick-start-tutorial)

### Prerequisites

- **Node.js**: Version 20 or higher
- **npm or yarn/pnpm**: Package manager

### Installation

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Set up environment variables**

   ```bash
   npx hardhat vars set MNEMONIC

   # Set your Infura API key for network access
   npx hardhat vars set INFURA_API_KEY

   # Optional: Set Etherscan API key for contract verification
   npx hardhat vars set ETHERSCAN_API_KEY
   ```

3. **Compile and test**

   ```bash
   npm run compile
   npm run test
   ```

4. **Deploy to local network**

   ```bash
   # Start a local FHEVM-ready node
   npx hardhat node
   # Deploy to local network
   npx hardhat deploy --network localhost
   ```

5. **Deploy to Sepolia Testnet**

   ```bash
   # Deploy to Sepolia
   npx hardhat deploy --network sepolia
   # Verify contract on Etherscan
   npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
   ```

6. **Test on Sepolia Testnet**

   ```bash
   # Once deployed, you can run a simple test on Sepolia.
   npx hardhat test --network sepolia
   ```

## 📁 Project Structure

```
fhe-poker/
├── contracts/              # 智能合约
│   ├── PokerTable.sol     # 主游戏合约
│   └── libraries/         # 辅助库
├── test/                  # 测试文件
├── tasks/                 # Hardhat任务
├── deploy/                # 部署脚本
├── frontend/              # 前端应用 (待开发)
└── docs/                  # 文档
```

## 🎮 游戏规则

### 德州扑克基础规则

1. **发牌**: 每位玩家获得2张加密手牌
2. **下注轮次**: Pre-flop → Flop → Turn → River
3. **摊牌**: 所有下注完成后，比较牌型大小
4. **结算**: 最大牌型获胜者获得奖池

### 牌型大小 (从大到小)

1. 皇家同花顺 2. 同花顺 3. 四条 4. 葫芦 5. 同花
6. 顺子 7. 三条 8. 两对 9. 一对 10. 高牌

## 📜 Available Scripts

| Script             | Description              |
| ------------------ | ------------------------ |
| `npm run compile`  | Compile all contracts    |
| `npm run test`     | Run all tests            |
| `npm run coverage` | Generate coverage report |
| `npm run lint`     | Run linting checks       |
| `npm run clean`    | Clean build artifacts    |

## 📚 Documentation

- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [FHEVM Hardhat Setup Guide](https://docs.zama.ai/protocol/solidity-guides/getting-started/setup)
- [FHEVM Testing Guide](https://docs.zama.ai/protocol/solidity-guides/development-guide/hardhat/write_test)
- [FHEVM Hardhat Plugin](https://docs.zama.ai/protocol/solidity-guides/development-guide/hardhat)

## 📄 License

This project is licensed under the BSD-3-Clause-Clear License. See the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/zama-ai/fhevm/issues)
- **Documentation**: [FHEVM Docs](https://docs.zama.ai)
- **Community**: [Zama Discord](https://discord.gg/zama)

## 🔐 安全性

- 手牌使用 `euint8` 类型完全加密
- ACL (访问控制列表) 确保玩家只能访问自己的手牌
- 链上随机数生成保证发牌公平性
- 异步解密机制防止抢跑攻击

## 🔧 技术栈

- **智能合约**: Solidity ^0.8.24
- **FHE库**: @fhevm/solidity
- **开发框架**: Hardhat
- **测试**: Chai + Ethers.js

---

**当前开发状态**: 🎮 MVP核心功能完成 (60%)

- ✅ 智能合约核心逻辑完成 (840行)
- ✅ 所有测试通过 (13个测试用例)
- ✅ 完整游戏流程可运行
- ✅ 前端开发计划已制定
- 🚀 准备开始前端开发或部署测试

**快速链接**:
- [CURRENT_STATUS.md](CURRENT_STATUS.md) - 📊 当前状态详细说明
- [PROJECT_PLAN.md](../PROJECT_PLAN.md) - 📋 总体开发计划
- [docs/FRONTEND_PLAN.md](docs/FRONTEND_PLAN.md) - 🎨 前端开发详细计划
- [PROGRESS.md](PROGRESS.md) - 📈 实时进度追踪
- [docs/DESIGN.md](docs/DESIGN.md) - 🏗️ 技术设计文档
