/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Plotly = require('../../plotly');
var Plots = require('../../plots/plots');
var Axes = require('../../plots/cartesian/axes');
var Lib = require('../../lib');
var downloadImage = require('../../snapshot/download');
var Icons = require('../../../build/ploticon');


var modeBarButtons = module.exports = {};

/**
 * ModeBar buttons configuration
 *
 * @param {string} name
 *      name / id of the buttons (for tracking)
 * @param {string} title
 *      text that appears while hovering over the button,
 *      enter null, false or '' for no hover text
 * @param {string} icon
 *      svg icon object associated with the button
 *      can be linked to Plotly.Icons to use the default plotly icons
 * @param {string} [gravity]
 *      icon positioning
 * @param {function} click
 *      click handler associated with the button, a function of
 *      'gd' (the main graph object) and
 *      'ev' (the event object)
 * @param {string} [attr]
 *      attribute associated with button,
 *      use this with 'val' to keep track of the state
 * @param {*} [val]
 *      initial 'attr' value, can be a function of gd
 * @param {boolean} [toggle]
 *      is the button a toggle button?
 */

modeBarButtons.toImage = {
    name: 'toImage',
    title: _lang.print_png,
    icon: Icons.camera,
    click: function(gd) {
        var format = 'png';

        Lib.notifier(_lang.taking_snapshot, 'long');

        if(Lib.isIE()) {
            Lib.notifier(_lang.png_impossible, 'long');
            format = 'svg';
        }

        downloadImage(gd, {'format': format})
          .then(function(filename) {
                    Lib.notifier(_lang.snapshot);
          })
          .catch(function() {
                    Lib.notifier(_lang.snapshot_error, 'long');
          });
    }
};

modeBarButtons.sendDataToCloud = {
    name: 'sendDataToCloud',
    title: 'Save and edit plot in cloud',
    icon: Icons.disk,
    click: function(gd) {
        //Plotly.Plots.sendDataToCloud(gd);
    }
};

modeBarButtons.zoom2d = {
    name: 'zoom2d',
    title: _lang.zoom,
    attr: 'dragmode',
    val: 'zoom',
    icon: Icons.zoombox,
    click: handleCartesian
};

modeBarButtons.pan2d = {
    name: 'pan2d',
    title: _lang.pan,
    attr: 'dragmode',
    val: 'pan',
    icon: Icons.pan,
    click: handleCartesian
};

modeBarButtons.select2d = {
    name: 'select2d',
    title: _lang.box_selected,
    attr: 'dragmode',
    val: 'select',
    icon: Icons.selectbox,
    click: handleCartesian
};

modeBarButtons.lasso2d = {
    name: 'lasso2d',
    title: _lang.lasso_select,
    attr: 'dragmode',
    val: 'lasso',
    icon: Icons.lasso,
    click: handleCartesian
};

modeBarButtons.zoomIn2d = {
    name: 'zoomIn2d',
    title: _lang.zoom_in,
    attr: 'zoom',
    val: 'in',
    icon: Icons.zoom_plus,
    click: handleCartesian
};

modeBarButtons.zoomOut2d = {
    name: 'zoomOut2d',
    title: _lang.zoom_out,
    attr: 'zoom',
    val: 'out',
    icon: Icons.zoom_minus,
    click: handleCartesian
};

modeBarButtons.autoScale2d = {
    name: 'autoScale2d',
    title: _lang.autoscale,
    attr: 'zoom',
    val: 'auto',
    icon: Icons.autoscale,
    click: handleCartesian
};

modeBarButtons.resetScale2d = {
    name: 'resetScale2d',
    title: _lang.reset_axes,
    attr: 'zoom',
    val: 'reset',
    icon: Icons.home,
    click: handleCartesian
};

modeBarButtons.hoverClosestCartesian = {
    name: 'hoverClosestCartesian',
    title: _lang.show_closest_data_on_hover,
    attr: 'hovermode',
    val: 'closest',
    icon: Icons.tooltip_basic,
    gravity: 'ne',
    click: handleCartesian
};

