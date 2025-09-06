window.onload = async function () {

    document.getElementById("btn_link").addEventListener('click', function () { activateWalletXT(showError) })
    document.getElementById("btn_unlink").addEventListener('click', function () { unlinkAccount() })

    document.getElementById("ipt_buy_signa").addEventListener('keyup', evtBuySigna)
    document.getElementById("ipt_buy_tmg").addEventListener('keyup', evtBuyTmg)
    document.getElementById("btn_buy").addEventListener('click', evtBuy)
    
    document.getElementById("ipt_sell_tmg").addEventListener('keyup', evtSellTmg)
    document.getElementById("ipt_sell_signa").addEventListener('keyup', evtSellSigna)
    document.getElementById("btn_sell").addEventListener('click', evtSell)
    
    document.getElementById("ipt_add_signa").addEventListener('keyup', evtCalculateAddSigna)
    document.getElementById("ipt_add_tmg").addEventListener('keyup', evtCalculateAddTmg)
    document.getElementById("btn_add").addEventListener('click', evtAdd)

    document.getElementById("ipt_remove_lctmg").addEventListener('keyup', evtCalculateRemove)
    document.getElementById("btn_remove").addEventListener('click', evtRemove)

    // Old version data
    localStorage.removeItem("tmg_pool_chart_data")

    const exits = document.querySelectorAll('.modal-exit');
    exits.forEach(function (exit) {
        exit.addEventListener('click', function (event) {
            event.preventDefault();
            document.getElementById("modal_window").classList.remove('open');
        });
    });

    // create the chart
    const groupingUnits = [[
        'week',                         // unit name
        [1]                             // allowed multiples
    ], [
        'month',
        [1, 2, 3, 4, 6]
    ]];
    Global.histChart = Highcharts.stockChart('container', {
        title: {
            text: 'TMG price - Liquidity pool'
        },

        rangeSelector: {
            selected: 1
        },

        yAxis: [{
            labels: {
                align: 'right',
                x: -3
            },
            title: {
                text: 'OHLC'
            },
            height: '60%',
            lineWidth: 2,
            resize: {
                enabled: true
            }
        }, {
            labels: {
                align: 'right',
                x: -3
            },
            title: {
                text: 'Volume'
            },
            top: '65%',
            height: '35%',
            offset: 0,
            lineWidth: 2
        }],

        tooltip: {
            split: true,
            valueDecimals: 2
        },

        series: [{
            name: 'TMG',
            type: 'candlestick',
            color: '#d83c41',
            data: [],
            dataGrouping: {
                units: groupingUnits
            }
        }, {
            type: 'column',
            name: 'Volume',
            data: [],
            yAxis: 1,
            dataGrouping: {
                units: groupingUnits
            }
        }]
    });

    async function updateChart() {
        const chartData = localStorage.getItem("tmg_pool_chart_data2")
        let data
        let jChartData
        if (!chartData) {
            try {
                const response = await fetch(`${Config.tmgApiAddress}/getDailyOHLC/?start=0`)
                jChartData = await response.json();
            } catch (error) {
                console.log(error.message)
                return;
            }
        } else {
            jChartData = JSON.parse(chartData)
            jChartData.pop()
            const lastPopItem = jChartData.pop()
            try {
                const response = await fetch(`${Config.tmgApiAddress}/getDailyOHLC/?start=${lastPopItem[0] / 1000}`)
                data = await response.json();
            } catch (error) {
                console.log(error.message)
                return;
            }
            jChartData = jChartData.concat(data)
        }
        let ohlc = jChartData.map(item => [item[0], item[1], item[2], item[3], item[4]])
        let volume = jChartData.map(item => [item[0], item[5]])
        Global.histChart.series[0].setData( ohlc );
        Global.histChart.series[1].setData( volume );
        localStorage.setItem('tmg_pool_chart_data2', JSON.stringify(jChartData))
    }

    setInterval(function () {
        updateChart()
    }, 300000)

    updateChart()

    // Notch chart
    Global.notchChart = Highcharts.chart('containerNotch', {
        chart: {
            type: 'area',
            zoomType: 'xy'
        },
        title: {
            text: 'TMG Market Depth - Order book'
        },
        xAxis: {
            minPadding: 0,
            maxPadding: 0,
            plotLines: [{
                color: '#888',
                value: 0.1523,
                width: 1,
                label: {
                    text: 'Actual price',
                    rotation: 90
                }
            }],
            title: {
                text: 'Price'
            }
        },
        yAxis: [{
            lineWidth: 1,
            gridLineWidth: 1,
            title: null,
            tickWidth: 1,
            tickLength: 5,
            tickPosition: 'inside',
            labels: {
                align: 'left',
                x: 8
            }
        }, {
            opposite: true,
            linkedTo: 0,
            lineWidth: 1,
            gridLineWidth: 0,
            title: null,
            tickWidth: 1,
            tickLength: 5,
            tickPosition: 'inside',
            labels: {
                align: 'right',
                x: -8
            }
        }],
        legend: {
            enabled: false
        },
        plotOptions: {
            area: {
                fillOpacity: 0.2,
                lineWidth: 1,
                step: 'center'
            }
        },
        tooltip: {
            headerFormat: '<span style="font-size=10px;">Price: {point.key}</span><br/>',
            valueDecimals: 2
        },
        series: [{
            name: 'Bids',
            data: [],
            color: '#03a7a8'
        }, {
            name: 'Asks',
            data: [],
            color: '#fc5857'
        }]
    });

    setInterval(function () {
        requestContractData()
        updateLinkedAccount()
        updateStatusTable()
        updateOBTradesTable()
    }, 30000)

    if (localStorage.getItem("hasXT") === "true") {
        activateWalletXT(supressError)
    } else {
        await requestContractData()
        updateStatusTable()
        updateOBTradesTable()
    }
}

