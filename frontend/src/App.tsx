import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from './lib/wagmi';
import { Home } from './pages/Home';
import { CardTest } from './pages/CardTest';

const queryClient = new QueryClient();

function App() {
  // 简单的路由：如果URL包含 /card-test 就显示测试页面
  const isCardTest = window.location.pathname === '/card-test';

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {isCardTest ? <CardTest /> : <Home />}
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
