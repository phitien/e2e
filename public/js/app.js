Observable(window, 'content', switchContent, 'summary')
Observable(window, 'duration', updateDuration, '24-hours-1')
Observable(window, 'tradeData', setData)
Observable(window, 'systems', updateSystems)
Observable(window, 'success', update)
Observable(window, 'failed', update)
Observable(window, 'colors', null, ['#2ab4c0','#5C9BD1','#f36a5a','#8877a9','#2ab4c0','#2ab4c0','#2ab4c0'])

function switchContent() {
    $('.content').hide()
    $(`.content.${content}`).show()
    $('.switch').html(content == 'summary' ? 'Show history' : 'Show summary')
}
function setData(data) {
    let _success = 0, _failed = 0
    systems = data.systems
    systems.forEach(s => {
        _success += s.trades.success.reduce((rs, i) => rs = rs + i, 0)
        _failed += s.trades.failed.reduce((rs, i) => rs = rs + i, 0)
    })
    success = _success
    failed = _failed
}
function update() {
    $('.success').html(success)
    $('.failed').html(failed)
    $('.total').html(success + failed)
}
function updateSystems() {
    updateBarCharts()
    updatePieCharts()
    $('.systems').html('')
    systems.forEach((s,i) => {
        let ok = s.trades.success.reduce((sum,i) => sum = sum + i, 0),
            ko = s.trades.failed.reduce((sum,i) => sum = sum + i, 0)
        $('.systems').append(`<tr>
        <td><span class="font-purple-soft"><span class="legend-item" style="background-color: ${colors[i]}"></span>${s.name}</span></td>
        <td><span class="font-green-haze">${ok + ko}</span></td>
        <td><span class="font-blue-sharp">${ok}</span></td>
        <td><span class="font-red-haze">${ko}</span></td>
        </tr>`)
        $('.progress-success .progress-bar').width(`${(100*ok/(ok+ko)).toPrecision(2)}%`)
        $('.progress-success .status-number').html(`${(100*ok/(ok+ko)).toPrecision(2)}%`)
        $('.progress-failed .progress-bar').width(`${(100*ko/(ok+ko)).toPrecision(2)}%`)
        $('.progress-failed .status-number').html(`${(100*ko/(ok+ko)).toPrecision(2)}%`)
    })
}
function updateDuration() {
    barChartsDurationUpdate()
    fetch()
}
function fetch() {
    $.ajax({
        url: `data/${duration}.json`,
        dataType: 'json',
        success: data => tradeData = data
    })
}

$(document).ready(() => {
    duration = $('.duration label.active').data('value')
    setupBarCharts()
    setupPieCharts()
    $('.duration label.switch').click(function() {
        content = content == 'summary' ? 'history' : 'summary'
    })
    $('.duration label.time').click(function() {
        $(this).parent().find('label').removeClass('active')
        $(this).addClass('active')
        duration = $(this).data('value')
    })
    setupTradesHistory()
})

function Observable(o, p, cb, v) {
    if (v !== undefined && v !== null) o[`__${p}`] = v
    Object.defineProperty(o, p, {
        get: function() {
            return this[`__${p}`]
        }.bind(o),
        set: function(v) {
            this[`__${p}`] = v;
            if (cb) cb(v)
        }.bind(o)
    })
}

Observable(window, 'threshold', updateLineChart, 120)
Observable(window, 'lineChartData', updateLineChart, [])

const statuses = {
    'sent': 'Sent', 'failed': 'Failed', 'ack': 'Ack', 'nack': 'Nack', 'wait': 'Wait', 'success': 'Success'
}
const fieldNames = {
    'id': 'ID', 'tradeId': 'TradeID', 'productType': 'Product', 'service': 'Service', 'msgTimeStamp': 'TimeStamp', 'status': 'Status'
}
function buildStatusIcon(text, key) {
    return `<span class="status-icon ${key || text.toLowerCase().replace(/\W/, '-')}"></span>`
}
function buildStatusText(text, key) {
    return `<span class="status-text ${key || text.toLowerCase().replace(/\W/, '-')}">${text}</span>`
}
function buildAtrributeValue(a) {
    if (a.field == 'msgTimeStamp') return moment(a.value).format('Do MMM, YYYY HH:MM:SS')
    if (a.field == 'status') return `${buildStatusIcon(a.value)}`
    return a.value
}
function buildTradeDetailAttributes(data) {
    let attrs = ['id', 'tradeId', 'productType', 'service', 'msgTimeStamp', 'status'].map(k => ({field: k, name: fieldNames[k], value: data[k]}))
    return `<table class="jtable"><tbody>
        ${attrs.map(a => `<tr class="jtable-data-row"><td>${a.name}</td><td>${buildAtrributeValue(a)}</td></tr>`).join('')}
    </tbody></table>`
}
function buildBlueRail(nodes) {
    let i = 0, n = nodes[i]
    while(n && n.status == 'sent') {
        n = nodes[i++]
    }
    let width = 100*(i-2)/(nodes.length - 1)
    return `<div class="trade-tracks-blue-rail" data-width="${width}%" style="width: 0%"></div>`
}
function buildTrackNode(node, nodes, i) {
    let left = 100*i/(nodes.length - 1)
    return `<div class="trade-tracks-node" style="left: ${left}%">${buildStatusIcon(node.status)}</div>`
}
function buildTrackNodeInfo(node, nodes, i) {
    let left = 100*i/(nodes.length - 1)
    return `<div class="trade-tracks-node-info" style="left: ${left}%">
        <div class="trade-tracks-node-name">${node.name}</div>
        <div class="trade-tracks-node-time">${node.date}</div>
    </div>`
}
function buildTradeDetailHtml(data) {
    return `<div class="ng-scope trade-detail">
        <form name="roleCreateOrEditForm" role="form" novalidate="" class="form-validation ng-pristine ng-valid-maxlength ng-valid ng-valid-required">
            <div class="modal-header">
                <h4 class="modal-title">
                    <span ng-if="vm.role.id" class="ng-binding ng-scope">Trade detail</span>
                </h4>
            </div>
            <div class="modal-body">
                <div class="row">
                    <div class="col-xs-3 jtable-main-container trade-attributes">
                        ${buildTradeDetailAttributes(data)}
                    </div>
                    <div class="col-xs-9">
                        <div class="row trade-tracks">
                            <div class="col-xs-2">
                                <div class="status-legend">
                                    ${Object.keys(statuses).map(k => `<div class="status-legend-item">${buildStatusIcon(statuses[k], k)}${buildStatusText(statuses[k], k)}</div>`).join('')}
                                </div>
                            </div>
                            <div class="col-xs-10">
                                <div class="trade-tracks-line">
                                    <div class="trade-tracks-rail">
                                        ${buildBlueRail(data.tracks)}
                                        ${data.tracks.map((t,i) => buildTrackNode(t, data.tracks, i)).join('')}
                                        ${data.tracks.map((t,i) => buildTrackNodeInfo(t, data.tracks, i)).join('')}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="row trade-chart"></div>
                    </div>
                </div>
            </div>
        </form>
    </div>`
}

function updateLineChart() {
    console.log(lineChartData)
    $.plot($('.trade-chart'), [{
        data: lineChartData,
        color: 'rgb(30, 180, 20)',
        threshold: {below: threshold, color: 'rgb(200, 20, 30)'},
        lines: {steps: true}
    }])
}

class TradeDetail {
    constructor(data) {
        let $dialog = $(buildTradeDetailHtml(data)).dialog({
            modal: true,
            width: 1024,
            create: function(e, ui) {
                let dialog = $(this).closest('.ui-dialog')
                dialog.find('.ui-dialog-titlebar').remove()
                dialog.find('.ui-dialog-buttonpane').remove()
            },
            open: function(e, ui) {
                $('.ui-widget-overlay').bind('click', e => $dialog.dialog('close'))
                let $rail = $('.trade-tracks-blue-rail')
                $rail.animate({
                    width: $rail.data('width'),
                }, 1500)
                let $chart = $('.trade-chart')
                $chart.height($chart.height()).width($chart.width())
                lineChartData = data.data.map(({name, value}, i) => [i, value])
                threshold = data.threshold
            },
            close: function(e, ui) {
                $dialog.dialog('close')
                $dialog.remove()
            }
        })
    }
}

Observable(window, 'barChartLabels')

Observable(window, 'detailBarChart')
Observable(window, 'totalDetailBarChart')
Observable(window, 'successDetailBarChart')
Observable(window, 'failedDetailBarChart')

Observable(window, 'detailBarChartData')
Observable(window, 'totalDetailBarChartData')
Observable(window, 'successDetailBarChartData')
Observable(window, 'failedDetailBarChartData')

Observable(window, 'detailBarChartOptions')
Observable(window, 'totalDetailBarChartOptions')
Observable(window, 'successDetailBarChartOptions')
Observable(window, 'failedDetailBarChartOptions')