const Config = {
    smartContractId: "7071860869716171474",
    assetId: "11955007191311588286",
    lcId: "148856166788128147",
    contractActivation: 42000000n,
    transactionFee: 2000000n,
    appName: "TMG Signa Pool",
    networkName: "Signum",
    slippageMessage: "ATTENTION: Shown only once\n\nCalculations are only valid if your transaction is the only one between the the time the page loads and the transaction be processed by the smart contract. Actual received values may differ.",
    ordersToShow: "4",
    tmgApiAddress: "https://deleterium.info/tmg_api_2"
}

const Global = {
    server: 'https://europe3.signum.network',
    wallet: undefined,
    walletResponse: undefined,
    signumJSAPI: undefined,
    extendedInfo: undefined,
    messageIsError: false,
    histChart: undefined,
    notchChart: undefined
}

let Stats = {
    signaTotal: 0n,
    assetTotal: 0n,
    aPrice: 0,
    trades: 0,
    volume: 0n,
    lastDistribution: 0,
    owner: ""
}

const PoolHistory = {}

function numberToNQT(val) {
    return BigInt((val*1E8).toFixed(0))
}
function NQTToNumber(val) {
    return Number(val) / 1E8
}

function calculateBuyFromSigna(Signa) {

    let bSigna = numberToNQT(Signa) - Config.contractActivation - Config.transactionFee
    if (bSigna <= 0) {
        return {
            poolFeeSigna: 0,
            contractActivation: 0,
            transactionFee: 0,
            impact: 0,
            effectivePrice: 0,
            effectiveAsset: 0
        }
    }
    let effSigna = (bSigna * 980n) / 1000n
    let effAsset = (effSigna * Stats.assetTotal) / (Stats.signaTotal + effSigna)

    let remPrice = (Number(Stats.signaTotal + effSigna) / 1E8) / (Number(Stats.assetTotal - effAsset) / 100)

    const poolFeeSigna = Number(bSigna - effSigna) / 1E8
    const impact = (remPrice - Stats.aPrice) / Stats.aPrice
    const effectivePrice = (Signa) / (Number(effAsset) / 100)
    const effectiveAsset = Number(effAsset) / 100

    return {
        poolFeeSigna,
        impact,
        effectivePrice,
        effectiveAsset
    }
}

function calculateBuyFromTmg(Tmg) {

    let bTmg = BigInt((Tmg * 100).toFixed(0))
    if (bTmg >= Stats.assetTotal || bTmg <= 0n) {
        return {
            poolFeeSigna: 0,
            impact: 0,
            effectivePrice: 0,
            neededSigna: 0
        }
    }
    let effSigna = 1n + (bTmg * Stats.signaTotal) / (Stats.assetTotal - bTmg)
    const bSigna = 1n + (effSigna * 1000n) / 980n

    let remPrice = (Number(Stats.signaTotal + (bSigna*980n)/1000n) / 1E8) / (Number(Stats.assetTotal - bTmg) / 100)

    const neededSigna = NQTToNumber(bSigna + Config.contractActivation + Config.transactionFee)
    const poolFeeSigna = Number(bSigna - ((bSigna * 980n) / 1000n)) / 1E8
    const impact = (remPrice - Stats.aPrice) / Stats.aPrice
    const effectivePrice = (neededSigna) / (Number(bTmg) / 100)

    return {
        poolFeeSigna,
        impact,
        effectivePrice,
        neededSigna,
    }
}

function calculateAdd(Signa, Asset) {

    let bAsset = BigInt((Asset * 100).toFixed(0))
    let bSigna = BigInt((Signa * 1E8).toFixed(0)) - Config.contractActivation - Config.transactionFee
    if (bAsset <= 0n || bSigna <= 0n) {
        return {
            addedLiquidity: 0,
            refundedSigna: 0,
            refundedAsset: 0
        }
    }
    let excessSigna = bSigna - ((bAsset * Stats.signaTotal) / Stats.assetTotal);
    let excessAsset = bAsset - ((bSigna * Stats.assetTotal) / Stats.signaTotal);

    let operationSigna
    if (excessSigna < 0n) {
        // Refund the excess of asset
        excessSigna = 0n
        operationSigna = bSigna;
    } else {
        // Refund the excess of signa
        excessAsset = 0n
        operationSigna = bSigna - excessSigna;
    }
    let addedLiquidity = Number((Stats.currentLiquidity * operationSigna) / Stats.signaTotal)

    const refundedSigna = Number(excessSigna) / 1E8
    const refundedAsset = Number(excessAsset) / 100

    return {
        addedLiquidity,
        refundedSigna,
        refundedAsset
    }
}

function calculateRemove(Asset) {

    let bAsset = BigInt((Asset).toFixed(0))

    if (bAsset <= 0n) {
        return {
            removedSigna: 0,
            removedAsset: 0
        }
    }

    let calculatedSigna = (Stats.signaTotal * bAsset) / Stats.currentLiquidity
    let calculatedAsset = (Stats.assetTotal * bAsset) / Stats.currentLiquidity

    const removedSigna = Number(calculatedSigna) / 1E8
    const removedAsset = Number(calculatedAsset) / 100

    return {
        removedSigna,
        removedAsset
    }
}

function calculateSellFromTMG(Asset) {

    let bAsset = BigInt((Asset * 100).toFixed(0))
    if (bAsset <= 0) {
        return {
            poolFeeTmg: 0,
            impact: 0,
            effectivePrice: 0,
            effectiveSigna: 0
        }
    }
    let effAsset = (bAsset * 980n) / 1000n
    let effSigna = (effAsset * Stats.signaTotal) / (Stats.assetTotal + effAsset)

    let remPrice = (Number(Stats.signaTotal - effSigna) / 1E8) / (Number(Stats.assetTotal + effAsset) / 100)

    const poolFeeTmg = Number(bAsset - effAsset) / 100
    const impact = (Stats.aPrice - remPrice) / Stats.aPrice
    const effectivePrice = ((Number(effSigna - Config.contractActivation - Config.transactionFee))/1E8) / (Number(bAsset) / 100)
    const effectiveSigna = Number(effSigna) / 1E8

    return {
        poolFeeTmg,
        impact,
        effectivePrice,
        effectiveSigna
    }
}

