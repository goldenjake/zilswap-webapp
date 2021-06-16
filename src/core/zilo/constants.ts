import dayjs, { Dayjs } from "dayjs";
import { Network } from "zilswap-sdk/lib/constants";

export type ILOData = {
  comingSoon?: boolean
  projectURL?: string
  imageURL: string
  tokenSymbol: string
  tokenName: string
  description: string
  contractAddress: string
  showUntil: Dayjs
  usdRatio: string // zil / zil+zwap
}

export const ZILO_DATA: { [key in Network]: ReadonlyArray<ILOData> } = {
  [Network.MainNet]: [{
    comingSoon: true,
    projectURL: 'https://docs.zilswap.io/how-to/zilo/01-zilstream',
    imageURL: 'https://switcheo-assets.s3.ap-southeast-1.amazonaws.com/zilswap/banner-zilstream.png',
    tokenSymbol: 'STREAM',
    tokenName: 'ZilStream',
    description: 'ZilSteam\'s premium membership token',
    contractAddress: 'test',
    showUntil: dayjs(),
    usdRatio: ''
  }],
  [Network.TestNet]: [{
    projectURL: 'https://docs.zilswap.io/how-to/zilo/01-zilstream',
    imageURL: 'https://switcheo-assets.s3.ap-southeast-1.amazonaws.com/zilswap/banner-zilstream.png',
    tokenSymbol: 'STREAM',
    tokenName: 'ZilStream',
    description: 'ZilSteam\'s premium membership token',
    contractAddress: 'zil12ups4rxaxepf9h9aplwess8vapk37d2m8v20ax',
    showUntil: dayjs('2021-06-06T10:00:00.000+0800'),
    usdRatio: '0.7'
  }],
}
