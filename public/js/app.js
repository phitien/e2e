Observable(window, 'content', switchContent, 'summary')
Observable(window, 'duration', updateDuration, '24-hours-1')
Observable(window, 'tradeData', setData)
Observable(window, 'systems', updateSystems, null, [])
Observable(window, 'success', update, null, [])
Observable(window, 'failed', update, null, [])
Observable(window, 'colors', null, ['#2ab4c0','#5C9BD1','#f36a5a','#8877a9','#2ab4c0','#2ab4c0','#2ab4c0'])

function switchContent() {
    $('.content').hide()
    $(`.content.${content}`).show()
    $('.switch').html(content == 'summary' ? 'Show history' : 'Show summary')
    if (content == 'summary') {
        updateBarCharts()
        updatePieCharts()
    }
}
function setData(data) {
    let _success = 0, _failed = 0
    systems = data.systems || []
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
    $('.duration label.time').removeClass('active')
    $(`.duration label.time[data-value=${duration}]`).addClass('active')
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
    content = Cookies.get('content') || 'summary'
    duration = Cookies.get('duration') || '24-hours-1'
    setupBarCharts()
    setupPieCharts()
    $('.duration label.switch').click(function() {
        Cookies.set('content', content == 'summary' ? 'history' : 'summary')
        content = Cookies.get('content')
    })
    $('.duration label.time').click(function() {
        Cookies.set('duration', $(this).data('value'))
        duration = Cookies.get('duration')
    })
    setupTradesHistory()
})