function calculateSellFromSigna(Signa) {

    let bSigna = BigInt((Signa * 1E8).toFixed(0))
    if (bSigna >= Stats.signaTotal) {
        return {
            poolFeeSigna: 0,
            impact: 0,
            effectivePrice: 0,
            neededAsset: 0
        }
    }

    const effectiveAsset = 1n + (Stats.assetTotal * bSigna) / (Stats.signaTotal - bSigna)

    const assetTotal = ((effectiveAsset * 1000n) / 980n) + 1n

    let remPrice = (Number(Stats.signaTotal - bSigna) / 1E8) / (Number(Stats.assetTotal + effectiveAsset) / 100)

    const poolFeeTmg = Number(assetTotal - effectiveAsset) / 100
    const impact = (Stats.aPrice - remPrice) / Stats.aPrice
    const effectivePrice = (Number(bSigna - Config.contractActivation - Config.transactionFee)/1E8) / (Number(assetTotal) / 100)
    const neededAsset = Number(assetTotal) / 100

    return {
        poolFeeTmg,
        impact,
        effectivePrice,
        neededAsset
    }
}

function evtCalculateAddSigna(e) {
    const userInputSigna = e.target.value
    let numberSigna = Number(userInputSigna)
    if (isNaN(numberSigna)) {
        numberSigna = Number(userInputSigna.replace(',','.'))
    }
    if (isNaN(numberSigna) || Stats.aPrice === 0) {
        return
    }

    const assetQuantity = Number(((numberSigna - NQTToNumber(Config.contractActivation + Config.transactionFee)) / Stats.aPrice).toFixed(2))
    document.getElementById('ipt_add_tmg').value = assetQuantity
    const Params = calculateAdd(numberSigna, assetQuantity)
    document.getElementById('add_refunded_signa').innerText = Params.refundedSigna.toFixed(4)
    document.getElementById('add_refunded_tmg').innerText = Params.refundedAsset
    document.getElementById('add_lctmg').innerText = Params.addedLiquidity
    document.getElementById('add_op_cost').innerText = NQTToNumber(Config.contractActivation + Config.transactionFee)
    console.log(JSON.stringify(Params))
}

function evtCalculateAddTmg(e) {
    const userInputTmg = e.target.value
    let numberTmg = Number(userInputTmg)
    if (isNaN(numberTmg)) {
        numberTmg = Number(userInputTmg.replace(',','.'))
    }
    if (isNaN(numberTmg) || Stats.aPrice === 0) {
        return
    }

    const bTmg = BigInt((numberTmg * 100).toFixed(0))
    const signaAmount = ((bTmg * Stats.signaTotal) / Stats.assetTotal) + Config.contractActivation + Config.transactionFee

    const Params = calculateAdd(NQTToNumber(signaAmount), numberTmg)
    document.getElementById('add_refunded_signa').innerText = Params.refundedSigna.toFixed(8)
    document.getElementById('add_refunded_tmg').innerText = Params.refundedAsset
    document.getElementById('add_lctmg').innerText = Params.addedLiquidity
    document.getElementById('add_op_cost').innerText = NQTToNumber(Config.contractActivation + Config.transactionFee)
    document.getElementById('ipt_add_signa').value = NQTToNumber(signaAmount).toFixed(8)
    console.log(JSON.stringify(Params))
}

function evtCalculateRemove() {
    const userInputLctmg = document.getElementById('ipt_remove_lctmg').value
    let numberLctmg = Number(userInputLctmg)
    if (isNaN(numberLctmg)) {
        numberLctmg = Number(userInputLctmg.replace(',','.'))
    }
    if (isNaN(numberLctmg) || Stats.aPrice === 0) {
        return
    }
    const Params = calculateRemove(numberLctmg)
    document.getElementById('remove_signa').innerText = Params.removedSigna.toFixed(8)
    document.getElementById('remove_tmg').innerText = Params.removedAsset
    document.getElementById('remove_op_cost').innerText = NQTToNumber(Config.contractActivation + Config.transactionFee)
    console.log(JSON.stringify(Params))
}

function evtBuySigna(e) {
    const userInput = e.target.value
    let numberBalance = Number(userInput)
    if (isNaN(numberBalance)) {
        numberBalance = Number(userInput.replace(',','.'))
    }
    if (isNaN(numberBalance) || Stats.aPrice === 0) {
        return
    }
    const Params = calculateBuyFromSigna(numberBalance)
    document.getElementById('ipt_buy_tmg').value = Params.effectiveAsset
    document.getElementById('buy_effective_price').innerText = Params.effectivePrice.toFixed(4)
    document.getElementById('buy_price_impact').innerText = (Params.impact * 100).toFixed(2)
    document.getElementById('buy_op_cost').innerText = (NQTToNumber(Config.contractActivation + Params.transactionFee) + Params.poolFeeSigna).toFixed(4)
    console.log(JSON.stringify(Params))
}

function evtBuyTmg(e) {
    const userInput = e.target.value
    let numberBalance = Number(userInput)
    if (isNaN(numberBalance)) {
        numberBalance = Number(userInput.replace(',','.'))
    }
    if (isNaN(numberBalance) || Stats.aPrice === 0) {
        return
    }
    const Params = calculateBuyFromTmg(numberBalance)
    document.getElementById('ipt_buy_signa').value = Params.neededSigna
    document.getElementById('buy_effective_price').innerText = Params.effectivePrice.toFixed(4)
    document.getElementById('buy_price_impact').innerText = (Params.impact * 100).toFixed(2)
    document.getElementById('buy_op_cost').innerText = (NQTToNumber(Config.contractActivation + Config.transactionFee) + Params.poolFeeSigna).toFixed(4)
    console.log(JSON.stringify(Params))
}

