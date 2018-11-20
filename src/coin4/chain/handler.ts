import { ErrorCode, BigNumber, ValueViewContext, ValueTransactionContext, ValueHandler, IReadableKeyValue } from 'blockchain-sdk';

export function registerHandler(handler: ValueHandler) {

    async function getTokenBalance(balanceKv: IReadableKeyValue, address: string): Promise<BigNumber> {
        let retInfo = await balanceKv.get(address);
        return retInfo.err === ErrorCode.RESULT_OK ? retInfo.value : new BigNumber(0);
    }

    handler.addViewMethod('getBalance', async (context: ValueViewContext, params: any): Promise<any> => {
        return await context.getBalance(params.address);
    });

    handler.addTX('transferTo', async (context: ValueTransactionContext, params: any): Promise<ErrorCode> => {
        return await context.transferTo(params.to, context.value);
    });

    handler.addTX('createToken', async (context: ValueTransactionContext, params: any): Promise<ErrorCode> => {
        context.cost(context.fee);

        // 必须要有tokenid，一条链上tokenid不能重复
        if (!params.tokenid) {
            return ErrorCode.RESULT_INVALID_PARAM;
        }
        let kvRet = await context.storage.createKeyValue(params.tokenid);
        if (kvRet.err) {
            return kvRet.err;
        }

        await kvRet.kv!.set('creator', context.caller);

        if (params.preBalances) {
            for (let index = 0; index < params.preBalances.length; index++) {
                // 按照address和amount预先初始化钱数
                await kvRet.kv!.set(params.preBalances[index].address, new BigNumber(params.preBalances[index].amount));
            }
        }
        return ErrorCode.RESULT_OK;
    });

    handler.addTX('transferTokenTo', async (context: ValueTransactionContext, params: any): Promise<ErrorCode> => {
        context.cost(context.fee);
        let tokenkv = await context.storage.getReadWritableKeyValue(params.tokenid);
        if (tokenkv.err) {
            return tokenkv.err;
        }

        let fromTotal = await getTokenBalance(tokenkv.kv!, context.caller);
        let amount = new BigNumber(params.amount);
        if (fromTotal.lt(amount)) {
            return ErrorCode.RESULT_NOT_ENOUGH;
        }
        await (tokenkv.kv!.set(context.caller, fromTotal.minus(amount)));
        await (tokenkv.kv!.set(params.to, (await getTokenBalance(tokenkv.kv!, params.to)).plus(amount)));
        return ErrorCode.RESULT_OK;
    });

    handler.addViewMethod('getTokenBalance', async (context: ValueViewContext, params: any): Promise<BigNumber> => {
        let balancekv = await context.storage.getReadableKeyValue(params.tokenid);
        return await getTokenBalance(balancekv.kv!, params.address);
    });

    handler.onMinerWage(async (): Promise<BigNumber> => {
        return new BigNumber(10000);
    });
}