modeBarButtons.hoverCompareCartesian = {
    name: 'hoverCompareCartesian',
    title: _lang.compare_data_on_hover,
    attr: 'hovermode',
    val: function(gd) {
        return gd._fullLayout._isHoriz ? 'y' : 'x';
    },
    icon: Icons.tooltip_compare,
    gravity: 'ne',
    click: handleCartesian
};

function handleCartesian(gd, ev) {
    var button = ev.currentTarget,
        astr = button.getAttribute('data-attr'),
        val = button.getAttribute('data-val') || true,
        fullLayout = gd._fullLayout,
        aobj = {},
        axList = Axes.list(gd, null, true),
        ax,
        allEnabled = 'on',
        i;

    if(astr === 'zoom') {
        var mag = (val === 'in') ? 0.5 : 2,
            r0 = (1 + mag) / 2,
            r1 = (1 - mag) / 2;

        var axName;

        for(i = 0; i < axList.length; i++) {
            ax = axList[i];

            if(!ax.fixedrange) {
                axName = ax._name;
                if(val === 'auto') aobj[axName + '.autorange'] = true;
                else if(val === 'reset') {
                    if(ax._rangeInitial === undefined) {
                        aobj[axName + '.autorange'] = true;
                    }
                    else {
                        var rangeInitial = ax._rangeInitial.slice();
                        aobj[axName + '.range[0]'] = rangeInitial[0];
                        aobj[axName + '.range[1]'] = rangeInitial[1];
                    }
                    if(ax._showSpikeInitial !== undefined) {
                        aobj[axName + '.showspikes'] = ax._showSpikeInitial;
                        if(allEnabled === 'on' && !ax._showSpikeInitial) {
                            allEnabled = 'off';
                        }
                    }
                }
                else {
                    var rangeNow = [
                        ax.r2l(ax.range[0]),
                        ax.r2l(ax.range[1]),
                    ];

                    var rangeNew = [
                        r0 * rangeNow[0] + r1 * rangeNow[1],
                        r0 * rangeNow[1] + r1 * rangeNow[0]
                    ];

                    aobj[axName + '.range[0]'] = ax.l2r(rangeNew[0]);
                    aobj[axName + '.range[1]'] = ax.l2r(rangeNew[1]);
                }
            }
        }
        fullLayout._cartesianSpikesEnabled = allEnabled;
    }
    else {
        // if ALL traces have orientation 'h', 'hovermode': 'x' otherwise: 'y'
        if(astr === 'hovermode' && (val === 'x' || val === 'y')) {
            val = fullLayout._isHoriz ? 'y' : 'x';
            button.setAttribute('data-val', val);
            if(val !== 'closest') {
                fullLayout._cartesianSpikesEnabled = 'off';
            }
        } else if(astr === 'hovermode' && val === 'closest') {
            for(i = 0; i < axList.length; i++) {
                ax = axList[i];
                if(allEnabled === 'on' && !ax.showspikes) {
                    allEnabled = 'off';
                }
            }
            fullLayout._cartesianSpikesEnabled = allEnabled;
        }

        aobj[astr] = val;
    }

    Plotly.relayout(gd, aobj);
}

modeBarButtons.zoom3d = {
    name: 'zoom3d',
    title: 'Zoom',
    attr: 'scene.dragmode',
    val: 'zoom',
    icon: Icons.zoombox,
    click: handleDrag3d
};

modeBarButtons.pan3d = {
    name: 'pan3d',
    title: 'Pan',
    attr: 'scene.dragmode',
    val: 'pan',
    icon: Icons.pan,
    click: handleDrag3d
};

modeBarButtons.orbitRotation = {
    name: 'orbitRotation',
    title: 'orbital rotation',
    attr: 'scene.dragmode',
    val: 'orbit',
    icon: Icons['3d_rotate'],
    click: handleDrag3d
};

modeBarButtons.tableRotation = {
    name: 'tableRotation',
    title: 'turntable rotation',
    attr: 'scene.dragmode',
    val: 'turntable',
    icon: Icons['z-axis'],
    click: handleDrag3d
};

