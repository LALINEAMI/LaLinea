declare function qrcode(type: number, correction: "M"): { addData(value: string): void; make(): void; createSvgTag(options: {cellSize: number; margin: number; scalable: boolean}): string };
export = qrcode;
