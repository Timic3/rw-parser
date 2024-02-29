export class RwParseError extends Error {
    constructor(message?: string) {
        super(message);
    }
}

export class RwParseStructureNotFoundError extends RwParseError {
    constructor(structureName: string) {
        super(`Structure ${structureName} not found.`);
    }
}
