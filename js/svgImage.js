
class svgImage {
    width = 0;
    height = 0;
    #element = undefined;
    viewBox = undefined;
    editScale = 1;
    #panning = {
        active: false,
        startPoint: {x:0,y:0},
        moved: false
    };
    #zoomSpeed;
    constructor(el, { zoomSpeed }) {
        this.#zoomSpeed = zoomSpeed ?? 1;
        this.#element = el;
        this.setViewBox({ x: 0, y: 0, width: 1, height: 1 });
        this.addMouseInteraction(el);
    }
    get element() { return this.#element };
    get ratio() { return this.width / this.height; };
    get elementRatio() { return this.element.clientWidth / this.element.clientHeight; };
    get imageBoxFittingElement() {
        const box = { x:0, y:0, width: this.width, height: this.height };
        if (this.ratio > this.elementRatio) {
            box.height = this.width / this.elementRatio
        } else {
            box.width = this.height * this.elementRatio
        }
        return box;
    };
    get scale() {
        const wScale = this.viewBox.width / this.element.clientWidth;
        const hScale = this.viewBox.height / this.element.clientHeight;
        return Math.max(wScale, hScale);
    };
    get fitScale() {
        const wScale = this.width / this.element.clientWidth;
        const hScale = this.height / this.element.clientHeight;
        return Math.max(wScale, hScale) * 1.1;
    }
    zoomFit(options) {
        this.setViewBoxByScale(this.fitScale, undefined, undefined, options);
    };
    setDimensions(width, height, options = {}) {
        this.width = width;
        this.height = height;
        options.newDimensions = { x: 0, y: 0, width, height }
        this.setViewBoxByScale(this.fitScale, undefined, undefined, options)
        // this.zoomFit(options);
    }
    setViewBoxByScale(newScale, ratioX = 0.5, ratioY = 0.5, options) {
        const { clientWidth: svgWidth, clientHeight: svgHeight } = this.element
        const { x, y, width, height } = options?.newDimensions ?? this.viewBox;
        var newW    = svgWidth * newScale,
            newH    = svgHeight * newScale,
            newX    = x + (width - newW) * ratioX,
            newY    = y + (height - newH) * ratioY;
        const viewBox = { x:Math.round(newX), y:Math.round(newY), width:newW, height:newH };
        this.setViewBox(viewBox, options);
    };
    setViewBox(vb, options) {
        this.viewBox = vb
        const vbString = `${vb.x} ${vb.y} ${vb.width} ${vb.height}` // M4070,950C4070,1021.667,4070,1093.333,4070,1165C4070,1241.667,4070,1318.333,4070,1395C4070,1466.667,4070,1538.333,4070,1610
        if (options?.transition)
            d3.select(this.element)
                .transition(options?.transition)
                .attr('viewBox', vbString);
        else
            this.element.setAttribute('viewBox', vbString);
    };
    addMouseInteraction(el) {
        el.addEventListener("wheel", this.onwheel.bind(this));
        el.addEventListener("mousedown", this.onmousedown.bind(this));
        el.addEventListener("mousemove", this.onmousemove.bind(this));
        el.addEventListener("mouseup", this.onmouseup.bind(this));
        el.addEventListener("mouseleave", this.onmouseleave.bind(this));
    };
    addEventListener(type, listener) {
        this.element.addEventListener(type, e => {
            if (type == "click" && this.#panning.moved) {
                e.stopPropagation();
                return
            }
            listener.apply(this.element, arguments)
        })
    }
    onwheel(e) {
        // if(d3.active(d3.select(this.element))) return;
        e.preventDefault();
        
        const { clientWidth: svgWidth, clientHeight: svgHeight } = this.element;
        const { offsetX, offsetY } = e;
        const oldScale = this.scale

        const delta    = (e.wheelDelta) ? -e.wheelDelta : e.detail;
        const newScale = oldScale + (oldScale*delta/1200 * this.#zoomSpeed); //1200: intensity

        this.setViewBoxByScale(newScale, offsetX/svgWidth, offsetY/svgHeight)
    }
    onmousedown(e){
        this.#panning.active = true;
        this.#panning.startPoint = {x:e.x,y:e.y};   
        this.#panning.startViewBox = this.viewBox;
        this.#panning.moved = false;
        // console.log("start panning from ", this.#panning.startPoint)
    }
    onmousemove(e){
        this.panningUpdate(e);
    }
    onmouseup(e){
        this.panningUpdate(e);
        this.panningStop(e);
    }
    onmouseleave(e) {
        this.panningStop(e);
    }
    panningUpdate(e) {
        const {active, startPoint, startViewBox} = this.#panning;
        if (active){
            const dx = (startPoint.x - e.x) * this.scale;
            const dy = (startPoint.y - e.y) * this.scale;
            if (Math.abs(dx) > 0 || Math.abs(dy) > 0) { // threshold in pixels
                this.#panning.moved = true;
            }
            const movedViewBox = structuredClone(startViewBox);
            movedViewBox.x += dx;
            movedViewBox.y += dy;
            //  console.log({ from: startPoint, to: { x: e.x, y: e.y }, diff: {x: dx, y:dy}, movedViewBox, moved: this.#panning.moved})
            this.setViewBox(movedViewBox);
        }
    }
    panningStop(e) {
        this.#panning.active = false;
        // console.log("stop panning at ", e)
    }

    saveSvg(name) {
        this.#element.setAttribute("xmlns", "http://www.w3.org/2000/svg");
        const viewbox = this.#element.getAttribute('viewBox')
        this.zoomFit();
        var svgData = this.#element.outerHTML;
        // reset viewbox
        this.#element.setAttribute('viewBox', viewbox);
        var preface = '<?xml version="1.0" standalone="no"?>\r\n';
        var svgBlob = new Blob([preface, svgData], {type:"image/svg+xml;charset=utf-8"});
        var svgUrl = URL.createObjectURL(svgBlob);
        var downloadLink = document.createElement("a");
        downloadLink.href = svgUrl;
        downloadLink.download = name;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    }


}
export { svgImage };