function evtSellTmg(e) {
    const userInput = e.target.value
    let numberBalance = Number(userInput)
    if (isNaN(numberBalance)) {
        numberBalance = Number(userInput.replace(',','.'))
    }
    if (isNaN(numberBalance) || Stats.aPrice === 0) {
        return
    }
    const Params = calculateSellFromTMG(numberBalance)
    document.getElementById('ipt_sell_signa').value = Params.effectiveSigna
    document.getElementById('sell_effective_price').innerText = Params.effectivePrice.toFixed(4)
    document.getElementById('sell_price_impact').innerText = (Params.impact * 100).toFixed(2)
    document.getElementById('sell_op_cost_signa').innerText = NQTToNumber(Config.contractActivation + Config.transactionFee)
    document.getElementById('sell_op_cost_tmg').innerText = Params.poolFeeTmg
    console.log(JSON.stringify(Params))
}

function evtSellSigna(e) {
    const userInput = e.target.value
    let numberBalance = Number(userInput)
    if (isNaN(numberBalance)) {
        numberBalance = Number(userInput.replace(',','.'))
    }
    if (isNaN(numberBalance) || Stats.aPrice === 0) {
        return
    }
    const Params = calculateSellFromSigna(numberBalance)
    document.getElementById('ipt_sell_tmg').value = Params.neededAsset
    document.getElementById('sell_effective_price').innerText = Params.effectivePrice.toFixed(4)
    document.getElementById('sell_price_impact').innerText = (Params.impact * 100).toFixed(2)
    document.getElementById('sell_op_cost_signa').innerText = NQTToNumber(Config.contractActivation + Config.transactionFee)
    document.getElementById('sell_op_cost_tmg').innerText = Params.poolFeeTmg
    console.log(JSON.stringify(Params))
}

async function evtBuy() {
    const userInput = document.getElementById('ipt_buy_signa').value
    let numberBalance = Number(userInput)
    if (isNaN(numberBalance)) {
        numberBalance = Number(userInput.replace(',','.'))
    }
    if (isNaN(numberBalance) || numberBalance <= NQTToNumber(Config.transactionFee) || Stats.aPrice === 0) {
        return
    }
    if (Global.walletResponse === null || Global.walletResponse === undefined) {
        unlinkAccount()
        showError("Signum XT wallet extension not activated. To use this feature you need to install the extension and link your account at main page.")
        return
    }
    numberBalance -= NQTToNumber(Config.transactionFee)

    const parameters = {
        amountNQT: (numberBalance*1E8).toFixed(0),
        publicKey: Global.walletResponse.publicKey,
        recipient: Config.smartContractId,
        feeNQT: Config.transactionFee.toString(10),
        message: "trade",
        messageIsText: "true",
        deadline: "8",
    }
    try {
        const Response = await Global.signumJSAPI.service.send('sendMoney', parameters)
        const retObj = await Global.wallet.confirm(Response.unsignedTransactionBytes)
        console.log(retObj)
        showSuccess(`Transaction broadcasted! Id: ${retObj.transactionId}`)
    } catch(err) {
        showError(`Transaction failed.\n\n${err.message}`)
    }

}

async function evtSell() {
    const userInput = document.getElementById('ipt_sell_tmg').value
    let numberBalance = Number(userInput)
    if (isNaN(numberBalance)) {
        numberBalance = Number(userInput.replace(',','.'))
    }
    if (isNaN(numberBalance) || numberBalance <= 0 || Stats.aPrice === 0) {
        return
    }
    if (Global.walletResponse === null || Global.walletResponse === undefined) {
        unlinkAccount()
        showError("Signum XT wallet extension not activated. To use this feature you need to install the extension and link your account at main page.")
        return
    }
    const parameters = {
        asset: Config.assetId,
        quantityQNT: (numberBalance*100).toFixed(0),
        amountNQT: Config.contractActivation.toString(10),
        publicKey: Global.walletResponse.publicKey,
        recipient: Config.smartContractId,
        message: "trade",
        messageIsText: "true",
        feeNQT: Config.transactionFee.toString(10),
        deadline: "8",
    }
    try {
        const Response = await Global.signumJSAPI.service.send('transferAsset', parameters)
        const retObj = await Global.wallet.confirm(Response.unsignedTransactionBytes)
        console.log(retObj)
        showSuccess(`Transaction broadcasted! Id: ${retObj.transactionId}`)
    } catch(err) {
        showError(`Transaction failed.\n\n${err.message}`)
    }
}

async function evtAdd() {
    const userInputTmg = document.getElementById('ipt_add_tmg').value
    let numberTmg = Number(userInputTmg)
    if (isNaN(numberTmg)) {
        numberTmg = Number(userInputTmg.replace(',','.'))
    }
    if (isNaN(numberTmg) || numberTmg <= 0 || Stats.aPrice === 0) {
        return
    }
    const userInputSigna = document.getElementById('ipt_add_signa').value
    let numberSigna = Number(userInputSigna) - NQTToNumber(Config.transactionFee)
    if (isNaN(numberSigna)) {
        numberSigna = Number(userInputSigna.replace(',','.'))
    }
    if (isNaN(numberSigna) || numberSigna <= 0 || Stats.aPrice === 0) {
        return
    }
    if (Global.walletResponse === null || Global.walletResponse === undefined) {
        unlinkAccount()
        showError("Signum XT wallet extension not activated. To use this feature you need to install the extension and link your account at main page.")
        return
    }

    const parameters = {
        asset: Config.assetId,
        quantityQNT: (numberTmg*100).toFixed(0),
        amountNQT: (numberSigna*1E8).toFixed(0),
        publicKey: Global.walletResponse.publicKey,
        recipient: Config.smartContractId,
        message: "add",
        messageIsText: "true",
        feeNQT: Config.transactionFee.toString(10),
        deadline: "8",
    }
    try {
        const Response = await Global.signumJSAPI.service.send('transferAsset', parameters)
        const retObj = await Global.wallet.confirm(Response.unsignedTransactionBytes)
        console.log(retObj)
        showSuccess(`Transaction broadcasted! Id: ${retObj.transactionId}`)
    } catch(err) {
        showError(`Transaction failed.\n\n${err.message}`)
    }
}