Chart.pluginService.register({
    beforeDraw: function(instance) {
        let yAxis = instance.scales['y-axis-0'],
            xAxis = instance.scales['x-axis-0'],
            canvas = instance.chart,
            ctx = canvas.ctx

        if (instance.options.lines) {
            instance.options.lines.forEach(function(line, i) {
                let style = line.style || '#f36a5a',
                    width = line.width || 1,
                    text = line.text || '',
                    y = yAxis.getPixelForValue(line.y) || typeof line.y == 'number' ? line.y + yAxis.getPixelForValue(yAxis.ticks[0]) : 0,
                    x = xAxis.getPixelForValue(line.x) || typeof line.x == 'number' ? line.x + xAxis.getPixelForValue(xAxis.ticks[0]) : 0
                if (y) {
                    ctx.lineWidth = width
                    ctx.beginPath()
                    ctx.moveTo(0, y)
                    ctx.lineTo(canvas.width, y)
                    ctx.strokeStyle = style
                    ctx.stroke()
                    ctx.fillStyle = style
                    ctx.fillText(text, 0, y + ctx.lineWidth)
                }
                else if (x) {
                    ctx.lineWidth = width
                    ctx.beginPath()
                    ctx.moveTo(x, 0)
                    ctx.lineTo(x, canvas.height)
                    ctx.strokeStyle = style
                    ctx.stroke()
                    ctx.fillStyle = style
                    ctx.fillText(text, x + ctx.lineWidth, 0)
                }
            })
        }
    }
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
Observable(window, 'lineChart')
Observable(window, 'lineChartLabels', null, [])
Observable(window, 'lineChartData', updateLineChart, [])
Observable(window, 'lineChartOptions', null, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: "Time",
            data: [],
            backgroundColor: '#ffa500',
            borderColor: '#008000',
            fill: false,
        }]
    },
    options: {
        responsive: true,
        legend: {display: false},
        tooltips: {
            mode: 'index',
            intersect: false,
        },
        hover: {
            mode: 'nearest',
            intersect: true
        },
        scales: {
            xAxes: [{
                display: true,
            }],
            yAxes: [{
                display: true,
                scaleLabel: {
                    display: true,
                    labelString: 'Value'
                }
            }]
        }
    }
})

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
                        <div class="row trade-chart"><canvas></canvas></div>
                    </div>
                </div>
            </div>
        </form>
    </div>`
}

function updateLineChart() {
    lineChartOptions.data.labels = lineChartLabels
    lineChartOptions.data.datasets[0].data = lineChartData
    lineChartOptions.options.lines = [{y: threshold}]
    lineChart.update()
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
                lineChart = new Chart($chart.find('canvas').get(0).getContext('2d'), lineChartOptions)
                lineChartLabels = data.data.map(({name, value}, i) => name)
                lineChartData = data.data.map(({name, value}, i) => value)
                // threshold = data.threshold
            },
            close: function(e, ui) {
                $dialog.dialog('close')
                $dialog.remove()
            }
        })
    }
}

Observable(window, 'barChartLabels', null, [])

Observable(window, 'detailBarChart')
Observable(window, 'totalDetailBarChart')
Observable(window, 'successDetailBarChart')
Observable(window, 'failedDetailBarChart')

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
    if (systems) {
        let _total = Array.from({length: barChartLabels.length}, (v, i) => 0),
            _success = Array.from({length: barChartLabels.length}, (v, i) => 0),
            _failed = Array.from({length: barChartLabels.length}, (v, i) => 0)
        systems.forEach(s => {
            _success.forEach((n, i) => _success[i] += s.trades.success[i])
            _failed.forEach((n, i) => _failed[i] += s.trades.failed[i])
        })
        _total.forEach((n, i) => _total[i] = _success[i] + _failed[i])
        detailBarChartOptions.data.labels = totalDetailBarChartOptions.data.labels = successDetailBarChartOptions.data.labels = failedDetailBarChartOptions.data.labels = barChartLabels
        detailBarChartOptions.data.datasets[0].data = totalDetailBarChartOptions.data.datasets[0].data = _total
        detailBarChartOptions.data.datasets[1].data = successDetailBarChartOptions.data.datasets[0].data = _success
        detailBarChartOptions.data.datasets[2].data = failedDetailBarChartOptions.data.datasets[0].data = _failed
        detailBarChart.update()
        totalDetailBarChart.update()
        successDetailBarChart.update()
        failedDetailBarChart.update()
    }
}

function getBarChartOptions(data) {
    return {
        type: 'bar',
        data: {
            labels: barChartLabels,
            datasets: data
        },
        options: {
            legend: {display: false},
            title: {display: false,},
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
function setupBarCharts() {
    let sampeBarChartData = Array.from({length: barChartLabels.length}, (v, i) => 0)
    detailBarChartOptions = getBarChartOptions([{
        label: 'Total',
        backgroundColor: colors[0],
        data: sampeBarChartData
    }, {
        label: 'Success',
        backgroundColor: colors[1],
        data: sampeBarChartData
    }, {
        label: 'Failed',
        backgroundColor: colors[2],
        data: sampeBarChartData
    }])
    detailBarChartOptions.options.scales.yAxes[0].display = true
    detailBarChart = new Chart($('.detail-bar-chart canvas').get(0).getContext('2d'), detailBarChartOptions)

    totalDetailBarChartOptions = getBarChartOptions([{
        backgroundColor: colors[0],
        data: sampeBarChartData
    }])
    totalDetailBarChart = new Chart($('.total-detail-bar-chart canvas').get(0).getContext('2d'), totalDetailBarChartOptions)

    successDetailBarChartOptions = getBarChartOptions([{
        backgroundColor: colors[1],
        data: sampeBarChartData
    }])
    successDetailBarChart = new Chart($('.success-detail-bar-chart canvas').get(0).getContext('2d'), successDetailBarChartOptions)

    failedDetailBarChartOptions = getBarChartOptions([{
        backgroundColor: colors[2],
        data: sampeBarChartData
    }])
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

Observable(window, 'totalDetailPieChartOptions')
Observable(window, 'successDetailPieChartOptions')
Observable(window, 'failedDetailPieChartOptions')

function updatePieCharts() {
    if (systems) {
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
    totalDetailPieChartOptions = getPieChartOptions([])
    totalDetailPieChart = new Chart($('.total-detail-pie-chart canvas').get(0).getContext('2d'), totalDetailPieChartOptions)

    successDetailPieChartOptions = getPieChartOptions([])
    successDetailPieChart = new Chart($('.success-detail-pie-chart canvas').get(0).getContext('2d'), successDetailPieChartOptions)

    failedDetailPieChartOptions = getPieChartOptions([])
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImVudHJ5LmpzIiwiY2xhc3Nlcy9MaW5lT25DaGFydC5qcyIsImNsYXNzZXMvT2JzZXJ2YWJsZS5qcyIsImNsYXNzZXMvVHJhZGVEZXRhaWwuanMiLCJtb2R1bGVzL2Jhci1jaGFydHMuanMiLCJtb2R1bGVzL3BpZS1jaGFydHMuanMiLCJtb2R1bGVzL3RyYWRlcy1oaXN0b3J5LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2hGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN0Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM5SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNqSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN0REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiYXBwLmpzIiwic291cmNlc0NvbnRlbnQiOlsiT2JzZXJ2YWJsZSh3aW5kb3csICdjb250ZW50Jywgc3dpdGNoQ29udGVudCwgJ3N1bW1hcnknKVxuT2JzZXJ2YWJsZSh3aW5kb3csICdkdXJhdGlvbicsIHVwZGF0ZUR1cmF0aW9uLCAnMjQtaG91cnMtMScpXG5PYnNlcnZhYmxlKHdpbmRvdywgJ3RyYWRlRGF0YScsIHNldERhdGEpXG5PYnNlcnZhYmxlKHdpbmRvdywgJ3N5c3RlbXMnLCB1cGRhdGVTeXN0ZW1zLCBudWxsLCBbXSlcbk9ic2VydmFibGUod2luZG93LCAnc3VjY2VzcycsIHVwZGF0ZSwgbnVsbCwgW10pXG5PYnNlcnZhYmxlKHdpbmRvdywgJ2ZhaWxlZCcsIHVwZGF0ZSwgbnVsbCwgW10pXG5PYnNlcnZhYmxlKHdpbmRvdywgJ2NvbG9ycycsIG51bGwsIFsnIzJhYjRjMCcsJyM1QzlCRDEnLCcjZjM2YTVhJywnIzg4NzdhOScsJyMyYWI0YzAnLCcjMmFiNGMwJywnIzJhYjRjMCddKVxuXG5mdW5jdGlvbiBzd2l0Y2hDb250ZW50KCkge1xuICAgICQoJy5jb250ZW50JykuaGlkZSgpXG4gICAgJChgLmNvbnRlbnQuJHtjb250ZW50fWApLnNob3coKVxuICAgICQoJy5zd2l0Y2gnKS5odG1sKGNvbnRlbnQgPT0gJ3N1bW1hcnknID8gJ1Nob3cgaGlzdG9yeScgOiAnU2hvdyBzdW1tYXJ5JylcbiAgICBpZiAoY29udGVudCA9PSAnc3VtbWFyeScpIHtcbiAgICAgICAgdXBkYXRlQmFyQ2hhcnRzKClcbiAgICAgICAgdXBkYXRlUGllQ2hhcnRzKClcbiAgICB9XG59XG5mdW5jdGlvbiBzZXREYXRhKGRhdGEpIHtcbiAgICBsZXQgX3N1Y2Nlc3MgPSAwLCBfZmFpbGVkID0gMFxuICAgIHN5c3RlbXMgPSBkYXRhLnN5c3RlbXMgfHwgW11cbiAgICBzeXN0ZW1zLmZvckVhY2gocyA9PiB7XG4gICAgICAgIF9zdWNjZXNzICs9IHMudHJhZGVzLnN1Y2Nlc3MucmVkdWNlKChycywgaSkgPT4gcnMgPSBycyArIGksIDApXG4gICAgICAgIF9mYWlsZWQgKz0gcy50cmFkZXMuZmFpbGVkLnJlZHVjZSgocnMsIGkpID0+IHJzID0gcnMgKyBpLCAwKVxuICAgIH0pXG4gICAgc3VjY2VzcyA9IF9zdWNjZXNzXG4gICAgZmFpbGVkID0gX2ZhaWxlZFxufVxuZnVuY3Rpb24gdXBkYXRlKCkge1xuICAgICQoJy5zdWNjZXNzJykuaHRtbChzdWNjZXNzKVxuICAgICQoJy5mYWlsZWQnKS5odG1sKGZhaWxlZClcbiAgICAkKCcudG90YWwnKS5odG1sKHN1Y2Nlc3MgKyBmYWlsZWQpXG59XG5mdW5jdGlvbiB1cGRhdGVTeXN0ZW1zKCkge1xuICAgIHVwZGF0ZUJhckNoYXJ0cygpXG4gICAgdXBkYXRlUGllQ2hhcnRzKClcbiAgICAkKCcuc3lzdGVtcycpLmh0bWwoJycpXG4gICAgc3lzdGVtcy5mb3JFYWNoKChzLGkpID0+IHtcbiAgICAgICAgbGV0IG9rID0gcy50cmFkZXMuc3VjY2Vzcy5yZWR1Y2UoKHN1bSxpKSA9PiBzdW0gPSBzdW0gKyBpLCAwKSxcbiAgICAgICAgICAgIGtvID0gcy50cmFkZXMuZmFpbGVkLnJlZHVjZSgoc3VtLGkpID0+IHN1bSA9IHN1bSArIGksIDApXG4gICAgICAgICQoJy5zeXN0ZW1zJykuYXBwZW5kKGA8dHI+XG4gICAgICAgIDx0ZD48c3BhbiBjbGFzcz1cImZvbnQtcHVycGxlLXNvZnRcIj48c3BhbiBjbGFzcz1cImxlZ2VuZC1pdGVtXCIgc3R5bGU9XCJiYWNrZ3JvdW5kLWNvbG9yOiAke2NvbG9yc1tpXX1cIj48L3NwYW4+JHtzLm5hbWV9PC9zcGFuPjwvdGQ+XG4gICAgICAgIDx0ZD48c3BhbiBjbGFzcz1cImZvbnQtZ3JlZW4taGF6ZVwiPiR7b2sgKyBrb308L3NwYW4+PC90ZD5cbiAgICAgICAgPHRkPjxzcGFuIGNsYXNzPVwiZm9udC1ibHVlLXNoYXJwXCI+JHtva308L3NwYW4+PC90ZD5cbiAgICAgICAgPHRkPjxzcGFuIGNsYXNzPVwiZm9udC1yZWQtaGF6ZVwiPiR7a299PC9zcGFuPjwvdGQ+XG4gICAgICAgIDwvdHI+YClcbiAgICAgICAgJCgnLnByb2dyZXNzLXN1Y2Nlc3MgLnByb2dyZXNzLWJhcicpLndpZHRoKGAkeygxMDAqb2svKG9rK2tvKSkudG9QcmVjaXNpb24oMil9JWApXG4gICAgICAgICQoJy5wcm9ncmVzcy1zdWNjZXNzIC5zdGF0dXMtbnVtYmVyJykuaHRtbChgJHsoMTAwKm9rLyhvaytrbykpLnRvUHJlY2lzaW9uKDIpfSVgKVxuICAgICAgICAkKCcucHJvZ3Jlc3MtZmFpbGVkIC5wcm9ncmVzcy1iYXInKS53aWR0aChgJHsoMTAwKmtvLyhvaytrbykpLnRvUHJlY2lzaW9uKDIpfSVgKVxuICAgICAgICAkKCcucHJvZ3Jlc3MtZmFpbGVkIC5zdGF0dXMtbnVtYmVyJykuaHRtbChgJHsoMTAwKmtvLyhvaytrbykpLnRvUHJlY2lzaW9uKDIpfSVgKVxuICAgIH0pXG59XG5mdW5jdGlvbiB1cGRhdGVEdXJhdGlvbigpIHtcbiAgICAkKCcuZHVyYXRpb24gbGFiZWwudGltZScpLnJlbW92ZUNsYXNzKCdhY3RpdmUnKVxuICAgICQoYC5kdXJhdGlvbiBsYWJlbC50aW1lW2RhdGEtdmFsdWU9JHtkdXJhdGlvbn1dYCkuYWRkQ2xhc3MoJ2FjdGl2ZScpXG4gICAgYmFyQ2hhcnRzRHVyYXRpb25VcGRhdGUoKVxuICAgIGZldGNoKClcbn1cbmZ1bmN0aW9uIGZldGNoKCkge1xuICAgICQuYWpheCh7XG4gICAgICAgIHVybDogYGRhdGEvJHtkdXJhdGlvbn0uanNvbmAsXG4gICAgICAgIGRhdGFUeXBlOiAnanNvbicsXG4gICAgICAgIHN1Y2Nlc3M6IGRhdGEgPT4gdHJhZGVEYXRhID0gZGF0YVxuICAgIH0pXG59XG5cbiQoZG9jdW1lbnQpLnJlYWR5KCgpID0+IHtcbiAgICBjb250ZW50ID0gQ29va2llcy5nZXQoJ2NvbnRlbnQnKSB8fCAnc3VtbWFyeSdcbiAgICBkdXJhdGlvbiA9IENvb2tpZXMuZ2V0KCdkdXJhdGlvbicpIHx8ICcyNC1ob3Vycy0xJ1xuICAgIHNldHVwQmFyQ2hhcnRzKClcbiAgICBzZXR1cFBpZUNoYXJ0cygpXG4gICAgJCgnLmR1cmF0aW9uIGxhYmVsLnN3aXRjaCcpLmNsaWNrKGZ1bmN0aW9uKCkge1xuICAgICAgICBDb29raWVzLnNldCgnY29udGVudCcsIGNvbnRlbnQgPT0gJ3N1bW1hcnknID8gJ2hpc3RvcnknIDogJ3N1bW1hcnknKVxuICAgICAgICBjb250ZW50ID0gQ29va2llcy5nZXQoJ2NvbnRlbnQnKVxuICAgIH0pXG4gICAgJCgnLmR1cmF0aW9uIGxhYmVsLnRpbWUnKS5jbGljayhmdW5jdGlvbigpIHtcbiAgICAgICAgQ29va2llcy5zZXQoJ2R1cmF0aW9uJywgJCh0aGlzKS5kYXRhKCd2YWx1ZScpKVxuICAgICAgICBkdXJhdGlvbiA9IENvb2tpZXMuZ2V0KCdkdXJhdGlvbicpXG4gICAgfSlcbiAgICBzZXR1cFRyYWRlc0hpc3RvcnkoKVxufSlcbiIsIkNoYXJ0LnBsdWdpblNlcnZpY2UucmVnaXN0ZXIoe1xuICAgIGJlZm9yZURyYXc6IGZ1bmN0aW9uKGluc3RhbmNlKSB7XG4gICAgICAgIGxldCB5QXhpcyA9IGluc3RhbmNlLnNjYWxlc1sneS1heGlzLTAnXSxcbiAgICAgICAgICAgIHhBeGlzID0gaW5zdGFuY2Uuc2NhbGVzWyd4LWF4aXMtMCddLFxuICAgICAgICAgICAgY2FudmFzID0gaW5zdGFuY2UuY2hhcnQsXG4gICAgICAgICAgICBjdHggPSBjYW52YXMuY3R4XG5cbiAgICAgICAgaWYgKGluc3RhbmNlLm9wdGlvbnMubGluZXMpIHtcbiAgICAgICAgICAgIGluc3RhbmNlLm9wdGlvbnMubGluZXMuZm9yRWFjaChmdW5jdGlvbihsaW5lLCBpKSB7XG4gICAgICAgICAgICAgICAgbGV0IHN0eWxlID0gbGluZS5zdHlsZSB8fCAnI2YzNmE1YScsXG4gICAgICAgICAgICAgICAgICAgIHdpZHRoID0gbGluZS53aWR0aCB8fCAxLFxuICAgICAgICAgICAgICAgICAgICB0ZXh0ID0gbGluZS50ZXh0IHx8ICcnLFxuICAgICAgICAgICAgICAgICAgICB5ID0geUF4aXMuZ2V0UGl4ZWxGb3JWYWx1ZShsaW5lLnkpIHx8IHR5cGVvZiBsaW5lLnkgPT0gJ251bWJlcicgPyBsaW5lLnkgKyB5QXhpcy5nZXRQaXhlbEZvclZhbHVlKHlBeGlzLnRpY2tzWzBdKSA6IDAsXG4gICAgICAgICAgICAgICAgICAgIHggPSB4QXhpcy5nZXRQaXhlbEZvclZhbHVlKGxpbmUueCkgfHwgdHlwZW9mIGxpbmUueCA9PSAnbnVtYmVyJyA/IGxpbmUueCArIHhBeGlzLmdldFBpeGVsRm9yVmFsdWUoeEF4aXMudGlja3NbMF0pIDogMFxuICAgICAgICAgICAgICAgIGlmICh5KSB7XG4gICAgICAgICAgICAgICAgICAgIGN0eC5saW5lV2lkdGggPSB3aWR0aFxuICAgICAgICAgICAgICAgICAgICBjdHguYmVnaW5QYXRoKClcbiAgICAgICAgICAgICAgICAgICAgY3R4Lm1vdmVUbygwLCB5KVxuICAgICAgICAgICAgICAgICAgICBjdHgubGluZVRvKGNhbnZhcy53aWR0aCwgeSlcbiAgICAgICAgICAgICAgICAgICAgY3R4LnN0cm9rZVN0eWxlID0gc3R5bGVcbiAgICAgICAgICAgICAgICAgICAgY3R4LnN0cm9rZSgpXG4gICAgICAgICAgICAgICAgICAgIGN0eC5maWxsU3R5bGUgPSBzdHlsZVxuICAgICAgICAgICAgICAgICAgICBjdHguZmlsbFRleHQodGV4dCwgMCwgeSArIGN0eC5saW5lV2lkdGgpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHgpIHtcbiAgICAgICAgICAgICAgICAgICAgY3R4LmxpbmVXaWR0aCA9IHdpZHRoXG4gICAgICAgICAgICAgICAgICAgIGN0eC5iZWdpblBhdGgoKVxuICAgICAgICAgICAgICAgICAgICBjdHgubW92ZVRvKHgsIDApXG4gICAgICAgICAgICAgICAgICAgIGN0eC5saW5lVG8oeCwgY2FudmFzLmhlaWdodClcbiAgICAgICAgICAgICAgICAgICAgY3R4LnN0cm9rZVN0eWxlID0gc3R5bGVcbiAgICAgICAgICAgICAgICAgICAgY3R4LnN0cm9rZSgpXG4gICAgICAgICAgICAgICAgICAgIGN0eC5maWxsU3R5bGUgPSBzdHlsZVxuICAgICAgICAgICAgICAgICAgICBjdHguZmlsbFRleHQodGV4dCwgeCArIGN0eC5saW5lV2lkdGgsIDApXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgIH1cbn0pXG4iLCJmdW5jdGlvbiBPYnNlcnZhYmxlKG8sIHAsIGNiLCB2KSB7XG4gICAgaWYgKHYgIT09IHVuZGVmaW5lZCAmJiB2ICE9PSBudWxsKSBvW2BfXyR7cH1gXSA9IHZcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkobywgcCwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXNbYF9fJHtwfWBdXG4gICAgICAgIH0uYmluZChvKSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbih2KSB7XG4gICAgICAgICAgICB0aGlzW2BfXyR7cH1gXSA9IHY7XG4gICAgICAgICAgICBpZiAoY2IpIGNiKHYpXG4gICAgICAgIH0uYmluZChvKVxuICAgIH0pXG59XG4iLCJPYnNlcnZhYmxlKHdpbmRvdywgJ3RocmVzaG9sZCcsIHVwZGF0ZUxpbmVDaGFydCwgMTIwKVxuT2JzZXJ2YWJsZSh3aW5kb3csICdsaW5lQ2hhcnQnKVxuT2JzZXJ2YWJsZSh3aW5kb3csICdsaW5lQ2hhcnRMYWJlbHMnLCBudWxsLCBbXSlcbk9ic2VydmFibGUod2luZG93LCAnbGluZUNoYXJ0RGF0YScsIHVwZGF0ZUxpbmVDaGFydCwgW10pXG5PYnNlcnZhYmxlKHdpbmRvdywgJ2xpbmVDaGFydE9wdGlvbnMnLCBudWxsLCB7XG4gICAgdHlwZTogJ2xpbmUnLFxuICAgIGRhdGE6IHtcbiAgICAgICAgbGFiZWxzOiBbXSxcbiAgICAgICAgZGF0YXNldHM6IFt7XG4gICAgICAgICAgICBsYWJlbDogXCJUaW1lXCIsXG4gICAgICAgICAgICBkYXRhOiBbXSxcbiAgICAgICAgICAgIGJhY2tncm91bmRDb2xvcjogJyNmZmE1MDAnLFxuICAgICAgICAgICAgYm9yZGVyQ29sb3I6ICcjMDA4MDAwJyxcbiAgICAgICAgICAgIGZpbGw6IGZhbHNlLFxuICAgICAgICB9XVxuICAgIH0sXG4gICAgb3B0aW9uczoge1xuICAgICAgICByZXNwb25zaXZlOiB0cnVlLFxuICAgICAgICBsZWdlbmQ6IHtkaXNwbGF5OiBmYWxzZX0sXG4gICAgICAgIHRvb2x0aXBzOiB7XG4gICAgICAgICAgICBtb2RlOiAnaW5kZXgnLFxuICAgICAgICAgICAgaW50ZXJzZWN0OiBmYWxzZSxcbiAgICAgICAgfSxcbiAgICAgICAgaG92ZXI6IHtcbiAgICAgICAgICAgIG1vZGU6ICduZWFyZXN0JyxcbiAgICAgICAgICAgIGludGVyc2VjdDogdHJ1ZVxuICAgICAgICB9LFxuICAgICAgICBzY2FsZXM6IHtcbiAgICAgICAgICAgIHhBeGVzOiBbe1xuICAgICAgICAgICAgICAgIGRpc3BsYXk6IHRydWUsXG4gICAgICAgICAgICB9XSxcbiAgICAgICAgICAgIHlBeGVzOiBbe1xuICAgICAgICAgICAgICAgIGRpc3BsYXk6IHRydWUsXG4gICAgICAgICAgICAgICAgc2NhbGVMYWJlbDoge1xuICAgICAgICAgICAgICAgICAgICBkaXNwbGF5OiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBsYWJlbFN0cmluZzogJ1ZhbHVlJ1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1dXG4gICAgICAgIH1cbiAgICB9XG59KVxuXG5jb25zdCBzdGF0dXNlcyA9IHtcbiAgICAnc2VudCc6ICdTZW50JywgJ2ZhaWxlZCc6ICdGYWlsZWQnLCAnYWNrJzogJ0FjaycsICduYWNrJzogJ05hY2snLCAnd2FpdCc6ICdXYWl0JywgJ3N1Y2Nlc3MnOiAnU3VjY2Vzcydcbn1cbmNvbnN0IGZpZWxkTmFtZXMgPSB7XG4gICAgJ2lkJzogJ0lEJywgJ3RyYWRlSWQnOiAnVHJhZGVJRCcsICdwcm9kdWN0VHlwZSc6ICdQcm9kdWN0JywgJ3NlcnZpY2UnOiAnU2VydmljZScsICdtc2dUaW1lU3RhbXAnOiAnVGltZVN0YW1wJywgJ3N0YXR1cyc6ICdTdGF0dXMnXG59XG5mdW5jdGlvbiBidWlsZFN0YXR1c0ljb24odGV4dCwga2V5KSB7XG4gICAgcmV0dXJuIGA8c3BhbiBjbGFzcz1cInN0YXR1cy1pY29uICR7a2V5IHx8IHRleHQudG9Mb3dlckNhc2UoKS5yZXBsYWNlKC9cXFcvLCAnLScpfVwiPjwvc3Bhbj5gXG59XG5mdW5jdGlvbiBidWlsZFN0YXR1c1RleHQodGV4dCwga2V5KSB7XG4gICAgcmV0dXJuIGA8c3BhbiBjbGFzcz1cInN0YXR1cy10ZXh0ICR7a2V5IHx8IHRleHQudG9Mb3dlckNhc2UoKS5yZXBsYWNlKC9cXFcvLCAnLScpfVwiPiR7dGV4dH08L3NwYW4+YFxufVxuZnVuY3Rpb24gYnVpbGRBdHJyaWJ1dGVWYWx1ZShhKSB7XG4gICAgaWYgKGEuZmllbGQgPT0gJ21zZ1RpbWVTdGFtcCcpIHJldHVybiBtb21lbnQoYS52YWx1ZSkuZm9ybWF0KCdEbyBNTU0sIFlZWVkgSEg6TU06U1MnKVxuICAgIGlmIChhLmZpZWxkID09ICdzdGF0dXMnKSByZXR1cm4gYCR7YnVpbGRTdGF0dXNJY29uKGEudmFsdWUpfWBcbiAgICByZXR1cm4gYS52YWx1ZVxufVxuZnVuY3Rpb24gYnVpbGRUcmFkZURldGFpbEF0dHJpYnV0ZXMoZGF0YSkge1xuICAgIGxldCBhdHRycyA9IFsnaWQnLCAndHJhZGVJZCcsICdwcm9kdWN0VHlwZScsICdzZXJ2aWNlJywgJ21zZ1RpbWVTdGFtcCcsICdzdGF0dXMnXS5tYXAoayA9PiAoe2ZpZWxkOiBrLCBuYW1lOiBmaWVsZE5hbWVzW2tdLCB2YWx1ZTogZGF0YVtrXX0pKVxuICAgIHJldHVybiBgPHRhYmxlIGNsYXNzPVwianRhYmxlXCI+PHRib2R5PlxuICAgICAgICAke2F0dHJzLm1hcChhID0+IGA8dHIgY2xhc3M9XCJqdGFibGUtZGF0YS1yb3dcIj48dGQ+JHthLm5hbWV9PC90ZD48dGQ+JHtidWlsZEF0cnJpYnV0ZVZhbHVlKGEpfTwvdGQ+PC90cj5gKS5qb2luKCcnKX1cbiAgICA8L3Rib2R5PjwvdGFibGU+YFxufVxuZnVuY3Rpb24gYnVpbGRCbHVlUmFpbChub2Rlcykge1xuICAgIGxldCBpID0gMCwgbiA9IG5vZGVzW2ldXG4gICAgd2hpbGUobiAmJiBuLnN0YXR1cyA9PSAnc2VudCcpIHtcbiAgICAgICAgbiA9IG5vZGVzW2krK11cbiAgICB9XG4gICAgbGV0IHdpZHRoID0gMTAwKihpLTIpLyhub2Rlcy5sZW5ndGggLSAxKVxuICAgIHJldHVybiBgPGRpdiBjbGFzcz1cInRyYWRlLXRyYWNrcy1ibHVlLXJhaWxcIiBkYXRhLXdpZHRoPVwiJHt3aWR0aH0lXCIgc3R5bGU9XCJ3aWR0aDogMCVcIj48L2Rpdj5gXG59XG5mdW5jdGlvbiBidWlsZFRyYWNrTm9kZShub2RlLCBub2RlcywgaSkge1xuICAgIGxldCBsZWZ0ID0gMTAwKmkvKG5vZGVzLmxlbmd0aCAtIDEpXG4gICAgcmV0dXJuIGA8ZGl2IGNsYXNzPVwidHJhZGUtdHJhY2tzLW5vZGVcIiBzdHlsZT1cImxlZnQ6ICR7bGVmdH0lXCI+JHtidWlsZFN0YXR1c0ljb24obm9kZS5zdGF0dXMpfTwvZGl2PmBcbn1cbmZ1bmN0aW9uIGJ1aWxkVHJhY2tOb2RlSW5mbyhub2RlLCBub2RlcywgaSkge1xuICAgIGxldCBsZWZ0ID0gMTAwKmkvKG5vZGVzLmxlbmd0aCAtIDEpXG4gICAgcmV0dXJuIGA8ZGl2IGNsYXNzPVwidHJhZGUtdHJhY2tzLW5vZGUtaW5mb1wiIHN0eWxlPVwibGVmdDogJHtsZWZ0fSVcIj5cbiAgICAgICAgPGRpdiBjbGFzcz1cInRyYWRlLXRyYWNrcy1ub2RlLW5hbWVcIj4ke25vZGUubmFtZX08L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzcz1cInRyYWRlLXRyYWNrcy1ub2RlLXRpbWVcIj4ke25vZGUuZGF0ZX08L2Rpdj5cbiAgICA8L2Rpdj5gXG59XG5mdW5jdGlvbiBidWlsZFRyYWRlRGV0YWlsSHRtbChkYXRhKSB7XG4gICAgcmV0dXJuIGA8ZGl2IGNsYXNzPVwibmctc2NvcGUgdHJhZGUtZGV0YWlsXCI+XG4gICAgICAgIDxmb3JtIG5hbWU9XCJyb2xlQ3JlYXRlT3JFZGl0Rm9ybVwiIHJvbGU9XCJmb3JtXCIgbm92YWxpZGF0ZT1cIlwiIGNsYXNzPVwiZm9ybS12YWxpZGF0aW9uIG5nLXByaXN0aW5lIG5nLXZhbGlkLW1heGxlbmd0aCBuZy12YWxpZCBuZy12YWxpZC1yZXF1aXJlZFwiPlxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cIm1vZGFsLWhlYWRlclwiPlxuICAgICAgICAgICAgICAgIDxoNCBjbGFzcz1cIm1vZGFsLXRpdGxlXCI+XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIG5nLWlmPVwidm0ucm9sZS5pZFwiIGNsYXNzPVwibmctYmluZGluZyBuZy1zY29wZVwiPlRyYWRlIGRldGFpbDwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8L2g0PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwibW9kYWwtYm9keVwiPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJyb3dcIj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvbC14cy0zIGp0YWJsZS1tYWluLWNvbnRhaW5lciB0cmFkZS1hdHRyaWJ1dGVzXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAke2J1aWxkVHJhZGVEZXRhaWxBdHRyaWJ1dGVzKGRhdGEpfVxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvbC14cy05XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwicm93IHRyYWRlLXRyYWNrc1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb2wteHMtMlwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwic3RhdHVzLWxlZ2VuZFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHtPYmplY3Qua2V5cyhzdGF0dXNlcykubWFwKGsgPT4gYDxkaXYgY2xhc3M9XCJzdGF0dXMtbGVnZW5kLWl0ZW1cIj4ke2J1aWxkU3RhdHVzSWNvbihzdGF0dXNlc1trXSwgayl9JHtidWlsZFN0YXR1c1RleHQoc3RhdHVzZXNba10sIGspfTwvZGl2PmApLmpvaW4oJycpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY29sLXhzLTEwXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJ0cmFkZS10cmFja3MtbGluZVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInRyYWRlLXRyYWNrcy1yYWlsXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHtidWlsZEJsdWVSYWlsKGRhdGEudHJhY2tzKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAke2RhdGEudHJhY2tzLm1hcCgodCxpKSA9PiBidWlsZFRyYWNrTm9kZSh0LCBkYXRhLnRyYWNrcywgaSkpLmpvaW4oJycpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICR7ZGF0YS50cmFja3MubWFwKCh0LGkpID0+IGJ1aWxkVHJhY2tOb2RlSW5mbyh0LCBkYXRhLnRyYWNrcywgaSkpLmpvaW4oJycpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwicm93IHRyYWRlLWNoYXJ0XCI+PGNhbnZhcz48L2NhbnZhcz48L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9mb3JtPlxuICAgIDwvZGl2PmBcbn1cblxuZnVuY3Rpb24gdXBkYXRlTGluZUNoYXJ0KCkge1xuICAgIGxpbmVDaGFydE9wdGlvbnMuZGF0YS5sYWJlbHMgPSBsaW5lQ2hhcnRMYWJlbHNcbiAgICBsaW5lQ2hhcnRPcHRpb25zLmRhdGEuZGF0YXNldHNbMF0uZGF0YSA9IGxpbmVDaGFydERhdGFcbiAgICBsaW5lQ2hhcnRPcHRpb25zLm9wdGlvbnMubGluZXMgPSBbe3k6IHRocmVzaG9sZH1dXG4gICAgbGluZUNoYXJ0LnVwZGF0ZSgpXG59XG5cbmNsYXNzIFRyYWRlRGV0YWlsIHtcbiAgICBjb25zdHJ1Y3RvcihkYXRhKSB7XG4gICAgICAgIGxldCAkZGlhbG9nID0gJChidWlsZFRyYWRlRGV0YWlsSHRtbChkYXRhKSkuZGlhbG9nKHtcbiAgICAgICAgICAgIG1vZGFsOiB0cnVlLFxuICAgICAgICAgICAgd2lkdGg6IDEwMjQsXG4gICAgICAgICAgICBjcmVhdGU6IGZ1bmN0aW9uKGUsIHVpKSB7XG4gICAgICAgICAgICAgICAgbGV0IGRpYWxvZyA9ICQodGhpcykuY2xvc2VzdCgnLnVpLWRpYWxvZycpXG4gICAgICAgICAgICAgICAgZGlhbG9nLmZpbmQoJy51aS1kaWFsb2ctdGl0bGViYXInKS5yZW1vdmUoKVxuICAgICAgICAgICAgICAgIGRpYWxvZy5maW5kKCcudWktZGlhbG9nLWJ1dHRvbnBhbmUnKS5yZW1vdmUoKVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG9wZW46IGZ1bmN0aW9uKGUsIHVpKSB7XG4gICAgICAgICAgICAgICAgJCgnLnVpLXdpZGdldC1vdmVybGF5JykuYmluZCgnY2xpY2snLCBlID0+ICRkaWFsb2cuZGlhbG9nKCdjbG9zZScpKVxuICAgICAgICAgICAgICAgIGxldCAkcmFpbCA9ICQoJy50cmFkZS10cmFja3MtYmx1ZS1yYWlsJylcbiAgICAgICAgICAgICAgICAkcmFpbC5hbmltYXRlKHtcbiAgICAgICAgICAgICAgICAgICAgd2lkdGg6ICRyYWlsLmRhdGEoJ3dpZHRoJyksXG4gICAgICAgICAgICAgICAgfSwgMTUwMClcbiAgICAgICAgICAgICAgICBsZXQgJGNoYXJ0ID0gJCgnLnRyYWRlLWNoYXJ0JylcbiAgICAgICAgICAgICAgICBsaW5lQ2hhcnQgPSBuZXcgQ2hhcnQoJGNoYXJ0LmZpbmQoJ2NhbnZhcycpLmdldCgwKS5nZXRDb250ZXh0KCcyZCcpLCBsaW5lQ2hhcnRPcHRpb25zKVxuICAgICAgICAgICAgICAgIGxpbmVDaGFydExhYmVscyA9IGRhdGEuZGF0YS5tYXAoKHtuYW1lLCB2YWx1ZX0sIGkpID0+IG5hbWUpXG4gICAgICAgICAgICAgICAgbGluZUNoYXJ0RGF0YSA9IGRhdGEuZGF0YS5tYXAoKHtuYW1lLCB2YWx1ZX0sIGkpID0+IHZhbHVlKVxuICAgICAgICAgICAgICAgIC8vIHRocmVzaG9sZCA9IGRhdGEudGhyZXNob2xkXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY2xvc2U6IGZ1bmN0aW9uKGUsIHVpKSB7XG4gICAgICAgICAgICAgICAgJGRpYWxvZy5kaWFsb2coJ2Nsb3NlJylcbiAgICAgICAgICAgICAgICAkZGlhbG9nLnJlbW92ZSgpXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgfVxufVxuIiwiT2JzZXJ2YWJsZSh3aW5kb3csICdiYXJDaGFydExhYmVscycsIG51bGwsIFtdKVxuXG5PYnNlcnZhYmxlKHdpbmRvdywgJ2RldGFpbEJhckNoYXJ0Jylcbk9ic2VydmFibGUod2luZG93LCAndG90YWxEZXRhaWxCYXJDaGFydCcpXG5PYnNlcnZhYmxlKHdpbmRvdywgJ3N1Y2Nlc3NEZXRhaWxCYXJDaGFydCcpXG5PYnNlcnZhYmxlKHdpbmRvdywgJ2ZhaWxlZERldGFpbEJhckNoYXJ0JylcblxuT2JzZXJ2YWJsZSh3aW5kb3csICdkZXRhaWxCYXJDaGFydE9wdGlvbnMnKVxuT2JzZXJ2YWJsZSh3aW5kb3csICd0b3RhbERldGFpbEJhckNoYXJ0T3B0aW9ucycpXG5PYnNlcnZhYmxlKHdpbmRvdywgJ3N1Y2Nlc3NEZXRhaWxCYXJDaGFydE9wdGlvbnMnKVxuT2JzZXJ2YWJsZSh3aW5kb3csICdmYWlsZWREZXRhaWxCYXJDaGFydE9wdGlvbnMnKVxuXG5mdW5jdGlvbiBiYXJDaGFydHNEdXJhdGlvblVwZGF0ZSgpIHtcbiAgICBsZXQgW24sIHVuaXQsIHByZXR0eV0gPSBkdXJhdGlvbi5zcGxpdCgnLScpXG4gICAgaWYgKHByZXR0eSA9PSAxKSBiYXJDaGFydExhYmVscyA9IEFycmF5LmZyb20oe2xlbmd0aDogbn0sICh2LCBpKSA9PiBtb21lbnQoKS5zdWJ0cmFjdChpLCB1bml0KS5mcm9tTm93KCkpLnJldmVyc2UoKVxuICAgIGVsc2UgYmFyQ2hhcnRMYWJlbHMgPSBBcnJheS5mcm9tKHtsZW5ndGg6IG59LCAodiwgaSkgPT4gbW9tZW50KCkuc3VidHJhY3QoaSwgdW5pdCkuZm9ybWF0KCdEbyBNTU0nKSkucmV2ZXJzZSgpXG59XG5cbmZ1bmN0aW9uIHVwZGF0ZUJhckNoYXJ0cygpIHtcbiAgICBpZiAoc3lzdGVtcykge1xuICAgICAgICBsZXQgX3RvdGFsID0gQXJyYXkuZnJvbSh7bGVuZ3RoOiBiYXJDaGFydExhYmVscy5sZW5ndGh9LCAodiwgaSkgPT4gMCksXG4gICAgICAgICAgICBfc3VjY2VzcyA9IEFycmF5LmZyb20oe2xlbmd0aDogYmFyQ2hhcnRMYWJlbHMubGVuZ3RofSwgKHYsIGkpID0+IDApLFxuICAgICAgICAgICAgX2ZhaWxlZCA9IEFycmF5LmZyb20oe2xlbmd0aDogYmFyQ2hhcnRMYWJlbHMubGVuZ3RofSwgKHYsIGkpID0+IDApXG4gICAgICAgIHN5c3RlbXMuZm9yRWFjaChzID0+IHtcbiAgICAgICAgICAgIF9zdWNjZXNzLmZvckVhY2goKG4sIGkpID0+IF9zdWNjZXNzW2ldICs9IHMudHJhZGVzLnN1Y2Nlc3NbaV0pXG4gICAgICAgICAgICBfZmFpbGVkLmZvckVhY2goKG4sIGkpID0+IF9mYWlsZWRbaV0gKz0gcy50cmFkZXMuZmFpbGVkW2ldKVxuICAgICAgICB9KVxuICAgICAgICBfdG90YWwuZm9yRWFjaCgobiwgaSkgPT4gX3RvdGFsW2ldID0gX3N1Y2Nlc3NbaV0gKyBfZmFpbGVkW2ldKVxuICAgICAgICBkZXRhaWxCYXJDaGFydE9wdGlvbnMuZGF0YS5sYWJlbHMgPSB0b3RhbERldGFpbEJhckNoYXJ0T3B0aW9ucy5kYXRhLmxhYmVscyA9IHN1Y2Nlc3NEZXRhaWxCYXJDaGFydE9wdGlvbnMuZGF0YS5sYWJlbHMgPSBmYWlsZWREZXRhaWxCYXJDaGFydE9wdGlvbnMuZGF0YS5sYWJlbHMgPSBiYXJDaGFydExhYmVsc1xuICAgICAgICBkZXRhaWxCYXJDaGFydE9wdGlvbnMuZGF0YS5kYXRhc2V0c1swXS5kYXRhID0gdG90YWxEZXRhaWxCYXJDaGFydE9wdGlvbnMuZGF0YS5kYXRhc2V0c1swXS5kYXRhID0gX3RvdGFsXG4gICAgICAgIGRldGFpbEJhckNoYXJ0T3B0aW9ucy5kYXRhLmRhdGFzZXRzWzFdLmRhdGEgPSBzdWNjZXNzRGV0YWlsQmFyQ2hhcnRPcHRpb25zLmRhdGEuZGF0YXNldHNbMF0uZGF0YSA9IF9zdWNjZXNzXG4gICAgICAgIGRldGFpbEJhckNoYXJ0T3B0aW9ucy5kYXRhLmRhdGFzZXRzWzJdLmRhdGEgPSBmYWlsZWREZXRhaWxCYXJDaGFydE9wdGlvbnMuZGF0YS5kYXRhc2V0c1swXS5kYXRhID0gX2ZhaWxlZFxuICAgICAgICBkZXRhaWxCYXJDaGFydC51cGRhdGUoKVxuICAgICAgICB0b3RhbERldGFpbEJhckNoYXJ0LnVwZGF0ZSgpXG4gICAgICAgIHN1Y2Nlc3NEZXRhaWxCYXJDaGFydC51cGRhdGUoKVxuICAgICAgICBmYWlsZWREZXRhaWxCYXJDaGFydC51cGRhdGUoKVxuICAgIH1cbn1cblxuZnVuY3Rpb24gZ2V0QmFyQ2hhcnRPcHRpb25zKGRhdGEpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICB0eXBlOiAnYmFyJyxcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgbGFiZWxzOiBiYXJDaGFydExhYmVscyxcbiAgICAgICAgICAgIGRhdGFzZXRzOiBkYXRhXG4gICAgICAgIH0sXG4gICAgICAgIG9wdGlvbnM6IHtcbiAgICAgICAgICAgIGxlZ2VuZDoge2Rpc3BsYXk6IGZhbHNlfSxcbiAgICAgICAgICAgIHRpdGxlOiB7ZGlzcGxheTogZmFsc2UsfSxcbiAgICAgICAgICAgIHRvb2x0aXBzOiB7bW9kZTogJ2luZGV4JyxpbnRlcnNlY3Q6IHRydWV9LFxuICAgICAgICAgICAgcmVzcG9uc2l2ZTogdHJ1ZSxcbiAgICAgICAgICAgIHNjYWxlczoge1xuICAgICAgICAgICAgICAgIHhBeGVzOiBbe1xuICAgICAgICAgICAgICAgICAgICBzdGFja2VkOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBkaXNwbGF5OiBmYWxzZVxuICAgICAgICAgICAgICAgIH1dLFxuICAgICAgICAgICAgICAgIHlBeGVzOiBbe1xuICAgICAgICAgICAgICAgICAgICBzdGFja2VkOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBkaXNwbGF5OiBmYWxzZVxuICAgICAgICAgICAgICAgIH1dXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5mdW5jdGlvbiBzZXR1cEJhckNoYXJ0cygpIHtcbiAgICBsZXQgc2FtcGVCYXJDaGFydERhdGEgPSBBcnJheS5mcm9tKHtsZW5ndGg6IGJhckNoYXJ0TGFiZWxzLmxlbmd0aH0sICh2LCBpKSA9PiAwKVxuICAgIGRldGFpbEJhckNoYXJ0T3B0aW9ucyA9IGdldEJhckNoYXJ0T3B0aW9ucyhbe1xuICAgICAgICBsYWJlbDogJ1RvdGFsJyxcbiAgICAgICAgYmFja2dyb3VuZENvbG9yOiBjb2xvcnNbMF0sXG4gICAgICAgIGRhdGE6IHNhbXBlQmFyQ2hhcnREYXRhXG4gICAgfSwge1xuICAgICAgICBsYWJlbDogJ1N1Y2Nlc3MnLFxuICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6IGNvbG9yc1sxXSxcbiAgICAgICAgZGF0YTogc2FtcGVCYXJDaGFydERhdGFcbiAgICB9LCB7XG4gICAgICAgIGxhYmVsOiAnRmFpbGVkJyxcbiAgICAgICAgYmFja2dyb3VuZENvbG9yOiBjb2xvcnNbMl0sXG4gICAgICAgIGRhdGE6IHNhbXBlQmFyQ2hhcnREYXRhXG4gICAgfV0pXG4gICAgZGV0YWlsQmFyQ2hhcnRPcHRpb25zLm9wdGlvbnMuc2NhbGVzLnlBeGVzWzBdLmRpc3BsYXkgPSB0cnVlXG4gICAgZGV0YWlsQmFyQ2hhcnQgPSBuZXcgQ2hhcnQoJCgnLmRldGFpbC1iYXItY2hhcnQgY2FudmFzJykuZ2V0KDApLmdldENvbnRleHQoJzJkJyksIGRldGFpbEJhckNoYXJ0T3B0aW9ucylcblxuICAgIHRvdGFsRGV0YWlsQmFyQ2hhcnRPcHRpb25zID0gZ2V0QmFyQ2hhcnRPcHRpb25zKFt7XG4gICAgICAgIGJhY2tncm91bmRDb2xvcjogY29sb3JzWzBdLFxuICAgICAgICBkYXRhOiBzYW1wZUJhckNoYXJ0RGF0YVxuICAgIH1dKVxuICAgIHRvdGFsRGV0YWlsQmFyQ2hhcnQgPSBuZXcgQ2hhcnQoJCgnLnRvdGFsLWRldGFpbC1iYXItY2hhcnQgY2FudmFzJykuZ2V0KDApLmdldENvbnRleHQoJzJkJyksIHRvdGFsRGV0YWlsQmFyQ2hhcnRPcHRpb25zKVxuXG4gICAgc3VjY2Vzc0RldGFpbEJhckNoYXJ0T3B0aW9ucyA9IGdldEJhckNoYXJ0T3B0aW9ucyhbe1xuICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6IGNvbG9yc1sxXSxcbiAgICAgICAgZGF0YTogc2FtcGVCYXJDaGFydERhdGFcbiAgICB9XSlcbiAgICBzdWNjZXNzRGV0YWlsQmFyQ2hhcnQgPSBuZXcgQ2hhcnQoJCgnLnN1Y2Nlc3MtZGV0YWlsLWJhci1jaGFydCBjYW52YXMnKS5nZXQoMCkuZ2V0Q29udGV4dCgnMmQnKSwgc3VjY2Vzc0RldGFpbEJhckNoYXJ0T3B0aW9ucylcblxuICAgIGZhaWxlZERldGFpbEJhckNoYXJ0T3B0aW9ucyA9IGdldEJhckNoYXJ0T3B0aW9ucyhbe1xuICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6IGNvbG9yc1syXSxcbiAgICAgICAgZGF0YTogc2FtcGVCYXJDaGFydERhdGFcbiAgICB9XSlcbiAgICBmYWlsZWREZXRhaWxCYXJDaGFydCA9IG5ldyBDaGFydCgkKCcuZmFpbGVkLWRldGFpbC1iYXItY2hhcnQgY2FudmFzJykuZ2V0KDApLmdldENvbnRleHQoJzJkJyksIGZhaWxlZERldGFpbEJhckNoYXJ0T3B0aW9ucylcblxuICAgICQoJy5wb3B1cC1jaGFydCcpLmVhY2goZnVuY3Rpb24oaSkge1xuICAgICAgICBsZXQgJG1lID0gJCh0aGlzKVxuICAgICAgICAkbWUuZGF0YSgnaGVpZ2h0JywgJG1lLmhlaWdodCgpKVxuICAgICAgICAkbWUuZGF0YSgnd2lkdGgnLCAkbWUud2lkdGgoKSlcbiAgICB9KVxuICAgICQoJy5wb3B1cC1jaGFydCcpLm9uKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuICAgICAgICBsZXQgJG1lID0gJCh0aGlzKS5oZWlnaHQoJ2F1dG8nKS53aWR0aCgnYXV0bycpLFxuICAgICAgICAgICAgJHBhcmVudCA9ICRtZS5wYXJlbnQoKVxuICAgICAgICBpZiAoISRtZS5kYXRhKCdwb3B1cCcpKSB7XG4gICAgICAgICAgICBsZXQgJGRpYWxvZyA9ICQoJyNwdXB1cCcpLmFwcGVuZCgkbWUpLmRpYWxvZyh7XG4gICAgICAgICAgICAgICAgd2lkdGg6IDEwMjQsXG4gICAgICAgICAgICAgICAgbW9kYWw6IHRydWUsXG4gICAgICAgICAgICAgICAgY3JlYXRlOiBmdW5jdGlvbihlLCB1aSkge1xuICAgICAgICAgICAgICAgICAgICBsZXQgZGlhbG9nID0gJCh0aGlzKS5jbG9zZXN0KCcudWktZGlhbG9nJylcbiAgICAgICAgICAgICAgICAgICAgZGlhbG9nLmZpbmQoJy51aS1kaWFsb2ctdGl0bGViYXInKS5yZW1vdmUoKVxuICAgICAgICAgICAgICAgICAgICBkaWFsb2cuZmluZCgnLnVpLWRpYWxvZy1idXR0b25wYW5lJykucmVtb3ZlKClcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIG9wZW46IGZ1bmN0aW9uKGUsIHVpKSB7XG4gICAgICAgICAgICAgICAgICAgICQoJy51aS13aWRnZXQtb3ZlcmxheScpLmJpbmQoJ2NsaWNrJywgZSA9PiAkZGlhbG9nLmRpYWxvZygnY2xvc2UnKSlcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGNsb3NlOiBmdW5jdGlvbihlLCB1aSkge1xuICAgICAgICAgICAgICAgICAgICAkZGlhbG9nLmRpYWxvZygnY2xvc2UnKVxuICAgICAgICAgICAgICAgICAgICAkcGFyZW50LmFwcGVuZCgkbWUuZGF0YSgncG9wdXAnLCBmYWxzZSkuaGVpZ2h0KCRtZS5kYXRhKCdoZWlnaHQnKSkud2lkdGgoJG1lLmRhdGEoJ3dpZHRoJykpKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAkbWUuZGF0YSgncG9wdXAnLCB0cnVlKVxuICAgICAgICB9XG4gICAgfSlcbn1cbiIsIk9ic2VydmFibGUod2luZG93LCAncGllQ2hhcnRMYWJlbHMnLCBudWxsLCBbXSlcblxuT2JzZXJ2YWJsZSh3aW5kb3csICd0b3RhbERldGFpbFBpZUNoYXJ0Jylcbk9ic2VydmFibGUod2luZG93LCAnc3VjY2Vzc0RldGFpbFBpZUNoYXJ0Jylcbk9ic2VydmFibGUod2luZG93LCAnZmFpbGVkRGV0YWlsUGllQ2hhcnQnKVxuXG5PYnNlcnZhYmxlKHdpbmRvdywgJ3RvdGFsRGV0YWlsUGllQ2hhcnRPcHRpb25zJylcbk9ic2VydmFibGUod2luZG93LCAnc3VjY2Vzc0RldGFpbFBpZUNoYXJ0T3B0aW9ucycpXG5PYnNlcnZhYmxlKHdpbmRvdywgJ2ZhaWxlZERldGFpbFBpZUNoYXJ0T3B0aW9ucycpXG5cbmZ1bmN0aW9uIHVwZGF0ZVBpZUNoYXJ0cygpIHtcbiAgICBpZiAoc3lzdGVtcykge1xuICAgICAgICBwaWVDaGFydExhYmVscyA9IHN5c3RlbXMubWFwKHMgPT4gcy5uYW1lKVxuICAgICAgICBsZXQgX3N1Y2Nlc3MgPSBwaWVDaGFydExhYmVscy5tYXAobiA9PiBzeXN0ZW1zLmZpbmQocyA9PiBzLm5hbWUgPT0gbikudHJhZGVzLnN1Y2Nlc3MucmVkdWNlKChzdW0sIGkpID0+IHN1bSA9IHN1bSArIGksIDApKSxcbiAgICAgICAgICAgIF9mYWlsZWQgPSBwaWVDaGFydExhYmVscy5tYXAobiA9PiBzeXN0ZW1zLmZpbmQocyA9PiBzLm5hbWUgPT0gbikudHJhZGVzLmZhaWxlZC5yZWR1Y2UoKHN1bSwgaSkgPT4gc3VtID0gc3VtICsgaSwgMCkpLFxuICAgICAgICAgICAgX3RvdGFsID0gcGllQ2hhcnRMYWJlbHMubWFwKChuLCBpKSA9PiBfc3VjY2Vzc1tpXSArIF9mYWlsZWRbaV0pXG5cbiAgICAgICAgdG90YWxEZXRhaWxQaWVDaGFydE9wdGlvbnMuZGF0YS5sYWJlbHMgPSBzdWNjZXNzRGV0YWlsUGllQ2hhcnRPcHRpb25zLmRhdGEubGFiZWxzID0gZmFpbGVkRGV0YWlsUGllQ2hhcnRPcHRpb25zLmRhdGEubGFiZWxzID0gcGllQ2hhcnRMYWJlbHNcbiAgICAgICAgdG90YWxEZXRhaWxQaWVDaGFydE9wdGlvbnMuZGF0YS5kYXRhc2V0c1swXS5kYXRhID0gX3RvdGFsXG4gICAgICAgIHN1Y2Nlc3NEZXRhaWxQaWVDaGFydE9wdGlvbnMuZGF0YS5kYXRhc2V0c1swXS5kYXRhID0gX3N1Y2Nlc3NcbiAgICAgICAgZmFpbGVkRGV0YWlsUGllQ2hhcnRPcHRpb25zLmRhdGEuZGF0YXNldHNbMF0uZGF0YSA9IF9mYWlsZWRcbiAgICAgICAgdG90YWxEZXRhaWxQaWVDaGFydC51cGRhdGUoKVxuICAgICAgICBzdWNjZXNzRGV0YWlsUGllQ2hhcnQudXBkYXRlKClcbiAgICAgICAgZmFpbGVkRGV0YWlsUGllQ2hhcnQudXBkYXRlKClcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGdldFBpZUNoYXJ0T3B0aW9ucyhkYXRhKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgdHlwZTogJ3BpZScsXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgIGRhdGFzZXRzOiBbe1xuICAgICAgICAgICAgICAgIGRhdGE6IGRhdGEsXG4gICAgICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yOiBjb2xvcnMsXG4gICAgICAgICAgICAgICAgbGFiZWw6ICdTeXN0ZW1zJ1xuICAgICAgICAgICAgfV0sXG4gICAgICAgICAgICBsYWJlbHM6IHBpZUNoYXJ0TGFiZWxzXG4gICAgICAgIH0sXG4gICAgICAgIG9wdGlvbnM6IHtcbiAgICAgICAgICAgIGxlZ2VuZDoge2Rpc3BsYXk6IGZhbHNlfSxcbiAgICAgICAgICAgIHJlc3BvbnNpdmU6IHRydWVcbiAgICAgICAgfVxuICAgIH1cbn1cbmZ1bmN0aW9uIHNldHVwUGllQ2hhcnRzKCkge1xuICAgIHRvdGFsRGV0YWlsUGllQ2hhcnRPcHRpb25zID0gZ2V0UGllQ2hhcnRPcHRpb25zKFtdKVxuICAgIHRvdGFsRGV0YWlsUGllQ2hhcnQgPSBuZXcgQ2hhcnQoJCgnLnRvdGFsLWRldGFpbC1waWUtY2hhcnQgY2FudmFzJykuZ2V0KDApLmdldENvbnRleHQoJzJkJyksIHRvdGFsRGV0YWlsUGllQ2hhcnRPcHRpb25zKVxuXG4gICAgc3VjY2Vzc0RldGFpbFBpZUNoYXJ0T3B0aW9ucyA9IGdldFBpZUNoYXJ0T3B0aW9ucyhbXSlcbiAgICBzdWNjZXNzRGV0YWlsUGllQ2hhcnQgPSBuZXcgQ2hhcnQoJCgnLnN1Y2Nlc3MtZGV0YWlsLXBpZS1jaGFydCBjYW52YXMnKS5nZXQoMCkuZ2V0Q29udGV4dCgnMmQnKSwgc3VjY2Vzc0RldGFpbFBpZUNoYXJ0T3B0aW9ucylcblxuICAgIGZhaWxlZERldGFpbFBpZUNoYXJ0T3B0aW9ucyA9IGdldFBpZUNoYXJ0T3B0aW9ucyhbXSlcbiAgICBmYWlsZWREZXRhaWxQaWVDaGFydCA9IG5ldyBDaGFydCgkKCcuZmFpbGVkLWRldGFpbC1waWUtY2hhcnQgY2FudmFzJykuZ2V0KDApLmdldENvbnRleHQoJzJkJyksIGZhaWxlZERldGFpbFBpZUNoYXJ0T3B0aW9ucylcbn1cbiIsIk9ic2VydmFibGUod2luZG93LCAnbGlzdFRyYWRlVXJsJywgc3dpdGNoQ29udGVudCwgJ2RhdGEvdHJhZGVzLmpzb24nKVxuT2JzZXJ2YWJsZSh3aW5kb3csICdkZXRhaWxUcmFkZVVybCcsIHN3aXRjaENvbnRlbnQsICdkYXRhL3RyYWRlLmpzb24nKVxuXG5mdW5jdGlvbiBsb2FkVHJhZGVzKCkge1xuICAgICQoJy50cmFkZS10YWJsZScpLmp0YWJsZSgnbG9hZCcpXG59XG5mdW5jdGlvbiBzZXR1cFRyYWRlc0hpc3RvcnkoKSB7XG4gICAgJCgnLmJ0bi1zZWFyY2gnKS5jbGljayhsb2FkVHJhZGVzKVxuICAgICQoJy5idG4tcmVzZXQnKS5jbGljayhmdW5jdGlvbigpIHtcbiAgICAgICAgJCgnLmZpbHRlci1mb3JtJykuZ2V0KDApLnJlc2V0KClcbiAgICAgICAgbG9hZFRyYWRlcygpXG4gICAgfSlcbiAgICBsZXQgJGRhdGVyYW5nZXBpY2tlciA9ICQoJy5kYXRlLXJhbmdlLXBpY2tlcicpLmRhdGVyYW5nZXBpY2tlcih7XG4gICAgICAgIGluaXRpYWxUZXh0OiAnUGxlYXNlIHNlbGVjdCBhIHJhbmdlJyxcbiAgICAgICAgZGF0ZXBpY2tlck9wdGlvbnMgOiB7XG4gICAgICAgICAgICBudW1iZXJPZk1vbnRocyA6IDIsXG4gICAgICAgICAgICAvLyBtaW5EYXRlOiAwLFxuICAgICAgICAgICAgbWF4RGF0ZTogMFxuICAgICAgICB9LFxuICAgICAgICBjaGFuZ2U6IGZ1bmN0aW9uKGUsIGRhdGEpIHtcbiAgICAgICAgICAgIGxldCByYW5nZSA9IEpTT04ucGFyc2UoJGRhdGVyYW5nZXBpY2tlci52YWwoKSlcbiAgICAgICAgICAgICQoYGlucHV0W25hbWU9RnJvbURhdGVdYCkudmFsKHJhbmdlLnN0YXJ0KVxuICAgICAgICAgICAgJChgaW5wdXRbbmFtZT10b0RhdGVdYCkudmFsKHJhbmdlLmVuZClcbiAgICAgICAgfVxuICAgIH0pXG4gICAgbGV0ICR0YWJsZSA9ICQoJy50cmFkZS10YWJsZScpXG4gICAgJHRhYmxlLmp0YWJsZSh7XG4gICAgICAgIHBhZ2luZzogdHJ1ZSwgcGFnZVNpemU6IDEwLFxuICAgICAgICBmaWVsZHM6IHtcbiAgICAgICAgICAgIHRyYWRlSWQ6IHt0aXRsZTogJ1RyYWRlIElEJ30sXG4gICAgICAgICAgICBwcm9kdWN0VHlwZToge3RpdGxlOiAnUHJvZHVjdCBUeXBlJ30sXG4gICAgICAgICAgICBzZXJ2aWNlOiB7dGl0bGU6ICdTZXJ2aWNlJ30sXG4gICAgICAgICAgICBtc2dUaW1lU3RhbXA6IHt0aXRsZTogJ1RpbWVzdGFtcCd9LFxuICAgICAgICAgICAgc3RhdHVzOiB7dGl0bGU6ICdTdGF0dXMnLCBkaXNwbGF5OiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGA8ZGl2IGNsYXNzPVwiY2VsbC1zdGF0dXNcIiAke2RhdGEucmVjb3JkLnN0YXR1c30+JHtkYXRhLnJlY29yZC5zdGF0dXN9PC9kaXY+YFxuICAgICAgICAgICAgfX0sXG4gICAgICAgIH0sXG4gICAgICAgIGFjdGlvbnM6IHtcbiAgICAgICAgICAgIGxpc3RBY3Rpb246IGZ1bmN0aW9uKGRhdGEsIHBhcmFtcykge1xuICAgICAgICAgICAgICAgIHJldHVybiAkLkRlZmVycmVkKGZ1bmN0aW9uKCRkZmQpIHtcbiAgICAgICAgICAgICAgICAgICAgJC5hamF4KHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHVybDogYCR7bGlzdFRyYWRlVXJsfT8keyQoJy5maWx0ZXItZm9ybScpLnNlcmlhbGl6ZSgpfWAsXG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhVHlwZTogJ2pzb24nLFxuICAgICAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24ocmVzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJGRmZC5yZXNvbHZlKHJlcy5ib2R5KVxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yOiBmdW5jdGlvbihyZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkZGZkLnJlamVjdCgpXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgcmVjb3Jkc0xvYWRlZDogZnVuY3Rpb24oZSwgbGlzdCkge1xuICAgICAgICAgICAgJHRhYmxlLmZpbmQoJy5qdGFibGUtZGF0YS1yb3cnKS5lYWNoKGZ1bmN0aW9uKGkpIHtcbiAgICAgICAgICAgICAgICBsZXQgJHJvdyA9ICQodGhpcylcbiAgICAgICAgICAgICAgICAkcm93LmNsaWNrKGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHJvdyA9IGxpc3QucmVjb3Jkc1tpXVxuICAgICAgICAgICAgICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgICAgICAgICAgICAgICAgdXJsOiBkZXRhaWxUcmFkZVVybCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGFUeXBlOiAnanNvbicsXG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhOiByb3csXG4gICAgICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbihyZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXcgVHJhZGVEZXRhaWwocmVzLmJvZHkpXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH1cbiAgICB9KVxuICAgIGxvYWRUcmFkZXMoKVxufVxuIl19
