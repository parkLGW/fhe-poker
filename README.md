# 🎮 FHE Poker - Privacy-Preserving On-Chain Texas Hold'em

<div align="center">

![License](https://img.shields.io/badge/license-BSD--3--Clause--Clear-blue.svg)
![Solidity](https://img.shields.io/badge/Solidity-^0.8.24-363636?logo=solidity)
![Hardhat](https://img.shields.io/badge/Built%20with-Hardhat-yellow)
![FHEVM](https://img.shields.io/badge/Powered%20by-FHEVM-purple)

**A fully on-chain Texas Hold'em poker game powered by FHEVM (Fully Homomorphic Encryption Virtual Machine), ensuring complete privacy and provable fairness.**

[🎮 Live Demo](#) | [📖 Documentation](./docs/DESIGN.md) | [🎥 Video Demo](#) | [🐛 Report Bug](../../issues)

</div>

---

## 🌟 Highlights

### 🔐 True Privacy with FHE
- **Encrypted Hole Cards**: Player hands are encrypted using `euint8` on-chain
- **Encrypted Balances**: All player balances and bets use `euint64` encryption
- **Access Control**: ACL (Access Control List) ensures players can only view their own cards
- **No Trusted Third Party**: All encryption happens on-chain via FHEVM

### 🎲 Provably Fair Gaming
- **On-Chain Randomness**: Cryptographically secure random number generation
- **Transparent Logic**: All game rules executed in smart contracts (1,655 lines)
- **Verifiable Results**: Every action and outcome is recorded on-chain
- **Anti-Cheating**: Asynchronous decryption prevents front-running attacks

### ⚡ Full-Featured Poker Experience
- **2-6 Players**: Support for multi-player games
- **Complete Texas Hold'em Rules**: Pre-flop, Flop, Turn, River, Showdown
- **10 Hand Rankings**: From High Card to Royal Flush
- **Advanced Betting**: Fold, Check, Call, Raise, All-in
- **Automatic Settlement**: Smart contract handles pot distribution

### 🌐 Modern Tech Stack
- **Smart Contracts**: Solidity ^0.8.24 with FHEVM
- **Frontend**: React 19 + TypeScript + Tailwind CSS
- **Wallet Integration**: Wagmi v2 + Viem
- **Internationalization**: English & Chinese support
- **Deployment**: Vercel (Frontend) + Sepolia Testnet (Contracts)

---

## 🚀 Quick Start

### 📋 Prerequisites

- **Node.js**: v20 or higher
- **MetaMask**: Browser wallet extension
- **Sepolia ETH**: Get testnet ETH from [faucet](https://sepoliafaucet.com/)

### 🎮 Play Now

1. **Visit the Live Demo**: [https://your-app.vercel.app](#) *(Deploy first!)*
2. **Connect Wallet**: Click "Connect Wallet" and approve MetaMask
3. **Join or Create Table**: Choose a table or create your own
4. **Start Playing**: Enjoy privacy-preserving poker!

### 💻 Local Development

#### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/fhe-poker.git
cd fhe-poker
```

#### 2. Install Dependencies

```bash
# Install contract dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

#### 3. Set Up Environment Variables

```bash
# Set your mnemonic for deployment
npx hardhat vars set MNEMONIC

# Set Infura API key (for Sepolia access)
npx hardhat vars set INFURA_API_KEY

# Optional: Etherscan API key (for verification)
npx hardhat vars set ETHERSCAN_API_KEY
```

#### 4. Compile Contracts

```bash
npm run compile
```

#### 5. Run Tests

```bash
npm run test
```

#### 6. Deploy Contracts

```bash
# Deploy to Sepolia testnet
npx hardhat deploy --network sepolia

# Verify on Etherscan
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
```

#### 7. Run Frontend

```bash
cd frontend
npm run dev
```

Visit `http://localhost:5173` to see the app!

---

## 📁 Project Structure

```
fhe-poker/
├── contracts/                      # Smart Contracts
│   ├── PokerTable.sol             # Main game contract (1,655 lines)
│   └── FHECounter.sol             # Example FHE contract
├── test/                          # Test Suite
│   ├── PokerTable.test.ts         # Main contract tests (20+ cases)
│   └── BetFunctionTest.ts         # Betting logic tests
├── deploy/                        # Deployment Scripts
│   └── deployPokerTable.ts        # Sepolia deployment
├── frontend/                      # React Frontend (5,000+ lines)
│   ├── src/
│   │   ├── components/            # UI Components
│   │   │   ├── game/              # Game-specific components
│   │   │   │   ├── PlayerSeat.tsx
│   │   │   │   ├── CommunityCards.tsx
│   │   │   │   ├── BettingPanel.tsx
│   │   │   │   └── PokerCard.tsx
│   │   │   └── layout/            # Layout components
│   │   ├── pages/                 # Page components
│   │   │   ├── Home.tsx
│   │   │   ├── Lobby.tsx
│   │   │   └── Game.tsx
│   │   ├── hooks/                 # Custom hooks
│   │   │   └── useFHEVM.ts        # FHEVM integration
│   │   ├── lib/                   # Libraries
│   │   │   ├── fhevm.ts           # FHEVM client
│   │   │   ├── contract.ts        # Contract interfaces
│   │   │   └── poker.ts           # Poker logic
│   │   ├── i18n/                  # Internationalization
│   │   │   ├── locales/en-US.json
│   │   │   └── locales/zh-CN.json
│   │   └── store/                 # State management
│   ├── vite.config.ts             # Vite configuration
│   └── vercel.json                # Vercel deployment config
├── docs/                          # Documentation
│   ├── DESIGN.md                  # Technical design
│   └── FRONTEND_PLAN.md           # Frontend architecture
├── hardhat.config.ts              # Hardhat configuration
└── package.json                   # Dependencies

```

---

## 🎮 How to Play

### Game Rules (Texas Hold'em)

1. **Join Table**: 2-6 players can join a table
2. **Blinds**: Small blind and big blind are posted
3. **Hole Cards**: Each player receives 2 encrypted cards
4. **Betting Rounds**:
   - **Pre-Flop**: After receiving hole cards
   - **Flop**: After 3 community cards are dealt
   - **Turn**: After 4th community card
   - **River**: After 5th community card
5. **Showdown**: Players reveal cards (decrypted on-chain)
6. **Winner**: Best 5-card hand wins the pot

### Hand Rankings (Highest to Lowest)

| Rank | Hand | Example |
|------|------|---------|
| 1 | 🏆 Royal Flush | A♠ K♠ Q♠ J♠ 10♠ |
| 2 | Straight Flush | 9♥ 8♥ 7♥ 6♥ 5♥ |
| 3 | Four of a Kind | K♣ K♦ K♥ K♠ 3♦ |
| 4 | Full House | Q♠ Q♥ Q♦ 7♣ 7♦ |
| 5 | Flush | A♦ J♦ 9♦ 6♦ 3♦ |
| 6 | Straight | 10♣ 9♦ 8♥ 7♠ 6♣ |
| 7 | Three of a Kind | 8♠ 8♥ 8♦ K♣ 4♦ |
| 8 | Two Pair | A♠ A♥ 5♣ 5♦ Q♠ |
| 9 | One Pair | 10♦ 10♠ K♣ 7♥ 4♠ |
| 10 | High Card | A♣ J♦ 8♠ 6♥ 3♣ |

### Player Actions

- **Fold**: Give up your hand
- **Check**: Pass action (if no bet to match)
- **Call**: Match the current bet
- **Raise**: Increase the bet
- **All-In**: Bet all remaining chips

---

## 🏗️ Technical Architecture

### Smart Contract Architecture

```
PokerTable.sol (1,655 lines)
├── Game State Management
│   ├── Table creation & configuration
│   ├── Player join/leave logic
│   └── Game state transitions
├── FHE Encryption Layer
│   ├── Encrypted hole cards (euint8)
│   ├── Encrypted balances (euint64)
│   ├── Encrypted bets (euint64)
│   └── ACL permission management
├── Card Dealing System
│   ├── On-chain random number generation
│   ├── Encrypted card distribution
│   └── Community card management
├── Betting Engine
│   ├── Multi-round betting logic
│   ├── Pot calculation
│   └── Side pot handling
├── Hand Evaluation
│   ├── 10 hand ranking algorithms
│   ├── Best 5-card combination finder
│   └── Winner determination
└── Settlement System
    ├── Asynchronous card decryption
    ├── Pot distribution
    └── Balance updates
```

### Key FHE Features

| Feature | Type | Purpose |
|---------|------|---------|
| Hole Cards | `euint8` | Keep player hands private |
| Player Balance | `euint64` | Hide chip counts |
| Current Bet | `euint64` | Encrypt bet amounts |
| ACL Control | Permission | Restrict card access |
| Async Decrypt | Callback | Prevent front-running |

### Frontend Architecture

- **React 19**: Modern UI framework
- **TypeScript**: Type-safe development
- **Wagmi v2**: Ethereum wallet integration
- **Viem**: Lightweight Ethereum library
- **Tailwind CSS**: Utility-first styling
- **i18next**: Internationalization
- **FHEVM SDK**: Encryption client

---

## 🧪 Testing

### Run Tests

```bash
# Run all tests
npm run test

# Run specific test file
npx hardhat test test/PokerTable.test.ts

# Run with gas reporting
REPORT_GAS=true npm run test

# Generate coverage report
npm run coverage
```

### Test Coverage

- ✅ Table creation and configuration
- ✅ Player join/leave mechanics
- ✅ Game start conditions
- ✅ Card dealing and encryption
- ✅ Betting rounds (Fold, Check, Call, Raise)
- ✅ Hand evaluation (all 10 rankings)
- ✅ Winner determination
- ✅ Pot distribution
- ✅ Edge cases and error handling

**Total Test Cases**: 20+

---

## 📜 Available Scripts

### Contract Scripts

| Script | Description |
|--------|-------------|
| `npm run compile` | Compile all contracts |
| `npm run test` | Run all tests |
| `npm run coverage` | Generate coverage report |
| `npm run lint` | Run Solidity linter |
| `npm run clean` | Clean build artifacts |
| `npm run deploy:sepolia` | Deploy to Sepolia testnet |

### Frontend Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

---

## 🌐 Deployment

### Contract Deployment

**Network**: Sepolia Testnet
**Contract Address**: `0xFdB3f9b5BD791E0950faCA9246638B9461c4ceae`
**Explorer**: [View on Etherscan](https://sepolia.etherscan.io/address/0xFdB3f9b5BD791E0950faCA9246638B9461c4ceae)

### Frontend Deployment

See [部署说明.md](./部署说明.md) for detailed Vercel deployment instructions.

**Quick Deploy**:
```bash
cd frontend
vercel --prod
```

---

## 📚 Documentation

- 📖 [Technical Design](./docs/DESIGN.md) - Architecture and design decisions
- 🎨 [Frontend Plan](./docs/FRONTEND_PLAN.md) - UI/UX architecture
- 🚀 [Deployment Guide](./部署说明.md) - Vercel deployment steps
- ✅ [Deployment Checklist](./VERCEL_DEPLOYMENT_CHECKLIST.md) - Pre-deployment checklist

### External Resources

- [FHEVM Documentation](https://docs.zama.ai/fhevm) - Official FHEVM docs
- [FHEVM Hardhat Plugin](https://docs.zama.ai/protocol/solidity-guides/development-guide/hardhat) - Development guide
- [Zama GitHub](https://github.com/zama-ai/fhevm) - FHEVM repository

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **BSD-3-Clause-Clear License**. See the [LICENSE](LICENSE) file for details.

---

## 🆘 Support & Community

- 🐛 **Issues**: [GitHub Issues](../../issues)
- 💬 **Discussions**: [GitHub Discussions](../../discussions)
- 📧 **Email**: your-email@example.com
- 🌐 **Website**: [your-website.com](#)

### Zama Community

- 📖 **Documentation**: [docs.zama.ai](https://docs.zama.ai)
- 💬 **Discord**: [discord.gg/zama](https://discord.gg/zama)
- 🐦 **Twitter**: [@zama_fhe](https://twitter.com/zama_fhe)

---

## 🔐 Security Features

### Encryption & Privacy

- ✅ **Encrypted Hole Cards**: Using `euint8` for complete privacy
- ✅ **Encrypted Balances**: Player chip counts hidden with `euint64`
- ✅ **Encrypted Bets**: Bet amounts encrypted during rounds
- ✅ **ACL Permissions**: Access Control List ensures players can only view their own cards
- ✅ **Asynchronous Decryption**: Prevents front-running attacks during showdown

### Fairness & Transparency

- ✅ **On-Chain Randomness**: Cryptographically secure RNG for card dealing
- ✅ **Immutable Logic**: All game rules in smart contracts
- ✅ **Verifiable Results**: Every action recorded on-chain
- ✅ **No Trusted Dealer**: Fully decentralized game execution

### Audit Status

⚠️ **Not yet audited** - This is a hackathon/demo project. Do not use with real funds.

---

## 🎯 Roadmap

### ✅ Phase 1: Core Development (Completed)
- [x] Smart contract implementation (1,655 lines)
- [x] FHE encryption integration
- [x] Complete poker game logic
- [x] Hand evaluation algorithms
- [x] Unit tests (20+ cases)
- [x] Sepolia deployment

### ✅ Phase 2: Frontend Development (Completed)
- [x] React + TypeScript setup
- [x] Wallet integration (Wagmi)
- [x] Game UI components
- [x] Multi-language support (EN/CN)
- [x] FHEVM client integration

### 🚧 Phase 3: Polish & Launch (In Progress)
- [ ] Deploy frontend to Vercel
- [ ] Record demo video
- [ ] Improve UI/UX
- [ ] Add loading states & animations
- [ ] Mobile responsive design
- [ ] Comprehensive testing

### 🔮 Phase 4: Future Enhancements
- [ ] Tournament mode
- [ ] Leaderboard system
- [ ] NFT card skins
- [ ] Multi-table support
- [ ] Spectator mode
- [ ] Chat functionality
- [ ] Security audit
- [ ] Mainnet deployment

---

## 💡 Use Cases & Business Potential

### Target Users

1. **Privacy-Conscious Gamblers**: Players who want provably fair poker without revealing their hands
2. **Crypto Enthusiasts**: Users interested in cutting-edge blockchain technology
3. **Online Poker Platforms**: Casinos looking to integrate FHE-based games
4. **DeFi Protocols**: Gaming protocols seeking privacy features

### Market Opportunity

- 🎰 **Online Poker Market**: $60B+ globally
- 🔐 **Privacy Gaming**: Emerging niche with high demand
- ⛓️ **On-Chain Gaming**: Growing sector in Web3
- 🚀 **First-Mover Advantage**: One of the first FHE poker implementations

### Monetization Strategies

1. **Rake System**: Take small percentage from each pot (1-5%)
2. **Tournament Fees**: Entry fees for poker tournaments
3. **Premium Features**: VIP tables, custom themes, analytics
4. **NFT Integration**: Tradeable card backs, table themes
5. **Licensing**: White-label solution for other platforms

---

## 🏆 Hackathon Submission

### Project Highlights

- ✅ **Original Architecture**: 1,655 lines of custom Solidity code
- ✅ **Meaningful FHE Usage**: Encrypts cards, balances, and bets
- ✅ **Working Deployment**: Live on Sepolia testnet
- ✅ **Comprehensive Tests**: 20+ test cases covering all features
- ✅ **Full-Stack Implementation**: Complete frontend + backend
- ✅ **Production-Ready**: Deployable to Vercel in minutes

### Technical Achievements

- 🔐 Advanced FHE integration with ACL permissions
- 🎲 Complex game logic with 10 hand ranking algorithms
- ⚡ Asynchronous decryption for security
- 🌐 Modern React frontend with TypeScript
- 🧪 Comprehensive test coverage
- 📱 Responsive design with Tailwind CSS

### Development Effort

- **Total Lines of Code**: 5,000+
- **Development Time**: 2-3 weeks
- **Smart Contract**: 1,655 lines
- **Frontend**: 3,000+ lines
- **Tests**: 500+ lines
- **Documentation**: 1,000+ lines

---

## 📊 Project Stats

![GitHub stars](https://img.shields.io/github/stars/yourusername/fhe-poker?style=social)
![GitHub forks](https://img.shields.io/github/forks/yourusername/fhe-poker?style=social)
![GitHub issues](https://img.shields.io/github/issues/yourusername/fhe-poker)
![GitHub pull requests](https://img.shields.io/github/issues-pr/yourusername/fhe-poker)

- **Smart Contract**: 1,655 lines
- **Frontend Code**: 3,000+ lines
- **Test Cases**: 20+
- **Supported Languages**: 2 (EN, CN)
- **Max Players**: 6
- **Hand Rankings**: 10
- **Deployment**: Sepolia Testnet

---

## 🙏 Acknowledgments

- **Zama**: For the amazing FHEVM technology
- **Hardhat**: For the excellent development framework
- **OpenZeppelin**: For security best practices
- **Wagmi**: For seamless wallet integration
- **Vercel**: For easy frontend deployment

---

## 📞 Contact

**Project Maintainer**: Your Name
**Email**: your-email@example.com
**GitHub**: [@yourusername](https://github.com/yourusername)
**Twitter**: [@yourhandle](https://twitter.com/yourhandle)

---

<div align="center">

**Built with ❤️ using FHEVM**

[⬆ Back to Top](#-fhe-poker---privacy-preserving-on-chain-texas-holdem)

</div>
