Observable(window, 'content', switchContent, 'summary')
Observable(window, 'duration', updateDuration, 'today')
Observable(window, 'tradeData', setData)
Observable(window, 'systems', updateSystems)
Observable(window, 'success', update)
Observable(window, 'failed', update)
Observable(window, 'colors', null, ['#2ab4c0','#5C9BD1','#f36a5a','#8877a9','#2ab4c0','#2ab4c0','#2ab4c0'])

function switchContent() {
    $('.content').hide()
    $(`.content.${content}`).show()
    $('.switch').html(content == 'summary' ? 'Summary' : 'History')
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
        url: `/data/${duration}.json`,
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
    if (duration == 'week')
        barChartLabels = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
    else if (duration == 'month')
        barChartLabels = Array.from({length: 31}, (v, i) => i + 1)
    else
        barChartLabels = Array.from({length: 24}, (v, i) => i)
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

Observable(window, 'listTradeUrl', switchContent, '/data/trades.json')
Observable(window, 'detailTradeUrl', switchContent, '/data/trade.json')

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

let html = `<div class="ng-scope">
    <form name="roleCreateOrEditForm" role="form" novalidate="" class="form-validation ng-pristine ng-valid-maxlength ng-valid ng-valid-required">
        <div class="modal-header">
            <h4 class="modal-title">
                <!-- ngIf: vm.role.id --><span ng-if="vm.role.id" class="ng-binding ng-scope">Edit role: Admin</span><!-- end ngIf: vm.role.id -->
                <!-- ngIf: !vm.role.id -->
            </h4>
        </div>
        <div class="modal-body">
            <div class="tab-container tabbable-line ng-isolate-scope">
  <ul class="nav nav-tabs" ng-class="{'nav-stacked': vertical, 'nav-justified': justified}" ng-transclude="">
                <li ng-class="[{active: active, disabled: disabled}, classes]" class="uib-tab nav-item ng-scope ng-isolate-scope active" heading="Role properties">
  <a href="" ng-click="select($event)" class="nav-link ng-binding" uib-tab-heading-transclude="">Role properties</a>
</li>
                <li ng-class="[{active: active, disabled: disabled}, classes]" class="uib-tab nav-item ng-scope ng-isolate-scope" heading="Permissions">
  <a href="" ng-click="select($event)" class="nav-link ng-binding" uib-tab-heading-transclude="">Permissions</a>
</li>
            </ul>
  <div class="tab-content">
    <!-- ngRepeat: tab in tabset.tabs --><div class="tab-pane ng-scope active" ng-repeat="tab in tabset.tabs" ng-class="{active: tabset.active === tab.index}" uib-tab-content-transclude="tab">

                    <div class="form-group form-md-line-input form-md-floating-label no-hint ng-scope">
                        <input class="form-control ng-pristine ng-untouched ng-valid-maxlength ng-not-empty ng-valid ng-valid-required edited" type="text" name="RoleDisplayName" ng-class="{'edited':vm.role.displayName}" ng-model="vm.role.displayName" required="" maxlength="64">
                        <label>Role name</label>
                    </div>
                    <div class="md-checkbox-list ng-scope">
                        <div class="md-checkbox">
                            <input id="EditRole_IsDefault" class="md-check ng-pristine ng-untouched ng-valid ng-empty" type="checkbox" name="IsDefault" ng-model="vm.role.isDefault">
                            <label for="EditRole_IsDefault">
                                <span class="inc"></span>
                                <span class="check"></span>
                                <span class="box"></span>
                                Default
                            </label>
                            <span class="help-block">Assign to new users as default.</span>
                        </div>
                    </div>
                </div><!-- end ngRepeat: tab in tabset.tabs --><div class="tab-pane ng-scope" ng-repeat="tab in tabset.tabs" ng-class="{active: tabset.active === tab.index}" uib-tab-content-transclude="tab">

                    <permission-tree edit-data="vm.permissionEditData" class="ng-scope ng-isolate-scope"><div class="permission-tree jstree jstree-2 jstree-default jstree-checkbox-no-clicked jstree-checkbox-selection" role="tree" aria-multiselectable="true" tabindex="0" aria-activedescendant="Pages" aria-busy="false"><ul class="jstree-container-ul jstree-children" role="group"><li role="treeitem" aria-selected="true" aria-level="1" aria-labelledby="Pages_anchor" aria-expanded="true" id="Pages" class="jstree-node  jstree-open jstree-last"><i class="jstree-icon jstree-ocl" role="presentation"></i><a class="jstree-anchor  jstree-clicked" href="#" tabindex="-1" id="Pages_anchor"><i class="jstree-icon jstree-checkbox" role="presentation"></i><i class="jstree-icon jstree-themeicon fa fa-folder tree-item-icon-color icon-lg jstree-themeicon-custom" role="presentation"></i>Pages</a><ul role="group" class="jstree-children"><li role="treeitem" aria-selected="true" aria-level="2" aria-labelledby="Pages.Administration_anchor" aria-expanded="true" id="Pages.Administration" class="jstree-node  jstree-open"><i class="jstree-icon jstree-ocl" role="presentation"></i><a class="jstree-anchor  jstree-clicked" href="#" tabindex="-1" id="Pages.Administration_anchor"><i class="jstree-icon jstree-checkbox" role="presentation"></i><i class="jstree-icon jstree-themeicon fa fa-folder tree-item-icon-color icon-lg jstree-themeicon-custom" role="presentation"></i>Administration</a><ul role="group" class="jstree-children"><li role="treeitem" aria-selected="true" aria-level="3" aria-labelledby="Pages.Administration.AuditLogs_anchor" id="Pages.Administration.AuditLogs" class="jstree-node  jstree-leaf"><i class="jstree-icon jstree-ocl" role="presentation"></i><a class="jstree-anchor  jstree-clicked" href="#" tabindex="-1" id="Pages.Administration.AuditLogs_anchor"><i class="jstree-icon jstree-checkbox" role="presentation"></i><i class="jstree-icon jstree-themeicon fa fa-folder tree-item-icon-color icon-lg jstree-themeicon-custom" role="presentation"></i>Audit logs</a></li><li role="treeitem" aria-selected="true" aria-level="3" aria-labelledby="Pages.Administration.Languages_anchor" aria-expanded="true" id="Pages.Administration.Languages" class="jstree-node  jstree-open"><i class="jstree-icon jstree-ocl" role="presentation"></i><a class="jstree-anchor  jstree-clicked" href="#" tabindex="-1" id="Pages.Administration.Languages_anchor"><i class="jstree-icon jstree-checkbox" role="presentation"></i><i class="jstree-icon jstree-themeicon fa fa-folder tree-item-icon-color icon-lg jstree-themeicon-custom" role="presentation"></i>Languages</a><ul role="group" class="jstree-children"><li role="treeitem" aria-selected="true" aria-level="4" aria-labelledby="Pages.Administration.Languages.ChangeTexts_anchor" id="Pages.Administration.Languages.ChangeTexts" class="jstree-node  jstree-leaf"><i class="jstree-icon jstree-ocl" role="presentation"></i><a class="jstree-anchor  jstree-clicked" href="#" tabindex="-1" id="Pages.Administration.Languages.ChangeTexts_anchor"><i class="jstree-icon jstree-checkbox" role="presentation"></i><i class="jstree-icon jstree-themeicon fa fa-folder tree-item-icon-color icon-lg jstree-themeicon-custom" role="presentation"></i>Changing texts</a></li><li role="treeitem" aria-selected="true" aria-level="4" aria-labelledby="Pages.Administration.Languages.Create_anchor" id="Pages.Administration.Languages.Create" class="jstree-node  jstree-leaf"><i class="jstree-icon jstree-ocl" role="presentation"></i><a class="jstree-anchor  jstree-clicked" href="#" tabindex="-1" id="Pages.Administration.Languages.Create_anchor"><i class="jstree-icon jstree-checkbox" role="presentation"></i><i class="jstree-icon jstree-themeicon fa fa-folder tree-item-icon-color icon-lg jstree-themeicon-custom" role="presentation"></i>Creating new language</a></li><li role="treeitem" aria-selected="true" aria-level="4" aria-labelledby="Pages.Administration.Languages.Delete_anchor" id="Pages.Administration.Languages.Delete" class="jstree-node  jstree-leaf"><i class="jstree-icon jstree-ocl" role="presentation"></i><a class="jstree-anchor  jstree-clicked" href="#" tabindex="-1" id="Pages.Administration.Languages.Delete_anchor"><i class="jstree-icon jstree-checkbox" role="presentation"></i><i class="jstree-icon jstree-themeicon fa fa-folder tree-item-icon-color icon-lg jstree-themeicon-custom" role="presentation"></i>Deleting language</a></li><li role="treeitem" aria-selected="true" aria-level="4" aria-labelledby="Pages.Administration.Languages.Edit_anchor" id="Pages.Administration.Languages.Edit" class="jstree-node  jstree-leaf jstree-last"><i class="jstree-icon jstree-ocl" role="presentation"></i><a class="jstree-anchor  jstree-clicked" href="#" tabindex="-1" id="Pages.Administration.Languages.Edit_anchor"><i class="jstree-icon jstree-checkbox" role="presentation"></i><i class="jstree-icon jstree-themeicon fa fa-folder tree-item-icon-color icon-lg jstree-themeicon-custom" role="presentation"></i>Editing language</a></li></ul></li><li role="treeitem" aria-selected="true" aria-level="3" aria-labelledby="Pages.Administration.OrganizationUnits_anchor" aria-expanded="true" id="Pages.Administration.OrganizationUnits" class="jstree-node  jstree-open"><i class="jstree-icon jstree-ocl" role="presentation"></i><a class="jstree-anchor  jstree-clicked" href="#" tabindex="-1" id="Pages.Administration.OrganizationUnits_anchor"><i class="jstree-icon jstree-checkbox" role="presentation"></i><i class="jstree-icon jstree-themeicon fa fa-folder tree-item-icon-color icon-lg jstree-themeicon-custom" role="presentation"></i>Organization units</a><ul role="group" class="jstree-children"><li role="treeitem" aria-selected="true" aria-level="4" aria-labelledby="Pages.Administration.OrganizationUnits.ManageMembers_anchor" id="Pages.Administration.OrganizationUnits.ManageMembers" class="jstree-node  jstree-leaf"><i class="jstree-icon jstree-ocl" role="presentation"></i><a class="jstree-anchor  jstree-clicked" href="#" tabindex="-1" id="Pages.Administration.OrganizationUnits.ManageMembers_anchor"><i class="jstree-icon jstree-checkbox" role="presentation"></i><i class="jstree-icon jstree-themeicon fa fa-folder tree-item-icon-color icon-lg jstree-themeicon-custom" role="presentation"></i>Managing members</a></li><li role="treeitem" aria-selected="true" aria-level="4" aria-labelledby="Pages.Administration.OrganizationUnits.ManageOrganizationTree_anchor" id="Pages.Administration.OrganizationUnits.ManageOrganizationTree" class="jstree-node  jstree-leaf jstree-last"><i class="jstree-icon jstree-ocl" role="presentation"></i><a class="jstree-anchor  jstree-clicked" href="#" tabindex="-1" id="Pages.Administration.OrganizationUnits.ManageOrganizationTree_anchor"><i class="jstree-icon jstree-checkbox" role="presentation"></i><i class="jstree-icon jstree-themeicon fa fa-folder tree-item-icon-color icon-lg jstree-themeicon-custom" role="presentation"></i>Managing organization tree</a></li></ul></li><li role="treeitem" aria-selected="true" aria-level="3" aria-labelledby="Pages.Administration.Roles_anchor" aria-expanded="true" id="Pages.Administration.Roles" class="jstree-node  jstree-open"><i class="jstree-icon jstree-ocl" role="presentation"></i><a class="jstree-anchor  jstree-clicked" href="#" tabindex="-1" id="Pages.Administration.Roles_anchor"><i class="jstree-icon jstree-checkbox" role="presentation"></i><i class="jstree-icon jstree-themeicon fa fa-folder tree-item-icon-color icon-lg jstree-themeicon-custom" role="presentation"></i>Roles</a><ul role="group" class="jstree-children"><li role="treeitem" aria-selected="true" aria-level="4" aria-labelledby="Pages.Administration.Roles.Create_anchor" id="Pages.Administration.Roles.Create" class="jstree-node  jstree-leaf"><i class="jstree-icon jstree-ocl" role="presentation"></i><a class="jstree-anchor  jstree-clicked" href="#" tabindex="-1" id="Pages.Administration.Roles.Create_anchor"><i class="jstree-icon jstree-checkbox" role="presentation"></i><i class="jstree-icon jstree-themeicon fa fa-folder tree-item-icon-color icon-lg jstree-themeicon-custom" role="presentation"></i>Creating new role</a></li><li role="treeitem" aria-selected="true" aria-level="4" aria-labelledby="Pages.Administration.Roles.Delete_anchor" id="Pages.Administration.Roles.Delete" class="jstree-node  jstree-leaf"><i class="jstree-icon jstree-ocl" role="presentation"></i><a class="jstree-anchor  jstree-clicked" href="#" tabindex="-1" id="Pages.Administration.Roles.Delete_anchor"><i class="jstree-icon jstree-checkbox" role="presentation"></i><i class="jstree-icon jstree-themeicon fa fa-folder tree-item-icon-color icon-lg jstree-themeicon-custom" role="presentation"></i>Deleting role</a></li><li role="treeitem" aria-selected="true" aria-level="4" aria-labelledby="Pages.Administration.Roles.Edit_anchor" id="Pages.Administration.Roles.Edit" class="jstree-node  jstree-leaf jstree-last"><i class="jstree-icon jstree-ocl" role="presentation"></i><a class="jstree-anchor  jstree-clicked" href="#" tabindex="-1" id="Pages.Administration.Roles.Edit_anchor"><i class="jstree-icon jstree-checkbox" role="presentation"></i><i class="jstree-icon jstree-themeicon fa fa-folder tree-item-icon-color icon-lg jstree-themeicon-custom" role="presentation"></i>Editing role</a></li></ul></li><li role="treeitem" aria-selected="true" aria-level="3" aria-labelledby="Pages.Administration.Tenant.Settings_anchor" id="Pages.Administration.Tenant.Settings" class="jstree-node  jstree-leaf"><i class="jstree-icon jstree-ocl" role="presentation"></i><a class="jstree-anchor  jstree-clicked" href="#" tabindex="-1" id="Pages.Administration.Tenant.Settings_anchor"><i class="jstree-icon jstree-checkbox" role="presentation"></i><i class="jstree-icon jstree-themeicon fa fa-folder tree-item-icon-color icon-lg jstree-themeicon-custom" role="presentation"></i>Settings</a></li><li role="treeitem" aria-selected="true" aria-level="3" aria-labelledby="Pages.Administration.Users_anchor" aria-expanded="true" id="Pages.Administration.Users" class="jstree-node  jstree-open jstree-last"><i class="jstree-icon jstree-ocl" role="presentation"></i><a class="jstree-anchor  jstree-clicked" href="#" tabindex="-1" id="Pages.Administration.Users_anchor"><i class="jstree-icon jstree-checkbox" role="presentation"></i><i class="jstree-icon jstree-themeicon fa fa-folder tree-item-icon-color icon-lg jstree-themeicon-custom" role="presentation"></i>Users</a><ul role="group" class="jstree-children"><li role="treeitem" aria-selected="true" aria-level="4" aria-labelledby="Pages.Administration.Users.ChangePermissions_anchor" id="Pages.Administration.Users.ChangePermissions" class="jstree-node  jstree-leaf"><i class="jstree-icon jstree-ocl" role="presentation"></i><a class="jstree-anchor  jstree-clicked" href="#" tabindex="-1" id="Pages.Administration.Users.ChangePermissions_anchor"><i class="jstree-icon jstree-checkbox" role="presentation"></i><i class="jstree-icon jstree-themeicon fa fa-folder tree-item-icon-color icon-lg jstree-themeicon-custom" role="presentation"></i>Changing permissions</a></li><li role="treeitem" aria-selected="true" aria-level="4" aria-labelledby="Pages.Administration.Users.Create_anchor" id="Pages.Administration.Users.Create" class="jstree-node  jstree-leaf"><i class="jstree-icon jstree-ocl" role="presentation"></i><a class="jstree-anchor  jstree-clicked" href="#" tabindex="-1" id="Pages.Administration.Users.Create_anchor"><i class="jstree-icon jstree-checkbox" role="presentation"></i><i class="jstree-icon jstree-themeicon fa fa-folder tree-item-icon-color icon-lg jstree-themeicon-custom" role="presentation"></i>Creating new user</a></li><li role="treeitem" aria-selected="true" aria-level="4" aria-labelledby="Pages.Administration.Users.Delete_anchor" id="Pages.Administration.Users.Delete" class="jstree-node  jstree-leaf"><i class="jstree-icon jstree-ocl" role="presentation"></i><a class="jstree-anchor  jstree-clicked" href="#" tabindex="-1" id="Pages.Administration.Users.Delete_anchor"><i class="jstree-icon jstree-checkbox" role="presentation"></i><i class="jstree-icon jstree-themeicon fa fa-folder tree-item-icon-color icon-lg jstree-themeicon-custom" role="presentation"></i>Deleting user</a></li><li role="treeitem" aria-selected="true" aria-level="4" aria-labelledby="Pages.Administration.Users.Edit_anchor" id="Pages.Administration.Users.Edit" class="jstree-node  jstree-leaf"><i class="jstree-icon jstree-ocl" role="presentation"></i><a class="jstree-anchor  jstree-clicked" href="#" tabindex="-1" id="Pages.Administration.Users.Edit_anchor"><i class="jstree-icon jstree-checkbox" role="presentation"></i><i class="jstree-icon jstree-themeicon fa fa-folder tree-item-icon-color icon-lg jstree-themeicon-custom" role="presentation"></i>Editing user</a></li><li role="treeitem" aria-selected="true" aria-level="4" aria-labelledby="Pages.Administration.Users.Impersonation_anchor" id="Pages.Administration.Users.Impersonation" class="jstree-node  jstree-leaf jstree-last"><i class="jstree-icon jstree-ocl" role="presentation"></i><a class="jstree-anchor  jstree-clicked" href="#" tabindex="-1" id="Pages.Administration.Users.Impersonation_anchor"><i class="jstree-icon jstree-checkbox" role="presentation"></i><i class="jstree-icon jstree-themeicon fa fa-folder tree-item-icon-color icon-lg jstree-themeicon-custom" role="presentation"></i>Login for users</a></li></ul></li></ul></li><li role="treeitem" aria-selected="true" aria-level="2" aria-labelledby="Pages.Tenant.Dashboard_anchor" id="Pages.Tenant.Dashboard" class="jstree-node  jstree-leaf jstree-last"><i class="jstree-icon jstree-ocl" role="presentation"></i><a class="jstree-anchor  jstree-clicked" href="#" tabindex="-1" id="Pages.Tenant.Dashboard_anchor"><i class="jstree-icon jstree-checkbox" role="presentation"></i><i class="jstree-icon jstree-themeicon fa fa-folder tree-item-icon-color icon-lg jstree-themeicon-custom" role="presentation"></i>Dashboard</a></li></ul></li></ul></div></permission-tree>
                </div><!-- end ngRepeat: tab in tabset.tabs -->
  </div>
</div>
        </div>
    </form>
</div>`
class TradeDetail {
    constructor(data) {
        let $dialog = $(html).dialog({
            modal: true,
            // height: 800,
            width: 1024,
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
                $dialog.remove()
            }
        })
    }
}

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImVudHJ5LmpzIiwibW9kdWxlcy9iYXItY2hhcnRzLmpzIiwibW9kdWxlcy9waWUtY2hhcnRzLmpzIiwibW9kdWxlcy90cmFkZXMtaGlzdG9yeS5qcyIsImNsYXNzZXMvT2JzZXJ2YWJsZS5qcyIsImNsYXNzZXMvVHJhZGVEZXRhaWwuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3pFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNqSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDeERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDeEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJhcHAuanMiLCJzb3VyY2VzQ29udGVudCI6WyJPYnNlcnZhYmxlKHdpbmRvdywgJ2NvbnRlbnQnLCBzd2l0Y2hDb250ZW50LCAnc3VtbWFyeScpXG5PYnNlcnZhYmxlKHdpbmRvdywgJ2R1cmF0aW9uJywgdXBkYXRlRHVyYXRpb24sICd0b2RheScpXG5PYnNlcnZhYmxlKHdpbmRvdywgJ3RyYWRlRGF0YScsIHNldERhdGEpXG5PYnNlcnZhYmxlKHdpbmRvdywgJ3N5c3RlbXMnLCB1cGRhdGVTeXN0ZW1zKVxuT2JzZXJ2YWJsZSh3aW5kb3csICdzdWNjZXNzJywgdXBkYXRlKVxuT2JzZXJ2YWJsZSh3aW5kb3csICdmYWlsZWQnLCB1cGRhdGUpXG5PYnNlcnZhYmxlKHdpbmRvdywgJ2NvbG9ycycsIG51bGwsIFsnIzJhYjRjMCcsJyM1QzlCRDEnLCcjZjM2YTVhJywnIzg4NzdhOScsJyMyYWI0YzAnLCcjMmFiNGMwJywnIzJhYjRjMCddKVxuXG5mdW5jdGlvbiBzd2l0Y2hDb250ZW50KCkge1xuICAgICQoJy5jb250ZW50JykuaGlkZSgpXG4gICAgJChgLmNvbnRlbnQuJHtjb250ZW50fWApLnNob3coKVxuICAgICQoJy5zd2l0Y2gnKS5odG1sKGNvbnRlbnQgPT0gJ3N1bW1hcnknID8gJ1N1bW1hcnknIDogJ0hpc3RvcnknKVxufVxuZnVuY3Rpb24gc2V0RGF0YShkYXRhKSB7XG4gICAgbGV0IF9zdWNjZXNzID0gMCwgX2ZhaWxlZCA9IDBcbiAgICBzeXN0ZW1zID0gZGF0YS5zeXN0ZW1zXG4gICAgc3lzdGVtcy5mb3JFYWNoKHMgPT4ge1xuICAgICAgICBfc3VjY2VzcyArPSBzLnRyYWRlcy5zdWNjZXNzLnJlZHVjZSgocnMsIGkpID0+IHJzID0gcnMgKyBpLCAwKVxuICAgICAgICBfZmFpbGVkICs9IHMudHJhZGVzLmZhaWxlZC5yZWR1Y2UoKHJzLCBpKSA9PiBycyA9IHJzICsgaSwgMClcbiAgICB9KVxuICAgIHN1Y2Nlc3MgPSBfc3VjY2Vzc1xuICAgIGZhaWxlZCA9IF9mYWlsZWRcbn1cbmZ1bmN0aW9uIHVwZGF0ZSgpIHtcbiAgICAkKCcuc3VjY2VzcycpLmh0bWwoc3VjY2VzcylcbiAgICAkKCcuZmFpbGVkJykuaHRtbChmYWlsZWQpXG4gICAgJCgnLnRvdGFsJykuaHRtbChzdWNjZXNzICsgZmFpbGVkKVxufVxuZnVuY3Rpb24gdXBkYXRlU3lzdGVtcygpIHtcbiAgICB1cGRhdGVCYXJDaGFydHMoKVxuICAgIHVwZGF0ZVBpZUNoYXJ0cygpXG4gICAgJCgnLnN5c3RlbXMnKS5odG1sKCcnKVxuICAgIHN5c3RlbXMuZm9yRWFjaCgocyxpKSA9PiB7XG4gICAgICAgIGxldCBvayA9IHMudHJhZGVzLnN1Y2Nlc3MucmVkdWNlKChzdW0saSkgPT4gc3VtID0gc3VtICsgaSwgMCksXG4gICAgICAgICAgICBrbyA9IHMudHJhZGVzLmZhaWxlZC5yZWR1Y2UoKHN1bSxpKSA9PiBzdW0gPSBzdW0gKyBpLCAwKVxuICAgICAgICAkKCcuc3lzdGVtcycpLmFwcGVuZChgPHRyPlxuICAgICAgICA8dGQ+PHNwYW4gY2xhc3M9XCJmb250LXB1cnBsZS1zb2Z0XCI+PHNwYW4gY2xhc3M9XCJsZWdlbmQtaXRlbVwiIHN0eWxlPVwiYmFja2dyb3VuZC1jb2xvcjogJHtjb2xvcnNbaV19XCI+PC9zcGFuPiR7cy5uYW1lfTwvc3Bhbj48L3RkPlxuICAgICAgICA8dGQ+PHNwYW4gY2xhc3M9XCJmb250LWdyZWVuLWhhemVcIj4ke29rICsga299PC9zcGFuPjwvdGQ+XG4gICAgICAgIDx0ZD48c3BhbiBjbGFzcz1cImZvbnQtYmx1ZS1zaGFycFwiPiR7b2t9PC9zcGFuPjwvdGQ+XG4gICAgICAgIDx0ZD48c3BhbiBjbGFzcz1cImZvbnQtcmVkLWhhemVcIj4ke2tvfTwvc3Bhbj48L3RkPlxuICAgICAgICA8L3RyPmApXG4gICAgICAgICQoJy5wcm9ncmVzcy1zdWNjZXNzIC5wcm9ncmVzcy1iYXInKS53aWR0aChgJHsoMTAwKm9rLyhvaytrbykpLnRvUHJlY2lzaW9uKDIpfSVgKVxuICAgICAgICAkKCcucHJvZ3Jlc3Mtc3VjY2VzcyAuc3RhdHVzLW51bWJlcicpLmh0bWwoYCR7KDEwMCpvay8ob2sra28pKS50b1ByZWNpc2lvbigyKX0lYClcbiAgICAgICAgJCgnLnByb2dyZXNzLWZhaWxlZCAucHJvZ3Jlc3MtYmFyJykud2lkdGgoYCR7KDEwMCprby8ob2sra28pKS50b1ByZWNpc2lvbigyKX0lYClcbiAgICAgICAgJCgnLnByb2dyZXNzLWZhaWxlZCAuc3RhdHVzLW51bWJlcicpLmh0bWwoYCR7KDEwMCprby8ob2sra28pKS50b1ByZWNpc2lvbigyKX0lYClcbiAgICB9KVxufVxuZnVuY3Rpb24gdXBkYXRlRHVyYXRpb24oKSB7XG4gICAgYmFyQ2hhcnRzRHVyYXRpb25VcGRhdGUoKVxuICAgIGZldGNoKClcbn1cbmZ1bmN0aW9uIGZldGNoKCkge1xuICAgICQuYWpheCh7XG4gICAgICAgIHVybDogYC9kYXRhLyR7ZHVyYXRpb259Lmpzb25gLFxuICAgICAgICBkYXRhVHlwZTogJ2pzb24nLFxuICAgICAgICBzdWNjZXNzOiBkYXRhID0+IHRyYWRlRGF0YSA9IGRhdGFcbiAgICB9KVxufVxuXG4kKGRvY3VtZW50KS5yZWFkeSgoKSA9PiB7XG4gICAgZHVyYXRpb24gPSAkKCcuZHVyYXRpb24gbGFiZWwuYWN0aXZlJykuZGF0YSgndmFsdWUnKVxuICAgIHNldHVwQmFyQ2hhcnRzKClcbiAgICBzZXR1cFBpZUNoYXJ0cygpXG4gICAgJCgnLmR1cmF0aW9uIGxhYmVsLnN3aXRjaCcpLmNsaWNrKGZ1bmN0aW9uKCkge1xuICAgICAgICBjb250ZW50ID0gY29udGVudCA9PSAnc3VtbWFyeScgPyAnaGlzdG9yeScgOiAnc3VtbWFyeSdcbiAgICB9KVxuICAgICQoJy5kdXJhdGlvbiBsYWJlbC50aW1lJykuY2xpY2soZnVuY3Rpb24oKSB7XG4gICAgICAgICQodGhpcykucGFyZW50KCkuZmluZCgnbGFiZWwnKS5yZW1vdmVDbGFzcygnYWN0aXZlJylcbiAgICAgICAgJCh0aGlzKS5hZGRDbGFzcygnYWN0aXZlJylcbiAgICAgICAgZHVyYXRpb24gPSAkKHRoaXMpLmRhdGEoJ3ZhbHVlJylcbiAgICB9KVxuICAgIHNldHVwVHJhZGVzSGlzdG9yeSgpXG59KVxuIiwiT2JzZXJ2YWJsZSh3aW5kb3csICdiYXJDaGFydExhYmVscycpXG5cbk9ic2VydmFibGUod2luZG93LCAnZGV0YWlsQmFyQ2hhcnQnKVxuT2JzZXJ2YWJsZSh3aW5kb3csICd0b3RhbERldGFpbEJhckNoYXJ0Jylcbk9ic2VydmFibGUod2luZG93LCAnc3VjY2Vzc0RldGFpbEJhckNoYXJ0Jylcbk9ic2VydmFibGUod2luZG93LCAnZmFpbGVkRGV0YWlsQmFyQ2hhcnQnKVxuXG5PYnNlcnZhYmxlKHdpbmRvdywgJ2RldGFpbEJhckNoYXJ0RGF0YScpXG5PYnNlcnZhYmxlKHdpbmRvdywgJ3RvdGFsRGV0YWlsQmFyQ2hhcnREYXRhJylcbk9ic2VydmFibGUod2luZG93LCAnc3VjY2Vzc0RldGFpbEJhckNoYXJ0RGF0YScpXG5PYnNlcnZhYmxlKHdpbmRvdywgJ2ZhaWxlZERldGFpbEJhckNoYXJ0RGF0YScpXG5cbk9ic2VydmFibGUod2luZG93LCAnZGV0YWlsQmFyQ2hhcnRPcHRpb25zJylcbk9ic2VydmFibGUod2luZG93LCAndG90YWxEZXRhaWxCYXJDaGFydE9wdGlvbnMnKVxuT2JzZXJ2YWJsZSh3aW5kb3csICdzdWNjZXNzRGV0YWlsQmFyQ2hhcnRPcHRpb25zJylcbk9ic2VydmFibGUod2luZG93LCAnZmFpbGVkRGV0YWlsQmFyQ2hhcnRPcHRpb25zJylcblxuZnVuY3Rpb24gYmFyQ2hhcnRzRHVyYXRpb25VcGRhdGUoKSB7XG4gICAgaWYgKGR1cmF0aW9uID09ICd3ZWVrJylcbiAgICAgICAgYmFyQ2hhcnRMYWJlbHMgPSBbJ01vbicsJ1R1ZScsJ1dlZCcsJ1RodScsJ0ZyaScsJ1NhdCcsJ1N1biddXG4gICAgZWxzZSBpZiAoZHVyYXRpb24gPT0gJ21vbnRoJylcbiAgICAgICAgYmFyQ2hhcnRMYWJlbHMgPSBBcnJheS5mcm9tKHtsZW5ndGg6IDMxfSwgKHYsIGkpID0+IGkgKyAxKVxuICAgIGVsc2VcbiAgICAgICAgYmFyQ2hhcnRMYWJlbHMgPSBBcnJheS5mcm9tKHtsZW5ndGg6IDI0fSwgKHYsIGkpID0+IGkpXG59XG5cbmZ1bmN0aW9uIHVwZGF0ZUJhckNoYXJ0cygpIHtcbiAgICBsZXQgX3RvdGFsID0gQXJyYXkuZnJvbSh7bGVuZ3RoOiBiYXJDaGFydExhYmVscy5sZW5ndGh9LCAodiwgaSkgPT4gMCksXG4gICAgICAgIF9zdWNjZXNzID0gQXJyYXkuZnJvbSh7bGVuZ3RoOiBiYXJDaGFydExhYmVscy5sZW5ndGh9LCAodiwgaSkgPT4gMCksXG4gICAgICAgIF9mYWlsZWQgPSBBcnJheS5mcm9tKHtsZW5ndGg6IGJhckNoYXJ0TGFiZWxzLmxlbmd0aH0sICh2LCBpKSA9PiAwKVxuICAgIHN5c3RlbXMuZm9yRWFjaChzID0+IHtcbiAgICAgICAgX3N1Y2Nlc3MuZm9yRWFjaCgobiwgaSkgPT4gX3N1Y2Nlc3NbaV0gKz0gcy50cmFkZXMuc3VjY2Vzc1tpXSlcbiAgICAgICAgX2ZhaWxlZC5mb3JFYWNoKChuLCBpKSA9PiBfZmFpbGVkW2ldICs9IHMudHJhZGVzLmZhaWxlZFtpXSlcbiAgICB9KVxuICAgIF90b3RhbC5mb3JFYWNoKChuLCBpKSA9PiBfdG90YWxbaV0gPSBfc3VjY2Vzc1tpXSArIF9mYWlsZWRbaV0pXG4gICAgZGV0YWlsQmFyQ2hhcnREYXRhLmxhYmVscyA9IHRvdGFsRGV0YWlsQmFyQ2hhcnREYXRhLmxhYmVscyA9IHN1Y2Nlc3NEZXRhaWxCYXJDaGFydERhdGEubGFiZWxzID0gZmFpbGVkRGV0YWlsQmFyQ2hhcnREYXRhLmxhYmVscyA9IGJhckNoYXJ0TGFiZWxzXG4gICAgZGV0YWlsQmFyQ2hhcnREYXRhLmRhdGFzZXRzWzBdLmRhdGEgPSB0b3RhbERldGFpbEJhckNoYXJ0RGF0YS5kYXRhc2V0c1swXS5kYXRhID0gX3RvdGFsXG4gICAgZGV0YWlsQmFyQ2hhcnREYXRhLmRhdGFzZXRzWzFdLmRhdGEgPSBzdWNjZXNzRGV0YWlsQmFyQ2hhcnREYXRhLmRhdGFzZXRzWzBdLmRhdGEgPSBfc3VjY2Vzc1xuICAgIGRldGFpbEJhckNoYXJ0RGF0YS5kYXRhc2V0c1syXS5kYXRhID0gZmFpbGVkRGV0YWlsQmFyQ2hhcnREYXRhLmRhdGFzZXRzWzBdLmRhdGEgPSBfZmFpbGVkXG4gICAgZGV0YWlsQmFyQ2hhcnQudXBkYXRlKClcbiAgICB0b3RhbERldGFpbEJhckNoYXJ0LnVwZGF0ZSgpXG4gICAgc3VjY2Vzc0RldGFpbEJhckNoYXJ0LnVwZGF0ZSgpXG4gICAgZmFpbGVkRGV0YWlsQmFyQ2hhcnQudXBkYXRlKClcbn1cblxuZnVuY3Rpb24gZ2V0QmFyQ2hhcnRPcHRpb25zKGRhdGEpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICB0eXBlOiAnYmFyJyxcbiAgICAgICAgZGF0YTogZGF0YSxcbiAgICAgICAgb3B0aW9uczoge1xuICAgICAgICAgICAgbGVnZW5kOiB7ZGlzcGxheTogZmFsc2V9LFxuICAgICAgICAgICAgdGl0bGU6e2Rpc3BsYXk6IGZhbHNlLH0sXG4gICAgICAgICAgICB0b29sdGlwczoge21vZGU6ICdpbmRleCcsaW50ZXJzZWN0OiB0cnVlfSxcbiAgICAgICAgICAgIHJlc3BvbnNpdmU6IHRydWUsXG4gICAgICAgICAgICBzY2FsZXM6IHtcbiAgICAgICAgICAgICAgICB4QXhlczogW3tcbiAgICAgICAgICAgICAgICAgICAgc3RhY2tlZDogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgZGlzcGxheTogZmFsc2VcbiAgICAgICAgICAgICAgICB9XSxcbiAgICAgICAgICAgICAgICB5QXhlczogW3tcbiAgICAgICAgICAgICAgICAgICAgc3RhY2tlZDogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgZGlzcGxheTogZmFsc2VcbiAgICAgICAgICAgICAgICB9XVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuZnVuY3Rpb24gZ2V0QmFyQ2hhcnREYXRhKGRhdGFzZXRzKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgbGFiZWxzOiBiYXJDaGFydExhYmVscyxcbiAgICAgICAgZGF0YXNldHM6IGRhdGFzZXRzXG4gICAgfVxufVxuZnVuY3Rpb24gc2V0dXBCYXJDaGFydHMoKSB7XG4gICAgbGV0IHNhbXBlQmFyQ2hhcnREYXRhID0gQXJyYXkuZnJvbSh7bGVuZ3RoOiBiYXJDaGFydExhYmVscy5sZW5ndGh9LCAodiwgaSkgPT4gMClcbiAgICBkZXRhaWxCYXJDaGFydERhdGEgPSBnZXRCYXJDaGFydERhdGEoW3tcbiAgICAgICAgbGFiZWw6ICdUb3RhbCcsXG4gICAgICAgIGJhY2tncm91bmRDb2xvcjogJyMyYWI0YzAnLFxuICAgICAgICBkYXRhOiBzYW1wZUJhckNoYXJ0RGF0YVxuICAgIH0sIHtcbiAgICAgICAgbGFiZWw6ICdTdWNjZXNzJyxcbiAgICAgICAgYmFja2dyb3VuZENvbG9yOiAnIzVDOUJEMScsXG4gICAgICAgIGRhdGE6IHNhbXBlQmFyQ2hhcnREYXRhXG4gICAgfSwge1xuICAgICAgICBsYWJlbDogJ0ZhaWxlZCcsXG4gICAgICAgIGJhY2tncm91bmRDb2xvcjogJyNmMzZhNWEnLFxuICAgICAgICBkYXRhOiBzYW1wZUJhckNoYXJ0RGF0YVxuICAgIH1dKVxuICAgIGRldGFpbEJhckNoYXJ0T3B0aW9ucyA9IGdldEJhckNoYXJ0T3B0aW9ucyhkZXRhaWxCYXJDaGFydERhdGEpXG4gICAgZGV0YWlsQmFyQ2hhcnRPcHRpb25zLm9wdGlvbnMuc2NhbGVzLnlBeGVzWzBdLmRpc3BsYXkgPSB0cnVlXG4gICAgZGV0YWlsQmFyQ2hhcnQgPSBuZXcgQ2hhcnQoJCgnLmRldGFpbC1iYXItY2hhcnQgY2FudmFzJykuZ2V0KDApLmdldENvbnRleHQoJzJkJyksIGRldGFpbEJhckNoYXJ0T3B0aW9ucylcblxuICAgIHRvdGFsRGV0YWlsQmFyQ2hhcnREYXRhID0gZ2V0QmFyQ2hhcnREYXRhKFt7XG4gICAgICAgIGJhY2tncm91bmRDb2xvcjogJyMyYWI0YzAnLFxuICAgICAgICBkYXRhOiBzYW1wZUJhckNoYXJ0RGF0YVxuICAgIH1dKVxuICAgIHRvdGFsRGV0YWlsQmFyQ2hhcnRPcHRpb25zID0gZ2V0QmFyQ2hhcnRPcHRpb25zKHRvdGFsRGV0YWlsQmFyQ2hhcnREYXRhKVxuICAgIHRvdGFsRGV0YWlsQmFyQ2hhcnQgPSBuZXcgQ2hhcnQoJCgnLnRvdGFsLWRldGFpbC1iYXItY2hhcnQgY2FudmFzJykuZ2V0KDApLmdldENvbnRleHQoJzJkJyksIHRvdGFsRGV0YWlsQmFyQ2hhcnRPcHRpb25zKVxuXG4gICAgc3VjY2Vzc0RldGFpbEJhckNoYXJ0RGF0YSA9IGdldEJhckNoYXJ0RGF0YShbe1xuICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6ICcjNUM5QkQxJyxcbiAgICAgICAgZGF0YTogc2FtcGVCYXJDaGFydERhdGFcbiAgICB9XSlcbiAgICBzdWNjZXNzRGV0YWlsQmFyQ2hhcnRPcHRpb25zID0gZ2V0QmFyQ2hhcnRPcHRpb25zKHN1Y2Nlc3NEZXRhaWxCYXJDaGFydERhdGEpXG4gICAgc3VjY2Vzc0RldGFpbEJhckNoYXJ0ID0gbmV3IENoYXJ0KCQoJy5zdWNjZXNzLWRldGFpbC1iYXItY2hhcnQgY2FudmFzJykuZ2V0KDApLmdldENvbnRleHQoJzJkJyksIHN1Y2Nlc3NEZXRhaWxCYXJDaGFydE9wdGlvbnMpXG5cbiAgICBmYWlsZWREZXRhaWxCYXJDaGFydERhdGEgPSBnZXRCYXJDaGFydERhdGEoW3tcbiAgICAgICAgYmFja2dyb3VuZENvbG9yOiAnI2YzNmE1YScsXG4gICAgICAgIGRhdGE6IHNhbXBlQmFyQ2hhcnREYXRhXG4gICAgfV0pXG4gICAgZmFpbGVkRGV0YWlsQmFyQ2hhcnRPcHRpb25zID0gZ2V0QmFyQ2hhcnRPcHRpb25zKGZhaWxlZERldGFpbEJhckNoYXJ0RGF0YSlcbiAgICBmYWlsZWREZXRhaWxCYXJDaGFydCA9IG5ldyBDaGFydCgkKCcuZmFpbGVkLWRldGFpbC1iYXItY2hhcnQgY2FudmFzJykuZ2V0KDApLmdldENvbnRleHQoJzJkJyksIGZhaWxlZERldGFpbEJhckNoYXJ0T3B0aW9ucylcbn1cbiIsIk9ic2VydmFibGUod2luZG93LCAncGllQ2hhcnRMYWJlbHMnLCBudWxsLCBbXSlcblxuT2JzZXJ2YWJsZSh3aW5kb3csICd0b3RhbERldGFpbFBpZUNoYXJ0Jylcbk9ic2VydmFibGUod2luZG93LCAnc3VjY2Vzc0RldGFpbFBpZUNoYXJ0Jylcbk9ic2VydmFibGUod2luZG93LCAnZmFpbGVkRGV0YWlsUGllQ2hhcnQnKVxuXG5PYnNlcnZhYmxlKHdpbmRvdywgJ3RvdGFsRGV0YWlsUGllQ2hhcnREYXRhJywgbnVsbCwgW10pXG5PYnNlcnZhYmxlKHdpbmRvdywgJ3N1Y2Nlc3NEZXRhaWxQaWVDaGFydERhdGEnLCBudWxsLCBbXSlcbk9ic2VydmFibGUod2luZG93LCAnZmFpbGVkRGV0YWlsUGllQ2hhcnREYXRhJywgbnVsbCwgW10pXG5cbk9ic2VydmFibGUod2luZG93LCAndG90YWxEZXRhaWxQaWVDaGFydE9wdGlvbnMnKVxuT2JzZXJ2YWJsZSh3aW5kb3csICdzdWNjZXNzRGV0YWlsUGllQ2hhcnRPcHRpb25zJylcbk9ic2VydmFibGUod2luZG93LCAnZmFpbGVkRGV0YWlsUGllQ2hhcnRPcHRpb25zJylcblxuZnVuY3Rpb24gdXBkYXRlUGllQ2hhcnRzKCkge1xuICAgIHBpZUNoYXJ0TGFiZWxzID0gc3lzdGVtcy5tYXAocyA9PiBzLm5hbWUpXG4gICAgbGV0IF9zdWNjZXNzID0gcGllQ2hhcnRMYWJlbHMubWFwKG4gPT4gc3lzdGVtcy5maW5kKHMgPT4gcy5uYW1lID09IG4pLnRyYWRlcy5zdWNjZXNzLnJlZHVjZSgoc3VtLCBpKSA9PiBzdW0gPSBzdW0gKyBpLCAwKSksXG4gICAgICAgIF9mYWlsZWQgPSBwaWVDaGFydExhYmVscy5tYXAobiA9PiBzeXN0ZW1zLmZpbmQocyA9PiBzLm5hbWUgPT0gbikudHJhZGVzLmZhaWxlZC5yZWR1Y2UoKHN1bSwgaSkgPT4gc3VtID0gc3VtICsgaSwgMCkpLFxuICAgICAgICBfdG90YWwgPSBwaWVDaGFydExhYmVscy5tYXAoKG4sIGkpID0+IF9zdWNjZXNzW2ldICsgX2ZhaWxlZFtpXSlcblxuICAgIHRvdGFsRGV0YWlsUGllQ2hhcnRPcHRpb25zLmRhdGEubGFiZWxzID0gc3VjY2Vzc0RldGFpbFBpZUNoYXJ0T3B0aW9ucy5kYXRhLmxhYmVscyA9IGZhaWxlZERldGFpbFBpZUNoYXJ0T3B0aW9ucy5kYXRhLmxhYmVscyA9IHBpZUNoYXJ0TGFiZWxzXG4gICAgdG90YWxEZXRhaWxQaWVDaGFydE9wdGlvbnMuZGF0YS5kYXRhc2V0c1swXS5kYXRhID0gX3RvdGFsXG4gICAgc3VjY2Vzc0RldGFpbFBpZUNoYXJ0T3B0aW9ucy5kYXRhLmRhdGFzZXRzWzBdLmRhdGEgPSBfc3VjY2Vzc1xuICAgIGZhaWxlZERldGFpbFBpZUNoYXJ0T3B0aW9ucy5kYXRhLmRhdGFzZXRzWzBdLmRhdGEgPSBfZmFpbGVkXG4gICAgdG90YWxEZXRhaWxQaWVDaGFydC51cGRhdGUoKVxuICAgIHN1Y2Nlc3NEZXRhaWxQaWVDaGFydC51cGRhdGUoKVxuICAgIGZhaWxlZERldGFpbFBpZUNoYXJ0LnVwZGF0ZSgpXG59XG5cbmZ1bmN0aW9uIGdldFBpZUNoYXJ0T3B0aW9ucyhkYXRhKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgdHlwZTogJ3BpZScsXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgIGRhdGFzZXRzOiBbe1xuICAgICAgICAgICAgICAgIGRhdGE6IGRhdGEsXG4gICAgICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yOiBjb2xvcnMsXG4gICAgICAgICAgICAgICAgbGFiZWw6ICdTeXN0ZW1zJ1xuICAgICAgICAgICAgfV0sXG4gICAgICAgICAgICBsYWJlbHM6IHBpZUNoYXJ0TGFiZWxzXG4gICAgICAgIH0sXG4gICAgICAgIG9wdGlvbnM6IHtcbiAgICAgICAgICAgIGxlZ2VuZDoge2Rpc3BsYXk6IGZhbHNlfSxcbiAgICAgICAgICAgIHJlc3BvbnNpdmU6IHRydWVcbiAgICAgICAgfVxuICAgIH1cbn1cbmZ1bmN0aW9uIHNldHVwUGllQ2hhcnRzKCkge1xuICAgIHRvdGFsRGV0YWlsUGllQ2hhcnRPcHRpb25zID0gZ2V0UGllQ2hhcnRPcHRpb25zKHRvdGFsRGV0YWlsUGllQ2hhcnREYXRhKVxuICAgIHRvdGFsRGV0YWlsUGllQ2hhcnQgPSBuZXcgQ2hhcnQoJCgnLnRvdGFsLWRldGFpbC1waWUtY2hhcnQgY2FudmFzJykuZ2V0KDApLmdldENvbnRleHQoJzJkJyksIHRvdGFsRGV0YWlsUGllQ2hhcnRPcHRpb25zKVxuXG4gICAgc3VjY2Vzc0RldGFpbFBpZUNoYXJ0T3B0aW9ucyA9IGdldFBpZUNoYXJ0T3B0aW9ucyhzdWNjZXNzRGV0YWlsUGllQ2hhcnREYXRhKVxuICAgIHN1Y2Nlc3NEZXRhaWxQaWVDaGFydCA9IG5ldyBDaGFydCgkKCcuc3VjY2Vzcy1kZXRhaWwtcGllLWNoYXJ0IGNhbnZhcycpLmdldCgwKS5nZXRDb250ZXh0KCcyZCcpLCBzdWNjZXNzRGV0YWlsUGllQ2hhcnRPcHRpb25zKVxuXG4gICAgZmFpbGVkRGV0YWlsUGllQ2hhcnRPcHRpb25zID0gZ2V0UGllQ2hhcnRPcHRpb25zKGZhaWxlZERldGFpbFBpZUNoYXJ0RGF0YSlcbiAgICBmYWlsZWREZXRhaWxQaWVDaGFydCA9IG5ldyBDaGFydCgkKCcuZmFpbGVkLWRldGFpbC1waWUtY2hhcnQgY2FudmFzJykuZ2V0KDApLmdldENvbnRleHQoJzJkJyksIGZhaWxlZERldGFpbFBpZUNoYXJ0T3B0aW9ucylcbn1cbiIsIk9ic2VydmFibGUod2luZG93LCAnbGlzdFRyYWRlVXJsJywgc3dpdGNoQ29udGVudCwgJy9kYXRhL3RyYWRlcy5qc29uJylcbk9ic2VydmFibGUod2luZG93LCAnZGV0YWlsVHJhZGVVcmwnLCBzd2l0Y2hDb250ZW50LCAnL2RhdGEvdHJhZGUuanNvbicpXG5cbmZ1bmN0aW9uIGxvYWRUcmFkZXMoKSB7XG4gICAgJCgnLnRyYWRlLXRhYmxlJykuanRhYmxlKCdsb2FkJylcbn1cbmZ1bmN0aW9uIHNldHVwVHJhZGVzSGlzdG9yeSgpIHtcbiAgICAkKCcuYnRuLXNlYXJjaCcpLmNsaWNrKGxvYWRUcmFkZXMpXG4gICAgJCgnLmJ0bi1yZXNldCcpLmNsaWNrKGZ1bmN0aW9uKCkge1xuICAgICAgICAkKCcuZmlsdGVyLWZvcm0nKS5nZXQoMCkucmVzZXQoKVxuICAgICAgICBsb2FkVHJhZGVzKClcbiAgICB9KVxuICAgIGxldCAkZGF0ZXJhbmdlcGlja2VyID0gJCgnLmRhdGUtcmFuZ2UtcGlja2VyJykuZGF0ZXJhbmdlcGlja2VyKHtcbiAgICAgICAgaW5pdGlhbFRleHQ6ICdQbGVhc2Ugc2VsZWN0IGEgcmFuZ2UnLFxuICAgICAgICBkYXRlcGlja2VyT3B0aW9ucyA6IHtcbiAgICAgICAgICAgIG51bWJlck9mTW9udGhzIDogMixcbiAgICAgICAgICAgIC8vIG1pbkRhdGU6IDAsXG4gICAgICAgICAgICBtYXhEYXRlOiAwXG4gICAgICAgIH0sXG4gICAgICAgIGNoYW5nZTogZnVuY3Rpb24oZSwgZGF0YSkge1xuICAgICAgICAgICAgbGV0IHJhbmdlID0gSlNPTi5wYXJzZSgkZGF0ZXJhbmdlcGlja2VyLnZhbCgpKVxuICAgICAgICAgICAgJChgaW5wdXRbbmFtZT1Gcm9tRGF0ZV1gKS52YWwocmFuZ2Uuc3RhcnQpXG4gICAgICAgICAgICAkKGBpbnB1dFtuYW1lPXRvRGF0ZV1gKS52YWwocmFuZ2UuZW5kKVxuICAgICAgICB9XG4gICAgfSlcbiAgICBsZXQgJHRhYmxlID0gJCgnLnRyYWRlLXRhYmxlJylcbiAgICAkdGFibGUuanRhYmxlKHtcbiAgICAgICAgcGFnaW5nOiB0cnVlLCBwYWdlU2l6ZTogMTAsXG4gICAgICAgIGZpZWxkczoge1xuICAgICAgICAgICAgdHJhZGVJZDoge3RpdGxlOiAnVHJhZGUgSUQnfSxcbiAgICAgICAgICAgIHByb2R1Y3RUeXBlOiB7dGl0bGU6ICdQcm9kdWN0IFR5cGUnfSxcbiAgICAgICAgICAgIHNlcnZpY2U6IHt0aXRsZTogJ1NlcnZpY2UnfSxcbiAgICAgICAgICAgIG1zZ1RpbWVTdGFtcDoge3RpdGxlOiAnVGltZXN0YW1wJ30sXG4gICAgICAgICAgICBzdGF0dXM6IHt0aXRsZTogJ1N0YXR1cycsIGRpc3BsYXk6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYDxkaXYgY2xhc3M9XCJjZWxsLXN0YXR1c1wiICR7ZGF0YS5yZWNvcmQuc3RhdHVzfT4ke2RhdGEucmVjb3JkLnN0YXR1c308L2Rpdj5gXG4gICAgICAgICAgICB9fSxcbiAgICAgICAgfSxcbiAgICAgICAgYWN0aW9uczoge1xuICAgICAgICAgICAgbGlzdEFjdGlvbjogZnVuY3Rpb24oZGF0YSwgcGFyYW1zKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICQuRGVmZXJyZWQoZnVuY3Rpb24oJGRmZCkge1xuICAgICAgICAgICAgICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgICAgICAgICAgICAgICAgdXJsOiBgJHtsaXN0VHJhZGVVcmx9PyR7JCgnLmZpbHRlci1mb3JtJykuc2VyaWFsaXplKCl9YCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGFUeXBlOiAnanNvbicsXG4gICAgICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbihyZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkZGZkLnJlc29sdmUocmVzLmJvZHkpXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uKHJlcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRkZmQucmVqZWN0KClcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICByZWNvcmRzTG9hZGVkOiBmdW5jdGlvbihlLCBsaXN0KSB7XG4gICAgICAgICAgICAkdGFibGUuZmluZCgnLmp0YWJsZS1kYXRhLXJvdycpLmVhY2goZnVuY3Rpb24oaSkge1xuICAgICAgICAgICAgICAgIGxldCAkcm93ID0gJCh0aGlzKVxuICAgICAgICAgICAgICAgICRyb3cuY2xpY2soZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgICAgICAgICBsZXQgcm93ID0gbGlzdC5yZWNvcmRzW2ldXG4gICAgICAgICAgICAgICAgICAgICQuYWpheCh7XG4gICAgICAgICAgICAgICAgICAgICAgICB1cmw6IGRldGFpbFRyYWRlVXJsLFxuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YVR5cGU6ICdqc29uJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGE6IHJvdyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uKHJlcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ldyBUcmFkZURldGFpbChyZXMuYm9keSlcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgIH0pXG4gICAgbG9hZFRyYWRlcygpXG59XG4iLCJmdW5jdGlvbiBPYnNlcnZhYmxlKG8sIHAsIGNiLCB2KSB7XG4gICAgaWYgKHYgIT09IHVuZGVmaW5lZCAmJiB2ICE9PSBudWxsKSBvW2BfXyR7cH1gXSA9IHZcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkobywgcCwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXNbYF9fJHtwfWBdXG4gICAgICAgIH0uYmluZChvKSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbih2KSB7XG4gICAgICAgICAgICB0aGlzW2BfXyR7cH1gXSA9IHY7XG4gICAgICAgICAgICBpZiAoY2IpIGNiKHYpXG4gICAgICAgIH0uYmluZChvKVxuICAgIH0pXG59XG4iLCJsZXQgaHRtbCA9IGA8ZGl2IGNsYXNzPVwibmctc2NvcGVcIj5cbiAgICA8Zm9ybSBuYW1lPVwicm9sZUNyZWF0ZU9yRWRpdEZvcm1cIiByb2xlPVwiZm9ybVwiIG5vdmFsaWRhdGU9XCJcIiBjbGFzcz1cImZvcm0tdmFsaWRhdGlvbiBuZy1wcmlzdGluZSBuZy12YWxpZC1tYXhsZW5ndGggbmctdmFsaWQgbmctdmFsaWQtcmVxdWlyZWRcIj5cbiAgICAgICAgPGRpdiBjbGFzcz1cIm1vZGFsLWhlYWRlclwiPlxuICAgICAgICAgICAgPGg0IGNsYXNzPVwibW9kYWwtdGl0bGVcIj5cbiAgICAgICAgICAgICAgICA8IS0tIG5nSWY6IHZtLnJvbGUuaWQgLS0+PHNwYW4gbmctaWY9XCJ2bS5yb2xlLmlkXCIgY2xhc3M9XCJuZy1iaW5kaW5nIG5nLXNjb3BlXCI+RWRpdCByb2xlOiBBZG1pbjwvc3Bhbj48IS0tIGVuZCBuZ0lmOiB2bS5yb2xlLmlkIC0tPlxuICAgICAgICAgICAgICAgIDwhLS0gbmdJZjogIXZtLnJvbGUuaWQgLS0+XG4gICAgICAgICAgICA8L2g0PlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzcz1cIm1vZGFsLWJvZHlcIj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJ0YWItY29udGFpbmVyIHRhYmJhYmxlLWxpbmUgbmctaXNvbGF0ZS1zY29wZVwiPlxuICA8dWwgY2xhc3M9XCJuYXYgbmF2LXRhYnNcIiBuZy1jbGFzcz1cInsnbmF2LXN0YWNrZWQnOiB2ZXJ0aWNhbCwgJ25hdi1qdXN0aWZpZWQnOiBqdXN0aWZpZWR9XCIgbmctdHJhbnNjbHVkZT1cIlwiPlxuICAgICAgICAgICAgICAgIDxsaSBuZy1jbGFzcz1cIlt7YWN0aXZlOiBhY3RpdmUsIGRpc2FibGVkOiBkaXNhYmxlZH0sIGNsYXNzZXNdXCIgY2xhc3M9XCJ1aWItdGFiIG5hdi1pdGVtIG5nLXNjb3BlIG5nLWlzb2xhdGUtc2NvcGUgYWN0aXZlXCIgaGVhZGluZz1cIlJvbGUgcHJvcGVydGllc1wiPlxuICA8YSBocmVmPVwiXCIgbmctY2xpY2s9XCJzZWxlY3QoJGV2ZW50KVwiIGNsYXNzPVwibmF2LWxpbmsgbmctYmluZGluZ1wiIHVpYi10YWItaGVhZGluZy10cmFuc2NsdWRlPVwiXCI+Um9sZSBwcm9wZXJ0aWVzPC9hPlxuPC9saT5cbiAgICAgICAgICAgICAgICA8bGkgbmctY2xhc3M9XCJbe2FjdGl2ZTogYWN0aXZlLCBkaXNhYmxlZDogZGlzYWJsZWR9LCBjbGFzc2VzXVwiIGNsYXNzPVwidWliLXRhYiBuYXYtaXRlbSBuZy1zY29wZSBuZy1pc29sYXRlLXNjb3BlXCIgaGVhZGluZz1cIlBlcm1pc3Npb25zXCI+XG4gIDxhIGhyZWY9XCJcIiBuZy1jbGljaz1cInNlbGVjdCgkZXZlbnQpXCIgY2xhc3M9XCJuYXYtbGluayBuZy1iaW5kaW5nXCIgdWliLXRhYi1oZWFkaW5nLXRyYW5zY2x1ZGU9XCJcIj5QZXJtaXNzaW9uczwvYT5cbjwvbGk+XG4gICAgICAgICAgICA8L3VsPlxuICA8ZGl2IGNsYXNzPVwidGFiLWNvbnRlbnRcIj5cbiAgICA8IS0tIG5nUmVwZWF0OiB0YWIgaW4gdGFic2V0LnRhYnMgLS0+PGRpdiBjbGFzcz1cInRhYi1wYW5lIG5nLXNjb3BlIGFjdGl2ZVwiIG5nLXJlcGVhdD1cInRhYiBpbiB0YWJzZXQudGFic1wiIG5nLWNsYXNzPVwie2FjdGl2ZTogdGFic2V0LmFjdGl2ZSA9PT0gdGFiLmluZGV4fVwiIHVpYi10YWItY29udGVudC10cmFuc2NsdWRlPVwidGFiXCI+XG5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImZvcm0tZ3JvdXAgZm9ybS1tZC1saW5lLWlucHV0IGZvcm0tbWQtZmxvYXRpbmctbGFiZWwgbm8taGludCBuZy1zY29wZVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGlucHV0IGNsYXNzPVwiZm9ybS1jb250cm9sIG5nLXByaXN0aW5lIG5nLXVudG91Y2hlZCBuZy12YWxpZC1tYXhsZW5ndGggbmctbm90LWVtcHR5IG5nLXZhbGlkIG5nLXZhbGlkLXJlcXVpcmVkIGVkaXRlZFwiIHR5cGU9XCJ0ZXh0XCIgbmFtZT1cIlJvbGVEaXNwbGF5TmFtZVwiIG5nLWNsYXNzPVwieydlZGl0ZWQnOnZtLnJvbGUuZGlzcGxheU5hbWV9XCIgbmctbW9kZWw9XCJ2bS5yb2xlLmRpc3BsYXlOYW1lXCIgcmVxdWlyZWQ9XCJcIiBtYXhsZW5ndGg9XCI2NFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGxhYmVsPlJvbGUgbmFtZTwvbGFiZWw+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwibWQtY2hlY2tib3gtbGlzdCBuZy1zY29wZVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cIm1kLWNoZWNrYm94XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGlucHV0IGlkPVwiRWRpdFJvbGVfSXNEZWZhdWx0XCIgY2xhc3M9XCJtZC1jaGVjayBuZy1wcmlzdGluZSBuZy11bnRvdWNoZWQgbmctdmFsaWQgbmctZW1wdHlcIiB0eXBlPVwiY2hlY2tib3hcIiBuYW1lPVwiSXNEZWZhdWx0XCIgbmctbW9kZWw9XCJ2bS5yb2xlLmlzRGVmYXVsdFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxsYWJlbCBmb3I9XCJFZGl0Um9sZV9Jc0RlZmF1bHRcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJpbmNcIj48L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwiY2hlY2tcIj48L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwiYm94XCI+PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBEZWZhdWx0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9sYWJlbD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cImhlbHAtYmxvY2tcIj5Bc3NpZ24gdG8gbmV3IHVzZXJzIGFzIGRlZmF1bHQuPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDwvZGl2PjwhLS0gZW5kIG5nUmVwZWF0OiB0YWIgaW4gdGFic2V0LnRhYnMgLS0+PGRpdiBjbGFzcz1cInRhYi1wYW5lIG5nLXNjb3BlXCIgbmctcmVwZWF0PVwidGFiIGluIHRhYnNldC50YWJzXCIgbmctY2xhc3M9XCJ7YWN0aXZlOiB0YWJzZXQuYWN0aXZlID09PSB0YWIuaW5kZXh9XCIgdWliLXRhYi1jb250ZW50LXRyYW5zY2x1ZGU9XCJ0YWJcIj5cblxuICAgICAgICAgICAgICAgICAgICA8cGVybWlzc2lvbi10cmVlIGVkaXQtZGF0YT1cInZtLnBlcm1pc3Npb25FZGl0RGF0YVwiIGNsYXNzPVwibmctc2NvcGUgbmctaXNvbGF0ZS1zY29wZVwiPjxkaXYgY2xhc3M9XCJwZXJtaXNzaW9uLXRyZWUganN0cmVlIGpzdHJlZS0yIGpzdHJlZS1kZWZhdWx0IGpzdHJlZS1jaGVja2JveC1uby1jbGlja2VkIGpzdHJlZS1jaGVja2JveC1zZWxlY3Rpb25cIiByb2xlPVwidHJlZVwiIGFyaWEtbXVsdGlzZWxlY3RhYmxlPVwidHJ1ZVwiIHRhYmluZGV4PVwiMFwiIGFyaWEtYWN0aXZlZGVzY2VuZGFudD1cIlBhZ2VzXCIgYXJpYS1idXN5PVwiZmFsc2VcIj48dWwgY2xhc3M9XCJqc3RyZWUtY29udGFpbmVyLXVsIGpzdHJlZS1jaGlsZHJlblwiIHJvbGU9XCJncm91cFwiPjxsaSByb2xlPVwidHJlZWl0ZW1cIiBhcmlhLXNlbGVjdGVkPVwidHJ1ZVwiIGFyaWEtbGV2ZWw9XCIxXCIgYXJpYS1sYWJlbGxlZGJ5PVwiUGFnZXNfYW5jaG9yXCIgYXJpYS1leHBhbmRlZD1cInRydWVcIiBpZD1cIlBhZ2VzXCIgY2xhc3M9XCJqc3RyZWUtbm9kZSAganN0cmVlLW9wZW4ganN0cmVlLWxhc3RcIj48aSBjbGFzcz1cImpzdHJlZS1pY29uIGpzdHJlZS1vY2xcIiByb2xlPVwicHJlc2VudGF0aW9uXCI+PC9pPjxhIGNsYXNzPVwianN0cmVlLWFuY2hvciAganN0cmVlLWNsaWNrZWRcIiBocmVmPVwiI1wiIHRhYmluZGV4PVwiLTFcIiBpZD1cIlBhZ2VzX2FuY2hvclwiPjxpIGNsYXNzPVwianN0cmVlLWljb24ganN0cmVlLWNoZWNrYm94XCIgcm9sZT1cInByZXNlbnRhdGlvblwiPjwvaT48aSBjbGFzcz1cImpzdHJlZS1pY29uIGpzdHJlZS10aGVtZWljb24gZmEgZmEtZm9sZGVyIHRyZWUtaXRlbS1pY29uLWNvbG9yIGljb24tbGcganN0cmVlLXRoZW1laWNvbi1jdXN0b21cIiByb2xlPVwicHJlc2VudGF0aW9uXCI+PC9pPlBhZ2VzPC9hPjx1bCByb2xlPVwiZ3JvdXBcIiBjbGFzcz1cImpzdHJlZS1jaGlsZHJlblwiPjxsaSByb2xlPVwidHJlZWl0ZW1cIiBhcmlhLXNlbGVjdGVkPVwidHJ1ZVwiIGFyaWEtbGV2ZWw9XCIyXCIgYXJpYS1sYWJlbGxlZGJ5PVwiUGFnZXMuQWRtaW5pc3RyYXRpb25fYW5jaG9yXCIgYXJpYS1leHBhbmRlZD1cInRydWVcIiBpZD1cIlBhZ2VzLkFkbWluaXN0cmF0aW9uXCIgY2xhc3M9XCJqc3RyZWUtbm9kZSAganN0cmVlLW9wZW5cIj48aSBjbGFzcz1cImpzdHJlZS1pY29uIGpzdHJlZS1vY2xcIiByb2xlPVwicHJlc2VudGF0aW9uXCI+PC9pPjxhIGNsYXNzPVwianN0cmVlLWFuY2hvciAganN0cmVlLWNsaWNrZWRcIiBocmVmPVwiI1wiIHRhYmluZGV4PVwiLTFcIiBpZD1cIlBhZ2VzLkFkbWluaXN0cmF0aW9uX2FuY2hvclwiPjxpIGNsYXNzPVwianN0cmVlLWljb24ganN0cmVlLWNoZWNrYm94XCIgcm9sZT1cInByZXNlbnRhdGlvblwiPjwvaT48aSBjbGFzcz1cImpzdHJlZS1pY29uIGpzdHJlZS10aGVtZWljb24gZmEgZmEtZm9sZGVyIHRyZWUtaXRlbS1pY29uLWNvbG9yIGljb24tbGcganN0cmVlLXRoZW1laWNvbi1jdXN0b21cIiByb2xlPVwicHJlc2VudGF0aW9uXCI+PC9pPkFkbWluaXN0cmF0aW9uPC9hPjx1bCByb2xlPVwiZ3JvdXBcIiBjbGFzcz1cImpzdHJlZS1jaGlsZHJlblwiPjxsaSByb2xlPVwidHJlZWl0ZW1cIiBhcmlhLXNlbGVjdGVkPVwidHJ1ZVwiIGFyaWEtbGV2ZWw9XCIzXCIgYXJpYS1sYWJlbGxlZGJ5PVwiUGFnZXMuQWRtaW5pc3RyYXRpb24uQXVkaXRMb2dzX2FuY2hvclwiIGlkPVwiUGFnZXMuQWRtaW5pc3RyYXRpb24uQXVkaXRMb2dzXCIgY2xhc3M9XCJqc3RyZWUtbm9kZSAganN0cmVlLWxlYWZcIj48aSBjbGFzcz1cImpzdHJlZS1pY29uIGpzdHJlZS1vY2xcIiByb2xlPVwicHJlc2VudGF0aW9uXCI+PC9pPjxhIGNsYXNzPVwianN0cmVlLWFuY2hvciAganN0cmVlLWNsaWNrZWRcIiBocmVmPVwiI1wiIHRhYmluZGV4PVwiLTFcIiBpZD1cIlBhZ2VzLkFkbWluaXN0cmF0aW9uLkF1ZGl0TG9nc19hbmNob3JcIj48aSBjbGFzcz1cImpzdHJlZS1pY29uIGpzdHJlZS1jaGVja2JveFwiIHJvbGU9XCJwcmVzZW50YXRpb25cIj48L2k+PGkgY2xhc3M9XCJqc3RyZWUtaWNvbiBqc3RyZWUtdGhlbWVpY29uIGZhIGZhLWZvbGRlciB0cmVlLWl0ZW0taWNvbi1jb2xvciBpY29uLWxnIGpzdHJlZS10aGVtZWljb24tY3VzdG9tXCIgcm9sZT1cInByZXNlbnRhdGlvblwiPjwvaT5BdWRpdCBsb2dzPC9hPjwvbGk+PGxpIHJvbGU9XCJ0cmVlaXRlbVwiIGFyaWEtc2VsZWN0ZWQ9XCJ0cnVlXCIgYXJpYS1sZXZlbD1cIjNcIiBhcmlhLWxhYmVsbGVkYnk9XCJQYWdlcy5BZG1pbmlzdHJhdGlvbi5MYW5ndWFnZXNfYW5jaG9yXCIgYXJpYS1leHBhbmRlZD1cInRydWVcIiBpZD1cIlBhZ2VzLkFkbWluaXN0cmF0aW9uLkxhbmd1YWdlc1wiIGNsYXNzPVwianN0cmVlLW5vZGUgIGpzdHJlZS1vcGVuXCI+PGkgY2xhc3M9XCJqc3RyZWUtaWNvbiBqc3RyZWUtb2NsXCIgcm9sZT1cInByZXNlbnRhdGlvblwiPjwvaT48YSBjbGFzcz1cImpzdHJlZS1hbmNob3IgIGpzdHJlZS1jbGlja2VkXCIgaHJlZj1cIiNcIiB0YWJpbmRleD1cIi0xXCIgaWQ9XCJQYWdlcy5BZG1pbmlzdHJhdGlvbi5MYW5ndWFnZXNfYW5jaG9yXCI+PGkgY2xhc3M9XCJqc3RyZWUtaWNvbiBqc3RyZWUtY2hlY2tib3hcIiByb2xlPVwicHJlc2VudGF0aW9uXCI+PC9pPjxpIGNsYXNzPVwianN0cmVlLWljb24ganN0cmVlLXRoZW1laWNvbiBmYSBmYS1mb2xkZXIgdHJlZS1pdGVtLWljb24tY29sb3IgaWNvbi1sZyBqc3RyZWUtdGhlbWVpY29uLWN1c3RvbVwiIHJvbGU9XCJwcmVzZW50YXRpb25cIj48L2k+TGFuZ3VhZ2VzPC9hPjx1bCByb2xlPVwiZ3JvdXBcIiBjbGFzcz1cImpzdHJlZS1jaGlsZHJlblwiPjxsaSByb2xlPVwidHJlZWl0ZW1cIiBhcmlhLXNlbGVjdGVkPVwidHJ1ZVwiIGFyaWEtbGV2ZWw9XCI0XCIgYXJpYS1sYWJlbGxlZGJ5PVwiUGFnZXMuQWRtaW5pc3RyYXRpb24uTGFuZ3VhZ2VzLkNoYW5nZVRleHRzX2FuY2hvclwiIGlkPVwiUGFnZXMuQWRtaW5pc3RyYXRpb24uTGFuZ3VhZ2VzLkNoYW5nZVRleHRzXCIgY2xhc3M9XCJqc3RyZWUtbm9kZSAganN0cmVlLWxlYWZcIj48aSBjbGFzcz1cImpzdHJlZS1pY29uIGpzdHJlZS1vY2xcIiByb2xlPVwicHJlc2VudGF0aW9uXCI+PC9pPjxhIGNsYXNzPVwianN0cmVlLWFuY2hvciAganN0cmVlLWNsaWNrZWRcIiBocmVmPVwiI1wiIHRhYmluZGV4PVwiLTFcIiBpZD1cIlBhZ2VzLkFkbWluaXN0cmF0aW9uLkxhbmd1YWdlcy5DaGFuZ2VUZXh0c19hbmNob3JcIj48aSBjbGFzcz1cImpzdHJlZS1pY29uIGpzdHJlZS1jaGVja2JveFwiIHJvbGU9XCJwcmVzZW50YXRpb25cIj48L2k+PGkgY2xhc3M9XCJqc3RyZWUtaWNvbiBqc3RyZWUtdGhlbWVpY29uIGZhIGZhLWZvbGRlciB0cmVlLWl0ZW0taWNvbi1jb2xvciBpY29uLWxnIGpzdHJlZS10aGVtZWljb24tY3VzdG9tXCIgcm9sZT1cInByZXNlbnRhdGlvblwiPjwvaT5DaGFuZ2luZyB0ZXh0czwvYT48L2xpPjxsaSByb2xlPVwidHJlZWl0ZW1cIiBhcmlhLXNlbGVjdGVkPVwidHJ1ZVwiIGFyaWEtbGV2ZWw9XCI0XCIgYXJpYS1sYWJlbGxlZGJ5PVwiUGFnZXMuQWRtaW5pc3RyYXRpb24uTGFuZ3VhZ2VzLkNyZWF0ZV9hbmNob3JcIiBpZD1cIlBhZ2VzLkFkbWluaXN0cmF0aW9uLkxhbmd1YWdlcy5DcmVhdGVcIiBjbGFzcz1cImpzdHJlZS1ub2RlICBqc3RyZWUtbGVhZlwiPjxpIGNsYXNzPVwianN0cmVlLWljb24ganN0cmVlLW9jbFwiIHJvbGU9XCJwcmVzZW50YXRpb25cIj48L2k+PGEgY2xhc3M9XCJqc3RyZWUtYW5jaG9yICBqc3RyZWUtY2xpY2tlZFwiIGhyZWY9XCIjXCIgdGFiaW5kZXg9XCItMVwiIGlkPVwiUGFnZXMuQWRtaW5pc3RyYXRpb24uTGFuZ3VhZ2VzLkNyZWF0ZV9hbmNob3JcIj48aSBjbGFzcz1cImpzdHJlZS1pY29uIGpzdHJlZS1jaGVja2JveFwiIHJvbGU9XCJwcmVzZW50YXRpb25cIj48L2k+PGkgY2xhc3M9XCJqc3RyZWUtaWNvbiBqc3RyZWUtdGhlbWVpY29uIGZhIGZhLWZvbGRlciB0cmVlLWl0ZW0taWNvbi1jb2xvciBpY29uLWxnIGpzdHJlZS10aGVtZWljb24tY3VzdG9tXCIgcm9sZT1cInByZXNlbnRhdGlvblwiPjwvaT5DcmVhdGluZyBuZXcgbGFuZ3VhZ2U8L2E+PC9saT48bGkgcm9sZT1cInRyZWVpdGVtXCIgYXJpYS1zZWxlY3RlZD1cInRydWVcIiBhcmlhLWxldmVsPVwiNFwiIGFyaWEtbGFiZWxsZWRieT1cIlBhZ2VzLkFkbWluaXN0cmF0aW9uLkxhbmd1YWdlcy5EZWxldGVfYW5jaG9yXCIgaWQ9XCJQYWdlcy5BZG1pbmlzdHJhdGlvbi5MYW5ndWFnZXMuRGVsZXRlXCIgY2xhc3M9XCJqc3RyZWUtbm9kZSAganN0cmVlLWxlYWZcIj48aSBjbGFzcz1cImpzdHJlZS1pY29uIGpzdHJlZS1vY2xcIiByb2xlPVwicHJlc2VudGF0aW9uXCI+PC9pPjxhIGNsYXNzPVwianN0cmVlLWFuY2hvciAganN0cmVlLWNsaWNrZWRcIiBocmVmPVwiI1wiIHRhYmluZGV4PVwiLTFcIiBpZD1cIlBhZ2VzLkFkbWluaXN0cmF0aW9uLkxhbmd1YWdlcy5EZWxldGVfYW5jaG9yXCI+PGkgY2xhc3M9XCJqc3RyZWUtaWNvbiBqc3RyZWUtY2hlY2tib3hcIiByb2xlPVwicHJlc2VudGF0aW9uXCI+PC9pPjxpIGNsYXNzPVwianN0cmVlLWljb24ganN0cmVlLXRoZW1laWNvbiBmYSBmYS1mb2xkZXIgdHJlZS1pdGVtLWljb24tY29sb3IgaWNvbi1sZyBqc3RyZWUtdGhlbWVpY29uLWN1c3RvbVwiIHJvbGU9XCJwcmVzZW50YXRpb25cIj48L2k+RGVsZXRpbmcgbGFuZ3VhZ2U8L2E+PC9saT48bGkgcm9sZT1cInRyZWVpdGVtXCIgYXJpYS1zZWxlY3RlZD1cInRydWVcIiBhcmlhLWxldmVsPVwiNFwiIGFyaWEtbGFiZWxsZWRieT1cIlBhZ2VzLkFkbWluaXN0cmF0aW9uLkxhbmd1YWdlcy5FZGl0X2FuY2hvclwiIGlkPVwiUGFnZXMuQWRtaW5pc3RyYXRpb24uTGFuZ3VhZ2VzLkVkaXRcIiBjbGFzcz1cImpzdHJlZS1ub2RlICBqc3RyZWUtbGVhZiBqc3RyZWUtbGFzdFwiPjxpIGNsYXNzPVwianN0cmVlLWljb24ganN0cmVlLW9jbFwiIHJvbGU9XCJwcmVzZW50YXRpb25cIj48L2k+PGEgY2xhc3M9XCJqc3RyZWUtYW5jaG9yICBqc3RyZWUtY2xpY2tlZFwiIGhyZWY9XCIjXCIgdGFiaW5kZXg9XCItMVwiIGlkPVwiUGFnZXMuQWRtaW5pc3RyYXRpb24uTGFuZ3VhZ2VzLkVkaXRfYW5jaG9yXCI+PGkgY2xhc3M9XCJqc3RyZWUtaWNvbiBqc3RyZWUtY2hlY2tib3hcIiByb2xlPVwicHJlc2VudGF0aW9uXCI+PC9pPjxpIGNsYXNzPVwianN0cmVlLWljb24ganN0cmVlLXRoZW1laWNvbiBmYSBmYS1mb2xkZXIgdHJlZS1pdGVtLWljb24tY29sb3IgaWNvbi1sZyBqc3RyZWUtdGhlbWVpY29uLWN1c3RvbVwiIHJvbGU9XCJwcmVzZW50YXRpb25cIj48L2k+RWRpdGluZyBsYW5ndWFnZTwvYT48L2xpPjwvdWw+PC9saT48bGkgcm9sZT1cInRyZWVpdGVtXCIgYXJpYS1zZWxlY3RlZD1cInRydWVcIiBhcmlhLWxldmVsPVwiM1wiIGFyaWEtbGFiZWxsZWRieT1cIlBhZ2VzLkFkbWluaXN0cmF0aW9uLk9yZ2FuaXphdGlvblVuaXRzX2FuY2hvclwiIGFyaWEtZXhwYW5kZWQ9XCJ0cnVlXCIgaWQ9XCJQYWdlcy5BZG1pbmlzdHJhdGlvbi5Pcmdhbml6YXRpb25Vbml0c1wiIGNsYXNzPVwianN0cmVlLW5vZGUgIGpzdHJlZS1vcGVuXCI+PGkgY2xhc3M9XCJqc3RyZWUtaWNvbiBqc3RyZWUtb2NsXCIgcm9sZT1cInByZXNlbnRhdGlvblwiPjwvaT48YSBjbGFzcz1cImpzdHJlZS1hbmNob3IgIGpzdHJlZS1jbGlja2VkXCIgaHJlZj1cIiNcIiB0YWJpbmRleD1cIi0xXCIgaWQ9XCJQYWdlcy5BZG1pbmlzdHJhdGlvbi5Pcmdhbml6YXRpb25Vbml0c19hbmNob3JcIj48aSBjbGFzcz1cImpzdHJlZS1pY29uIGpzdHJlZS1jaGVja2JveFwiIHJvbGU9XCJwcmVzZW50YXRpb25cIj48L2k+PGkgY2xhc3M9XCJqc3RyZWUtaWNvbiBqc3RyZWUtdGhlbWVpY29uIGZhIGZhLWZvbGRlciB0cmVlLWl0ZW0taWNvbi1jb2xvciBpY29uLWxnIGpzdHJlZS10aGVtZWljb24tY3VzdG9tXCIgcm9sZT1cInByZXNlbnRhdGlvblwiPjwvaT5Pcmdhbml6YXRpb24gdW5pdHM8L2E+PHVsIHJvbGU9XCJncm91cFwiIGNsYXNzPVwianN0cmVlLWNoaWxkcmVuXCI+PGxpIHJvbGU9XCJ0cmVlaXRlbVwiIGFyaWEtc2VsZWN0ZWQ9XCJ0cnVlXCIgYXJpYS1sZXZlbD1cIjRcIiBhcmlhLWxhYmVsbGVkYnk9XCJQYWdlcy5BZG1pbmlzdHJhdGlvbi5Pcmdhbml6YXRpb25Vbml0cy5NYW5hZ2VNZW1iZXJzX2FuY2hvclwiIGlkPVwiUGFnZXMuQWRtaW5pc3RyYXRpb24uT3JnYW5pemF0aW9uVW5pdHMuTWFuYWdlTWVtYmVyc1wiIGNsYXNzPVwianN0cmVlLW5vZGUgIGpzdHJlZS1sZWFmXCI+PGkgY2xhc3M9XCJqc3RyZWUtaWNvbiBqc3RyZWUtb2NsXCIgcm9sZT1cInByZXNlbnRhdGlvblwiPjwvaT48YSBjbGFzcz1cImpzdHJlZS1hbmNob3IgIGpzdHJlZS1jbGlja2VkXCIgaHJlZj1cIiNcIiB0YWJpbmRleD1cIi0xXCIgaWQ9XCJQYWdlcy5BZG1pbmlzdHJhdGlvbi5Pcmdhbml6YXRpb25Vbml0cy5NYW5hZ2VNZW1iZXJzX2FuY2hvclwiPjxpIGNsYXNzPVwianN0cmVlLWljb24ganN0cmVlLWNoZWNrYm94XCIgcm9sZT1cInByZXNlbnRhdGlvblwiPjwvaT48aSBjbGFzcz1cImpzdHJlZS1pY29uIGpzdHJlZS10aGVtZWljb24gZmEgZmEtZm9sZGVyIHRyZWUtaXRlbS1pY29uLWNvbG9yIGljb24tbGcganN0cmVlLXRoZW1laWNvbi1jdXN0b21cIiByb2xlPVwicHJlc2VudGF0aW9uXCI+PC9pPk1hbmFnaW5nIG1lbWJlcnM8L2E+PC9saT48bGkgcm9sZT1cInRyZWVpdGVtXCIgYXJpYS1zZWxlY3RlZD1cInRydWVcIiBhcmlhLWxldmVsPVwiNFwiIGFyaWEtbGFiZWxsZWRieT1cIlBhZ2VzLkFkbWluaXN0cmF0aW9uLk9yZ2FuaXphdGlvblVuaXRzLk1hbmFnZU9yZ2FuaXphdGlvblRyZWVfYW5jaG9yXCIgaWQ9XCJQYWdlcy5BZG1pbmlzdHJhdGlvbi5Pcmdhbml6YXRpb25Vbml0cy5NYW5hZ2VPcmdhbml6YXRpb25UcmVlXCIgY2xhc3M9XCJqc3RyZWUtbm9kZSAganN0cmVlLWxlYWYganN0cmVlLWxhc3RcIj48aSBjbGFzcz1cImpzdHJlZS1pY29uIGpzdHJlZS1vY2xcIiByb2xlPVwicHJlc2VudGF0aW9uXCI+PC9pPjxhIGNsYXNzPVwianN0cmVlLWFuY2hvciAganN0cmVlLWNsaWNrZWRcIiBocmVmPVwiI1wiIHRhYmluZGV4PVwiLTFcIiBpZD1cIlBhZ2VzLkFkbWluaXN0cmF0aW9uLk9yZ2FuaXphdGlvblVuaXRzLk1hbmFnZU9yZ2FuaXphdGlvblRyZWVfYW5jaG9yXCI+PGkgY2xhc3M9XCJqc3RyZWUtaWNvbiBqc3RyZWUtY2hlY2tib3hcIiByb2xlPVwicHJlc2VudGF0aW9uXCI+PC9pPjxpIGNsYXNzPVwianN0cmVlLWljb24ganN0cmVlLXRoZW1laWNvbiBmYSBmYS1mb2xkZXIgdHJlZS1pdGVtLWljb24tY29sb3IgaWNvbi1sZyBqc3RyZWUtdGhlbWVpY29uLWN1c3RvbVwiIHJvbGU9XCJwcmVzZW50YXRpb25cIj48L2k+TWFuYWdpbmcgb3JnYW5pemF0aW9uIHRyZWU8L2E+PC9saT48L3VsPjwvbGk+PGxpIHJvbGU9XCJ0cmVlaXRlbVwiIGFyaWEtc2VsZWN0ZWQ9XCJ0cnVlXCIgYXJpYS1sZXZlbD1cIjNcIiBhcmlhLWxhYmVsbGVkYnk9XCJQYWdlcy5BZG1pbmlzdHJhdGlvbi5Sb2xlc19hbmNob3JcIiBhcmlhLWV4cGFuZGVkPVwidHJ1ZVwiIGlkPVwiUGFnZXMuQWRtaW5pc3RyYXRpb24uUm9sZXNcIiBjbGFzcz1cImpzdHJlZS1ub2RlICBqc3RyZWUtb3BlblwiPjxpIGNsYXNzPVwianN0cmVlLWljb24ganN0cmVlLW9jbFwiIHJvbGU9XCJwcmVzZW50YXRpb25cIj48L2k+PGEgY2xhc3M9XCJqc3RyZWUtYW5jaG9yICBqc3RyZWUtY2xpY2tlZFwiIGhyZWY9XCIjXCIgdGFiaW5kZXg9XCItMVwiIGlkPVwiUGFnZXMuQWRtaW5pc3RyYXRpb24uUm9sZXNfYW5jaG9yXCI+PGkgY2xhc3M9XCJqc3RyZWUtaWNvbiBqc3RyZWUtY2hlY2tib3hcIiByb2xlPVwicHJlc2VudGF0aW9uXCI+PC9pPjxpIGNsYXNzPVwianN0cmVlLWljb24ganN0cmVlLXRoZW1laWNvbiBmYSBmYS1mb2xkZXIgdHJlZS1pdGVtLWljb24tY29sb3IgaWNvbi1sZyBqc3RyZWUtdGhlbWVpY29uLWN1c3RvbVwiIHJvbGU9XCJwcmVzZW50YXRpb25cIj48L2k+Um9sZXM8L2E+PHVsIHJvbGU9XCJncm91cFwiIGNsYXNzPVwianN0cmVlLWNoaWxkcmVuXCI+PGxpIHJvbGU9XCJ0cmVlaXRlbVwiIGFyaWEtc2VsZWN0ZWQ9XCJ0cnVlXCIgYXJpYS1sZXZlbD1cIjRcIiBhcmlhLWxhYmVsbGVkYnk9XCJQYWdlcy5BZG1pbmlzdHJhdGlvbi5Sb2xlcy5DcmVhdGVfYW5jaG9yXCIgaWQ9XCJQYWdlcy5BZG1pbmlzdHJhdGlvbi5Sb2xlcy5DcmVhdGVcIiBjbGFzcz1cImpzdHJlZS1ub2RlICBqc3RyZWUtbGVhZlwiPjxpIGNsYXNzPVwianN0cmVlLWljb24ganN0cmVlLW9jbFwiIHJvbGU9XCJwcmVzZW50YXRpb25cIj48L2k+PGEgY2xhc3M9XCJqc3RyZWUtYW5jaG9yICBqc3RyZWUtY2xpY2tlZFwiIGhyZWY9XCIjXCIgdGFiaW5kZXg9XCItMVwiIGlkPVwiUGFnZXMuQWRtaW5pc3RyYXRpb24uUm9sZXMuQ3JlYXRlX2FuY2hvclwiPjxpIGNsYXNzPVwianN0cmVlLWljb24ganN0cmVlLWNoZWNrYm94XCIgcm9sZT1cInByZXNlbnRhdGlvblwiPjwvaT48aSBjbGFzcz1cImpzdHJlZS1pY29uIGpzdHJlZS10aGVtZWljb24gZmEgZmEtZm9sZGVyIHRyZWUtaXRlbS1pY29uLWNvbG9yIGljb24tbGcganN0cmVlLXRoZW1laWNvbi1jdXN0b21cIiByb2xlPVwicHJlc2VudGF0aW9uXCI+PC9pPkNyZWF0aW5nIG5ldyByb2xlPC9hPjwvbGk+PGxpIHJvbGU9XCJ0cmVlaXRlbVwiIGFyaWEtc2VsZWN0ZWQ9XCJ0cnVlXCIgYXJpYS1sZXZlbD1cIjRcIiBhcmlhLWxhYmVsbGVkYnk9XCJQYWdlcy5BZG1pbmlzdHJhdGlvbi5Sb2xlcy5EZWxldGVfYW5jaG9yXCIgaWQ9XCJQYWdlcy5BZG1pbmlzdHJhdGlvbi5Sb2xlcy5EZWxldGVcIiBjbGFzcz1cImpzdHJlZS1ub2RlICBqc3RyZWUtbGVhZlwiPjxpIGNsYXNzPVwianN0cmVlLWljb24ganN0cmVlLW9jbFwiIHJvbGU9XCJwcmVzZW50YXRpb25cIj48L2k+PGEgY2xhc3M9XCJqc3RyZWUtYW5jaG9yICBqc3RyZWUtY2xpY2tlZFwiIGhyZWY9XCIjXCIgdGFiaW5kZXg9XCItMVwiIGlkPVwiUGFnZXMuQWRtaW5pc3RyYXRpb24uUm9sZXMuRGVsZXRlX2FuY2hvclwiPjxpIGNsYXNzPVwianN0cmVlLWljb24ganN0cmVlLWNoZWNrYm94XCIgcm9sZT1cInByZXNlbnRhdGlvblwiPjwvaT48aSBjbGFzcz1cImpzdHJlZS1pY29uIGpzdHJlZS10aGVtZWljb24gZmEgZmEtZm9sZGVyIHRyZWUtaXRlbS1pY29uLWNvbG9yIGljb24tbGcganN0cmVlLXRoZW1laWNvbi1jdXN0b21cIiByb2xlPVwicHJlc2VudGF0aW9uXCI+PC9pPkRlbGV0aW5nIHJvbGU8L2E+PC9saT48bGkgcm9sZT1cInRyZWVpdGVtXCIgYXJpYS1zZWxlY3RlZD1cInRydWVcIiBhcmlhLWxldmVsPVwiNFwiIGFyaWEtbGFiZWxsZWRieT1cIlBhZ2VzLkFkbWluaXN0cmF0aW9uLlJvbGVzLkVkaXRfYW5jaG9yXCIgaWQ9XCJQYWdlcy5BZG1pbmlzdHJhdGlvbi5Sb2xlcy5FZGl0XCIgY2xhc3M9XCJqc3RyZWUtbm9kZSAganN0cmVlLWxlYWYganN0cmVlLWxhc3RcIj48aSBjbGFzcz1cImpzdHJlZS1pY29uIGpzdHJlZS1vY2xcIiByb2xlPVwicHJlc2VudGF0aW9uXCI+PC9pPjxhIGNsYXNzPVwianN0cmVlLWFuY2hvciAganN0cmVlLWNsaWNrZWRcIiBocmVmPVwiI1wiIHRhYmluZGV4PVwiLTFcIiBpZD1cIlBhZ2VzLkFkbWluaXN0cmF0aW9uLlJvbGVzLkVkaXRfYW5jaG9yXCI+PGkgY2xhc3M9XCJqc3RyZWUtaWNvbiBqc3RyZWUtY2hlY2tib3hcIiByb2xlPVwicHJlc2VudGF0aW9uXCI+PC9pPjxpIGNsYXNzPVwianN0cmVlLWljb24ganN0cmVlLXRoZW1laWNvbiBmYSBmYS1mb2xkZXIgdHJlZS1pdGVtLWljb24tY29sb3IgaWNvbi1sZyBqc3RyZWUtdGhlbWVpY29uLWN1c3RvbVwiIHJvbGU9XCJwcmVzZW50YXRpb25cIj48L2k+RWRpdGluZyByb2xlPC9hPjwvbGk+PC91bD48L2xpPjxsaSByb2xlPVwidHJlZWl0ZW1cIiBhcmlhLXNlbGVjdGVkPVwidHJ1ZVwiIGFyaWEtbGV2ZWw9XCIzXCIgYXJpYS1sYWJlbGxlZGJ5PVwiUGFnZXMuQWRtaW5pc3RyYXRpb24uVGVuYW50LlNldHRpbmdzX2FuY2hvclwiIGlkPVwiUGFnZXMuQWRtaW5pc3RyYXRpb24uVGVuYW50LlNldHRpbmdzXCIgY2xhc3M9XCJqc3RyZWUtbm9kZSAganN0cmVlLWxlYWZcIj48aSBjbGFzcz1cImpzdHJlZS1pY29uIGpzdHJlZS1vY2xcIiByb2xlPVwicHJlc2VudGF0aW9uXCI+PC9pPjxhIGNsYXNzPVwianN0cmVlLWFuY2hvciAganN0cmVlLWNsaWNrZWRcIiBocmVmPVwiI1wiIHRhYmluZGV4PVwiLTFcIiBpZD1cIlBhZ2VzLkFkbWluaXN0cmF0aW9uLlRlbmFudC5TZXR0aW5nc19hbmNob3JcIj48aSBjbGFzcz1cImpzdHJlZS1pY29uIGpzdHJlZS1jaGVja2JveFwiIHJvbGU9XCJwcmVzZW50YXRpb25cIj48L2k+PGkgY2xhc3M9XCJqc3RyZWUtaWNvbiBqc3RyZWUtdGhlbWVpY29uIGZhIGZhLWZvbGRlciB0cmVlLWl0ZW0taWNvbi1jb2xvciBpY29uLWxnIGpzdHJlZS10aGVtZWljb24tY3VzdG9tXCIgcm9sZT1cInByZXNlbnRhdGlvblwiPjwvaT5TZXR0aW5nczwvYT48L2xpPjxsaSByb2xlPVwidHJlZWl0ZW1cIiBhcmlhLXNlbGVjdGVkPVwidHJ1ZVwiIGFyaWEtbGV2ZWw9XCIzXCIgYXJpYS1sYWJlbGxlZGJ5PVwiUGFnZXMuQWRtaW5pc3RyYXRpb24uVXNlcnNfYW5jaG9yXCIgYXJpYS1leHBhbmRlZD1cInRydWVcIiBpZD1cIlBhZ2VzLkFkbWluaXN0cmF0aW9uLlVzZXJzXCIgY2xhc3M9XCJqc3RyZWUtbm9kZSAganN0cmVlLW9wZW4ganN0cmVlLWxhc3RcIj48aSBjbGFzcz1cImpzdHJlZS1pY29uIGpzdHJlZS1vY2xcIiByb2xlPVwicHJlc2VudGF0aW9uXCI+PC9pPjxhIGNsYXNzPVwianN0cmVlLWFuY2hvciAganN0cmVlLWNsaWNrZWRcIiBocmVmPVwiI1wiIHRhYmluZGV4PVwiLTFcIiBpZD1cIlBhZ2VzLkFkbWluaXN0cmF0aW9uLlVzZXJzX2FuY2hvclwiPjxpIGNsYXNzPVwianN0cmVlLWljb24ganN0cmVlLWNoZWNrYm94XCIgcm9sZT1cInByZXNlbnRhdGlvblwiPjwvaT48aSBjbGFzcz1cImpzdHJlZS1pY29uIGpzdHJlZS10aGVtZWljb24gZmEgZmEtZm9sZGVyIHRyZWUtaXRlbS1pY29uLWNvbG9yIGljb24tbGcganN0cmVlLXRoZW1laWNvbi1jdXN0b21cIiByb2xlPVwicHJlc2VudGF0aW9uXCI+PC9pPlVzZXJzPC9hPjx1bCByb2xlPVwiZ3JvdXBcIiBjbGFzcz1cImpzdHJlZS1jaGlsZHJlblwiPjxsaSByb2xlPVwidHJlZWl0ZW1cIiBhcmlhLXNlbGVjdGVkPVwidHJ1ZVwiIGFyaWEtbGV2ZWw9XCI0XCIgYXJpYS1sYWJlbGxlZGJ5PVwiUGFnZXMuQWRtaW5pc3RyYXRpb24uVXNlcnMuQ2hhbmdlUGVybWlzc2lvbnNfYW5jaG9yXCIgaWQ9XCJQYWdlcy5BZG1pbmlzdHJhdGlvbi5Vc2Vycy5DaGFuZ2VQZXJtaXNzaW9uc1wiIGNsYXNzPVwianN0cmVlLW5vZGUgIGpzdHJlZS1sZWFmXCI+PGkgY2xhc3M9XCJqc3RyZWUtaWNvbiBqc3RyZWUtb2NsXCIgcm9sZT1cInByZXNlbnRhdGlvblwiPjwvaT48YSBjbGFzcz1cImpzdHJlZS1hbmNob3IgIGpzdHJlZS1jbGlja2VkXCIgaHJlZj1cIiNcIiB0YWJpbmRleD1cIi0xXCIgaWQ9XCJQYWdlcy5BZG1pbmlzdHJhdGlvbi5Vc2Vycy5DaGFuZ2VQZXJtaXNzaW9uc19hbmNob3JcIj48aSBjbGFzcz1cImpzdHJlZS1pY29uIGpzdHJlZS1jaGVja2JveFwiIHJvbGU9XCJwcmVzZW50YXRpb25cIj48L2k+PGkgY2xhc3M9XCJqc3RyZWUtaWNvbiBqc3RyZWUtdGhlbWVpY29uIGZhIGZhLWZvbGRlciB0cmVlLWl0ZW0taWNvbi1jb2xvciBpY29uLWxnIGpzdHJlZS10aGVtZWljb24tY3VzdG9tXCIgcm9sZT1cInByZXNlbnRhdGlvblwiPjwvaT5DaGFuZ2luZyBwZXJtaXNzaW9uczwvYT48L2xpPjxsaSByb2xlPVwidHJlZWl0ZW1cIiBhcmlhLXNlbGVjdGVkPVwidHJ1ZVwiIGFyaWEtbGV2ZWw9XCI0XCIgYXJpYS1sYWJlbGxlZGJ5PVwiUGFnZXMuQWRtaW5pc3RyYXRpb24uVXNlcnMuQ3JlYXRlX2FuY2hvclwiIGlkPVwiUGFnZXMuQWRtaW5pc3RyYXRpb24uVXNlcnMuQ3JlYXRlXCIgY2xhc3M9XCJqc3RyZWUtbm9kZSAganN0cmVlLWxlYWZcIj48aSBjbGFzcz1cImpzdHJlZS1pY29uIGpzdHJlZS1vY2xcIiByb2xlPVwicHJlc2VudGF0aW9uXCI+PC9pPjxhIGNsYXNzPVwianN0cmVlLWFuY2hvciAganN0cmVlLWNsaWNrZWRcIiBocmVmPVwiI1wiIHRhYmluZGV4PVwiLTFcIiBpZD1cIlBhZ2VzLkFkbWluaXN0cmF0aW9uLlVzZXJzLkNyZWF0ZV9hbmNob3JcIj48aSBjbGFzcz1cImpzdHJlZS1pY29uIGpzdHJlZS1jaGVja2JveFwiIHJvbGU9XCJwcmVzZW50YXRpb25cIj48L2k+PGkgY2xhc3M9XCJqc3RyZWUtaWNvbiBqc3RyZWUtdGhlbWVpY29uIGZhIGZhLWZvbGRlciB0cmVlLWl0ZW0taWNvbi1jb2xvciBpY29uLWxnIGpzdHJlZS10aGVtZWljb24tY3VzdG9tXCIgcm9sZT1cInByZXNlbnRhdGlvblwiPjwvaT5DcmVhdGluZyBuZXcgdXNlcjwvYT48L2xpPjxsaSByb2xlPVwidHJlZWl0ZW1cIiBhcmlhLXNlbGVjdGVkPVwidHJ1ZVwiIGFyaWEtbGV2ZWw9XCI0XCIgYXJpYS1sYWJlbGxlZGJ5PVwiUGFnZXMuQWRtaW5pc3RyYXRpb24uVXNlcnMuRGVsZXRlX2FuY2hvclwiIGlkPVwiUGFnZXMuQWRtaW5pc3RyYXRpb24uVXNlcnMuRGVsZXRlXCIgY2xhc3M9XCJqc3RyZWUtbm9kZSAganN0cmVlLWxlYWZcIj48aSBjbGFzcz1cImpzdHJlZS1pY29uIGpzdHJlZS1vY2xcIiByb2xlPVwicHJlc2VudGF0aW9uXCI+PC9pPjxhIGNsYXNzPVwianN0cmVlLWFuY2hvciAganN0cmVlLWNsaWNrZWRcIiBocmVmPVwiI1wiIHRhYmluZGV4PVwiLTFcIiBpZD1cIlBhZ2VzLkFkbWluaXN0cmF0aW9uLlVzZXJzLkRlbGV0ZV9hbmNob3JcIj48aSBjbGFzcz1cImpzdHJlZS1pY29uIGpzdHJlZS1jaGVja2JveFwiIHJvbGU9XCJwcmVzZW50YXRpb25cIj48L2k+PGkgY2xhc3M9XCJqc3RyZWUtaWNvbiBqc3RyZWUtdGhlbWVpY29uIGZhIGZhLWZvbGRlciB0cmVlLWl0ZW0taWNvbi1jb2xvciBpY29uLWxnIGpzdHJlZS10aGVtZWljb24tY3VzdG9tXCIgcm9sZT1cInByZXNlbnRhdGlvblwiPjwvaT5EZWxldGluZyB1c2VyPC9hPjwvbGk+PGxpIHJvbGU9XCJ0cmVlaXRlbVwiIGFyaWEtc2VsZWN0ZWQ9XCJ0cnVlXCIgYXJpYS1sZXZlbD1cIjRcIiBhcmlhLWxhYmVsbGVkYnk9XCJQYWdlcy5BZG1pbmlzdHJhdGlvbi5Vc2Vycy5FZGl0X2FuY2hvclwiIGlkPVwiUGFnZXMuQWRtaW5pc3RyYXRpb24uVXNlcnMuRWRpdFwiIGNsYXNzPVwianN0cmVlLW5vZGUgIGpzdHJlZS1sZWFmXCI+PGkgY2xhc3M9XCJqc3RyZWUtaWNvbiBqc3RyZWUtb2NsXCIgcm9sZT1cInByZXNlbnRhdGlvblwiPjwvaT48YSBjbGFzcz1cImpzdHJlZS1hbmNob3IgIGpzdHJlZS1jbGlja2VkXCIgaHJlZj1cIiNcIiB0YWJpbmRleD1cIi0xXCIgaWQ9XCJQYWdlcy5BZG1pbmlzdHJhdGlvbi5Vc2Vycy5FZGl0X2FuY2hvclwiPjxpIGNsYXNzPVwianN0cmVlLWljb24ganN0cmVlLWNoZWNrYm94XCIgcm9sZT1cInByZXNlbnRhdGlvblwiPjwvaT48aSBjbGFzcz1cImpzdHJlZS1pY29uIGpzdHJlZS10aGVtZWljb24gZmEgZmEtZm9sZGVyIHRyZWUtaXRlbS1pY29uLWNvbG9yIGljb24tbGcganN0cmVlLXRoZW1laWNvbi1jdXN0b21cIiByb2xlPVwicHJlc2VudGF0aW9uXCI+PC9pPkVkaXRpbmcgdXNlcjwvYT48L2xpPjxsaSByb2xlPVwidHJlZWl0ZW1cIiBhcmlhLXNlbGVjdGVkPVwidHJ1ZVwiIGFyaWEtbGV2ZWw9XCI0XCIgYXJpYS1sYWJlbGxlZGJ5PVwiUGFnZXMuQWRtaW5pc3RyYXRpb24uVXNlcnMuSW1wZXJzb25hdGlvbl9hbmNob3JcIiBpZD1cIlBhZ2VzLkFkbWluaXN0cmF0aW9uLlVzZXJzLkltcGVyc29uYXRpb25cIiBjbGFzcz1cImpzdHJlZS1ub2RlICBqc3RyZWUtbGVhZiBqc3RyZWUtbGFzdFwiPjxpIGNsYXNzPVwianN0cmVlLWljb24ganN0cmVlLW9jbFwiIHJvbGU9XCJwcmVzZW50YXRpb25cIj48L2k+PGEgY2xhc3M9XCJqc3RyZWUtYW5jaG9yICBqc3RyZWUtY2xpY2tlZFwiIGhyZWY9XCIjXCIgdGFiaW5kZXg9XCItMVwiIGlkPVwiUGFnZXMuQWRtaW5pc3RyYXRpb24uVXNlcnMuSW1wZXJzb25hdGlvbl9hbmNob3JcIj48aSBjbGFzcz1cImpzdHJlZS1pY29uIGpzdHJlZS1jaGVja2JveFwiIHJvbGU9XCJwcmVzZW50YXRpb25cIj48L2k+PGkgY2xhc3M9XCJqc3RyZWUtaWNvbiBqc3RyZWUtdGhlbWVpY29uIGZhIGZhLWZvbGRlciB0cmVlLWl0ZW0taWNvbi1jb2xvciBpY29uLWxnIGpzdHJlZS10aGVtZWljb24tY3VzdG9tXCIgcm9sZT1cInByZXNlbnRhdGlvblwiPjwvaT5Mb2dpbiBmb3IgdXNlcnM8L2E+PC9saT48L3VsPjwvbGk+PC91bD48L2xpPjxsaSByb2xlPVwidHJlZWl0ZW1cIiBhcmlhLXNlbGVjdGVkPVwidHJ1ZVwiIGFyaWEtbGV2ZWw9XCIyXCIgYXJpYS1sYWJlbGxlZGJ5PVwiUGFnZXMuVGVuYW50LkRhc2hib2FyZF9hbmNob3JcIiBpZD1cIlBhZ2VzLlRlbmFudC5EYXNoYm9hcmRcIiBjbGFzcz1cImpzdHJlZS1ub2RlICBqc3RyZWUtbGVhZiBqc3RyZWUtbGFzdFwiPjxpIGNsYXNzPVwianN0cmVlLWljb24ganN0cmVlLW9jbFwiIHJvbGU9XCJwcmVzZW50YXRpb25cIj48L2k+PGEgY2xhc3M9XCJqc3RyZWUtYW5jaG9yICBqc3RyZWUtY2xpY2tlZFwiIGhyZWY9XCIjXCIgdGFiaW5kZXg9XCItMVwiIGlkPVwiUGFnZXMuVGVuYW50LkRhc2hib2FyZF9hbmNob3JcIj48aSBjbGFzcz1cImpzdHJlZS1pY29uIGpzdHJlZS1jaGVja2JveFwiIHJvbGU9XCJwcmVzZW50YXRpb25cIj48L2k+PGkgY2xhc3M9XCJqc3RyZWUtaWNvbiBqc3RyZWUtdGhlbWVpY29uIGZhIGZhLWZvbGRlciB0cmVlLWl0ZW0taWNvbi1jb2xvciBpY29uLWxnIGpzdHJlZS10aGVtZWljb24tY3VzdG9tXCIgcm9sZT1cInByZXNlbnRhdGlvblwiPjwvaT5EYXNoYm9hcmQ8L2E+PC9saT48L3VsPjwvbGk+PC91bD48L2Rpdj48L3Blcm1pc3Npb24tdHJlZT5cbiAgICAgICAgICAgICAgICA8L2Rpdj48IS0tIGVuZCBuZ1JlcGVhdDogdGFiIGluIHRhYnNldC50YWJzIC0tPlxuICA8L2Rpdj5cbjwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICA8L2Zvcm0+XG48L2Rpdj5gXG5jbGFzcyBUcmFkZURldGFpbCB7XG4gICAgY29uc3RydWN0b3IoZGF0YSkge1xuICAgICAgICBsZXQgJGRpYWxvZyA9ICQoaHRtbCkuZGlhbG9nKHtcbiAgICAgICAgICAgIG1vZGFsOiB0cnVlLFxuICAgICAgICAgICAgLy8gaGVpZ2h0OiA4MDAsXG4gICAgICAgICAgICB3aWR0aDogMTAyNCxcbiAgICAgICAgICAgIGNyZWF0ZTogZnVuY3Rpb24oZSwgdWkpIHtcbiAgICAgICAgICAgICAgICBsZXQgZGlhbG9nID0gJCh0aGlzKS5jbG9zZXN0KCcudWktZGlhbG9nJylcbiAgICAgICAgICAgICAgICBkaWFsb2cuZmluZCgnLnVpLWRpYWxvZy10aXRsZWJhcicpLnJlbW92ZSgpXG4gICAgICAgICAgICAgICAgZGlhbG9nLmZpbmQoJy51aS1kaWFsb2ctYnV0dG9ucGFuZScpLnJlbW92ZSgpXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgb3BlbjogZnVuY3Rpb24oZSwgdWkpIHtcbiAgICAgICAgICAgICAgICAkKCcudWktd2lkZ2V0LW92ZXJsYXknKS5iaW5kKCdjbGljaycsIGUgPT4gJGRpYWxvZy5kaWFsb2coJ2Nsb3NlJykpXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY2xvc2U6IGZ1bmN0aW9uKGUsIHVpKSB7XG4gICAgICAgICAgICAgICAgJGRpYWxvZy5kaWFsb2coJ2Nsb3NlJylcbiAgICAgICAgICAgICAgICAkZGlhbG9nLnJlbW92ZSgpXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgfVxufVxuIl19