async function evtRemove() {
    const userInput = document.getElementById('ipt_remove_lctmg').value
    let numberLctmg = Number(userInput)
    if (isNaN(numberLctmg)) {
        numberLctmg = Number(userInput.replace(',','.'))
    }
    if (isNaN(numberLctmg) || numberLctmg <= 0 || Stats.aPrice === 0) {
        return
    }
    if (Global.walletResponse === null || Global.walletResponse === undefined) {
        unlinkAccount()
        showError("Signum XT wallet extension not activated. To use this feature you need to install the extension and link your account at main page.")
        return
    }

    const parameters = {
        asset: Config.lcId,
        quantityQNT: numberLctmg.toFixed(0),
        amountNQT: Config.contractActivation.toString(10),
        publicKey: Global.walletResponse.publicKey,
        recipient: Config.smartContractId,
        message: "remove",
        messageIsText: "true",
        feeNQT: Config.transactionFee.toString(10),
        deadline: "8",
    }
    try {
        const Response = await Global.signumJSAPI.service.send('transferAsset', parameters)
        const retObj = await Global.wallet.confirm(Response.unsignedTransactionBytes)
        console.log(retObj)
        showSuccess(`Transaction broadcasted! Id: ${retObj.transactionId}`)
    } catch(err) {
        showError(`Transaction failed.\n\n${err.message}`)
    }
}

function showError(message) {
    document.getElementById('modal_heading_text').innerHTML = "Error..."
    document.getElementById('modal_text').innerHTML = message.replace(/\n/g, "<br />");
    document.getElementById("modal_window").classList.add('open');
}

function supressError(message) {
    console.log("SUPRESSED: " + message)
}

function showSuccess(message) {
    document.getElementById('modal_heading_text').innerHTML = "Success!"
    document.getElementById('modal_text').innerHTML = message.replace(/\n/g, "<br />") + "<br><br>Wait 8 minutes and check your account.";
    document.getElementById("modal_window").classList.add('open');
}

async function activateWalletXT(errorCallback) {
    if (Global.wallet === undefined) {
        if (localStorage.getItem("acceptedSlippage") !== "true") {
            if (!window.confirm(Config.slippageMessage)) {
                return
            }
            localStorage.setItem("acceptedSlippage","true");
        }
        Global.wallet = new sig$wallets.GenericExtensionWallet();
        try {
            Global.walletResponse = await Global.wallet.connect({
                appName: Config.appName ,
                networkName: Config.networkName
            })
            updateDefaultNode(Global.walletResponse.currentNodeHost)
            Global.walletSubscription = Global.walletResponse.listen({
                onAccountChanged: (newVal) => {
                    Global.walletResponse.publicKey = newVal.accountPublicKey;
                    Global.walletResponse.accountId = newVal.accountId;
                    updateLinkedAccount();
                },
                onNetworkChanged: (newNetwork) => {
                    if (newNetwork.networkName !== Config.networkName) {
                        unlinkAccount()
                        return;
                    }
                    updateDefaultNode(newNetwork.networkHost)
                },
                onPermissionRemoved: unlinkAccount,
                onAccountRemoved: unlinkAccount
            })
            localStorage.setItem("hasXT", "true");    
        } catch (err) {
            unlinkAccount()
            errorCallback("Signum XT Wallet link error:\n\n" + err.message)
        }
        requestContractData()
        updateLinkedAccount()
        updateStatusTable()
        updateOBTradesTable()
    }
}

function enableLinkedInfo() {
    const spans = document.getElementsByName("linked");
    spans.forEach( dom => {
        dom.style.display = 'block'
    })
    const ll = document.getElementsByName("unlinked");
    ll.forEach( dom => {
        dom.style.display = 'none'
    })
}

function disableLinkedInfo() {
    const spans = document.getElementsByName("linked");
    spans.forEach( dom => {
        dom.style.display = 'none'
    })
    const ll = document.getElementsByName("unlinked");
    ll.forEach( dom => {
        dom.style.display = 'block'
    })
}

function updateDefaultNode(selectedNode) {
    Global.server = selectedNode
    Global.signumJSAPI = sig$.composeApi({
        nodeHost: Global.server
    });
    if (Stats === undefined) {
        setTimeout(async () => {
            Stats = await getPoolStatsAtHeight()
            updateContractDetails()
        }, 100)
    }
    
}

function assertStats() {
    if (Stats === undefined) {
        showError(`Pool data not loaded, ${Global.server} may be not responding or out of sync. Try to refresh the page or link you wallet to other node.`)
        throw new Error("UNDEFINED_STATS")
    }
}

function unlinkAccount() {
    Global.walletSubscription?.unlisten()
    Global.wallet = undefined
    Global.walletResponse = undefined
    Global.extendedInfo = undefined
    localStorage.removeItem("hasXT");
    updateLinkedAccount()
}

async function updateLinkedAccount() {
    document.getElementById('user_name').innerText = ''
    document.getElementById('user_signa').innerText = ''
    document.getElementById('user_tmg').innerText = ''
    document.getElementById('user_lctmg').innerText = ''
    document.getElementById('user_signa_locked').innerText = ''
    document.getElementById('user_tmg_locked').innerText = ''
    document.getElementById('user_lctmg_locked').innerText = ''

    if (Global.walletResponse === null || Global.walletResponse === undefined) {
        // Not linked
        document.getElementById('user_rs').innerText = "Not linked"
        disableLinkedInfo()
        return
    }
    // linked
    enableLinkedInfo()
    document.getElementById('user_rs').innerText = idTOaccount(Global.walletResponse.accountId)

    try {
        await getExtendedAccountInfo()
    } catch(err) {
        supressError("updateLinkedAccount: " + err.message)
        return
    }

    document.getElementById('user_rs').innerText = idTOaccount(Global.walletResponse.accountId)
    document.getElementById('user_name').innerText = Global.extendedInfo.name

    document.getElementById('user_signa').innerText = formatAmount(Global.extendedInfo.signa, 8)
    document.getElementById('user_tmg').innerText = formatAmount(Global.extendedInfo.tmg, 2)
    document.getElementById('user_lctmg').innerText = Global.extendedInfo.lctmg
    document.getElementById('user_signa_locked').innerText = formatAmount(Global.extendedInfo.signaLocked, 8)
    document.getElementById('user_tmg_locked').innerText = formatAmount(Global.extendedInfo.tmgLocked, 2)
    document.getElementById('user_lctmg_locked').innerText = Global.extendedInfo.lctmgLocked

    const Params = calculateRemove(Global.extendedInfo.lctmg)
    document.getElementById('user_liquidity_signa').innerText = Params.removedSigna.toFixed(4)
    document.getElementById('user_liquidity_tmg').innerText = Params.removedAsset
}