function handleDrag3d(gd, ev) {
    var button = ev.currentTarget,
        attr = button.getAttribute('data-attr'),
        val = button.getAttribute('data-val') || true,
        fullLayout = gd._fullLayout,
        sceneIds = Plots.getSubplotIds(fullLayout, 'gl3d'),
        layoutUpdate = {};

    var parts = attr.split('.');

    for(var i = 0; i < sceneIds.length; i++) {
        layoutUpdate[sceneIds[i] + '.' + parts[1]] = val;
    }

    Plotly.relayout(gd, layoutUpdate);
}

modeBarButtons.resetCameraDefault3d = {
    name: 'resetCameraDefault3d',
    title: 'Reset camera to default',
    attr: 'resetDefault',
    icon: Icons.home,
    click: handleCamera3d
};

modeBarButtons.resetCameraLastSave3d = {
    name: 'resetCameraLastSave3d',
    title: 'Reset camera to last save',
    attr: 'resetLastSave',
    icon: Icons.movie,
    click: handleCamera3d
};

function handleCamera3d(gd, ev) {
    var button = ev.currentTarget,
        attr = button.getAttribute('data-attr'),
        fullLayout = gd._fullLayout,
        sceneIds = Plots.getSubplotIds(fullLayout, 'gl3d'),
        aobj = {};

    for(var i = 0; i < sceneIds.length; i++) {
        var sceneId = sceneIds[i],
            key = sceneId + '.camera',
            scene = fullLayout[sceneId]._scene;

        if(attr === 'resetDefault') {
            aobj[key] = null;
        }
        else if(attr === 'resetLastSave') {
            aobj[key] = Lib.extendDeep({}, scene.cameraInitial);
        }
    }

    Plotly.relayout(gd, aobj);
}

modeBarButtons.hoverClosest3d = {
    name: 'hoverClosest3d',
    title: 'Toggle show closest data on hover',
    attr: 'hovermode',
    val: null,
    toggle: true,
    icon: Icons.tooltip_basic,
    gravity: 'ne',
    click: handleHover3d
};

function handleHover3d(gd, ev) {
    var button = ev.currentTarget,
        val = button._previousVal || false,
        layout = gd.layout,
        fullLayout = gd._fullLayout,
        sceneIds = Plots.getSubplotIds(fullLayout, 'gl3d');

    var axes = ['xaxis', 'yaxis', 'zaxis'],
        spikeAttrs = ['showspikes', 'spikesides', 'spikethickness', 'spikecolor'];

    // initialize 'current spike' object to be stored in the DOM
    var currentSpikes = {},
        axisSpikes = {},
        layoutUpdate = {};

    if(val) {
        layoutUpdate = Lib.extendDeep(layout, val);
        button._previousVal = null;
    }
    else {
        layoutUpdate = {
            'allaxes.showspikes': false
        };

        for(var i = 0; i < sceneIds.length; i++) {
            var sceneId = sceneIds[i],
                sceneLayout = fullLayout[sceneId],
                sceneSpikes = currentSpikes[sceneId] = {};

            sceneSpikes.hovermode = sceneLayout.hovermode;
            layoutUpdate[sceneId + '.hovermode'] = false;

            // copy all the current spike attrs
            for(var j = 0; j < 3; j++) {
                var axis = axes[j];
                axisSpikes = sceneSpikes[axis] = {};

                for(var k = 0; k < spikeAttrs.length; k++) {
                    var spikeAttr = spikeAttrs[k];
                    axisSpikes[spikeAttr] = sceneLayout[axis][spikeAttr];
                }
            }
        }

        button._previousVal = Lib.extendDeep({}, currentSpikes);
    }

    Plotly.relayout(gd, layoutUpdate);
}

modeBarButtons.zoomInGeo = {
    name: 'zoomInGeo',
    title: 'Zoom in',
    attr: 'zoom',
    val: 'in',
    icon: Icons.zoom_plus,
    click: handleGeo
};

modeBarButtons.zoomOutGeo = {
    name: 'zoomOutGeo',
    title: 'Zoom out',
    attr: 'zoom',
    val: 'out',
    icon: Icons.zoom_minus,
    click: handleGeo
};

modeBarButtons.resetGeo = {
    name: 'resetGeo',
    title: 'Reset',
    attr: 'reset',
    val: null,
    icon: Icons.autoscale,
    click: handleGeo
};