function barChartsDurationUpdate() {
    let [n, unit, pretty] = duration.split('-')
    if (pretty == 1) barChartLabels = Array.from({length: n}, (v, i) => moment().subtract(i, unit).fromNow()).reverse()
    else barChartLabels = Array.from({length: n}, (v, i) => moment().subtract(i, unit).format('Do MMM')).reverse()
}

function updateBarCharts() {
    let _total = Array.from({length: barChartLabels.length}, (v, i) => 0),
        _success = Array.from({length: barChartLabels.length}, (v, i) => 0),
        _failed = Array.from({length: barChartLabels.length}, (v, i) => 0)
    systems.forEach(s => {
        _success.forEach((n, i) => _success[i] += s.trades.success[i])
        _failed.forEach((n, i) => _failed[i] += s.trades.failed[i])
    })
    _total.forEach((n, i) => _total[i] = _success[i] + _failed[i])
    detailBarChartData.labels = totalDetailBarChartData.labels = successDetailBarChartData.labels = failedDetailBarChartData.labels = barChartLabels
    detailBarChartData.datasets[0].data = totalDetailBarChartData.datasets[0].data = _total
    detailBarChartData.datasets[1].data = successDetailBarChartData.datasets[0].data = _success
    detailBarChartData.datasets[2].data = failedDetailBarChartData.datasets[0].data = _failed
    detailBarChart.update()
    totalDetailBarChart.update()
    successDetailBarChart.update()
    failedDetailBarChart.update()
}

function getBarChartOptions(data) {
    return {
        type: 'bar',
        data: data,
        options: {
            legend: {display: false},
            title:{display: false,},
            tooltips: {mode: 'index',intersect: true},
            responsive: true,
            scales: {
                xAxes: [{
                    stacked: true,
                    display: false
                }],
                yAxes: [{
                    stacked: true,
                    display: false
                }]
            }
        }
    }
}
function getBarChartData(datasets) {
    return {
        labels: barChartLabels,
        datasets: datasets
    }
}
function setupBarCharts() {
    let sampeBarChartData = Array.from({length: barChartLabels.length}, (v, i) => 0)
    detailBarChartData = getBarChartData([{
        label: 'Total',
        backgroundColor: '#2ab4c0',
        data: sampeBarChartData
    }, {
        label: 'Success',
        backgroundColor: '#5C9BD1',
        data: sampeBarChartData
    }, {
        label: 'Failed',
        backgroundColor: '#f36a5a',
        data: sampeBarChartData
    }])
    detailBarChartOptions = getBarChartOptions(detailBarChartData)
    detailBarChartOptions.options.scales.yAxes[0].display = true
    detailBarChart = new Chart($('.detail-bar-chart canvas').get(0).getContext('2d'), detailBarChartOptions)

    totalDetailBarChartData = getBarChartData([{
        backgroundColor: '#2ab4c0',
        data: sampeBarChartData
    }])
    totalDetailBarChartOptions = getBarChartOptions(totalDetailBarChartData)
    totalDetailBarChart = new Chart($('.total-detail-bar-chart canvas').get(0).getContext('2d'), totalDetailBarChartOptions)

    successDetailBarChartData = getBarChartData([{
        backgroundColor: '#5C9BD1',
        data: sampeBarChartData
    }])
    successDetailBarChartOptions = getBarChartOptions(successDetailBarChartData)
    successDetailBarChart = new Chart($('.success-detail-bar-chart canvas').get(0).getContext('2d'), successDetailBarChartOptions)

    failedDetailBarChartData = getBarChartData([{
        backgroundColor: '#f36a5a',
        data: sampeBarChartData
    }])
    failedDetailBarChartOptions = getBarChartOptions(failedDetailBarChartData)
    failedDetailBarChart = new Chart($('.failed-detail-bar-chart canvas').get(0).getContext('2d'), failedDetailBarChartOptions)

    $('.popup-chart').each(function(i) {
        let $me = $(this)
        $me.data('height', $me.height())
        $me.data('width', $me.width())
    })
    $('.popup-chart').on('click', function() {
        let $me = $(this).height('auto').width('auto'),
            $parent = $me.parent()
        if (!$me.data('popup')) {
            let $dialog = $('#pupup').append($me).dialog({
                width: 1024,
                modal: true,
                create: function(e, ui) {
                    let dialog = $(this).closest('.ui-dialog')
                    dialog.find('.ui-dialog-titlebar').remove()
                    dialog.find('.ui-dialog-buttonpane').remove()
                },
                open: function(e, ui) {
                    $('.ui-widget-overlay').bind('click', e => $dialog.dialog('close'))
                },
                close: function(e, ui) {
                    $dialog.dialog('close')
                    $parent.append($me.data('popup', false).height($me.data('height')).width($me.data('width')))
                }
            })
            $me.data('popup', true)
        }
    })
}

Observable(window, 'pieChartLabels', null, [])

Observable(window, 'totalDetailPieChart')
Observable(window, 'successDetailPieChart')
Observable(window, 'failedDetailPieChart')

Observable(window, 'totalDetailPieChartData', null, [])
Observable(window, 'successDetailPieChartData', null, [])
Observable(window, 'failedDetailPieChartData', null, [])

Observable(window, 'totalDetailPieChartOptions')
Observable(window, 'successDetailPieChartOptions')
Observable(window, 'failedDetailPieChartOptions')

function updatePieCharts() {
    pieChartLabels = systems.map(s => s.name)
    let _success = pieChartLabels.map(n => systems.find(s => s.name == n).trades.success.reduce((sum, i) => sum = sum + i, 0)),
        _failed = pieChartLabels.map(n => systems.find(s => s.name == n).trades.failed.reduce((sum, i) => sum = sum + i, 0)),
        _total = pieChartLabels.map((n, i) => _success[i] + _failed[i])

    totalDetailPieChartOptions.data.labels = successDetailPieChartOptions.data.labels = failedDetailPieChartOptions.data.labels = pieChartLabels
    totalDetailPieChartOptions.data.datasets[0].data = _total
    successDetailPieChartOptions.data.datasets[0].data = _success
    failedDetailPieChartOptions.data.datasets[0].data = _failed
    totalDetailPieChart.update()
    successDetailPieChart.update()
    failedDetailPieChart.update()
}

function getPieChartOptions(data) {
    return {
        type: 'pie',
        data: {
            datasets: [{
                data: data,
                backgroundColor: colors,
                label: 'Systems'
            }],
            labels: pieChartLabels
        },
        options: {
            legend: {display: false},
            responsive: true
        }
    }
}
function setupPieCharts() {
    totalDetailPieChartOptions = getPieChartOptions(totalDetailPieChartData)
    totalDetailPieChart = new Chart($('.total-detail-pie-chart canvas').get(0).getContext('2d'), totalDetailPieChartOptions)

    successDetailPieChartOptions = getPieChartOptions(successDetailPieChartData)
    successDetailPieChart = new Chart($('.success-detail-pie-chart canvas').get(0).getContext('2d'), successDetailPieChartOptions)

    failedDetailPieChartOptions = getPieChartOptions(failedDetailPieChartData)
    failedDetailPieChart = new Chart($('.failed-detail-pie-chart canvas').get(0).getContext('2d'), failedDetailPieChartOptions)
}

Observable(window, 'listTradeUrl', switchContent, 'data/trades.json')
Observable(window, 'detailTradeUrl', switchContent, 'data/trade.json')

