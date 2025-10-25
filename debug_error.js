// 最新的错误数据
const errorData = '0x9de3392c94f825fbde86c0044eaff53d9e8cbdd5c4ba0cee3dff0000000000aa36a70500000000000000000000000000be388cb8b090b4c2c5fd62fc50c1e7f9c6247c22';

console.log('错误选择器:', errorData.slice(0, 10));
console.log('错误数据长度:', errorData.length);
console.log('错误数据 (去掉选择器):', errorData.slice(10));

// ACLNotAllowed(bytes32 handle, address account)
// 参数1: bytes32 (64 hex chars)
// 参数2: address (40 hex chars, padded to 64)
const param1 = '0x' + errorData.slice(10, 74); // bytes32 handle
const param2 = '0x' + errorData.slice(74, 138); // address (padded)
const actualAddress = '0x' + errorData.slice(98, 138); // 去掉 padding

console.log('\n❌ ACLNotAllowed 错误参数:');
console.log('Handle (bytes32):', param1);
console.log('Account (address, padded):', param2);
console.log('Account (address, actual):', actualAddress);

console.log('\n🔍 对比:');
console.log('最新合约地址:', '0xbE388cb8b090B4C2c5Fd62fC50c1e7F9c6247C22');
console.log('错误中的地址:', actualAddress);
console.log('地址匹配:', actualAddress.toLowerCase() === '0xbe388cb8b090b4c2c5fd62fc50c1e7f9c6247c22');

// 分析加密数据
const encryptedData = '0x350d31b2dbc221456ccb0ad4ce0e18566857289d46000000000000aa36a70500';
console.log('\n🔐 加密数据分析:');
console.log('加密数据:', encryptedData);
console.log('错误中的 handle:', param1);
console.log('数据匹配:', encryptedData.toLowerCase() === param1.toLowerCase());