modeBarButtons.hoverClosestGeo = {
    name: 'hoverClosestGeo',
    title: 'Toggle show closest data on hover',
    attr: 'hovermode',
    val: null,
    toggle: true,
    icon: Icons.tooltip_basic,
    gravity: 'ne',
    click: toggleHover
};

function handleGeo(gd, ev) {
    var button = ev.currentTarget,
        attr = button.getAttribute('data-attr'),
        val = button.getAttribute('data-val') || true,
        fullLayout = gd._fullLayout,
        geoIds = Plots.getSubplotIds(fullLayout, 'geo');

    for(var i = 0; i < geoIds.length; i++) {
        var geo = fullLayout[geoIds[i]]._subplot;

        if(attr === 'zoom') {
            var scale = geo.projection.scale();
            var newScale = (val === 'in') ? 2 * scale : 0.5 * scale;
            geo.projection.scale(newScale);
            geo.zoom.scale(newScale);
            geo.render();
        }
        else if(attr === 'reset') geo.zoomReset();
    }
}

modeBarButtons.hoverClosestGl2d = {
    name: 'hoverClosestGl2d',
    title: 'Toggle show closest data on hover',
    attr: 'hovermode',
    val: null,
    toggle: true,
    icon: Icons.tooltip_basic,
    gravity: 'ne',
    click: toggleHover
};

modeBarButtons.hoverClosestPie = {
    name: 'hoverClosestPie',
    title: 'Toggle show closest data on hover',
    attr: 'hovermode',
    val: 'closest',
    icon: Icons.tooltip_basic,
    gravity: 'ne',
    click: toggleHover
};

function toggleHover(gd) {
    var fullLayout = gd._fullLayout;

    var onHoverVal;
    if(fullLayout._has('cartesian')) {
        onHoverVal = fullLayout._isHoriz ? 'y' : 'x';
    }
    else onHoverVal = 'closest';

    var newHover = gd._fullLayout.hovermode ? false : onHoverVal;

    Plotly.relayout(gd, 'hovermode', newHover);
}

// buttons when more then one plot types are present

modeBarButtons.toggleHover = {
    name: 'toggleHover',
    title: 'Toggle show closest data on hover',
    attr: 'hovermode',
    val: null,
    toggle: true,
    icon: Icons.tooltip_basic,
    gravity: 'ne',
    click: function(gd, ev) {
        toggleHover(gd);

        // the 3d hovermode update must come
        // last so that layout.hovermode update does not
        // override scene?.hovermode?.layout.
        handleHover3d(gd, ev);
    }
};

modeBarButtons.resetViews = {
    name: 'resetViews',
    title: 'Reset views',
    icon: Icons.home,
    click: function(gd, ev) {
        var button = ev.currentTarget;

        button.setAttribute('data-attr', 'zoom');
        button.setAttribute('data-val', 'reset');
        handleCartesian(gd, ev);

        button.setAttribute('data-attr', 'resetLastSave');
        handleCamera3d(gd, ev);

        // N.B handleCamera3d also triggers a replot for
        // geo subplots.
    }
};

modeBarButtons.toggleSpikelines = {
    name: 'toggleSpikelines',
    title: 'Toggle Spike Lines',
    icon: Icons.spikeline,
    attr: '_cartesianSpikesEnabled',
    val: 'on',
    click: function(gd) {
        var fullLayout = gd._fullLayout;

        fullLayout._cartesianSpikesEnabled = fullLayout.hovermode === 'closest' ?
            (fullLayout._cartesianSpikesEnabled === 'on' ? 'off' : 'on') : 'on';

        var aobj = setSpikelineVisibility(gd);

        aobj.hovermode = 'closest';
        Plotly.relayout(gd, aobj);
    }
};

function setSpikelineVisibility(gd) {
    var fullLayout = gd._fullLayout,
        axList = Axes.list(gd, null, true),
        ax,
        axName,
        aobj = {};

    for(var i = 0; i < axList.length; i++) {
        ax = axList[i];
        axName = ax._name;
        aobj[axName + '.showspikes'] = fullLayout._cartesianSpikesEnabled === 'on' ? true : false;
    }

    return aobj;
}