function loadTrades() {
    $('.trade-table').jtable('load')
}
function setupTradesHistory() {
    $('.btn-search').click(loadTrades)
    $('.btn-reset').click(function() {
        $('.filter-form').get(0).reset()
        loadTrades()
    })
    let $daterangepicker = $('.date-range-picker').daterangepicker({
        initialText: 'Please select a range',
        datepickerOptions : {
            numberOfMonths : 2,
            // minDate: 0,
            maxDate: 0
        },
        change: function(e, data) {
            let range = JSON.parse($daterangepicker.val())
            $(`input[name=FromDate]`).val(range.start)
            $(`input[name=toDate]`).val(range.end)
        }
    })
    let $table = $('.trade-table')
    $table.jtable({
        paging: true, pageSize: 10,
        fields: {
            tradeId: {title: 'Trade ID'},
            productType: {title: 'Product Type'},
            service: {title: 'Service'},
            msgTimeStamp: {title: 'Timestamp'},
            status: {title: 'Status', display: function(data) {
                return `<div class="cell-status" ${data.record.status}>${data.record.status}</div>`
            }},
        },
        actions: {
            listAction: function(data, params) {
                return $.Deferred(function($dfd) {
                    $.ajax({
                        url: `${listTradeUrl}?${$('.filter-form').serialize()}`,
                        dataType: 'json',
                        success: function(res) {
                            $dfd.resolve(res.body)
                        },
                        error: function(res) {
                            $dfd.reject()
                        }
                    })
                })
            }
        },
        recordsLoaded: function(e, list) {
            $table.find('.jtable-data-row').each(function(i) {
                let $row = $(this)
                $row.click(function(e) {
                    let row = list.records[i]
                    $.ajax({
                        url: detailTradeUrl,
                        dataType: 'json',
                        data: row,
                        success: function(res) {
                            new TradeDetail(res.body)
                        }
                    })
                })
            })
        }
    })
    loadTrades()
}

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImVudHJ5LmpzIiwiY2xhc3Nlcy9PYnNlcnZhYmxlLmpzIiwiY2xhc3Nlcy9UcmFkZURldGFpbC5qcyIsIm1vZHVsZXMvYmFyLWNoYXJ0cy5qcyIsIm1vZHVsZXMvcGllLWNoYXJ0cy5qcyIsIm1vZHVsZXMvdHJhZGVzLWhpc3RvcnkuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3pFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN6SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzNJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN4REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiYXBwLmpzIiwic291cmNlc0NvbnRlbnQiOlsiT2JzZXJ2YWJsZSh3aW5kb3csICdjb250ZW50Jywgc3dpdGNoQ29udGVudCwgJ3N1bW1hcnknKVxuT2JzZXJ2YWJsZSh3aW5kb3csICdkdXJhdGlvbicsIHVwZGF0ZUR1cmF0aW9uLCAnMjQtaG91cnMtMScpXG5PYnNlcnZhYmxlKHdpbmRvdywgJ3RyYWRlRGF0YScsIHNldERhdGEpXG5PYnNlcnZhYmxlKHdpbmRvdywgJ3N5c3RlbXMnLCB1cGRhdGVTeXN0ZW1zKVxuT2JzZXJ2YWJsZSh3aW5kb3csICdzdWNjZXNzJywgdXBkYXRlKVxuT2JzZXJ2YWJsZSh3aW5kb3csICdmYWlsZWQnLCB1cGRhdGUpXG5PYnNlcnZhYmxlKHdpbmRvdywgJ2NvbG9ycycsIG51bGwsIFsnIzJhYjRjMCcsJyM1QzlCRDEnLCcjZjM2YTVhJywnIzg4NzdhOScsJyMyYWI0YzAnLCcjMmFiNGMwJywnIzJhYjRjMCddKVxuXG5mdW5jdGlvbiBzd2l0Y2hDb250ZW50KCkge1xuICAgICQoJy5jb250ZW50JykuaGlkZSgpXG4gICAgJChgLmNvbnRlbnQuJHtjb250ZW50fWApLnNob3coKVxuICAgICQoJy5zd2l0Y2gnKS5odG1sKGNvbnRlbnQgPT0gJ3N1bW1hcnknID8gJ1Nob3cgaGlzdG9yeScgOiAnU2hvdyBzdW1tYXJ5Jylcbn1cbmZ1bmN0aW9uIHNldERhdGEoZGF0YSkge1xuICAgIGxldCBfc3VjY2VzcyA9IDAsIF9mYWlsZWQgPSAwXG4gICAgc3lzdGVtcyA9IGRhdGEuc3lzdGVtc1xuICAgIHN5c3RlbXMuZm9yRWFjaChzID0+IHtcbiAgICAgICAgX3N1Y2Nlc3MgKz0gcy50cmFkZXMuc3VjY2Vzcy5yZWR1Y2UoKHJzLCBpKSA9PiBycyA9IHJzICsgaSwgMClcbiAgICAgICAgX2ZhaWxlZCArPSBzLnRyYWRlcy5mYWlsZWQucmVkdWNlKChycywgaSkgPT4gcnMgPSBycyArIGksIDApXG4gICAgfSlcbiAgICBzdWNjZXNzID0gX3N1Y2Nlc3NcbiAgICBmYWlsZWQgPSBfZmFpbGVkXG59XG5mdW5jdGlvbiB1cGRhdGUoKSB7XG4gICAgJCgnLnN1Y2Nlc3MnKS5odG1sKHN1Y2Nlc3MpXG4gICAgJCgnLmZhaWxlZCcpLmh0bWwoZmFpbGVkKVxuICAgICQoJy50b3RhbCcpLmh0bWwoc3VjY2VzcyArIGZhaWxlZClcbn1cbmZ1bmN0aW9uIHVwZGF0ZVN5c3RlbXMoKSB7XG4gICAgdXBkYXRlQmFyQ2hhcnRzKClcbiAgICB1cGRhdGVQaWVDaGFydHMoKVxuICAgICQoJy5zeXN0ZW1zJykuaHRtbCgnJylcbiAgICBzeXN0ZW1zLmZvckVhY2goKHMsaSkgPT4ge1xuICAgICAgICBsZXQgb2sgPSBzLnRyYWRlcy5zdWNjZXNzLnJlZHVjZSgoc3VtLGkpID0+IHN1bSA9IHN1bSArIGksIDApLFxuICAgICAgICAgICAga28gPSBzLnRyYWRlcy5mYWlsZWQucmVkdWNlKChzdW0saSkgPT4gc3VtID0gc3VtICsgaSwgMClcbiAgICAgICAgJCgnLnN5c3RlbXMnKS5hcHBlbmQoYDx0cj5cbiAgICAgICAgPHRkPjxzcGFuIGNsYXNzPVwiZm9udC1wdXJwbGUtc29mdFwiPjxzcGFuIGNsYXNzPVwibGVnZW5kLWl0ZW1cIiBzdHlsZT1cImJhY2tncm91bmQtY29sb3I6ICR7Y29sb3JzW2ldfVwiPjwvc3Bhbj4ke3MubmFtZX08L3NwYW4+PC90ZD5cbiAgICAgICAgPHRkPjxzcGFuIGNsYXNzPVwiZm9udC1ncmVlbi1oYXplXCI+JHtvayArIGtvfTwvc3Bhbj48L3RkPlxuICAgICAgICA8dGQ+PHNwYW4gY2xhc3M9XCJmb250LWJsdWUtc2hhcnBcIj4ke29rfTwvc3Bhbj48L3RkPlxuICAgICAgICA8dGQ+PHNwYW4gY2xhc3M9XCJmb250LXJlZC1oYXplXCI+JHtrb308L3NwYW4+PC90ZD5cbiAgICAgICAgPC90cj5gKVxuICAgICAgICAkKCcucHJvZ3Jlc3Mtc3VjY2VzcyAucHJvZ3Jlc3MtYmFyJykud2lkdGgoYCR7KDEwMCpvay8ob2sra28pKS50b1ByZWNpc2lvbigyKX0lYClcbiAgICAgICAgJCgnLnByb2dyZXNzLXN1Y2Nlc3MgLnN0YXR1cy1udW1iZXInKS5odG1sKGAkeygxMDAqb2svKG9rK2tvKSkudG9QcmVjaXNpb24oMil9JWApXG4gICAgICAgICQoJy5wcm9ncmVzcy1mYWlsZWQgLnByb2dyZXNzLWJhcicpLndpZHRoKGAkeygxMDAqa28vKG9rK2tvKSkudG9QcmVjaXNpb24oMil9JWApXG4gICAgICAgICQoJy5wcm9ncmVzcy1mYWlsZWQgLnN0YXR1cy1udW1iZXInKS5odG1sKGAkeygxMDAqa28vKG9rK2tvKSkudG9QcmVjaXNpb24oMil9JWApXG4gICAgfSlcbn1cbmZ1bmN0aW9uIHVwZGF0ZUR1cmF0aW9uKCkge1xuICAgIGJhckNoYXJ0c0R1cmF0aW9uVXBkYXRlKClcbiAgICBmZXRjaCgpXG59XG5mdW5jdGlvbiBmZXRjaCgpIHtcbiAgICAkLmFqYXgoe1xuICAgICAgICB1cmw6IGBkYXRhLyR7ZHVyYXRpb259Lmpzb25gLFxuICAgICAgICBkYXRhVHlwZTogJ2pzb24nLFxuICAgICAgICBzdWNjZXNzOiBkYXRhID0+IHRyYWRlRGF0YSA9IGRhdGFcbiAgICB9KVxufVxuXG4kKGRvY3VtZW50KS5yZWFkeSgoKSA9PiB7XG4gICAgZHVyYXRpb24gPSAkKCcuZHVyYXRpb24gbGFiZWwuYWN0aXZlJykuZGF0YSgndmFsdWUnKVxuICAgIHNldHVwQmFyQ2hhcnRzKClcbiAgICBzZXR1cFBpZUNoYXJ0cygpXG4gICAgJCgnLmR1cmF0aW9uIGxhYmVsLnN3aXRjaCcpLmNsaWNrKGZ1bmN0aW9uKCkge1xuICAgICAgICBjb250ZW50ID0gY29udGVudCA9PSAnc3VtbWFyeScgPyAnaGlzdG9yeScgOiAnc3VtbWFyeSdcbiAgICB9KVxuICAgICQoJy5kdXJhdGlvbiBsYWJlbC50aW1lJykuY2xpY2soZnVuY3Rpb24oKSB7XG4gICAgICAgICQodGhpcykucGFyZW50KCkuZmluZCgnbGFiZWwnKS5yZW1vdmVDbGFzcygnYWN0aXZlJylcbiAgICAgICAgJCh0aGlzKS5hZGRDbGFzcygnYWN0aXZlJylcbiAgICAgICAgZHVyYXRpb24gPSAkKHRoaXMpLmRhdGEoJ3ZhbHVlJylcbiAgICB9KVxuICAgIHNldHVwVHJhZGVzSGlzdG9yeSgpXG59KVxuIiwiZnVuY3Rpb24gT2JzZXJ2YWJsZShvLCBwLCBjYiwgdikge1xuICAgIGlmICh2ICE9PSB1bmRlZmluZWQgJiYgdiAhPT0gbnVsbCkgb1tgX18ke3B9YF0gPSB2XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KG8sIHAsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzW2BfXyR7cH1gXVxuICAgICAgICB9LmJpbmQobyksXG4gICAgICAgIHNldDogZnVuY3Rpb24odikge1xuICAgICAgICAgICAgdGhpc1tgX18ke3B9YF0gPSB2O1xuICAgICAgICAgICAgaWYgKGNiKSBjYih2KVxuICAgICAgICB9LmJpbmQobylcbiAgICB9KVxufVxuIiwiT2JzZXJ2YWJsZSh3aW5kb3csICd0aHJlc2hvbGQnLCB1cGRhdGVMaW5lQ2hhcnQsIDEyMClcbk9ic2VydmFibGUod2luZG93LCAnbGluZUNoYXJ0RGF0YScsIHVwZGF0ZUxpbmVDaGFydCwgW10pXG5cbmNvbnN0IHN0YXR1c2VzID0ge1xuICAgICdzZW50JzogJ1NlbnQnLCAnZmFpbGVkJzogJ0ZhaWxlZCcsICdhY2snOiAnQWNrJywgJ25hY2snOiAnTmFjaycsICd3YWl0JzogJ1dhaXQnLCAnc3VjY2Vzcyc6ICdTdWNjZXNzJ1xufVxuY29uc3QgZmllbGROYW1lcyA9IHtcbiAgICAnaWQnOiAnSUQnLCAndHJhZGVJZCc6ICdUcmFkZUlEJywgJ3Byb2R1Y3RUeXBlJzogJ1Byb2R1Y3QnLCAnc2VydmljZSc6ICdTZXJ2aWNlJywgJ21zZ1RpbWVTdGFtcCc6ICdUaW1lU3RhbXAnLCAnc3RhdHVzJzogJ1N0YXR1cydcbn1cbmZ1bmN0aW9uIGJ1aWxkU3RhdHVzSWNvbih0ZXh0LCBrZXkpIHtcbiAgICByZXR1cm4gYDxzcGFuIGNsYXNzPVwic3RhdHVzLWljb24gJHtrZXkgfHwgdGV4dC50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoL1xcVy8sICctJyl9XCI+PC9zcGFuPmBcbn1cbmZ1bmN0aW9uIGJ1aWxkU3RhdHVzVGV4dCh0ZXh0LCBrZXkpIHtcbiAgICByZXR1cm4gYDxzcGFuIGNsYXNzPVwic3RhdHVzLXRleHQgJHtrZXkgfHwgdGV4dC50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoL1xcVy8sICctJyl9XCI+JHt0ZXh0fTwvc3Bhbj5gXG59XG5mdW5jdGlvbiBidWlsZEF0cnJpYnV0ZVZhbHVlKGEpIHtcbiAgICBpZiAoYS5maWVsZCA9PSAnbXNnVGltZVN0YW1wJykgcmV0dXJuIG1vbWVudChhLnZhbHVlKS5mb3JtYXQoJ0RvIE1NTSwgWVlZWSBISDpNTTpTUycpXG4gICAgaWYgKGEuZmllbGQgPT0gJ3N0YXR1cycpIHJldHVybiBgJHtidWlsZFN0YXR1c0ljb24oYS52YWx1ZSl9YFxuICAgIHJldHVybiBhLnZhbHVlXG59XG5mdW5jdGlvbiBidWlsZFRyYWRlRGV0YWlsQXR0cmlidXRlcyhkYXRhKSB7XG4gICAgbGV0IGF0dHJzID0gWydpZCcsICd0cmFkZUlkJywgJ3Byb2R1Y3RUeXBlJywgJ3NlcnZpY2UnLCAnbXNnVGltZVN0YW1wJywgJ3N0YXR1cyddLm1hcChrID0+ICh7ZmllbGQ6IGssIG5hbWU6IGZpZWxkTmFtZXNba10sIHZhbHVlOiBkYXRhW2tdfSkpXG4gICAgcmV0dXJuIGA8dGFibGUgY2xhc3M9XCJqdGFibGVcIj48dGJvZHk+XG4gICAgICAgICR7YXR0cnMubWFwKGEgPT4gYDx0ciBjbGFzcz1cImp0YWJsZS1kYXRhLXJvd1wiPjx0ZD4ke2EubmFtZX08L3RkPjx0ZD4ke2J1aWxkQXRycmlidXRlVmFsdWUoYSl9PC90ZD48L3RyPmApLmpvaW4oJycpfVxuICAgIDwvdGJvZHk+PC90YWJsZT5gXG59XG5mdW5jdGlvbiBidWlsZEJsdWVSYWlsKG5vZGVzKSB7XG4gICAgbGV0IGkgPSAwLCBuID0gbm9kZXNbaV1cbiAgICB3aGlsZShuICYmIG4uc3RhdHVzID09ICdzZW50Jykge1xuICAgICAgICBuID0gbm9kZXNbaSsrXVxuICAgIH1cbiAgICBsZXQgd2lkdGggPSAxMDAqKGktMikvKG5vZGVzLmxlbmd0aCAtIDEpXG4gICAgcmV0dXJuIGA8ZGl2IGNsYXNzPVwidHJhZGUtdHJhY2tzLWJsdWUtcmFpbFwiIGRhdGEtd2lkdGg9XCIke3dpZHRofSVcIiBzdHlsZT1cIndpZHRoOiAwJVwiPjwvZGl2PmBcbn1cbmZ1bmN0aW9uIGJ1aWxkVHJhY2tOb2RlKG5vZGUsIG5vZGVzLCBpKSB7XG4gICAgbGV0IGxlZnQgPSAxMDAqaS8obm9kZXMubGVuZ3RoIC0gMSlcbiAgICByZXR1cm4gYDxkaXYgY2xhc3M9XCJ0cmFkZS10cmFja3Mtbm9kZVwiIHN0eWxlPVwibGVmdDogJHtsZWZ0fSVcIj4ke2J1aWxkU3RhdHVzSWNvbihub2RlLnN0YXR1cyl9PC9kaXY+YFxufVxuZnVuY3Rpb24gYnVpbGRUcmFja05vZGVJbmZvKG5vZGUsIG5vZGVzLCBpKSB7XG4gICAgbGV0IGxlZnQgPSAxMDAqaS8obm9kZXMubGVuZ3RoIC0gMSlcbiAgICByZXR1cm4gYDxkaXYgY2xhc3M9XCJ0cmFkZS10cmFja3Mtbm9kZS1pbmZvXCIgc3R5bGU9XCJsZWZ0OiAke2xlZnR9JVwiPlxuICAgICAgICA8ZGl2IGNsYXNzPVwidHJhZGUtdHJhY2tzLW5vZGUtbmFtZVwiPiR7bm9kZS5uYW1lfTwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzPVwidHJhZGUtdHJhY2tzLW5vZGUtdGltZVwiPiR7bm9kZS5kYXRlfTwvZGl2PlxuICAgIDwvZGl2PmBcbn1cbmZ1bmN0aW9uIGJ1aWxkVHJhZGVEZXRhaWxIdG1sKGRhdGEpIHtcbiAgICByZXR1cm4gYDxkaXYgY2xhc3M9XCJuZy1zY29wZSB0cmFkZS1kZXRhaWxcIj5cbiAgICAgICAgPGZvcm0gbmFtZT1cInJvbGVDcmVhdGVPckVkaXRGb3JtXCIgcm9sZT1cImZvcm1cIiBub3ZhbGlkYXRlPVwiXCIgY2xhc3M9XCJmb3JtLXZhbGlkYXRpb24gbmctcHJpc3RpbmUgbmctdmFsaWQtbWF4bGVuZ3RoIG5nLXZhbGlkIG5nLXZhbGlkLXJlcXVpcmVkXCI+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwibW9kYWwtaGVhZGVyXCI+XG4gICAgICAgICAgICAgICAgPGg0IGNsYXNzPVwibW9kYWwtdGl0bGVcIj5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gbmctaWY9XCJ2bS5yb2xlLmlkXCIgY2xhc3M9XCJuZy1iaW5kaW5nIG5nLXNjb3BlXCI+VHJhZGUgZGV0YWlsPC9zcGFuPlxuICAgICAgICAgICAgICAgIDwvaDQ+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJtb2RhbC1ib2R5XCI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInJvd1wiPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY29sLXhzLTMganRhYmxlLW1haW4tY29udGFpbmVyIHRyYWRlLWF0dHJpYnV0ZXNcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICR7YnVpbGRUcmFkZURldGFpbEF0dHJpYnV0ZXMoZGF0YSl9XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY29sLXhzLTlcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJyb3cgdHJhZGUtdHJhY2tzXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvbC14cy0yXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJzdGF0dXMtbGVnZW5kXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAke09iamVjdC5rZXlzKHN0YXR1c2VzKS5tYXAoayA9PiBgPGRpdiBjbGFzcz1cInN0YXR1cy1sZWdlbmQtaXRlbVwiPiR7YnVpbGRTdGF0dXNJY29uKHN0YXR1c2VzW2tdLCBrKX0ke2J1aWxkU3RhdHVzVGV4dChzdGF0dXNlc1trXSwgayl9PC9kaXY+YCkuam9pbignJyl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb2wteHMtMTBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInRyYWRlLXRyYWNrcy1saW5lXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwidHJhZGUtdHJhY2tzLXJhaWxcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAke2J1aWxkQmx1ZVJhaWwoZGF0YS50cmFja3MpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICR7ZGF0YS50cmFja3MubWFwKCh0LGkpID0+IGJ1aWxkVHJhY2tOb2RlKHQsIGRhdGEudHJhY2tzLCBpKSkuam9pbignJyl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHtkYXRhLnRyYWNrcy5tYXAoKHQsaSkgPT4gYnVpbGRUcmFja05vZGVJbmZvKHQsIGRhdGEudHJhY2tzLCBpKSkuam9pbignJyl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJyb3cgdHJhZGUtY2hhcnRcIj48L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9mb3JtPlxuICAgIDwvZGl2PmBcbn1cblxuZnVuY3Rpb24gdXBkYXRlTGluZUNoYXJ0KCkge1xuICAgIGNvbnNvbGUubG9nKGxpbmVDaGFydERhdGEpXG4gICAgJC5wbG90KCQoJy50cmFkZS1jaGFydCcpLCBbe1xuICAgICAgICBkYXRhOiBsaW5lQ2hhcnREYXRhLFxuICAgICAgICBjb2xvcjogJ3JnYigzMCwgMTgwLCAyMCknLFxuICAgICAgICB0aHJlc2hvbGQ6IHtiZWxvdzogdGhyZXNob2xkLCBjb2xvcjogJ3JnYigyMDAsIDIwLCAzMCknfSxcbiAgICAgICAgbGluZXM6IHtzdGVwczogdHJ1ZX1cbiAgICB9XSlcbn1cblxuY2xhc3MgVHJhZGVEZXRhaWwge1xuICAgIGNvbnN0cnVjdG9yKGRhdGEpIHtcbiAgICAgICAgbGV0ICRkaWFsb2cgPSAkKGJ1aWxkVHJhZGVEZXRhaWxIdG1sKGRhdGEpKS5kaWFsb2coe1xuICAgICAgICAgICAgbW9kYWw6IHRydWUsXG4gICAgICAgICAgICB3aWR0aDogMTAyNCxcbiAgICAgICAgICAgIGNyZWF0ZTogZnVuY3Rpb24oZSwgdWkpIHtcbiAgICAgICAgICAgICAgICBsZXQgZGlhbG9nID0gJCh0aGlzKS5jbG9zZXN0KCcudWktZGlhbG9nJylcbiAgICAgICAgICAgICAgICBkaWFsb2cuZmluZCgnLnVpLWRpYWxvZy10aXRsZWJhcicpLnJlbW92ZSgpXG4gICAgICAgICAgICAgICAgZGlhbG9nLmZpbmQoJy51aS1kaWFsb2ctYnV0dG9ucGFuZScpLnJlbW92ZSgpXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgb3BlbjogZnVuY3Rpb24oZSwgdWkpIHtcbiAgICAgICAgICAgICAgICAkKCcudWktd2lkZ2V0LW92ZXJsYXknKS5iaW5kKCdjbGljaycsIGUgPT4gJGRpYWxvZy5kaWFsb2coJ2Nsb3NlJykpXG4gICAgICAgICAgICAgICAgbGV0ICRyYWlsID0gJCgnLnRyYWRlLXRyYWNrcy1ibHVlLXJhaWwnKVxuICAgICAgICAgICAgICAgICRyYWlsLmFuaW1hdGUoe1xuICAgICAgICAgICAgICAgICAgICB3aWR0aDogJHJhaWwuZGF0YSgnd2lkdGgnKSxcbiAgICAgICAgICAgICAgICB9LCAxNTAwKVxuICAgICAgICAgICAgICAgIGxldCAkY2hhcnQgPSAkKCcudHJhZGUtY2hhcnQnKVxuICAgICAgICAgICAgICAgICRjaGFydC5oZWlnaHQoJGNoYXJ0LmhlaWdodCgpKS53aWR0aCgkY2hhcnQud2lkdGgoKSlcbiAgICAgICAgICAgICAgICBsaW5lQ2hhcnREYXRhID0gZGF0YS5kYXRhLm1hcCgoe25hbWUsIHZhbHVlfSwgaSkgPT4gW2ksIHZhbHVlXSlcbiAgICAgICAgICAgICAgICB0aHJlc2hvbGQgPSBkYXRhLnRocmVzaG9sZFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNsb3NlOiBmdW5jdGlvbihlLCB1aSkge1xuICAgICAgICAgICAgICAgICRkaWFsb2cuZGlhbG9nKCdjbG9zZScpXG4gICAgICAgICAgICAgICAgJGRpYWxvZy5yZW1vdmUoKVxuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgIH1cbn1cbiIsIk9ic2VydmFibGUod2luZG93LCAnYmFyQ2hhcnRMYWJlbHMnKVxuXG5PYnNlcnZhYmxlKHdpbmRvdywgJ2RldGFpbEJhckNoYXJ0Jylcbk9ic2VydmFibGUod2luZG93LCAndG90YWxEZXRhaWxCYXJDaGFydCcpXG5PYnNlcnZhYmxlKHdpbmRvdywgJ3N1Y2Nlc3NEZXRhaWxCYXJDaGFydCcpXG5PYnNlcnZhYmxlKHdpbmRvdywgJ2ZhaWxlZERldGFpbEJhckNoYXJ0JylcblxuT2JzZXJ2YWJsZSh3aW5kb3csICdkZXRhaWxCYXJDaGFydERhdGEnKVxuT2JzZXJ2YWJsZSh3aW5kb3csICd0b3RhbERldGFpbEJhckNoYXJ0RGF0YScpXG5PYnNlcnZhYmxlKHdpbmRvdywgJ3N1Y2Nlc3NEZXRhaWxCYXJDaGFydERhdGEnKVxuT2JzZXJ2YWJsZSh3aW5kb3csICdmYWlsZWREZXRhaWxCYXJDaGFydERhdGEnKVxuXG5PYnNlcnZhYmxlKHdpbmRvdywgJ2RldGFpbEJhckNoYXJ0T3B0aW9ucycpXG5PYnNlcnZhYmxlKHdpbmRvdywgJ3RvdGFsRGV0YWlsQmFyQ2hhcnRPcHRpb25zJylcbk9ic2VydmFibGUod2luZG93LCAnc3VjY2Vzc0RldGFpbEJhckNoYXJ0T3B0aW9ucycpXG5PYnNlcnZhYmxlKHdpbmRvdywgJ2ZhaWxlZERldGFpbEJhckNoYXJ0T3B0aW9ucycpXG5cbmZ1bmN0aW9uIGJhckNoYXJ0c0R1cmF0aW9uVXBkYXRlKCkge1xuICAgIGxldCBbbiwgdW5pdCwgcHJldHR5XSA9IGR1cmF0aW9uLnNwbGl0KCctJylcbiAgICBpZiAocHJldHR5ID09IDEpIGJhckNoYXJ0TGFiZWxzID0gQXJyYXkuZnJvbSh7bGVuZ3RoOiBufSwgKHYsIGkpID0+IG1vbWVudCgpLnN1YnRyYWN0KGksIHVuaXQpLmZyb21Ob3coKSkucmV2ZXJzZSgpXG4gICAgZWxzZSBiYXJDaGFydExhYmVscyA9IEFycmF5LmZyb20oe2xlbmd0aDogbn0sICh2LCBpKSA9PiBtb21lbnQoKS5zdWJ0cmFjdChpLCB1bml0KS5mb3JtYXQoJ0RvIE1NTScpKS5yZXZlcnNlKClcbn1cblxuZnVuY3Rpb24gdXBkYXRlQmFyQ2hhcnRzKCkge1xuICAgIGxldCBfdG90YWwgPSBBcnJheS5mcm9tKHtsZW5ndGg6IGJhckNoYXJ0TGFiZWxzLmxlbmd0aH0sICh2LCBpKSA9PiAwKSxcbiAgICAgICAgX3N1Y2Nlc3MgPSBBcnJheS5mcm9tKHtsZW5ndGg6IGJhckNoYXJ0TGFiZWxzLmxlbmd0aH0sICh2LCBpKSA9PiAwKSxcbiAgICAgICAgX2ZhaWxlZCA9IEFycmF5LmZyb20oe2xlbmd0aDogYmFyQ2hhcnRMYWJlbHMubGVuZ3RofSwgKHYsIGkpID0+IDApXG4gICAgc3lzdGVtcy5mb3JFYWNoKHMgPT4ge1xuICAgICAgICBfc3VjY2Vzcy5mb3JFYWNoKChuLCBpKSA9PiBfc3VjY2Vzc1tpXSArPSBzLnRyYWRlcy5zdWNjZXNzW2ldKVxuICAgICAgICBfZmFpbGVkLmZvckVhY2goKG4sIGkpID0+IF9mYWlsZWRbaV0gKz0gcy50cmFkZXMuZmFpbGVkW2ldKVxuICAgIH0pXG4gICAgX3RvdGFsLmZvckVhY2goKG4sIGkpID0+IF90b3RhbFtpXSA9IF9zdWNjZXNzW2ldICsgX2ZhaWxlZFtpXSlcbiAgICBkZXRhaWxCYXJDaGFydERhdGEubGFiZWxzID0gdG90YWxEZXRhaWxCYXJDaGFydERhdGEubGFiZWxzID0gc3VjY2Vzc0RldGFpbEJhckNoYXJ0RGF0YS5sYWJlbHMgPSBmYWlsZWREZXRhaWxCYXJDaGFydERhdGEubGFiZWxzID0gYmFyQ2hhcnRMYWJlbHNcbiAgICBkZXRhaWxCYXJDaGFydERhdGEuZGF0YXNldHNbMF0uZGF0YSA9IHRvdGFsRGV0YWlsQmFyQ2hhcnREYXRhLmRhdGFzZXRzWzBdLmRhdGEgPSBfdG90YWxcbiAgICBkZXRhaWxCYXJDaGFydERhdGEuZGF0YXNldHNbMV0uZGF0YSA9IHN1Y2Nlc3NEZXRhaWxCYXJDaGFydERhdGEuZGF0YXNldHNbMF0uZGF0YSA9IF9zdWNjZXNzXG4gICAgZGV0YWlsQmFyQ2hhcnREYXRhLmRhdGFzZXRzWzJdLmRhdGEgPSBmYWlsZWREZXRhaWxCYXJDaGFydERhdGEuZGF0YXNldHNbMF0uZGF0YSA9IF9mYWlsZWRcbiAgICBkZXRhaWxCYXJDaGFydC51cGRhdGUoKVxuICAgIHRvdGFsRGV0YWlsQmFyQ2hhcnQudXBkYXRlKClcbiAgICBzdWNjZXNzRGV0YWlsQmFyQ2hhcnQudXBkYXRlKClcbiAgICBmYWlsZWREZXRhaWxCYXJDaGFydC51cGRhdGUoKVxufVxuXG5mdW5jdGlvbiBnZXRCYXJDaGFydE9wdGlvbnMoZGF0YSkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHR5cGU6ICdiYXInLFxuICAgICAgICBkYXRhOiBkYXRhLFxuICAgICAgICBvcHRpb25zOiB7XG4gICAgICAgICAgICBsZWdlbmQ6IHtkaXNwbGF5OiBmYWxzZX0sXG4gICAgICAgICAgICB0aXRsZTp7ZGlzcGxheTogZmFsc2UsfSxcbiAgICAgICAgICAgIHRvb2x0aXBzOiB7bW9kZTogJ2luZGV4JyxpbnRlcnNlY3Q6IHRydWV9LFxuICAgICAgICAgICAgcmVzcG9uc2l2ZTogdHJ1ZSxcbiAgICAgICAgICAgIHNjYWxlczoge1xuICAgICAgICAgICAgICAgIHhBeGVzOiBbe1xuICAgICAgICAgICAgICAgICAgICBzdGFja2VkOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBkaXNwbGF5OiBmYWxzZVxuICAgICAgICAgICAgICAgIH1dLFxuICAgICAgICAgICAgICAgIHlBeGVzOiBbe1xuICAgICAgICAgICAgICAgICAgICBzdGFja2VkOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBkaXNwbGF5OiBmYWxzZVxuICAgICAgICAgICAgICAgIH1dXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5mdW5jdGlvbiBnZXRCYXJDaGFydERhdGEoZGF0YXNldHMpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBsYWJlbHM6IGJhckNoYXJ0TGFiZWxzLFxuICAgICAgICBkYXRhc2V0czogZGF0YXNldHNcbiAgICB9XG59XG5mdW5jdGlvbiBzZXR1cEJhckNoYXJ0cygpIHtcbiAgICBsZXQgc2FtcGVCYXJDaGFydERhdGEgPSBBcnJheS5mcm9tKHtsZW5ndGg6IGJhckNoYXJ0TGFiZWxzLmxlbmd0aH0sICh2LCBpKSA9PiAwKVxuICAgIGRldGFpbEJhckNoYXJ0RGF0YSA9IGdldEJhckNoYXJ0RGF0YShbe1xuICAgICAgICBsYWJlbDogJ1RvdGFsJyxcbiAgICAgICAgYmFja2dyb3VuZENvbG9yOiAnIzJhYjRjMCcsXG4gICAgICAgIGRhdGE6IHNhbXBlQmFyQ2hhcnREYXRhXG4gICAgfSwge1xuICAgICAgICBsYWJlbDogJ1N1Y2Nlc3MnLFxuICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6ICcjNUM5QkQxJyxcbiAgICAgICAgZGF0YTogc2FtcGVCYXJDaGFydERhdGFcbiAgICB9LCB7XG4gICAgICAgIGxhYmVsOiAnRmFpbGVkJyxcbiAgICAgICAgYmFja2dyb3VuZENvbG9yOiAnI2YzNmE1YScsXG4gICAgICAgIGRhdGE6IHNhbXBlQmFyQ2hhcnREYXRhXG4gICAgfV0pXG4gICAgZGV0YWlsQmFyQ2hhcnRPcHRpb25zID0gZ2V0QmFyQ2hhcnRPcHRpb25zKGRldGFpbEJhckNoYXJ0RGF0YSlcbiAgICBkZXRhaWxCYXJDaGFydE9wdGlvbnMub3B0aW9ucy5zY2FsZXMueUF4ZXNbMF0uZGlzcGxheSA9IHRydWVcbiAgICBkZXRhaWxCYXJDaGFydCA9IG5ldyBDaGFydCgkKCcuZGV0YWlsLWJhci1jaGFydCBjYW52YXMnKS5nZXQoMCkuZ2V0Q29udGV4dCgnMmQnKSwgZGV0YWlsQmFyQ2hhcnRPcHRpb25zKVxuXG4gICAgdG90YWxEZXRhaWxCYXJDaGFydERhdGEgPSBnZXRCYXJDaGFydERhdGEoW3tcbiAgICAgICAgYmFja2dyb3VuZENvbG9yOiAnIzJhYjRjMCcsXG4gICAgICAgIGRhdGE6IHNhbXBlQmFyQ2hhcnREYXRhXG4gICAgfV0pXG4gICAgdG90YWxEZXRhaWxCYXJDaGFydE9wdGlvbnMgPSBnZXRCYXJDaGFydE9wdGlvbnModG90YWxEZXRhaWxCYXJDaGFydERhdGEpXG4gICAgdG90YWxEZXRhaWxCYXJDaGFydCA9IG5ldyBDaGFydCgkKCcudG90YWwtZGV0YWlsLWJhci1jaGFydCBjYW52YXMnKS5nZXQoMCkuZ2V0Q29udGV4dCgnMmQnKSwgdG90YWxEZXRhaWxCYXJDaGFydE9wdGlvbnMpXG5cbiAgICBzdWNjZXNzRGV0YWlsQmFyQ2hhcnREYXRhID0gZ2V0QmFyQ2hhcnREYXRhKFt7XG4gICAgICAgIGJhY2tncm91bmRDb2xvcjogJyM1QzlCRDEnLFxuICAgICAgICBkYXRhOiBzYW1wZUJhckNoYXJ0RGF0YVxuICAgIH1dKVxuICAgIHN1Y2Nlc3NEZXRhaWxCYXJDaGFydE9wdGlvbnMgPSBnZXRCYXJDaGFydE9wdGlvbnMoc3VjY2Vzc0RldGFpbEJhckNoYXJ0RGF0YSlcbiAgICBzdWNjZXNzRGV0YWlsQmFyQ2hhcnQgPSBuZXcgQ2hhcnQoJCgnLnN1Y2Nlc3MtZGV0YWlsLWJhci1jaGFydCBjYW52YXMnKS5nZXQoMCkuZ2V0Q29udGV4dCgnMmQnKSwgc3VjY2Vzc0RldGFpbEJhckNoYXJ0T3B0aW9ucylcblxuICAgIGZhaWxlZERldGFpbEJhckNoYXJ0RGF0YSA9IGdldEJhckNoYXJ0RGF0YShbe1xuICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6ICcjZjM2YTVhJyxcbiAgICAgICAgZGF0YTogc2FtcGVCYXJDaGFydERhdGFcbiAgICB9XSlcbiAgICBmYWlsZWREZXRhaWxCYXJDaGFydE9wdGlvbnMgPSBnZXRCYXJDaGFydE9wdGlvbnMoZmFpbGVkRGV0YWlsQmFyQ2hhcnREYXRhKVxuICAgIGZhaWxlZERldGFpbEJhckNoYXJ0ID0gbmV3IENoYXJ0KCQoJy5mYWlsZWQtZGV0YWlsLWJhci1jaGFydCBjYW52YXMnKS5nZXQoMCkuZ2V0Q29udGV4dCgnMmQnKSwgZmFpbGVkRGV0YWlsQmFyQ2hhcnRPcHRpb25zKVxuXG4gICAgJCgnLnBvcHVwLWNoYXJ0JykuZWFjaChmdW5jdGlvbihpKSB7XG4gICAgICAgIGxldCAkbWUgPSAkKHRoaXMpXG4gICAgICAgICRtZS5kYXRhKCdoZWlnaHQnLCAkbWUuaGVpZ2h0KCkpXG4gICAgICAgICRtZS5kYXRhKCd3aWR0aCcsICRtZS53aWR0aCgpKVxuICAgIH0pXG4gICAgJCgnLnBvcHVwLWNoYXJ0Jykub24oJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIGxldCAkbWUgPSAkKHRoaXMpLmhlaWdodCgnYXV0bycpLndpZHRoKCdhdXRvJyksXG4gICAgICAgICAgICAkcGFyZW50ID0gJG1lLnBhcmVudCgpXG4gICAgICAgIGlmICghJG1lLmRhdGEoJ3BvcHVwJykpIHtcbiAgICAgICAgICAgIGxldCAkZGlhbG9nID0gJCgnI3B1cHVwJykuYXBwZW5kKCRtZSkuZGlhbG9nKHtcbiAgICAgICAgICAgICAgICB3aWR0aDogMTAyNCxcbiAgICAgICAgICAgICAgICBtb2RhbDogdHJ1ZSxcbiAgICAgICAgICAgICAgICBjcmVhdGU6IGZ1bmN0aW9uKGUsIHVpKSB7XG4gICAgICAgICAgICAgICAgICAgIGxldCBkaWFsb2cgPSAkKHRoaXMpLmNsb3Nlc3QoJy51aS1kaWFsb2cnKVxuICAgICAgICAgICAgICAgICAgICBkaWFsb2cuZmluZCgnLnVpLWRpYWxvZy10aXRsZWJhcicpLnJlbW92ZSgpXG4gICAgICAgICAgICAgICAgICAgIGRpYWxvZy5maW5kKCcudWktZGlhbG9nLWJ1dHRvbnBhbmUnKS5yZW1vdmUoKVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgb3BlbjogZnVuY3Rpb24oZSwgdWkpIHtcbiAgICAgICAgICAgICAgICAgICAgJCgnLnVpLXdpZGdldC1vdmVybGF5JykuYmluZCgnY2xpY2snLCBlID0+ICRkaWFsb2cuZGlhbG9nKCdjbG9zZScpKVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgY2xvc2U6IGZ1bmN0aW9uKGUsIHVpKSB7XG4gICAgICAgICAgICAgICAgICAgICRkaWFsb2cuZGlhbG9nKCdjbG9zZScpXG4gICAgICAgICAgICAgICAgICAgICRwYXJlbnQuYXBwZW5kKCRtZS5kYXRhKCdwb3B1cCcsIGZhbHNlKS5oZWlnaHQoJG1lLmRhdGEoJ2hlaWdodCcpKS53aWR0aCgkbWUuZGF0YSgnd2lkdGgnKSkpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICRtZS5kYXRhKCdwb3B1cCcsIHRydWUpXG4gICAgICAgIH1cbiAgICB9KVxufVxuIiwiT2JzZXJ2YWJsZSh3aW5kb3csICdwaWVDaGFydExhYmVscycsIG51bGwsIFtdKVxuXG5PYnNlcnZhYmxlKHdpbmRvdywgJ3RvdGFsRGV0YWlsUGllQ2hhcnQnKVxuT2JzZXJ2YWJsZSh3aW5kb3csICdzdWNjZXNzRGV0YWlsUGllQ2hhcnQnKVxuT2JzZXJ2YWJsZSh3aW5kb3csICdmYWlsZWREZXRhaWxQaWVDaGFydCcpXG5cbk9ic2VydmFibGUod2luZG93LCAndG90YWxEZXRhaWxQaWVDaGFydERhdGEnLCBudWxsLCBbXSlcbk9ic2VydmFibGUod2luZG93LCAnc3VjY2Vzc0RldGFpbFBpZUNoYXJ0RGF0YScsIG51bGwsIFtdKVxuT2JzZXJ2YWJsZSh3aW5kb3csICdmYWlsZWREZXRhaWxQaWVDaGFydERhdGEnLCBudWxsLCBbXSlcblxuT2JzZXJ2YWJsZSh3aW5kb3csICd0b3RhbERldGFpbFBpZUNoYXJ0T3B0aW9ucycpXG5PYnNlcnZhYmxlKHdpbmRvdywgJ3N1Y2Nlc3NEZXRhaWxQaWVDaGFydE9wdGlvbnMnKVxuT2JzZXJ2YWJsZSh3aW5kb3csICdmYWlsZWREZXRhaWxQaWVDaGFydE9wdGlvbnMnKVxuXG5mdW5jdGlvbiB1cGRhdGVQaWVDaGFydHMoKSB7XG4gICAgcGllQ2hhcnRMYWJlbHMgPSBzeXN0ZW1zLm1hcChzID0+IHMubmFtZSlcbiAgICBsZXQgX3N1Y2Nlc3MgPSBwaWVDaGFydExhYmVscy5tYXAobiA9PiBzeXN0ZW1zLmZpbmQocyA9PiBzLm5hbWUgPT0gbikudHJhZGVzLnN1Y2Nlc3MucmVkdWNlKChzdW0sIGkpID0+IHN1bSA9IHN1bSArIGksIDApKSxcbiAgICAgICAgX2ZhaWxlZCA9IHBpZUNoYXJ0TGFiZWxzLm1hcChuID0+IHN5c3RlbXMuZmluZChzID0+IHMubmFtZSA9PSBuKS50cmFkZXMuZmFpbGVkLnJlZHVjZSgoc3VtLCBpKSA9PiBzdW0gPSBzdW0gKyBpLCAwKSksXG4gICAgICAgIF90b3RhbCA9IHBpZUNoYXJ0TGFiZWxzLm1hcCgobiwgaSkgPT4gX3N1Y2Nlc3NbaV0gKyBfZmFpbGVkW2ldKVxuXG4gICAgdG90YWxEZXRhaWxQaWVDaGFydE9wdGlvbnMuZGF0YS5sYWJlbHMgPSBzdWNjZXNzRGV0YWlsUGllQ2hhcnRPcHRpb25zLmRhdGEubGFiZWxzID0gZmFpbGVkRGV0YWlsUGllQ2hhcnRPcHRpb25zLmRhdGEubGFiZWxzID0gcGllQ2hhcnRMYWJlbHNcbiAgICB0b3RhbERldGFpbFBpZUNoYXJ0T3B0aW9ucy5kYXRhLmRhdGFzZXRzWzBdLmRhdGEgPSBfdG90YWxcbiAgICBzdWNjZXNzRGV0YWlsUGllQ2hhcnRPcHRpb25zLmRhdGEuZGF0YXNldHNbMF0uZGF0YSA9IF9zdWNjZXNzXG4gICAgZmFpbGVkRGV0YWlsUGllQ2hhcnRPcHRpb25zLmRhdGEuZGF0YXNldHNbMF0uZGF0YSA9IF9mYWlsZWRcbiAgICB0b3RhbERldGFpbFBpZUNoYXJ0LnVwZGF0ZSgpXG4gICAgc3VjY2Vzc0RldGFpbFBpZUNoYXJ0LnVwZGF0ZSgpXG4gICAgZmFpbGVkRGV0YWlsUGllQ2hhcnQudXBkYXRlKClcbn1cblxuZnVuY3Rpb24gZ2V0UGllQ2hhcnRPcHRpb25zKGRhdGEpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICB0eXBlOiAncGllJyxcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgZGF0YXNldHM6IFt7XG4gICAgICAgICAgICAgICAgZGF0YTogZGF0YSxcbiAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6IGNvbG9ycyxcbiAgICAgICAgICAgICAgICBsYWJlbDogJ1N5c3RlbXMnXG4gICAgICAgICAgICB9XSxcbiAgICAgICAgICAgIGxhYmVsczogcGllQ2hhcnRMYWJlbHNcbiAgICAgICAgfSxcbiAgICAgICAgb3B0aW9uczoge1xuICAgICAgICAgICAgbGVnZW5kOiB7ZGlzcGxheTogZmFsc2V9LFxuICAgICAgICAgICAgcmVzcG9uc2l2ZTogdHJ1ZVxuICAgICAgICB9XG4gICAgfVxufVxuZnVuY3Rpb24gc2V0dXBQaWVDaGFydHMoKSB7XG4gICAgdG90YWxEZXRhaWxQaWVDaGFydE9wdGlvbnMgPSBnZXRQaWVDaGFydE9wdGlvbnModG90YWxEZXRhaWxQaWVDaGFydERhdGEpXG4gICAgdG90YWxEZXRhaWxQaWVDaGFydCA9IG5ldyBDaGFydCgkKCcudG90YWwtZGV0YWlsLXBpZS1jaGFydCBjYW52YXMnKS5nZXQoMCkuZ2V0Q29udGV4dCgnMmQnKSwgdG90YWxEZXRhaWxQaWVDaGFydE9wdGlvbnMpXG5cbiAgICBzdWNjZXNzRGV0YWlsUGllQ2hhcnRPcHRpb25zID0gZ2V0UGllQ2hhcnRPcHRpb25zKHN1Y2Nlc3NEZXRhaWxQaWVDaGFydERhdGEpXG4gICAgc3VjY2Vzc0RldGFpbFBpZUNoYXJ0ID0gbmV3IENoYXJ0KCQoJy5zdWNjZXNzLWRldGFpbC1waWUtY2hhcnQgY2FudmFzJykuZ2V0KDApLmdldENvbnRleHQoJzJkJyksIHN1Y2Nlc3NEZXRhaWxQaWVDaGFydE9wdGlvbnMpXG5cbiAgICBmYWlsZWREZXRhaWxQaWVDaGFydE9wdGlvbnMgPSBnZXRQaWVDaGFydE9wdGlvbnMoZmFpbGVkRGV0YWlsUGllQ2hhcnREYXRhKVxuICAgIGZhaWxlZERldGFpbFBpZUNoYXJ0ID0gbmV3IENoYXJ0KCQoJy5mYWlsZWQtZGV0YWlsLXBpZS1jaGFydCBjYW52YXMnKS5nZXQoMCkuZ2V0Q29udGV4dCgnMmQnKSwgZmFpbGVkRGV0YWlsUGllQ2hhcnRPcHRpb25zKVxufVxuIiwiT2JzZXJ2YWJsZSh3aW5kb3csICdsaXN0VHJhZGVVcmwnLCBzd2l0Y2hDb250ZW50LCAnZGF0YS90cmFkZXMuanNvbicpXG5PYnNlcnZhYmxlKHdpbmRvdywgJ2RldGFpbFRyYWRlVXJsJywgc3dpdGNoQ29udGVudCwgJ2RhdGEvdHJhZGUuanNvbicpXG5cbmZ1bmN0aW9uIGxvYWRUcmFkZXMoKSB7XG4gICAgJCgnLnRyYWRlLXRhYmxlJykuanRhYmxlKCdsb2FkJylcbn1cbmZ1bmN0aW9uIHNldHVwVHJhZGVzSGlzdG9yeSgpIHtcbiAgICAkKCcuYnRuLXNlYXJjaCcpLmNsaWNrKGxvYWRUcmFkZXMpXG4gICAgJCgnLmJ0bi1yZXNldCcpLmNsaWNrKGZ1bmN0aW9uKCkge1xuICAgICAgICAkKCcuZmlsdGVyLWZvcm0nKS5nZXQoMCkucmVzZXQoKVxuICAgICAgICBsb2FkVHJhZGVzKClcbiAgICB9KVxuICAgIGxldCAkZGF0ZXJhbmdlcGlja2VyID0gJCgnLmRhdGUtcmFuZ2UtcGlja2VyJykuZGF0ZXJhbmdlcGlja2VyKHtcbiAgICAgICAgaW5pdGlhbFRleHQ6ICdQbGVhc2Ugc2VsZWN0IGEgcmFuZ2UnLFxuICAgICAgICBkYXRlcGlja2VyT3B0aW9ucyA6IHtcbiAgICAgICAgICAgIG51bWJlck9mTW9udGhzIDogMixcbiAgICAgICAgICAgIC8vIG1pbkRhdGU6IDAsXG4gICAgICAgICAgICBtYXhEYXRlOiAwXG4gICAgICAgIH0sXG4gICAgICAgIGNoYW5nZTogZnVuY3Rpb24oZSwgZGF0YSkge1xuICAgICAgICAgICAgbGV0IHJhbmdlID0gSlNPTi5wYXJzZSgkZGF0ZXJhbmdlcGlja2VyLnZhbCgpKVxuICAgICAgICAgICAgJChgaW5wdXRbbmFtZT1Gcm9tRGF0ZV1gKS52YWwocmFuZ2Uuc3RhcnQpXG4gICAgICAgICAgICAkKGBpbnB1dFtuYW1lPXRvRGF0ZV1gKS52YWwocmFuZ2UuZW5kKVxuICAgICAgICB9XG4gICAgfSlcbiAgICBsZXQgJHRhYmxlID0gJCgnLnRyYWRlLXRhYmxlJylcbiAgICAkdGFibGUuanRhYmxlKHtcbiAgICAgICAgcGFnaW5nOiB0cnVlLCBwYWdlU2l6ZTogMTAsXG4gICAgICAgIGZpZWxkczoge1xuICAgICAgICAgICAgdHJhZGVJZDoge3RpdGxlOiAnVHJhZGUgSUQnfSxcbiAgICAgICAgICAgIHByb2R1Y3RUeXBlOiB7dGl0bGU6ICdQcm9kdWN0IFR5cGUnfSxcbiAgICAgICAgICAgIHNlcnZpY2U6IHt0aXRsZTogJ1NlcnZpY2UnfSxcbiAgICAgICAgICAgIG1zZ1RpbWVTdGFtcDoge3RpdGxlOiAnVGltZXN0YW1wJ30sXG4gICAgICAgICAgICBzdGF0dXM6IHt0aXRsZTogJ1N0YXR1cycsIGRpc3BsYXk6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYDxkaXYgY2xhc3M9XCJjZWxsLXN0YXR1c1wiICR7ZGF0YS5yZWNvcmQuc3RhdHVzfT4ke2RhdGEucmVjb3JkLnN0YXR1c308L2Rpdj5gXG4gICAgICAgICAgICB9fSxcbiAgICAgICAgfSxcbiAgICAgICAgYWN0aW9uczoge1xuICAgICAgICAgICAgbGlzdEFjdGlvbjogZnVuY3Rpb24oZGF0YSwgcGFyYW1zKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICQuRGVmZXJyZWQoZnVuY3Rpb24oJGRmZCkge1xuICAgICAgICAgICAgICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgICAgICAgICAgICAgICAgdXJsOiBgJHtsaXN0VHJhZGVVcmx9PyR7JCgnLmZpbHRlci1mb3JtJykuc2VyaWFsaXplKCl9YCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGFUeXBlOiAnanNvbicsXG4gICAgICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbihyZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkZGZkLnJlc29sdmUocmVzLmJvZHkpXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uKHJlcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRkZmQucmVqZWN0KClcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICByZWNvcmRzTG9hZGVkOiBmdW5jdGlvbihlLCBsaXN0KSB7XG4gICAgICAgICAgICAkdGFibGUuZmluZCgnLmp0YWJsZS1kYXRhLXJvdycpLmVhY2goZnVuY3Rpb24oaSkge1xuICAgICAgICAgICAgICAgIGxldCAkcm93ID0gJCh0aGlzKVxuICAgICAgICAgICAgICAgICRyb3cuY2xpY2soZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgICAgICAgICBsZXQgcm93ID0gbGlzdC5yZWNvcmRzW2ldXG4gICAgICAgICAgICAgICAgICAgICQuYWpheCh7XG4gICAgICAgICAgICAgICAgICAgICAgICB1cmw6IGRldGFpbFRyYWRlVXJsLFxuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YVR5cGU6ICdqc29uJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGE6IHJvdyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uKHJlcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ldyBUcmFkZURldGFpbChyZXMuYm9keSlcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgIH0pXG4gICAgbG9hZFRyYWRlcygpXG59XG4iXX0=
