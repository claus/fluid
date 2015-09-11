export default class Loader {

    static load (resources) {
        return Promise.all(resources.map(resource => {
            if (/\.(jpe?g|gif|png)$/.test(resource)) {
                return this.loadImage(resource);
            } else if (/\.(og(g|a)|mp3)$/.test(resource)) {
                return this.loadAudio(resource);
            } else if (/\.json$/.test(resource)) {
                return this.loadJSON(resource);
            } else if (/\.(bin|raw)/.test(resource)) {
                return this.loadBin(resource);
            } else {
                return this.loadString(resource);
            }
        }));
    }

    static loadImage (src) {
        /*
        var self = this;
        var img = document.createElement('img');
        img.onload = function() {
            success(src, img);
        };
        img.onerror = function (e) {
            error(src, e);
        };
        img.src = this.root + src;
        */
    }

    static loadJSON (src) {
        /*
        var xhr = new XMLHttpRequest(),
            self = this;
        xhr.open('GET', src, true);
        xhr.onload = function() {
            try {
                var data = JSON.parse(this.response);
                success(src, data);
            }
            catch(ex){
                error(src, ex);
            }
        };
        xhr.onerror = function(error) { error(src, error); };
        xhr.send();
        */
    }

    static loadBin (src) {
        /*
        var xhr = new XMLHttpRequest(),
            self = this;
        xhr.open('GET', src, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function(data) { success(src, this.response); };
        xhr.onerror = function(error) { error(src, error); };
        xhr.send();
        */
    }

    static loadString (src) {
        return new Promise((resolve, reject) => {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', src, true);
            xhr.onload = () => { resolve({ src: src, response: xhr.response }); }
            xhr.onerror = reject;
            xhr.send();
        })
    }

};
