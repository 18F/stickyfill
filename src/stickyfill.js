(function(doc, win) {
    
    var watchArray = [],
        scroll = {
            top: 0,
            left: 0
        },
        initialized = false,
        docElem = doc.documentElement,
        noop = function() {};

    //test getComputedStyle
    if (!window.getComputedStyle) {
        win.Stickyfill = noop;
        return;
    }

    //test for native support
    var prefixes = ['', '-webkit-', '-moz-', '-ms-'],
        block = document.createElement('div');

    for (var i = prefixes.length - 1; i >= 0; i--) {
        try {
            block.style.position = prefixes[i] + 'sticky';
        }
        catch(e) {}
        if (block.style.position != '') {
            win.Stickyfill = noop;
            return;
        }
    }

    function updateScrollPos() {
        var queuReinit,
            currentScroll = {
            top: docElem.scrollTop || document.body.scrollTop,
            left: docElem.scrollLeft || document.body.scrollLeft
        }

        if (currentScroll.left != scroll.left) {
            scroll = currentScroll;
            reinit();
        }
        else {
            scroll = currentScroll;
            //window.requestAnimationFrmae? requestAnimationFrmae(recalcPos): recalcPos();
            recalcPos();
        }
    }

    function recalcPos() {
        for (var i = watchArray.length - 1; i >= 0; i--) {
            var currentMode = (scroll.top <= watchArray[i].limit.start || isNaN(parseFloat(watchArray[i].computed.top))? 0: scroll.top >= watchArray[i].limit.end? 2: 1);

            if (watchArray[i].mode != currentMode) {
                switchElementMode(watchArray[i], currentMode);
            }
        };
    }

    function switchElementMode(el, mode) {
        switch (mode) {
            case 0:
                if (el.clone) {
                    el.clone.parentNode.removeChild(el.clone);
                    el.clone = undefined;
                }
                el.node.style.position = '';
                el.node.style.width = el.css.width;
                el.node.style.top = el.css.top;
                el.node.style.bottom = el.css.bottom;
                el.node.style.left = el.css.left;
                el.node.style.marginTop = el.css.marginTop;
                el.node.style.marginBottom = el.css.marginBottom;
                break;
            case 1:
                if (!el.clone) {
                    el.clone = clone(el);
                    el.node.parentNode.insertBefore(el.clone, el.node);
                }
                el.node.style.position = 'fixed';
                el.node.style.left = el.box.left + 'px';
                el.node.style.top = el.computed.top;
                el.node.style.bottom = 'auto';
                el.node.style.width = el.width + 'px';
                el.node.style.marginTop = 0;
                break;
            case 2:
                if (!el.clone) {
                    el.clone = clone(el);
                    el.node.parentNode.insertBefore(el.clone, el.node);
                }
                el.node.style.position = 'absolute';
                el.node.style.left = 'auto';
                el.node.style.top = 'auto';
                el.node.style.bottom = 0;
                el.node.style.width = el.width + 'px';
                el.node.style.marginBottom = 0;
                break;
        }

        el.mode = mode;
    }

    function getElementParams(node) {
        if (!node.parentNode) return;

        var parent = node.offsetParent,
            nodeOffset = getElementOffset(node),
            parentOffset = getElementOffset(parent),
            elTop = parseFloat(getElementStyleProp(node, 'top')) || 0;

        return {
            node: node,
            leftLimit: nodeOffset.doc.left,
            box: nodeOffset.win,
            limit: {
                start: nodeOffset.doc.top - elTop,
                end: parentOffset.doc.top + parent.clientHeight - node.offsetHeight - elTop + 1
            },
            css: {
                top: node.style.top,
                bottom: node.style.bottom,
                left: node.style.left,
                right: node.style.right,
                width: node.style.width,
                marginTop: node.style.marginTop,
                marginBottom: node.style.marginBottom
            },
            computed: {
                top: getElementStyleProp(node, 'top'),
                marginTop: getElementStyleProp(node, 'marginTop'),
                marginBottom: getElementStyleProp(node, 'marginBottom'),
            },
            width: node.offsetWidth,
            height: node.offsetHeight,
            mode: 0,
            clone: undefined
        }
    }

    function getElementStyleProp(node, prop) {
        var absProp = ['top', 'bottom', 'left', 'right'].indexOf(prop) !== -1,
            result;

        win.opera && absProp && (node.style.position = 'absolute');
        result = getComputedStyle(node)[prop];
        win.opera && absProp && (node.style.position = '');

        return result;
    }

    function getElementOffset(node) {
        var client = {
                top: document.documentElement.clientTop || document.body.clientTop || 0,
                left: document.documentElement.clientLeft || document.body.clientLeft || 0
            },
            scroll = {
                top: win.pageYOffset || docElem.scrollTop,
                left: win.pageXOffset || docElem.scrollLeft
            },
            box = node.getBoundingClientRect();

            return {
                doc: {
                    left: box.left + scroll.left - client.left,
                    top: box.top + scroll.top - client.top
                },
                win: box
            };
    }

    function clone(el) {
        var clone = document.createElement('div');

        clone.style.height = el.height + 'px';
        clone.style.marginTop = el.computed.marginTop;
        clone.style.marginBottom = el.computed.marginBottom;

        return clone;
    }

    function recalcAllParams() {
        for (var i = watchArray.length - 1; i >= 0; i--) {
            switchElementMode(watchArray[i], 0);
            watchArray[i] = getElementParams(watchArray[i].node);
        };
    }

    function reinit() {
        recalcAllParams();
        updateScrollPos();
    }

    function init() {
        updateScrollPos();
        win.addEventListener('scroll', updateScrollPos);

        //watch for width changes
        win.addEventListener('resize', reinit);
        win.addEventListener('orientationchange', reinit);
    }

    win.Stickyfill = function(node) {
        watchArray.push(getElementParams(node));
        if (!initialized) init();

        return {
            elements: watchArray,
            reinit: reinit
        }
    }

})(document, window);