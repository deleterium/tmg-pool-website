# TMG Pool website
Simple website to run the default liquidity pool for TMG.
* Liquidity pool contract written in SmartC https://github.com/deleterium/SmartC/blob/main/samples/liquidityPool.md already deployed at address [S-PQQL-ZSJ8-C7H3-8D4B6](https://explorer.notallmine.net/address/7071860869716171474) in main net of Signum Network.
* The chart for price history needs the [TMG API](https://github.com/deleterium/tmg_api/) installed and working.
* Featuring integration with [Signum XT Wallet](https://github.com/signum-network/signum-xt-wallet) for convenience using the browsers.
* Small website, most of traffic will be loaded by SignumJS at the default node.
* Note configurations in `js` file in global variables `Global` and `Config`. It is possible to use with other tokens that use the same liquidity pool source code.
* License is GPL-v2.