function formatAmount(num, decimals) {
    let strNum = num.toString();
    const frac = strNum.split('.')[1]
    if (!frac || frac.length <= decimals) {
        return strNum
    }
    return num.toFixed(decimals)
}

async function getExtendedAccountInfo() {
    const Response = await Global.signumJSAPI.service.query('getAccount', { account: Global.walletResponse.accountId })
    Global.extendedInfo = {}
    if (Response.name === undefined) {
        Global.extendedInfo.name = ''
    } else {
        Global.extendedInfo.name = Response.name
    }
    Global.extendedInfo.signa = Number(Response.unconfirmedBalanceNQT) / 1E8
    Global.extendedInfo.signaLocked = (Number(Response.balanceNQT) / 1E8) - Global.extendedInfo.signa
    if (Response.assetBalances === undefined) {
        Global.extendedInfo.tmg = 0
        Global.extendedInfo.tmgLocked = 0
        Global.extendedInfo.lctmg = 0
        Global.extendedInfo.lctmgLocked = 0
    } else {
        const tmgUB = Response.unconfirmedAssetBalances.find( Obj => Obj.asset === Config.assetId)
        if (tmgUB) {
            Global.extendedInfo.tmg = Number(tmgUB.unconfirmedBalanceQNT) / 100
        } else {
            Global.extendedInfo.tmg = 0
        }
        const tmg = Response.assetBalances.find(Obj => Obj.asset === Config.assetId)
        if (tmg) {
            Global.extendedInfo.tmgLocked = (Number(tmg.balanceQNT) / 100) - Global.extendedInfo.tmg
        } else {
            Global.extendedInfo.tmgLocked = 0
        }
        const lctmgUB = Response.unconfirmedAssetBalances.find(Obj => Obj.asset === Config.lcId)
        if (lctmgUB) {
            Global.extendedInfo.lctmg = Number(lctmgUB.unconfirmedBalanceQNT)
        } else {
            Global.extendedInfo.lctmg = 0
        }
        const lctmg = Response.assetBalances.find(Obj => Obj.asset === Config.lcId)
        if (lctmg) {
            Global.extendedInfo.lctmgLocked = Number(lctmg.balanceQNT) - Global.extendedInfo.lctmg
        } else {
            Global.extendedInfo.lctmgLocked = 0
        }
    }
}

function updateContractDetails() {
    assertStats()
    document.getElementById("contract_rs").innerHTML = `<a href="https://explorer.notallmine.net/address/${Config.smartContractId}" target="_blank">${idTOaccount(Config.smartContractId)}</a>`
    document.getElementById("contract_owner").innerText = Stats.owner
    document.getElementById("contract_price").innerText = Stats.aPrice.toFixed(2)
    document.getElementById("contract_signa").innerText = (Number(Stats.signaTotal)/1E8).toFixed(2)
    document.getElementById("contract_tmg").innerText = Number(Stats.assetTotal)/100
    document.getElementById("contract_liquidity").innerText = Number(Stats.currentLiquidity)
}

async function getPoolStatsAtHeight(height) {
    function decodeMemory(hexstring){
        const retObj = {
            longs: [],
            strings: [],
        }
        for (let i=0; i< hexstring.length; i+=16) {
            let hexlong = hexstring.slice(i,i+16);
            let txt = "";
            let val = 0n;
            let mult = 1n;
            for (let j=0; j<16; j+=2) {
                let byte = parseInt(hexlong.slice(j, j + 2), 16)
                if (byte >= 32 && byte <= 126) {
                    txt+=String.fromCharCode(byte);
                }
                val += mult*BigInt(byte);
                mult *= 256n;
            }
            retObj.strings.push(txt);
            retObj.longs.push(val);
        }
        return retObj;
    }

    if (!height) {
        height = ''
    } else {
        if (PoolHistory[height]) {
            return PoolHistory[height]
        }
    }

    let response
    try {
        response = await fetch(`${Global.server}/burst?requestType=getATDetails&at=${Config.smartContractId}&height=${height}`)
    } catch (error) {
        console.log(error.message)
        return;
    }

    const contractInfo = await response.json();
    if (contractInfo.machineData === undefined) {
        return;
    }

    const Variables = decodeMemory(contractInfo.machineData)
    PoolHistory[height] = {
        signaTotal: Variables.longs[16],
        assetTotal: Variables.longs[17],
        aPrice: (Number(Variables.longs[16])/1E6) / Number(Variables.longs[17]),
        trades: Number(Variables.longs[20]),
        volume: Variables.longs[21],
        currentLiquidity: Variables.longs[22],
        lastDistribution: Number(Variables.longs[25]),
        owner: idTOaccount(Variables.longs[27].toString(10))
    }
    return PoolHistory[height]
}

async function requestContractData() {

    Stats = await getPoolStatsAtHeight()
    updateContractDetails()

    update24hrStatus()


    getBuyOrders()
    getSellOrders()
}

async function update24hrStatus() {
    let response
    try {
        response = await fetch(`${Global.server}/burst?requestType=getBlockchainStatus`)
    } catch (error) {
        document.getElementById("contract_variation_24hr").innerHTML = "?";
        document.getElementById("contract_volume_24hr").innerHTML = "?";
        console.log(error.message)
        return;
    }

    const status = await response.json();
    if (status.errorCode !== undefined) {
        return;
    }

    const oneDayAgo = await getPoolStatsAtHeight(status.numberOfBlocks - 361)
    if (!oneDayAgo.aPrice) {
        document.getElementById("contract_variation_24hr").innerHTML = "?";
        document.getElementById("contract_volume_24hr").innerHTML = "?";
        console.log(error.message)
        return
    }

    let classColor = 'green'
    if (Stats.aPrice < oneDayAgo.aPrice) {
        classColor = 'red'
    }
    document.getElementById('contract_variation_24hr').innerHTML = `<strong class='${classColor}'>${(((Stats.aPrice - oneDayAgo.aPrice)*100)/oneDayAgo.aPrice).toFixed(1)}%</strong>`
    document.getElementById('contract_volume_24hr').innerHTML = (Number(Stats.volume - oneDayAgo.volume)/1E8).toFixed(2)
}

