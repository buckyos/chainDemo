import 'mocha';
import * as path from 'path';
import * as fs from 'fs-extra';
import {valueChainDebuger, initLogger, stringifyErrorCode, ValueIndependDebugSession, BigNumber} from 'blockchain-sdk';

const {createIndependSession,createChainSession} = valueChainDebuger;
const assert = require('assert');

process.on('unhandledRejection', (reason, p) => {
    console.log('未处理的 rejection：', p, '原因：', reason);
    // 记录日志、抛出错误、或其他逻辑。
});

describe('coin', () => {
    const logger = initLogger({loggerOptions: {console: true}});
    let session: ValueIndependDebugSession;

    // 测试初始化环境安装
    before((done) => {
        async function __test() {
            const dataDir = path.join(__dirname, '../chain');
            
            //
            // 创建一个调试用的Session，该Session可以直接触发块相关的事件，便于调试。
            // 例如：你不需要真正创建一个挖矿节点就可以调用给矿机发工资的接口session!.wage()
            //      然后查询账户余额，确认下是否收到了在合约里注册的挖矿奖励等额的钱。
            //
            // ChainSDK充分考虑了开发者开发DApp中的调试困难，从而设计了便于调试的工具和组件。 
            //
            const r = await createIndependSession({logger},dataDir);
            const err = r.err;
            session = r.session!;

            assert(!err, 'createIndependSession failed', stringifyErrorCode(err));

            assert(!(await session!.init({
                height: 0,        // 初始化块高度为0
                accounts: 2,      // 创建两个默认账户，可分别通过session!.getAccount(i)获得
                coinbase: 0,      // 挖矿奖励给index为0的账户，初始化的时候就会给该地址发一次奖励
                interval: 10      // 出块时间
            })), 'init session failed');
        }
        __test().then(done);
    });

    // 挖矿奖励金额测试
    it('wage', (done) => {
        async function __test() {
            // 触发一次发工资调用session!.wage()
            assert(!(await session!.wage()).err, 'wage error');

            // 调用getBalance查询余额，挖矿奖励给index为0的账户，所以查询该账户
            const gbr = await session.view({method: 'getBalance', params: {address: session!.getAccount(0)}});

            // 此时，账户0里的金额应该等于:
            // 1. session初始化时，调用合约里handler.onMinerWage给coinbase=0的账户发奖励，也就是10000
            // 2. 调用session!.wage()时，调用合约里handler.onMinerWage发奖励，也就是10000
            // 所以一共是 10000*2
            assert(!gbr.err, 'getBalance failed error');
            assert((gbr.value! as BigNumber).eq(10000), 'wage value error', gbr);

            // 牛到小试，激动中..
        }
        __test().then(done);
    });

    // 转账测试
    it('transferTo', (done) => {
        async function __test() {
            // 触发一次转账操作：transferTo，转出10给账户1
            assert(!(await session.transaction({caller: 0, method: 'transferTo', input: {to: session.getAccount(1)}, value: new BigNumber(10), fee: new BigNumber(0)})).err, 'transferTo failed');
            
            // 调用getBalance查询余额，此时账户0的金额应该比上一步少了10
            let gbr = await session.view({method: 'getBalance', params: {address: session!.getAccount(0)}});
            assert(gbr.value!.eq(10000*2 - 10), '0 balance value err');

            // 而账户1的余额应该是10
            gbr = await session.view({method: 'getBalance', params: {address: session!.getAccount(1)}});
            assert(gbr.value!.eq(10), '1 balance value err');

            // 一切都对，一链尽在掌握中！
        }
        __test().then(done);
    });
});