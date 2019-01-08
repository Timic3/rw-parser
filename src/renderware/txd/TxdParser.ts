import fs = require('fs');
import { RwFile, RwTextureDictionary } from './RwFile';
import { RwSections } from '../RwSections';

export class TxdParser {
    path: string = '';

    constructor(path: string) {
        this.path = path;
    }

    parse() {
        const buffer = fs.readFileSync(this.path);
        const txdStream = new RwFile(buffer);

        return {
            textureDictionary: txdStream.readTextureDictionary()
        };
    }
}
