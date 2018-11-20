# <a name="ExecutorContext">type ExecutorContext</a>
## member now: number
当前block的时间戳

## member height: number
当前block的块高度

# <a name="TransactionContext">type TransactionContext</a>
派生自[ExecutorContext](#ExecutorContext)
## member caller: string
发起该交易的地址

## member storage: IReadWritableDataBase
可读写的数据存储对象

## method emit
创建事件的日志实例
```typescript
// @param name  事件名字
// @param param 其他参数
emit: (name: string, param?: any) => void;
```

## method createAddress
生成新的地址
```typescript
createAddress: () => string;
```

# <a name='ValueTransactionContext'>type ValueTransactionContext </a>
派生自[TransactionContext](#TransactionContext)

## member value: BigNumber
交易支出的金额

## member fee: BigNumber;
交易的手续费上限

## method getBalance
获取某个地址的余额
```typescript
getBalance: (address: string) => Promise<BigNumber>;
```

## method transferTo
转账给某个地址
```typescript
transferTo: (address: string, amount: BigNumber) => Promise<ErrorCode>;
```

## method cost
扣除指定金额的手续费， 当超出手续费上限时， 交易失败
```typescript
cost: (fee: BigNumber) => ErrorCode;
```



# <a name='ViewContext'>type ViewContext </a>
用来查看storage里数据的执行环境， 一般用作基类，不会单独使用

## member storage: IReadableDataBase
只读的数据存储对象

# <a name="ValueViewContext">type ValueViewContext</a>
派生自[ViewContext](#ViewContext)
获得一个查看storage数据的执行环境
## method  getBalance
获取某个地址的余额
``` typescript
// @param address 地址
// @return Promise 余额
getBalance: (address: string) => Promise<BigNumber>
```


# <a name="IReadableDataBase">interface IReadableDataBase</a>
接口 只读的数据存储对象

## method getReadableKeyValue
获取一个只读的key-value存储对象
```typescript
// @param name 对象名字 类似表名
getReadableKeyValue(name: string) => Promise<{ err: ErrorCode, kv?: IReadableKeyValue }>;
```

# <a name="IWritableDataBase">interface IWritableDataBase</a>
接口 只写的数据存储对象

## method createKeyValue
创建一个可以读写的 key-value对象, 可以根据需求和业务划分创建一个或多个key-value storage
```typescript
// @param name 对象名字 类似表名
createKeyValue(name: string): Promise<{err: ErrorCode, kv?: IReadWritableKeyValue}>;
```


## method getReadWritableKeyValue
获取一个只写的数据存储对象
```typescript
// @param name 对象名字 类似表名
getReadWritableKeyValue(name: string): Promise<{ err: ErrorCode, kv?: IReadWritableKeyValue }>;
```

# <a name="IWritableKeyValue">interface IWritableKeyValue</a>
可写的 key-value对象

ps: 以下的函数可参照redis主要方法的使用方式

## method set
将值 value 设置到 key

如果 key 已经持有其他值，SET 就覆写旧值，无视类型。
```typescript
set(key: string, value: any): Promise<{ err: ErrorCode }>;
```

## method hset
将哈希表 key 中的域 field 的值设为 value 

如果 key 不存在，一个新的哈希表被创建并进行 HSET 操作。

如果域 field 已经存在于哈希表中，旧值将被覆盖。
```typescript
hset(key: string, field: string, value: any): Promise<{ err: ErrorCode }>;
```

## method hmset
同时将多个 field-value (域-值)对设置到哈希表 key 中。

此命令会覆盖哈希表中已存在的域。

如果 key 不存在，一个空哈希表被创建并执行 HMSET 操作。
```typescript
hmset(key: string, fields: string[], values: any[]): Promise<{ err: ErrorCode }>;
```

## method hclean
```typescript
hclean(key: string): Promise<{err: ErrorCode}>;
```

## method hdel
```typescript
hdel(key: string, field: string): Promise<{err: ErrorCode}>;
```

## method lset
将列表 key 下标为 index 的元素的值设置为 value 。

当 index 参数超出范围，或对一个空列表( key 不存在)进行 LSET 时，返回一个错误。
```typescript
lset(key: string, index: number, value: any): Promise<{ err: ErrorCode }>;
```

## method lpush
将一个或多个值 value 插入到列表 key 的表头

如果有多个 value 值，那么各个 value 值按从左到右的顺序依次插入到表头

如果 key 不存在，一个空列表会被创建并执行 LPUSH 操作

当 key 存在但不是列表类型时，返回一个错误
```typescript
lpush(key: string, value: any): Promise<{ err: ErrorCode }>;
```

## method lpushx
将值 value 插入到列表 key 的表头，当且仅当 key 存在并且是一个列表。

和 LPUSH 命令相反，当 key 不存在时， LPUSHX 命令什么也不做
```typescript
lpushx(key: string, value: any[]): Promise<{ err: ErrorCode }>;
```

## method lpop
移除并返回列表 key 的头元素

```typescript
lpop(key: string): Promise<{ err: ErrorCode, value?: any }>;
```

## method rpush
将一个或多个值 value 插入到列表 key 的表尾(最右边)

如果有多个 value 值，那么各个 value 值按从左到右的顺序依次插入到表尾

如果 key 不存在，一个空列表会被创建并执行 RPUSH 操作

当 key 存在但不是列表类型时，返回一个错误
```typescript
rpush(key: string, value: any): Promise<{ err: ErrorCode }>;
```

## method rpushx
将值 value 插入到列表 key 的表尾，当且仅当 key 存在并且是一个列表

和 RPUSH 命令相反，当 key 不存在时， RPUSHX 命令什么也不做
```typescript
rpushx(key: string, value: any[]): Promise<{ err: ErrorCode }>;
```

## method rpop
移除并返回列表 key 的尾元素
```typescript
rpop(key: string): Promise<{ err: ErrorCode, value?: any }>;
```

## method linsert
将值 value 插入到列表 key 当中，位于值 index 之前或之后。

当 index 不存在于列表 key 时，不执行任何操作。

当 key 不存在时， key 被视为空列表，不执行任何操作。

如果 key 不是列表类型，返回一个错误。
```typescript
linsert(key: string, index: number, value: any): Promise<{ err: ErrorCode }>;
```

## method lremove
```typescript
lremove(key: string, index: number): Promise<{ err: ErrorCode, value?: any }>;
```


# <a name="IReadableKeyValue">type IReadableKeyValue</a>
## method get
返回 key 所关联的字符串值。

如果 key 不存在那么返回 null
```typescript
get(key: string): Promise<{ err: ErrorCode, value?: any }>;
```

## method hexists
查看哈希表 key 中，给定域 field 是否存在。

```typescript
hexists(key: string, field: string): Promise<{ err: ErrorCode, value?: boolean}>;
```
## method hget
返回哈希表 key 中给定域 field 的值。

```typescript
hget(key: string, field: string): Promise<{ err: ErrorCode, value?: any }>;
```

## method hmget
返回哈希表 key 中，一个或多个给定域的值。

如果给定的域不存在于哈希表，那么返回 null

```typescript
hmget(key: string, fields: string[]): Promise<{ err: ErrorCode, value?: any[] }>;
```

## method hlen
返回哈希表 key 中域的数量。

```typescript
hlen(key: string): Promise<{ err: ErrorCode, value?: number }>;
```

## method hkeys
返回哈希表 key 中的所有域。

```typescript
hkeys(key: string): Promise<{ err: ErrorCode, value?: string[] }>;
```

## method hvalues
返回哈希表 key 中所有域的值。

```typescript
hvalues(key: string): Promise<{ err: ErrorCode, value?: any[] }>;
```

## method hgetall
返回哈希表 key 中，所有的域和值

```typescript
hgetall(key: string): Promise<{ err: ErrorCode; value?: {key: string, value: any}[]; }>;
```

## method lindex
返回列表 key 中，下标为 index 的元素。

也可以使用负数下标，以 -1 表示列表的最后一个元素， -2 表示列表的倒数第二个元素，以此类推

```typescript
lindex(key: string, index: number): Promise<{ err: ErrorCode, value?: any }>;
```

## method llen
返回列表 key 的长度。

如果 key 不存在，则 key 被解释为一个空列表，返回 0 .

如果 key 不是列表类型，返回一个错误。

```typescript
llen(key: string): Promise<{ err: ErrorCode, value?: number }>;
```
## method lrange
返回列表 key 中指定区间内的元素，区间以偏移量 start 和 stop 指定。

可以使用负数下标，以 -1 表示列表的最后一个元素， -2 表示列表的倒数第二个元素，以此类推
```typescript
lrange(key: string, start: number, stop: number): Promise<{ err: ErrorCode, value?: any[] }>;
```

