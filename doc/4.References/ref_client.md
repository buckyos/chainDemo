# class ChainClient
## constructor
```typescript
constructor(options: {host: string, port: number})
```
创建一个Chain Client对象，用于与开启了rpc监听的host通信，<b>以下的各种数据获取函数都基于host本地的数据</b>

参数
+ options
    + host host绑定的RPC监听ip，启动host时用rpchost参数指定
    + port host绑定的RPC监听端口，启动host时用rpcport参数指定

## method getBlock
```typescript
getBlock(params: {which: string|number|'lastest', transactions?: boolean}): Promise<{err: ErrorCode, block?: any, txs?: any[]}>;
```
从host上获取指定块

参数
+ params
    + which 可以传入字符串格式的块hash，数字格式的块高度，或```'lastest'```字符串
    + transactions 是否返回块中所有transcation的信息

返回值
+ err 此次调用的错误码，错误码为0时表示成功取回，错误码非0时，不存在其他字段
+ block 对应的[块头信息](#BlockHeader)，以Object形式展现，不同共识的链块头信息各有不同
+ txs 当调用时transactions参数为true时，返回该字段，该字段为数组，表示块内包含的所有transcation的信息，以Object形式展现

## method getTransactionReceipt
```typescript
getTransactionReceipt(params: {tx: string}): Promise<{err: ErrorCode, block?: any, tx?: any, receipt?: any}>
```
从host上取指定tx的receipt信息

参数
+ params
    + tx 字符串格式的tx hash

返回值
+ err 此次调用的错误码，错误码为0时表示成功取回，错误码非0时，不存在其他字段
+ block 该tx所在block的[块头信息](#BlockHeader)
+ tx 该tx的信息
+ receipt 该tx对应的receipt信息

## method getNonce
```typescript
getNonce(params: {address: string}): Promise<{err: ErrorCode, nonce?: number}>
```
从host上取指定地址的最新nonce

参数
+ params
    + address 字符串格式的地址

返回值
+ err 此次调用的错误码，错误码为0时表示成功取回，错误码非0时，不存在其他字段
+ nonce 该地址在链上的最新nonce，当地址没有发送过任何tx时，返回-1

## method sendTransaction
```typescript
sendTransaction(params: {tx: ValueTransaction}): Promise<{err: ErrorCode}>
```
将一个已签名的transcation发送到host，<b>即使该调用返回0错误码，也不表示这个tx已经上链</b>

参数
+ params
    + tx [ValueTransaction](#ValueTransaction)或其派生类型的对象

返回值
+ err 此次调用的错误码，错误码为0时表示成功发送到host

一个标准调用sendTransaction的例子
```typescript
let tx = new ValueTransaction();
tx.method = 'transferTo',
tx.value = new BigNumber(amount);
tx.fee = new BigNumber(fee);
tx.input = {to};
let {err, nonce} = await chainClient.getNonce({address});
tx.nonce = nonce + 1;
tx.sign(secret);
let sendRet = await chainClient.sendTransaction({tx});
```

## method view
```typescript
view(params: {method: string, params: any, from?: number|string|'latest'}): Promise<{err: ErrorCode, value?: any}>
```
从host读取自定义数据，会根据method的值调用handler中对应的View函数

参数
+ params
    + method 加入到handler中的对应View函数名
    + params 函数需要的参数
    + from 指定读取链上哪个高度位置的数据，可传入数字格式的块高度、字符串格式的块Hash、或```'latest'```表示host上的最新高度。不指定该参数时的默认值为```'latest'```

返回值
+ err 此次调用的错误码，错误码为0时表示成功
+ value method对应的View函数返回的内容

## method getPeers
```typescript
getPeers(): Promise<string[]>
```
获取该host已经连接上的所有peer列表，通常用于诊断连接问题

参数
+ 无

返回值

+ 返回数组格式的peerid列表，表示该host当前连接的所有其他节点

## event tipBlock
```typescript
on(event: 'tipBlock', listener: (block: any) => void): this;
```
每当host有块高度变动时，触发该事件。该事件最多每10秒钟触发一次

参数
+ block host最新高度的块头信息

# <a name="ValueTransaction">class ValueTransaction</a>
## 成员变量
- `address: string` 签名者地址，只有调用过sign()函数后，该参数才有意义
- `method: string`  方法名，该参数必须填写，且handler.js中必须对应注册该名字的Listener
- `nonce: number`   签名者的nonce，此参数的含义和以太坊的nonce相同:新建交易nonce为由该地址发起的已经上联的交易个数，必须正确填写
- `input: any`      方法的调用参数，必须是可序列化的
- `value: BigNumber` 这个Transaction执行时，context可动用的币数，Listener开始执行时，对应的币数就会从签名者的地址上扣除
- `fee: BigNumber`  该Transaction上链时，出块节点可从该交易赚取的的手续费上限


## verifySignature
```typescript
verifySignature(): boolean
```
验证该Transaction的签名合法性

返回值

+ 当该transaction有签名，且签名合法时返回true，否则返回false。未签名的Transaction也返回false

## sign
```typescript
sign(privateKey: Buffer|string)
```

用私钥给一个Transaction签名，签名后的Transaction就不可以再改变任何成员变量的值，否则会导致签名验证失败

参数
+ privateKey 私钥，可以是Buffer或者Hex格式的字符串

# <a name="BlockHeader">标准块头信息</a>
Object类型，成员变量如下：
- `hash: string` 本块的哈希值
- `number: number` 块的高度
- `timestamp: number` 块产生时的时间戳，以出块者的本地时间为准
- `preBlock: string` 前一块的哈希值
- `storageHash: string` 本块的存储哈希
- `coinbase: string` 本块的coinbase地址

当运行的是PoW共识时，块头信息会附加以下值：
- `difficulty: number` 本块的难度值

当运行的是dPoS共识时，块头信息会附加以下值：
- `creator: string` 块创建者的地址

当运行的是dBFT共识时，块头信息会附加以下值:
- `creator: string` 块创建者的地址
- `view: number` 该块创建时被跳过的轮数，具体含义见dBFT共识文档