async function getBuyOrders() {

    let response
    try {
        response = await fetch(`${Global.server}/burst?requestType=getBidOrders&asset=${Config.assetId}&firstIndex=0&lastIndex=30`)
    } catch (error) {
        document.getElementById("buy_orders").innerHTML = "";
        console.log(error.message)
        return;
    }

    const OrdersResp = await response.json();
    if (OrdersResp.errorCode !== undefined) {
        document.getElementById("buy_orders").innerHTML = "";
        return;
    }

    let buys = [];
    let lastQty = 0;
    let output = ""
    let counter = 0;
    for (const Order of OrdersResp.bidOrders) {
        if (counter <= Config.ordersToShow) {
            output += '<tr>'
            output += `<td>${Order.accountRS}</td>`
            output += `<td>${Number(Order.quantityQNT)/100}</td>`
            output += `<td><strong>${Number(Order.priceNQT)/1000000}</strong></td>`
            output += `<td>${((Number(Order.priceNQT)*Number(Order.quantityQNT))/100000000).toFixed(2)}</td>`
            output += '</tr>'
        }
        lastQty += Number(Order.quantityQNT)/100
        buys.push([Number(Order.priceNQT)/1000000, lastQty ])
        counter++;
    }
    document.getElementById("buy_orders").innerHTML = output;
    Global.notchChart.series[0].setData(buys);
}

async function getSellOrders() {
    let response
    try {
        response = await fetch(`${Global.server}/burst?requestType=getAskOrders&asset=${Config.assetId}&firstIndex=0&lastIndex=30`)
    } catch (error) {
        console.log(error.message)
        return;
    }

    const OrdersResp = await response.json();
    if (OrdersResp.errorCode !== undefined) {
        document.getElementById("sell_orders").innerHTML = "";
        return;
    }

    let sells = []
    let lastQty = 0
    let output = ""
    let counter = 0;
    for (const Order of OrdersResp.askOrders) {
        if (counter <= Config.ordersToShow) {
            output += '<tr>'
            output += `<td>${Order.accountRS}</td>`
            output += `<td>${Number(Order.quantityQNT)/100}</td>`
            output += `<td><strong>${Number(Order.priceNQT)/1000000}</strong></td>`
            output += `<td>${((Number(Order.priceNQT)*Number(Order.quantityQNT))/100000000).toFixed(2)}</td>`
            output += '</tr>'
        }
        counter++;
        lastQty += Number(Order.quantityQNT)/100
        sells.push([Number(Order.priceNQT)/1000000, lastQty ])
    }
    document.getElementById("sell_orders").innerHTML = output;
    Global.notchChart.series[1].setData(sells);
}

async function updateStatusTable() {
    const transactions = []
    let response
    let respJSON
    try {
        response = await fetch(`${Global.server}/burst?requestType=getUnconfirmedTransactions&account=${Config.smartContractId}`)
        respJSON = await response.json();
    } catch (error) {
        console.log(error.message)
        return;
    }

    if (respJSON !== undefined && respJSON.errorCode === undefined) {
        transactions.push(...respJSON.unconfirmedTransactions)
    }
    try {
        response = await fetch(`${Global.server}/burst?requestType=getAccountTransactions&account=${Config.smartContractId}&firstIndex=0&lastIndex=50`)
        respJSON = await response.json();
    } catch (error) {
        console.log(error.message)
        return;
    }
    if (respJSON !== undefined && respJSON.errorCode === undefined) {
        transactions.push(...respJSON.transactions)
    }

    const getTotals = []
    const getQuantities = []

    let output = ""
    for (const tx of transactions) {
        if (tx.recipient !== Config.smartContractId) {
            continue
        }
        let status = 'Processed'
        if (!tx.confirmations) status = 'Confirmation pending'
        if (tx.confirmations === 0) status = 'Waiting contract activation'
        let action
        let quantity = ''
        let total = ''
        let price = ''
        let fees = ''
        switch (tx.attachment?.message) {
        case 'trade':
            if (tx.amountNQT === '42000000') {
                action = '<strong class="red">Sell</strong>'
                const effQty = BigInt(tx.attachment.quantityQNT) * 98n / 100n
                fees = `${Number(BigInt(tx.attachment.quantityQNT) - effQty)/100} TMG + 0.42 Signa`
                quantity = (Number(tx.attachment.quantityQNT)/100).toString()
                if (status === 'Processed') {
                    price = `<span id='${tx.transaction + 'price'}'>...</span>`
                    total = `<span id='${tx.transaction + 'total'}'>...</span>`
                    getTotals.push({
                        transaction: tx.transaction,
                        quantity: effQty,
                        height: tx.height
                    })
                }
            } else {
                action = '<strong class="green">Buy</strong>'
                const effTotal = (BigInt(tx.amountNQT) - 42000000n) * 98n / 100n
                fees = (Number(BigInt(tx.amountNQT) - effTotal)/1E8).toFixed(4) + ' Signa'
                total = (Number(tx.amountNQT)/1E8).toFixed(4)
                if (status === 'Processed') {
                    price = `<span id='${tx.transaction + 'price'}'>...</span>`
                    quantity = `<span id='${tx.transaction + 'quantity'}'>...</span>`
                    getQuantities.push({
                        transaction: tx.transaction,
                        total: effTotal,
                        height: tx.height
                    })
                }
            }
            break;
        case 'add':
            action = 'Add liquidity'
            quantity = (Number(tx.attachment.quantityQNT)/100).toString()
            total =  ((Number(tx.amountNQT)/1E8)).toFixed(4)
            fees = '0.42 Signa'
            break;
        case 'remove':
            action = 'Remove liquidity'
            fees = '0.42 Signa'
            quantity = tx.attachment.quantityQNT + " lcTMG"
            break;
        default:
            action = 'Unknown'
        }
        output += '<tr>'
        output += `<td>${formatTimestamp(tx.timestamp)}</td>`
        output += `<td>${status}</td>`
        output += `<td>${action}</td>`
        output += `<td>${quantity}</td>`
        output += `<td><strong>${price}</strong></td>`
        output += `<td>${total}</td>`
        output += `<td>${tx.senderRS}</td>`
        output += `<td>${fees}</td>`
        output += '</tr>'
    }
    document.getElementById("status_tbody").innerHTML = output;

    fillTotals(getTotals)
    fillQuantities(getQuantities)
}

