# handler.js
handler.js文件是自定义链行为的入口，一个链必须存在该文件，且该文件必须导出registerHandler函数，这个链才能正常初始化并运行

registerHandler函数原型：
```typescript
function registerHandler(handler: ValueHandler)
```

开发者必须实现这个函数，使用ValueHandler上的方法注册tx和view的处理函数，定义这条链的业务行为

一个简单的例子
```typescript
export function registerHandler(handler: ValueHandler) {
    handler.genesisListener = async (context: TransactionContext) => {
        // 填入初始化代码
    }

    handler.addTX('method1', async (context: TransactionContext, params: any): Promise<ErrorCode> => {
        // 填入method1的Tx执行代码
    }, (tx: Transaction) => {
        // 填入method1的Tx检查代码
    }

    handler.addViewMethod('view1', async (context: ViewContext, params: any): Promise<BigNumber> =>{
        // 填入view执行代码
    })
}
```

# <a name="ValueHandler">class ValueHandler</a>
## member genesisListener: 
函数原型
```typescript
(context: any) => Promise<ErrorCode>
```
该函数用于初始化链时设置自定义信息，在调用host的create命令时被调用，返回0表示成功初始化，返回非0值会让create操作失败

## method addTX
```typescript
addTX(name: string, listener: TxListener, checker?: TxPendingChecker)
```
注册transaction的响应函数，每个tx在上链之前都会调用对应name的listener处理函数，产生一个receipt

参数
+ name 名称
+ listener [处理函数](#TxListener)
+ checker [检查函数](#TxPendingChecker)

## method addViewMethod
```typescript
addViewMethod(name: string, listener: ViewListener)
```
注册view的响应函数

参数
+ name 名称
+ listener [处理函数](#ViewListener)

# <a name="TxListener">type TxListener</a>
```typescript
type TxListener = (context: any, params: any) => Promise<ErrorCode>;
```
参数
+ context 链的[context](./ref_context)对象
+ params transcation的input参数

返回值

返回0表示操作成功，返回其他值表示操作失败。<b>无论返回任何值，该tx都会上链</b>，返回值会记录在该tx对应的receipt中

# <a name="TxPendingChecker">type TxPendingChecker</a>
```typescript
type TxPendingChecker = (tx: Transaction) => ErrorCode;
```

用于判定一个transcation是否应该上链，开发者可以在这个函数中做一些上下文无关的检查，比如检查Transcation的input合法性，value和fee是否符合一些业务标准等。判定为不符合的tx可以在函数中返回非0值，该tx即会被miner抛弃，不会上链

参数
+ tx [transcation](./ref_client#ValueTransaction)实例

返回值

返回0表示该transcation可以上链，返回非0值表示该tx不应该上链，会被直接抛弃

# <a name="ViewListener">type ViewListener</a>
```typescript
type ViewListener = (context: any, params: any) => Promise<any>;
```

view method的响应函数，client的view调用和chain的view调用会触发对应method的ViewListener

参数

+ context [viewcontext](./ref_context#ViewContext)实例
+ params view的params参数

返回值

允许返回任意能序列化的对象