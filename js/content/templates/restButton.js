const restButton = {
    
    createRestButton() {
        const $restButton = document.createElement('button');
        $restButton.type = 'button';
        $restButton.classList.add('btn', 'btn-primary');
        $restButton.style.cssText = 'height: 28px; display: flex; align-items: center; justify-content: center; gap: 5px;';
        
        $restButton.appendChild(this._createRestImage());
        $restButton.appendChild(document.createTextNode(' Ajouter les repos au calendrier'));

        return $restButton;
    },

    _createRestImage() {
        const $restImage = document.createElement('i');
        const $svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        $svgElement.setAttribute('height', '28');
        $svgElement.setAttribute('viewBox', '0 0 28 28');
        $svgElement.setAttribute('fill', 'currentColor');
        $svgElement.classList.add('my-auto');
    
        const $pathElement1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        $pathElement1.setAttribute('d', 'M7.293 1.5a1 1 0 0 1 1.414 0L11 3.793V2.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v3.293l2.354 2.353a.5.5 0 0 1-.708.708L8 2.207l-5 5V13.5a.5.5 0 0 0 .5.5h4a.5.5 0 0 1 0 1h-4A1.5 1.5 0 0 1 2 13.5V8.207l-.646.647a.5.5 0 1 1-.708-.708z');
        const $pathElement2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        $pathElement2.setAttribute('d', 'M12.5 16a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7m1.679-4.493-1.335 2.226a.75.75 0 0 1-1.174.144l-.774-.773a.5.5 0 0 1 .708-.707l.547.547 1.17-1.951a.5.5 0 1 1 .858.514');
        $svgElement.appendChild($pathElement1);
        $svgElement.appendChild($pathElement2);

        return $svgElement;
    }
}