async function fillTotals(infoArray) {
    for (const item of infoArray) {
        solveTotal(item)      
    }
}
async function fillQuantities(infoArray) {
    for (const item of infoArray) {
        solveQuantity(item)      
    }
}
async function solveTotal(item) {
    const statsN_1 = await getPoolStatsAtHeight(item.height)
    const statsN = await getPoolStatsAtHeight(item.height + 1)
    const total = (Number(item.quantity * statsN.signaTotal / statsN_1.assetTotal) / 1E8).toFixed(4)
    document.getElementById(`${item.transaction}price`).innerText = (Number(statsN.signaTotal / statsN_1.assetTotal) / 1E6).toFixed(4)
    document.getElementById(`${item.transaction}total`).innerText = total
}
async function solveQuantity(item) {
    const statsN_1 = await getPoolStatsAtHeight(item.height)
    const statsN = await getPoolStatsAtHeight(item.height + 1)
    const quantity = Number(item.total * statsN_1.assetTotal / statsN.signaTotal) / 100
    document.getElementById(`${item.transaction}price`).innerText = (Number(statsN.signaTotal / statsN_1.assetTotal) / 1E6).toFixed(4)
    document.getElementById(`${item.transaction}quantity`).innerText = quantity
}

async function updateOBTradesTable() {
    const trades = []
    let response
    let respJSON
    try {
        response = await fetch(`${Global.server}/burst?requestType=getTrades&asset=${Config.assetId}&firstIndex=0&lastIndex=20`)
        respJSON = await response.json();
    } catch (error) {
        console.log(error.message)
        return;
    }

    if (respJSON !== undefined && respJSON.errorCode === undefined) {
        trades.push(...respJSON.trades)
    }

    let output = ""
    for (const tx of trades) {
        let action, quantity, account
        const total = ((Number(tx.quantityQNT) * Number(tx.priceNQT))/1e8).toFixed(2)
        const price = (Number(tx.priceNQT)/1e6)
        if (tx.tradeType === 'sell') {
            action = '<strong class="red">Sell</strong>'
            quantity = (Number(tx.quantityQNT)/100).toString() + " TMG"
            account = tx.sellerRS
        } else {
            action = '<strong class="green">Buy</strong>'
            quantity = ((Number(tx.quantityQNT)/100)).toString() + " TMG"
            account = tx.buyerRS
        }
        output += '<tr>'
        output += `<td>${formatTimestamp(tx.timestamp)}</td>`
        output += '<td>Processed</td>'
        output += `<td>${action}</td>`
        output += `<td>${quantity}</td>`
        output += `<td><strong>${price}</strong></td>`
        output += `<td>${total}</td>`
        output += `<td>${account}</td>`
        output += '<td></td>'
        output += '</tr>'
    }
    document.getElementById("ob_trades_tbody").innerHTML = output;

}

function formatTimestamp (timestamp, date_only) {
    let date
    if (timestamp instanceof Date) {
        date = timestamp
    } else {
        date = new Date(Date.UTC(2014, 7, 11, 2, 0, 0, 0) + timestamp * 1000)
    }
    if (date_only) {
        return date.toLocaleDateString()
    }
    return date.toLocaleString()
}

//Input id in unsigned long (BigInt)
//Output string with account address (Reed-Salomon encoded)
function idTOaccount(id) {

    let gexp = [1, 2, 4, 8, 16, 5, 10, 20, 13, 26, 17, 7, 14, 28, 29, 31, 27, 19, 3, 6, 12, 24, 21, 15, 30, 25, 23, 11, 22, 9, 18, 1]
    let glog = [0, 0, 1, 18, 2, 5, 19, 11, 3, 29, 6, 27, 20, 8, 12, 23, 4, 10, 30, 17, 7, 22, 28, 26, 21, 25, 9, 16, 13, 14, 24, 15]
    let cwmap = [3, 2, 1, 0, 7, 6, 5, 4, 13, 14, 15, 16, 12, 8, 9, 10, 11]
    let alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ".split("")
    let base32alpha="0123456789abcdefghijklmnopqrstuv"
    let base32Length = 13
    let account = "S-"
    let i;
    
    function gmult(a, b) {
        if (a == 0 || b == 0) {
            return 0;
        }
        return gexp[ (glog[a] + glog[b]) % 31 ]
    }
    
    const base32=BigInt(id).toString(32).padStart(13,"0").split("")
    const codeword=[]
    for (i=0; i<base32Length; i++){
        codeword.push( base32alpha.indexOf(base32[12-i]) );
    }
    const p = [0, 0, 0, 0]
    for (i=base32Length-1; i>=0; i--) {
        let fb = codeword[i] ^ p[3]
        p[3] = p[2] ^ gmult(30, fb)
        p[2] = p[1] ^ gmult(6, fb)
        p[1] = p[0] ^ gmult(9, fb)
        p[0] = gmult(17, fb)
    }
    codeword.push(p[0], p[1], p[2], p[3])
    for (i=0; i<17; i++) {
        account+=alphabet[codeword[cwmap[i]]]
            if ((i & 3) == 3 && i < 13) {
                account+="-"
            }
    }
    return account
}
